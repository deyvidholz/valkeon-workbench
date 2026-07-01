#!/usr/bin/env bash
#
# Install the `valkeon` CLI command on your PATH from this source checkout.
# Symlinks bin/valkeon into a bin directory (default /usr/local/bin).
#
#   ./scripts/link-cli.sh                 # → /usr/local/bin/valkeon (uses sudo if needed)
#   PREFIX="$HOME/.local/bin" ./scripts/link-cli.sh   # → no sudo, user-local
#
# The wrapper auto-detects an installed app; to point it at a specific build,
# export VALKEON_BIN (a .app on macOS, or the executable on Linux).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WRAPPER="$REPO_DIR/bin/valkeon"
PREFIX="${PREFIX:-/usr/local/bin}"
DEST="$PREFIX/valkeon"

[[ -f "$WRAPPER" ]] || { echo "Cannot find $WRAPPER" >&2; exit 1; }
chmod +x "$WRAPPER"
mkdir -p "$PREFIX" 2>/dev/null || sudo mkdir -p "$PREFIX"

echo "Linking $DEST -> $WRAPPER"
if ln -sfn "$WRAPPER" "$DEST" 2>/dev/null; then :; else sudo ln -sfn "$WRAPPER" "$DEST"; fi

echo "Done. Make sure $PREFIX is on your PATH, then run:  valkeon ."
