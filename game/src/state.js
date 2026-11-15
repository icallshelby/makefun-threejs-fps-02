// Game state management and data definitions for Skyline
import * as THREE from 'three';

export const WeaponsDef = {
  p9: { id: 'p9', name: 'Sparrow P9', price: 0, mag: 12, reserve: 36, dmg: 26, rate: 0.15, spread: 0.02, auto: false, slot: 1 },
  cicada: { id: 'cicada', name: 'Cicada-9 SMG', price: 1500, mag: 28, reserve: 84, dmg: 20, rate: 0.08, spread: 0.035, auto: true, slot: 2 },
  meridian: { id: 'meridian', name: 'Meridian MR-5', price: 2700, mag: 30, reserve: 90, dmg: 34, rate: 0.12, spread: 0.012, auto: true, slot: 2 },
  nightowl: { id: 'nightowl', name: 'Nightowl .50', price: 4750, mag: 5, reserve: 15, dmg: 95, rate: 0.9, spread: 0.001, auto: false, slot: 2, scope: true },
  breach: { id: 'breach', name: 'Breach-12 Shotgun', price: 2100, mag: 6, reserve: 24, dmg: 12, count: 8, rate: 0.5, spread: 0.06, auto: false, slot: 2 },
};

export const NadesDef = {
  frag: { id: 'frag', name: 'Nova Frag', price: 300, slot: 4 },
  smoke: { id: 'smoke', name: 'Haze Smoke', price: 250, slot: 5 },
  flash: { id: 'flash', name: 'Blitz Flash', price: 200, slot: 6 }
};

export const GameState = {
  phase: 'menu', // 'menu', 'freeze', 'play', 'roundEnd', 'matchEnd'
  round: 1,
  maxRounds: 9,
  scoreAstra: 0,
  scoreUmbra: 0,
  roundTimer: 100,
  freezeTimer: 15,
  money: 800,
  health: 100,
  maxHealth: 100,
  armor: 0,
  hasHelmet: false,
  weapons: {
    active: 'p9',
    inventory: ['p9'],
    ammo: { p9: { mag: 12, reserve: 36 } },
    nades: { frag: 0, smoke: 0, flash: 0 }
  },
  beacon: {
    status: 'idle', // 'idle', 'planting', 'planted', 'defusing', 'exploded', 'defused'
    carrier: 'player', // 'player' or bot id
    site: null, // 'A' or 'B'
    progress: 0,
    timer: 40
  },
  stats: {
    kills: 0,
    deaths: 0,
    assists: 0
  },
  muted: false,
  killedBy: null,
  lossStreak: 0,
  buyOpen: false,
  shotMode: null,
  selftest: false
};

export const Store = {
  get() { return GameState; },
  resetRound(newRound = true) {
    if (newRound) {
      GameState.roundTimer = 100;
      GameState.freezeTimer = 15;
      GameState.phase = 'freeze';
    }
    GameState.health = GameState.maxHealth;
    GameState.beacon.status = 'idle';
    GameState.beacon.progress = 0;
    GameState.beacon.timer = 40;
    GameState.beacon.site = null;
    GameState.beacon.carrier = 'player';
  }
};
