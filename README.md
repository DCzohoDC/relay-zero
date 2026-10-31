# Relay Zero

Relay Zero is an original, lightweight sci-fi action game. Its first operation
is a five-level sci-fi campaign across the Dust Sea, Cryo Array, Canopy Lab,
Ember Foundry, and Orbital Crown. Each level has its own arena layout, color
palette, several objectives, an extraction point, and synthesized music.
Complete all objectives in a level before its extraction marker appears;
activating an objective advances the current level's mission, not the campaign.
Only reaching and holding the extraction point moves the squad to the next
level. Scout Kite and breacher Brick follow your lead and engage nearby
hostiles. It uses procedural canvas graphics and original names; it does not
use or extract content from the iOS game archive in this folder.

## Play on Android

Serve this folder over HTTPS (or localhost during development), then open it
in Chrome on Android. Use Chrome's **Install app** / **Add to Home screen** to
install the offline-capable, landscape PWA. A local file opened with `file://`
does not support service-worker installation. If Chrome still doesn't offer
installation, reload the HTTPS page once so the updated service worker can
cache the install icons, then check **⋮ → Install app** again.

## Controls

- Touch: left thumbstick to move; FIRE automatically targets the nearest
  visible hostile; COVER protects you behind a barricade; USE activates nearby
  mission objectives; DASH boosts movement. Walk over weapon caches to unlock
  their weapons; the touch **SWAP** button cycles your unlocked loadout.
- Each level has its own synthesized music; original shooting and explosion
  effects play during combat. Audio starts when you deploy. Use the music-note
  button in the HUD to mute or restore it.
- Keyboard/mouse: WASD or arrows to move, click to fire toward the pointer,
  Q to cycle unlocked weapons (number keys 1-4 select unlocked weapons), Space
  to dash, E to toggle cover, Esc to pause. Sidearm, pulse rifle, scattergun,
  and rail carbine have distinct fire rates, damage, and projectile patterns.
- Hostiles have five combat roles: raiders, fast runners, long-range gunners,
  heavy units, and precision snipers. Their silhouettes, colors, durability,
  movement, range, and firepower distinguish them.
- The final Nightfall Spire objective is the Warden boss. Watch for Kite and
  Brick's warnings, evade its volleys, sweeping beam, and rush, then exploit
  the exposed core after each attack. Defeating it secures the flight core and
  drops a healing cache before extraction.
- Clear the hostiles at each objective, activate all objectives in the level,
  then reach its extraction point. Hold the pickup zone during extraction;
  extract from all five levels to finish the campaign.

This workspace does not include Android SDK platform/build tools or Gradle, so
this deliverable is an installable Android web app rather than a signed APK.
For a standalone native Linux desktop version, see [desktop/README.md](desktop/README.md).
