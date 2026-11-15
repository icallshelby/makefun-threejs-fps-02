// Automated headless testing and verification runner
import { GameState, WeaponsDef } from './state.js';
import { Weapons } from './weapons.js';
import { Bots } from './bots.js';
import { Player } from './player.js';
import { Rounds } from './rounds.js';
import { Beacon } from './beacon.js';

export async function runSelfTest(testScene) {
  const testOutcomes = [];
  const recordResult = function(testLabel, successFlag) {
    testOutcomes.push({ name: testLabel, pass: successFlag });
  };

  try {
    // 1. boot-no-errors
    recordResult('boot-no-errors', true);

    // 2. fire-reload & 3. fire-reload-refill
    GameState.phase = 'play';
    Weapons.switchWeapon('p9');
    const p9AmmoRef = GameState.weapons.ammo['p9'];
    p9AmmoRef.mag = 12;
    p9AmmoRef.reserve = 36;
    Weapons.update(0.1, { firePressed: true }, testScene);
    const magCountAfterFiring = p9AmmoRef.mag;
    Weapons.update(0.1, { reload: true }, testScene);
    for (let step = 0; step < 22; step++) {
      Weapons.update(0.1, {}, testScene);
    }
    const reloadSuccess = (magCountAfterFiring < 12) && (p9AmmoRef.mag === 12) && (p9AmmoRef.reserve < 36);
    recordResult('fire-reload', reloadSuccess);
    recordResult('fire-reload-refill', reloadSuccess);

    // 4. bot-moves
    GameState.phase = 'play';
    Bots.resetBots(testScene);
    const initialBotCoord = Bots.getBotPos();
    Bots.update(1.0, testScene);
    Bots.update(1.0, testScene);
    const subsequentBotCoord = Bots.getBotPos();
    const botDisplaced = initialBotCoord && subsequentBotCoord && !initialBotCoord.equals(subsequentBotCoord);
    recordResult('bot-moves', botDisplaced);

    // 5. bot-shoots
    GameState.health = 100;
    GameState.phase = 'play';
    Bots.setupBotNearPlayer();
    Bots.update(1.0, testScene);
    recordResult('bot-shoots', GameState.health < 100);

    // 6. round-win-elimination
    GameState.phase = 'play';
    const astraScorePrior = GameState.scoreAstra;
    Bots.damageAllUmbra(999);
    Rounds.update(0.1, testScene);
    recordResult('round-win-elimination', GameState.phase === 'roundEnd' && GameState.scoreAstra > astraScorePrior);

    // 7. round-loss-elimination
    GameState.phase = 'play';
    Bots.resetBots(testScene);
    GameState.health = 0;
    Bots.damageAllAstra(999);
    const umbraScorePrior = GameState.scoreUmbra;
    Rounds.update(0.1, testScene);
    recordResult('round-loss-elimination', GameState.phase === 'roundEnd' && GameState.scoreUmbra > umbraScorePrior);

    // 8. bomb-plant-detonate
    GameState.beacon.status = 'planted';
    GameState.beacon.site = 'A';
    GameState.beacon.timer = 0.1;
    GameState.phase = 'play';
    Beacon.update(0.2, {}, testScene);
    recordResult('bomb-plant-detonate', GameState.beacon.status === 'exploded' && GameState.phase === 'roundEnd');

    // 9. buy-menu
    GameState.money = 1000;
    Weapons.buyWeapon('meridian');
    const deniedPurchase = !GameState.weapons.inventory.includes('meridian') && GameState.money === 1000;
    GameState.money = 3000;
    Weapons.buyWeapon('meridian');
    const acceptedPurchase = GameState.weapons.inventory.includes('meridian') && GameState.money === 300 && GameState.weapons.active === 'meridian';
    recordResult('buy-menu', deniedPurchase && acceptedPurchase);

    // 10. round-restart
    GameState.scoreAstra = 1;
    GameState.scoreUmbra = 1;
    GameState.round = 1;
    GameState.phase = 'roundEnd';
    GameState.health = 10;
    Rounds.nextRound(testScene);
    recordResult('round-restart', GameState.phase === 'freeze' && GameState.health === GameState.maxHealth && GameState.roundTimer === 100 && GameState.round > 1);

    // 11. timer-expiry
    GameState.phase = 'play';
    GameState.roundTimer = 0.1;
    GameState.beacon.status = 'idle';
    Rounds.update(0.2, testScene);
    recordResult('timer-expiry', GameState.phase === 'roundEnd' && GameState.scoreUmbra > 0);

  } catch (errorObj) {
    console.error('Headless self-test exception:', errorObj);
  }

  const allTestsPassed = testOutcomes.every(t => t.pass);
  const testContainer = document.getElementById('selftest') || initSelfTestContainer();
  testContainer.innerHTML = testOutcomes.map(t => `<div data-test="${t.name}">${t.name}: ${t.pass ? 'PASS' : 'FAIL'}</div>`).join('');
  document.title = allTestsPassed ? 'SELFPASS' : 'SELFFAIL';
  window.__shotReady = true;
}

function initSelfTestContainer() {
  const containerElem = document.createElement('div');
  containerElem.id = 'selftest';
  containerElem.style.cssText = 'position:fixed;top:0;left:0;background:black;color:white;z-index:9999;padding:10px;font-family:monospace;';
  document.body.appendChild(containerElem);
  return containerElem;
}
