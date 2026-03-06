#!/bin/sh
# scripts/install-hooks.sh
#
# One-time setup: wires .githooks/ into the local git config.
# Run once after cloning:  sh scripts/install-hooks.sh

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.githooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "Error: .githooks/ directory not found at $REPO_ROOT"
  exit 1
fi

git config core.hooksPath .githooks
chmod +x "$HOOKS_DIR/post-commit"

echo "✓ Git hooks installed from .githooks/"
echo "  post-commit → scripts/bump.ts will run on every commit"
