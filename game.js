(() => {
  "use strict";
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const screen = document.querySelector("#screen");
  const hud = document.querySelector("#hud");
  const controls = document.querySelector("#touch-controls");
  const healthBar = document.querySelector("#health");
  const healthText = document.querySelector("#health-text");
  const objective = document.querySelector("#objective");
  const coverIndicator = document.querySelector("#cover-indicator");
  const moveStick = document.querySelector("#move-stick");
  const knob = document.querySelector(".stick-knob");
  const keys = new Set();
  const world = { w: 2400, h: 1400 };
  const camera = { x: 0, y: 0 };
  const player = { x: 250, y: 740, r: 15, hp: 100, speed: 220, angle: 0, fire: 0, dash: 0, cover: false, invuln: 0 };
  const weapons = [
    { id: "sidearm", name: "SIDEARM", fireRate: 0.26, damage: 1, speed: 650, life: 0.7, pellets: 1, spread: 0, color: "#ffd18e" },
    { id: "pulse", name: "PULSE RIFLE", fireRate: 0.11, damage: 1, speed: 760, life: 0.8, pellets: 1, spread: 0.025, color: "#83f2d0" },
    { id: "scatter", name: "SCATTERGUN", fireRate: 0.58, damage: 1.2, speed: 560, life: 0.43, pellets: 5, spread: 0.32, color: "#ffad72" },
    { id: "rail", name: "RAIL CARBINE", fireRate: 0.72, damage: 4, speed: 1050, life: 0.9, pellets: 1, spread: 0, color: "#c5a5ff" }
  ];
  const unlockedWeapons = new Set(["sidearm"]);
  const pickups = [];
  let weaponIndex = 0;
  const cover = [];
  const enemies = [];
  let boss = null;
  const enemyTypes = {
    raider: { name: "RAIDER", color: "#ff856d", hp: 2, speed: 76, range: 235, preferred: 210, cooldown: 1.65, damage: 11, bulletSpeed: 285 },
    runner: { name: "RUNNER", color: "#ffcf70", hp: 1, speed: 128, range: 115, preferred: 75, cooldown: 1.35, damage: 9, bulletSpeed: 300 },
    gunner: { name: "GUNNER", color: "#ff647f", hp: 3, speed: 56, range: 430, preferred: 315, cooldown: 0.9, damage: 9, bulletSpeed: 320 },
    heavy: { name: "HEAVY", color: "#d986ff", hp: 6, speed: 39, range: 310, preferred: 220, cooldown: 1.9, damage: 20, bulletSpeed: 250 },
    sniper: { name: "SNIPER", color: "#75caff", hp: 2, speed: 47, range: 720, preferred: 430, cooldown: 2.4, damage: 17, bulletSpeed: 470 }
  };
  const enemyPools = [
    ["raider", "runner", "raider", "gunner", "runner"],
    ["raider", "gunner", "runner", "sniper", "heavy", "gunner"],
    ["runner", "gunner", "heavy", "raider", "sniper", "runner"],
    ["heavy", "gunner", "sniper", "runner", "heavy", "raider", "sniper"],
    ["sniper", "heavy", "runner", "gunner", "sniper", "heavy", "raider"]
  ];
  const bossTheme = {
    bpm: 164,
    melody: [220, null, 261.63, 311.13, 220, null, 349.23, 311.13, 196, null, 233.08, 293.66, 196, null, 349.23, 311.13],
    bass: [55, 55, 65.41, 49]
  };
  let spawnCursor = 0;
  const squad = [
    { name: "KITE", role: "SCOUT", color: "#77c9ff", x: 210, y: 710, r: 13, angle: 0, fire: 0.35, cooldown: 0.92, side: -1 },
    { name: "BRICK", role: "BREACHER", color: "#d8a4ff", x: 210, y: 770, r: 13, angle: 0, fire: 0.8, cooldown: 1.18, side: 1 }
  ];
  const bullets = [];
  const particles = [];
  const collectedPickups = new Set();
  const stages = [
    {
      name: "WRECKLINE", area: "THE DUST SEA",
      start: { x: 250, y: 740 },
      objectives: [
        { action: "CLEAR THE WRECKS", point: { x: 690, y: 740 }, spawn: { x: 700, y: 520 }, quota: 5, group: 5 },
        { action: "DISABLE THE BEACON", point: { x: 1160, y: 480 }, spawn: { x: 1120, y: 660 }, quota: 4, group: 4 }
      ],
      pickups: [{ weapon: "scatter", x: 860, y: 580 }],
      extraction: { point: { x: 2180, y: 700 }, spawn: { x: 2100, y: 800 }, group: 3 },
      music: { bpm: 132, melody: [293.66,null,349.23,440,null,392,440,null,523.25,null,440,392,null,349.23,392,523.25], bass: [73.42,73.42,87.31,65.41] },
      palette: { floor: "#191a1c", grid: "#33302a", route: "#55432f", routeMark: "#cda86d", cover: "#594638", coverTop: "#80664a", coverEdge: "#b18a57", debris: "#bb995f", objective: "#ffc46e", label: "#c6aa80" },
      path: [[250,740],[690,740],[890,580],[1160,480],[1440,650],[1600,840],[1760,1030],[1980,920],[2180,700]],
      cover: [[410,520,160,36],[630,400,36,140],[790,660,190,36],[460,900,36,170],[820,1020,160,36],[980,300,155,36],[1260,350,36,160],[1380,550,160,36],[1510,800,170,36],[1810,940,36,165],[1920,1150,160,36],[2030,500,150,36],[2250,850,36,140],[1070,830,36,120],[560,790,54,54],[1660,440,66,66]]
    },
    {
      name: "GLASS TUNDRA", area: "CRYO ARRAY",
      start: { x: 230, y: 1120 },
      objectives: [
        { action: "RESTORE COOLANT FLOW", point: { x: 960, y: 850 }, spawn: { x: 820, y: 550 }, quota: 5, group: 5 },
        { action: "RESTART THE ARRAY", point: { x: 1480, y: 350 }, spawn: { x: 1660, y: 560 }, quota: 5, group: 5 }
      ],
      pickups: [{ weapon: "pulse", x: 1120, y: 620 }],
      extraction: { point: { x: 2180, y: 740 }, spawn: { x: 2020, y: 850 }, group: 3 },
      music: { bpm: 118, melody: [392,null,493.88,587.33,null,493.88,440,null,392,null,329.63,392,null,440,493.88,null], bass: [98,82.41,73.42,82.41] },
      palette: { floor: "#101e27", grid: "#203746", route: "#254553", routeMark: "#8cdcf0", cover: "#294553", coverTop: "#3d7280", coverEdge: "#84c4cf", debris: "#9bd8e3", objective: "#78edff", label: "#82acb7" },
      path: [[230,1120],[550,1120],[650,880],[960,850],[1120,620],[1110,350],[1480,350],[1660,560],[2020,560],[2180,740]],
      cover: [[360,970,180,34],[610,740,34,170],[790,920,210,34],[950,650,34,170],[760,490,190,34],[1180,420,34,190],[1370,260,180,34],[1530,430,34,170],[1740,700,210,34],[1990,400,34,180],[2020,920,180,34],[1770,1040,34,170],[1330,990,190,34],[1090,1120,34,150],[490,510,60,60],[1850,820,70,70]]
    },
    {
      name: "VERDANT DESCENT", area: "CANOPY LAB",
      start: { x: 260, y: 260 },
      objectives: [
        { action: "SECURE THE LAB", point: { x: 860, y: 330 }, spawn: { x: 1000, y: 570 }, quota: 5, group: 5 },
        { action: "PURGE THE ROOT NODE", point: { x: 1420, y: 1010 }, spawn: { x: 1700, y: 940 }, quota: 5, group: 5 }
      ],
      pickups: [{ weapon: "rail", x: 1870, y: 700 }],
      extraction: { point: { x: 2160, y: 700 }, spawn: { x: 2020, y: 850 }, group: 3 },
      music: { bpm: 140, melody: [329.63,392,null,440,493.88,null,440,392,null,329.63,392,493.88,null,587.33,493.88,null], bass: [82.41,110,98,73.42] },
      palette: { floor: "#101d19", grid: "#263c31", route: "#314939", routeMark: "#b4d57c", cover: "#354b35", coverTop: "#557148", coverEdge: "#95ad65", debris: "#b5cb77", objective: "#d8ff82", label: "#a6bd83" },
      path: [[260,260],[580,420],[860,330],[1050,600],[1260,740],[1420,1010],[1700,940],[1870,700],[2160,700]],
      cover: [[400,280,34,190],[520,550,200,34],[720,400,34,180],[890,220,180,34],[1040,420,34,180],[1190,520,180,34],[1330,830,34,180],[1510,690,200,34],[1640,1010,190,34],[1760,480,34,180],[1900,350,190,34],[2020,850,34,180],[780,920,180,34],[480,990,34,170],[2110,1080,180,34],[1150,1110,65,65]]
    },
    {
      name: "EMBER FOUNDRY", area: "FURNACE FLOOR",
      start: { x: 260, y: 700 },
      objectives: [
        { action: "SECURE THE FURNACE", point: { x: 980, y: 480 }, spawn: { x: 1200, y: 680 }, quota: 6, group: 6 },
        { action: "SHUT DOWN THE CORE", point: { x: 1830, y: 420 }, spawn: { x: 1640, y: 500 }, quota: 6, group: 6 }
      ],
      pickups: [{ weapon: "scatter", x: 1480, y: 720 }],
      extraction: { point: { x: 2180, y: 820 }, spawn: { x: 2090, y: 950 }, group: 3 },
      music: { bpm: 152, melody: [261.63,null,311.13,392,null,349.23,311.13,null,261.63,null,233.08,311.13,null,349.23,392,null], bass: [65.41,77.78,87.31,73.42] },
      palette: { floor: "#211513", grid: "#432622", route: "#583128", routeMark: "#e89a64", cover: "#58352c", coverTop: "#87513a", coverEdge: "#ce7750", debris: "#d28455", objective: "#ff9b62", label: "#d59873" },
      path: [[260,700],[520,700],[720,480],[980,480],[1190,720],[1480,720],[1640,500],[1830,420],[2140,420],[2180,820]],
      cover: [[370,520,36,190],[520,810,210,36],[650,330,190,36],[840,520,36,190],[960,850,210,36],[1080,350,36,190],[1240,540,200,36],[1450,820,36,190],[1500,300,210,36],[1670,590,36,180],[1840,260,190,36],[1950,700,200,36],[2090,950,36,170],[720,1080,180,36],[1080,1080,70,70],[1980,1050,70,70]]
    },
    {
      name: "NIGHTFALL SPIRE", area: "ORBITAL CROWN",
      start: { x: 240, y: 1180 },
      objectives: [
        { action: "SECURE THE SPIRE", point: { x: 1120, y: 700 }, spawn: { x: 1400, y: 700 }, quota: 6, group: 6 },
        { action: "DEFEAT THE WARDEN", point: { x: 1840, y: 460 }, spawn: { x: 1720, y: 820 }, quota: 1, boss: true }
      ],
      pickups: [{ weapon: "pulse", x: 1530, y: 460 }],
      extraction: { point: { x: 2110, y: 260 }, spawn: { x: 2020, y: 500 }, group: 4 },
      music: { bpm: 146, melody: [349.23,null,415.3,523.25,null,466.16,523.25,null,698.46,null,523.25,466.16,null,415.3,349.23,null], bass: [87.31,69.3,77.78,103.83] },
      palette: { floor: "#151326", grid: "#302c4a", route: "#39334f", routeMark: "#b8a4fa", cover: "#393650", coverTop: "#5c5681", coverEdge: "#9c90d2", debris: "#9990ce", objective: "#e1c0ff", label: "#aca3d5" },
      path: [[240,1180],[520,1180],[710,950],[980,950],[1120,700],[1400,700],[1530,460],[1840,460],[2110,260]],
      cover: [[380,1030,190,36],[610,1120,36,170],[690,820,190,36],[900,980,36,190],[970,600,36,190],[1110,820,200,36],[1250,540,36,180],[1410,820,190,36],[1480,300,190,36],[1650,570,36,190],[1780,690,200,36],[1850,270,36,180],[1980,510,190,36],[2110,900,36,180],[540,600,70,70],[2020,1080,70,70]]
    }
  ];
  let running = false, paused = false, ended = false, kills = 0, stageIndex = 0, objectiveIndex = 0, stageKills = 0, extractionTime = null, toastTime = 0, last = 0, elapsed = 0;
  let stickVector = { x: 0, y: 0 }, firing = false, mouseAim = null;
  const useButton = document.querySelector("#use-button");
  const contextHint = document.querySelector("#context-hint");
  const missionToast = document.querySelector("#mission-toast");
  const soundButton = document.querySelector("#sound-button");
  const weaponButton = document.querySelector("#weapon-button");
  const bossStatus = document.querySelector("#boss-status");
  const bossHealth = document.querySelector("#boss-health");
  const bossState = document.querySelector("#boss-state");
  class GameAudio {
    constructor() {
      this.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = null;
      this.master = null;
      this.music = null;
      this.enabled = true;
      this.musicTimer = null;
      this.trackName = null;
      this.activeTrack = null;
      this.noteIndex = 0;
      this.noiseBuffer = null;
    }
    init() {
      if (this.context || !this.AudioContext) return;
      this.context = new this.AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.enabled ? 0.55 : 0;
      this.master.connect(this.context.destination);
      this.music = this.context.createGain();
      this.music.gain.value = 0;
      this.music.connect(this.master);
      this.noiseBuffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
      const noise = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
      for (const [frequency, volume] of [[55, 0.055], [82.41, 0.022]]) {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.value = volume;
        oscillator.connect(gain);
        gain.connect(this.music);
        oscillator.start();
      }
    }
    startMusic(track = currentStage().music, trackName = currentStage().name) {
      this.init();
      if (!this.context) {
        soundButton.disabled = true;
        soundButton.title = "Audio is not supported in this browser";
        return;
      }
      this.context.resume().catch(error => console.error("Audio playback could not start:", error));
      this.music.gain.setTargetAtTime(1, this.context.currentTime, 0.8);
      if (this.trackName !== trackName) {
        if (this.musicTimer) clearInterval(this.musicTimer);
        this.musicTimer = null;
        this.trackName = trackName;
        this.activeTrack = track;
        this.noteIndex = 0;
      }
      if (this.musicTimer || !this.enabled) return;
      this.noteIndex = 0;
      const tick = () => {
        if (!this.enabled || this.context?.state !== "running") return;
        const step = this.noteIndex++ % 16;
        if (track.melody[step]) this.playNote(track.melody[step], 0.17, step === 8 || step === 15 ? 0.09 : 0.065);
        if (step % 4 === 0) this.playNote(track.bass[(step / 4) % track.bass.length], 0.21, 0.11);
        if (step === 0 || step === 8 || (track.bpm > 145 && step === 14)) this.playKick();
        if (step === 4 || step === 12) this.playSnare();
        if (step % 2 === 0 || (track.bpm < 125 && step % 4 === 3)) this.playHiHat();
      };
      tick();
      this.musicTimer = setInterval(tick, 60000 / track.bpm / 4);
    }
    pauseMusic() {
      if (this.musicTimer) clearInterval(this.musicTimer);
      this.musicTimer = null;
      if (this.context && this.music) this.music.gain.setTargetAtTime(0, this.context.currentTime, 0.18);
    }
    toggle() {
      this.init();
      if (!this.context) {
        soundButton.disabled = true;
        soundButton.title = "Audio is not supported in this browser";
        return;
      }
      this.enabled = !this.enabled;
      this.master.gain.setTargetAtTime(this.enabled ? 0.55 : 0, this.context.currentTime, 0.04);
      soundButton.setAttribute("aria-pressed", String(!this.enabled));
      soundButton.setAttribute("aria-label", this.enabled ? "Mute audio" : "Enable audio");
      soundButton.title = this.enabled ? "Mute audio" : "Enable audio";
      soundButton.textContent = this.enabled ? "♫" : "♪";
      if (this.enabled && running && !paused) {
        this.startMusic(this.activeTrack || currentStage().music, this.trackName || currentStage().name);
      }
      if (!this.enabled) {
        if (this.musicTimer) clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    }
    playNote(frequency, duration = 0.17, volume = 0.065) {
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.value = Math.random() * 8 - 4;
      filter.type = "lowpass";
      filter.frequency.value = frequency < 120 ? 420 : 1250;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(this.music);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    }
    playKick() {
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(125, now);
      oscillator.frequency.exponentialRampToValueAtTime(42, now + 0.15);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      oscillator.connect(gain);
      gain.connect(this.music);
      oscillator.start(now);
      oscillator.stop(now + 0.19);
    }
    playSnare() {
      const now = this.context.currentTime;
      const noise = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      noise.buffer = this.noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.value = 1850;
      filter.Q.value = 0.8;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.17, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.music);
      noise.start(now, Math.random() * 0.7, 0.14);
      noise.stop(now + 0.15);
    }
    playHiHat() {
      const now = this.context.currentTime;
      const noise = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      noise.buffer = this.noiseBuffer;
      filter.type = "highpass";
      filter.frequency.value = 7200;
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.music);
      noise.start(now, Math.random() * 0.7, 0.045);
      noise.stop(now + 0.05);
    }
    shot(enemy = false, ally = false) {
      if (!this.enabled || !this.context || this.context.state !== "running") return;
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      oscillator.type = enemy || ally ? "triangle" : "sawtooth";
      oscillator.frequency.setValueAtTime(enemy ? 145 : ally ? 195 : 230, now);
      oscillator.frequency.exponentialRampToValueAtTime(enemy ? 65 : ally ? 82 : 75, now + 0.11);
      filter.type = "lowpass";
      filter.frequency.value = enemy ? 650 : ally ? 850 : 1100;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(enemy ? 0.08 : ally ? 0.07 : 0.13, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (enemy ? 0.13 : 0.16));
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + 0.17);
    }
    explosion() {
      if (!this.enabled || !this.context || this.context.state !== "running") return;
      const now = this.context.currentTime;
      const noise = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const noiseGain = this.context.createGain();
      noise.buffer = this.noiseBuffer;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.38);
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.32, now + 0.012);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.master);
      noise.start(now);
      noise.stop(now + 0.42);
      const low = this.context.createOscillator();
      const lowGain = this.context.createGain();
      low.type = "sine";
      low.frequency.setValueAtTime(95, now);
      low.frequency.exponentialRampToValueAtTime(32, now + 0.27);
      lowGain.gain.setValueAtTime(0.2, now);
      lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      low.connect(lowGain);
      lowGain.connect(this.master);
      low.start(now);
      low.stop(now + 0.31);
    }
  }
  const audio = new GameAudio();
  function currentStage() { return stages[stageIndex]; }
  function currentObjective() { return currentStage().objectives[objectiveIndex] || null; }
  function currentTarget() { return currentObjective()?.point || currentStage().extraction.point; }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize);
  resize();
  function worldPoint(x, y) { return { x: x + camera.x, y: y + camera.y }; }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function circleRect(cx, cy, r, rect) {
    const px = clamp(cx, rect.x, rect.x + rect.w), py = clamp(cy, rect.y, rect.y + rect.h);
    return (cx - px) ** 2 + (cy - py) ** 2 < r * r;
  }
  function blocked(x, y, r) { return cover.some(rect => circleRect(x, y, r, rect)); }
  function addParticle(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 25 + Math.random() * 110;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .25 + Math.random() * .45, max: .7, color, r: 1.5 + Math.random() * 2.5 });
    }
  }
  function reset() {
    player.hp = 100; player.angle = 0;
    player.fire = player.dash = player.invuln = 0; player.cover = false;
    enemies.length = bullets.length = particles.length = pickups.length = 0;
    boss = null;
    collectedPickups.clear();
    unlockedWeapons.clear();
    unlockedWeapons.add("sidearm");
    weaponIndex = 0;
    kills = 0; stageIndex = 0; objectiveIndex = 0; stageKills = 0; extractionTime = null; toastTime = 0; elapsed = 0; paused = ended = false;
    beginStage();
    updateHud();
  }
  function spawnEnemy() {
    const anchor = currentObjective()?.spawn || currentStage().extraction.spawn;
    const angle = Math.random() * Math.PI * 2, radius = 150 + Math.random() * 150;
    const x = clamp(anchor.x + Math.cos(angle) * radius, 40, world.w - 40);
    const y = clamp(anchor.y + Math.sin(angle) * radius, 40, world.h - 40);
    const pool = enemyPools[stageIndex];
    const typeId = pool[spawnCursor++ % pool.length];
    const type = { ...enemyTypes[typeId], id: typeId };
    let p = { x, y, type, r: type.hp >= 5 ? 18 : 14, hp: type.hp, speed: type.speed, fire: .5 + Math.random() * type.cooldown, hurt: 0, phase: Math.random() * 5 };
    for (const rect of cover) if (circleRect(p.x, p.y, 20, rect)) { p.x = anchor.x + 185; p.y = anchor.y + 110; }
    enemies.push(p);
  }
  function updateHud() {
    healthBar.style.width = `${player.hp}%`;
    healthBar.style.background = player.hp < 35 ? "#ff856d" : currentStage().palette.objective;
    healthText.textContent = Math.ceil(player.hp);
    const stage = currentStage();
    const objectiveLabel = document.querySelector("#objective-label");
    objectiveLabel.textContent = `LEVEL ${stageIndex + 1} / ${stages.length} · ${stage.area}`;
    objectiveLabel.style.color = stage.palette.label;
    objective.style.color = stage.palette.objective;
    coverIndicator.style.color = stage.palette.objective;
    const activeObjective = currentObjective();
    objective.textContent = extractionTime !== null
      ? `EXTRACTION ${Math.ceil(extractionTime)}s`
      : activeObjective
        ? `${objectiveIndex + 1}/${stage.objectives.length} · ${activeObjective.action} · ${stageKills}/${activeObjective.quota}`
        : "REACH EXTRACTION";
    bossStatus.classList.toggle("hidden", !boss || !running || paused);
    if (boss) {
      bossHealth.style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
      bossHealth.style.background = boss.vulnerable > 0 ? "#ffb56b" : "#b8a4fa";
      bossState.textContent = boss.vulnerable > 0
        ? "CORE EXPOSED"
        : boss.attackMode
          ? `${boss.attackMode.toUpperCase()} INCOMING`
          : boss.beamTime > 0
            ? "BEAM SWEEP"
            : boss.rushTime > 0
              ? "CHARGING"
              : "ARMORED";
    }
    const weapon = weapons[weaponIndex];
    weaponButton.textContent = `SWAP · ${weapon.name}`;
    weaponButton.title = `Current weapon: ${weapon.name}. Tap to switch weapons.`;
    weaponButton.style.borderColor = stage.palette.objective;
    weaponButton.style.color = stage.palette.objective;
    coverIndicator.classList.toggle("hidden", !player.cover || !running || paused);
    const target = currentTarget();
    const nearby = dist(player, target) < 70;
    const activeQuota = activeObjective?.quota ?? 0;
    const ready = extractionTime === null && enemies.length === 0 && !boss &&
      (activeObjective ? stageKills >= activeQuota : true);
    useButton.classList.toggle("hidden", !running || paused || !ready || !nearby);
    const hint = extractionTime !== null
      ? nearby ? `EXTRACTION INBOUND · HOLD ${Math.ceil(extractionTime)}s` : "RETURN TO PICKUP ZONE"
      :
      activeObjective
        ? !ready ? `HOSTILES ${stageKills} / ${activeQuota}` :
          nearby ? `${activeObjective.action} · TAP USE` : `${activeObjective.action} · ${Math.round(dist(player, target))}m`
        : nearby ? "EXTRACTION · TAP USE" : `EXTRACTION · ${Math.round(dist(player, target))}m`;
    contextHint.textContent = hint;
    contextHint.classList.toggle("hidden", !running || paused);
  }
  function announce(text) {
    missionToast.textContent = text;
    missionToast.classList.remove("hidden");
    toastTime = 3;
  }
  function beginStage() {
    objectiveIndex = 0;
    stageKills = 0;
    extractionTime = null;
    const stage = currentStage();
    cover.length = 0;
    cover.push(...stage.cover.map(([x, y, w, h]) => ({ x, y, w, h })));
    player.x = stage.start.x;
    player.y = stage.start.y;
    player.cover = false;
    squad[0].x = player.x - 42; squad[0].y = player.y - 30; squad[0].fire = 0.35;
    squad[1].x = player.x - 42; squad[1].y = player.y + 30; squad[1].fire = 0.8;
    enemies.length = bullets.length = particles.length = pickups.length = 0;
    boss = null;
    spawnCursor = 0;
    (stage.pickups || []).forEach((pickup, index) => {
      if (!collectedPickups.has(`${stageIndex}:${index}`)) pickups.push({ ...pickup, pickupIndex: index });
    });
    spawnObjectiveGroup();
    announce(`LEVEL ${stageIndex + 1} / ${stages.length}  ·  ${stage.name} · OBJECTIVE 1/${stage.objectives.length}`);
    if (running) audio.startMusic();
    updateHud();
  }
  function startExtraction() {
    extractionTime = 12;
    for (let i = 0; i < currentStage().extraction.group; i++) spawnEnemy();
    announce("EXTRACTION INBOUND  /  HOLD THE PICKUP ZONE");
    updateHud();
  }
  function spawnBoss() {
    const point = currentObjective().spawn;
    boss = {
      x: point.x, y: point.y, r: 48, hp: 84, maxHp: 84, hurt: 0,
      attackMode: null, attackIndex: 0, attackCooldown: 2.6, warning: 0,
      vulnerable: 0, beamTime: 0, beamAngle: 0, rushTime: 0, rushAngle: 0, rushHit: false
    };
    announce("WARDEN ONLINE  /  KITE: WATCH ITS ATTACKS");
    audio.startMusic(bossTheme, "WARDEN");
  }
  function spawnObjectiveGroup() {
    const activeObjective = currentObjective();
    if (!activeObjective) return;
    if (activeObjective.boss) spawnBoss();
    else for (let i = 0; i < activeObjective.group; i++) spawnEnemy();
  }
  function activateObjective() {
    const stage = currentStage();
    if (extractionTime !== null || dist(player, currentTarget()) >= 70 || enemies.length || boss) return false;
    const activeObjective = currentObjective();
    if (activeObjective) {
      if (stageKills < activeObjective.quota) return false;
      objectiveIndex++;
      stageKills = 0;
      if (currentObjective()) {
        spawnObjectiveGroup();
        if (!currentObjective().boss) announce(`OBJECTIVE ${objectiveIndex}/${stage.objectives.length}  /  ${currentObjective().action}`);
      } else {
        announce(`${stage.name} OBJECTIVES COMPLETE  /  REACH EXTRACTION`);
      }
      updateHud();
      return true;
    }
    startExtraction();
    return true;
  }
  function cycleWeapon() {
    const available = weapons.filter(weapon => unlockedWeapons.has(weapon.id));
    const current = available.findIndex(weapon => weapon.id === weapons[weaponIndex].id);
    const next = available[(current + 1) % available.length];
    weaponIndex = weapons.indexOf(next);
    updateHud();
    announce(`WEAPON SELECTED  /  ${next.name}`);
  }
  function collectPickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const pickup = pickups[i];
      if (dist(player, pickup) > 36) continue;
      const weapon = weapons.find(item => item.id === pickup.weapon);
      if (!weapon) continue;
      const key = `${stageIndex}:${pickup.pickupIndex}`;
      pickups.splice(i, 1);
      collectedPickups.add(key);
      if (!unlockedWeapons.has(weapon.id)) {
        unlockedWeapons.add(weapon.id);
        weaponIndex = weapons.indexOf(weapon);
        announce(`${pickup.label || "WEAPON ACQUIRED"}  /  ${weapon.name}`);
      } else {
        player.hp = Math.min(100, player.hp + (pickup.heal || 20));
        announce(`${pickup.label || "WEAPON CACHE"}  /  VITALS RESTORED`);
      }
      updateHud();
    }
  }
  function start() {
    reset(); running = true; screen.classList.add("hidden"); hud.classList.remove("hidden");
    audio.startMusic();
    controls.classList.remove("hidden"); last = performance.now();
    if (window.screen.orientation?.lock) window.screen.orientation.lock("landscape").catch(() => {});
    requestAnimationFrame(loop);
  }
  function finish(won) {
    ended = true; running = false; controls.classList.add("hidden");
    audio.pauseMusic();
    const title = won ? "SIGNAL<br><span>RESTORED</span>" : "MISSION<br><span>FAILED</span>";
    screen.querySelector("h1").innerHTML = title;
    screen.querySelector(".eyebrow").textContent = won ? "FIVE SITES SECURED · SQUAD EXTRACTED" : "OPERATOR DOWN";
    screen.querySelector(".intro").textContent = won
      ? "All five sites are secure. The squad has the data core, and extraction is clear."
      : "The station is still dark. Regroup, operator, and try another route through the outpost.";
    screen.querySelector(".briefing").innerHTML = `<span>RESULT</span><b>${kills} hostiles neutralized</b><span>TIME</span><b>${Math.floor(elapsed)} seconds in the field</b>`;
    document.querySelector("#start-button").innerHTML = 'REDEPLOY <span>→</span>';
    screen.classList.remove("hidden");
  }
  function togglePause() {
    if (!running || ended) return;
    paused = !paused;
    if (paused) {
      audio.pauseMusic();
      screen.querySelector("h1").innerHTML = "FIELD<br><span>PAUSED</span>";
      screen.querySelector(".eyebrow").textContent = "OPERATION ON HOLD";
      screen.querySelector(".intro").textContent = "Take a breath, operator. The relay can wait.";
      screen.querySelector(".briefing").innerHTML = `<span>SECTOR</span><b>${currentStage().area}</b><span>HOSTILES</span><b>${stageKills} neutralized here</b>`;
      document.querySelector("#start-button").innerHTML = 'RESUME <span>→</span>';
      screen.classList.remove("hidden"); controls.classList.add("hidden");
    } else {
      audio.startMusic(audio.activeTrack || currentStage().music, audio.trackName || currentStage().name);
      screen.classList.add("hidden"); controls.classList.remove("hidden"); last = performance.now(); requestAnimationFrame(loop);
    }
  }
  document.querySelector("#start-button").addEventListener("click", () => {
    if (paused) togglePause(); else start();
  });
  document.querySelector("#pause-button").addEventListener("click", togglePause);
  soundButton.addEventListener("click", () => audio.toggle());
  weaponButton.addEventListener("click", cycleWeapon);
  document.querySelector("#cover-button").addEventListener("pointerdown", e => { e.preventDefault(); player.cover = !player.cover; updateHud(); });
  useButton.addEventListener("pointerdown", e => { e.preventDefault(); activateObjective(); });
  document.querySelector("#dash-button").addEventListener("pointerdown", e => { e.preventDefault(); if (player.dash <= 0) player.dash = .24; });
  document.querySelector("#fire-button").addEventListener("pointerdown", e => { e.preventDefault(); firing = true; });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) document.querySelector("#fire-button").addEventListener(event, () => { firing = false; });
  moveStick.addEventListener("pointerdown", e => { e.preventDefault(); moveStick.setPointerCapture(e.pointerId); updateStick(e); });
  moveStick.addEventListener("pointermove", e => { if (e.buttons || e.pressure) updateStick(e); });
  function updateStick(e) {
    const r = moveStick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy, max = 43, len = Math.hypot(dx, dy);
    if (len > max) { dx *= max / len; dy *= max / len; }
    stickVector = { x: dx / max, y: dy / max };
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  function releaseStick() { stickVector = { x: 0, y: 0 }; knob.style.transform = ""; }
  moveStick.addEventListener("pointerup", releaseStick);
  moveStick.addEventListener("pointercancel", releaseStick);
  canvas.addEventListener("pointermove", e => { if (e.pointerType === "mouse") mouseAim = worldPoint(e.clientX, e.clientY); });
  canvas.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && running) { firing = true; mouseAim = worldPoint(e.clientX, e.clientY); } });
  addEventListener("pointerup", e => { if (e.pointerType === "mouse") firing = false; });
  addEventListener("keydown", e => {
    if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
    keys.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === "e" && running) {
      if (!activateObjective()) { player.cover = !player.cover; updateHud(); }
    }
    if (e.key.toLowerCase() === "q" && running) cycleWeapon();
    if (/^[1-4]$/.test(e.key) && running) {
      const requested = weapons[Number(e.key) - 1];
      if (requested && unlockedWeapons.has(requested.id)) {
        weaponIndex = Number(e.key) - 1;
        updateHud();
        announce(`WEAPON SELECTED  /  ${requested.name}`);
      }
    }
    if (e.code === "Space" && running && player.dash <= 0) player.dash = .24;
    if (e.key.toLowerCase() === "escape") togglePause();
  });
  addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

  function lineBlocked(a, b) {
    const steps = Math.ceil(dist(a, b) / 18);
    for (let i = 1; i < steps; i++) {
      const x = a.x + (b.x - a.x) * i / steps, y = a.y + (b.y - a.y) * i / steps;
      if (cover.some(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h)) return true;
    }
    return false;
  }
  function shoot() {
    if (player.fire > 0) return;
    const weapon = weapons[weaponIndex];
    player.fire = weapon.fireRate;
    audio.shot();
    let target = null;
    if (mouseAim) target = mouseAim;
    else {
      for (const enemy of enemies) {
        if (lineBlocked(player, enemy)) continue;
        if (!target || dist(player, enemy) < dist(player, target)) target = enemy;
      }
      if (boss && (!target || dist(player, boss) < dist(player, target))) target = boss;
      if (target) player.angle = Math.atan2(target.y - player.y, target.x - player.x);
    }
    for (let i = 0; i < weapon.pellets; i++) {
      const spread = weapon.pellets > 1 ? (i - (weapon.pellets - 1) / 2) * weapon.spread / (weapon.pellets - 1) : (Math.random() - 0.5) * weapon.spread;
      const angle = player.angle + spread;
      bullets.push({
        x: player.x + Math.cos(angle) * 19, y: player.y + Math.sin(angle) * 19,
        vx: Math.cos(angle) * weapon.speed, vy: Math.sin(angle) * weapon.speed,
        life: weapon.life, friendly: true, damage: weapon.damage, color: weapon.color
      });
    }
    addParticle(player.x + Math.cos(player.angle) * 20, player.y + Math.sin(player.angle) * 20, weapon.color, weapon.pellets > 1 ? 5 : 2);
  }
  function squadShoot(member, target) {
    const angle = Math.atan2(target.y - member.y, target.x - member.x);
    member.angle = angle;
    member.fire = member.cooldown;
    audio.shot(false, true);
    bullets.push({
      x: member.x + Math.cos(angle) * 17, y: member.y + Math.sin(angle) * 17,
      vx: Math.cos(angle) * 560, vy: Math.sin(angle) * 560,
      life: 0.8, friendly: true, owner: member
    });
    addParticle(member.x + Math.cos(angle) * 17, member.y + Math.sin(angle) * 17, member.color, 1);
  }
  function updateSquad(dt) {
    const forwardX = Math.cos(player.angle), forwardY = Math.sin(player.angle);
    const backX = -forwardX, backY = -forwardY;
    const sideX = -forwardY, sideY = forwardX;
    for (const member of squad) {
      const targetX = clamp(player.x + backX * 42 + sideX * member.side * 25, 28, world.w - 28);
      const targetY = clamp(player.y + backY * 42 + sideY * member.side * 25, 28, world.h - 28);
      const dx = targetX - member.x, dy = targetY - member.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 4) {
        const step = Math.min(distance, Math.min(250, distance * 3.2) * dt);
        const nx = member.x + dx / distance * step, ny = member.y + dy / distance * step;
        if (!blocked(nx, member.y, member.r)) member.x = nx;
        if (!blocked(member.x, ny, member.r)) member.y = ny;
      }

      member.fire -= dt;
      let target = null;
      for (const enemy of enemies) {
        if (dist(member, enemy) > 540 || lineBlocked(member, enemy)) continue;
        if (!target || dist(member, enemy) < dist(member, target)) target = enemy;
      }
      if (boss && dist(member, boss) <= 540 && (!target || dist(member, boss) < dist(member, target))) target = boss;
      if (target) {
        member.angle = Math.atan2(target.y - member.y, target.x - member.x);
        if (member.fire <= 0) squadShoot(member, target);
      } else {
        member.angle = Math.atan2(player.y - member.y, player.x - member.x);
      }
    }
  }
  function enemyShoot(enemy) {
    if (lineBlocked(enemy, player)) return;
    audio.shot(true);
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + (enemy.type.id === "sniper" ? 0 : (Math.random() - 0.5) * 0.12);
    bullets.push({
      x: enemy.x, y: enemy.y, vx: Math.cos(angle) * enemy.type.bulletSpeed,
      vy: Math.sin(angle) * enemy.type.bulletSpeed, life: 1.8,
      friendly: false, damage: enemy.type.damage
    });
  }
  function damagePlayer(amount, ignoreCover = false) {
    if (player.invuln > 0 || (player.cover && !ignoreCover)) return;
    player.hp = Math.max(0, player.hp - amount);
    player.invuln = .45;
    addParticle(player.x, player.y, "#ff856d", 5);
    updateHud();
  }
  function exposeBossCore() {
    if (!boss) return;
    boss.vulnerable = 2.4;
    boss.attackCooldown = 1.65;
    announce("KITE  /  CORE EXPOSED — HIT IT NOW");
  }
  function updateBoss(dt) {
    if (!boss) return;
    boss.hurt = Math.max(0, boss.hurt - dt);
    boss.vulnerable = Math.max(0, boss.vulnerable - dt);
    boss.attackCooldown -= dt;
    if (boss.beamTime > 0) {
      boss.beamTime = Math.max(0, boss.beamTime - dt);
      boss.beamAngle += 1.25 * dt;
      const distance = dist(boss, player);
      const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
      const difference = Math.atan2(Math.sin(angle - boss.beamAngle), Math.cos(angle - boss.beamAngle));
      if (distance < 590 && Math.abs(difference) < .045 + 16 / Math.max(distance, 1)) damagePlayer(16, true);
      if (boss.beamTime === 0) exposeBossCore();
      return;
    }
    if (boss.rushTime > 0) {
      const step = Math.min(boss.rushTime, dt);
      const dx = Math.cos(boss.rushAngle) * 690 * step;
      const dy = Math.sin(boss.rushAngle) * 690 * step;
      const nx = clamp(boss.x + dx, boss.r, world.w - boss.r);
      const ny = clamp(boss.y + dy, boss.r, world.h - boss.r);
      if (!blocked(nx, boss.y, boss.r)) boss.x = nx;
      if (!blocked(boss.x, ny, boss.r)) boss.y = ny;
      if (!boss.rushHit && dist(boss, player) < boss.r + player.r + 10) {
        boss.rushHit = true;
        damagePlayer(25, true);
      }
      boss.rushTime = Math.max(0, boss.rushTime - step);
      if (boss.rushTime === 0) exposeBossCore();
      return;
    }
    if (boss.warning > 0) {
      boss.warning = Math.max(0, boss.warning - dt);
      if (boss.warning > 0) return;
      if (boss.attackMode === "volley") {
        const aim = Math.atan2(player.y - boss.y, player.x - boss.x);
        for (let i = -2; i <= 2; i++) {
          const angle = aim + i * .17;
          bullets.push({
            x: boss.x + Math.cos(angle) * boss.r, y: boss.y + Math.sin(angle) * boss.r,
            vx: Math.cos(angle) * 370, vy: Math.sin(angle) * 370,
            life: 1.8, friendly: false, damage: 10, color: "#ff7489"
          });
        }
        audio.shot(true);
        boss.attackMode = null;
        exposeBossCore();
      } else if (boss.attackMode === "beam") {
        boss.beamAngle = Math.atan2(player.y - boss.y, player.x - boss.x) - .72;
        boss.beamTime = 1.45;
        boss.attackMode = null;
      } else {
        boss.rushAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
        boss.rushTime = .5;
        boss.rushHit = false;
        boss.attackMode = null;
      }
      return;
    }
    if (boss.attackCooldown <= 0) {
      const modes = ["volley", "beam", "rush"];
      boss.attackMode = modes[boss.attackIndex++ % modes.length];
      boss.warning = 1.05;
      const callout = {
        volley: "KITE  /  WARDEN VOLLEY — KEEP MOVING",
        beam: "KITE  /  BEAM SWEEP — BREAK LINE",
        rush: "BRICK  /  WARDEN CHARGING — DASH!"
      };
      announce(callout[boss.attackMode]);
    }
  }
  function update(dt) {
    elapsed += dt;
    player.fire = Math.max(0, player.fire - dt); player.dash = Math.max(0, player.dash - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    let mx = stickVector.x + (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    let my = stickVector.y + (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
    let length = Math.hypot(mx, my); if (length > 1) { mx /= length; my /= length; }
    if (mx || my) {
      player.cover = false;
      player.angle = Math.atan2(my, mx);
      const speed = player.speed * (player.dash > 0 ? 3.2 : 1);
      const nx = clamp(player.x + mx * speed * dt, 28, world.w - 28), ny = clamp(player.y + my * speed * dt, 28, world.h - 28);
      if (!blocked(nx, player.y, player.r)) player.x = nx;
      if (!blocked(player.x, ny, player.r)) player.y = ny;
      if (player.dash > 0 && Math.random() < .55) addParticle(player.x, player.y, "#5de3c0", 1);
    }
    if (mouseAim && !firing) player.angle = Math.atan2(mouseAim.y - player.y, mouseAim.x - player.x);
    if (firing || keys.has("f")) shoot();
    if (player.cover) {
      const near = cover.some(r => circleRect(player.x, player.y, 34, r));
      if (!near) player.cover = false;
    }
    collectPickups();
    updateSquad(dt);
    toastTime = Math.max(0, toastTime - dt);
    missionToast.classList.toggle("hidden", toastTime <= 0);
    for (const enemy of enemies) {
      enemy.fire -= dt; enemy.hurt = Math.max(0, enemy.hurt - dt);
      const dx = player.x - enemy.x, dy = player.y - enemy.y, d = Math.hypot(dx, dy) || 1;
      const side = Math.sin(elapsed * 1.7 + enemy.phase) * .32;
      const desired = enemy.type.preferred;
      const approach = d > desired + (enemy.type.id === "runner" ? 0 : 35);
      const retreat = enemy.type.id !== "runner" && d < desired - 55;
      if (approach || retreat) {
        const direction = approach ? 1 : -1;
        const vx = (dx / d * direction + -dy / d * side) * enemy.speed, vy = (dy / d * direction + dx / d * side) * enemy.speed;
        const nx = enemy.x + vx * dt, ny = enemy.y + vy * dt;
        if (!blocked(nx, enemy.y, enemy.r)) enemy.x = nx;
        if (!blocked(enemy.x, ny, enemy.r)) enemy.y = ny;
      } else if (d <= enemy.type.range && enemy.fire <= 0) {
        enemyShoot(enemy);
        enemy.fire = enemy.type.cooldown * (0.85 + Math.random() * 0.3);
      }
    }
    updateBoss(dt);
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      let remove = b.life <= 0 || blocked(b.x, b.y, 3) || b.x < 0 || b.x > world.w || b.y < 0 || b.y > world.h;
      if (b.friendly && boss && !remove && dist(b, boss) < boss.r + 4) {
        const damage = (b.damage || 1) * (boss.vulnerable > 0 ? 2.5 : .25);
        boss.hp -= damage;
        boss.hurt = .12;
        addParticle(b.x, b.y, boss.vulnerable > 0 ? "#ffb56b" : "#b8a4fa", 3);
        remove = true;
        if (boss.hp <= 0) {
          const defeated = boss;
          boss = null;
          audio.explosion();
          addParticle(defeated.x, defeated.y, "#ffb56b", 28);
          stageKills++;
          kills++;
          pickups.push({
            weapon: "rail", x: defeated.x, y: defeated.y, pickupIndex: "warden-cache",
            label: "WARDEN CACHE", heal: 35
          });
          announce("WARDEN DOWN  /  FLIGHT CORE SECURED");
          audio.startMusic();
          updateHud();
        }
      } else if (b.friendly) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          if (dist(b, enemies[j]) < enemies[j].r + 3) {
            enemies[j].hp -= b.damage || 1; enemies[j].hurt = .12; addParticle(b.x, b.y, "#ff856d", 3); remove = true;
            if (enemies[j].hp <= 0) {
              audio.explosion();
              addParticle(enemies[j].x, enemies[j].y, "#ff856d", 12);
              enemies.splice(j, 1); kills++; stageKills++; updateHud();
            }
            break;
          }
        }
      } else if (dist(b, player) < player.r + 4) {
        remove = true;
        damagePlayer(b.damage || 11);
      }
      if (remove) bullets.splice(i, 1);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= .96; p.vy *= .96;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (player.hp <= 0) finish(false);
    if (extractionTime !== null && dist(player, currentStage().extraction.point) < 110) {
      extractionTime = Math.max(0, extractionTime - dt);
      if (extractionTime === 0) {
        if (stageIndex === stages.length - 1) finish(true);
        else {
          stageIndex++;
          player.hp = Math.min(100, player.hp + 20);
          beginStage();
        }
      }
    }
    camera.x = clamp(player.x - innerWidth / 2, 0, world.w - innerWidth);
    camera.y = clamp(player.y - innerHeight / 2, 0, world.h - innerHeight);
    updateHud();
  }
  function draw() {
    const w = innerWidth, h = innerHeight;
    const theme = currentStage().palette;
    ctx.clearRect(0, 0, w, h);
    ctx.save(); ctx.translate(-camera.x, -camera.y);
    ctx.fillStyle = theme.floor; ctx.fillRect(0, 0, world.w, world.h);
    ctx.strokeStyle = theme.grid; ctx.lineWidth = 1;
    for (let x = 0; x <= world.w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, world.h); ctx.stroke(); }
    for (let y = 0; y <= world.h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(world.w, y); ctx.stroke(); }
    const path = currentStage().path;
    ctx.strokeStyle = theme.route; ctx.lineWidth = 100; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); path.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.strokeStyle = theme.routeMark; ctx.globalAlpha = 0.32; ctx.lineWidth = 2; ctx.setLineDash([12, 18]);
    ctx.beginPath(); path.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]); ctx.lineWidth = 1;
    ctx.fillStyle = `${theme.label}55`; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText(currentStage().area, path[Math.floor(path.length / 2)][0], path[Math.floor(path.length / 2)][1] - 72);
    for (let i = 0; i < 170; i++) {
      const x = (i * 197 + 41) % world.w, y = (i * 113 + 59) % world.h;
      ctx.fillStyle = i % 3 ? theme.grid : theme.debris; ctx.globalAlpha = i % 3 ? 0.8 : 0.55; ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
    drawObjective();
    for (const pickup of pickups) drawPickup(pickup);
    for (const r of cover) {
      ctx.fillStyle = theme.floor; ctx.fillRect(r.x + 5, r.y + 7, r.w, r.h);
      ctx.fillStyle = theme.cover; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = theme.coverEdge; ctx.strokeRect(r.x + .5, r.y + .5, r.w - 1, r.h - 1);
      ctx.fillStyle = theme.coverTop; ctx.fillRect(r.x + 5, r.y + 5, Math.max(5, r.w - 10), 3);
    }
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const b of bullets) {
      ctx.fillStyle = b.color || (b.friendly ? "#ffd18e" : "#ff705e");
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.friendly ? 3 : 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    }
    for (const e of enemies) drawActor(e, false);
    if (boss) drawBoss();
    for (const member of squad) drawCompanion(member);
    drawActor(player, true);
    ctx.restore();
    const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .25, w / 2, h / 2, Math.max(w, h) * .72);
    vignette.addColorStop(0, "transparent"); vignette.addColorStop(1, "#02090cb3");
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
    if (running) {
      const target = currentTarget();
      const direction = ((Math.round(Math.atan2(target.y - player.y, target.x - player.x) / (Math.PI / 4)) % 8) + 8) % 8;
      const arrows = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
      ctx.fillStyle = currentStage().palette.objective; ctx.font = "11px monospace"; ctx.textAlign = "center";
      ctx.fillText(`${arrows[direction]} ${Math.round(dist(player, target))}m  ·  ${currentStage().area}`, w / 2, 116);
    }
    drawMiniMap(w);
  }
  function drawMiniMap(viewWidth) {
    const theme = currentStage().palette;
    const mapWidth = Math.min(132, viewWidth * .31), mapHeight = mapWidth * world.h / world.w;
    const x = viewWidth - mapWidth - 16, y = 138;
    const sx = mapWidth / world.w, sy = mapHeight / world.h;
    ctx.save();
    ctx.fillStyle = "#07121ade"; ctx.fillRect(x - 5, y - 5, mapWidth + 10, mapHeight + 10);
    ctx.strokeStyle = theme.objective; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.strokeRect(x - 4.5, y - 4.5, mapWidth + 9, mapHeight + 9); ctx.globalAlpha = 1;
    ctx.fillStyle = theme.floor; ctx.fillRect(x, y, mapWidth, mapHeight);
    ctx.strokeStyle = theme.route; ctx.lineWidth = 5; ctx.beginPath();
    currentStage().path.forEach(([px, py], i) => i
      ? ctx.lineTo(x + px * sx, y + py * sy)
      : ctx.moveTo(x + px * sx, y + py * sy));
    ctx.stroke();
    for (const rect of cover) {
      ctx.fillStyle = theme.coverEdge;
      ctx.fillRect(x + rect.x * sx, y + rect.y * sy, Math.max(1, rect.w * sx), Math.max(1, rect.h * sy));
    }
    for (const pickup of pickups) {
      ctx.fillStyle = currentStage().palette.objective;
      ctx.beginPath(); ctx.arc(x + pickup.x * sx, y + pickup.y * sy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    if (boss) {
      ctx.fillStyle = boss.vulnerable > 0 ? "#ffb56b" : "#b8a4fa";
      ctx.beginPath(); ctx.arc(x + boss.x * sx, y + boss.y * sy, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    for (const member of squad) {
      ctx.fillStyle = member.color; ctx.beginPath();
      ctx.arc(x + member.x * sx, y + member.y * sy, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    const target = currentTarget();
    ctx.fillStyle = theme.objective; ctx.beginPath();
    ctx.arc(x + target.x * sx, y + target.y * sy, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff4d7"; ctx.beginPath();
    ctx.arc(x + player.x * sx, y + player.y * sy, 2.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawBoss() {
    const exposed = boss.vulnerable > 0;
    const warning = boss.warning > 0;
    ctx.save();
    if (boss.beamTime > 0) {
      ctx.strokeStyle = "#ff557a55"; ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(boss.x + Math.cos(boss.beamAngle) * 590, boss.y + Math.sin(boss.beamAngle) * 590);
      ctx.stroke();
      ctx.strokeStyle = "#ff9aaa"; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(boss.x + Math.cos(boss.beamAngle) * 590, boss.y + Math.sin(boss.beamAngle) * 590);
      ctx.stroke();
    } else if (warning && boss.attackMode === "rush") {
      ctx.strokeStyle = "#ff647f"; ctx.lineWidth = 3; ctx.setLineDash([12, 9]);
      ctx.beginPath();
      ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(boss.x + Math.cos(Math.atan2(player.y - boss.y, player.x - boss.x)) * 300,
        boss.y + Math.sin(Math.atan2(player.y - boss.y, player.x - boss.x)) * 300);
      ctx.stroke(); ctx.setLineDash([]);
    } else if (warning && boss.attackMode === "beam") {
      const aim = Math.atan2(player.y - boss.y, player.x - boss.x);
      ctx.strokeStyle = "#ff647f66"; ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(boss.x + Math.cos(aim) * 510, boss.y + Math.sin(aim) * 510); ctx.stroke();
    }
    ctx.translate(boss.x, boss.y);
    const pulse = .8 + Math.sin(elapsed * 6) * .2;
    ctx.shadowColor = exposed ? "#ffb56b" : warning ? "#ff647f" : "#b8a4fa";
    ctx.shadowBlur = exposed ? 28 : warning ? 22 : 14;
    ctx.fillStyle = boss.hurt > 0 ? "#fff0df" : exposed ? "#ffb56b" : "#71639c";
    ctx.strokeStyle = exposed ? "#ffe0a6" : "#c5b8f5";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      const radius = boss.r * (i % 2 ? .82 : 1.08);
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = exposed ? "#fff1d2" : "#211d36"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 23 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = exposed ? "#fff0bb" : "#c1a8ff";
    ctx.beginPath(); ctx.arc(0, 0, 12 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#eee9ff"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText("WARDEN", 0, -boss.r - 22);
    ctx.restore();
  }
  function drawCompanion(member) {
    ctx.save(); ctx.translate(member.x, member.y);
    ctx.strokeStyle = `${member.color}99`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, member.r + 4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = member.color; ctx.shadowColor = member.color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0, 0, member.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.rotate(member.angle);
    ctx.fillStyle = "#e7f2ef"; ctx.fillRect(1, -3, 21, 6);
    ctx.fillStyle = "#172326"; ctx.fillRect(7, -1.5, 14, 3);
    ctx.restore();
    ctx.fillStyle = member.color; ctx.font = "9px monospace"; ctx.textAlign = "center";
    ctx.fillText(member.name, member.x, member.y - 22);
  }
  function drawPickup(pickup) {
    const weapon = weapons.find(item => item.id === pickup.weapon);
    if (!weapon) return;
    const bob = Math.sin(elapsed * 4 + pickup.x) * 4;
    ctx.save(); ctx.translate(pickup.x, pickup.y + bob);
    ctx.shadowColor = weapon.color; ctx.shadowBlur = 16;
    ctx.fillStyle = "#10191dcc"; ctx.strokeStyle = weapon.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = weapon.color; ctx.fillRect(-10, -3, 20, 6);
    ctx.fillRect(-4, -7, 7, 14);
    ctx.restore();
    ctx.fillStyle = weapon.color; ctx.font = "9px monospace"; ctx.textAlign = "center";
    ctx.fillText(pickup.label || weapon.name, pickup.x, pickup.y + 32 + bob);
  }
  function drawActor(a, friendly) {
    ctx.save(); ctx.translate(a.x, a.y);
    if (friendly && a.invuln > 0 && Math.floor(a.invuln * 18) % 2) ctx.globalAlpha = .5;
    ctx.fillStyle = friendly ? "#5de3c0" : (a.hurt > 0 ? "#fff0df" : a.type.color);
    ctx.shadowColor = friendly ? "#5de3c0" : a.type.color; ctx.shadowBlur = friendly ? 14 : 9;
    if (!friendly && a.type.id === "sniper") {
      ctx.fillRect(-a.r, -a.r, a.r * 2, a.r * 2);
    } else if (!friendly && a.type.id === "runner") {
      ctx.beginPath(); ctx.moveTo(a.r + 2, 0); ctx.lineTo(-a.r, -a.r); ctx.lineTo(-a.r, a.r); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0, 0, a.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.rotate(friendly ? a.angle : Math.atan2(player.y - a.y, player.x - a.x));
    ctx.fillStyle = "#d9ece4"; ctx.fillRect(0, -4, friendly ? 24 : 18, 8);
    ctx.fillStyle = "#142126"; ctx.fillRect(4, -2, 16, 4);
    if (!friendly) {
      ctx.fillStyle = "#1a1b20"; ctx.fillRect(-14, -a.r - 9, 28, 3);
      ctx.fillStyle = a.type.color; ctx.fillRect(-14, -a.r - 9, 28 * Math.max(0, a.hp / a.type.hp), 3);
      ctx.fillStyle = a.type.color; ctx.font = "8px monospace"; ctx.textAlign = "center";
      ctx.fillText(a.type.name, 0, -a.r - 13);
    }
    ctx.restore();
  }
  function drawObjective() {
    const theme = currentStage().palette;
    const objectivePoint = currentTarget();
    const pulse = .65 + Math.sin(elapsed * 3) * .2;
    ctx.globalAlpha = pulse; ctx.strokeStyle = theme.objective; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(objectivePoint.x, objectivePoint.y, 27 + Math.sin(elapsed * 3) * 4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = theme.objective; ctx.beginPath(); ctx.arc(objectivePoint.x, objectivePoint.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = theme.label; ctx.font = "10px monospace"; ctx.textAlign = "center";
    const stage = currentStage();
    const objective = currentObjective();
    const icon = extractionTime !== null ? "HOLD PICKUP ZONE" : objective ? `OBJECTIVE ${objectiveIndex + 1}` : "EXTRACTION";
    ctx.fillText(icon, objectivePoint.x, objectivePoint.y + 47);
  }
  function loop(now) {
    if (!running || paused) return;
    const dt = Math.min((now - last) / 1000, .04); last = now;
    update(dt); draw();
    if (running && !paused) requestAnimationFrame(loop);
  }
  draw();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(error => console.error("Offline install unavailable:", error)));
  }
})();
