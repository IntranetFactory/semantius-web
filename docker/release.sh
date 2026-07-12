#!/usr/bin/env bash
# Cut a release: tag the current commit and push the tag. Pushing a `v*` tag
# triggers CI (.github/workflows/docker-publish.yml) to build the MULTI-ARCH
# image (linux/amd64 + linux/arm64) and push it to
# ghcr.io/intranetfactory/semantius-web (tags: X.Y.Z, X.Y, latest).
#
# This does NOT build or push any image locally — everything happens in CI.
#
# Usage:
#   docker/release.sh v0.1.0          # tag + push (asks for confirmation)
#   docker/release.sh v0.1.0 -y       # skip the confirmation prompt
set -euo pipefail
cd "$(dirname "$0")/.."   # repo root

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: docker/release.sh vX.Y.Z   (e.g. docker/release.sh v0.1.0)" >&2
  exit 1
fi

# CI triggers on `tags: v*` and docker/metadata-action expects semver, so require
# vX.Y.Z with an optional -prerelease suffix (e.g. v0.1.0, v1.2.3-rc.1).
if ! printf '%s' "$VERSION" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$'; then
  echo "Version must look like vX.Y.Z (got '$VERSION')" >&2
  exit 1
fi

# Refuse to release from a dirty tree — the tag should capture a known commit.
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean — commit or stash changes before releasing." >&2
  exit 1
fi

# The tag must not already exist locally or on origin.
if git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null; then
  echo "Tag $VERSION already exists locally." >&2
  exit 1
fi
if git ls-remote --exit-code --tags origin "$VERSION" >/dev/null 2>&1; then
  echo "Tag $VERSION already exists on origin." >&2
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse --short HEAD)
echo "Releasing $VERSION from $BRANCH @ $COMMIT"
echo "→ pushes a git tag that triggers CI to build & publish a PUBLIC image."

# Confirm before the outward-facing push (skip with -y; never hang if piped).
case "${2:-}" in
  -y|--yes) ;;
  *)
    if [ ! -t 0 ]; then
      echo "Refusing to release non-interactively without -y." >&2
      exit 1
    fi
    read -r -p "Continue? [y/N] " reply
    case "$reply" in
      y|Y|yes) ;;
      *) echo "Aborted."; exit 0 ;;
    esac
    ;;
esac

git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"

echo
echo "Pushed tag $VERSION → CI will build & publish:"
echo "  ghcr.io/intranetfactory/semantius-web:${VERSION#v}   (+ X.Y and latest)"
echo "Watch the run:  gh run watch   (or the repo's Actions tab)"
