// Keyboard and mouse event capture with pointer lock management
import { GameState } from './state.js';
import { Weapons } from './weapons.js';

export const Input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  crouch: false,
  shift: false,
  fire: false,
  firePressed: false,
  reload: false,
  plant: false,
  slot1: false,
  slot2: false,
  dx: 0,
  dy: 0,

  init(domElement) {
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.right = true;
      if (e.code === 'Space') this.jump = true;
      if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'KeyC') this.crouch = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.shift = true;
      if (e.code === 'KeyR') this.reload = true;
      if (e.code === 'KeyE') this.plant = true;
      if (e.code === 'Digit1') this.slot1 = true;
      if (e.code === 'Digit2') this.slot2 = true;

      if (e.code === 'KeyB') {
        GameState.buyOpen = !GameState.buyOpen;
      }
      if (e.code === 'KeyM') {
        GameState.muted = !GameState.muted;
      }
    });

    window.addEventListener('keyup', e => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.right = false;
      if (e.code === 'Space') this.jump = false;
      if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'KeyC') this.crouch = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.shift = false;
      if (e.code === 'KeyR') this.reload = false;
      if (e.code === 'KeyE') this.plant = false;
      if (e.code === 'Digit1') this.slot1 = false;
      if (e.code === 'Digit2') this.slot2 = false;
    });

    window.addEventListener('mousedown', e => {
      if (e.button === 0) {
        this.fire = true;
        this.firePressed = true;
        if (GameState.phase === 'menu') {
          GameState.phase = 'freeze';
          domElement.requestPointerLock();
        }
      }
    });

    window.addEventListener('mouseup', e => {
      if (e.button === 0) {
        this.fire = false;
      }
    });

    window.addEventListener('mousemove', e => {
      if (document.pointerLockElement === domElement) {
        this.dx += e.movementX;
        this.dy += e.movementY;
      }
    });
  },

  clearFrame() {
    this.dx = 0;
    this.dy = 0;
    this.firePressed = false;
    this.reload = false;
  }
};
