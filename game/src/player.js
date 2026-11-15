// Player kinematics, view orientation, and collision handling
import * as THREE from 'three';
import { Colliders } from './map.js';
import { GameState } from './state.js';

export const Player = {
  pos: new THREE.Vector3(0, 0, 35),
  velocity: new THREE.Vector3(),
  yaw: 0,
  pitch: 0,
  speed: 7,
  sprintMult: 1.4,
  crouchMult: 0.5,
  jumpSpeed: 6,
  gravity: 20,
  isGrounded: true,
  crouched: false,
  sprinting: false,
  height: 1.6,
  crouchHeight: 0.9,
  radius: 0.4,
  recoilPitch: 0,
  recoilYaw: 0,

  init(spawnPos) {
    this.pos.copy(spawnPos);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.crouched = false;
    this.sprinting = false;
    this.recoilPitch = 0;
    this.recoilYaw = 0;
  },

  update(dt, input) {
    if (GameState.phase === 'menu' || GameState.phase === 'matchEnd' || (GameState.phase === 'roundEnd' && !GameState.selftest)) {
      return;
    }

    // Process mouse rotation deltas
    this.yaw -= input.dx * 0.002;
    this.pitch -= input.dy * 0.002;
    const maxPitch = Math.PI / 2 - 0.01;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    // Dampen firearm recoil over time
    this.recoilPitch *= Math.max(0, 1 - dt * 15);
    this.recoilYaw *= Math.max(0, 1 - dt * 15);

    // Compute directional movement vectors
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    if (input.forward) moveDir.add(forward);
    if (input.backward) moveDir.sub(forward);
    if (input.right) moveDir.add(right);
    if (input.left) moveDir.sub(right);
    moveDir.normalize();

    this.sprinting = input.shift && !this.crouched && (input.forward || input.left || input.right);
    this.crouched = input.ctrl;

    let currentSpeed = this.speed;
    if (this.sprinting) currentSpeed *= this.sprintMult;
    if (this.crouched) currentSpeed *= this.crouchMult;

    const targetVelX = moveDir.x * currentSpeed;
    const targetVelZ = moveDir.z * currentSpeed;

    // Smooth acceleration and braking
    const accel = this.isGrounded ? 15 : 5;
    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1, dt * accel);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1, dt * accel);

    // Vertical physics (gravity and jumping)
    if (this.isGrounded) {
      if (input.jump && !this.crouched) {
        this.velocity.y = this.jumpSpeed;
        this.isGrounded = false;
      } else {
        this.velocity.y = 0;
      }
    } else {
      this.velocity.y -= this.gravity * dt;
    }

    // Axis-separated collision detection against environment colliders
    const deltaPos = this.velocity.clone().multiplyScalar(dt);
    
    this.pos.x += deltaPos.x;
    if (this.checkCollision()) {
      this.pos.x -= deltaPos.x;
      this.velocity.x = 0;
    }

    this.pos.z += deltaPos.z;
    if (this.checkCollision()) {
      this.pos.z -= deltaPos.z;
      this.velocity.z = 0;
    }

    this.pos.y += deltaPos.y;
    if (this.pos.y <= 0) {
      this.pos.y = 0;
      this.isGrounded = true;
      this.velocity.y = 0;
    } else if (this.checkCollision()) {
      if (this.velocity.y < 0) {
        this.isGrounded = true;
      }
      this.pos.y -= deltaPos.y;
      this.velocity.y = 0;
    } else {
      this.isGrounded = false;
    }

    // World boundary limits
    this.pos.x = Math.max(-44, Math.min(44, this.pos.x));
    this.pos.z = Math.max(-54, Math.min(54, this.pos.z));
  },

  checkCollision() {
    const currentHeight = this.crouched ? this.crouchHeight : this.height;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(this.pos.x - this.radius, this.pos.y, this.pos.z - this.radius),
      new THREE.Vector3(this.pos.x + this.radius, this.pos.y + currentHeight, this.pos.z + this.radius)
    );

    for (let i = 0; i < Colliders.length; i++) {
      if (playerBox.intersectsBox(Colliders[i])) {
        return true;
      }
    }
    return false;
  },

  addRecoil(kickPitch, kickYaw) {
    this.recoilPitch += kickPitch;
    this.recoilYaw += (Math.random() - 0.5) * kickYaw;
    this.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.pitch + kickPitch));
    this.yaw += this.recoilYaw * 0.2;
  }
};
