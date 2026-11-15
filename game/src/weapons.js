// Weapon handling, firing cadence, reloads, and armory purchases
import { GameState, WeaponsDef, NadesDef } from './state.js';
import { AudioFX } from './audio.js';
import { performHitscan } from './combat.js';
import { Player } from './player.js';

let lastShotTime = 0;
let isReloading = false;
let reloadTimer = 0;

export const Weapons = {
  update(dt, input, scene) {
    if (isReloading) {
      reloadTimer -= dt;
      if (reloadTimer <= 0) {
        isReloading = false;
        const activeId = GameState.weapons.active;
        const def = WeaponsDef[activeId];
        const ammoData = GameState.weapons.ammo[activeId];
        if (def && ammoData) {
          const needed = def.mag - ammoData.mag;
          const available = Math.min(needed, ammoData.reserve);
          ammoData.mag += available;
          ammoData.reserve -= available;
        }
      }
      return;
    }

    if (input.reload) {
      const activeId = GameState.weapons.active;
      const def = WeaponsDef[activeId];
      const ammoData = GameState.weapons.ammo[activeId];
      if (def && ammoData && ammoData.mag < def.mag && ammoData.reserve > 0 && !isReloading) {
        isReloading = true;
        reloadTimer = 2.0;
        AudioFX.playReload();
      }
    }

    // Slot 1 and Slot 2 inventory selection
    if (input.slot1) Weapons.switchWeapon('p9');
    if (input.slot2) {
      const primaries = GameState.weapons.inventory.filter(id => id !== 'p9');
      if (primaries.length > 0) Weapons.switchWeapon(primaries[0]);
    }

    // Firing logic check
    const activeId = GameState.weapons.active;
    const def = WeaponsDef[activeId];
    const ammoData = GameState.weapons.ammo[activeId];
    const now = performance.now() / 1000;

    const canFire = def && ammoData && (def.auto ? input.fire : input.firePressed);
    if (canFire && now - lastShotTime >= def.rate) {
      if (ammoData.mag > 0) {
        ammoData.mag--;
        lastShotTime = now;
        AudioFX.playShot(activeId);
        Player.addRecoil(0.015 * (def.dmg / 30), 0.01);
        performHitscan(def);
      } else {
        AudioFX.playDryFire();
        lastShotTime = now + 0.2;
      }
    }
  },

  switchWeapon(id) {
    if (GameState.weapons.inventory.includes(id)) {
      GameState.weapons.active = id;
      if (!GameState.weapons.ammo[id]) {
        const def = WeaponsDef[id];
        GameState.weapons.ammo[id] = { mag: def.mag, reserve: def.reserve };
      }
    }
  },

  buyWeapon(id) {
    const def = WeaponsDef[id];
    if (!def) return;
    if (GameState.money >= def.price) {
      GameState.money -= def.price;
      if (!GameState.weapons.inventory.includes(id)) {
        GameState.weapons.inventory.push(id);
      }
      GameState.weapons.ammo[id] = { mag: def.mag, reserve: def.reserve };
      Weapons.switchWeapon(id);
      AudioFX.playBuy();
    }
  },

  buyArmor(type) {
    if (type === 'vest' && GameState.money >= 650) {
      GameState.money -= 650;
      GameState.armor = 50;
      AudioFX.playBuy();
    } else if (type === 'helmet' && GameState.money >= 350) {
      GameState.money -= 350;
      GameState.hasHelmet = true;
      AudioFX.playBuy();
    }
  },

  buyNade(id) {
    const def = NadesDef[id];
    if (!def) return;
    if (GameState.money >= def.price) {
      GameState.money -= def.price;
      GameState.weapons.nades[id] = (GameState.weapons.nades[id] || 0) + 1;
      AudioFX.playBuy();
    }
  }
};
