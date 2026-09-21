#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"

docker build -t webtermux-debian:latest "$ROOT/backend/images/debian"
docker build -t webtermux-ubuntu:latest "$ROOT/backend/images/ubuntu"
docker build -t webtermux-arch:latest "$ROOT/backend/images/arch"

echo "WebTermux Linux images built:"
docker image ls 'webtermux-*'
