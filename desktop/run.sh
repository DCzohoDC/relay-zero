#!/bin/sh
set -eu
cd "$(dirname "$0")"
PYTHON=python3
if [ -x .venv/bin/python ]; then
  PYTHON=.venv/bin/python
fi
if ! "$PYTHON" -c 'import pygame' >/dev/null 2>&1; then
  printf '%s\n' "pygame is required. Run: python3 -m venv .venv && .venv/bin/python -m pip install -r requirements.txt" >&2
  exit 1
fi
exec "$PYTHON" relay_zero.py "$@"
