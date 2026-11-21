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

The standalone executable is created at `dist\Last-Line-1.2.0.exe`. Send that file to other Windows users; they do not need Node.js or Electron installed.

The executable is unsigned, so Windows SmartScreen may display a warning when it is first opened.

## Controls

- Mouse or touch: aim
- Hold click or touch: fire
- Space: fire with auto-aim
- P or Escape: pause/resume; the pause menu provides Armory access
- Start next wave: use the button beside the Wave number after clearing a wave

## Weapons

Unlock and equip weapons between waves:

- **Rifle:** balanced single-shot weapon, available at gun level 1.
- **Cannon:** unlocks at gun level 5; heavy shells with area splash damage and a slow fire rate.
- **Twin machine gun:** unlocks at gun level 15; always fires parallel shots with visible muzzle flashes from both barrels, including with Focused Shot, with rapid fire and lower damage per bullet. Split Shot is locked while this weapon is equipped.
- **Sniper:** unlocks at gun level 25; high-velocity rounds with high damage and three-target penetration.
- **Laser:** unlocks at gun level 50; continuous, instant-hit beam. Gunnery skills increase its power; projectile skills do not apply.

All weapons can be unlocked by gun level 50.

Weapons require both the necessary gun level and a one-time gold unlock cost.

## Enemies and gun levels

- **Fast:** low health and high speed.
- **Tank:** appears from wave 20; slow armored enemy with high health and base damage.
- **Splitter:** creates five mini-enemies when destroyed.
- **Boss:** guaranteed every fifth wave, with high health, damage, gold, and XP. The first boss is named Butters, wears glasses, and has 26% less health than the standard boss scaling.
- **Ranged:** appears from wave 5; stops at firing distance and shoots visible projectiles at the base.
- **Shield:** appears from wave 15; projects a 110-pixel aura that reduces damage to itself and nearby allies by 55%.
- **Healer:** appears from wave 10; restores 12% health to the most injured nearby ally every 2.4 seconds.
- Kills grant gun XP. The maximum gun level is 100. Each level adds 3% gun damage and 1% firing speed, and each level requires more XP.
- Enemy health, damage, gold, and XP scale with both wave number and gun level. Enemies gain an additional 6% health every five waves. Enemy takedowns and wave bonuses award 0.75× gold.

## Skill trees

- **Gunnery:** 10 bullet-damage ranks (+1 each), 10 fire-rate ranks (+0.6 shots/sec each), 10 Single shot ranks, 10 Crit Chance ranks, and 10 Crit Amount ranks, for 50 total ranks. Each Single shot rank adds 50% projectile damage and multiplies fire rate by 0.8, with the fire-rate penalty compounding across ranks. Each Crit Chance rank adds 3% critical chance, reaching 30% at rank 10. Critical hits start at 150% damage, and each Crit Amount rank adds 25%, reaching 400% at rank 10. Critical hits apply to bullets and the Laser; critical bullets are pink. Focused Shot and Split Shot are mutually exclusive upgrade paths.
- **Base:** 10 ranks each of maximum-health plating and engineering, for 20 total ranks. Engineering adds damage resistance and repairs after each wave.
- **Projectile tech:** 10 Split Shot ranks, 10 Bounce Shot ranks, 10 Bounce Range ranks, 10 Explosive Rounds ranks, and 10 damage-per-meter ranks, for 50 total ranks. Split Shot is locked and inactive while the twin machine gun is equipped. When Split Shot is active on other weapons, the shot splits after traveling 120 pixels into 1 + Split Shot rank projectiles, with a 0.12-radian spread between shots. Each Split Shot rank multiplies projectile damage by 0.8. Bounce Shot replaces wall bouncing: after a full-damage first hit, the projectile redirects to the nearest enemy behind the hit enemy within range, and each bounced hit deals 60% of normal projectile damage. Each Bounce Shot rank adds one enemy bounce. Bounce Range starts at 140 pixels and adds 30 pixels per rank, reaching 440 pixels at rank 10. Explosive Rounds creates 50-pixel explosions and adds 10% splash damage per rank, stacking with the Cannon's existing splash damage. One in-game meter is 100 pixels, and each Longshot rank adds 0.15% damage per meter; the distance bonus is capped at +200%.
- **Laser tech:** 10 Penetration ranks and 10 Multi laser ranks, for 20 total ranks. The Laser must be equipped to purchase these upgrades. Each Penetration rank adds one target per beam, with 20% damage falloff per target. Each Multi laser rank adds a beam; secondary beams deal 45% damage.
- There are 140 total upgrades across 14 branches. Later ranks require only the previous rank and gold; there are no gun-level requirements. Rank-one upgrades cost 75 gold; later ranks cost 200 × their rank number (400, 600, and so on through rank 10 at 2,000 gold). Damage, fire-rate bonuses, plating health, and engineering repairs scale with gun level. Gold comes from enemy takedowns and wave bonuses. The Armory is available between waves and from the pause menu.
