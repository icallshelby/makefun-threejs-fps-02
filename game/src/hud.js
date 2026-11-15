// On-Screen Display HUD synchronization and DOM binding
import { GameState, WeaponsDef } from './state.js';
import { KillFeed } from './combat.js';
import { Bots } from './bots.js';

export const HUD = {
  update() {
    const magDisplay = document.getElementById('ammo-mag');
    const reserveDisplay = document.getElementById('ammo-reserve');
    const scoreDisplay = document.getElementById('score-value');
    const aliveDisplay = document.getElementById('alive') || buildAliveNode();
    const moneyDisplay = document.getElementById('money-value') || buildMoneyNode();
    const healthDisplay = document.getElementById('health-value') || buildHealthNode();
    const timerDisplay = document.getElementById('timer-value') || buildTimerNode();
    const killfeedDisplay = document.getElementById('killfeed') || buildKillfeedNode();
    const shopModal = document.getElementById('buy-menu');

    const curGun = GameState.weapons.active;
    const bulletData = GameState.weapons.ammo[curGun];
    if (magDisplay && bulletData) magDisplay.textContent = bulletData.mag;
    if (reserveDisplay && bulletData) reserveDisplay.textContent = `/ ${bulletData.reserve}`;

    if (scoreDisplay) scoreDisplay.textContent = `${GameState.scoreAstra} - ${GameState.scoreUmbra}`;
    if (aliveDisplay) {
      const activeCounts = Bots.getAliveCounts();
      aliveDisplay.textContent = `ASTRA ${activeCounts.astra} · UMBRA ${activeCounts.umbra}`;
    }
    if (moneyDisplay) moneyDisplay.textContent = `$${GameState.money}`;
    if (healthDisplay) healthDisplay.textContent = `${GameState.health} HP (${GameState.armor} AP)`;

    if (timerDisplay) {
      const remainingSeconds = Math.ceil(GameState.phase === 'freeze' ? GameState.freezeTimer : GameState.roundTimer);
      const minVal = Math.floor(remainingSeconds / 60);
      const secVal = remainingSeconds % 60;
      timerDisplay.textContent = `${minVal.toString().padStart(2, '0')}:${secVal.toString().padStart(2, '0')}`;
    }

    if (shopModal) {
      shopModal.style.display = GameState.buyOpen ? 'grid' : 'none';
    }

    if (killfeedDisplay) {
      killfeedDisplay.innerHTML = KillFeed.slice(0, 5).map(item => `<div>${item.text}</div>`).join('');
    }
  }
};

function buildAliveNode() {
  const containerNode = document.createElement('div');
  containerNode.id = 'alive';
  containerNode.style.cssText = 'position:fixed;left:32px;top:48px;font-family:var(--font-readout);font-size:14px;color:var(--muted);';
  document.getElementById('hud').appendChild(containerNode);
  return containerNode;
}

function buildMoneyNode() {
  const containerNode = document.createElement('div');
  containerNode.id = 'money';
  containerNode.style.cssText = 'position:fixed;left:32px;bottom:52px;font-family:var(--font-readout);font-size:16px;color:var(--accent);';
  document.getElementById('hud').appendChild(containerNode);
  return containerNode;
}

function buildHealthNode() {
  const containerNode = document.createElement('div');
  containerNode.id = 'health';
  containerNode.style.cssText = 'position:fixed;left:32px;bottom:76px;font-family:var(--font-readout);font-size:16px;color:var(--ink);';
  document.getElementById('hud').appendChild(containerNode);
  return containerNode;
}

function buildTimerNode() {
  const containerNode = document.createElement('div');
  containerNode.id = 'timer';
  containerNode.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);font-family:var(--font-readout);font-size:24px;color:var(--ink);font-weight:bold;';
  document.getElementById('hud').appendChild(containerNode);
  return containerNode;
}

function buildKillfeedNode() {
  const containerNode = document.createElement('div');
  containerNode.id = 'killfeed';
  containerNode.style.cssText = 'position:fixed;right:32px;top:24px;font-family:var(--font-readout);font-size:13px;color:var(--muted);text-align:right;display:flex;flex-direction:column;gap:4px;';
  document.getElementById('hud').appendChild(containerNode);
  return containerNode;
}
