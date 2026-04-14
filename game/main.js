const gameEl = document.getElementById("game");
const uiEl = document.getElementById("ui");

let state = "MENU";
let turn = 0;
let actionLog = ["Welcome to Wrogue."];
let inventoryReturnState = "TOWN";
let codexReturnState = "TOWN";
let inventoryTab = "GEAR";
let inventorySelection = 0;
let showActionLog = true;
let codex = { enemies: {}, materials: {}, equipment: {}, lore: [] };

let dungeon = {
  floor: 1,
  roomsCleared: 0
};

let player = {
  class: null,
  x: 1,
  y: 1,
  hp: 10,
  maxHp: 10,
  atk: 2,
  def: 0,
  crit: 0,
  dodge: 0,
  gold: 0,
  equipment: {
    head: null,
    chest: null,
    belt: null,
    legs: null,
    boots: null,
    necklace: null,
    ring1: null,
    ring2: null,
    mainHand: null,
    offHand: null
  },
  inventory: []
};

let map = [];
let entities = [];

const WIDTH = Math.floor(8 * 2.5);
const HEIGHT = Math.floor(5 * 2.5);

// ===== UTIL =====
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isRoomCleared() {
  return !entities.some(e => ENEMY_DEFS[e.type]);
}

function logAction(message) {
  actionLog.unshift(message);
  actionLog = actionLog.slice(0, 5);
}

function getNumberKeyIndex(e) {
  if (!isNaN(e.key)) return parseInt(e.key, 10);
  if (/^Digit[0-9]$/.test(e.code)) return parseInt(e.code.slice(5), 10);
  if (/^Numpad[0-9]$/.test(e.code)) return parseInt(e.code.slice(6), 10);
  return null;
}

function clampLog(message, maxLen = 54) {
  if (message.length <= maxLen) return message.padEnd(maxLen, " ");
  return message.slice(0, maxLen - 3) + "...";
}

function getRaritySuffix(rarity) {
  if (rarity === "unique") return " ✪";
  if (rarity === "legendary") return " ✹";
  if (rarity === "epic") return " ✶";
  if (rarity === "rare") return " ✦";
  return " ·";
}

function getItemStars(item) {
  if (!item || isMaterial(item)) return 0;
  if (item.rarity === "unique") return 0;
  let stars = Number(item.stars);
  if (!Number.isFinite(stars)) return 3;
  return Math.max(1, Math.min(5, Math.floor(stars)));
}

function getStarDisplay(stars) {
  if (!stars) return "";
  return ` ${"★".repeat(stars)}`;
}

function renderItemNameSpan(item) {
  let stars = getItemStars(item);
  return `<span class="${item.rarity}">${item.name}${getRaritySuffix(item.rarity)}${getStarDisplay(stars)}</span>`;
}

function renderSpecialEffectLine(item) {
  if (!item || item.rarity !== "unique" || !item.specialEffect) return "";
  return ` <span class="unique-effect">{${item.specialEffect}}</span>`;
}

function getLogLineClass(message) {
  let plain = message.replace(/<[^>]*>/g, "");

  if (/regen \+1 hp|healed|restored/i.test(plain)) return "log-heal";
  if (/took \d+ damage|you were defeated/i.test(plain)) return "log-damage";
  if (/looted|opened chest and found/i.test(plain)) return "codex-meta";
  return "codex-note";
}

function renderActionLog() {
  if (!showActionLog) {
    return "\n\n<span class=\"codex-meta\">[Log hidden - press L to show]</span>";
  }

  let text = "\n\n<span class=\"codex-section\">=== LOG (L to toggle) ===</span>\n";
  actionLog.forEach(msg => {
    let className = getLogLineClass(msg);
    let rendered = msg.includes("<span") ? msg : clampLog(msg, 70);
    text += `<span class=\"${className}\">- ${rendered}</span>\n`;
  });
  return text;
}

function finishTurn(message, shouldLog = true) {
  turn++;

  let finalMessage = message;
  let regened = false;
  if (turn % 3 === 0 && player.hp < player.maxHp) {
    player.hp += 1;
    finalMessage += " Regen +1 HP.";
    regened = true;
  }

  if (shouldLog) {
    logAction(finalMessage);
  } else if (regened) {
    logAction("Regen +1 HP.");
  }

  runEnemyBehaviorTurn();
}

function getOpenPosition() {
  let attempts = 0;

  while (attempts < 200) {
    let x = rand(1, WIDTH - 2);
    let y = rand(1, HEIGHT - 2);

    if (x === player.x && y === player.y) {
      attempts++;
      continue;
    }

    if (map[y][x] !== ".") {
      attempts++;
      continue;
    }

    if (entities.some(e => e.x === x && e.y === y)) {
      attempts++;
      continue;
    }

    return { x, y };
  }

  return { x: 1, y: 1 };
}

function getEnemyStateIcon(state) {
  if (state === "ALERT") return "!";
  if (state === "CHASE") return "»";
  if (state === "ATTACK") return "*";
  if (state === "RETURN") return "~";
  return null;
}

function getEnemyDrawClass(enemyType, state) {
  let base = ENEMY_DEFS[enemyType]?.colorClass || "enemy-common";
  if (state === "ALERT") return `${base} enemy-alert`;
  if (state === "CHASE") return `${base} enemy-chase`;
  if (state === "ATTACK") return `${base} enemy-attack`;
  if (state === "RETURN") return `${base} enemy-return`;
  return base;
}

function getDistance(aX, aY, bX, bY) {
  return Math.abs(aX - bX) + Math.abs(aY - bY);
}

function isWalkableTile(x, y) {
  if (!map[y] || !map[y][x]) return false;
  if (map[y][x] === "#") return false;
  return true;
}

function isOccupiedByBlockingEntity(x, y, ignoreEntity = null) {
  return entities.some(e => e !== ignoreEntity && e.x === x && e.y === y && e.type !== "chest");
}

function canEnemyMoveTo(enemy, x, y) {
  if (!isWalkableTile(x, y)) return false;
  if (player.x === x && player.y === y) return false;
  if (isOccupiedByBlockingEntity(x, y, enemy)) return false;
  return true;
}

function tryMoveEnemy(enemy, dx, dy) {
  let nx = enemy.x + dx;
  let ny = enemy.y + dy;
  if (!canEnemyMoveTo(enemy, nx, ny)) return false;
  enemy.x = nx;
  enemy.y = ny;
  return true;
}

function tryMoveEnemyToward(enemy, targetX, targetY) {
  let options = [];
  let dx = targetX - enemy.x;
  let dy = targetY - enemy.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    options.push({ x: Math.sign(dx), y: 0 });
    options.push({ x: 0, y: Math.sign(dy) });
  } else {
    options.push({ x: 0, y: Math.sign(dy) });
    options.push({ x: Math.sign(dx), y: 0 });
  }

  options.push({ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 });

  for (let step of options) {
    if (step.x === 0 && step.y === 0) continue;
    if (tryMoveEnemy(enemy, step.x, step.y)) return true;
  }
  return false;
}

function runEnemyBehaviorTurn() {
  if (state !== "DUNGEON") return;

  let enemyEvents = [];
  let alertRange = 4;
  let chaseRange = 2;
  let dropChaseRange = 6;

  for (let enemy of entities) {
    if (!ENEMY_DEFS[enemy.type]) continue;

    if (!enemy.state) enemy.state = "IDLE";
    if (enemy.spawnX === undefined || enemy.spawnY === undefined) {
      enemy.spawnX = enemy.x;
      enemy.spawnY = enemy.y;
    }
    if (enemy.alertTurns === undefined) enemy.alertTurns = 0;

    let distToPlayer = getDistance(enemy.x, enemy.y, player.x, player.y);
    let previousState = enemy.state;

    if (enemy.state === "IDLE") {
      if (distToPlayer <= alertRange) {
        enemy.state = "ALERT";
        enemy.alertTurns = 2;
      } else if (Math.random() < 0.35) {
        let directions = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 }
        ];
        let pick = directions[rand(0, directions.length - 1)];
        let nx = enemy.x + pick.x;
        let ny = enemy.y + pick.y;

        if (Math.abs(nx - enemy.spawnX) <= 2 && Math.abs(ny - enemy.spawnY) <= 2) {
          tryMoveEnemy(enemy, pick.x, pick.y);
        }
      }
    } else if (enemy.state === "ALERT") {
      if (distToPlayer <= chaseRange) {
        enemy.state = "CHASE";
      } else if (distToPlayer <= alertRange) {
        enemy.alertTurns = 2;
      } else {
        enemy.alertTurns--;
        if (enemy.alertTurns <= 0) enemy.state = "RETURN";
      }
    } else if (enemy.state === "CHASE") {
      if (distToPlayer === 1) {
        enemy.state = "ATTACK";
      } else if (distToPlayer > dropChaseRange) {
        enemy.state = "RETURN";
      } else {
        tryMoveEnemyToward(enemy, player.x, player.y);
        let postMoveDist = getDistance(enemy.x, enemy.y, player.x, player.y);
        if (postMoveDist === 1) enemy.state = "ATTACK";
      }
    } else if (enemy.state === "ATTACK") {
      if (distToPlayer > dropChaseRange) enemy.state = "RETURN";
      else enemy.state = "CHASE";
    } else if (enemy.state === "RETURN") {
      let atHome = enemy.x === enemy.spawnX && enemy.y === enemy.spawnY;
      if (!atHome) {
        tryMoveEnemyToward(enemy, enemy.spawnX, enemy.spawnY);
      }

      atHome = enemy.x === enemy.spawnX && enemy.y === enemy.spawnY;
      if (atHome) {
        enemy.hp = enemy.maxHp;
        enemy.state = "IDLE";
      }
    }

    if (previousState !== enemy.state) {
      let enemyName = ENEMY_DEFS[enemy.type].name;
      if (enemy.state === "ALERT") enemyEvents.push(`${enemyName} noticed you!`);
      if (enemy.state === "CHASE") enemyEvents.push(`${enemyName} is pursuing you.`);
      if (enemy.state === "RETURN") enemyEvents.push(`${enemyName} lost your trail.`);
    }
  }

  for (let evt of enemyEvents) {
    logAction(evt);
  }
}

const ITEM_GENERATION_POOL = [
  { type: "weapon", subType: "blade", slot: "mainHand", hands: 1 },
  { type: "wand", subType: "arcane", slot: "mainHand", hands: 1 },
  { type: "staff", subType: "focus", slot: "mainHand", hands: 1 },
  { type: "twoHandWeapon", subType: "heavy", slot: "mainHand", hands: 2 },
  { type: "shield", subType: "guard", slot: "offHand", hands: 1 },
  { type: "armor", part: "head", slot: "head", hands: 0 },
  { type: "armor", part: "chest", slot: "chest", hands: 0 },
  { type: "armor", part: "belt", slot: "belt", hands: 0 },
  { type: "armor", part: "legs", slot: "legs", hands: 0 },
  { type: "armor", part: "boots", slot: "boots", hands: 0 },
  { type: "accessory", part: "necklace", slot: "necklace", hands: 0 },
  { type: "accessory", part: "ring", slot: "ring", hands: 0 }
];

const rarityPower = {
  common: 1,
  rare: 2,
  epic: 4,
  legendary: 6,
  unique: 8
};

const UNIQUE_ITEM_TEMPLATES = [
  {
    id: "crown_of_ashroot",
    name: "Ashroot Crown",
    type: "armor",
    part: "head",
    slot: "head",
    hands: 0,
    specialEffect: "Regen pulses every 2 turns instead of 3"
  },
  {
    id: "fang_of_the_pit",
    name: "Fang of the Pit",
    type: "weapon",
    subType: "blade",
    slot: "mainHand",
    hands: 1,
    specialEffect: "+10% CRIT while below 50% HP"
  },
  {
    id: "vowguard_bulwark",
    name: "Vowguard Bulwark",
    type: "shield",
    subType: "guard",
    slot: "offHand",
    hands: 1,
    specialEffect: "First hit each fight deals -2 damage"
  },
  {
    id: "wayfarer_sigil",
    name: "Wayfarer Sigil",
    type: "accessory",
    part: "necklace",
    slot: "necklace",
    hands: 0,
    specialEffect: "+2 DODGE per room cleared this floor"
  }
];

const MATERIAL_DEFS = {
  scrap_metal: {
    name: "Scrap Metal",
    tier: "common",
    colorClass: "material-common",
    value: 5,
    uses: "Guild scrap. Later useful for crude orc gear and trade work."
  },
  cloth_rag: {
    name: "Cloth Rag",
    tier: "common",
    colorClass: "material-common",
    value: 4,
    uses: "Can be sold, wrapped into bandages, or used in rough craft."
  },
  bone_fragment: {
    name: "Bone Fragment",
    tier: "common",
    colorClass: "material-common",
    value: 6,
    uses: "Basic reagent for charms, bone dust, or low-grade handles."
  },
  venom_sac: {
    name: "Venom Sac",
    tier: "crafting",
    colorClass: "material-crafting",
    value: 10,
    uses: "Promising base for witch toxins, potions, or poisoned skills."
  },
  slime_gland: {
    name: "Slime Gland",
    tier: "crafting",
    colorClass: "material-crafting",
    value: 9,
    uses: "Useful for unstable brews, solvents, and alchemical binding."
  },
  silk_thread: {
    name: "Silk Thread",
    tier: "crafting",
    colorClass: "material-crafting",
    value: 11,
    uses: "Can become bindings, stitched runes, or fine potion wraps."
  },
  stone_core: {
    name: "Stone Core",
    tier: "crafting",
    colorClass: "material-crafting",
    value: 12,
    uses: "Dense shard suited for reinforced tools and rune anchors."
  },
  arcane_lens: {
    name: "Arcane Lens",
    tier: "rare",
    colorClass: "material-rare",
    value: 18,
    uses: "Rare focus material for spells, vision craft, and mana tools."
  },
  void_fang: {
    name: "Void Fang",
    tier: "rare",
    colorClass: "material-rare",
    value: 20,
    uses: "Sharp dark catalyst. Could empower curse work later."
  },
  ethereal_essence: {
    name: "Ethereal Essence",
    tier: "rare",
    colorClass: "material-rare",
    value: 24,
    uses: "Volatile spirit matter suited for advanced witch crafting."
  },
  crown_fragment: {
    name: "Crown Fragment",
    tier: "boss",
    colorClass: "material-boss",
    value: 35,
    uses: "Boss relic. Valuable to guild collectors and future rituals."
  },
  void_chalice: {
    name: "Void Chalice",
    tier: "boss",
    colorClass: "material-boss",
    value: 40,
    uses: "Ancient vessel of corruption. Strong future spell component."
  },
  core_stone: {
    name: "Core Stone",
    tier: "boss",
    colorClass: "material-boss",
    value: 38,
    uses: "Dense heartstone suited for legendary forging and warding."
  },
  rat_fur: {
    name: "Rat Fur",
    tier: "common",
    colorClass: "material-common",
    value: 3,
    uses: "Matted but soft. Usable in crude padding and basic guild trade."
  },
  snake_skin: {
    name: "Snake Skin",
    tier: "common",
    colorClass: "material-common",
    value: 5,
    uses: "Flexible dry hide. Good for light wraps, grips, or alchemical dye."
  },
  chitin_plate: {
    name: "Chitin Plate",
    tier: "crafting",
    colorClass: "material-crafting",
    value: 12,
    uses: "Hard shell shard. Could reinforce armor or anchor a rune form."
  },
  stone_dust: {
    name: "Stone Dust",
    tier: "common",
    colorClass: "material-common",
    value: 4,
    uses: "Coarse mineral powder. Used in binding, abrasion, and stonework."
  }
};

const ENEMY_DEFS = {
  goblin: {
    name: "Goblin",
    symbol: "g",
    family: "Hollow Dungeon Dwellers",
    colorClass: "enemy-goblin",
    hp: 5, atk: 2, def: 0,
    behavior: {},
    lore: [
      { kills: 0,  text: "A small hunched scavenger with quick hands and mean eyes." },
      { kills: 3,  text: "They hoard scrap, cloth, and anything left unguarded." },
      { kills: 10, text: "Weak alone. Dangerous when they swarm around a stronger leader." }
    ],
    drops: [
      { id: "scrap_metal",  chance: 1 },
      { id: "cloth_rag",    chance: 0.65 },
      { id: "bone_fragment",chance: 0.18 }
    ]
  },
  rat: {
    name: "Rat",
    symbol: "r",
    family: "Feral Wastes",
    colorClass: "enemy-rat",
    hp: 2, atk: 1, def: 0,
    behavior: { flees: true },
    lore: [
      { kills: 0,  text: "A skittish rodent that scurries from danger when wounded." },
      { kills: 5,  text: "They travel in packs but scatter fast under pressure." },
      { kills: 12, text: "More useful dead than alive. Their fur fetches decent trade." }
    ],
    drops: [
      { id: "rat_fur",      chance: 1 },
      { id: "bone_fragment",chance: 0.2 }
    ]
  },
  cave_snake: {
    name: "Cave Snake",
    symbol: "s",
    family: "Feral Wastes",
    colorClass: "enemy-snake",
    hp: 4, atk: 2, def: 0,
    behavior: { firstStrike: true },
    lore: [
      { kills: 0,  text: "A lean predator that strikes before its prey can react." },
      { kills: 4,  text: "Its first bite carries the most force. Weaker after that." },
      { kills: 10, text: "The skin is prized. The venom sac even more so." }
    ],
    drops: [
      { id: "snake_skin",chance: 1 },
      { id: "venom_sac", chance: 0.45 }
    ]
  },
  stone_beetle: {
    name: "Stone Beetle",
    symbol: "b",
    family: "Feral Wastes",
    colorClass: "enemy-beetle",
    hp: 6, atk: 1, def: 2,
    behavior: {},
    lore: [
      { kills: 0,  text: "Its chitin shell absorbs most blows. Slow, but durable." },
      { kills: 4,  text: "Breaking through the plating is the real challenge." },
      { kills: 10, text: "The core plate is dense enough to be worked into gear." }
    ],
    drops: [
      { id: "stone_dust",   chance: 1 },
      { id: "chitin_plate", chance: 0.6 }
    ]
  }
};

function getEnemyLore(key, entry) {
  let table = ENEMY_DEFS[key]?.lore;
  if (!table) return "Unknown creature.";

  let text = table[0].text;
  for (let row of table) {
    if (entry.kills >= row.kills) text = row.text;
  }
  return text;
}

function getMaterialDefinition(materialId) {
  return MATERIAL_DEFS[materialId] || {
    name: materialId,
    tier: "common",
    colorClass: "material-common",
    value: 1,
    uses: "Unknown use."
  };
}

function registerMaterial(materialId) {
  let def = getMaterialDefinition(materialId);
  if (!codex.materials[materialId]) {
    codex.materials[materialId] = {
      id: materialId,
      name: def.name,
      tier: def.tier,
      colorClass: def.colorClass,
      uses: def.uses
    };
  }
}

function renderMaterialSpan(item) {
  let colorClass = item.colorClass || getMaterialDefinition(item.materialId || item.name).colorClass;
  return `<span class="${colorClass}">${item.name}</span>`;
}

function getEnemyPool() {
  if (dungeon.floor <= 2) return ["rat", "goblin"];
  if (dungeon.floor <= 4) return ["rat", "goblin", "cave_snake"];
  return ["goblin", "cave_snake", "stone_beetle"];
}

function getEnemyCount() {
  if (dungeon.floor === 1) return rand(1, 2);
  if (dungeon.floor <= 3) return rand(1, 3);
  return rand(2, 3);
}

function spawnEnemy(type, x, y) {
  let def = ENEMY_DEFS[type];
  let hp = def.hp + (dungeon.floor - 1) * 2;
  let entity = {
    type,
    x, y,
    spawnX: x,
    spawnY: y,
    state: "IDLE",
    alertTurns: 0,
    hp,
    maxHp: hp,
    atk: def.atk + Math.floor(dungeon.floor / 2),
    def: def.def
  };
  if (def.behavior?.firstStrike) entity.firstHit = true;
  return entity;
}

function registerEnemySeen(type) {
  let def = ENEMY_DEFS[type];
  if (!def) return;
  if (!codex.enemies[type]) {
    codex.enemies[type] = {
      name: def.name,
      family: def.family,
      colorClass: def.colorClass,
      symbol: def.symbol,
      seen: 0,
      kills: 0
    };
  }
  codex.enemies[type].seen++;
}

function rollEnemyDrops(enemyType) {
  let def = ENEMY_DEFS[enemyType];
  if (!def) return [];

  let drops = [];
  for (let drop of def.drops) {
    if (Math.random() <= drop.chance) {
      drops.push(createMaterialItem(drop.id));
    }
  }

  if (!drops.length && def.drops.length) {
    drops.push(createMaterialItem(def.drops[0].id));
  }

  return drops.slice(0, 2);
}

function isMaterial(item) {
  return item && item.type === "material";
}

function createMaterialItem(materialId) {
  let def = getMaterialDefinition(materialId);
  let bonus = Math.floor((dungeon.floor - 1) / 2);
  let unitValue = def.value + bonus;

  return {
    type: "material",
    materialId,
    name: def.name,
    rarity: def.tier,
    tier: def.tier,
    colorClass: def.colorClass,
    value: unitValue,
    quantity: 1,
    totalValue: unitValue,
    uses: def.uses
  };
}

function normalizeMaterialStack(item) {
  if (!isMaterial(item)) return item;

  if (!item.quantity || item.quantity < 1) item.quantity = 1;
  if (!item.totalValue || item.totalValue < 1) item.totalValue = item.value * item.quantity;
  item.value = Math.max(1, Math.round(item.totalValue / item.quantity));

  return item;
}

function normalizeGearItem(item) {
  if (!item || isMaterial(item)) return item;
  if (item.rarity === "unique") {
    item.stars = 0;
    if (!item.specialEffect) item.specialEffect = "Ancient power stirs within.";
  } else {
    item.stars = getItemStars(item);
  }
  return item;
}

function rollBaseRarityByFloor() {
  let floor = dungeon.floor;
  let roll = Math.random();

  if (floor <= 2) {
    if (roll < 0.7) return "common";
    if (roll < 0.95) return "rare";
    return "epic";
  }
  if (floor <= 5) {
    if (roll < 0.45) return "common";
    if (roll < 0.8) return "rare";
    if (roll < 0.96) return "epic";
    return "legendary";
  }
  if (roll < 0.2) return "common";
  if (roll < 0.55) return "rare";
  if (roll < 0.85) return "epic";
  return "legendary";
}

function createUniqueItem() {
  let t = UNIQUE_ITEM_TEMPLATES[rand(0, UNIQUE_ITEM_TEMPLATES.length - 1)];
  let floorBonus = Math.max(0, Math.floor((dungeon.floor - 5) / 2));

  let baseAtk = 0;
  let baseDef = 0;
  let baseCrit = 0;
  let baseDodge = 0;

  if (["weapon", "wand", "staff", "twoHandWeapon"].includes(t.type)) baseAtk = 4;
  if (["shield", "armor"].includes(t.type)) baseDef = 4;
  if (t.type === "accessory") {
    baseCrit = 3;
    baseDodge = 3;
  }

  return {
    id: t.id,
    name: t.name,
    type: t.type,
    part: t.part || null,
    subType: t.subType || null,
    hands: t.hands,
    slot: t.slot,
    rarity: "unique",
    stars: 0,
    specialEffect: t.specialEffect,
    atk: baseAtk + floorBonus + rand(0, 2),
    def: baseDef + floorBonus + rand(0, 2),
    hp: 5 + floorBonus * 2 + rand(0, 3),
    crit: baseCrit + rand(0, 4),
    dodge: baseDodge + rand(0, 4)
  };
}

function maybeRollUniqueFromChest() {
  if (dungeon.floor < 6) return null;
  let chance = dungeon.floor >= 10 ? 0.12 : dungeon.floor >= 8 ? 0.08 : 0.04;
  return Math.random() < chance ? createUniqueItem() : null;
}

function maybeRollUniqueFromEnemy(enemyType) {
  // Until explicit bosses exist, stone beetles on deep floors act as boss-like unique sources.
  let isBossLike = enemyType === "stone_beetle";
  if (!isBossLike || dungeon.floor < 8) return null;
  let chance = Math.min(0.1, 0.03 + (dungeon.floor - 8) * 0.01);
  return Math.random() < chance ? createUniqueItem() : null;
}

function addMaterialToInventory(materialItem) {
  normalizeMaterialStack(materialItem);

  let existing = player.inventory.find(inv =>
    isMaterial(inv) &&
    inv.materialId === materialItem.materialId &&
    inv.tier === materialItem.tier
  );

  if (existing) {
    normalizeMaterialStack(existing);
    existing.quantity += materialItem.quantity;
    existing.totalValue += materialItem.totalValue;
    existing.value = Math.max(1, Math.round(existing.totalValue / existing.quantity));
    return existing;
  }

  player.inventory.push(materialItem);
  return materialItem;
}

function registerEquipmentSeen(item) {
  let key = item.rarity === "unique"
    ? `unique:${item.id || item.name}`
    : `${item.type}:${item.slot}:${item.hands || 0}`;
  if (!codex.equipment[key]) {
    codex.equipment[key] = {
      name: item.rarity === "unique" ? item.name : `${item.type} [${item.slot}]`,
      type: item.type,
      slot: item.slot,
      hands: item.hands || 0,
      rarity: item.rarity || "common",
      specialEffect: item.specialEffect || "",
      seen: 0,
      equipped: 0,
      bestAtk: 0,
      bestDef: 0,
      bestStars: 0
    };
  }

  codex.equipment[key].seen++;
  codex.equipment[key].bestAtk = Math.max(codex.equipment[key].bestAtk, item.atk || 0);
  codex.equipment[key].bestDef = Math.max(codex.equipment[key].bestDef, item.def || 0);
  codex.equipment[key].bestStars = Math.max(codex.equipment[key].bestStars || 0, getItemStars(item));
}

function registerEquipmentEquipped(item) {
  let key = item.rarity === "unique"
    ? `unique:${item.id || item.name}`
    : `${item.type}:${item.slot}:${item.hands || 0}`;
  if (!codex.equipment[key]) registerEquipmentSeen(item);
  codex.equipment[key].equipped++;
}

function generateItem(rarity) {
  let template = ITEM_GENERATION_POOL[rand(0, ITEM_GENERATION_POOL.length - 1)];

  let power = rarityPower[rarity] + Math.floor((dungeon.floor - 1) / 2);
  let stars = rand(1, 5);
  const starMultiplier = {
    1: 0.65,
    2: 0.82,
    3: 1.0,
    4: 1.18,
    5: 1.35
  };
  let scaledPower = Math.max(1, Math.round(power * starMultiplier[stars]));

  let atkBias = ["weapon", "wand", "staff", "twoHandWeapon"].includes(template.type) ? 1 : 0;
  let defBias = ["shield", "armor"].includes(template.type) ? 1 : 0;

  let label = template.type;
  if (template.type === "weapon") label = "blade";
  if (template.type === "twoHandWeapon") label = "greatblade";
  if (template.type === "armor") {
    const armorLabels = { head: "helmet", chest: "chestplate", belt: "belt", legs: "pants", boots: "boots" };
    label = armorLabels[template.part] || template.part;
  }
  if (template.type === "accessory") label = template.part;

  return {
    name: label,
    type: template.type,
    part: template.part || null,
    subType: template.subType || null,
    hands: template.hands,
    slot: template.slot,
    rarity: rarity,
    stars,
    atk: rand(0, scaledPower + atkBias),
    def: rand(0, scaledPower + defBias),
    hp: rand(0, scaledPower * 2),
    crit: rand(0, scaledPower),
    dodge: rand(0, scaledPower)
  };
}

function getBaseMaxHp() {
  if (player.class === "witch") return 8;
  if (player.class === "orc") return 12;
  return 10;
}

function calculateStats() {
  let atk = 2;
  let def = 0;
  let maxHp = getBaseMaxHp();
  let crit = 0;
  let dodge = 0;

  for (let item of Object.values(player.equipment)) {
    if (item) {
      atk += item.atk;
      def += item.def;
      maxHp += item.hp || 0;
      crit += item.crit || 0;
      dodge += item.dodge || 0;
    }
  }

  player.atk = atk;
  player.def = def;
  player.maxHp = maxHp;
  player.crit = crit;
  player.dodge = dodge;
  if (player.hp > player.maxHp) player.hp = player.maxHp;
}

function saveGame() {
  localStorage.setItem("save", JSON.stringify({
    player,
    dungeon,
    codex
  }));
}

function loadGame() {
  let data = localStorage.getItem("save");
  if (!data) return false;

  let save = JSON.parse(data);

  player = {
    ...player,
    ...save.player,
    equipment: {
      ...player.equipment,
      ...(save.player?.equipment || {})
    },
    inventory: Array.isArray(save.player?.inventory) ? save.player.inventory : []
  };

  dungeon = {
    ...dungeon,
    ...save.dungeon
  };

  if (save.codex) {
    codex = {
      enemies:   { ...(save.codex.enemies   || {}) },
      materials: { ...(save.codex.materials || {}) },
      equipment: { ...(save.codex.equipment || {}) },
      lore: Array.isArray(save.codex.lore) ? save.codex.lore : []
    };

    // Backfill codex fields introduced after older saves were created.
    for (let key in codex.equipment) {
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "bestStars")) {
        codex.equipment[key].bestStars = 0;
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "rarity")) {
        codex.equipment[key].rarity = "common";
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "specialEffect")) {
        codex.equipment[key].specialEffect = "";
      }
    }
  }

  calculateStats();
  player.hp = Math.min(player.hp || player.maxHp, player.maxHp);
  player.inventory = player.inventory.map(item => isMaterial(item) ? normalizeMaterialStack(item) : normalizeGearItem(item));

  for (let slot of Object.keys(player.equipment)) {
    player.equipment[slot] = normalizeGearItem(player.equipment[slot]);
  }

  return true;
}

function enterTown(message = "Returned to town.") {
  state = "TOWN";
  logAction(message);
  saveGame();
}

function startGame() {
  state = "LORE_INTRO";
  dungeon.floor = 1;
  dungeon.roomsCleared = 0;
  codex = { enemies: {}, materials: {}, equipment: {}, lore: [] };
  inventoryTab = "GEAR";
  inventorySelection = 0;

  player.x = 1;
  player.y = 1;
  player.gold = 0;
  player.inventory = [];
  player.equipment = {
    head: null,
    chest: null,
    belt: null,
    legs: null,
    boots: null,
    necklace: null,
    ring1: null,
    ring2: null,
    mainHand: null,
    offHand: null
  };

  turn = 0;
  actionLog = ["A new journey begins."];

  if (player.class === "witch") {
    player.maxHp = 8;
  } else {
    player.maxHp = 12;
  }

  player.hp = player.maxHp;
  calculateStats();
  saveGame();
}


// ===== MAP =====
function generateRoom() {
  map = [];
  entities = [];

  // build map FIRST
  for (let y = 0; y < HEIGHT; y++) {
    let row = [];
    for (let x = 0; x < WIDTH; x++) {
      if (x === 0 || y === 0 || x === WIDTH-1 || y === HEIGHT-1) {
        row.push("#");
      } else {
        row.push(".");
      }
    }
    map.push(row);
  }

  // place exit AFTER map exists
  let exitPlaced = false;
  while (!exitPlaced) {
    let x = rand(1, WIDTH-2);
    let y = rand(1, HEIGHT-2);

    if (map[y][x] === "." && !(x === 1 && y === 1)) {
      map[y][x] = ">";
      exitPlaced = true;
    }
  }

  player.x = 1;
  player.y = 1;

  // enemies — variable count and type by floor
  let pool = getEnemyPool();
  let count = getEnemyCount();

  for (let i = 0; i < count; i++) {
    let type = pool[rand(0, pool.length - 1)];
    let pos = getOpenPosition();
    entities.push(spawnEnemy(type, pos.x, pos.y));
    registerEnemySeen(type);
  }

  // chest
  let chestPos = getOpenPosition();
  entities.push({
    type: "chest",
    x: chestPos.x,
    y: chestPos.y,
    opened: false,
    rarity: rollBaseRarityByFloor()
  });

  logAction(`Entered dungeon floor ${dungeon.floor}.`);
}


// ===== DRAW =====
function draw() {

  if (state === "MENU") {
    let hasSave = !!localStorage.getItem("save");
    gameEl.innerHTML =
`<span class="codex-title">  ╔══════════════════════╗
  ║    W  R  O  G  U  E  ║
  ╚══════════════════════╝</span>

<span class="codex-note">  Darkness stirs below Ashroot.
  The guild needs hunters. You need gold.</span>

  <span class="codex-section">1. New Game</span>
  <span class="${hasSave ? "codex-section" : "codex-meta"}">2. Load Game${hasSave ? "" : "  (no save found)"}</span>
  <span class="codex-section">3. Settings</span>`;
    uiEl.innerHTML = `<span class="codex-meta">wrogue — v0.1\n\nUse number keys to select.</span>`;
    return;
  }

  if (state === "CLASS_SELECT") {
    gameEl.innerHTML =
`<span class="codex-title">[NEW GAME — CHOOSE CLASS]</span>

  <span class="codex-section">1. The Witch</span>
  <span class="codex-note">  Frail and cunning. 8 HP, high ATK.
  Her hexes find cracks others miss.</span>

  <span class="codex-section">2. The Orc</span>
  <span class="codex-note">  Stubborn and thick-skinned. 12 HP.
  Blunt force is her first answer.</span>

  <span class="codex-meta">ESC — back to menu</span>`;
    uiEl.innerHTML = `<span class="codex-meta">Select a class to begin.</span>`;
    return;
  }

  if (state === "LOAD_SCREEN") {
    let saveRaw = localStorage.getItem("save");
    let saveText;
    if (!saveRaw) {
      saveText = `  <span class="codex-meta">No saved game found.</span>\n\n  <span class="codex-meta">ESC — back to menu</span>`;
    } else {
      try {
        let s = JSON.parse(saveRaw);
        let cls = s.player?.class || "unknown";
        let floor = s.dungeon?.floor || 1;
        let gold = s.player?.gold || 0;
        let hp = s.player?.hp ?? "?";
        let maxHp = s.player?.maxHp ?? "?";
        let clsClass = cls === "witch" ? "rare" : "epic";
        saveText =
`  <span class="codex-note">Class: <span class="${clsClass}">${cls}</span> | Floor ${floor} | HP ${hp}/${maxHp} | Gold ${gold}g</span>

  <span class="codex-section">1. Continue save</span>
  <span class="codex-meta">ESC — back to menu</span>`;
      } catch(err) {
        saveText = `  <span class="codex-meta">Save data corrupted.</span>\n\n  <span class="codex-meta">ESC — back to menu</span>`;
      }
    }
    gameEl.innerHTML = `<span class="codex-title">[LOAD GAME]</span>\n\n${saveText}`;
    uiEl.innerHTML = `<span class="codex-meta">Load your last journey.</span>`;
    return;
  }

  if (state === "LORE_INTRO") {
    gameEl.innerHTML =
`<span class="codex-title">[FIRST ARRIVAL]</span>

<span class="codex-note">The town of Ashroot sits at the edge of a collapsed world.
Below its cobblestones, something old stirs — a layered ruin
the locals call the Wrogue. No map goes down that far.</span>

<span class="codex-note">You arrived with a cracked weapon and a guild contract.
Kill what you find. Loot what you can. Come back alive.</span>

<span class="codex-meta">The guild pays well for proof of work.</span>

<span class="codex-section">        [ Press any key to enter Ashroot ]</span>`;
    uiEl.innerHTML = `<span class="codex-meta">A new journey begins.</span>`;
    return;
  }

  if (state === "SETTINGS") {
    gameEl.innerHTML =
`<span class="codex-title">[SETTINGS]</span>

<span class="codex-section">-- Key Bindings --</span>
<span class="codex-note">  Arrows    Move / Navigate inventory
  Enter     Confirm / Equip
  K         Toggle codex
  L         Toggle action log
  Tab       Switch inventory tab / Open inventory
  C / I     Open inventory (dungeon)
  X         Return to town (dungeon)
  M         Main menu (town)
  Esc       Back / Close panel</span>

<span class="codex-section">-- Display --</span>
<span class="codex-note">  Fixed-width terminal style.
  Designed for keyboard-only play.</span>

  <span class="codex-meta">ESC — back to menu</span>`;
    uiEl.innerHTML = `<span class="codex-meta">Settings</span>`;
    return;
  }

  if (state === "TOWN") {
    gameEl.innerHTML = `
[TOWN]

1. Enter Dungeon
2. Merchant
3. Blacksmith
4. Guild
C. Inventory
M. Main Menu

Gold: ${player.gold}
HP: ${player.hp}
`;
  gameEl.innerHTML += renderActionLog();
    drawUI();
    return;
  }

  if (state === "MERCHANT") {
    let text = "[MERCHANT]\nSell items:\n";
    player.inventory.forEach((item, i) => {
      if (isMaterial(item)) return;
      text += `${i}: ${renderItemNameSpan(item)} `;
      text += `[+${item.atk} ATK / +${item.def} DEF / +${item.hp} HP]\n`;
      text += `${renderSpecialEffectLine(item)}\n`;
    });
    text += "\nESC to exit";
    text += renderActionLog();
    gameEl.innerHTML = text;
    drawUI();
    return;
  }

  if (state === "CODEX") {
    let text = '<span class="codex-title">=== HUNTER\'S CODEX ===</span>\n\n';

    text += '<span class="codex-section">-- Creatures --</span>\n';
    for (let key in codex.enemies) {
      let en = codex.enemies[key];
      let lore = getEnemyLore(key, en);
      let colorClass = en.colorClass || "enemy-common";
      let symbol = en.symbol || "?";
      text += `<span class="${colorClass}">${symbol}</span> `;
      text += `<span class="${colorClass}">${en.name}</span> `;
      text += `<span class="codex-meta">[${en.family}]</span>\n`;
      text += `<span class="codex-meta">seen: ${en.seen} | kills: ${en.kills}</span>\n`;
      text += `  <span class="codex-note">"${lore}"</span>\n`;
    }

    if (!Object.keys(codex.enemies).length) text += '<span class="codex-meta">Nothing recorded yet.</span>\n';

    text += '\n<span class="codex-section">-- Materials --</span>\n';
    for (let key in codex.materials) {
      let m = codex.materials[key];
      let colorClass = m.colorClass || "material-common";
      text += `<span class="${colorClass}">${m.name}</span> `;
      text += `<span class="codex-meta">[${m.tier}]</span>\n`;
      text += `  <span class="codex-note">"${m.uses}"</span>\n`;
    }

    if (!Object.keys(codex.materials).length) text += '<span class="codex-meta">Nothing collected yet.</span>\n';

    text += '\n<span class="codex-section">-- Equipment --</span>\n';
    for (let key in codex.equipment) {
      let eq = codex.equipment[key];
      text += `<span class="${eq.rarity || "common"}">${eq.name || `${eq.type} [${eq.slot}]`}</span> <span class="codex-meta">`;
      if (eq.rarity !== "unique") {
        text += `${eq.type} [${eq.slot}]`;
        if (eq.part) text += ` part:${eq.part}`;
        if (eq.hands === 2) text += " 2H";
      }
      text += ` | seen: ${eq.seen}, equipped: ${eq.equipped}</span>\n`;
      let qualityText = eq.rarity === "unique" ? "best quality: unique" : `best quality: ${"★".repeat(Math.max(1, eq.bestStars || 0))}`;
      text += `  <span class="codex-note">best rolls: +${eq.bestAtk} ATK / +${eq.bestDef} DEF | ${qualityText}</span>\n`;
      if (eq.specialEffect) {
        text += `  <span class="unique-effect">effect: ${eq.specialEffect}</span>\n`;
      }
    }

    if (!Object.keys(codex.equipment).length) text += '<span class="codex-meta">No gear data yet.</span>\n';

    text += '\n<span class="codex-meta">ESC to exit</span>';
    text += renderActionLog();
    gameEl.innerHTML = text;
    drawUI();
    return;
  }

  if (state === "GUILD") {
    let text = "[GUILD]\nSell monster materials:\n";
    player.inventory.forEach((item, i) => {
      if (!isMaterial(item)) return;
      normalizeMaterialStack(item);
      text += `${i}: ${renderMaterialSpan(item)} x${item.quantity} `;
      text += `<span class=\"codex-meta\">(${item.tier}, ${item.value}g ea / ${item.totalValue}g total)</span>\n`;
    });
    text += "\n[number] sell 1 | Shift+[number] sell stack\nESC to exit";
    text += renderActionLog();
    gameEl.innerHTML = text;
    drawUI();
    return;
  }

  if (state === "BLACKSMITH") {
    let text = "[BLACKSMITH]\nUpgrade gear (cost 10):\n";
    Object.entries(player.equipment).forEach(([slot, item], i) => {
      if (item) {
        text += `${i}: ${slot} ${renderItemNameSpan(item)} `;
        text += `<span class=\"codex-meta\">(+${item.atk}/${item.def})</span>\n`;
        text += `${renderSpecialEffectLine(item)}\n`;
      }
    });
    text += "\nESC to exit";
    text += renderActionLog();
    gameEl.innerHTML = text;
    drawUI();
    return;
  }

  if (state === "INVENTORY") {
    let text = "<span class=\"codex-title\">[INVENTORY]</span>\n";
    text += `<span class="codex-meta">[Tab] ${inventoryTab === "GEAR" ? "► GEAR" : "GEAR"} | ${inventoryTab === "MATERIALS" ? "► MATERIALS" : "MATERIALS"}</span>\n\n`;
    
    let filteredItems = [];
    player.inventory.forEach((item, originalIndex) => {
      if (inventoryTab === "GEAR" && !isMaterial(item)) {
        filteredItems.push({ item, originalIndex });
      } else if (inventoryTab === "MATERIALS" && isMaterial(item)) {
        filteredItems.push({ item, originalIndex });
      }
    });

    if (filteredItems.length === 0) {
      text += "<span class=\"codex-meta\">Empty</span>\n";
    } else {
      filteredItems.forEach(({ item, originalIndex }, displayIndex) => {
        let marker = displayIndex === inventorySelection ? "→ " : "  ";
        if (isMaterial(item)) {
          normalizeMaterialStack(item);
          text += `${marker}${displayIndex}: ${renderMaterialSpan(item)} `;
          text += `<span class="codex-meta">[x${item.quantity}, ${item.value}g ea]</span>\n`;
        } else {
          text += `${marker}${displayIndex}: ${renderItemNameSpan(item)} `;
          text += `[${item.type}/${item.slot}${item.part ? `/${item.part}` : ""}${item.hands === 2 ? "/2H" : ""}] `;
          text += `[+${item.atk} ATK / +${item.def} DEF / +${item.hp} HP]\n`;
          text += `${renderSpecialEffectLine(item)}\n`;
        }
      });
    }

    text += "\n<span class=\"codex-meta\">[↑↓] navigate | [Enter] select | [Tab] switch tab | [L] log | [ESC] exit</span>";
    text += renderActionLog();
    gameEl.innerHTML = text;
    drawUI();
    return;
  }

  // ===== DUNGEON =====
  let output = "";

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {

      if (player.x === x && player.y === y) {
        output += '<span class="tile-player">@</span>';
        continue;
      }

      let drawn = false;

      for (let e of entities) {
        if (e.x === x && e.y === y) {
          let eDef = ENEMY_DEFS[e.type];
          if (eDef) {
            let icon = getEnemyStateIcon(e.state);
            let drawSymbol = icon || eDef.symbol;
            let drawClass = getEnemyDrawClass(e.type, e.state);
            output += `<span class="${drawClass}">${drawSymbol}</span>`;
          } else if (e.type === "chest" && !e.opened) {
            output += '<span class="tile-chest">□</span>';
          } else if (e.type === "chest" && e.opened) {
            output += '<span class="tile-chest-open">▪</span>';
          }
          drawn = true;
          break;
        }
      }

      if (!drawn) {
        if (map[y][x] === ">") output += '<span class="tile-exit">&gt;</span>';
        else output += map[y][x];
      }
    }
    output += "\n";
  }

  output += `\nHP: ${player.hp}/${player.maxHp} | ATK: ${player.atk} | DEF: ${player.def}`;
  output += `\nCRIT: ${player.crit}% | DODGE: ${player.dodge}%`;

  output += `\nFloor: ${dungeon.floor}`;
  output += `\nRooms cleared: ${dungeon.roomsCleared}`;
  output += renderActionLog();

  gameEl.innerHTML = output;
  drawUI();
}

// ===== UI =====
function drawUI() {
  let text = `=== CHARACTER ===\n`;
  text += `HP: ${player.hp}/${player.maxHp}\n`;
  text += `ATK: ${player.atk}\n`;
  text += `DEF: ${player.def}\n`;
  text += `CRIT: ${player.crit}%\n`;
  text += `DODGE: ${player.dodge}%\n`;
  text += `Gold: ${player.gold}\n\n`;
  text += "=== EQUIPMENT ===\n";

  for (let [slot, item] of Object.entries(player.equipment)) {
    if (!item) {
      text += `${slot}: empty\n`;
      continue;
    }

    text += `${slot}: ${renderItemNameSpan(item)} `;
    text += `(+${item.atk} ATK / +${item.def} DEF / +${item.hp} HP / +${item.crit}% CRIT / +${item.dodge}% DODGE)\n`;
    text += `${renderSpecialEffectLine(item)}\n`;
  }

  text += "\n=== INVENTORY ===\n";

  player.inventory.forEach((item, i) => {
    if (isMaterial(item)) {
      normalizeMaterialStack(item);
      text += `${i}: ${renderMaterialSpan(item)} `;
      text += `<span class="codex-meta">[x${item.quantity} | ${item.value}g ea]</span>\n`;
    } else {
      text += `${i}: ${renderItemNameSpan(item)} `;
      text += `<span class="codex-meta">[${item.type}/${item.slot}${item.part ? `/${item.part}` : ""}${item.hands === 2 ? "/2H" : ""}]</span> `;
      text += `(+${item.atk}/${item.def}/${item.hp}/${item.crit}%/${item.dodge}%)\n`;
      text += `${renderSpecialEffectLine(item)}\n`;
    }
  });

  uiEl.innerHTML = text;
}

// ===== EQUIP =====
function equipItem(index, shouldLog = true) {
  let item = player.inventory[index];
  if (!item) return null;
  if (isMaterial(item)) {
    if (shouldLog) logAction("That is a material, not equippable gear.");
    return null;
  }

  const canEquipInSlot = {
    head: ["armor"],
    chest: ["armor"],
    belt: ["armor"],
    legs: ["armor"],
    boots: ["armor"],
    necklace: ["accessory"],
    ring: ["accessory"],
    mainHand: ["weapon", "wand", "staff", "twoHandWeapon"],
    offHand: ["shield"]
  };

  if (!(canEquipInSlot[item.slot] || []).includes(item.type)) {
    if (shouldLog) logAction("Item type does not fit that slot.");
    return null;
  }

  if (item.type === "armor" && item.part && item.part !== item.slot) {
    if (shouldLog) logAction("Armor piece does not match that body slot.");
    return null;
  }

  if (item.type === "accessory" && item.part === "necklace" && item.slot !== "necklace") {
    if (shouldLog) logAction("Necklace must be equipped in necklace slot.");
    return null;
  }

  if (item.type === "accessory" && item.part === "ring" && item.slot !== "ring") {
    if (shouldLog) logAction("Ring must be equipped in a ring slot.");
    return null;
  }

  let action = "";

  if (item.slot === "ring") {
    if (!player.equipment.ring1) {
      player.equipment.ring1 = item;
      action = `Equipped ${item.name} in ring1.`;
    } else if (!player.equipment.ring2) {
      player.equipment.ring2 = item;
      action = `Equipped ${item.name} in ring2.`;
    } else {
      player.inventory.push(player.equipment.ring2);
      player.equipment.ring2 = item;
      action = `Swapped ring2 with ${item.name}.`;
    }
  } else if (item.slot === "offHand") {
    if (player.equipment.mainHand?.hands === 2) {
      if (shouldLog) logAction("Cannot equip offHand while using a 2H weapon.");
      return null;
    }

    if (player.equipment.offHand) {
      player.inventory.push(player.equipment.offHand);
      action = `Swapped offHand for ${item.name}.`;
    } else {
      action = `Equipped ${item.name} in offHand.`;
    }
    player.equipment.offHand = item;
  } else {
    if (item.slot === "mainHand" && item.hands === 2 && player.equipment.offHand) {
      player.inventory.push(player.equipment.offHand);
      player.equipment.offHand = null;
      action += "Cleared offHand for 2H weapon. ";
    }

    if (player.equipment[item.slot]) {
      player.inventory.push(player.equipment[item.slot]);
      action = `Swapped ${item.slot} for ${item.name}.`;
    } else {
      action += `Equipped ${item.name}.`;
    }
    player.equipment[item.slot] = item;
  }

  player.inventory.splice(index, 1);
  calculateStats();
  registerEquipmentEquipped(item);

  if (shouldLog) logAction(action);
  return action;
}

// ===== INPUT =====
document.addEventListener("keydown", (e) => {

  // ===== CODEX (global) =====
  const menuScreens = ["MENU", "CLASS_SELECT", "LOAD_SCREEN", "LORE_INTRO", "SETTINGS"];

  if (e.key.toLowerCase() === "k" && state !== "CODEX" && !menuScreens.includes(state)) {
    codexReturnState = state;
    state = "CODEX";
    draw();
    return;
  }

  if (e.key.toLowerCase() === "l" && !menuScreens.includes(state)) {
    showActionLog = !showActionLog;
    draw();
    return;
  }

  // ===== INVENTORY TABS (global) =====
  if (e.key === "Tab" && state === "INVENTORY") {
    e.preventDefault();
    inventoryTab = inventoryTab === "GEAR" ? "MATERIALS" : "GEAR";
    inventorySelection = 0;
    draw();
    return;
  }

  // ===== DUNGEON: TAB OPENS INVENTORY =====
  if (state === "DUNGEON" && e.key === "Tab") {
    e.preventDefault();
    inventoryReturnState = "DUNGEON";
    inventoryTab = "GEAR";
    inventorySelection = 0;
    state = "INVENTORY";
    draw();
    return;
  }

  if (state === "MENU") {
    if (e.key === "1") state = "CLASS_SELECT";
    if (e.key === "2") state = "LOAD_SCREEN";
    if (e.key === "3") state = "SETTINGS";
    draw();
    return;
  }

  if (state === "CLASS_SELECT") {
    if (e.key === "Escape") {
      state = "MENU";
    } else if (e.key === "1") {
      player.class = "witch";
      startGame();
    } else if (e.key === "2") {
      player.class = "orc";
      startGame();
    }
    draw();
    return;
  }

  if (state === "LOAD_SCREEN") {
    if (e.key === "Escape") {
      state = "MENU";
    } else if (e.key === "1") {
      if (loadGame()) {
        state = "TOWN";
        logAction("Loaded saved game.");
      } else {
        state = "MENU";
      }
    }
    draw();
    return;
  }

  if (state === "LORE_INTRO") {
    state = "TOWN";
    draw();
    return;
  }

  if (state === "SETTINGS") {
    if (e.key === "Escape") state = "MENU";
    draw();
    return;
  }

  // GLOBAL EXIT
  if (e.key === "Escape") {
    if (state === "CODEX") {
      state = codexReturnState;
    } else if (state === "INVENTORY") {
      state = inventoryReturnState;
      if (state === "TOWN") saveGame();
    } else if (state === "TOWN") {
      saveGame();
      state = "MENU";
    } else if (state !== "MENU") {
      enterTown();
    }
    draw();
    return;
  }

  // ===== TOWN =====
  if (state === "TOWN") {
    if (e.key === "1") {
      generateRoom();
      state = "DUNGEON";
    }
    if (e.key === "2") state = "MERCHANT";
    if (e.key === "3") state = "BLACKSMITH";
    if (e.key === "4") state = "GUILD";
    if (e.key.toLowerCase() === "c") {
      inventoryReturnState = "TOWN";
      state = "INVENTORY";
    }
    if (e.key.toLowerCase() === "m") {
      saveGame();
      state = "MENU";
    }

    draw();
    return;
  }

  let keyIndex = getNumberKeyIndex(e);

  // ===== MERCHANT =====
  if (state === "MERCHANT" && keyIndex !== null) {
    let i = keyIndex;
    let item = player.inventory[i];
    if (!item) return;
    if (isMaterial(item)) {
      logAction("Merchant refuses materials. Try the guild.");
      draw();
      return;
    }

    let baseValue = { common: 5, rare: 10, epic: 20, legendary: 50, unique: 120 }[item.rarity] || 5;
    let qualityMultiplier = 0.7 + getItemStars(item) * 0.15;
    if (item.rarity === "unique") qualityMultiplier = 1.2;
    let value = Math.max(1, Math.round(baseValue * qualityMultiplier));

    player.gold += value;
    player.inventory.splice(i, 1);
    logAction(`Sold ${item.name} for ${value}g.`);
    draw();
    return;
  }

  // ===== GUILD =====
  if (state === "GUILD" && keyIndex !== null) {
    let i = keyIndex;
    let item = player.inventory[i];
    if (!item) return;
    if (!isMaterial(item)) {
      logAction("Guild buys monster materials only.");
      draw();
      return;
    }

    normalizeMaterialStack(item);

    if (e.shiftKey) {
      let stackTotal = item.totalValue;
      let stackCount = item.quantity;
      player.gold += stackTotal;
      player.inventory.splice(i, 1);
      logAction(`Sold ${item.name} x${stackCount} for ${stackTotal}g.`);
    } else {
      let unitValue = Math.max(1, Math.round(item.totalValue / item.quantity));
      player.gold += unitValue;
      item.quantity -= 1;
      item.totalValue -= unitValue;

      if (item.quantity <= 0) {
        player.inventory.splice(i, 1);
      } else {
        item.value = Math.max(1, Math.round(item.totalValue / item.quantity));
      }

      logAction(`Sold 1 ${item.name} for ${unitValue}g.`);
    }

    draw();
    return;
  }

  // ===== BLACKSMITH =====
  if (state === "BLACKSMITH" && keyIndex !== null) {
    let keys = Object.keys(player.equipment);
    let slot = keys[keyIndex];
    let item = player.equipment[slot];

    if (item && player.gold >= 10) {
      item.atk += 1;
      item.def += 1;
      player.gold -= 10;
      calculateStats();
      logAction(`Upgraded ${slot} (+1 ATK / +1 DEF).`);
    } else if (item && player.gold < 10) {
      logAction("Not enough gold to upgrade.");
    }

    draw();
    return;
  }

  // ===== INVENTORY =====
  if (state === "INVENTORY" && keyIndex !== null) {
    // Build filtered list based on current tab
    let filteredItems = [];
    player.inventory.forEach((item, originalIndex) => {
      if (inventoryTab === "GEAR" && !isMaterial(item)) {
        filteredItems.push({ item, originalIndex });
      } else if (inventoryTab === "MATERIALS" && isMaterial(item)) {
        filteredItems.push({ item, originalIndex });
      }
    });

    // Get the actual inventory index from the display index
    if (keyIndex >= filteredItems.length) return;
    let actualIndex = filteredItems[keyIndex].originalIndex;

    let action = equipItem(actualIndex, inventoryReturnState !== "DUNGEON");

    if (inventoryReturnState === "DUNGEON" && action) {
      finishTurn(action);
    }

    draw();
    return;
  }

  // ===== INVENTORY CURSOR NAVIGATION =====
  if (state === "INVENTORY") {
    let filteredItems = [];
    player.inventory.forEach((item, originalIndex) => {
      if (inventoryTab === "GEAR" && !isMaterial(item)) {
        filteredItems.push({ item, originalIndex });
      } else if (inventoryTab === "MATERIALS" && isMaterial(item)) {
        filteredItems.push({ item, originalIndex });
      }
    });

    if (e.key === "ArrowUp") {
      inventorySelection = Math.max(0, inventorySelection - 1);
      draw();
      return;
    }

    if (e.key === "ArrowDown") {
      inventorySelection = Math.min(filteredItems.length - 1, inventorySelection + 1);
      draw();
      return;
    }

    if (e.key === "Enter") {
      if (inventorySelection >= 0 && inventorySelection < filteredItems.length) {
        let actualIndex = filteredItems[inventorySelection].originalIndex;
        let action = equipItem(actualIndex, inventoryReturnState !== "DUNGEON");

        if (inventoryReturnState === "DUNGEON" && action) {
          finishTurn(action);
        }
      }
      draw();
      return;
    }
  }

  // ===== DUNGEON MOVEMENT =====
  if (state !== "DUNGEON") return;

  if (e.key.toLowerCase() === "i" || e.key.toLowerCase() === "c") {
    inventoryReturnState = "DUNGEON";
    state = "INVENTORY";
    draw();
    return;
  }

  if (keyIndex !== null) {
    let action = equipItem(keyIndex, false);
    if (action) {
      finishTurn(`Quick equip: ${action}`);
      draw();
    }
    return;
  }

  let dx = 0, dy = 0;
  if (e.key === "ArrowUp") dy = -1;
  if (e.key === "ArrowDown") dy = 1;
  if (e.key === "ArrowLeft") dx = -1;
  if (e.key === "ArrowRight") dx = 1;

  let nx = player.x + dx;
  let ny = player.y + dy;

  if (state === "DUNGEON" && e.key === "x") {
  enterTown();
  draw();
  return;
}

  if (!map[ny] || !map[ny][nx]) {
    logAction("Cannot move there.");
    return;
  }

  if (map[ny][nx] === ">") {

  if (!isRoomCleared()) {
    // blocked
    logAction("Exit is locked until all goblins are defeated.");
    draw();
    return;
  }

  // go to next room
  dungeon.roomsCleared++;

  if (dungeon.roomsCleared % 3 === 0) {
    dungeon.floor++;
    logAction(`Advanced to floor ${dungeon.floor}.`);
  }

  generateRoom();
  saveGame();
  draw();
  return;
}

  if (map[ny][nx] === "#") {
    // wall
    logAction("Bumped into a wall.");
    return;
  }

  for (let e of entities) {
    if (e.x === nx && e.y === ny) {

      if (ENEMY_DEFS[e.type]) {
        let eDef = ENEMY_DEFS[e.type];
        let critBonus = Math.random() * 100 < player.crit ? 2 : 1;
        let dealt = Math.max(1, player.atk * critBonus);
        e.hp -= dealt;
        let result = critBonus > 1
          ? `Critical hit on ${eDef.name} for ${dealt}.`
          : `Hit ${eDef.name} for ${dealt}.`;

        // counter-attack with behavior checks
        let flees = eDef.behavior?.flees && e.hp < e.maxHp * 0.5;
        if (flees) {
          result += ` ${eDef.name} fled wounded.`;
        } else if (Math.random() * 100 >= player.dodge) {
          let counterAtk = e.atk;
          if (e.firstHit) {
            counterAtk *= 2;
            e.firstHit = false;
            result += ` ${eDef.name} struck first!`;
          }
          let taken = Math.max(1, counterAtk - player.def);
          player.hp -= taken;
          result += ` Took ${taken} damage.`;
        } else {
          if (e.firstHit) e.firstHit = false;
          result += " Dodged the counterattack.";
        }

        if (e.hp <= 0) {
          entities = entities.filter(en => en !== e);
          result += ` ${eDef.name} defeated.`;

          if (codex.enemies[e.type]) codex.enemies[e.type].kills++;

          let drops = rollEnemyDrops(e.type);
          for (let material of drops) {
            addMaterialToInventory(material);
            registerMaterial(material.materialId);
          }

          if (drops.length) {
            result += ` Looted ${drops.map(m => renderMaterialSpan(m)).join(", ")}.`;
          }

          let uniqueDrop = maybeRollUniqueFromEnemy(e.type);
          if (uniqueDrop) {
            player.inventory.push(uniqueDrop);
            registerEquipmentSeen(uniqueDrop);
            result += ` <span class="unique">Unique drop: ${uniqueDrop.name}.</span>`;
          }
        }

        if (player.hp <= 0) {
          player.hp = player.maxHp;
          turn++;
          enterTown("You were defeated and returned to town.");
          draw();
          return;
        }

        finishTurn(result);
        draw();
        return;
      }

      if (e.type === "chest" && !e.opened) {
        e.opened = true;
        let item = maybeRollUniqueFromChest() || generateItem(e.rarity);
        player.inventory.push(item);
        registerEquipmentSeen(item);
        finishTurn(`Opened chest and found ${renderItemNameSpan(item)}.`);
        draw();
        return;
      }
    }
  }

  player.x = nx;
  player.y = ny;
  finishTurn(`Moved to (${player.x},${player.y}).`, false);

  draw();
});

// ===== START =====
calculateStats();
draw();
