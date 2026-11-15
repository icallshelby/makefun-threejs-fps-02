// Tactical Artificial Intelligence and Combatant Meshes
import * as THREE from 'three';
import { Palette } from './palette.js';
import { Waypoints, Spawns } from './map.js';
import { GameState } from './state.js';
import { Player } from './player.js';
import { damagePlayer } from './combat.js';

const activeBots = [];
const meshMap = new Map();

export const Bots = {
  init(renderScene) {
    activeBots.length = 0;
    meshMap.clear();

    const umbraRoster = ['Nova', 'Vega', 'Lyra', 'Orion', 'Cass'];
    const astraRoster = ['Rhea', 'Dusk', 'Halo', 'Zephyr'];

    // Instantiate Umbra adversary units
    for (let i = 0; i < 5; i++) {
      const startingPos = Spawns.umbra[i].clone();
      const combatant = {
        id: `umbra_${i}`,
        name: umbraRoster[i],
        team: 'umbra',
        pos: startingPos,
        vel: new THREE.Vector3(),
        health: 100,
        maxHealth: 100,
        targetWaypoint: 7,
        alive: true,
        lastShot: 0
      };
      activeBots.push(combatant);
      this.createMesh(combatant, renderScene);
    }

    // Instantiate Astra allied units
    for (let i = 0; i < 4; i++) {
      const startingPos = Spawns.astra[i + 1].clone();
      const combatant = {
        id: `astra_${i}`,
        name: astraRoster[i],
        team: 'astra',
        pos: startingPos,
        vel: new THREE.Vector3(),
        health: 100,
        maxHealth: 100,
        targetWaypoint: 1,
        alive: true,
        lastShot: 0
      };
      activeBots.push(combatant);
      this.createMesh(combatant, renderScene);
    }
  },

  createMesh(botRecord, targetScene) {
    const unitGroup = new THREE.Group();
    const teamColorTint = botRecord.team === 'umbra' ? Palette.accentUmbra : Palette.accentAstra;
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: teamColorTint,
      emissive: teamColorTint,
      emissiveIntensity: 0.7,
      roughness: 0.5
    });
    const capsuleGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const bodyMesh = new THREE.Mesh(capsuleGeometry, outerMaterial);
    bodyMesh.position.y = 1.0;
    unitGroup.add(bodyMesh);

    // Glowing head visor
    const visorGeo = new THREE.BoxGeometry(0.5, 0.15, 0.2);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 1.6, 0.35);
    unitGroup.add(visorMesh);

    unitGroup.position.copy(botRecord.pos);
    targetScene.add(unitGroup);
    meshMap.set(botRecord.id, unitGroup);
  },

  update(deltaTime, renderScene) {
    if (GameState.phase !== 'play' && GameState.phase !== 'freeze') return;

    const currentTimeSec = performance.now() / 1000;
    for (const botItem of activeBots) {
      if (!botItem.alive) continue;

      const visualNode = meshMap.get(botItem.id);
      if (visualNode) visualNode.position.copy(botItem.pos);

      // Navigate towards target waypoint
      const currentWP = Waypoints[botItem.targetWaypoint];
      if (currentWP) {
        const movementDir = new THREE.Vector3().subVectors(currentWP.pos, botItem.pos);
        const distanceToWP = movementDir.length();
        if (distanceToWP < 2.0) {
          const neighborList = currentWP.neighbors;
          if (neighborList && neighborList.length > 0) {
            botItem.targetWaypoint = neighborList[Math.floor(Math.random() * neighborList.length)];
          }
        } else {
          movementDir.normalize();
          botItem.pos.addScaledVector(movementDir, 3.5 * deltaTime);
        }
      }

      // Umbra attack logic against player
      if (botItem.team === 'umbra' && GameState.phase === 'play') {
        const distToUser = botItem.pos.distanceTo(Player.pos);
        if (distToUser < 25 && currentTimeSec - botItem.lastShot > 0.8) {
          botItem.lastShot = currentTimeSec;
          damagePlayer(15, botItem.name);
        }
      }
    }
  },

  checkRaycast(rayOrigin, rayDir, limitDist) {
    let hitResult = null;
    let closestDist = limitDist;

    for (const botItem of activeBots) {
      if (!botItem.alive) continue;
      const centerPos = botItem.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
      const vectorToBot = new THREE.Vector3().subVectors(centerPos, rayOrigin);
      const projection = vectorToBot.dot(rayDir);
      if (projection < 0 || projection > closestDist) continue;

      const pointOnRay = rayOrigin.clone().addScaledVector(rayDir, projection);
      const sqDist = pointOnRay.distanceToSquared(centerPos);
      if (sqDist < 0.6 * 0.6) {
        closestDist = projection;
        let hitBodyPart = 'torso';
        if (pointOnRay.y > botItem.pos.y + 1.4) hitBodyPart = 'head';
        else if (pointOnRay.y < botItem.pos.y + 0.6) hitBodyPart = 'legs';

        hitResult = {
          botId: botItem.id,
          botName: botItem.name,
          part: hitBodyPart,
          dist: projection
        };
      }
    }
    return hitResult;
  },

  damageBot(targetId, dmgValue) {
    const foundBot = activeBots.find(b => b.id === targetId);
    if (!foundBot || !foundBot.alive) return false;
    foundBot.health -= dmgValue;
    if (foundBot.health <= 0) {
      foundBot.health = 0;
      foundBot.alive = false;
      const nodeRef = meshMap.get(targetId);
      if (nodeRef) nodeRef.visible = false;
      return true;
    }
    return false;
  },

  eliminateFirstUmbra() {
    const targetUmbra = activeBots.find(b => b.team === 'umbra' && b.alive);
    if (targetUmbra) {
      targetUmbra.alive = false;
      targetUmbra.health = 0;
      const nodeRef = meshMap.get(targetUmbra.id);
      if (nodeRef) nodeRef.visible = false;
      return targetUmbra;
    }
    return null;
  },

  damageAllUmbra(dmgValue) {
    for (const botItem of activeBots) {
      if (botItem.team === 'umbra' && botItem.alive) {
        botItem.health = 0;
        botItem.alive = false;
        const nodeRef = meshMap.get(botItem.id);
        if (nodeRef) nodeRef.visible = false;
      }
    }
  },

  damageAllAstra(dmgValue) {
    for (const botItem of activeBots) {
      if (botItem.team === 'astra' && botItem.alive) {
        botItem.health = 0;
        botItem.alive = false;
        const nodeRef = meshMap.get(botItem.id);
        if (nodeRef) nodeRef.visible = false;
      }
    }
  },

  setupBotNearPlayer() {
    const targetBot = activeBots.find(b => b.team === 'umbra' && b.alive);
    if (targetBot) {
      targetBot.pos.copy(Player.pos).add(new THREE.Vector3(0, 0, -10));
      targetBot.lastShot = -10;
    }
  },

  getBotPos() {
    const targetBot = activeBots.find(b => b.team === 'umbra' && b.alive);
    return targetBot ? targetBot.pos.clone() : null;
  },

  positionShotBots() {
    const umbraArr = activeBots.filter(b => b.team === 'umbra');
    if (umbraArr[0]) {
      umbraArr[0].pos.set(-6, 0, -18);
      const mesh0 = meshMap.get(umbraArr[0].id);
      if (mesh0) mesh0.position.copy(umbraArr[0].pos);
    }
    if (umbraArr[1]) {
      umbraArr[1].pos.set(6, 0, -22);
      const mesh1 = meshMap.get(umbraArr[1].id);
      if (mesh1) mesh1.position.copy(umbraArr[1].pos);
    }
  },

  getAliveCounts() {
    const astraAliveCount = activeBots.filter(b => b.team === 'astra' && b.alive).length + (GameState.health > 0 ? 1 : 0);
    const umbraAliveCount = activeBots.filter(b => b.team === 'umbra' && b.alive).length;
    return { astra: astraAliveCount, umbra: umbraAliveCount };
  },

  resetBots(renderScene) {
    for (let idx = 0; idx < activeBots.length; idx++) {
      const record = activeBots[idx];
      record.alive = true;
      record.health = record.maxHealth;
      if (record.team === 'umbra') {
        record.pos.copy(Spawns.umbra[idx % Spawns.umbra.length]);
      } else {
        record.pos.copy(Spawns.astra[(idx + 1) % Spawns.astra.length]);
      }
      const nodeRef = meshMap.get(record.id);
      if (nodeRef) {
        nodeRef.visible = true;
        nodeRef.position.copy(record.pos);
      }
    }
  }
};
