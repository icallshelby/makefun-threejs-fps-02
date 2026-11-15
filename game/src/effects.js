// Visual FX management including tracers, muzzle flashes, and smoke
import * as THREE from 'three';
import { Palette } from './palette.js';
import { AudioFX } from './audio.js';

const dormantParticles = [];
const liveParticles = [];

export const Effects = {
  init(renderScene) {
    // Populate particle recycling pool
    const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: Palette.sodium });
    for (let count = 0; count < 100; count++) {
      const meshElem = new THREE.Mesh(particleGeometry, particleMaterial);
      meshElem.visible = false;
      renderScene.add(meshElem);
      dormantParticles.push(meshElem);
    }
  },

  spawnExplosion(impactPoint, renderScene) {
    AudioFX.playExplosion();
    const blastLight = new THREE.PointLight(0xff5500, 5, 30);
    blastLight.position.copy(impactPoint);
    renderScene.add(blastLight);
    setTimeout(() => renderScene.remove(blastLight), 400);

    // Emit debris sparks
    for (let s = 0; s < 30; s++) {
      if (dormantParticles.length === 0) break;
      const sparkMesh = dormantParticles.pop();
      sparkMesh.position.copy(impactPoint);
      sparkMesh.visible = true;
      const particleVel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 12,
        (Math.random() - 0.5) * 12
      );
      liveParticles.push({ mesh: sparkMesh, vel: particleVel, life: 0.8, maxLife: 0.8 });
    }
  },

  spawnTracer(startPos, endPos, renderScene, keepPersistent = false) {
    const displacement = new THREE.Vector3().subVectors(endPos, startPos);
    const lengthVal = displacement.length();
    const tracerGeo = new THREE.CylinderGeometry(0.05, 0.05, lengthVal, 4);
    tracerGeo.rotateX(Math.PI / 2);
    const tracerMat = new THREE.MeshBasicMaterial({ color: 0xbffbff });
    const tracerMesh = new THREE.Mesh(tracerGeo, tracerMat);
    tracerMesh.position.copy(startPos).addScaledVector(displacement, 0.5);
    tracerMesh.lookAt(endPos);
    renderScene.add(tracerMesh);
    if (!keepPersistent) {
      setTimeout(() => renderScene.remove(tracerMesh), 60);
    }
  },

  spawnMuzzleFlash(activeCamera, renderScene, keepPersistent = false) {
    const flashPlaneGeo = new THREE.PlaneGeometry(0.12, 0.12);
    const flashPlaneMat = new THREE.MeshBasicMaterial({ color: 0xffffee, side: THREE.DoubleSide });
    const flashMesh = new THREE.Mesh(flashPlaneGeo, flashPlaneMat);
    flashMesh.position.set(0.28, -0.19, -1.18);
    activeCamera.add(flashMesh);
    const muzzleLight = new THREE.PointLight(0xffaa33, 2, 10);
    muzzleLight.position.set(0.28, -0.19, -1.18);
    activeCamera.add(muzzleLight);
    if (!keepPersistent) {
      setTimeout(() => {
        activeCamera.remove(flashMesh);
        activeCamera.remove(muzzleLight);
      }, 50);
    }
  },

  spawnSmoke(centerPos, renderScene) {
    for (let puff = 0; puff < 3; puff++) {
      const puffGeo = new THREE.SphereGeometry(1.5 + Math.random() * 0.5, 8, 8);
      const puffMat = new THREE.MeshBasicMaterial({
        color: 0x828c9b,
        transparent: true,
        opacity: 0.35
      });
      const smokeMesh = new THREE.Mesh(puffGeo, puffMat);
      smokeMesh.position.copy(centerPos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 2
      ));
      renderScene.add(smokeMesh);
      setTimeout(() => renderScene.remove(smokeMesh), 3000);
    }
  },

  update(deltaTime, renderScene) {
    for (let idx = liveParticles.length - 1; idx >= 0; idx--) {
      const activeEntry = liveParticles[idx];
      activeEntry.life -= deltaTime;
      if (activeEntry.life <= 0) {
        activeEntry.mesh.visible = false;
        dormantParticles.push(activeEntry.mesh);
        liveParticles.splice(idx, 1);
      } else {
        activeEntry.vel.y -= 15 * deltaTime;
        activeEntry.mesh.position.addScaledVector(activeEntry.vel, deltaTime);
      }
    }
  }
};
