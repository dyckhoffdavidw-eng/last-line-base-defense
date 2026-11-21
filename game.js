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
const upgradeEyebrow = document.querySelector('#upgrade-eyebrow');
const upgradeMessage = document.querySelector('#upgrade-message');
const nextWaveButton = document.querySelector('#next-wave-button');
const pauseArmoryButton = document.querySelector('#pause-armory-button');
const repairCostText = document.querySelector('#repair-cost');
const repairButton = document.querySelector('#repair-button');
const gunBranches = document.querySelector('#gun-branches');
const baseBranches = document.querySelector('#base-branches');
const projectileBranches = document.querySelector('#projectile-branches');
const laserBranches = document.querySelector('#laser-branches');
const weaponGrid = document.querySelector('#weapon-grid');
const currentWeaponText = document.querySelector('#current-weapon');
const footerWeaponText = document.querySelector('#footer-weapon');
const weaponsPanel = document.querySelector('#weapons-panel');
const skillsPanel = document.querySelector('#skills-panel');
const armoryTabs = [...document.querySelectorAll('[data-armory-tab]')];
const statsElements = {
  weapon: document.querySelector('#stats-weapon'),
  damage: document.querySelector('#stats-damage'),
  fireRate: document.querySelector('#stats-fire-rate'),
  critChance: document.querySelector('#stats-crit-chance'),
  critAmount: document.querySelector('#stats-crit-amount'),
  splitShot: document.querySelector('#stats-split-shot'),
  bounce: document.querySelector('#stats-bounce'),
  bounceRange: document.querySelector('#stats-bounce-range'),
  explosive: document.querySelector('#stats-explosive'),
  distance: document.querySelector('#stats-distance'),
  gunBonus: document.querySelector('#stats-gun-bonus'),
  maxHealth: document.querySelector('#stats-max-health'),
  resistance: document.querySelector('#stats-resistance'),
  waveRepair: document.querySelector('#stats-wave-repair')
};

const BASE_HEALTH = 100;
const MAX_GUN_LEVEL = 100;
const PIXELS_PER_METER = 100;
const GOLD_REWARD_MULTIPLIER = 0.75;
const BASE_BOUNCE_RANGE = 140;
const BOUNCE_RANGE_PER_RANK = 30;
const BOUNCE_DAMAGE_MULTIPLIER = 0.6;
const CRIT_CHANCE_PER_RANK = 0.03;
const BASE_CRIT_DAMAGE_MULTIPLIER = 1.5;
const CRIT_DAMAGE_PER_RANK = 0.25;
const EXPLOSIVE_ROUNDS_RADIUS = 50;
const EXPLOSIVE_DAMAGE_PER_RANK = 0.1;
const SKILL_RANKS_PER_BRANCH = 10;
const skillRankNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function defineSkillBranch(idPrefix, tree, branch, stat, name, description) {
  return Array.from({ length: SKILL_RANKS_PER_BRANCH }, (_, index) => {
    const rank = index + 1;
    return {
      id: `${idPrefix}-${rank}`,
      tree,
      branch,
      stat,
      rank,
      name: `${name} ${skillRankNumerals[index]}`,
      description,
      cost: rank === 1 ? 75 : rank * 200
    };
  });
}

const skillDefinitions = [
  // Gunnery: 5 branches with 10 ranks each
  ...defineSkillBranch('gun-damage', 'gun', 'Damage', 'damage', 'High-Caliber', '+1 bullet damage'),
  ...defineSkillBranch('gun-rate', 'gun', 'Fire rate', 'rate', 'Rapid Fire', '+0.6 base shots / second'),
  ...defineSkillBranch('gun-single', 'gun', 'Single shot', 'singleShot', 'Focused Shot', '+50% damage, -20% fire rate, no splitting'),
  ...defineSkillBranch('gun-crit-chance', 'gun', 'Crit chance', 'critChance', 'Crit Chance', '+3% critical chance'),
  ...defineSkillBranch('gun-crit-amount', 'gun', 'Crit amount', 'critAmount', 'Crit Amount', '+25% critical damage'),

  // Base: 2 branches with 10 ranks each
  ...defineSkillBranch('base-plating', 'base', 'Plating', 'plating', 'Reinforced', '+20 base max health'),
  ...defineSkillBranch('base-engineering', 'base', 'Engineering', 'engineering', 'Engineering', '+6 base wave repair, +8% resist'),

  // Projectile tech: 5 branches with 10 ranks each
  ...defineSkillBranch('projectile-multi', 'projectile', 'Split shot', 'multishot', 'Split Shot', '+1 projectile per split'),
  ...defineSkillBranch('projectile-bounce', 'projectile', 'Bounce shot', 'bounce', 'Bounce Shot', '+1 enemy bounce; bounced hits deal 60% damage'),
  ...defineSkillBranch('projectile-bounce-range', 'projectile', 'Bounce range', 'bounceRange', 'Bounce Range', '+30 bounce range'),
  ...defineSkillBranch('projectile-explosive', 'projectile', 'Explosive rounds', 'explosiveRounds', 'Explosive Rounds', '50 px explosion; +10% splash damage'),
  ...defineSkillBranch('projectile-distance', 'projectile', 'Damage / meter', 'distance', 'Longshot', '+0.15% damage per meter'),

  // Laser tech: 2 branches with 10 ranks each
  ...defineSkillBranch('laser-penetration', 'laser', 'Penetration', 'laserPenetration', 'Phase Piercer', '+1 target per beam; 20% damage falloff'),
  ...defineSkillBranch('laser-multi', 'laser', 'Multi laser', 'multiLaser', 'Split Emitter', '+1 beam; secondary beams deal 45% damage')
];
const skillLevels = { damage: 0, rate: 0, singleShot: 0, critChance: 0, critAmount: 0, plating: 0, engineering: 0, multishot: 0, bounce: 0, bounceRange: 0, explosiveRounds: 0, distance: 0, laserPenetration: 0, multiLaser: 0 };
const skillNodes = new Map();
const weaponDefinitions = [
  { id: 'rifle', name: 'Rifle', icon: '●', cost: 0, requiredLevel: 1, description: 'Balanced single-shot rifle. Uses every projectile skill.', damageMultiplier: 1, rateMultiplier: 1, speed: 700, projectiles: 1, splash: 0, pierce: 1, radius: 4 },
  { id: 'cannon', name: 'Cannon', icon: '◉', cost: 100, requiredLevel: 5, description: 'Explosive splash damage and heavy shells, but slow firing.', damageMultiplier: 3.5, rateMultiplier: 0.38, speed: 520, projectiles: 1, splash: 70, pierce: 1, radius: 7 },
  { id: 'machinegun', name: 'Twin machine gun', icon: 'Ⅱ', cost: 200, requiredLevel: 15, description: 'Two barrels and rapid fire, with lower damage per bullet.', damageMultiplier: 0.55, rateMultiplier: 2.05, speed: 760, projectiles: 2, splash: 0, pierce: 1, radius: 3 },
  { id: 'sniper', name: 'Sniper', icon: '⌖', cost: 400, requiredLevel: 25, description: 'High damage and fast rounds that pierce up to three enemies.', damageMultiplier: 4.2, rateMultiplier: 0.3, speed: 1150, projectiles: 1, splash: 0, pierce: 3, radius: 3 },
  { id: 'laser', name: 'Laser', icon: '━', cost: 1000, requiredLevel: 50, description: 'Continuous instant beam. Gunnery skills boost it; projectile skills do not.', damagePerSecond: 5 }
];
const weaponMuzzleDistances = {
  rifle: 50,
  cannon: 59,
  machinegun: 57,
  sniper: 75,
  laser: 62
};
const weaponNodes = new Map();
const unlockedWeapons = new Set(['rifle']);

let currentWeapon = 'rifle';
let nextEnemyId = 1;
let laserBeam = null;
let width = 900;
let height = 560;
let stars = [];
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
let enemyProjectiles = [];
let particles = [];
let spawnRemaining = 0;
let spawnTimer = 0;
let fireCooldown = 0;
let firing = false;
let spaceFiring = false;
let screenShake = 0;
let lastTime = performance.now();

const player = { x: width / 2, y: height - 62, angle: -Math.PI / 2 };
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
  player.y = height - 62;
  aim.x = width / 2;
  aim.y = Math.min(aim.y, player.y - 30);
  buildStarfield();
}

function equippedWeapon() {
  return weaponDefinitions.find((weapon) => weapon.id === currentWeapon);
}

function xpRequired(level = gunLevel) {
  return 60 + (level - 1) * 45;
}

function gunLevelDamageMultiplier() {
  return 1 + (gunLevel - 1) * 0.03;
}

function gunLevelFireRateMultiplier() {
  return 1 + (gunLevel - 1) * 0.01;
}

function enemyStrengthScale() {
  const fiveWaveBonus = Math.floor(wave / 5) * 0.06;
  return 1 + (wave - 1) * 0.12 + (gunLevel - 1) * 0.04 + fiveWaveBonus;
}

function enemyRewardScale() {
  return 1 + (wave - 1) * 0.18 + (gunLevel - 1) * 0.08;
}

function splitShotRank() {
  return currentWeapon === 'machinegun' ? 0 : skillLevels.multishot;
}

function criticalChance() {
  return skillLevels.critChance * CRIT_CHANCE_PER_RANK;
}

function criticalDamageMultiplier() {
  return BASE_CRIT_DAMAGE_MULTIPLIER + skillLevels.critAmount * CRIT_DAMAGE_PER_RANK;
}

function explosiveRoundsDamage() {
  return skillLevels.explosiveRounds * EXPLOSIVE_DAMAGE_PER_RANK;
}

function bulletDamage() {
  const splitShotDamageMultiplier = skillLevels.singleShot > 0 ? 1 : 0.8 ** splitShotRank();
  const singleShotDamageMultiplier = 1 + skillLevels.singleShot * 0.5;
  return (1 + skillLevels.damage) * gunLevelDamageMultiplier() * (equippedWeapon().damageMultiplier || 1) * splitShotDamageMultiplier * singleShotDamageMultiplier;
}

function fireRate() {
  const skillScaling = 1 + (gunLevel - 1) * 0.01;
  return (4 + skillLevels.rate * 0.6 * skillScaling) * (equippedWeapon().rateMultiplier || 1) * gunLevelFireRateMultiplier() * (0.8 ** skillLevels.singleShot);
}

function skillEffectScale() {
  return 1 + (gunLevel - 1) * 0.03;
}

function laserDamagePerSecond() {
  return equippedWeapon().damagePerSecond * (1 + skillLevels.damage * 0.5) * gunLevelDamageMultiplier() * (1 + skillLevels.rate * 0.15);
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

function formatStatValue(value) {
  return String(Number(value.toFixed(2)));
}

function updateStatsWindow() {
  const laserEquipped = currentWeapon === 'laser';
  const splitRank = splitShotRank();
  statsElements.weapon.textContent = equippedWeapon().name;
  statsElements.damage.textContent = laserEquipped ? `${formatStatValue(laserDamagePerSecond())}/s` : formatStatValue(bulletDamage());
  statsElements.fireRate.textContent = laserEquipped ? 'Continuous' : `${formatStatValue(fireRate())}/s`;
  statsElements.critChance.textContent = `${formatStatValue(criticalChance() * 100)}%`;
  statsElements.critAmount.textContent = `${formatStatValue(criticalDamageMultiplier() * 100)}%`;
  statsElements.splitShot.textContent = currentWeapon === 'machinegun' ? `Locked · Rank ${skillLevels.multishot}` : `Rank ${splitRank} · ${1 + splitRank} shot${splitRank > 0 ? 's' : ''}`;
  statsElements.bounce.textContent = `Rank ${skillLevels.bounce} · 60% damage`;
  statsElements.bounceRange.textContent = `${BASE_BOUNCE_RANGE + skillLevels.bounceRange * BOUNCE_RANGE_PER_RANK} px`;
  statsElements.explosive.textContent = skillLevels.explosiveRounds > 0 ? `${EXPLOSIVE_ROUNDS_RADIUS} px · ${formatStatValue(explosiveRoundsDamage() * 100)}%` : 'Off';
  statsElements.distance.textContent = `${formatStatValue(skillLevels.distance * 0.15)}%/m`;
  statsElements.gunBonus.textContent = `+${formatStatValue((gunLevelDamageMultiplier() - 1) * 100)}%`;
  statsElements.maxHealth.textContent = maxBaseHealth();
  statsElements.resistance.textContent = `${formatStatValue(baseDamageReduction() * 100)}%`;
  statsElements.waveRepair.textContent = waveRepairAmount();
}

function updateHUD() {
  waveValue.textContent = wave;
  creditsValue.textContent = credits;
  killsValue.textContent = kills;
  gunLevelText.textContent = gunLevel;
  const damageBonus = Math.round((gunLevelDamageMultiplier() - 1) * 1000) / 10;
  const fireRateBonus = Math.round((gunLevelFireRateMultiplier() - 1) * 10000) / 100;
  gunLevelText.title = `Level bonuses: +${damageBonus}% damage, +${fireRateBonus}% firing speed`;
  xpText.textContent = gunLevel >= MAX_GUN_LEVEL ? 'MAX LEVEL' : `${Math.floor(gunXP)} / ${xpRequired()} XP`;
  xpFill.style.width = gunLevel >= MAX_GUN_LEVEL ? '100%' : `${Math.min(100, gunXP / xpRequired() * 100)}%`;
  footerWeaponText.textContent = `${equippedWeapon().name} · Lv. ${gunLevel}`;
  healthText.textContent = `${Math.ceil(baseHealth)} / ${maxBaseHealth()}`;
  healthFill.style.width = `${baseHealth / maxBaseHealth() * 100}%`;
  healthFill.style.background = baseHealth <= 30 ? '#ff6b6b' : '#58d68d';
  updateStatsWindow();
}

function hideOverlays() {
  menuOverlay.hidden = true;
  pauseOverlay.hidden = true;
  upgradeOverlay.hidden = true;
  gameoverOverlay.hidden = true;
  nextWaveButton.hidden = true;
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
  enemyProjectiles = [];
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
  enemyProjectiles = [];
  state = 'playing';
  hideOverlays();
  pauseButton.disabled = false;
  pauseButton.innerHTML = 'Pause <kbd>P</kbd>';
  updateHUD();
}

function scaleEnemy(enemy) {
  const strength = enemyStrengthScale();
  const rewards = enemyRewardScale();
  const miniStrengthMultiplier = enemy.type === 'mini' ? 0.5 : 1;
  const firstBossHealthMultiplier = enemy.type === 'boss' && wave === 5 ? 0.74 : 1;
  enemy.health = Math.ceil(enemy.health * strength * miniStrengthMultiplier * firstBossHealthMultiplier);
  enemy.maxHealth = enemy.health;
  enemy.damage = Math.ceil(enemy.damage * (1 + (wave - 1) * 0.05 + (gunLevel - 1) * 0.015) * miniStrengthMultiplier);
  enemy.reward = Math.round(enemy.reward * rewards * GOLD_REWARD_MULTIPLIER);
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
    color: '#ff6b6b',
    abilityCooldown: 1.2,
    attackRange: 230,
    healPulse: 0,
    healTargetId: null
  };

  if (type === 'fast') {
    enemy.health = 1 + Math.floor((wave - 1) / 5);
    enemy.radius = 10;
    enemy.speed = (88 + wave * 3) * 1.35;
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
    enemy.name = wave === 5 ? 'Butters' : 'Boss';
    enemy.health = 55 + wave * 15;
    enemy.radius = 34;
    enemy.speed = 22 + wave;
    enemy.damage = 35;
    enemy.reward = 100 + wave * 5;
    enemy.experience = 150 + wave * 10;
    enemy.color = '#ff3b3b';
  } else if (type === 'healer') {
    enemy.health = 7 + wave;
    enemy.radius = 16;
    enemy.speed = 38 + wave * 1.4;
    enemy.damage = 6;
    enemy.reward = 26;
    enemy.experience = 26;
    enemy.color = '#57d6a2';
    enemy.abilityCooldown = 1.4;
  } else if (type === 'shield') {
    enemy.health = 14 + wave * 3;
    enemy.radius = 19;
    enemy.speed = 30 + wave * 1.1;
    enemy.damage = 12;
    enemy.reward = 34;
    enemy.experience = 32;
    enemy.color = '#5b9ff5';
    enemy.shieldRadius = 110;
  } else if (type === 'ranged') {
    enemy.health = 5 + wave;
    enemy.radius = 14;
    enemy.speed = 42 + wave * 1.6;
    enemy.damage = 7;
    enemy.reward = 24;
    enemy.experience = 22;
    enemy.color = '#ba8cff';
    enemy.abilityCooldown = 1.2;
    enemy.attackRange = 250;
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
  } else if (wave >= 10 && roll < 0.1) {
    type = 'healer';
  } else if (wave >= 15 && roll < 0.22) {
    type = 'shield';
  } else if (wave >= 5 && roll < 0.38) {
    type = 'ranged';
  } else if (wave >= 3 && roll < 0.52) {
    type = 'splitter';
  } else if (wave >= 20 && roll < 0.67) {
    type = 'tank';
  } else if (roll < 0.82) {
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
  const singleShotActive = skillLevels.singleShot > 0;
  const twinBarrelsActive = weapon.id === 'machinegun';
  const splitRank = splitShotRank();
  const projectileCount = twinBarrelsActive ? weapon.projectiles : singleShotActive || splitRank > 0 ? 1 : weapon.projectiles;
  const muzzleDistance = weaponMuzzleDistances[currentWeapon];
  const muzzleX = player.x + Math.cos(player.angle) * muzzleDistance;
  const muzzleY = player.y + Math.sin(player.angle) * muzzleDistance;

  for (let index = 0; index < projectileCount; index += 1) {
    const offset = index - (projectileCount - 1) / 2;
    const angle = twinBarrelsActive ? player.angle : player.angle + offset * 0.12;
    const perpendicularOffset = twinBarrelsActive ? (index === 0 ? -7.5 : 7.5) : 0;
    const perpendicularX = Math.cos(player.angle + Math.PI / 2) * perpendicularOffset;
    const perpendicularY = Math.sin(player.angle + Math.PI / 2) * perpendicularOffset;
    const x = muzzleX + perpendicularX;
    const y = muzzleY + perpendicularY;
    if (twinBarrelsActive) addParticles(x, y, '#ffd166', 4, 45);
    const critical = Math.random() < criticalChance();

    bullets.push({
      x,
      y,
      previousX: x,
      previousY: y,
      vx: Math.cos(angle) * weapon.speed,
      vy: Math.sin(angle) * weapon.speed,
      radius: weapon.radius,
      damage: bulletDamage() * (critical ? criticalDamageMultiplier() : 1),
      critical,
      distanceTraveled: 0,
      bouncesRemaining: skillLevels.bounce,
      bounceRange: BASE_BOUNCE_RANGE + skillLevels.bounceRange * BOUNCE_RANGE_PER_RANK,
      bounceCount: 0,
      hitsRemaining: weapon.pierce,
      splash: Math.max(weapon.splash, skillLevels.explosiveRounds > 0 ? EXPLOSIVE_ROUNDS_RADIUS : 0),
      splashDamageMultiplier: (weapon.splash > 0 ? 0.65 : 0) + explosiveRoundsDamage(),
      hitEnemyIds: [],
      kind: weapon.id,
      splitCount: singleShotActive ? 0 : splitRank,
      splitDistance: 120
    });
  }

  fireCooldown = 1 / fireRate();
  if (!twinBarrelsActive) addParticles(muzzleX, muzzleY, '#ffd166', Math.min(6, projectileCount + 2), 45);
}

function splitBulletIfReady(index) {
  const bullet = bullets[index];
  if (!bullet || !bullet.splitCount || bullet.distanceTraveled < bullet.splitDistance) return false;

  const fragmentCount = bullet.splitCount + 1;
  const currentAngle = Math.atan2(bullet.vy, bullet.vx);
  const speed = Math.hypot(bullet.vx, bullet.vy);
  const fragments = [];

  for (let fragmentIndex = 0; fragmentIndex < fragmentCount; fragmentIndex += 1) {
    const offset = fragmentIndex - (fragmentCount - 1) / 2;
    const fragmentAngle = currentAngle + offset * 0.12;
    fragments.push({
      ...bullet,
      previousX: bullet.x,
      previousY: bullet.y,
      vx: Math.cos(fragmentAngle) * speed,
      vy: Math.sin(fragmentAngle) * speed,
      hitEnemyIds: [...bullet.hitEnemyIds],
      splitCount: 0
    });
  }

  bullets.splice(index, 1, ...fragments);
  addParticles(bullet.x, bullet.y, '#9fd9ff', 7, 65);
  return true;
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
  const distanceBonus = Math.min(2, meters * skillLevels.distance * 0.0015);
  return bullet.damage * (1 + distanceBonus);
}

function findBounceTarget(bullet, hitEnemy) {
  const speed = Math.hypot(bullet.vx, bullet.vy);
  if (speed === 0) return null;
  const directionX = bullet.vx / speed;
  const directionY = bullet.vy / speed;
  let nearestTarget = null;
  let nearestDistance = Infinity;

  for (const candidate of enemies) {
    if (bullet.hitEnemyIds.includes(candidate.id)) continue;
    const dx = candidate.x - hitEnemy.x;
    const dy = candidate.y - hitEnemy.y;
    const distance = Math.hypot(dx, dy);
    const forwardDistance = dx * directionX + dy * directionY;
    if (distance === 0 || distance > bullet.bounceRange || forwardDistance <= 0 || distance >= nearestDistance) continue;
    nearestTarget = candidate;
    nearestDistance = distance;
  }

  return nearestTarget;
}

function bounceBulletToNextEnemy(bullet, hitEnemy) {
  if (bullet.bouncesRemaining <= 0) return false;
  const target = findBounceTarget(bullet, hitEnemy);
  if (!target) return false;

  const speed = Math.hypot(bullet.vx, bullet.vy);
  const dx = target.x - hitEnemy.x;
  const dy = target.y - hitEnemy.y;
  const distance = Math.hypot(dx, dy);
  bullet.x = hitEnemy.x;
  bullet.y = hitEnemy.y;
  bullet.previousX = hitEnemy.x;
  bullet.previousY = hitEnemy.y;
  bullet.vx = dx / distance * speed;
  bullet.vy = dy / distance * speed;
  bullet.bouncesRemaining -= 1;
  bullet.bounceCount += 1;
  addParticles(hitEnemy.x, hitEnemy.y, '#9fd9ff', 6, 70);
  return true;
}

function shieldProviderFor(enemy) {
  return enemies.find((candidate) => candidate.type === 'shield'
    && candidate.health > 0
    && Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y) <= candidate.shieldRadius);
}

function updateHealer(enemy, deltaTime) {
  enemy.abilityCooldown -= deltaTime;
  enemy.healPulse = Math.max(0, enemy.healPulse - deltaTime);
  if (enemy.healPulse === 0) enemy.healTargetId = null;
  if (enemy.abilityCooldown > 0) return;

  const target = enemies
    .filter((ally) => ally.id !== enemy.id && ally.health < ally.maxHealth
      && Math.hypot(ally.x - enemy.x, ally.y - enemy.y) <= 160)
    .sort((first, second) => first.health / first.maxHealth - second.health / second.maxHealth)[0];

  if (!target) {
    enemy.abilityCooldown = 0.2;
    return;
  }

  const healing = Math.max(1, Math.ceil(target.maxHealth * 0.12));
  target.health = Math.min(target.maxHealth, target.health + healing);
  enemy.abilityCooldown = 2.4;
  enemy.healPulse = 0.45;
  enemy.healTargetId = target.id;
  addParticles(target.x, target.y, '#83ffc6', 7, 55);
}

function fireEnemyProjectile(enemy) {
  const targetX = width / 2;
  const targetY = height - 42;
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const speed = 250;

  enemyProjectiles.push({
    x: enemy.x,
    y: enemy.y,
    previousX: enemy.x,
    previousY: enemy.y,
    vx: dx / distance * speed,
    vy: dy / distance * speed,
    damage: enemy.damage,
    life: 4
  });
  addParticles(enemy.x, enemy.y, '#d7b8ff', 4, 40);
}

function updateEnemyProjectiles(deltaTime) {
  for (let index = enemyProjectiles.length - 1; index >= 0; index -= 1) {
    const projectile = enemyProjectiles[index];
    projectile.previousX = projectile.x;
    projectile.previousY = projectile.y;
    projectile.x += projectile.vx * deltaTime;
    projectile.y += projectile.vy * deltaTime;
    projectile.life -= deltaTime;

    const reachedBase = projectile.y >= height - 58 && Math.abs(projectile.x - width / 2) <= 104;
    if (reachedBase) {
      enemyProjectiles.splice(index, 1);
      damageBase({ damage: projectile.damage }, projectile.x, projectile.y);
      if (state !== 'playing') return;
    } else if (projectile.life <= 0 || projectile.x < -40 || projectile.x > width + 40 || projectile.y > height + 40) {
      enemyProjectiles.splice(index, 1);
    }
  }
}

function damageEnemyAtIndex(index, damage, hitX, hitY) {
  const enemy = enemies[index];
  if (!enemy) return;

  const shieldProvider = shieldProviderFor(enemy);
  const appliedDamage = shieldProvider ? damage * 0.45 : damage;
  enemy.health -= appliedDamage;
  addParticles(hitX, hitY, shieldProvider ? '#8dc9ff' : enemy.color, 4, 65);

  if (enemy.health <= 0) {
    enemies.splice(index, 1);
    credits += enemy.reward;
    kills += 1;
    gainExperience(enemy.experience);
    addParticles(enemy.x, enemy.y, enemy.color, 10, 115);
    if (enemy.type === 'splitter') pendingSplits.push(enemy);
  }
}

function traceLaserBeam(angle, maxTargets) {
  const directionX = Math.cos(angle);
  const directionY = Math.sin(angle);
  const muzzleDistance = weaponMuzzleDistances.laser;
  const startX = player.x + directionX * muzzleDistance;
  const startY = player.y + directionY * muzzleDistance;
  let beamLength = Math.hypot(width, height);

  if (directionX > 0) beamLength = Math.min(beamLength, (width - startX) / directionX);
  if (directionX < 0) beamLength = Math.min(beamLength, -startX / directionX);
  if (directionY > 0) beamLength = Math.min(beamLength, (height - startY) / directionY);
  if (directionY < 0) beamLength = Math.min(beamLength, -startY / directionY);

  const hits = [];
  for (const enemy of enemies) {
    const relativeX = enemy.x - startX;
    const relativeY = enemy.y - startY;
    const projection = relativeX * directionX + relativeY * directionY;
    if (projection < 0) continue;

    const perpendicularSquared = relativeX ** 2 + relativeY ** 2 - projection ** 2;
    const radiusSquared = enemy.radius ** 2;
    if (perpendicularSquared > radiusSquared) continue;

    const hitDistance = projection - Math.sqrt(radiusSquared - perpendicularSquared);
    if (hitDistance >= 0 && hitDistance <= beamLength) {
      hits.push({ enemy, hitDistance });
    }
  }

  hits.sort((first, second) => first.hitDistance - second.hitDistance);
  const targets = hits.slice(0, maxTargets);
  if (targets.length === maxTargets && targets.length > 0) {
    beamLength = Math.min(beamLength, targets[targets.length - 1].hitDistance);
  }

  return {
    startX,
    startY,
    endX: startX + directionX * beamLength,
    endY: startY + directionY * beamLength,
    directionX,
    directionY,
    hits: targets
  };
}

function updateLaser(deltaTime) {
  const beamCount = 1 + skillLevels.multiLaser;
  const maxTargets = 1 + skillLevels.laserPenetration;
  const primaryIndex = Math.floor((beamCount - 1) / 2);
  const beams = [];

  for (let index = 0; index < beamCount; index += 1) {
    const offset = index - (beamCount - 1) / 2;
    const beam = traceLaserBeam(player.angle + offset * 0.09, maxTargets);
    beam.isPrimary = index === primaryIndex;
    beams.push(beam);
  }

  const primaryBeam = beams[primaryIndex];
  laserBeam = {
    startX: primaryBeam.startX,
    startY: primaryBeam.startY,
    endX: primaryBeam.endX,
    endY: primaryBeam.endY,
    beams
  };

  for (const beam of beams) {
    const critical = Math.random() < criticalChance();
    const beamDamage = laserDamagePerSecond() * deltaTime * (beam.isPrimary ? 1 : 0.45) * (critical ? criticalDamageMultiplier() : 1);
    for (let hitIndex = 0; hitIndex < beam.hits.length; hitIndex += 1) {
      const hit = beam.hits[hitIndex];
      const targetIndex = enemies.findIndex((enemy) => enemy.id === hit.enemy.id);
      if (targetIndex < 0) continue;
      const hitX = beam.startX + beam.directionX * hit.hitDistance;
      const hitY = beam.startY + beam.directionY * hit.hitDistance;
      damageEnemyAtIndex(targetIndex, beamDamage * 0.8 ** hitIndex, hitX, hitY);
    }
  }
}

function damageBase(enemy, hitX = enemy.x, hitY = enemy.y) {
  const damageTaken = Math.max(1, Math.round(enemy.damage * (1 - baseDamageReduction())));
  baseHealth = Math.max(0, baseHealth - damageTaken);
  addParticles(hitX, hitY, '#ff6b6b', 12, 130);
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

function isArmoryOpen() {
  return state === 'upgrade' || state === 'paused-armory';
}

function showUpgrades() {
  state = 'upgrade';
  firing = false;
  spaceFiring = false;
  laserBeam = null;
  bullets = [];
  enemyProjectiles = [];
  pauseButton.disabled = true;
  upgradeEyebrow.textContent = 'Wave cleared';
  nextWaveButton.textContent = 'Start next wave';
  nextWaveButton.hidden = false;
  setArmoryTab('weapons');
  const waveBonus = Math.round((8 + wave * 2) * GOLD_REWARD_MULTIPLIER);
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

function showPauseArmory() {
  if (state !== 'paused') return;
  state = 'paused-armory';
  pauseOverlay.hidden = true;
  upgradeEyebrow.textContent = 'Paused';
  nextWaveButton.textContent = 'Resume defense';
  nextWaveButton.hidden = false;
  upgradeMessage.textContent = 'Choose an upgrade, then resume the current wave.';
  setArmoryTab('weapons');
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
  if (!isArmoryOpen()) return;
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
    { container: gunBranches, tree: 'gun', branches: ['Damage', 'Fire rate', 'Single shot', 'Crit chance', 'Crit amount'] },
    { container: baseBranches, tree: 'base', branches: ['Plating', 'Engineering'] },
    { container: projectileBranches, tree: 'projectile', branches: ['Split shot', 'Bounce shot', 'Bounce range', 'Explosive rounds', 'Damage / meter'] },
    { container: laserBranches, tree: 'laser', branches: ['Penetration', 'Multi laser'] }
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

function skillPathLock(skill) {
  if (skill.stat === 'multishot' && currentWeapon === 'machinegun') return 'Twin machine gun';
  if (skill.stat === 'multishot' && skillLevels.singleShot > 0) return 'Focused Shot';
  if (skill.stat === 'singleShot' && skillLevels.multishot > 0) return 'Split Shot';
  return null;
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
    const pathLock = skillPathLock(skill);
    const weaponLocked = !owned && skill.tree === 'laser' && currentWeapon !== 'laser';
    const unaffordable = !owned && !locked && !pathLock && !weaponLocked && credits < skill.cost;

    button.disabled = owned || locked || Boolean(pathLock) || weaponLocked || unaffordable;
    button.classList.toggle('is-owned', owned);
    button.classList.toggle('is-locked', locked || Boolean(pathLock) || weaponLocked);
    button.classList.toggle('is-unaffordable', unaffordable);
    button.setAttribute('aria-pressed', String(owned));
    button.querySelector('.skill-cost').textContent = owned
      ? 'Owned'
      : weaponLocked ? 'Equip Laser' : pathLock ? `Locked by ${pathLock}` : locked ? `Requires rank ${skill.rank - 1}` : `${skill.cost} gold`;
  }
}

function buySkill(skillId) {
  if (!isArmoryOpen()) return;
  const skill = skillDefinitions.find((item) => item.id === skillId);
  if (!skill || skillLevels[skill.stat] !== skill.rank - 1 || skillPathLock(skill) || (skill.tree === 'laser' && currentWeapon !== 'laser') || credits < skill.cost) return;

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
  if (!isArmoryOpen() || baseHealth >= maxBaseHealth() || credits < 20) return;
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
  } else if ((state === 'paused' || state === 'paused-armory') && !forcePause) {
    state = 'playing';
    pauseOverlay.hidden = true;
    upgradeOverlay.hidden = true;
    nextWaveButton.hidden = true;
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
    if (splitBulletIfReady(index)) continue;

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

    if (enemy.type === 'healer') updateHealer(enemy, deltaTime);

    const inRangedPosition = enemy.type === 'ranged' && distance <= enemy.attackRange;
    if (inRangedPosition) {
      enemy.abilityCooldown -= deltaTime;
      if (enemy.abilityCooldown <= 0) {
        fireEnemyProjectile(enemy);
        enemy.abilityCooldown = 2.2;
      }
    } else if (distance <= 42 + enemy.radius || distance <= step) {
      enemies.splice(index, 1);
      damageBase(enemy);
      if (state !== 'playing') return;
    } else {
      enemy.x += (targetX - enemy.x) / distance * step;
      enemy.y += (targetY - enemy.y) / distance * step;
    }
  }

  updateEnemyProjectiles(deltaTime);
  if (state !== 'playing') return;

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
        const damage = projectileDamage(bullet) * (bullet.bounceCount > 0 ? BOUNCE_DAMAGE_MULTIPLIER : 1);
        bullet.hitEnemyIds.push(enemy.id);
        damageEnemyAtIndex(enemyIndex, damage, bullet.x, bullet.y);

        if (bullet.splash > 0) {
          addParticles(bullet.x, bullet.y, '#ffb454', 18, 170);
          for (let splashIndex = enemies.length - 1; splashIndex >= 0; splashIndex -= 1) {
            const splashEnemy = enemies[splashIndex];
            const splashDistance = Math.hypot(splashEnemy.x - enemy.x, splashEnemy.y - enemy.y);
            if (splashEnemy.id !== enemy.id && splashDistance <= bullet.splash + splashEnemy.radius) {
              damageEnemyAtIndex(splashIndex, damage * bullet.splashDamageMultiplier, splashEnemy.x, splashEnemy.y);
            }
          }
        }

        const bounced = bounceBulletToNextEnemy(bullet, enemy);
        if (!bounced) {
          bullet.hitsRemaining -= 1;
          if (bullet.hitsRemaining <= 0) bullets.splice(bulletIndex, 1);
        }
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

function buildStarfield() {
  let seed = 73129;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const count = Math.max(75, Math.round(width * height / 6500));

  stars = Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * Math.max(1, height - 58),
    radius: 0.45 + random() * 1.35,
    phase: random() * Math.PI * 2,
    speed: 0.0007 + random() * 0.0018,
    blue: random() > 0.68,
    flare: random() > 0.94
  }));
}

function drawSpaceBackground() {
  const time = performance.now();
  const deepSpace = context.createLinearGradient(0, 0, 0, height);
  deepSpace.addColorStop(0, '#071326');
  deepSpace.addColorStop(0.55, '#040b18');
  deepSpace.addColorStop(1, '#02050d');
  context.fillStyle = deepSpace;
  context.fillRect(0, 0, width, height);

  const blueNebula = context.createRadialGradient(width * 0.15, height * 0.2, 0, width * 0.15, height * 0.2, Math.max(width, height) * 0.7);
  blueNebula.addColorStop(0, 'rgba(32, 105, 196, 0.2)');
  blueNebula.addColorStop(0.5, 'rgba(19, 64, 132, 0.08)');
  blueNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = blueNebula;
  context.fillRect(0, 0, width, height);

  const violetNebula = context.createRadialGradient(width * 0.85, height * 0.35, 0, width * 0.85, height * 0.35, Math.max(width, height) * 0.55);
  violetNebula.addColorStop(0, 'rgba(100, 66, 170, 0.13)');
  violetNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = violetNebula;
  context.fillRect(0, 0, width, height);

  for (const star of stars) {
    const twinkle = (Math.sin(time * star.speed + star.phase) + 1) / 2;
    context.globalAlpha = 0.3 + twinkle * 0.7;
    context.fillStyle = star.blue ? '#9fd9ff' : '#ffffff';
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();

    if (star.flare) {
      context.globalAlpha *= 0.5;
      context.strokeStyle = '#b9e5ff';
      context.lineWidth = 0.7;
      context.beginPath();
      context.moveTo(star.x - star.radius * 3.5, star.y);
      context.lineTo(star.x + star.radius * 3.5, star.y);
      context.moveTo(star.x, star.y - star.radius * 3.5);
      context.lineTo(star.x, star.y + star.radius * 3.5);
      context.stroke();
    }
  }
  context.globalAlpha = 1;

  const horizonGlow = context.createLinearGradient(0, height - 95, 0, height);
  horizonGlow.addColorStop(0, 'rgba(35, 140, 255, 0)');
  horizonGlow.addColorStop(1, 'rgba(35, 140, 255, 0.08)');
  context.fillStyle = horizonGlow;
  context.fillRect(0, height - 95, width, 95);
}

function drawBase() {
  const baseX = width / 2;
  const baseY = height - 44;
  const pulse = (Math.sin(performance.now() * 0.004) + 1) / 2;
  const statusColor = baseHealth <= 30 ? '#ff6b6b' : '#31b5ff';

  context.fillStyle = 'rgba(255, 107, 107, 0.04)';
  context.fillRect(0, height - 58, width, 58);
  context.strokeStyle = 'rgba(255, 107, 107, 0.18)';
  context.setLineDash([8, 10]);
  context.beginPath();
  context.moveTo(0, height - 58);
  context.lineTo(width, height - 58);
  context.stroke();
  context.setLineDash([]);

  context.save();
  context.fillStyle = 'rgba(0, 0, 0, 0.45)';
  context.beginPath();
  context.ellipse(baseX, baseY + 35, 104, 8, 0, 0, Math.PI * 2);
  context.fill();

  // Rear communications and radar equipment.
  context.strokeStyle = '#ffffff';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(baseX - 67, baseY + 5);
  context.lineTo(baseX - 67, baseY - 17);
  context.moveTo(baseX + 70, baseY + 4);
  context.lineTo(baseX + 70, baseY - 24);
  context.stroke();
  context.lineWidth = 2;
  context.beginPath();
  context.arc(baseX - 67, baseY - 18, 10, Math.PI, 0);
  context.stroke();
  context.beginPath();
  context.moveTo(baseX - 77, baseY - 18);
  context.lineTo(baseX - 57, baseY - 18);
  context.stroke();
  context.fillStyle = statusColor;
  context.beginPath();
  context.arc(baseX + 70, baseY - 25, 2.5 + pulse, 0, Math.PI * 2);
  context.fill();

  // Angled armored chassis.
  fillPolygon([
    [baseX - 99, baseY + 14], [baseX - 88, baseY + 3], [baseX - 51, baseY - 3],
    [baseX + 51, baseY - 3], [baseX + 88, baseY + 3], [baseX + 99, baseY + 14],
    [baseX + 91, baseY + 34], [baseX - 91, baseY + 34]
  ], '#ffffff');
  context.strokeStyle = '#3aa9ff';
  context.lineWidth = 1.5;
  context.shadowColor = '#31b5ff';
  context.shadowBlur = 7;
  context.stroke();
  context.shadowBlur = 0;

  // Reinforced side pods.
  fillPolygon([
    [baseX - 91, baseY + 9], [baseX - 61, baseY + 3], [baseX - 49, baseY + 10],
    [baseX - 53, baseY + 31], [baseX - 88, baseY + 31]
  ], '#ffffff');
  fillPolygon([
    [baseX + 91, baseY + 9], [baseX + 61, baseY + 3], [baseX + 49, baseY + 10],
    [baseX + 53, baseY + 31], [baseX + 88, baseY + 31]
  ], '#ffffff');

  // Central command armor and roof rail.
  fillPolygon([
    [baseX - 51, baseY - 4], [baseX + 51, baseY - 4], [baseX + 58, baseY + 7],
    [baseX + 48, baseY + 33], [baseX - 48, baseY + 33], [baseX - 58, baseY + 7]
  ], '#ffffff');
  context.strokeStyle = '#78c9ff';
  context.stroke();
  context.fillStyle = '#238cff';
  context.fillRect(baseX - 43, baseY + 1, 86, 7);
  context.fillStyle = '#3aa9ff';
  for (let index = 0; index < 6; index += 1) {
    context.fillRect(baseX - 38 + index * 15, baseY + 2, 8, 2);
  }

  // Military ventilation grilles.
  context.fillStyle = '#238cff';
  for (let index = 0; index < 4; index += 1) {
    context.fillRect(baseX - 84 + index * 7, baseY + 17, 4, 10);
    context.fillRect(baseX + 63 + index * 7, baseY + 17, 4, 10);
  }

  // Muted hazard chevrons on the armor shoulders.
  for (let index = 0; index < 3; index += 1) {
    const left = baseX - 83 + index * 9;
    const right = baseX + 65 + index * 9;
    fillPolygon([[left, baseY + 9], [left + 5, baseY + 8], [left + 9, baseY + 14], [left + 4, baseY + 15]], '#28bfff');
    fillPolygon([[right, baseY + 8], [right + 5, baseY + 9], [right + 1, baseY + 15], [right - 4, baseY + 14]], '#28bfff');
  }

  // Armored access hatch and illuminated status rail.
  fillPolygon([
    [baseX - 28, baseY + 12], [baseX + 28, baseY + 12], [baseX + 24, baseY + 31],
    [baseX - 24, baseY + 31]
  ], '#ffffff');
  context.strokeStyle = '#3aa9ff';
  context.stroke();
  context.fillStyle = '#238cff';
  context.fillRect(baseX - 18, baseY + 17, 36, 2);
  context.fillRect(baseX - 18, baseY + 28, 36, 2);

  context.save();
  context.shadowColor = statusColor;
  context.shadowBlur = 8 + pulse * 7;
  context.fillStyle = statusColor;
  context.fillRect(baseX - 38, baseY + 7, 76, 3);
  context.fillRect(baseX - 91, baseY + 12, 5, 3);
  context.fillRect(baseX + 86, baseY + 12, 5, 3);
  context.restore();

  // Panel fasteners and identification markings.
  context.fillStyle = '#ffffff';
  for (const xOffset of [-45, 45]) {
    context.beginPath();
    context.arc(baseX + xOffset, baseY + 12, 1.7, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = '#238cff';
  context.font = '700 7px system-ui';
  context.textAlign = 'center';
  context.fillText('LL-01', baseX - 69, baseY + 31);
  context.fillText('LL-01', baseX + 69, baseY + 31);
  context.fillStyle = statusColor;
  context.font = '800 8px system-ui';
  context.fillText('BASE', baseX, baseY + 26);

  context.restore();
}

function fillPolygon(points, color) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index][0], points[index][1]);
  }
  context.closePath();
  context.fill();
}

function drawRifle() {
  fillPolygon([[-13, -6], [0, -8], [7, -4], [7, 5], [-4, 7], [-13, 3]], '#d7e5f2');
  context.fillStyle = '#f4f8fc';
  context.fillRect(1, -6, 27, 12);
  context.fillStyle = '#ffffff';
  context.fillRect(7, -9, 22, 3);
  context.fillRect(25, -3, 23, 6);
  context.fillStyle = '#ffffff';
  context.fillRect(45, -4, 5, 8);
  context.fillStyle = '#17334d';
  context.fillRect(48, -2, 2, 4);
  fillPolygon([[11, 5], [23, 5], [20, 15], [13, 14]], '#2e6ea6');
  context.fillStyle = '#1d4f7a';
  context.fillRect(5, -3, 12, 3);
}

function drawCannon() {
  context.fillStyle = '#1e4567';
  context.fillRect(-9, -12, 28, 24);
  fillPolygon([[8, -13], [28, -10], [33, -6], [33, 6], [28, 10], [8, 13]], '#d9e9f5');
  context.fillStyle = '#f5fafc';
  context.fillRect(25, -10, 27, 20);
  context.fillStyle = '#2c6da3';
  context.fillRect(29, -12, 7, 24);
  context.fillRect(42, -11, 5, 22);
  context.fillStyle = '#ffffff';
  context.fillRect(49, -14, 9, 28);
  context.fillStyle = '#17334d';
  context.fillRect(56, -8, 3, 16);
  context.fillStyle = '#80caff';
  context.fillRect(34, -6, 13, 4);
}

function drawMachineGun() {
  context.fillStyle = '#245377';
  context.fillRect(-7, -13, 28, 26);
  context.fillStyle = '#d9e9f5';
  context.fillRect(13, -11, 11, 22);
  context.fillStyle = '#f4f8fc';
  context.fillRect(20, -10, 33, 5);
  context.fillRect(20, 5, 33, 5);
  context.fillStyle = '#ffffff';
  context.fillRect(49, -11, 7, 7);
  context.fillRect(49, 4, 7, 7);
  context.fillStyle = '#17334d';
  context.fillRect(54, -9, 3, 3);
  context.fillRect(54, 6, 3, 3);
  context.fillStyle = '#2a6da4';
  context.fillRect(5, 12, 17, 8);
  context.fillStyle = '#ffffff';
  context.fillRect(23, -7, 20, 2);
  context.fillRect(23, 5, 20, 2);
}

function drawSniper() {
  fillPolygon([[-16, -5], [-4, -8], [7, -5], [9, 4], [-7, 6], [-16, 2]], '#d9e9f5');
  context.fillStyle = '#f4f8fc';
  context.fillRect(1, -5, 29, 10);
  context.fillStyle = '#ffffff';
  context.fillRect(26, -2.5, 44, 5);
  context.fillStyle = '#ffffff';
  context.fillRect(66, -4, 8, 8);
  context.fillStyle = '#17334d';
  context.fillRect(72, -2, 3, 4);
  context.fillStyle = '#245377';
  context.fillRect(6, -9, 31, 3);
  context.fillRect(12, -10, 4, 6);
  context.fillRect(29, -10, 4, 6);
  context.fillStyle = '#3b9bd5';
  context.fillRect(9, -16, 26, 6);
  context.fillStyle = '#a9e7ff';
  context.fillRect(32, -15, 5, 4);
  fillPolygon([[11, 4], [21, 4], [19, 11], [13, 11]], '#2a6da4');
  context.strokeStyle = '#a9c3d8';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(44, 3);
  context.lineTo(38, 13);
  context.moveTo(48, 3);
  context.lineTo(53, 13);
  context.stroke();
}

function drawLaser() {
  const pulse = (Math.sin(performance.now() * 0.008) + 1) / 2;

  fillPolygon([[-12, -7], [4, -11], [15, -7], [15, 8], [1, 11], [-12, 5]], '#1e4567');
  fillPolygon([[5, -11], [25, -12], [38, -7], [41, 0], [38, 8], [24, 12], [5, 10]], '#edf6fb');
  context.strokeStyle = '#73bfff';
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(10, -8);
  context.lineTo(26, -9);
  context.lineTo(35, -5);
  context.stroke();
  context.fillStyle = '#17334d';
  context.fillRect(30, -4, 10, 8);
  context.fillStyle = '#5b9dd2';
  context.fillRect(31, -2, 7, 1.5);
  context.fillRect(31, 1, 7, 1.5);
  fillPolygon([[36, -7], [48, -6], [55, -3], [55, 3], [48, 6], [36, 7]], '#2a6da4');

  context.save();
  context.shadowColor = '#4de5ff';
  context.shadowBlur = 10 + pulse * 8 + (laserBeam ? 8 : 0);
  fillPolygon([[45, -7], [58, -11], [62, -7], [53, -1], [47, -1]], '#76eaff');
  fillPolygon([[45, 7], [58, 11], [62, 7], [53, 1], [47, 1]], '#76eaff');
  context.fillStyle = '#dfffff';
  context.fillRect(51, -2, 11, 4);

  const coreGradient = context.createRadialGradient(23, 0, 1, 23, 0, 8);
  coreGradient.addColorStop(0, '#ffffff');
  coreGradient.addColorStop(0.35, '#8fffff');
  coreGradient.addColorStop(0.7, '#36cdea');
  coreGradient.addColorStop(1, '#25647c');
  context.fillStyle = coreGradient;
  context.beginPath();
  context.arc(23, 0, 7 + pulse * 0.6, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.strokeStyle = '#b9f8ff';
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(23, 0, 9, -Math.PI * 0.75, Math.PI * 0.75);
  context.stroke();
}

function drawEquippedWeapon() {
  context.lineJoin = 'round';

  if (currentWeapon === 'cannon') {
    drawCannon();
  } else if (currentWeapon === 'machinegun') {
    drawMachineGun();
  } else if (currentWeapon === 'sniper') {
    drawSniper();
  } else if (currentWeapon === 'laser') {
    drawLaser();
  } else {
    drawRifle();
  }
}

function drawGunner() {
  context.save();
  context.translate(-10, -24);
  context.scale(0.82, 0.82);
  context.lineCap = 'round';

  // Bent legs straddle the weapon in a seated operating position.
  context.strokeStyle = '#132b3d';
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(-5, 11);
  context.lineTo(-19, 18);
  context.lineTo(-23, 6);
  context.moveTo(5, 11);
  context.lineTo(19, 18);
  context.lineTo(23, 6);
  context.stroke();

  // Uniform and armored vest.
  fillPolygon([[-11, -9], [-6, -14], [7, -14], [12, -7], [9, 14], [-9, 14]], '#315f52');
  context.fillStyle = '#1c3e42';
  context.fillRect(-9, -6, 18, 12);
  context.fillStyle = '#79d6a4';
  context.fillRect(-7, -4, 14, 2);
  context.fillStyle = '#162f3d';
  context.fillRect(-9, 8, 18, 4);

  // Bent arms and hands grip the weapon beside the rotating collar.
  context.strokeStyle = '#315f52';
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(8, -7);
  context.lineTo(19, 3);
  context.lineTo(28, 15);
  context.moveTo(8, 1);
  context.lineTo(20, 13);
  context.lineTo(32, 16);
  context.stroke();
  context.fillStyle = '#d9a37a';
  context.beginPath();
  context.arc(28, 15, 3.5, 0, Math.PI * 2);
  context.arc(32, 16, 3.5, 0, Math.PI * 2);
  context.fill();

  // Head, helmet, and dark visor face the incoming enemies.
  context.fillStyle = '#d9a37a';
  context.fillRect(-3, -16, 6, 5);
  context.beginPath();
  context.arc(0, -24, 8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#edf5f8';
  context.beginPath();
  context.arc(0, -26, 9, Math.PI, 0);
  context.lineTo(9, -23);
  context.lineTo(-9, -23);
  context.closePath();
  context.fill();
  context.fillStyle = '#3b96dc';
  context.fillRect(-9, -25, 18, 3);
  context.fillStyle = '#17334d';
  context.fillRect(1, -22, 7, 3);
  context.fillStyle = '#ffd166';
  context.font = '800 11px system-ui';
  context.textAlign = 'center';
  context.fillText('MIKKI', 0, -41);
  context.restore();
}

function drawPlayer() {
  context.save();
  context.translate(player.x, player.y);

  // Fixed pedestal overlaps the command roof, integrating the gun with the base.
  context.fillStyle = 'rgba(0, 0, 0, 0.32)';
  context.beginPath();
  context.ellipse(0, 23, 29, 7, 0, 0, Math.PI * 2);
  context.fill();
  fillPolygon([[-26, 24], [-20, 5], [20, 5], [26, 24]], '#173b5c');
  context.strokeStyle = '#6ea8d8';
  context.lineWidth = 1.5;
  context.stroke();
  context.fillStyle = '#eef6fb';
  context.fillRect(-18, 6, 36, 13);
  context.fillStyle = '#3b96dc';
  context.fillRect(-22, 20, 44, 4);
  context.fillStyle = '#a9d9f5';
  context.fillRect(-12, 9, 24, 3);

  context.save();
  context.rotate(player.angle);
  drawEquippedWeapon();
  context.restore();

  drawGunner();

  // Clean white-and-blue rotating collar.
  context.fillStyle = '#f4f9fc';
  context.beginPath();
  context.arc(0, 0, 18, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#75b9e8';
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = '#173b5c';
  context.beginPath();
  context.arc(0, 0, 12, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#43a5eb';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, 14, -Math.PI * 0.85, Math.PI * 0.15);
  context.stroke();
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(0, 0, 4, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawEnemy(enemy) {
  const radius = enemy.radius;
  context.save();
  context.translate(enemy.x, enemy.y);

  if (enemy.type === 'shield') {
    context.fillStyle = 'rgba(91, 159, 245, 0.045)';
    context.beginPath();
    context.arc(0, 0, enemy.shieldRadius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(113, 184, 255, 0.32)';
    context.lineWidth = 1.5;
    context.setLineDash([7, 9]);
    context.stroke();
    context.setLineDash([]);
  }

  if (enemy.type === 'healer' && enemy.healPulse > 0) {
    const target = enemies.find((ally) => ally.id === enemy.healTargetId);
    if (target) {
      context.strokeStyle = `rgba(131, 255, 198, ${Math.min(0.8, enemy.healPulse * 2)})`;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(target.x - enemy.x, target.y - enemy.y);
      context.stroke();
    }
    context.strokeStyle = '#83ffc6';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, radius + 8 + (0.45 - enemy.healPulse) * 25, 0, Math.PI * 2);
    context.stroke();
  }

  context.fillStyle = enemy.color;
  context.strokeStyle = 'rgba(255, 255, 255, 0.55)';
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
  } else if (enemy.type === 'shield') {
    fillPolygon([[0, -radius], [radius * 0.86, -radius * 0.5], [radius * 0.86, radius * 0.5], [0, radius], [-radius * 0.86, radius * 0.5], [-radius * 0.86, -radius * 0.5]], enemy.color);
    context.stroke();
    context.strokeStyle = '#d9efff';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, radius * 0.58, -Math.PI * 0.75, Math.PI * 0.75);
    context.stroke();
    context.fillStyle = '#d9efff';
    context.fillRect(-3, -7, 6, 14);
  } else if (enemy.type === 'ranged') {
    fillPolygon([[0, -radius], [radius, 0], [0, radius], [-radius, 0]], enemy.color);
    context.stroke();
    context.fillStyle = '#38264f';
    context.fillRect(-7, -4, 14, 6);
    context.fillRect(-3, 0, 6, radius + 8);
    context.fillStyle = '#efdfff';
    context.beginPath();
    context.arc(0, -3, 3, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    if (enemy.type === 'healer') {
      context.fillStyle = '#effff7';
      context.fillRect(-3, -10, 6, 20);
      context.fillRect(-10, -3, 20, 6);
    } else if (enemy.type === 'splitter') {
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
    if (enemy.name === 'Butters') {
      const lensCenters = [-radius * 0.3, radius * 0.3];
      context.fillStyle = 'rgba(185, 229, 255, 0.28)';
      context.strokeStyle = '#f4f9fc';
      context.lineWidth = 2.5;
      for (const centerX of lensCenters) {
        context.fillRect(centerX - 9, -6, 18, 14);
        context.strokeRect(centerX - 9, -6, 18, 14);
        context.fillStyle = '#ffffff';
        context.fillRect(centerX - 5, -3, 4, 2);
        context.fillStyle = 'rgba(185, 229, 255, 0.28)';
      }
      context.beginPath();
      context.moveTo(lensCenters[0] + 9, -1);
      context.lineTo(lensCenters[1] - 9, -1);
      context.moveTo(lensCenters[0] - 9, -1);
      context.lineTo(-radius + 5, -4);
      context.moveTo(lensCenters[1] + 9, -1);
      context.lineTo(radius - 5, -4);
      context.stroke();
    }

    context.strokeStyle = '#ffb454';
    context.lineWidth = 4;
    context.beginPath();
    context.arc(0, 0, radius + 7, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = '#ffb454';
    context.font = enemy.name === 'Butters' ? '800 12px system-ui' : '800 10px system-ui';
    context.textAlign = 'center';
    context.fillText(enemy.name.toUpperCase(), 0, -radius - 15);
  }

  context.restore();
}

function render() {
  context.clearRect(0, 0, width, height);
  drawSpaceBackground();

  context.save();
  if (screenShake > 0) {
    context.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
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
    context.shadowColor = '#43ddff';
    context.shadowBlur = 14;
    for (const beam of laserBeam.beams) {
      context.strokeStyle = 'rgba(67, 221, 255, 0.28)';
      context.lineWidth = 12;
      context.beginPath();
      context.moveTo(beam.startX, beam.startY);
      context.lineTo(beam.endX, beam.endY);
      context.stroke();
      context.strokeStyle = '#43ddff';
      context.lineWidth = 5;
      context.stroke();
      context.strokeStyle = '#e8ffff';
      context.lineWidth = 1.5;
      context.stroke();
      context.fillStyle = '#e8ffff';
      context.beginPath();
      context.arc(beam.endX, beam.endY, 5, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  for (const bullet of bullets) {
    context.strokeStyle = bullet.critical ? '#ff8ef2' : bullet.kind === 'cannon' ? '#ffb454' : bullet.kind === 'sniper' ? '#d9ffe5' : '#ffd166';
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

  for (const projectile of enemyProjectiles) {
    context.strokeStyle = 'rgba(186, 140, 255, 0.55)';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(projectile.previousX, projectile.previousY);
    context.lineTo(projectile.x, projectile.y);
    context.stroke();
    context.fillStyle = '#e6d2ff';
    context.beginPath();
    context.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
    context.fill();
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
nextWaveButton.addEventListener('click', () => {
  if (state === 'paused-armory') togglePause();
  else startWave(wave + 1);
});
pauseArmoryButton.addEventListener('click', showPauseArmory);
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
    if (state === 'playing' || state === 'paused' || state === 'paused-armory') {
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
