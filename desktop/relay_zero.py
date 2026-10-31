#!/usr/bin/env python3
"""Relay Zero: a standalone, procedural Linux desktop action game."""

from __future__ import annotations

import math
import random
import struct
import sys
import time
from array import array
from dataclasses import dataclass, field

import pygame


WIDTH, HEIGHT = 1280, 720
WORLD_W, WORLD_H = 2400, 1400
FPS = 60
TAU = math.tau


@dataclass(frozen=True)
class Stage:
    name: str
    area: str
    start: tuple[int, int]
    objectives: tuple[tuple[str, tuple[int, int], tuple[int, int], int], ...]
    extraction: tuple[int, int]
    extraction_spawn: tuple[int, int]
    extraction_group: int
    pickup: tuple[str, int, int] | None
    colors: tuple[str, ...]
    path: tuple[tuple[int, int], ...]
    cover: tuple[tuple[int, int, int, int], ...]
    bpm: int
    melody: tuple[int | None, ...]
    bass: tuple[int, ...]


STAGES = (
    Stage("WRECKLINE", "THE DUST SEA", (250, 740),
          (("CLEAR THE WRECKS", (690, 740), (700, 520), 5),
           ("DISABLE THE BEACON", (1160, 480), (1120, 660), 4)),
          (2180, 700), (2100, 800), 3, ("scatter", 860, 580),
          ("#191a1c", "#33302a", "#55432f", "#cda86d", "#594638", "#80664a", "#b18a57", "#bb995f", "#ffc46e", "#c6aa80"),
          ((250,740),(690,740),(890,580),(1160,480),(1440,650),(1600,840),(1760,1030),(1980,920),(2180,700)),
          ((410,520,160,36),(630,400,36,140),(790,660,190,36),(460,900,36,170),(820,1020,160,36),(980,300,155,36),(1260,350,36,160),(1380,550,160,36),(1510,800,170,36),(1810,940,36,165),(1920,1150,160,36),(2030,500,150,36),(2250,850,36,140),(1070,830,36,120),(560,790,54,54),(1660,440,66,66)),
          132, (294,None,349,440,None,392,440,None,523,None,440,392,None,349,392,523), (73,73,87,65)),
    Stage("GLASS TUNDRA", "CRYO ARRAY", (230, 1120),
          (("RESTORE COOLANT FLOW", (960, 850), (820, 550), 5),
           ("RESTART THE ARRAY", (1480, 350), (1660, 560), 5)),
          (2180, 740), (2020, 850), 3, ("pulse", 1120, 620),
          ("#101e27", "#203746", "#254553", "#8cdcf0", "#294553", "#3d7280", "#84c4cf", "#9bd8e3", "#78edff", "#82acb7"),
          ((230,1120),(550,1120),(650,880),(960,850),(1120,620),(1110,350),(1480,350),(1660,560),(2020,560),(2180,740)),
          ((360,970,180,34),(610,740,34,170),(790,920,210,34),(950,650,34,170),(760,490,190,34),(1180,420,34,190),(1370,260,180,34),(1530,430,34,170),(1740,700,210,34),(1990,400,34,180),(2020,920,180,34),(1770,1040,34,170),(1330,990,190,34),(1090,1120,34,150),(490,510,60,60),(1850,820,70,70)),
          118, (392,None,494,587,None,494,440,None,392,None,330,392,None,440,494,None), (98,82,73,82)),
    Stage("VERDANT DESCENT", "CANOPY LAB", (260, 260),
          (("SECURE THE LAB", (860, 330), (1000, 570), 5),
           ("PURGE THE ROOT NODE", (1420, 1010), (1700, 940), 5)),
          (2160, 700), (2020, 850), 3, ("rail", 1870, 700),
          ("#101d19", "#263c31", "#314939", "#b4d57c", "#354b35", "#557148", "#95ad65", "#b5cb77", "#d8ff82", "#a6bd83"),
          ((260,260),(580,420),(860,330),(1050,600),(1260,740),(1420,1010),(1700,940),(1870,700),(2160,700)),
          ((400,280,34,190),(520,550,200,34),(720,400,34,180),(890,220,180,34),(1040,420,34,180),(1190,520,180,34),(1330,830,34,180),(1510,690,200,34),(1640,1010,190,34),(1760,480,34,180),(1900,350,190,34),(2020,850,34,180),(780,920,180,34),(480,990,34,170),(2110,1080,180,34),(1150,1110,65,65)),
          140, (330,392,None,440,494,None,440,392,None,330,392,494,None,587,494,None), (82,110,98,73)),
    Stage("EMBER FOUNDRY", "FURNACE FLOOR", (260, 700),
          (("SECURE THE FURNACE", (980, 480), (1200, 680), 6),
           ("SHUT DOWN THE CORE", (1830, 420), (1640, 500), 6)),
          (2180, 820), (2090, 950), 3, ("scatter", 1480, 720),
          ("#211513", "#432622", "#583128", "#e89a64", "#58352c", "#87513a", "#ce7750", "#d28455", "#ff9b62", "#d59873"),
          ((260,700),(520,700),(720,480),(980,480),(1190,720),(1480,720),(1640,500),(1830,420),(2140,420),(2180,820)),
          ((370,520,36,190),(520,810,210,36),(650,330,190,36),(840,520,36,190),(960,850,210,36),(1080,350,36,190),(1240,540,200,36),(1450,820,36,190),(1500,300,210,36),(1670,590,36,180),(1840,260,190,36),(1950,700,200,36),(2090,950,36,170),(720,1080,180,36),(1080,1080,70,70),(1980,1050,70,70)),
          152, (262,None,311,392,None,349,311,None,262,None,233,311,None,349,392,None), (65,78,87,73)),
    Stage("NIGHTFALL SPIRE", "ORBITAL CROWN", (240, 1180),
          (("SECURE THE SPIRE", (1120, 700), (1400, 700), 6),
           ("DEFEAT THE WARDEN", (1840, 460), (1720, 820), 1)),
          (2110, 260), (2020, 500), 4, ("pulse", 1530, 460),
          ("#151326", "#302c4a", "#39334f", "#b8a4fa", "#393650", "#5c5681", "#9c90d2", "#9990ce", "#e1c0ff", "#aca3d5"),
          ((240,1180),(520,1180),(710,950),(980,950),(1120,700),(1400,700),(1530,460),(1840,460),(2110,260)),
          ((380,1030,190,36),(610,1120,36,170),(690,820,190,36),(900,980,36,190),(970,600,36,190),(1110,820,200,36),(1250,540,36,180),(1410,820,190,36),(1480,300,190,36),(1650,570,36,190),(1780,690,200,36),(1850,270,36,180),(1980,510,190,36),(2110,900,36,180),(540,600,70,70),(2020,1080,70,70)),
          146, (349,None,415,523,None,466,523,None,698,None,523,466,None,415,349,None), (87,69,78,104)),
)

ENEMIES = {
    "raider": {"name":"RAIDER","color":"#ff856d","hp":2,"speed":76,"range":235,"preferred":210,"cooldown":1.65,"damage":11,"bullet":285},
    "runner": {"name":"RUNNER","color":"#ffcf70","hp":1,"speed":128,"range":115,"preferred":75,"cooldown":1.35,"damage":9,"bullet":300},
    "gunner": {"name":"GUNNER","color":"#ff647f","hp":3,"speed":56,"range":430,"preferred":315,"cooldown":.9,"damage":9,"bullet":320},
    "heavy": {"name":"HEAVY","color":"#d986ff","hp":6,"speed":39,"range":310,"preferred":220,"cooldown":1.9,"damage":20,"bullet":250},
    "sniper": {"name":"SNIPER","color":"#75caff","hp":2,"speed":47,"range":720,"preferred":430,"cooldown":2.4,"damage":17,"bullet":470},
}
ENEMY_POOLS = (
    ("raider","runner","raider","gunner","runner"),
    ("raider","gunner","runner","sniper","heavy","gunner"),
    ("runner","gunner","heavy","raider","sniper","runner"),
    ("heavy","gunner","sniper","runner","heavy","raider","sniper"),
    ("sniper","heavy","runner","gunner","sniper","heavy","raider"),
)
WEAPONS = (
    {"id":"sidearm","name":"SIDEARM","rate":.26,"damage":1,"speed":650,"life":.7,"pellets":1,"spread":0,"color":"#ffd18e"},
    {"id":"pulse","name":"PULSE RIFLE","rate":.11,"damage":1,"speed":760,"life":.8,"pellets":1,"spread":.025,"color":"#83f2d0"},
    {"id":"scatter","name":"SCATTERGUN","rate":.58,"damage":1.2,"speed":560,"life":.43,"pellets":5,"spread":.32,"color":"#ffad72"},
    {"id":"rail","name":"RAIL CARBINE","rate":.72,"damage":4,"speed":1050,"life":.9,"pellets":1,"spread":0,"color":"#c5a5ff"},
)


def synth_note(freq: float, seconds: float, volume: float = .15, wave="sine") -> bytes:
    rate = 22050
    frames = int(rate * seconds)
    samples = array("h")
    for i in range(frames):
        t = i / rate
        envelope = min(1.0, i / max(1, rate * .008)) * max(0.0, 1 - i / frames)
        phase = TAU * freq * t
        value = math.sin(phase)
        if wave == "square":
            value = 1.0 if math.sin(phase) >= 0 else -1.0
        elif wave == "saw":
            value = 2 * ((freq * t) % 1) - 1
        samples.append(int(max(-1, min(1, value * envelope * volume)) * 32767))
    return samples.tobytes()


def synth_track(bpm: int, melody: tuple, bass: tuple, boss=False) -> bytes:
    rate = 22050
    step_frames = int(rate * 60 / bpm / 4)
    data = array("h")
    for step in range(32):
        note = melody[step % len(melody)]
        bass_note = bass[(step // 4) % len(bass)] if step % 4 == 0 else None
        kick = step % 8 == 0 or (boss and step % 8 == 6)
        snare = step % 8 == 4
        for i in range(step_frames):
            t = i / rate
            envelope = min(1, i / (rate * .008)) * max(.08, 1 - i / step_frames)
            sample = 0.0
            if note:
                frequency = note * (2 if boss and step % 4 == 2 else 1)
                sample += math.sin(TAU * frequency * t) * .17 * envelope
            if bass_note:
                sample += math.sin(TAU * bass_note * t) * .29
            if kick:
                sample += math.sin(TAU * (72 - 38 * i / step_frames) * t) * .24 * max(0, 1 - i / step_frames)
            if snare and i < step_frames // 3:
                sample += random.uniform(-1, 1) * .09 * (1 - i / (step_frames / 3))
            value = max(-1, min(1, sample)) * 32767
            data.extend((int(value), int(value)))
    if sys.byteorder != "little":
        data.byteswap()
    return data.tobytes()


def vec_length(x, y):
    return math.hypot(x, y)


def point_rect_distance(x, y, rect):
    rx, ry, rw, rh = rect
    dx = max(rx - x, 0, x - rx - rw)
    dy = max(ry - y, 0, y - ry - rh)
    return math.hypot(dx, dy)


class Game:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("Relay Zero")
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE)
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("dejavusansmono", 15)
        self.small = pygame.font.SysFont("dejavusansmono", 11)
        self.large = pygame.font.SysFont("dejavusansmono", 56, bold=True)
        self.title_font = pygame.font.SysFont("dejavusansmono", 25, bold=True)
        self.audio_ok = False
        self.music_sounds = {}
        self.sfx = {}
        self.music_channel = None
        self.init_audio()
        self.init_controller()
        self.mode = "menu"
        self.stage_index = 0
        self.running = True
        self.reset_campaign()

    def init_audio(self):
        try:
            pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=512)
            self.audio_ok = True
            for index, stage in enumerate(STAGES):
                self.music_sounds[f"stage{index}"] = pygame.mixer.Sound(
                    buffer=synth_track(stage.bpm, stage.melody, stage.bass)
                )
            self.music_sounds["boss"] = pygame.mixer.Sound(
                buffer=synth_track(164, (220,None,262,311,220,None,349,311,196,None,233,294,196,None,349,311), (55,55,65,49), True)
            )
            self.sfx["shot"] = pygame.mixer.Sound(buffer=synth_note(190, .11, .13, "saw"))
            self.sfx["enemy"] = pygame.mixer.Sound(buffer=synth_note(105, .13, .12, "square"))
            self.sfx["explosion"] = pygame.mixer.Sound(buffer=synth_note(55, .28, .3, "saw"))
        except pygame.error:
            self.audio_ok = False

    def play_music(self, name):
        if not self.audio_ok:
            return
        sound = self.music_sounds.get(name)
        if sound and (self.music_channel is None or self.music_channel.get_sound() is not sound):
            if self.music_channel:
                self.music_channel.fadeout(450)
            self.music_channel = pygame.mixer.Channel(0)
            self.music_channel.play(sound, loops=-1, fade_ms=650)

    def init_controller(self):
        self.joystick = None
        try:
            pygame.joystick.init()
            if pygame.joystick.get_count():
                self.joystick = pygame.joystick.Joystick(0)
                self.joystick.init()
                print(f"Controller: {self.joystick.get_name()}")
                self.right_axes = (3, 4) if self.joystick.get_numaxes() >= 5 else (2, 3)
                self.axis = [0.0] * max(5, self.joystick.get_numaxes())
        except pygame.error as error:
            print(f"Controller unavailable: {error}")
        if self.joystick is None:
            self.right_axes = (2, 3)
            self.axis = [0.0] * 5
        self.controller_buttons = set()

    def reset_campaign(self):
        self.player = {"x": STAGES[self.stage_index].start[0], "y": STAGES[self.stage_index].start[1],
                       "hp":100.0,"angle":0.0,"fire":0.0,"dash":0.0,"invuln":0.0,"cover":False}
        self.unlocked = {"sidearm"}
        self.weapon_index = 0
        self.collected = set()
        self.kills = 0
        self.elapsed = 0
        self.init_stage()

    @property
    def stage(self):
        return STAGES[self.stage_index]

    def init_stage(self):
        stage = self.stage
        self.objective_index = 0
        self.stage_kills = 0
        self.extraction_time = None
        self.enemies = []
        self.bullets = []
        self.particles = []
        self.boss = None
        self.spawn_cursor = 0
        self.camera = [0.0, 0.0]
        self.player["x"], self.player["y"] = stage.start
        self.player["cover"] = False
        self.squad = [
            {"x":stage.start[0]-42,"y":stage.start[1]-30,"name":"KITE","color":"#77c9ff","fire":.4,"side":-1},
            {"x":stage.start[0]-42,"y":stage.start[1]+30,"name":"BRICK","color":"#d8a4ff","fire":.8,"side":1},
        ]
        self.pickups = []
        if stage.pickup and f"{self.stage_index}:0" not in self.collected:
            kind, x, y = stage.pickup
            self.pickups.append({"weapon":kind,"x":x,"y":y,"key":f"{self.stage_index}:0"})
        self.spawn_objective()
        if self.mode == "playing":
            self.play_music(f"stage{self.stage_index}")

    def spawn_objective(self):
        if self.objective_index >= len(self.stage.objectives):
            return
        _, _, spawn, quota = self.stage.objectives[self.objective_index]
        if self.stage_index == 4 and self.objective_index == 1:
            self.spawn_boss(spawn)
            return
        for _ in range(quota):
            self.spawn_enemy(spawn)

    def spawn_enemy(self, anchor):
        pool = ENEMY_POOLS[self.stage_index]
        archetype = pool[self.spawn_cursor % len(pool)]
        self.spawn_cursor += 1
        data = ENEMIES[archetype]
        angle = random.random() * TAU
        radius = random.randint(150, 300)
        x = max(40, min(WORLD_W-40, anchor[0] + math.cos(angle)*radius))
        y = max(40, min(WORLD_H-40, anchor[1] + math.sin(angle)*radius))
        for rect in self.stage.cover:
            if point_rect_distance(x,y,rect) < 22:
                x, y = anchor[0]+185, anchor[1]+110
                break
        self.enemies.append({"x":x,"y":y,"type":archetype,"hp":data["hp"],"fire":random.uniform(.5,1.5),"phase":random.random()*5,"hurt":0})

    def spawn_boss(self, point):
        self.boss = {"x":point[0],"y":point[1],"hp":84.0,"max_hp":84.0,"hurt":0,"vulnerable":0,
                     "cooldown":2.6,"mode":None,"warning":0,"pattern":0,"beam":0,"beam_angle":0,
                     "rush":0,"rush_angle":0,"rush_hit":False}
        self.message = "WARDEN ONLINE  /  KITE: WATCH ITS ATTACKS"
        self.message_time = 3
        self.play_music("boss")

    def begin(self):
        self.mode = "playing"
        self.stage_index = 0
        self.reset_campaign()
        self.play_music(f"stage{self.stage_index}")
        self.message = f"LEVEL {self.stage_index+1}/5  /  {self.stage.name}"
        self.message_time = 3

    def set_message(self, text):
        self.message = text
        self.message_time = 2.8

    def interact(self):
        if self.mode != "playing" or self.extraction_time is not None:
            return
        target = self.current_target()
        if math.hypot(self.player["x"]-target[0],self.player["y"]-target[1]) >= 72:
            return
        if self.enemies or self.boss:
            return
        if self.objective_index < len(self.stage.objectives):
            _, _, _, quota = self.stage.objectives[self.objective_index]
            if self.stage_kills < quota:
                return
            self.objective_index += 1
            self.stage_kills = 0
            if self.objective_index < len(self.stage.objectives):
                self.spawn_objective()
                if not self.boss:
                    self.set_message(f"OBJECTIVE {self.objective_index+1}  /  {self.stage.objectives[self.objective_index][0]}")
            else:
                self.set_message("OBJECTIVES COMPLETE  /  REACH EXTRACTION")
            return
        self.extraction_time = 12.0
        for _ in range(self.stage.extraction_group):
            self.spawn_enemy(self.stage.extraction_spawn)
        self.set_message("EXTRACTION INBOUND  /  HOLD THE PICKUP ZONE")

    def current_target(self):
        return self.stage.objectives[self.objective_index][1] if self.objective_index < len(self.stage.objectives) else self.stage.extraction

    def aim_at(self, x, y):
        self.player["angle"] = math.atan2(y-self.player["y"], x-self.player["x"])

    def nearest_enemy(self):
        targets = self.enemies + ([self.boss] if self.boss else [])
        return min(targets, key=lambda e: math.hypot(e["x"]-self.player["x"],e["y"]-self.player["y"])) if targets else None

    def fire_player(self):
        p = self.player
        weapon = WEAPONS[self.weapon_index]
        if p["fire"] > 0:
            return
        p["fire"] = weapon["rate"]
        angle = p["angle"]
        target = self.nearest_enemy()
        right_x, right_y = self.right_axes
        if target and self.aim_mode == "controller" and abs(self.axis[right_x])+abs(self.axis[right_y]) < .2:
            angle = math.atan2(target["y"]-p["y"],target["x"]-p["x"])
        if self.audio_ok:
            self.sfx["shot"].play()
        for i in range(weapon["pellets"]):
            spread = ((i-(weapon["pellets"]-1)/2)*weapon["spread"]/(weapon["pellets"]-1)
                      if weapon["pellets"] > 1 else random.uniform(-weapon["spread"]/2,weapon["spread"]/2))
            a = angle+spread
            self.bullets.append({"x":p["x"]+math.cos(a)*20,"y":p["y"]+math.sin(a)*20,
                                 "vx":math.cos(a)*weapon["speed"],"vy":math.sin(a)*weapon["speed"],
                                 "life":weapon["life"],"friendly":True,"damage":weapon["damage"],"color":weapon["color"]})

    def fire_enemy(self, enemy):
        data = ENEMIES[enemy["type"]]
        angle = math.atan2(self.player["y"]-enemy["y"],self.player["x"]-enemy["x"])
        if enemy["type"] != "sniper":
            angle += random.uniform(-.06,.06)
        self.bullets.append({"x":enemy["x"],"y":enemy["y"],"vx":math.cos(angle)*data["bullet"],
                             "vy":math.sin(angle)*data["bullet"],"life":1.8,"friendly":False,"damage":data["damage"]})
        if self.audio_ok:
            self.sfx["enemy"].play()

    def damage_player(self, damage, ignore_cover=False):
        p = self.player
        if p["invuln"] > 0 or (p["cover"] and not ignore_cover):
            return
        p["hp"] = max(0,p["hp"]-damage)
        p["invuln"] = .45

    def move_entity(self, entity, dx, dy, radius):
        x = max(radius, min(WORLD_W-radius, entity["x"]+dx))
        y = max(radius, min(WORLD_H-radius, entity["y"]+dy))
        if not any(point_rect_distance(x, entity["y"], rect) < radius for rect in self.stage.cover):
            entity["x"] = x
        if not any(point_rect_distance(entity["x"], y, rect) < radius for rect in self.stage.cover):
            entity["y"] = y

    def cycle_weapon(self):
        available = [i for i,w in enumerate(WEAPONS) if w["id"] in self.unlocked]
        self.weapon_index = available[(available.index(self.weapon_index)+1)%len(available)]
        self.set_message(f"WEAPON SELECTED  /  {WEAPONS[self.weapon_index]['name']}")

    def collect_pickups(self):
        p = self.player
        for pickup in self.pickups[:]:
            if math.hypot(p["x"]-pickup["x"],p["y"]-pickup["y"]) > 36:
                continue
            self.pickups.remove(pickup)
            self.collected.add(pickup["key"])
            weapon = next((i for i,w in enumerate(WEAPONS) if w["id"] == pickup["weapon"]),None)
            if weapon is not None and WEAPONS[weapon]["id"] not in self.unlocked:
                self.unlocked.add(WEAPONS[weapon]["id"])
                self.weapon_index = weapon
                if pickup.get("heal"):
                    p["hp"] = min(100,p["hp"]+pickup["heal"])
                    self.set_message(f"{pickup.get('label','CACHE')}  /  {WEAPONS[weapon]['name']} + VITALS")
                else:
                    self.set_message(f"WEAPON ACQUIRED  /  {WEAPONS[weapon]['name']}")
            else:
                p["hp"] = min(100,p["hp"]+pickup.get("heal",20))
                self.set_message("CACHE RECOVERED  /  VITALS RESTORED")

    def update_squad(self, dt):
        p = self.player
        for member in self.squad:
            tx = p["x"] - math.cos(p["angle"])*42 - math.sin(p["angle"])*member["side"]*25
            ty = p["y"] - math.sin(p["angle"])*42 + math.cos(p["angle"])*member["side"]*25
            dx,dy=tx-member["x"],ty-member["y"]
            d=math.hypot(dx,dy)
            if d>4:
                step=min(d,250*dt)
                member["x"] += dx/d*step
                member["y"] += dy/d*step
            member["fire"] -= dt
            targets = [e for e in self.enemies if math.hypot(e["x"]-member["x"],e["y"]-member["y"])<540]
            if self.boss and math.hypot(self.boss["x"]-member["x"],self.boss["y"]-member["y"])<540:
                targets.append(self.boss)
            if targets:
                target=min(targets,key=lambda e:math.hypot(e["x"]-member["x"],e["y"]-member["y"]))
                angle=math.atan2(target["y"]-member["y"],target["x"]-member["x"])
                if member["fire"]<=0:
                    self.bullets.append({"x":member["x"],"y":member["y"],"vx":math.cos(angle)*560,"vy":math.sin(angle)*560,
                                         "life":.8,"friendly":True,"damage":1,"color":member["color"]})
                    member["fire"]=1.0

    def update_boss(self, dt):
        boss=self.boss
        if not boss:
            return
        boss["hurt"]=max(0,boss["hurt"]-dt)
        boss["vulnerable"]=max(0,boss["vulnerable"]-dt)
        boss["cooldown"]-=dt
        if boss["beam"]>0:
            boss["beam"]=max(0,boss["beam"]-dt)
            boss["beam_angle"]+=1.25*dt
            distance=math.hypot(self.player["x"]-boss["x"],self.player["y"]-boss["y"])
            angle=math.atan2(self.player["y"]-boss["y"],self.player["x"]-boss["x"])
            difference=math.atan2(math.sin(angle-boss["beam_angle"]),math.cos(angle-boss["beam_angle"]))
            if distance<590 and abs(difference)<.045+16/max(distance,1):
                self.damage_player(16,True)
            if boss["beam"]==0:
                boss["vulnerable"]=2.4
                boss["cooldown"]=1.65
                self.set_message("KITE  /  CORE EXPOSED — HIT IT NOW")
            return
        if boss["rush"]>0:
            step=min(boss["rush"],dt)
            self.move_entity(boss,math.cos(boss["rush_angle"])*690*step,
                             math.sin(boss["rush_angle"])*690*step,48)
            if not boss["rush_hit"] and math.hypot(self.player["x"]-boss["x"],self.player["y"]-boss["y"])<65:
                boss["rush_hit"]=True
                self.damage_player(25,True)
            boss["rush"]=max(0,boss["rush"]-step)
            if boss["rush"]==0:
                boss["vulnerable"]=2.4
                boss["cooldown"]=1.65
                self.set_message("BRICK  /  CORE EXPOSED — HIT IT NOW")
            return
        if boss["warning"]>0:
            boss["warning"]=max(0,boss["warning"]-dt)
            if boss["warning"]>0:
                return
            mode=boss["mode"]
            if mode=="volley":
                aim=math.atan2(self.player["y"]-boss["y"],self.player["x"]-boss["x"])
                for i in range(-2,3):
                    a=aim+i*.17
                    self.bullets.append({"x":boss["x"],"y":boss["y"],"vx":math.cos(a)*370,"vy":math.sin(a)*370,
                                         "life":1.8,"friendly":False,"damage":10,"color":"#ff7489"})
                boss["vulnerable"]=2.4
                boss["cooldown"]=1.65
                self.set_message("KITE  /  CORE EXPOSED — HIT IT NOW")
            elif mode=="beam":
                boss["beam_angle"]=math.atan2(self.player["y"]-boss["y"],self.player["x"]-boss["x"])-.72
                boss["beam"]=1.45
            else:
                boss["rush_angle"]=math.atan2(self.player["y"]-boss["y"],self.player["x"]-boss["x"])
                boss["rush"]=.5
                boss["rush_hit"]=False
            boss["mode"]=None
            return
        if boss["cooldown"]<=0:
            modes=("volley","beam","rush")
            mode=modes[boss["pattern"]%3]
            boss["pattern"]+=1
            boss["mode"]=mode
            boss["warning"]=1.05
            messages={"volley":"KITE  /  WARDEN VOLLEY — KEEP MOVING",
                      "beam":"KITE  /  BEAM SWEEP — BREAK LINE",
                      "rush":"BRICK  /  WARDEN CHARGING — DASH!"}
            self.set_message(messages[mode])

    def update(self, dt):
        if self.mode != "playing":
            return
        dt=min(dt,.04)
        self.elapsed+=dt
        p=self.player
        p["fire"]=max(0,p["fire"]-dt)
        p["dash"]=max(0,p["dash"]-dt)
        p["invuln"]=max(0,p["invuln"]-dt)
        keys=pygame.key.get_pressed()
        mx=float(keys[pygame.K_d] or keys[pygame.K_RIGHT])-float(keys[pygame.K_a] or keys[pygame.K_LEFT])
        my=float(keys[pygame.K_s] or keys[pygame.K_DOWN])-float(keys[pygame.K_w] or keys[pygame.K_UP])
        if self.joystick:
            mx += self.deadzone(self.axis[0])
            my += self.deadzone(self.axis[1])
        length=math.hypot(mx,my)
        if length>1:
            mx/=length;my/=length
        if mx or my:
            p["cover"]=False
            p["angle"]=math.atan2(my,mx)
            speed=220*(3.2 if p["dash"]>0 else 1)
            self.move_entity(p,mx*speed*dt,my*speed*dt,15)
        if self.aim_mode=="controller" and self.joystick:
            right_x,right_y=self.right_axes
            ax,ay=self.deadzone(self.axis[right_x]),self.deadzone(self.axis[right_y])
            if math.hypot(ax,ay)>.22:
                p["angle"]=math.atan2(ay,ax)
        if self.aim_mode=="mouse":
            mxp,myp=pygame.mouse.get_pos()
            self.aim_at(mxp+self.camera[0],myp+self.camera[1])
        fire=keys[pygame.K_f] or (self.joystick and 0 in self.controller_buttons)
        if fire or self.mouse_firing:
            self.fire_player()
        if p["cover"] and not any(point_rect_distance(p["x"],p["y"],r)<34 for r in self.stage.cover):
            p["cover"]=False
        self.collect_pickups()
        self.update_squad(dt)
        self.message_time=max(0,getattr(self,"message_time",0)-dt)
        for enemy in self.enemies:
            data=ENEMIES[enemy["type"]]
            enemy["fire"]-=dt
            enemy["hurt"]=max(0,enemy["hurt"]-dt)
            dx,dy=p["x"]-enemy["x"],p["y"]-enemy["y"]
            distance=math.hypot(dx,dy) or 1
            side=math.sin(self.elapsed*1.7+enemy["phase"])*.32
            preferred=data["preferred"]
            approach=distance>preferred+(0 if enemy["type"]=="runner" else 35)
            retreat=enemy["type"]!="runner" and distance<preferred-55
            if approach or retreat:
                direction=1 if approach else -1
                self.move_entity(enemy,
                    ((dx/distance)*direction-(dy/distance)*side)*data["speed"]*dt,
                    ((dy/distance)*direction+(dx/distance)*side)*data["speed"]*dt,14)
            elif distance<=data["range"] and enemy["fire"]<=0:
                self.fire_enemy(enemy)
                enemy["fire"]=data["cooldown"]*random.uniform(.85,1.15)
        self.update_boss(dt)
        for bullet in self.bullets[:]:
            bullet["x"]+=bullet["vx"]*dt
            bullet["y"]+=bullet["vy"]*dt
            bullet["life"]-=dt
            removed=(bullet["life"]<=0 or not (0<bullet["x"]<WORLD_W and 0<bullet["y"]<WORLD_H)
                     or any(point_rect_distance(bullet["x"],bullet["y"],rect)<3 for rect in self.stage.cover))
            if bullet["friendly"] and self.boss and math.hypot(bullet["x"]-self.boss["x"],bullet["y"]-self.boss["y"])<52:
                multiplier=2.5 if self.boss["vulnerable"]>0 else .25
                self.boss["hp"]-=bullet["damage"]*multiplier
                self.boss["hurt"]=.12
                removed=True
                if self.boss["hp"]<=0:
                    self.defeat_boss()
            elif bullet["friendly"]:
                for enemy in self.enemies[:]:
                    if math.hypot(bullet["x"]-enemy["x"],bullet["y"]-enemy["y"])<17:
                        enemy["hp"]-=bullet["damage"]
                        removed=True
                        if enemy["hp"]<=0:
                            self.enemies.remove(enemy)
                            self.kills+=1;self.stage_kills+=1
                            if self.audio_ok:self.sfx["explosion"].play()
                        break
            elif math.hypot(bullet["x"]-p["x"],bullet["y"]-p["y"])<19:
                self.damage_player(bullet["damage"])
                removed=True
            if removed and bullet in self.bullets:
                self.bullets.remove(bullet)
        if p["hp"]<=0:
            self.mode="failed"
            if self.music_channel:self.music_channel.fadeout(300)
        if self.extraction_time is not None:
            if math.hypot(p["x"]-self.stage.extraction[0],p["y"]-self.stage.extraction[1])<110:
                self.extraction_time=max(0,self.extraction_time-dt)
                if self.extraction_time==0:
                    if self.stage_index==4:
                        self.mode="won"
                        if self.music_channel:self.music_channel.fadeout(500)
                    else:
                        self.stage_index+=1
                        p["hp"]=min(100,p["hp"]+20)
                        self.init_stage()
                        self.play_music(f"stage{self.stage_index}")
        self.update_camera()

    @staticmethod
    def deadzone(value):
        return 0 if abs(value)<.18 else value

    def defeat_boss(self):
        boss=self.boss
        self.boss=None
        self.kills+=1;self.stage_kills+=1
        self.pickups.append({"weapon":"rail","x":boss["x"],"y":boss["y"],"key":"warden-cache","label":"WARDEN CACHE","heal":35})
        self.set_message("WARDEN DOWN  /  FLIGHT CORE SECURED")
        self.play_music(f"stage{self.stage_index}")
        if self.audio_ok:self.sfx["explosion"].play()

    def update_camera(self):
        width,height=self.screen.get_size()
        self.camera[0]=max(0,min(WORLD_W-width,self.player["x"]-width/2))
        self.camera[1]=max(0,min(WORLD_H-height,self.player["y"]-height/2))

    def handle_event(self,event):
        if event.type==pygame.QUIT:
            self.running=False
        elif event.type==pygame.VIDEORESIZE:
            self.screen=pygame.display.set_mode(event.size,pygame.RESIZABLE)
            self.update_camera()
        elif event.type==pygame.JOYAXISMOTION and self.joystick and event.instance_id==self.joystick.get_instance_id():
            axes=list(self.axis)
            if event.axis >= len(axes):
                axes.extend([0.0]*(event.axis+1-len(axes)))
            axes[event.axis]=event.value
            self.axis=tuple(axes)
            self.aim_mode="controller"
        elif event.type==pygame.JOYBUTTONDOWN and self.joystick:
            self.controller_buttons.add(event.button)
            self.aim_mode="controller"
            if self.mode!="playing":
                if event.button in (0,7):self.begin()
                return
            if event.button==1:self.player["dash"]=.24
            elif event.button==2:self.player["cover"]=not self.player["cover"]
            elif event.button==3:self.interact()
            elif event.button in (4,5):self.cycle_weapon()
        elif event.type==pygame.JOYBUTTONUP:
            self.controller_buttons.discard(event.button)
        elif event.type==pygame.KEYDOWN:
            if event.key==pygame.K_ESCAPE:
                if self.mode=="playing":
                    self.mode="paused"
                    if self.music_channel:self.music_channel.pause()
                elif self.mode=="paused":
                    self.mode="playing"
                    if self.music_channel:self.music_channel.unpause()
                elif self.mode in ("won","failed"):
                    self.mode="menu"
            elif self.mode in ("menu","won","failed") and event.key in (pygame.K_RETURN,pygame.K_SPACE):
                self.begin()
            elif self.mode=="paused" and event.key==pygame.K_RETURN:
                self.mode="playing"
                if self.music_channel:self.music_channel.unpause()
            elif self.mode=="playing":
                if event.key==pygame.K_e:self.interact()
                elif event.key==pygame.K_q:self.cycle_weapon()
                elif event.key==pygame.K_SPACE:self.player["dash"]=.24
                elif event.key==pygame.K_c:self.player["cover"]=not self.player["cover"]
                elif pygame.K_1<=event.key<=pygame.K_4:
                    index=event.key-pygame.K_1
                    if WEAPONS[index]["id"] in self.unlocked:self.weapon_index=index
        elif event.type==pygame.MOUSEBUTTONDOWN:
            if self.mode=="paused":
                self.mode="playing"
                if self.music_channel:self.music_channel.unpause()
            elif self.mode!="playing":
                self.begin()
            elif event.button==1:
                self.mouse_firing=True;self.aim_mode="mouse"
            elif event.button==3:
                self.aim_mode="mouse";self.interact()
            elif event.button==4:self.cycle_weapon()
            elif event.button==5:self.cycle_weapon()
        elif event.type==pygame.MOUSEBUTTONUP and event.button==1:
            self.mouse_firing=False
        elif event.type==pygame.MOUSEMOTION and self.mode=="playing":
            self.aim_mode="mouse"

    def init_inputs(self):
        self.aim_mode="mouse"
        self.mouse_firing=False

    def draw_text(self,text,x,y,font=None,color="#e8f4f1",center=False):
        surf=(font or self.font).render(str(text),True,color)
        rect=surf.get_rect()
        if center:rect.center=(int(x),int(y))
        else:rect.topleft=(int(x),int(y))
        self.screen.blit(surf,rect)

    def world_to_screen(self,x,y):
        return int(x-self.camera[0]),int(y-self.camera[1])

    def draw_world(self):
        stage=self.stage
        floor,grid,route,mark,cover,top,edge,debris,objective,label=stage.colors
        self.screen.fill(floor)
        offset_x,offset_y=self.camera
        width,height=self.screen.get_size()
        for x in range(int(offset_x//60)*60,int(offset_x+width)+60,60):
            pygame.draw.line(self.screen,grid,(x-offset_x,0),(x-offset_x,height))
        for y in range(int(offset_y//60)*60,int(offset_y+height)+60,60):
            pygame.draw.line(self.screen,grid,(0,y-offset_y),(width,y-offset_y))
        path=[self.world_to_screen(x,y) for x,y in stage.path]
        if len(path)>1:
            pygame.draw.lines(self.screen,route,False,path,100)
            pygame.draw.lines(self.screen,mark,False,path,2)
        for index in range(170):
            x=(index*197+41)%WORLD_W;y=(index*113+59)%WORLD_H
            if -4<x-offset_x<width+4 and -4<y-offset_y<height+4:
                pygame.draw.rect(self.screen,debris if index%3==0 else grid,(x-offset_x,y-offset_y,2,2))
        self.draw_text(stage.area,width/2,120,self.small,label,True)
        self.draw_target()
        self.draw_pickups()
        for rx,ry,rw,rh in stage.cover:
            x,y=self.world_to_screen(rx,ry)
            pygame.draw.rect(self.screen,cover,(x,y,rw,rh))
            pygame.draw.rect(self.screen,edge,(x,y,rw,rh),1)
            pygame.draw.rect(self.screen,top,(x+5,y+5,max(5,rw-10),3))
        for bullet in self.bullets:
            x,y=self.world_to_screen(bullet["x"],bullet["y"])
            pygame.draw.circle(self.screen,bullet.get("color","#ff705e" if not bullet["friendly"] else "#ffd18e"),(x,y),4 if not bullet["friendly"] else 3)
        for enemy in self.enemies:self.draw_enemy(enemy)
        if self.boss:self.draw_boss()
        for member in self.squad:self.draw_squad(member)
        self.draw_player()

    def draw_target(self):
        stage=self.stage
        target=self.current_target()
        x,y=self.world_to_screen(*target)
        color=stage.colors[8]
        pygame.draw.circle(self.screen,color,(x,y),30,2)
        pygame.draw.circle(self.screen,color,(x,y),5)
        label="HOLD PICKUP ZONE" if self.extraction_time is not None else "EXTRACTION" if self.objective_index>=len(stage.objectives) else f"OBJECTIVE {self.objective_index+1}"
        self.draw_text(label,x,y+43,self.small,stage.colors[9],True)

    def draw_pickups(self):
        for pickup in self.pickups:
            x,y=self.world_to_screen(pickup["x"],pickup["y"])
            color=next((w["color"] for w in WEAPONS if w["id"]==pickup["weapon"]),"#ffb56b")
            pygame.draw.circle(self.screen,"#10191d",(x,y),18)
            pygame.draw.circle(self.screen,color,(x,y),18,2)
            pygame.draw.line(self.screen,color,(x-10,y),(x+10,y),5)
            self.draw_text(pickup.get("label",next(w["name"] for w in WEAPONS if w["id"]==pickup["weapon"])),x,y+27,self.small,color,True)

    def draw_enemy(self,enemy):
        x,y=self.world_to_screen(enemy["x"],enemy["y"])
        data=ENEMIES[enemy["type"]]
        color="#fff0df" if enemy["hurt"]>0 else data["color"]
        if enemy["type"]=="runner":
            points=[(x+16,y),(x-12,y-12),(x-12,y+12)]
            pygame.draw.polygon(self.screen,color,points)
        elif enemy["type"]=="sniper":
            pygame.draw.rect(self.screen,color,(x-13,y-13,26,26))
        else:
            pygame.draw.circle(self.screen,color,(x,y),18 if enemy["type"]=="heavy" else 14)
        self.draw_text(data["name"],x,y-30,self.small,data["color"],True)
        pygame.draw.rect(self.screen,"#1a1b20",(x-14,y-23,28,3))
        pygame.draw.rect(self.screen,data["color"],(x-14,y-23,int(28*enemy["hp"]/data["hp"]),3))

    def draw_boss(self):
        b=self.boss
        x,y=self.world_to_screen(b["x"],b["y"])
        exposed=b["vulnerable"]>0
        if b["beam"]>0:
            end=(x+math.cos(b["beam_angle"])*590,y+math.sin(b["beam_angle"])*590)
            pygame.draw.line(self.screen,"#ff557a",(x,y),end,20)
            pygame.draw.line(self.screen,"#ffbdc5",(x,y),end,4)
        elif b["warning"]>0 and b["mode"]=="rush":
            a=math.atan2(self.player["y"]-b["y"],self.player["x"]-b["x"])
            end=(x+math.cos(a)*300,y+math.sin(a)*300)
            pygame.draw.line(self.screen,"#ff647f", (x,y),end,3)
        elif b["warning"]>0 and b["mode"]=="beam":
            a=math.atan2(self.player["y"]-b["y"],self.player["x"]-b["x"])
            pygame.draw.line(self.screen,"#a34f79",(x,y),(x+math.cos(a)*510,y+math.sin(a)*510),13)
        points=[]
        for i in range(12):
            a=i*math.pi/6
            r=51 if i%2==0 else 39
            points.append((x+math.cos(a)*r,y+math.sin(a)*r))
        pygame.draw.polygon(self.screen,"#ffb56b" if exposed else "#71639c",points)
        pygame.draw.polygon(self.screen,"#ffe0a6" if exposed else "#c5b8f5",points,4)
        pygame.draw.circle(self.screen,"#fff0bb" if exposed else "#c1a8ff",(x,y),12)
        self.draw_text("WARDEN",x,y-70,self.font,"#eee9ff",True)

    def draw_squad(self,member):
        x,y=self.world_to_screen(member["x"],member["y"])
        pygame.draw.circle(self.screen,member["color"],(x,y),13,2)
        pygame.draw.circle(self.screen,member["color"],(x,y),9)
        self.draw_text(member["name"],x,y-23,self.small,member["color"],True)

    def draw_player(self):
        p=self.player
        x,y=self.world_to_screen(p["x"],p["y"])
        color="#5de3c0" if p["invuln"]<=0 or int(p["invuln"]*18)%2 else "#d7fff1"
        pygame.draw.circle(self.screen,color,(x,y),15)
        pygame.draw.circle(self.screen,"#9affdf",(x,y),20,2)
        pygame.draw.line(self.screen,"#e7f2ef",(x,y),(x+math.cos(p["angle"])*29,y+math.sin(p["angle"])*29),5)

    def draw_minimap(self):
        width,height=self.screen.get_size()
        mw=min(150,int(width*.19));mh=int(mw*WORLD_H/WORLD_W)
        x,y=width-mw-18,24
        pygame.draw.rect(self.screen,"#07121ddd",(x-5,y-5,mw+10,mh+10))
        pygame.draw.rect(self.screen,self.stage.colors[8],(x-5,y-5,mw+10,mh+10),1)
        sx,sy=mw/WORLD_W,mh/WORLD_H
        for start,end in zip(self.stage.path,self.stage.path[1:]):
            pygame.draw.line(self.screen,self.stage.colors[2],
                             (x+start[0]*sx,y+start[1]*sy),(x+end[0]*sx,y+end[1]*sy),3)
        for pickup in self.pickups:
            pygame.draw.circle(self.screen,self.stage.colors[8],(int(x+pickup["x"]*sx),int(y+pickup["y"]*sy)),3)
        for member in self.squad:
            pygame.draw.circle(self.screen,member["color"],(int(x+member["x"]*sx),int(y+member["y"]*sy)),3)
        if self.boss:
            pygame.draw.circle(self.screen,"#ffb56b" if self.boss["vulnerable"]>0 else "#b8a4fa",(int(x+self.boss["x"]*sx),int(y+self.boss["y"]*sy)),4)
        target=self.current_target()
        pygame.draw.circle(self.screen,self.stage.colors[8],(int(x+target[0]*sx),int(y+target[1]*sy)),4)
        pygame.draw.circle(self.screen,"#fff4d7",(int(x+self.player["x"]*sx),int(y+self.player["y"]*sy)),3)

    def draw_hud(self):
        width,height=self.screen.get_size()
        pygame.draw.rect(self.screen,"#07121dcc",(0,0,width,86))
        self.draw_text("RELAY ZERO",20,15,self.title_font,"#5de3c0")
        self.draw_text(f"LEVEL {self.stage_index+1}/5  /  {self.stage.area}",20,53,self.small,"#b8c2c6")
        if self.boss:
            self.draw_text(f"WARDEN  /  {self.boss['hp']:.0f}%",width//2,14,self.small,"#eee9ff",True)
            pygame.draw.rect(self.screen,"#292338",(width//2-150,35,300,8))
            pygame.draw.rect(self.screen,"#ffb56b" if self.boss["vulnerable"]>0 else "#b8a4fa",
                             (width//2-150,35,int(300*self.boss["hp"]/self.boss["max_hp"]),8))
            state=("CORE EXPOSED" if self.boss["vulnerable"]>0 else
                   f"{self.boss['mode'].upper()} INCOMING" if self.boss["mode"] else
                   "BEAM SWEEP" if self.boss["beam"] else "CHARGING" if self.boss["rush"] else "ARMORED")
            self.draw_text(state,width//2,51,self.small,"#ffb56b" if self.boss["vulnerable"]>0 else "#b8a4fa",True)
        self.draw_text("VITALS",width-265,19,self.small,"#91a9ab")
        pygame.draw.rect(self.screen,"#344449",(width-265,43,170,10))
        pygame.draw.rect(self.screen,"#ff856d" if self.player["hp"]<35 else "#5de3c0",(width-265,43,int(170*self.player["hp"]/100),10))
        self.draw_text(f"{self.player['hp']:.0f}",width-85,39,self.small)
        objective=(f"{self.objective_index+1}/{len(self.stage.objectives)}  {self.stage.objectives[self.objective_index][0]}  ·  {self.stage_kills}/"+
                   str(self.stage.objectives[self.objective_index][3])) if self.objective_index<len(self.stage.objectives) else "REACH EXTRACTION"
        if self.extraction_time is not None:objective=f"EXTRACTION  /  HOLD ZONE  /  {self.extraction_time:.0f}s"
        self.draw_text(objective,width/2,102,self.small,self.stage.colors[8],True)
        self.draw_text(f"WEAPON  {WEAPONS[self.weapon_index]['name']}   [Q / LB-RB]",20,height-31,self.small,WEAPONS[self.weapon_index]["color"])
        hint="WASD MOVE · MOUSE AIM/FIRE · E USE · SPACE DASH · C COVER · Q WEAPON · ESC PAUSE"
        if self.joystick:hint=f"{self.joystick.get_name()} · LEFT STICK MOVE · RIGHT STICK AIM · A FIRE · B DASH · X COVER · Y USE"
        self.draw_text(hint,width/2,height-31,self.small,"#a8b7b6",True)
        if self.message_time>0:
            self.draw_text(self.message,width/2,height*.24,self.font,"#f1e8d2",True)

    def draw_overlay(self,title,subtitle,lines,button="ENTER TO DEPLOY"):
        width,height=self.screen.get_size()
        shade=pygame.Surface((width,height),pygame.SRCALPHA)
        shade.fill((3,9,13,215))
        self.screen.blit(shade,(0,0))
        pygame.draw.rect(self.screen,"#0d1d23",(width//2-290,height//2-190,580,380))
        pygame.draw.line(self.screen,"#5de3c0",(width//2-290,height//2-190),(width//2-290,height//2+190),3)
        self.draw_text(title,width//2,height//2-130,self.large,"#e8f4f1",True)
        self.draw_text(subtitle,width//2,height//2-78,self.small,"#5de3c0",True)
        for index,line in enumerate(lines):
            self.draw_text(line,width//2,height//2-28+index*27,self.small,"#b7c9c6",True)
        pygame.draw.rect(self.screen,"#5de3c0",(width//2-125,height//2+112,250,42))
        self.draw_text(button,width//2,height//2+133,self.font,"#07121a",True)

    def draw(self):
        self.draw_world()
        if self.mode=="playing":
            self.draw_hud()
        elif self.mode=="menu":
            self.draw_overlay("RELAY ZERO","FIVE SITES · ONE LAST EXTRACTION",
                              ["Lead Kite and Brick across five hostile zones.",
                               "Clear mission objectives; extract to advance.",
                               "The Warden waits at the Orbital Crown.",
                               "Controller supported · procedural music and art"])
        elif self.mode=="paused":
            self.draw_overlay("FIELD PAUSED",self.stage.area,["Mission progress is saved for this session."],"ENTER TO RESUME")
        elif self.mode=="won":
            self.draw_overlay("SIGNAL RESTORED","FIVE SITES SECURED · SQUAD EXTRACTED",
                              [f"{self.kills} hostiles neutralized",f"Mission time: {int(self.elapsed)} seconds"],"ENTER TO REDEPLOY")
        elif self.mode=="failed":
            self.draw_overlay("MISSION FAILED","OPERATOR DOWN",
                              [f"{self.kills} hostiles neutralized","Regroup and try another route."],"ENTER TO REDEPLOY")
        self.draw_minimap()
        pygame.display.flip()

    def run(self):
        self.init_inputs()
        while self.running:
            dt=self.clock.tick(FPS)/1000
            for event in pygame.event.get():
                self.handle_event(event)
            self.update(dt)
            self.draw()
        pygame.quit()


def main():
    try:
        Game().run()
    except pygame.error as error:
        print(f"Relay Zero could not start: {error}",file=sys.stderr)
        return 1
    return 0


if __name__=="__main__":
    raise SystemExit(main())
