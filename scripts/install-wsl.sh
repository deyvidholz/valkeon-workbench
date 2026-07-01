#!/usr/bin/env bash
#
# Install Valkeon Workbench inside WSL Ubuntu (or any Debian/Ubuntu Linux).
#
#   curl -fsSL https://raw.githubusercontent.com/deyvidholz/valkeon-workbench/main/scripts/install-wsl.sh | bash
#
# It downloads the latest `.deb` from GitHub Releases, installs it (pulling
# Electron's runtime libraries), and installs the `valkeon` CLI wrapper so you
# can launch the app and open projects from the shell:
#
#   valkeon .          # open the current directory as a project
#
# Requires Windows 11 (or a recent Windows 10 with WSLg) for the GUI to display.
set -euo pipefail

REPO="${VALKEON_REPO:-deyvidholz/valkeon-workbench}"
# List endpoint (newest first) — unlike releases/latest it also surfaces
# prereleases. Neither shows *draft* releases, so a release must be published.
API="https://api.github.com/repos/${REPO}/releases?per_page=20"

echo "==> Checking prerequisites…"
if ! grep -qiE "(microsoft|wsl)" /proc/version 2>/dev/null; then
  echo "    (Not running under WSL — this script also works on plain Debian/Ubuntu.)"
fi
command -v curl >/dev/null || { echo "curl is required. Run: sudo apt-get install -y curl"; exit 1; }

echo "==> Finding the latest release .deb…"
# Don't let a 404/network hiccup abort via set -e; handle it explicitly below.
RELEASES_JSON="$(curl -fsSL "$API" 2>/dev/null || true)"
# `|| true` so a no-match grep (empty release list) doesn't abort under set -e
# + pipefail before we can print the helpful message below.
DEB_URL="$(printf '%s' "$RELEASES_JSON" | grep -oE 'https://[^"]+\.deb' | head -n1 || true)"
if [[ -z "$DEB_URL" ]]; then
  echo "No published release with a .deb asset was found for ${REPO}." >&2
  echo "GitHub *draft* releases aren't visible here — publish the release first:" >&2
  echo "  https://github.com/${REPO}/releases" >&2
  echo "(Set VALKEON_REPO=<owner>/<repo> if this fork lives elsewhere.)" >&2
  exit 1
fi
echo "    $DEB_URL"

TMP_DEB="$(mktemp --suffix=.deb)"
trap 'rm -f "$TMP_DEB"' EXIT
echo "==> Downloading…"
curl -fsSL "$DEB_URL" -o "$TMP_DEB"

echo "==> Installing (needs sudo; resolves Electron's runtime deps)…"
sudo apt-get update -y
sudo apt-get install -y "$TMP_DEB"

echo "==> Installing the 'valkeon' CLI wrapper…"
# Prefer the wrapper shipped with the app; fall back to a minimal inline one.
WRAPPER_SRC="/opt/Valkeon Workbench/resources/bin/valkeon"
if [[ -f "$WRAPPER_SRC" ]]; then
  sudo install -m 0755 "$WRAPPER_SRC" /usr/local/bin/valkeon
else
  sudo tee /usr/local/bin/valkeon >/dev/null <<'WRAP'
#!/usr/bin/env bash
set -euo pipefail
ARGS=()
grep -qiE "(microsoft|wsl)" /proc/version 2>/dev/null && ARGS+=(--no-sandbox)
if [[ $# -gt 0 && "${1:0:1}" != "-" ]]; then
  t="$1"; shift; ARGS+=("$(cd "$t" 2>/dev/null && pwd || echo "$t")")
fi
ARGS+=("$@")
nohup valkeon-workbench "${ARGS[@]}" </dev/null >/dev/null 2>&1 &
disown 2>/dev/null || true
WRAP
  sudo chmod 0755 /usr/local/bin/valkeon
fi

echo
echo "Done. Launch it with:"
echo "    valkeon          # open the workbench"
echo "    valkeon .        # open the current directory as a project"
