// SKYLINE Core Bootstrap and Main Game Loop
import * as THREE from 'three';
import { GameState } from './state.js';
import { createMap, Sites } from './map.js';
import { Player } from './player.js';
import { Weapons } from './weapons.js';
import { Bots } from './bots.js';
import { Rounds } from './rounds.js';
import { Beacon } from './beacon.js';
import { Effects } from './effects.js';
import { Viewmodel } from './viewmodel.js';
import { HUD } from './hud.js';
import { Input } from './input.js';
import { KillFeed } from './combat.js';
import { runSelfTest } from './selftest.js';

const rootContainer = document.getElementById('game');
const webGLRenderer = new THREE.WebGLRenderer({ antialias: true });
webGLRenderer.setSize(window.innerWidth, window.innerHeight);
webGLRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
rootContainer.appendChild(webGLRenderer.domElement);

const gameScene = new THREE.Scene();
const perspectiveCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
gameScene.add(perspectiveCam);

// Subsystem initialization sequence
createMap(gameScene);
Effects.init(gameScene);
Player.init(new THREE.Vector3(0, 0, 35));
Bots.init(gameScene);
Viewmodel.init(gameScene, perspectiveCam);
Input.init(rootContainer);

// Query parameter evaluation for screenshots or automated testing
const urlQueryParams = new URLSearchParams(window.location.search);
const activeShotParam = urlQueryParams.get('shot');
const activeSelftestParam = urlQueryParams.get('selftest');

if (activeSelftestParam) {
  GameState.selftest = true;
  runSelfTest(gameScene);
} else if (activeShotParam) {
  GameState.shotMode = activeShotParam;
  configureShotStaging(activeShotParam, gameScene, perspectiveCam);
}

function configureShotStaging(modeName, targetScene, activeCam) {
  GameState.phase = 'play';
  if (modeName === 'start') {
    Player.pos.set(0, 0, -8);
    Player.yaw = -0.25;
    Player.pitch = 0.12;
    document.getElementById('overlay').removeAttribute('hidden');
  } else if (modeName === 'play') {
    Player.pos.set(0, 0, 0);
    Player.yaw = 0;
    Player.pitch = 0;
    GameState.health = 82;
    GameState.scoreAstra = 2;
    GameState.scoreUmbra = 1;
    GameState.roundTimer = 83; // 01:23
    GameState.weapons.active = 'meridian';
    GameState.weapons.ammo['meridian'] = { mag: 24, reserve: 90 };
    document.getElementById('hitmarker').classList.add('on');

    KillFeed.unshift({ text: 'You eliminated Dusk', time: 0 });
    Bots.eliminateFirstUmbra();
    Bots.positionShotBots();

    Effects.spawnMuzzleFlash(activeCam, targetScene, true);
    const foundEnemyPos = Bots.getBotPos();
    if (foundEnemyPos) {
      const barrelTip = Player.pos.clone().add(new THREE.Vector3(0.28, 1.45, -1.0));
      const aimTarget = foundEnemyPos.clone().add(new THREE.Vector3(0, 1.0, 0));
      Effects.spawnTracer(barrelTip, aimTarget, targetScene, true);
    }
  } else if (modeName === 'buy') {
    GameState.buyOpen = true;
    GameState.money = 4650;
    GameState.freezeTimer = 12;
    GameState.phase = 'freeze';
  } else if (modeName === 'end') {
    Player.pos.set(0, 0, -15);
    Player.yaw = 0;
    Player.pitch = -0.05;
    GameState.scoreAstra = 3;
    GameState.scoreUmbra = 1;
    GameState.beacon.status = 'planted';
    GameState.beacon.site = 'A';
    const notificationBanner = document.createElement('div');
    notificationBanner.style.cssText = 'position:fixed;top:90px;left:0;right:0;text-align:center;font-size:28px;color:#00e5ff;font-family:monospace;z-index:999;font-weight:bold;';
    notificationBanner.textContent = 'ASTRA WINS THE ROUND';
    document.body.appendChild(notificationBanner);
    Effects.spawnSmoke(Sites.A.center, targetScene);
    const beaconBoxGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const beaconBoxMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.0 });
    const beaconBoxMesh = new THREE.Mesh(beaconBoxGeo, beaconBoxMat);
    beaconBoxMesh.position.copy(Sites.A.center);
    beaconBoxMesh.position.y += 0.6;
    targetScene.add(beaconBoxMesh);
  }
  window.__shotReady = true;
}

// 60 Hz fixed timestep ticker
const timestepFixed = 1 / 60;
let prevFrameTime = performance.now();
let timeAccumulator = 0;

function animationTicker(currentTimestamp) {
  requestAnimationFrame(animationTicker);

  const deltaSeconds = Math.min((currentTimestamp - prevFrameTime) / 1000, 0.1);
  prevFrameTime = currentTimestamp;

  if (!GameState.selftest && !GameState.shotMode) {
    timeAccumulator += deltaSeconds;
    while (timeAccumulator >= timestepFixed) {
      Player.update(timestepFixed, Input);
      Weapons.update(timestepFixed, Input, gameScene);
      Bots.update(timestepFixed, gameScene);
      Beacon.update(timestepFixed, Input, gameScene);
      Rounds.update(timestepFixed, gameScene);
      Effects.update(timestepFixed, gameScene);
      timeAccumulator -= timestepFixed;
    }
  }

  // Camera synchronization
  perspectiveCam.position.copy(Player.pos);
  perspectiveCam.position.y += Player.crouched ? 0.9 : 1.6;
  perspectiveCam.rotation.set(0, 0, 0, 'YXZ');
  perspectiveCam.rotation.y = Player.yaw;
  perspectiveCam.rotation.x = Player.pitch;

  Viewmodel.update(perspectiveCam);
  HUD.update();
  Input.clearFrame();

  webGLRenderer.render(gameScene, perspectiveCam);
}

requestAnimationFrame(animationTicker);

window.addEventListener('resize', () => {
  perspectiveCam.aspect = window.innerWidth / window.innerHeight;
  perspectiveCam.updateProjectionMatrix();
  webGLRenderer.setSize(window.innerWidth, window.innerHeight);
});
