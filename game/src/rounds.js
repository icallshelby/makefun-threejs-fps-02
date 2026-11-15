// Round progression, win conditions, and match economy
import { GameState, Store } from './state.js';
import { Player } from './player.js';
import { Spawns } from './map.js';
import { Bots } from './bots.js';
import { AudioFX } from './audio.js';

export const Rounds = {
  update(dt, scene) {
    if (GameState.phase === 'freeze') {
      GameState.freezeTimer -= dt;
      if (GameState.freezeTimer <= 0) {
        GameState.freezeTimer = 0;
        GameState.phase = 'play';
      }
    } else if (GameState.phase === 'play') {
      GameState.roundTimer -= dt;
      if (GameState.roundTimer <= 0) {
        GameState.roundTimer = 0;
        // Defenders win if time expires without plant
        if (GameState.beacon.status !== 'planted' && GameState.beacon.status !== 'exploded') {
          GameState.scoreUmbra++;
          GameState.phase = 'roundEnd';
          AudioFX.playStinger(false);
        }
      }

      // Elimination victory checks
      const counts = Bots.getAliveCounts();
      if (counts.umbra === 0) {
        GameState.scoreAstra++;
        GameState.phase = 'roundEnd';
        AudioFX.playStinger(true);
      } else if (counts.astra === 0 && GameState.health <= 0) {
        GameState.scoreUmbra++;
        GameState.phase = 'roundEnd';
        AudioFX.playStinger(false);
      }
    }
  },

  nextRound(scene) {
    GameState.round++;
    if (GameState.round > GameState.maxRounds || GameState.scoreAstra >= 5 || GameState.scoreUmbra >= 5) {
      GameState.phase = 'matchEnd';
      return;
    }

    // Standard round award stipend
    GameState.money += 3250;

    Store.resetRound(true);
    Player.init(Spawns.astra[0]);
    Bots.resetBots(scene);
  }
};
