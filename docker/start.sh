#!/usr/bin/env bash
# Start the container in the background. Does NOT rebuild — it runs the existing
# semantius-web:local image (compose builds it only if it doesn't exist yet).
# After code changes, rebuild explicitly with docker/build.sh. Run from anywhere.
set -euo pipefail
cd "$(dirname "$0")/.."   # repo root (Docker build context)
docker compose -f docker/docker-compose.yml up -d "$@"
echo "semantius-web is running → http://localhost:${WEB_PORT:-7070}"
