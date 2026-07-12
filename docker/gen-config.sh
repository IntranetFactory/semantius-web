#!/bin/sh
# Generate the SPA's runtime config file (window.__ENV__) from the container
# environment. Runs at container start (via /docker-entrypoint.d) and is also
# runnable standalone on a host for inspection:  ./gen-config.sh /tmp/config.js
#
# Value precedence for each key:
#   real environment variable  >  $ENV_FILE (docker/.env) default  >
#   OIDC discovery (OAuth endpoints only)  >  built-in default
#
# The OAuth endpoint mapping mirrors apps/web/scripts/genconfig.js so the Docker
# path and the interactive generator stay consistent.
set -eu

OUT="${1:-/usr/share/nginx/html/config.js}"
ENV_FILE="${ENV_FILE:-/config/.env}"

# Keep this list in sync with apps/web/public/config.js.
CANONICAL_VARS="
VITE_API_BASE_URL
VITE_API_TYPE
VITE_SUPABASE_APIKEY
VITE_OAUTH_CLIENT_ID
VITE_OAUTH_AUTH_ENDPOINT
VITE_OAUTH_TOKEN_ENDPOINT
VITE_OAUTH_USERINFO_ENDPOINT
VITE_OAUTH_LOGOUT_ENDPOINT
VITE_OAUTH_LOGOUT_REDIRECT
VITE_OAUTH_REDIRECT_URI
VITE_OAUTH_SCOPE
VITE_OAUTH_AUDIENCE
VITE_CONTROL_PLANE_URL
VITE_CONTROL_PLANE_ORG
VITE_CUBE_API_URL
"

# 1. Load $ENV_FILE as DEFAULTS — only for keys not already set in the
#    environment, so a real env var (docker -e / compose env_file / k8s) wins.
if [ -f "$ENV_FILE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line=$(printf '%s' "$line" | tr -d '\r')          # tolerate CRLF files
    case "$line" in ''|\#*) continue ;; esac
    key=${line%%=*}
    val=${line#*=}
    key=$(printf '%s' "$key" | tr -d '[:space:]')
    case "$key" in ''|*[!A-Za-z0-9_]*) continue ;; esac  # identifiers only
    case "$val" in                                     # strip matching quotes
      \"*\") val=${val#\"}; val=${val%\"} ;;
      \'*\') val=${val#\'}; val=${val%\'} ;;
    esac
    if eval "[ -z \"\${$key+x}\" ]"; then export "$key=$val"; fi
  done < "$ENV_FILE"
fi

# 2. Expand OAuth endpoints from the OIDC discovery document when OIDC_CONFIG is
#    set and the endpoint is still empty (an explicit value always wins).
if [ -n "${OIDC_CONFIG:-}" ]; then
  if disc=$(curl -fsS "$OIDC_CONFIG"); then
    : "${VITE_OAUTH_AUTH_ENDPOINT:=$(printf '%s' "$disc" | jq -r '.authorization_endpoint // empty')}"
    : "${VITE_OAUTH_TOKEN_ENDPOINT:=$(printf '%s' "$disc" | jq -r '.token_endpoint // empty')}"
    : "${VITE_OAUTH_USERINFO_ENDPOINT:=$(printf '%s' "$disc" | jq -r '.userinfo_endpoint // empty')}"
    : "${VITE_OAUTH_LOGOUT_ENDPOINT:=$(printf '%s' "$disc" | jq -r '.end_session_endpoint // empty')}"
    if [ -z "${VITE_OAUTH_SCOPE:-}" ]; then
      VITE_OAUTH_SCOPE=$(printf '%s' "$disc" | jq -r '
        (.scopes_supported // []) as $s
        | if   ($s | index("openid")) then "openid profile email"
          elif ($s | length) > 0     then ($s | join(" "))
          else "openid profile email" end')
    fi
  else
    echo "[gen-config] WARNING: could not fetch OIDC_CONFIG=$OIDC_CONFIG — leaving OAuth endpoints as provided" >&2
  fi
fi

# 3. Emit config.js (a JS object literal; trailing comma is legal JS).
{
  echo "window.__ENV__ = {"
  for k in $CANONICAL_VARS; do
    v=$(eval "printf '%s' \"\${$k:-}\"")
    esc=$(printf '%s' "$v" | sed 's/\\/\\\\/g; s/"/\\"/g')   # JSON-escape \ and "
    printf '  "%s": "%s",\n' "$k" "$esc"
  done
  echo "};"
} > "$OUT"

echo "[gen-config] wrote $OUT" >&2
