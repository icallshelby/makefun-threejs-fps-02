// Combat hitscan raycasting, damage calculation, and kill feed
import * as THREE from 'three';
import { Player } from './player.js';
import { GameState } from './state.js';
import { AudioFX } from './audio.js';
import { Bots } from './bots.js';

export const KillFeed = [];

export function performHitscan(weaponDef) {
  const dir = new THREE.Vector3(
    Math.sin(Player.yaw) * Math.cos(Player.pitch),
    Math.sin(Player.pitch),
    Math.cos(Player.yaw) * Math.cos(Player.pitch)
  );
  // Add weapon spread deviation
  dir.x += (Math.random() - 0.5) * weaponDef.spread;
  dir.y += (Math.random() - 0.5) * weaponDef.spread;
  dir.z += (Math.random() - 0.5) * weaponDef.spread;
  dir.normalize();

  const origin = Player.pos.clone().add(new THREE.Vector3(0, Player.crouched ? 0.7 : 1.4, 0));

  // Raycast against bot colliders
  const hitResult = Bots.checkRaycast(origin, dir, 100);
  if (hitResult) {
    AudioFX.playHit();
    const hitmarkerEl = document.getElementById('hitmarker');
    if (hitmarkerEl) {
      hitmarkerEl.classList.add('on');
      setTimeout(() => hitmarkerEl.classList.remove('on'), 90);
    }

    let multiplier = 1.0;
    if (hitResult.part === 'head') multiplier = 4.0;
    else if (hitResult.part === 'legs') multiplier = 0.75;
    else if (hitResult.part === 'arms') multiplier = 0.85;

    const damage = Math.round(weaponDef.dmg * multiplier);
    const killed = Bots.damageBot(hitResult.botId, damage);
    if (killed) {
      AudioFX.playKill();
      GameState.stats.kills++;
      GameState.money += 300;
      KillFeed.unshift({ text: `You eliminated ${hitResult.botName}`, time: performance.now() });
      if (KillFeed.length > 5) KillFeed.pop();
    }
  }
}

export function damagePlayer(amount, sourceName = 'Enemy') {
  if (GameState.phase !== 'play') return;
  let finalDmg = amount;
  if (GameState.armor > 0) {
    const absorbed = Math.min(GameState.armor, Math.round(finalDmg * 0.5));
    GameState.armor -= absorbed;
    finalDmg -= absorbed;
  }
  GameState.health -= finalDmg;
  AudioFX.playHit();

  // Screen damage indicator
  const vignette = document.getElementById('vignette') || createVignette();
  vignette.style.opacity = '0.7';
  setTimeout(() => { vignette.style.opacity = '0'; }, 150);

  if (GameState.health <= 0) {
    GameState.health = 0;
    GameState.stats.deaths++;
    GameState.phase = 'roundEnd';
    GameState.killedBy = sourceName;
    KillFeed.unshift({ text: `${sourceName} eliminated You`, time: performance.now() });
  }
}

function createVignette() {
  const div = document.createElement('div');
  div.id = 'vignette';
  div.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle, transparent 50%, rgba(255,0,0,0.5));pointer-events:none;opacity:0;transition:opacity 100ms;z-index:99;';
  document.body.appendChild(div);
  return div;
}
