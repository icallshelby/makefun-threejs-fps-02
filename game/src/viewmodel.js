// First-person firearm viewmodel construction and rendering
import * as THREE from 'three';
import { GameState, WeaponsDef } from './state.js';
import { Palette } from './palette.js';

let viewModelRoot = null;

export const Viewmodel = {
  init(renderScene, activeCamera) {
    viewModelRoot = new THREE.Group();
    viewModelRoot.position.set(0.28, -0.22, -0.7);

    // Main weapon receiver block
    const receiverGeo = new THREE.BoxGeometry(0.09, 0.11, 0.34);
    const receiverMat = new THREE.MeshStandardMaterial({
      color: Palette.metal,
      emissive: Palette.muted,
      emissiveIntensity: 0.4,
      roughness: 0.3
    });
    const mainBody = new THREE.Mesh(receiverGeo, receiverMat);
    mainBody.position.set(0, 0, 0);
    viewModelRoot.add(mainBody);

    // Forward barrel assembly
    const barrelGeo = new THREE.BoxGeometry(0.05, 0.05, 0.30);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x333b48,
      roughness: 0.3
    });
    const gunBarrel = new THREE.Mesh(barrelGeo, barrelMat);
    gunBarrel.position.set(0, 0.01, -0.30);
    viewModelRoot.add(gunBarrel);

    // Glowing front iron sight
    const sightGeo = new THREE.BoxGeometry(0.03, 0.05, 0.08);
    const sightMat = new THREE.MeshStandardMaterial({
      color: Palette.accentAstra,
      emissive: Palette.accentAstra,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });
    const opticFront = new THREE.Mesh(sightGeo, sightMat);
    opticFront.position.set(0, 0.08, -0.05);
    viewModelRoot.add(opticFront);

    activeCamera.add(viewModelRoot);
  },

  update(activeCamera) {
    if (!viewModelRoot) return;
    const equippedWeapon = GameState.weapons.active;
    const weaponConfig = WeaponsDef[equippedWeapon];
    if (weaponConfig) {
      viewModelRoot.visible = (GameState.phase === 'play' || GameState.phase === 'freeze');
    }
  }
};
