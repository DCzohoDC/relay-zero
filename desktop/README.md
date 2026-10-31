# Relay Zero for Linux

This folder contains a standalone desktop port of Relay Zero. It is a native
Python/SDL application, not a browser wrapper. The five-stage campaign, enemy
archetypes, weapon caches, squadmates, synthesized soundtrack, and Warden
finale are recreated with procedural graphics and audio; no web assets or
external game archive are required.

## Run

Install Python 3 and pygame 2, then run:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
./run.sh
```

Or launch with `python3 relay_zero.py` after installing pygame. On some Linux
distributions, Python packages are managed by the OS; if pip blocks a system
install, use a virtual environment:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
./run.sh
```

To add Relay Zero to your desktop application's menu, run
`./install-desktop.sh` after installing pygame. The launcher points to this
folder, so it remains usable when the project is moved.

## Controls

- **Keyboard:** WASD or arrow keys move; mouse aims; hold left mouse button or
  F to fire; E interact; Space dash; C take cover; Q cycle weapons; 1–4 select
  unlocked weapons; Esc pause.
- **Xbox-compatible controller:** left stick moves; right stick aims; A fires;
  B dashes; X takes cover; Y interacts; bumpers cycle unlocked weapons. If the
  controller has no right stick input, firing auto-aims at the nearest hostile.
- Walk over weapon caches to unlock weapons. Complete each objective, reach
  extraction, and hold the zone to advance. The Warden's attacks are
  telegraphed; damage its exposed core between attacks.

The window can be resized. Music and sound effects are synthesized locally;
the game remains playable if no audio device is available.
