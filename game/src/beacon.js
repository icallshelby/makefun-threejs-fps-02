// Beacon plant, defuse, and detonation state machine logic
import { GameState } from './state.js';
import { Sites } from './map.js';
import { Player } from './player.js';
import { AudioFX } from './audio.js';
import { Effects } from './effects.js';

export const Beacon = {
  update(dt, input, scene) {
    const b = GameState.beacon;
    if (b.status === 'exploded' || b.status === 'defused') return;

    if (b.status === 'planted') {
      b.timer -= dt;
      if (b.timer <= 0) {
        b.timer = 0;
        b.status = 'exploded';
        Effects.spawnExplosion(Sites[b.site].center, scene);
        GameState.scoreAstra += 1;
        GameState.phase = 'roundEnd';
      }
      return;
    }

    // Check player presence inside bomb sites A or B
    let inSite = null;
    for (const [siteKey, site] of Object.entries(Sites)) {
      if (Player.pos.distanceTo(site.center) <= site.radius) {
        inSite = siteKey;
        break;
      }
    }

    if (inSite && input.plant && b.status === 'idle') {
      b.status = 'planting';
      b.site = inSite;
      b.progress += dt;
      if (b.progress >= 4.0) {
        b.status = 'planted';
        b.progress = 4.0;
        AudioFX.playBeep(true);
        GameState.money += 300;
      }
    } else {
      if (b.status === 'planting') {
        b.status = 'idle';
        b.progress = 0;
        b.site = null;
      }
    }
  }
};
