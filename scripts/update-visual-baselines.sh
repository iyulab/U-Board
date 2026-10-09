#!/usr/bin/env bash
# Renders the reference pictures of packages/core/e2e/visual.spec.ts on Linux, as CI does, from any
# machine with Docker: the Playwright image of the version this workspace installs, a fresh copy of the
# repository (this machine's node_modules hold its own platform's binaries, so they are left behind), and
# the pictures copied back into e2e/visual.spec.ts-snapshots/. Review them before committing.
#
# Usage: scripts/update-visual-baselines.sh
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
version="$(cd "$repo" && node -p "require('./node_modules/@playwright/test/package.json').version")"
# The path Docker can mount: on Git Bash a Windows path (`pwd -W`), elsewhere the path itself.
host_repo="$(cd "$repo" && (pwd -W 2>/dev/null || pwd))"
image="mcr.microsoft.com/playwright:v${version}-noble"

# Git Bash would otherwise rewrite the container paths below into Windows paths.
export MSYS_NO_PATHCONV=1

# The pictures are handed back owned by the caller, not by the container's root.
docker run --rm -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" -v "$host_repo:/src" -w /work "$image" bash -euc '
  tar -C /src --exclude=.git --exclude=node_modules --exclude=dist --exclude=test-results -cf - . | tar -xf -
  npm ci --no-audit --no-fund
  cd packages/core
  CI=1 npx playwright test e2e/visual.spec.ts --update-snapshots=all
  # Replace the committed pictures only once new ones exist.
  test -d e2e/visual.spec.ts-snapshots
  chown -R "$HOST_UID:$HOST_GID" e2e/visual.spec.ts-snapshots
  rm -rf /src/packages/core/e2e/visual.spec.ts-snapshots
  cp -rp e2e/visual.spec.ts-snapshots /src/packages/core/e2e/
'
echo "Reference pictures updated in packages/core/e2e/visual.spec.ts-snapshots/"
