# Last Line

A browser and Windows desktop base-defense game.

## Play in a browser

Open `index.html` in a modern browser. No installation is required.

## Run the desktop app for development

With Node.js installed:

```powershell
npm install
npm start
```

## Build the shareable Windows app

```powershell
npm run dist
```

The standalone executable is created at `dist\Last-Line-1.1.0.exe`. Send that file to other Windows users; they do not need Node.js or Electron installed.

The executable is unsigned, so Windows SmartScreen may display a warning when it is first opened.

## Controls

- Mouse or touch: aim
- Hold click or touch: fire
- Space: fire with auto-aim
- P or Escape: pause/resume

## Weapons

Unlock and equip weapons between waves:

- **Rifle:** balanced single-shot weapon.
- **Cannon:** heavy shells with area splash damage and a slow fire rate.
- **Twin machine gun:** two barrels, rapid fire, and lower damage per bullet.
- **Sniper:** high-velocity rounds with high damage and three-target penetration.
- **Laser:** continuous, instant-hit beam. Gunnery skills increase its power; projectile skills do not apply.

## Skill trees

- **Gunnery:** three ranks each of bullet damage and fire rate.
- **Base:** three ranks each of maximum-health plating and engineering. Engineering adds damage resistance and repairs after each wave.
- **Projectile tech:** two ranks each of multishot, wall-bounce shots, and damage per meter traveled. One in-game meter is 100 pixels; the distance bonus is capped at +200%.
- Later ranks require the previous rank. Credits come from enemy takedowns and wave bonuses.
