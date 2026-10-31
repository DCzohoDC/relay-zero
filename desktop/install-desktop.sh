#!/bin/sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
applications="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
mkdir -p "$applications"
cat > "$applications/relay-zero.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Relay Zero
Comment=Five-level sci-fi action campaign
Exec="$APP_DIR/run.sh"
Path="$APP_DIR"
Icon=applications-games
Terminal=false
Categories=Game;ActionGame;
EOF
chmod 644 "$applications/relay-zero.desktop"
printf 'Installed launcher: %s/relay-zero.desktop\n' "$applications"
