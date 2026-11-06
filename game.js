'use strict';

const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');

const waveValue = document.querySelector('#wave-value');
const creditsValue = document.querySelector('#credits-value');
const killsValue = document.querySelector('#kills-value');
const gunLevelText = document.querySelector('#gun-level');
const xpText = document.querySelector('#xp-text');
const xpFill = document.querySelector('#xp-fill');
const healthText = document.querySelector('#health-text');
const healthFill = document.querySelector('#health-fill');
const pauseButton = document.querySelector('#pause-button');
const menuOverlay = document.querySelector('#menu-overlay');
const pauseOverlay = document.querySelector('#pause-overlay');
const upgradeOverlay = document.querySelector('#upgrade-overlay');
const gameoverOverlay = document.querySelector('#gameover-overlay');
const upgradeCredits = document.querySelector('#upgrade-credits');
const upgradeMessage = document.querySelector('#upgrade-message');
const repairCostText = document.querySelector('#repair-cost');
const repairButton = document.querySelector('#repair-button');
const gunBranches = document.querySelector('#gun-branches');
const baseBranches = document.querySelector('#base-branches');
const projectileBranches = document.querySelector('#projectile-branches');
const weaponGrid = document.querySelector('#weapon-grid');
const currentWeaponText = document.querySelector('#current-weapon');
const footerWeaponText = document.querySelector('#footer-weapon');
const weaponsPanel = document.querySelector('#weapons-panel');
const skillsPanel = document.querySelector('#skills-panel');
const armoryTabs = [...document.querySelectorAll('[data-armory-tab]')];

const BASE_HEALTH = 100;
const MAX_GUN_LEVEL = 100;
const PIXELS_PER_METER = 100;
const skillDefinitions = [
  { id: 'gun-damage-1', tree: 'gun', branch: 'Damage', stat: 'damage', rank: 1, requiredLevel: 1, name: 'High-Caliber I', description: '+1 bullet damage', cost: 30 },
  { id: 'gun-damage-2', tree: 'gun', branch: 'Damage', stat: 'damage', rank: 2, requiredLevel: 20, name: 'High-Caliber II', description: '+1 bullet damage', cost: 90 },
  { id: 'gun-damage-3', tree: 'gun', branch: 'Damage', stat: 'damage', rank: 3, requiredLevel: 55, name: 'High-Caliber III', description: '+1 bullet damage', cost: 180 },
  { id: 'gun-rate-1', tree: 'gun', branch: 'Fire rate', stat: 'rate', rank: 1, requiredLevel: 5, name: 'Rapid Fire I', description: '+0.9 base shots / second', cost: 40 },
  { id: 'gun-rate-2', tree: 'gun', branch: 'Fire rate', stat: 'rate', rank: 2, requiredLevel: 30, name: 'Rapid Fire II', description: '+0.9 base shots / second', cost: 110 },
  { id: 'gun-rate-3', tree: 'gun', branch: 'Fire rate', stat: 'rate', rank: 3, requiredLevel: 70, name: 'Rapid Fire III', description: '+0.9 base shots / second', cost: 220 },
  { id: 'base-plating-1', tree: 'base', branch: 'Plating', stat: 'plating', rank: 1, requiredLevel: 1, name: 'Reinforced I', description: '+20 base max health', cost: 40 },
  { id: 'base-plating-2', tree: 'base', branch: 'Plating', stat: 'plating', rank: 2, requiredLevel: 25, name: 'Reinforced II', description: '+20 base max health', cost: 100 },
  { id: 'base-plating-3', tree: 'base', branch: 'Plating', stat: 'plating', rank: 3, requiredLevel: 60, name: 'Reinforced III', description: '+20 base max health', cost: 200 },
  { id: 'base-engineering-1', tree: 'base', branch: 'Engineering', stat: 'engineering', rank: 1, requiredLevel: 10, name: 'Engineering I', description: '+6 base wave repair, +8% resist', cost: 50 },
  { id: 'base-engineering-2', tree: 'base', branch: 'Engineering', stat: 'engineering', rank: 2, requiredLevel: 40, name: 'Engineering II', description: '+6 base wave repair, +8% resist', cost: 120 },
  { id: 'base-engineering-3', tree: 'base', branch: 'Engineering', stat: 'engineering', rank: 3, requiredLevel: 80, name: 'Engineering III', description: '+6 base wave repair, +8% resist', cost: 250 },
  { id: 'projectile-multi-1', tree: 'projectile', branch: 'Multishot', stat: 'multishot', rank: 1, requiredLevel: 15, name: 'Multishot I', description: '+1 projectile per shot', cost: 75 },
  { id: 'projectile-multi-2', tree: 'projectile', branch: 'Multishot', stat: 'multishot', rank: 2, requiredLevel: 65, name: 'Multishot II', description: '+1 projectile per shot', cost: 180 },
  { id: 'projectile-bounce-1', tree: 'projectile', branch: 'Bounce shot', stat: 'bounce', rank: 1, requiredLevel: 25, name: 'Ricochet I', description: '+1 wall bounce', cost: 60 },
  { id: 'projectile-bounce-2', tree: 'projectile', branch: 'Bounce shot', stat: 'bounce', rank: 2, requiredLevel: 75, name: 'Ricochet II', description: '+1 wall bounce', cost: 160 },
  { id: 'projectile-distance-1', tree: 'projectile', branch: 'Damage / meter', stat: 'distance', rank: 1, requiredLevel: 35, name: 'Longshot I', description: '+20% damage per meter', cost: 70 },
  { id: 'projectile-distance-2', tree: 'projectile', branch: 'Damage / meter', stat: 'distance', rank: 2, requiredLevel: 90, name: 'Longshot II', description: '+20% damage per meter', cost: 170 }
];
const skillLevels = { damage: 0, rate: 0, plating: 0, engineering: 0, multishot: 0, bounce: 0, distance: 0 };
const skillNodes = new Map();
const weaponDefinitions = [
  { id: 'rifle', name: 'Rifle', icon: '●', cost: 0, requiredLevel: 1, description: 'Balanced single-shot rifle. Uses every projectile skill.', damageMultiplier: 1, rateMultiplier: 1, speed: 700, projectiles: 1, splash: 0, pierce: 1, radius: 4 },
  { id: 'cannon', name: 'Cannon', icon: '◉', cost: 100, requiredLevel: 5, description: 'Explosive splash damage and heavy shells, but slow firing.', damageMultiplier: 3.5, rateMultiplier: 0.38, speed: 520, projectiles: 1, splash: 70, pierce: 1, radius: 7 },
  { id: 'machinegun', name: 'Twin machine gun', icon: 'Ⅱ', cost: 200, requiredLevel: 20, description: 'Two barrels and rapid fire, with lower damage per bullet.', damageMultiplier: 0.55, rateMultiplier: 2.05, speed: 760, projectiles: 2, splash: 0, pierce: 1, radius: 3 },
  { id: 'sniper', name: 'Sniper', icon: '⌖', cost: 400, requiredLevel: 50, description: 'High damage and fast rounds that pierce up to three enemies.', damageMultiplier: 4.2, rateMultiplier: 0.3, speed: 1150, projectiles: 1, splash: 0, pierce: 3, radius: 3 },
  { id: 'laser', name: 'Laser', icon: '━', cost: 1000, requiredLevel: 100, description: 'Continuous instant beam. Gunnery skills boost it; projectile skills do not.', damagePerSecond: 5 }
];
const weaponNodes = new Map();
const unlockedWeapons = new Set(['rifle']);

let currentWeapon = 'rifle';
let nextEnemyId = 1;
let laserBeam = null;
let width = 900;
let height = 560;
let state = 'menu';
let wave = 1;
let credits = 0;
let kills = 0;
let gunLevel = 1;
let gunXP = 0;
let levelUpTimer = 0;
let bossSpawned = false;
let baseHealth = BASE_HEALTH;
let enemies = [];
let pendingSplits = [];
let bullets = [];
let particles = [];
let spawnRemaining = 0;
let spawnTimer = 0;
let fireCooldown = 0;
let firing = false;
let spaceFiring = false;
let screenShake = 0;
let lastTime = performance.now();

const player = { x: width / 2, y: height - 76, angle: -Math.PI / 2 };
const aim = { x: width / 2, y: 100 };

function resizeCanvas() {
  const rectangle = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = rectangle.width;
  height = rectangle.height;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  player.x = width / 2;
  player.y = height - 76;
  aim.x = width / 2;
  aim.y = Math.min(aim.y, player.y - 30);
}

function equippedWeapon() {
  return weaponDefinitions.find((weapon) => weapon.id === currentWeapon);
}

function xpRequired(level = gunLevel) {
  return 60 + (level - 1) * 45;
}

function gunLevelDamageMultiplier() {
  return 1 + (gunLevel - 1) * 0.06;
}

function enemyStrengthScale() {
  return 1 + (wave - 1) * 0.14 + (gunLevel - 1) * 0.05;
}

function enemyRewardScale() {
  return 1 + (wave - 1) * 0.18 + (gunLevel - 1) * 0.08;
}

function bulletDamage() {
  return (1 + skillLevels.damage) * gunLevelDamageMultiplier() * (equippedWeapon().damageMultiplier || 1);
}

function fireRate() {
  const skillScaling = 1 + (gunLevel - 1) * 0.01;
  return (4 + skillLevels.rate * 0.9 * skillScaling) * (equippedWeapon().rateMultiplier || 1);
}

function skillEffectScale() {
  return 1 + (gunLevel - 1) * 0.03;
}

function laserDamagePerSecond() {
  return equippedWeapon().damagePerSecond * (1 + skillLevels.damage) * gunLevelDamageMultiplier() * (1 + skillLevels.rate * 0.225);
}

function maxBaseHealth() {
  return Math.round(BASE_HEALTH + skillLevels.plating * 20 * skillEffectScale());
}

function baseDamageReduction() {
  return skillLevels.engineering * 0.08;
}

function waveRepairAmount() {
  return Math.round(skillLevels.engineering * 6 * skillEffectScale());
}

function gainExperience(amount) {
  if (gunLevel >= MAX_GUN_LEVEL) {
    gunXP = 0;
    updateHUD();
    return;
  }

  gunXP += amount;

  while (gunLevel < MAX_GUN_LEVEL && gunXP >= xpRequired()) {
    gunXP -= xpRequired();
    gunLevel += 1;
    levelUpTimer = 2.5;
  }

  if (gunLevel >= MAX_GUN_LEVEL) gunXP = 0;
  updateHUD();
}

function updateHUD() {
  waveValue.textContent = wave;
  creditsValue.textContent = credits;
  killsValue.textContent = kills;
  gunLevelText.textContent = gunLevel;
  xpText.textContent = gunLevel >= MAX_GUN_LEVEL ? 'MAX LEVEL' : `${Math.floor(gunXP)} / ${xpRequired()} XP`;
  xpFill.style.width = gunLevel >= MAX_GUN_LEVEL ? '100%' : `${Math.min(100, gunXP / xpRequired() * 100)}%`;
  footerWeaponText.textContent = `${equippedWeapon().name} · Lv. ${gunLevel}`;
  healthText.textContent = `${Math.ceil(baseHealth)} / ${maxBaseHealth()}`;
  healthFill.style.width = `${baseHealth / maxBaseHealth() * 100}%`;
  healthFill.style.background = baseHealth <= 30 ? '#ff6b6b' : '#58d68d';
}

function hideOverlays() {
  menuOverlay.hidden = true;
  pauseOverlay.hidden = true;
  upgradeOverlay.hidden = true;
  gameoverOverlay.hidden = true;
}

function startGame() {
  wave = 1;
  credits = 0;
  kills = 0;
  gunLevel = 1;
  gunXP = 0;
  levelUpTimer = 0;
  bossSpawned = false;
  baseHealth = BASE_HEALTH;
  currentWeapon = 'rifle';
  unlockedWeapons.clear();
  unlockedWeapons.add('rifle');
  nextEnemyId = 1;
  laserBeam = null;
  for (const stat of Object.keys(skillLevels)) skillLevels[stat] = 0;
  enemies = [];
  pendingSplits = [];
  bullets = [];
  particles = [];
  fireCooldown = 0;
  firing = false;
  spaceFiring = false;
  screenShake = 0;
  hideOverlays();
  startWave(1);
  canvas.focus({ preventScroll: true });
}

function startWave(number) {
  wave = number;
  spawnRemaining = 4 + wave * 2;
  bossSpawned = false;
  spawnTimer = 0.6;
  fireCooldown = 0;
  laserBeam = null;
  state = 'playing';
  hideOverlays();
  pauseButton.disabled = false;
  pauseButton.innerHTML = 'Pause <kbd>P</kbd>';
  updateHUD();
}

function scaleEnemy(enemy) {
  const strength = enemyStrengthScale();
  const rewards = enemyRewardScale();
  enemy.health = Math.ceil(enemy.health * strength);
  enemy.maxHealth = enemy.health;
  enemy.damage = Math.ceil(enemy.damage * (1 + (wave - 1) * 0.06 + (gunLevel - 1) * 0.02));
  enemy.reward = Math.round(enemy.reward * rewards);
  enemy.experience = Math.round(enemy.experience * rewards);
  return enemy;
}

function createEnemy(type, x = 28 + Math.random() * Math.max(1, width - 56), y = -28) {
  const enemy = {
    id: nextEnemyId,
    x,
    y,
    type,
    health: 2 + Math.floor((wave - 1) / 4),
    maxHealth: 2 + Math.floor((wave - 1) / 4),
    radius: 14,
    speed: 46 + wave * 2.5,
    damage: 8,
    reward: 10,
    experience: 10,
    color: '#ff6b6b'
  };

  if (type === 'fast') {
    enemy.health = 1 + Math.floor((wave - 1) / 5);
    enemy.radius = 10;
    enemy.speed = 88 + wave * 3;
    enemy.damage = 6;
    enemy.reward = 12;
    enemy.experience = 9;
    enemy.color = '#ffb454';
  } else if (type === 'tank') {
    enemy.health = 9 + wave * 2;
    enemy.radius = 21;
    enemy.speed = 30 + wave * 1.3;
    enemy.damage = 22;
    enemy.reward = 28;
    enemy.experience = 28;
    enemy.color = '#d94b4b';
  } else if (type === 'splitter') {
    enemy.health = 4 + Math.floor(wave / 2);
    enemy.radius = 17;
    enemy.speed = 43 + wave * 2;
    enemy.damage = 10;
    enemy.reward = 20;
    enemy.experience = 22;
    enemy.color = '#ff8c69';
  } else if (type === 'boss') {
    enemy.health = 55 + wave * 15;
    enemy.radius = 34;
    enemy.speed = 22 + wave;
    enemy.damage = 35;
    enemy.reward = 100 + wave * 5;
    enemy.experience = 150 + wave * 10;
    enemy.color = '#ff3b3b';
  } else if (type === 'mini') {
    enemy.health = 1;
    enemy.radius = 6;
    enemy.speed = 100 + wave * 3;
    enemy.damage = 2;
    enemy.reward = 2;
    enemy.experience = 3;
    enemy.color = '#ffc0a3';
  }

  return scaleEnemy(enemy);
}

function addEnemy(type, x, y) {
  const enemy = createEnemy(type, x, y);
  nextEnemyId += 1;
  enemies.push(enemy);
  return enemy;
}

function spawnEnemy() {
  const roll = Math.random();
  let type = 'standard';

  if (wave % 5 === 0 && !bossSpawned) {
    type = 'boss';
    bossSpawned = true;
  } else if (wave >= 3 && roll < 0.15) {
    type = 'splitter';
  } else if (wave >= 2 && roll < 0.32) {
    type = 'tank';
  } else if (roll < 0.55) {
    type = 'fast';
  }

  addEnemy(type);
}

function spawnMiniEnemies(splitter) {
  for (let index = 0; index < 5; index += 1) {
    const angle = index / 5 * Math.PI * 2;
    addEnemy('mini', splitter.x + Math.cos(angle) * 10, splitter.y + Math.sin(angle) * 10);
  }
}

function addParticles(x, y, color, count = 6, speed = 90) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.35 + Math.random() * 0.65);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 0.25 + Math.random() * 0.25,
      maxLife: 0.5,
      color
    });
  }
}

function shoot() {
  const weapon = equippedWeapon();
  const projectileCount = weapon.projectiles + skillLevels.multishot;
  const muzzleX = player.x + Math.cos(player.angle) * 34;
  const muzzleY = player.y + Math.sin(player.angle) * 34;

  for (let index = 0; index < projectileCount; index += 1) {
    const offset = index - (projectileCount - 1) / 2;
    const angle = player.angle + offset * 0.055;
    const perpendicularX = Math.cos(player.angle + Math.PI / 2) * offset * 5;
    const perpendicularY = Math.sin(player.angle + Math.PI / 2) * offset * 5;
    const x = muzzleX + perpendicularX;
    const y = muzzleY + perpendicularY;

    bullets.push({
      x,
      y,
      previousX: x,
      previousY: y,
      vx: Math.cos(angle) * weapon.speed,
      vy: Math.sin(angle) * weapon.speed,
      radius: weapon.radius,
      damage: bulletDamage(),
      distanceTraveled: 0,
      bouncesRemaining: skillLevels.bounce,
      hitsRemaining: weapon.pierce,
      splash: weapon.splash,
      hitEnemyIds: [],
      kind: weapon.id
    });
  }

  fireCooldown = 1 / fireRate();
  addParticles(muzzleX, muzzleY, '#ffd166', Math.min(6, projectileCount + 2), 45);
}

function autoAim() {
  if (enemies.length === 0) return;
  const target = enemies.reduce((closest, enemy) => enemy.y > closest.y ? enemy : closest);
  aim.x = target.x;
  aim.y = target.y;
}

function pointSegmentDistanceSquared(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return (px - x1) ** 2 + (py - y1) ** 2;
  const position = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return (px - (x1 + position * dx)) ** 2 + (py - (y1 + position * dy)) ** 2;
}

function projectileDamage(bullet) {
  const meters = bullet.distanceTraveled / PIXELS_PER_METER;
  const distanceBonus = Math.min(2, meters * skillLevels.distance * 0.2);
  return bullet.damage * (1 + distanceBonus);
}

function damageEnemyAtIndex(index, damage, hitX, hitY) {
  const enemy = enemies[index];
  if (!enemy) return;

  enemy.health -= damage;
  addParticles(hitX, hitY, enemy.color, 4, 65);

  if (enemy.health <= 0) {
    enemies.splice(index, 1);
    credits += enemy.reward;
    kills += 1;
    gainExperience(enemy.experience);
    addParticles(enemy.x, enemy.y, enemy.color, 10, 115);
    if (enemy.type === 'splitter') pendingSplits.push(enemy);
  }
}

function updateLaser(deltaTime) {
  const directionX = Math.cos(player.angle);
  const directionY = Math.sin(player.angle);
  const startX = player.x + directionX * 38;
  const startY = player.y + directionY * 38;
  let beamLength = Math.hypot(width, height);
  let targetId = null;

  if (directionX > 0) beamLength = Math.min(beamLength, (width - startX) / directionX);
  if (directionX < 0) beamLength = Math.min(beamLength, -startX / directionX);
  if (directionY > 0) beamLength = Math.min(beamLength, (height - startY) / directionY);
  if (directionY < 0) beamLength = Math.min(beamLength, -startY / directionY);

  for (const enemy of enemies) {
    const relativeX = enemy.x - startX;
    const relativeY = enemy.y - startY;
    const projection = relativeX * directionX + relativeY * directionY;
    if (projection < 0) continue;

    const perpendicularSquared = relativeX ** 2 + relativeY ** 2 - projection ** 2;
    const radiusSquared = enemy.radius ** 2;
    if (perpendicularSquared > radiusSquared) continue;

    const hitDistance = projection - Math.sqrt(radiusSquared - perpendicularSquared);
    if (hitDistance >= 0 && hitDistance < beamLength) {
      beamLength = hitDistance;
      targetId = enemy.id;
    }
  }

  const endX = startX + directionX * beamLength;
  const endY = startY + directionY * beamLength;
  laserBeam = { startX, startY, endX, endY };

  if (targetId !== null) {
    const targetIndex = enemies.findIndex((enemy) => enemy.id === targetId);
    if (targetIndex >= 0) damageEnemyAtIndex(targetIndex, laserDamagePerSecond() * deltaTime, endX, endY);
  }
}

function damageBase(enemy) {
  const damageTaken = Math.max(1, Math.round(enemy.damage * (1 - baseDamageReduction())));
  baseHealth = Math.max(0, baseHealth - damageTaken);
  addParticles(enemy.x, enemy.y, '#ff6b6b', 12, 130);
  screenShake = 8;
  updateHUD();
  if (baseHealth <= 0) endGame();
}

function endGame() {
  state = 'gameover';
  firing = false;
  spaceFiring = false;
  pauseButton.disabled = true;
  document.querySelector('#final-wave').textContent = wave;
  document.querySelector('#final-kills').textContent = kills;
  gameoverOverlay.hidden = false;
}

function showUpgrades() {
  state = 'upgrade';
  firing = false;
  spaceFiring = false;
  laserBeam = null;
  bullets = [];
  pauseButton.disabled = true;
  setArmoryTab('weapons');
  const waveBonus = 8 + wave * 2;
  const repaired = Math.min(waveRepairAmount(), maxBaseHealth() - baseHealth);
  credits += waveBonus;
  baseHealth += repaired;
  upgradeMessage.textContent = repaired > 0
    ? `Wave bonus: ${waveBonus} gold. Engineering restored ${repaired} health.`
    : `Wave bonus: ${waveBonus} gold. Choose a skill or save for later.`;
  updateHUD();
  updateUpgradeUI();
  upgradeOverlay.hidden = false;
}

function buildWeaponCards() {
  for (const weapon of weaponDefinitions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'weapon-card';
    button.dataset.weapon = weapon.id;
    button.innerHTML = `
      <span class="weapon-icon" aria-hidden="true">${weapon.icon}</span>
      <strong>${weapon.name}</strong>
      <span class="weapon-description">${weapon.description}</span>
      <span class="weapon-action">${weapon.cost} gold</span>
    `;
    button.addEventListener('click', () => selectWeapon(weapon.id));
    weaponNodes.set(weapon.id, button);
    weaponGrid.appendChild(button);
  }
}

function setArmoryTab(tab) {
  weaponsPanel.hidden = tab !== 'weapons';
  skillsPanel.hidden = tab !== 'skills';
  for (const button of armoryTabs) {
    const active = button.dataset.armoryTab === tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function updateWeaponUI() {
  currentWeaponText.textContent = equippedWeapon().name;

  for (const weapon of weaponDefinitions) {
    const button = weaponNodes.get(weapon.id);
    const unlocked = unlockedWeapons.has(weapon.id);
    const selected = currentWeapon === weapon.id;
    const levelLocked = !unlocked && gunLevel < weapon.requiredLevel;
    const unaffordable = !unlocked && !levelLocked && credits < weapon.cost;

    button.disabled = selected || levelLocked || unaffordable;
    button.classList.toggle('is-selected', selected);
    button.classList.toggle('is-unavailable', levelLocked || unaffordable);
    button.setAttribute('aria-pressed', String(selected));
    button.querySelector('.weapon-action').textContent = selected
      ? 'Equipped'
      : unlocked ? 'Equip' : levelLocked ? `Requires gun level ${weapon.requiredLevel}` : `Unlock · ${weapon.cost} gold`;
  }
}

function selectWeapon(weaponId) {
  if (state !== 'upgrade') return;
  const weapon = weaponDefinitions.find((item) => item.id === weaponId);
  if (!weapon) return;

  if (!unlockedWeapons.has(weaponId)) {
    if (gunLevel < weapon.requiredLevel || credits < weapon.cost) return;
    credits -= weapon.cost;
    unlockedWeapons.add(weaponId);
    upgradeMessage.textContent = `${weapon.name} unlocked and equipped.`;
  } else {
    upgradeMessage.textContent = `${weapon.name} equipped.`;
  }

  currentWeapon = weaponId;
  updateHUD();
  updateUpgradeUI();
}

function buildSkillTrees() {
  const trees = [
    { container: gunBranches, tree: 'gun', branches: ['Damage', 'Fire rate'] },
    { container: baseBranches, tree: 'base', branches: ['Plating', 'Engineering'] },
    { container: projectileBranches, tree: 'projectile', branches: ['Multishot', 'Bounce shot', 'Damage / meter'] }
  ];

  for (const tree of trees) {
    for (const branchName of tree.branches) {
      const branch = document.createElement('div');
      branch.className = 'skill-branch';
      const heading = document.createElement('h4');
      heading.textContent = branchName;
      branch.appendChild(heading);

      for (const skill of skillDefinitions.filter((item) => item.tree === tree.tree && item.branch === branchName)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'skill-node';
        button.dataset.skill = skill.id;
        button.innerHTML = `
          <span class="skill-rank">Rank ${skill.rank}</span>
          <strong>${skill.name}</strong>
          <span class="skill-description">${skill.description}</span>
          <span class="skill-cost">${skill.cost} gold</span>
        `;
        button.addEventListener('click', () => buySkill(skill.id));
        skillNodes.set(skill.id, button);
        branch.appendChild(button);
      }

      tree.container.appendChild(branch);
    }
  }
}

function updateUpgradeUI() {
  updateWeaponUI();
  upgradeCredits.textContent = credits;
  repairCostText.textContent = baseHealth >= maxBaseHealth() ? 'Base at full health' : '20 gold';
  repairButton.disabled = baseHealth >= maxBaseHealth() || credits < 20;

  for (const skill of skillDefinitions) {
    const button = skillNodes.get(skill.id);
    const currentLevel = skillLevels[skill.stat];
    const owned = currentLevel >= skill.rank;
    const locked = currentLevel < skill.rank - 1;
    const levelLocked = !owned && gunLevel < skill.requiredLevel;
    const unaffordable = !owned && !locked && !levelLocked && credits < skill.cost;

    button.disabled = owned || locked || levelLocked || unaffordable;
    button.classList.toggle('is-owned', owned);
    button.classList.toggle('is-locked', locked || levelLocked);
    button.classList.toggle('is-unaffordable', unaffordable);
    button.setAttribute('aria-pressed', String(owned));
    button.querySelector('.skill-cost').textContent = owned
      ? 'Owned'
      : locked ? `Requires rank ${skill.rank - 1}` : levelLocked ? `Gun level ${skill.requiredLevel}` : `${skill.cost} gold`;
  }
}

function buySkill(skillId) {
  if (state !== 'upgrade') return;
  const skill = skillDefinitions.find((item) => item.id === skillId);
  if (!skill || skillLevels[skill.stat] !== skill.rank - 1 || gunLevel < skill.requiredLevel || credits < skill.cost) return;

  credits -= skill.cost;
  skillLevels[skill.stat] += 1;

  if (skill.stat === 'plating') {
    baseHealth = Math.min(maxBaseHealth(), baseHealth + 20);
  }

  upgradeMessage.textContent = `${skill.name} unlocked: ${skill.description}.`;
  updateHUD();
  updateUpgradeUI();
}

function buyRepair() {
  if (state !== 'upgrade' || baseHealth >= maxBaseHealth() || credits < 20) return;
  credits -= 20;
  baseHealth = Math.min(maxBaseHealth(), baseHealth + 30);
  upgradeMessage.textContent = 'Field repairs restored 30 base health.';
  updateHUD();
  updateUpgradeUI();
}

function togglePause(forcePause = false) {
  if (state === 'playing') {
    state = 'paused';
    firing = false;
    spaceFiring = false;
    laserBeam = null;
    pauseOverlay.hidden = false;
    pauseButton.innerHTML = 'Resume <kbd>P</kbd>';
  } else if (state === 'paused' && !forcePause) {
    state = 'playing';
    pauseOverlay.hidden = true;
    pauseButton.innerHTML = 'Pause <kbd>P</kbd>';
    canvas.focus({ preventScroll: true });
  }
}

function update(deltaTime) {
  if (state !== 'playing') return;

  if (spaceFiring) autoAim();

  player.angle = Math.atan2(
    Math.min(aim.y, player.y - 20) - player.y,
    aim.x - player.x
  );

  fireCooldown = Math.max(0, fireCooldown - deltaTime);
  spawnTimer -= deltaTime;

  if (spawnRemaining > 0 && spawnTimer <= 0) {
    spawnEnemy();
    spawnRemaining -= 1;
    spawnTimer = Math.max(0.3, 0.85 - wave * 0.025) * (0.8 + Math.random() * 0.4);
  }

  laserBeam = null;
  if (firing || spaceFiring) {
    if (currentWeapon === 'laser') {
      updateLaser(deltaTime);
    } else if (fireCooldown <= 0) {
      shoot();
    }
  }

  for (let index = bullets.length - 1; index >= 0; index -= 1) {
    const bullet = bullets[index];
    bullet.previousX = bullet.x;
    bullet.previousY = bullet.y;
    bullet.x += bullet.vx * deltaTime;
    bullet.y += bullet.vy * deltaTime;
    bullet.distanceTraveled += Math.hypot(bullet.vx, bullet.vy) * deltaTime;

    if (bullet.bouncesRemaining > 0) {
      if ((bullet.x <= bullet.radius && bullet.vx < 0) || (bullet.x >= width - bullet.radius && bullet.vx > 0)) {
        bullet.vx *= -1;
        bullet.x = Math.max(bullet.radius, Math.min(width - bullet.radius, bullet.x));
        bullet.bouncesRemaining -= 1;
      }
      if (bullet.bouncesRemaining > 0 && bullet.y <= bullet.radius && bullet.vy < 0) {
        bullet.vy *= -1;
        bullet.y = bullet.radius;
        bullet.bouncesRemaining -= 1;
      }
    }

    if (bullet.x < -20 || bullet.x > width + 20 || bullet.y < -20 || bullet.y > height + 20) {
      bullets.splice(index, 1);
    }
  }

  for (let index = enemies.length - 1; index >= 0; index -= 1) {
    const enemy = enemies[index];
    const targetX = width / 2;
    const targetY = height - 28;
    const distance = Math.hypot(targetX - enemy.x, targetY - enemy.y);
    const step = enemy.speed * deltaTime;

    if (distance <= 42 + enemy.radius || distance <= step) {
      enemies.splice(index, 1);
      damageBase(enemy);
      if (state !== 'playing') return;
    } else {
      enemy.x += (targetX - enemy.x) / distance * step;
      enemy.y += (targetY - enemy.y) / distance * step;
    }
  }

  for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
    const bullet = bullets[bulletIndex];

    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      const enemy = enemies[enemyIndex];
      if (bullet.hitEnemyIds.includes(enemy.id)) continue;

      const distanceSquared = pointSegmentDistanceSquared(
        enemy.x,
        enemy.y,
        bullet.previousX,
        bullet.previousY,
        bullet.x,
        bullet.y
      );

      if (distanceSquared <= (bullet.radius + enemy.radius) ** 2) {
        const damage = projectileDamage(bullet);
        bullet.hitEnemyIds.push(enemy.id);
        damageEnemyAtIndex(enemyIndex, damage, bullet.x, bullet.y);

        if (bullet.splash > 0) {
          addParticles(bullet.x, bullet.y, '#ffb454', 18, 170);
          for (let splashIndex = enemies.length - 1; splashIndex >= 0; splashIndex -= 1) {
            const splashEnemy = enemies[splashIndex];
            const splashDistance = Math.hypot(splashEnemy.x - enemy.x, splashEnemy.y - enemy.y);
            if (splashEnemy.id !== enemy.id && splashDistance <= bullet.splash + splashEnemy.radius) {
              damageEnemyAtIndex(splashIndex, damage * 0.65, splashEnemy.x, splashEnemy.y);
            }
          }
        }

        bullet.hitsRemaining -= 1;
        if (bullet.hitsRemaining <= 0) bullets.splice(bulletIndex, 1);
        break;
      }
    }
  }

  if (pendingSplits.length > 0) {
    for (const splitter of pendingSplits) spawnMiniEnemies(splitter);
    pendingSplits = [];
  }

  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
    particle.life -= deltaTime;
    if (particle.life <= 0) particles.splice(index, 1);
  }

  screenShake = Math.max(0, screenShake - deltaTime * 30);
  levelUpTimer = Math.max(0, levelUpTimer - deltaTime);

  if (spawnRemaining === 0 && enemies.length === 0) showUpgrades();
}

function drawBase() {
  const baseX = width / 2;
  const baseY = height - 44;

  context.fillStyle = 'rgba(255, 107, 107, 0.04)';
  context.fillRect(0, height - 58, width, 58);
  context.strokeStyle = 'rgba(255, 107, 107, 0.18)';
  context.setLineDash([8, 10]);
  context.beginPath();
  context.moveTo(0, height - 58);
  context.lineTo(width, height - 58);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = '#26372b';
  context.fillRect(baseX - 62, baseY + 10, 124, 30);
  context.fillStyle = '#3c5844';
  context.fillRect(baseX - 50, baseY, 100, 34);
  context.fillStyle = '#58d68d';
  context.fillRect(baseX - 42, baseY + 7, 84, 4);
  context.fillStyle = '#17241b';
  context.fillRect(baseX - 16, baseY + 16, 32, 18);
  context.fillStyle = '#8ee6ae';
  context.font = '700 9px system-ui';
  context.textAlign = 'center';
  context.fillText('BASE', baseX, baseY - 7);
}

function drawPlayer() {
  context.save();
  context.translate(player.x, player.y);

  context.save();
  context.rotate(player.angle);
  context.fillStyle = '#8a9b90';

  if (currentWeapon === 'cannon') {
    context.fillRect(3, -9, 39, 18);
    context.fillStyle = '#c5d2c8';
    context.fillRect(33, -11, 13, 22);
  } else if (currentWeapon === 'machinegun') {
    context.fillRect(4, -10, 39, 6);
    context.fillRect(4, 4, 39, 6);
    context.fillStyle = '#c5d2c8';
    context.fillRect(36, -10, 11, 6);
    context.fillRect(36, 4, 11, 6);
  } else if (currentWeapon === 'sniper') {
    context.fillRect(3, -3, 56, 6);
    context.fillStyle = '#c5d2c8';
    context.fillRect(48, -2, 16, 4);
    context.fillStyle = '#58d68d';
    context.fillRect(17, -10, 15, 5);
  } else if (currentWeapon === 'laser') {
    context.fillRect(4, -6, 37, 12);
    context.fillStyle = '#58d68d';
    context.fillRect(34, -4, 13, 8);
  } else {
    context.fillRect(5, -5, 34, 10);
    context.fillStyle = '#c5d2c8';
    context.fillRect(31, -3, 12, 6);
  }

  context.restore();

  context.fillStyle = 'rgba(0, 0, 0, 0.3)';
  context.beginPath();
  context.ellipse(0, 12, 22, 9, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#58d68d';
  context.beginPath();
  context.arc(0, 0, 17, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#a2efbf';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, -2, 11, Math.PI, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawEnemy(enemy) {
  const radius = enemy.radius;
  context.save();
  context.translate(enemy.x, enemy.y);
  context.fillStyle = enemy.color;
  context.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  context.lineWidth = 2;

  if (enemy.type === 'fast') {
    context.beginPath();
    context.moveTo(0, radius + 3);
    context.lineTo(-radius, -radius);
    context.lineTo(radius, -radius);
    context.closePath();
    context.fill();
    context.stroke();
  } else if (enemy.type === 'tank') {
    context.fillRect(-radius, -radius * 0.72, radius * 2, radius * 1.44);
    context.strokeRect(-radius, -radius * 0.72, radius * 2, radius * 1.44);
    context.fillStyle = '#582727';
    context.fillRect(-radius - 4, -radius * 0.75, 6, radius * 1.5);
    context.fillRect(radius - 2, -radius * 0.75, 6, radius * 1.5);
    context.fillStyle = enemy.color;
    context.beginPath();
    context.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
    context.fill();
    context.fillRect(-3, 0, 6, radius + 10);
  } else {
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    if (enemy.type === 'splitter') {
      context.fillStyle = '#6b2d25';
      for (let index = 0; index < 5; index += 1) {
        const angle = index / 5 * Math.PI * 2 - Math.PI / 2;
        context.beginPath();
        context.arc(Math.cos(angle) * 8, Math.sin(angle) * 8, 2.5, 0, Math.PI * 2);
        context.fill();
      }
    } else if (enemy.type !== 'mini') {
      context.fillStyle = '#351717';
      context.beginPath();
      context.arc(-radius * 0.3, 2, 2, 0, Math.PI * 2);
      context.arc(radius * 0.3, 2, 2, 0, Math.PI * 2);
      context.fill();
    }
  }

  if (enemy.type === 'boss') {
    context.strokeStyle = '#ffb454';
    context.lineWidth = 4;
    context.beginPath();
    context.arc(0, 0, radius + 7, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = '#ffb454';
    context.font = '800 10px system-ui';
    context.textAlign = 'center';
    context.fillText('BOSS', 0, -radius - 15);
  }

  context.restore();
}

function render() {
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#0b120e';
  context.fillRect(0, 0, width, height);

  context.save();
  if (screenShake > 0) {
    context.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  context.strokeStyle = '#152019';
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  drawBase();

  for (const particle of particles) {
    context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    context.fillStyle = particle.color;
    context.fillRect(particle.x - 2, particle.y - 2, 4, 4);
  }
  context.globalAlpha = 1;

  if (laserBeam) {
    context.save();
    context.strokeStyle = 'rgba(88, 214, 141, 0.35)';
    context.lineWidth = 9;
    context.beginPath();
    context.moveTo(laserBeam.startX, laserBeam.startY);
    context.lineTo(laserBeam.endX, laserBeam.endY);
    context.stroke();
    context.strokeStyle = '#b9ffd2';
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = '#d9ffe5';
    context.beginPath();
    context.arc(laserBeam.endX, laserBeam.endY, 4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  for (const bullet of bullets) {
    context.strokeStyle = bullet.kind === 'cannon' ? '#ffb454' : bullet.kind === 'sniper' ? '#d9ffe5' : '#ffd166';
    context.lineWidth = bullet.kind === 'cannon' ? 6 : bullet.kind === 'sniper' ? 2 : 3;
    context.beginPath();
    context.moveTo(bullet.x, bullet.y);
    context.lineTo(bullet.x - bullet.vx * 0.012, bullet.y - bullet.vy * 0.012);
    context.stroke();

    if (bullet.kind === 'cannon') {
      context.fillStyle = '#ffb454';
      context.beginPath();
      context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  for (const enemy of enemies) {
    drawEnemy(enemy);

    if (enemy.type === 'boss' || enemy.health < enemy.maxHealth) {
      const barWidth = enemy.radius * 2;
      context.fillStyle = '#351717';
      context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 9, barWidth, 4);
      context.fillStyle = '#8ee6ae';
      context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 9, barWidth * Math.max(0, enemy.health / enemy.maxHealth), 4);
    }
  }

  drawPlayer();

  if (state === 'playing') {
    context.strokeStyle = 'rgba(142, 230, 174, 0.7)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(aim.x, Math.min(aim.y, player.y - 20), 8, 0, Math.PI * 2);
    context.moveTo(aim.x - 13, Math.min(aim.y, player.y - 20));
    context.lineTo(aim.x - 5, Math.min(aim.y, player.y - 20));
    context.moveTo(aim.x + 5, Math.min(aim.y, player.y - 20));
    context.lineTo(aim.x + 13, Math.min(aim.y, player.y - 20));
    context.stroke();
  }

  if (levelUpTimer > 0 && state === 'playing') {
    context.globalAlpha = Math.min(1, levelUpTimer);
    context.fillStyle = '#8ee6ae';
    context.font = '800 25px system-ui';
    context.textAlign = 'center';
    context.fillText(`GUN LEVEL ${gunLevel}`, width / 2, 65);
    if (weaponDefinitions.some((weapon) => weapon.requiredLevel === gunLevel)) {
      context.fillStyle = '#ffd166';
      context.font = '700 12px system-ui';
      context.fillText('NEW WEAPON AVAILABLE IN THE ARMORY', width / 2, 86);
    }
    context.globalAlpha = 1;
  }

  context.restore();
}

function pointerPosition(event) {
  const rectangle = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rectangle.left) * width / rectangle.width,
    y: (event.clientY - rectangle.top) * height / rectangle.height
  };
}

canvas.addEventListener('pointerdown', (event) => {
  if (state !== 'playing') return;
  const position = pointerPosition(event);
  aim.x = position.x;
  aim.y = position.y;
  firing = true;
  canvas.setPointerCapture(event.pointerId);
  canvas.focus({ preventScroll: true });
});

canvas.addEventListener('pointermove', (event) => {
  const position = pointerPosition(event);
  aim.x = position.x;
  aim.y = position.y;
});

canvas.addEventListener('pointerup', () => {
  firing = false;
});

canvas.addEventListener('pointercancel', () => {
  firing = false;
});

canvas.addEventListener('contextmenu', (event) => event.preventDefault());

document.querySelector('#start-button').addEventListener('click', startGame);
document.querySelector('#retry-button').addEventListener('click', startGame);
document.querySelector('#resume-button').addEventListener('click', () => togglePause());
document.querySelector('#next-wave-button').addEventListener('click', () => startWave(wave + 1));
pauseButton.addEventListener('click', () => togglePause());

repairButton.addEventListener('click', buyRepair);
for (const button of armoryTabs) {
  button.addEventListener('click', () => setArmoryTab(button.dataset.armoryTab));
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && state === 'playing') {
    event.preventDefault();
    spaceFiring = true;
  }

  if ((event.code === 'KeyP' || event.code === 'Escape') && !event.repeat) {
    if (state === 'playing' || state === 'paused') {
      event.preventDefault();
      togglePause();
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') spaceFiring = false;
});

window.addEventListener('blur', () => {
  firing = false;
  spaceFiring = false;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') togglePause(true);
});

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;
  update(deltaTime);
  render();
  requestAnimationFrame(gameLoop);
}

buildWeaponCards();
buildSkillTrees();
setArmoryTab('weapons');
updateWeaponUI();
new ResizeObserver(resizeCanvas).observe(canvas);
resizeCanvas();
updateHUD();
requestAnimationFrame(gameLoop);
