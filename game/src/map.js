// Halcyon Rooftop architecture and spatial topology module
import * as THREE from 'three';
import { Palette } from './palette.js';

export const Colliders = [];
export const Sites = {
  A: { name: 'Helipad', center: new THREE.Vector3(0, 0, -35), radius: 6 },
  B: { name: 'AC Plant', center: new THREE.Vector3(30, 0, 35), radius: 6 }
};

export const Spawns = {
  astra: [
    new THREE.Vector3(-30, 0, 35),
    new THREE.Vector3(-34, 0, 38),
    new THREE.Vector3(-26, 0, 38),
    new THREE.Vector3(-32, 0, 32),
    new THREE.Vector3(-28, 0, 32)
  ],
  umbra: [
    new THREE.Vector3(0, 0, -45),
    new THREE.Vector3(-6, 0, -42),
    new THREE.Vector3(6, 0, -42),
    new THREE.Vector3(-12, 0, -40),
    new THREE.Vector3(12, 0, -40)
  ]
};

export const Waypoints = [
  { id: 0, pos: new THREE.Vector3(-30, 0, 30), neighbors: [1, 2, 3], lane: 'start' },
  { id: 1, pos: new THREE.Vector3(-20, 0, 0), neighbors: [0, 4, 7], lane: 'A' },
  { id: 2, pos: new THREE.Vector3(0, 0, 10), neighbors: [0, 5, 8], lane: 'mid' },
  { id: 3, pos: new THREE.Vector3(20, 0, 25), neighbors: [0, 6, 9], lane: 'B' },
  { id: 4, pos: new THREE.Vector3(-10, 0, -20), neighbors: [1, 7, 10], lane: 'A' },
  { id: 5, pos: new THREE.Vector3(5, 0, -5), neighbors: [2, 8, 10], lane: 'mid' },
  { id: 6, pos: new THREE.Vector3(25, 0, 10), neighbors: [3, 9, 11], lane: 'B' },
  { id: 7, pos: new THREE.Vector3(-5, 0, -32), neighbors: [4, 10, 12], lane: 'A' }, // Near Site A
  { id: 8, pos: new THREE.Vector3(10, 0, -15), neighbors: [5, 10, 11], lane: 'mid' },
  { id: 9, pos: new THREE.Vector3(30, 0, 20), neighbors: [6, 11, 13], lane: 'B' }, // Near Site B
  { id: 10, pos: new THREE.Vector3(0, 0, -35), neighbors: [7, 8, 12], lane: 'A_site' }, // Site A Center
  { id: 11, pos: new THREE.Vector3(30, 0, 35), neighbors: [8, 9, 13], lane: 'B_site' }, // Site B Center
  { id: 12, pos: new THREE.Vector3(-15, 0, -42), neighbors: [7, 10], lane: 'umbra_spawn' },
  { id: 13, pos: new THREE.Vector3(25, 0, 42), neighbors: [9, 11], lane: 'astra_spawn' }
];

function buildSeedGenerator(initialVal) {
  let seedValue = initialVal;
  return function generatePseudoRandom() {
    seedValue += 0x6D2B79F5;
    let state = seedValue;
    state = Math.imul(state ^ state >>> 15, state | 1);
    state ^= state + Math.imul(state ^ state >>> 7, state | 61);
    return ((state ^ state >>> 14) >>> 0) / 4294967296;
  };
}

export function createMap(targetScene) {
  Colliders.length = 0;

  // Environment background and distance fog
  targetScene.background = new THREE.Color(Palette.canvas);
  targetScene.fog = new THREE.FogExp2(Palette.canvas, 0.006);

  // Illumination setup
  const envLight = new THREE.AmbientLight(Palette.moonlight, 1.4);
  targetScene.add(envLight);

  const directionalSun = new THREE.DirectionalLight(Palette.moonlight, 1.6);
  directionalSun.position.set(-40, 80, -30);
  targetScene.add(directionalSun);

  const lampA = new THREE.PointLight(Palette.sodium, 2, 50);
  lampA.position.set(0, 15, -35); // Site A
  targetScene.add(lampA);

  const lampB = new THREE.PointLight(Palette.sodium, 2, 50);
  lampB.position.set(30, 15, 35); // Site B
  targetScene.add(lampB);

  const glowCyan = new THREE.PointLight(Palette.accentAstra, 1.5, 30);
  glowCyan.position.set(-20, 5, 0);
  targetScene.add(glowCyan);

  const glowMagenta = new THREE.PointLight(Palette.accentUmbra, 1.5, 30);
  glowMagenta.position.set(20, 5, -10);
  targetScene.add(glowMagenta);

  // Lunar orb and celestial stars
  const moonDiscGeo = new THREE.CircleGeometry(12, 32);
  const moonDiscMat = new THREE.MeshBasicMaterial({ color: 0xddedff });
  const lunarBody = new THREE.Mesh(moonDiscGeo, moonDiscMat);
  lunarBody.position.set(-40, 100, -150);
  targetScene.add(lunarBody);

  const starFieldGeo = new THREE.BufferGeometry();
  const starCoords = [];
  const starRNG = buildSeedGenerator(42);
  for (let idx = 0; idx < 200; idx++) {
    const starX = (starRNG() - 0.5) * 300;
    const starY = 60 + starRNG() * 100;
    const starZ = (starRNG() - 0.5) * 300;
    starCoords.push(starX, starY, starZ);
  }
  starFieldGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 });
  const celestialStars = new THREE.Points(starFieldGeo, starMat);
  targetScene.add(celestialStars);

  // Central Roof Base Slab
  const slabGeo = new THREE.BoxGeometry(90, 1, 110);
  const slabMat = new THREE.MeshStandardMaterial({ color: Palette.concrete, roughness: 0.8 });
  const mainFloor = new THREE.Mesh(slabGeo, slabMat);
  mainFloor.position.set(0, -0.5, 0);
  mainFloor.receiveShadow = true;
  targetScene.add(mainFloor);

  // Edge perimeter barrier walls
  const perimeterMat = new THREE.MeshStandardMaterial({ color: Palette.metal, roughness: 0.5 });
  const constructBarrier = function(posX, posZ, width, depth, height = 3) {
    const boxGeo = new THREE.BoxGeometry(width, height, depth);
    const barrierMesh = new THREE.Mesh(boxGeo, perimeterMat);
    barrierMesh.position.set(posX, height / 2, posZ);
    targetScene.add(barrierMesh);
    Colliders.push(new THREE.Box3().setFromObject(barrierMesh));
  };

  constructBarrier(0, -56, 92, 2, 4); // North wall
  constructBarrier(0, 56, 92, 2, 4);  // South wall
  constructBarrier(-46, 0, 2, 114, 4); // West wall
  constructBarrier(46, 0, 2, 114, 4);  // East wall

  // Structural roof obstacles and tactical covers
  const propMaterial = new THREE.MeshStandardMaterial({ color: Palette.metal, roughness: 0.6 });
  const placeObstacle = function(posX, posZ, sizeX, sizeY, sizeZ) {
    const blockGeo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
    const blockMesh = new THREE.Mesh(blockGeo, propMaterial);
    blockMesh.position.set(posX, sizeY / 2, posZ);
    targetScene.add(blockMesh);
    Colliders.push(new THREE.Box3().setFromObject(blockMesh));
  };

  placeObstacle(-10, -10, 4, 3, 12);
  placeObstacle(10, 10, 4, 3, 12);
  placeObstacle(0, -25, 8, 2, 6); // Site A cover
  placeObstacle(25, 20, 6, 2.5, 6); // Site B cover
  placeObstacle(-25, 15, 5, 2, 8); // Vent run cover

  // Site A landing pad and grounded helicopter outline
  const padGeo = new THREE.CylinderGeometry(6, 6, 0.2, 32);
  const padMat = new THREE.MeshStandardMaterial({ color: Palette.surface, roughness: 0.4 });
  const landingPad = new THREE.Mesh(padGeo, padMat);
  landingPad.position.set(0, 0.05, -35);
  targetScene.add(landingPad);

  placeObstacle(-2, -35, 3, 2.5, 6); // Fuselage
  placeObstacle(-2, -35, 8, 0.4, 1); // Rotor blades

  // Reflective rooftop puddles
  const puddlePlaneGeo = new THREE.PlaneGeometry(12, 8);
  const puddlePlaneMat = new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 0.1, metalness: 0.9 });
  
  const puddleOne = new THREE.Mesh(puddlePlaneGeo, puddlePlaneMat);
  puddleOne.rotation.x = -Math.PI / 2;
  puddleOne.position.set(-15, 0.02, -5);
  targetScene.add(puddleOne);

  const puddleTwo = new THREE.Mesh(puddlePlaneGeo, puddlePlaneMat);
  puddleTwo.rotation.x = -Math.PI / 2;
  puddleTwo.position.set(15, 0.02, 10);
  targetScene.add(puddleTwo);

  // Background metropolitan skyline buildings with lit windows
  const skylineGroup = new THREE.Group();
  const skyscraperMat = new THREE.MeshBasicMaterial({ color: 0x0c1018 });
  const litWindowMat = new THREE.MeshBasicMaterial({ color: Palette.sodium });
  const cityRNG = buildSeedGenerator(7);

  for (let towerIdx = 0; towerIdx < 40; towerIdx++) {
    const bWidth = 8 + cityRNG() * 12;
    const bHeight = 40 + cityRNG() * 80;
    const bDepth = 8 + cityRNG() * 12;
    const radAngle = (towerIdx / 40) * Math.PI * 2;
    const radDist = 90 + cityRNG() * 40;
    const tCoordX = Math.cos(radAngle) * radDist;
    const tCoordZ = Math.sin(radAngle) * radDist;

    const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const skyscraper = new THREE.Mesh(bGeo, skyscraperMat);
    skyscraper.position.set(tCoordX, bHeight / 2 - 20, tCoordZ);
    skylineGroup.add(skyscraper);

    if (towerIdx % 2 === 0) {
      const paneGeo = new THREE.PlaneGeometry(bWidth * 0.6, bHeight * 0.7);
      const paneMesh = new THREE.Mesh(paneGeo, litWindowMat);
      const angleFacingCenter = Math.atan2(-tCoordZ, -tCoordX);
      paneMesh.rotation.y = angleFacingCenter + Math.PI / 2;
      paneMesh.position.set(
        tCoordX + Math.cos(angleFacingCenter) * (bDepth / 2 + 0.1),
        bHeight / 2 - 20,
        tCoordZ + Math.sin(angleFacingCenter) * (bDepth / 2 + 0.1)
      );
      skylineGroup.add(paneMesh);
    }
  }
  targetScene.add(skylineGroup);

  // Perimeter security neon border trace
  const borderPoints = [
    new THREE.Vector3(-45, 0.1, -55),
    new THREE.Vector3(45, 0.1, -55),
    new THREE.Vector3(45, 0.1, 55),
    new THREE.Vector3(-45, 0.1, 55),
    new THREE.Vector3(-45, 0.1, -55)
  ];
  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
  const borderMat = new THREE.LineBasicMaterial({ color: Palette.accentAstra });
  const perimeterLine = new THREE.Line(borderGeo, borderMat);
  targetScene.add(perimeterLine);
}
