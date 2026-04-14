const gameEl = document.getElementById("game");
const uiEl = document.getElementById("ui");

let state = "MENU";
let turn = 0;
let actionLog = ["Welcome to Wrogue."];
let inventoryReturnState = "TOWN";
let codexReturnState = "TOWN";
let inventoryTab = "GEAR";
let inventorySelection = 0;
let codexTab = "CREATURES";
let codexSelection = 0;
let showActionLog = true;
let visualFlash = null;
let atmosphereBanner = "";
let atmosphereBannerTimeoutId = null;
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
  resourceType: "MP",
  resourceCurrent: 0,
  resourceMax: 0,
  inCombat: false,
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
const CODEX_TABS = ["CREATURES", "MATERIALS", "EQUIPMENT", "TOWN", "LORE"];
const CODEX_TOWN_ENTRIES = [
  {
    title: "Ashroot",
    className: "codex-section",
    summary: "Frontier town above the Wrogue.",
    detail: "Ashroot survives by trade, scavenging, and the hunters willing to descend below it."
  },
  {
    title: "Merchant",
    className: "codex-note",
    summary: "Buys found gear for gold.",
    detail: "The merchant cares about salvage value, rarity, and whether the item can be flipped to another hunter."
  },
  {
    title: "Blacksmith",
    className: "codex-note",
    summary: "Improves worn equipment.",
    detail: "The blacksmith turns gold into durability and edge. Later, crafting hooks can live here too."
  },
  {
    title: "Guild",
    className: "codex-note",
    summary: "Pays for monster materials.",
    detail: "The guild tracks proof of work, purchases raw materials, and will eventually tie into contracts and requests."
  }
];
const CODEX_LORE_ENTRIES = [
  {
    title: "First Arrival",
    className: "codex-section",
    summary: "You came to Ashroot under contract.",
    detail: "A guild contract, a rough weapon, and the promise of pay were enough to bring you to the mouth of the Wrogue."
  },
  {
    title: "Guild Contract",
    className: "codex-note",
    summary: "Kill, loot, and return alive.",
    detail: "The terms are simple: descend, recover valuables, document threats, and make it back to town breathing."
  },
  {
    title: "Dungeon Notes",
    className: "codex-note",
    summary: "The lower ruins are still unwritten.",
    detail: "This tab is ready for future journal entries, discovered notes, and unique-item lore connections."
  }
];

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

function applyClassTheme() {
  document.body.classList.remove("neutral-theme", "witch-theme", "orc-theme");
  if (player.class === "witch") {
    document.body.classList.add("witch-theme");
    return;
  }
  if (player.class === "orc") {
    document.body.classList.add("orc-theme");
    return;
  }
  document.body.classList.add("neutral-theme");
}

function getClassFlavorHint() {
  if (player.class === "witch") {
    return '<span class="codex-meta">Witch rite: arcane dossier mode active.</span>';
  }
  if (player.class === "orc") {
    return '<span class="codex-meta">Orc charter: guild war-ledger mode active.</span>';
  }
  return '<span class="codex-meta">Pick a class to attune your interface style.</span>';
}

function getCodexHeaderTitle() {
  if (player.class === "witch") return "=== ARCANE DOSSIER ===";
  if (player.class === "orc") return "=== GUILD WAR-LEDGER ===";
  return "=== HUNTER'S CODEX ===";
}

function getClassCombatLabel() {
  if (player.class === "witch") return "Hex State";
  if (player.class === "orc") return "War State";
  return "Combat";
}

function getClassEquipmentHeader() {
  if (player.class === "witch") return "=== RITE GEAR ===";
  if (player.class === "orc") return "=== WAR KIT ===";
  return "=== EQUIPMENT ===";
}

function getUniqueStingerLine(source) {
  if (player.class === "witch") {
    return source === "chest"
      ? '<span class="unique-stinger">✦ RELIC STIRS FROM THE CHEST ✦</span>'
      : '<span class="unique-stinger">✦ RELIC AWAKENED IN BLOOD ✦</span>';
  }

  if (player.class === "orc") {
    return source === "chest"
      ? '<span class="unique-stinger">✦ WAR-RELIC CLAIMED FROM LOOT ✦</span>'
      : '<span class="unique-stinger">✦ WAR-RELIC TAKEN IN HUNT ✦</span>';
  }

  return '<span class="unique-stinger">✦ UNIQUE RELIC RECOVERED ✦</span>';
}

function getClassTransitionText(eventType) {
  if (player.class === "witch") {
    if (eventType === "dungeon") return "Sigils settle. Descent logged.";
    if (eventType === "town") return "Ashroot wards answer. Debrief complete.";
    if (eventType === "codex") return "Arcane index opened.";
    return "Arcane thread steady.";
  }

  if (player.class === "orc") {
    if (eventType === "dungeon") return "Charter stamped. Hunt resumes.";
    if (eventType === "town") return "Contract filed. Debrief complete.";
    if (eventType === "codex") return "Ledger opened.";
    return "War-log steady.";
  }

  if (eventType === "dungeon") return "Descent recorded.";
  if (eventType === "town") return "Town report updated.";
  if (eventType === "codex") return "Codex opened.";
  return "Status updated.";
}

function setAtmosphereBanner(eventType) {
  atmosphereBanner = getClassTransitionText(eventType);
  if (atmosphereBannerTimeoutId) {
    clearTimeout(atmosphereBannerTimeoutId);
  }
  atmosphereBannerTimeoutId = setTimeout(() => {
    atmosphereBanner = "";
    atmosphereBannerTimeoutId = null;
    draw();
  }, 2200);
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
  if (rarity === "uncommon") return " ◇";
  return " ·";
}

function renderItemNameSpan(item) {
  return `<span class="${item.rarity}">${item.name}${getRaritySuffix(item.rarity)}</span>`;
}

function renderSpecialEffectLine(item) {
  if (!item || item.rarity !== "unique" || !item.specialEffect) return "";
  return `<span class="unique-effect">{${item.specialEffect}}</span>`;
}

function getLogLineClass(message) {
  let plain = message.replace(/<[^>]*>/g, "");

  if (/regen \+1 hp|healed|restored/i.test(plain)) return "log-heal";
  if (/strikes you for|ambushes you for|you were defeated/i.test(plain)) return "log-damage";
  if (/took \d+ damage/i.test(plain)) return "log-damage";
  if (/✸|defeated\./i.test(plain)) return "log-kill";
  if (/·→\*/i.test(plain)) return "log-arcane";
  if (/\[\/\]|critical hit/i.test(plain)) return "log-physical";
  if (/noticed you|is pursuing you|lost your trail/i.test(plain)) return "log-alert";
  if (/you dodge|dodged .+ambush/i.test(plain)) return "log-dodge";
  if (/fled wounded/i.test(plain)) return "log-flee";
  if (/relic/i.test(plain)) return "log-unique";
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
  updateCombatState();
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

function triggerFlash(x, y, element) {
  visualFlash = { x, y, element };
  setTimeout(() => {
    visualFlash = null;
    if (state === "DUNGEON") draw();
  }, 280);
}

function getAttackElement() {
  let sub = player.equipment.mainHand?.subType;
  if (sub === "blade")  return "fire";
  if (sub === "heavy")  return "physical";
  if (sub === "arcane") return "arcane";
  if (sub === "focus")  return "frost";
  return player.class === "orc" ? "physical" : "arcane";
}

function getClassResourceType() {
  return player.class === "orc" ? "ST" : "MP";
}

function getClassSkillName() {
  return player.class === "orc" ? "Rush" : "Hex Bolt";
}

function initClassResource(resetCurrent = false) {
  player.resourceType = getClassResourceType();
  player.resourceMax = 6;
  if (resetCurrent || !Number.isFinite(player.resourceCurrent)) {
    player.resourceCurrent = player.resourceMax;
  } else {
    player.resourceCurrent = Math.max(0, Math.min(player.resourceCurrent, player.resourceMax));
  }
  if (typeof player.inCombat !== "boolean") player.inCombat = false;
}

function isEnemyCombatState(enemy) {
  return enemy.state === "ALERT" || enemy.state === "CHASE" || enemy.state === "ATTACK";
}

function getNearestEnemy(maxRange = 6) {
  let best = null;
  let bestDist = Infinity;
  for (let enemy of entities) {
    if (!ENEMY_DEFS[enemy.type]) continue;
    let dist = getDistance(player.x, player.y, enemy.x, enemy.y);
    if (dist <= maxRange && dist < bestDist) {
      best = enemy;
      bestDist = dist;
    }
  }
  return best;
}

function collectEnemyRewards(enemy, eDef) {
  entities = entities.filter(en => en !== enemy);

  if (codex.enemies[enemy.type]) codex.enemies[enemy.type].kills++;

  let lootLine = ` ✸ ${eDef.name} defeated.`;
  let drops = rollEnemyDrops(enemy.type);
  for (let material of drops) {
    addMaterialToInventory(material);
    registerMaterial(material.materialId);
  }

  if (drops.length) {
    lootLine += ` Looted ${drops.map(m => renderMaterialSpan(m)).join(", ")}.`;
  }

  let uniqueDrop = maybeRollUniqueFromEnemy(enemy.type);
  if (uniqueDrop) {
    player.inventory.push(uniqueDrop);
    registerEquipmentSeen(uniqueDrop);
    lootLine += `\n${getUniqueStingerLine("enemy")}`;
    lootLine += `\n<span class="unique">Unique drop: ${uniqueDrop.name}.</span>`;
  }

  return lootLine;
}

function updateCombatState() {
  if (state !== "DUNGEON") {
    player.inCombat = false;
    return;
  }

  let nowInCombat = entities.some(e => ENEMY_DEFS[e.type] && isEnemyCombatState(e));
  if (nowInCombat && !player.inCombat) {
    player.resourceCurrent = player.resourceMax;
  }
  player.inCombat = nowInCombat;
}

function useWitchHexBolt() {
  let target = getNearestEnemy(5);
  if (!target) {
    logAction("No target in range for Hex Bolt.");
    draw();
    return true;
  }

  player.resourceCurrent -= 2;
  let eDef = ENEMY_DEFS[target.type];
  let damage = Math.max(2, player.atk + 2 + rand(0, 2));
  target.hp -= damage;

  let line = `·→* Hex Bolt hits ${eDef.name} for ${damage}.`;
  if (target.hp <= 0) {
    line += collectEnemyRewards(target, eDef);
  } else {
    triggerFlash(target.x, target.y, "arcane");
    target.state = "CHASE";
    target.alertTurns = 2;
  }

  finishTurn(line);
  draw();
  return true;
}

function useOrcRush() {
  let target = getNearestEnemy(6);
  if (!target) {
    logAction("No target in range for Rush.");
    draw();
    return true;
  }

  player.resourceCurrent -= 2;

  let dx = target.x - player.x;
  let dy = target.y - player.y;
  let stepX = 0;
  let stepY = 0;
  if (Math.abs(dx) >= Math.abs(dy)) stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  else stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  let moved = 0;
  for (let i = 0; i < 2; i++) {
    let nx = player.x + stepX;
    let ny = player.y + stepY;

    if (target.x === nx && target.y === ny) break;
    if (!isWalkableTile(nx, ny)) break;
    if (isOccupiedByBlockingEntity(nx, ny)) break;

    player.x = nx;
    player.y = ny;
    moved++;
  }

  let line = `[/] Rush surges ${moved} tile${moved === 1 ? "" : "s"}.`;
  let dist = getDistance(player.x, player.y, target.x, target.y);
  if (dist === 1) {
    let eDef = ENEMY_DEFS[target.type];
    let damage = Math.max(2, player.atk + 3 + rand(0, 2));
    target.hp -= damage;
    line += ` [/] You cleave ${eDef.name} for ${damage}.`;

    if (target.hp <= 0) {
      line += collectEnemyRewards(target, eDef);
    } else {
      triggerFlash(target.x, target.y, "physical");
      target.state = "ATTACK";
      target.alertTurns = 2;
    }
  } else {
    line += " No hit.";
  }

  finishTurn(line);
  draw();
  return true;
}

function useClassSkill() {
  if (state !== "DUNGEON") return false;

  if (!player.inCombat) {
    logAction(`${getClassSkillName()} can only be used in combat.`);
    draw();
    return true;
  }

  if (player.resourceCurrent < 2) {
    logAction(`Not enough ${player.resourceType}. Need 2 for ${getClassSkillName()}.`);
    draw();
    return true;
  }

  if (player.class === "orc") return useOrcRush();
  return useWitchHexBolt();
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

function resolveEnemyAttack(enemy, eDef, events) {
  if (eDef.behavior?.flees && enemy.hp < enemy.maxHp * 0.5) {
    enemy.state = "RETURN";
    events.push(`${eDef.name} fled wounded.`);
    return false;
  }
  if (Math.random() * 100 >= player.dodge) {
    let taken = Math.max(1, enemy.atk - player.def);
    player.hp -= taken;
    events.push(`${eDef.name} strikes you for ${taken}.`);
    return player.hp <= 0;
  }
  events.push(`You dodge ${eDef.name}'s attack.`);
  return false;
}

function runEnemyBehaviorTurn() {
  if (state !== "DUNGEON") return;

  let enemyEvents = [];
  let alertRange = 4;
  let chaseRange = 2;
  let dropChaseRange = 6;
  let playerDefeated = false;

  for (let enemy of entities) {
    if (playerDefeated) break;
    if (!ENEMY_DEFS[enemy.type]) continue;

    let eDef = ENEMY_DEFS[enemy.type];
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
      if (distToPlayer > dropChaseRange) {
        enemy.state = "RETURN";
      } else if (distToPlayer === 1) {
        enemy.state = "ATTACK";
        let died = resolveEnemyAttack(enemy, eDef, enemyEvents);
        if (died) {
          player.hp = player.maxHp;
          enterTown("You were defeated and returned to town.");
          playerDefeated = true;
        }
      } else {
        tryMoveEnemyToward(enemy, player.x, player.y);
        let postMoveDist = getDistance(enemy.x, enemy.y, player.x, player.y);
        if (postMoveDist === 1) {
          enemy.state = "ATTACK";
          let died = resolveEnemyAttack(enemy, eDef, enemyEvents);
          if (died) {
            player.hp = player.maxHp;
            enterTown("You were defeated and returned to town.");
            playerDefeated = true;
          }
        }
      }
    } else if (enemy.state === "ATTACK") {
      if (distToPlayer > dropChaseRange) {
        enemy.state = "RETURN";
      } else if (distToPlayer !== 1) {
        enemy.state = "CHASE";
      } else {
        let died = resolveEnemyAttack(enemy, eDef, enemyEvents);
        if (died) {
          player.hp = player.maxHp;
          enterTown("You were defeated and returned to town.");
          playerDefeated = true;
        }
      }
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
      if (enemy.state === "ALERT") enemyEvents.push(`${eDef.name} noticed you!`);
      if (enemy.state === "CHASE") enemyEvents.push(`${eDef.name} is pursuing you.`);
      if (enemy.state === "RETURN" && !enemyEvents.some(ev => ev.includes("fled wounded"))) {
        enemyEvents.push(`${eDef.name} lost your trail.`);
      }
    }
  }

  for (let evt of enemyEvents) {
    logAction(evt);
  }
}

const BASE_ITEMS = [
  { id: "dagger", name: "Dagger", type: "weapon", slot: "mainHand", part: null, hands: 1, subType: "blade", atk: 2, def: 0, hp: 0, crit: 1, dodge: 0, codexText: "A short blade favored for quick work in tight corridors." },
  { id: "sword", name: "Sword", type: "weapon", slot: "mainHand", part: null, hands: 1, subType: "blade", atk: 3, def: 0, hp: 0, crit: 0, dodge: 0, codexText: "A reliable hunter's sidearm with no wasted motion." },
  { id: "axe", name: "Axe", type: "weapon", slot: "mainHand", part: null, hands: 1, subType: "blade", atk: 4, def: 0, hp: 0, crit: 0, dodge: -1, codexText: "Crude but brutal. Favored when reach matters less than force." },
  { id: "mace", name: "Mace", type: "weapon", slot: "mainHand", part: null, hands: 1, subType: "blade", atk: 3, def: 1, hp: 0, crit: 0, dodge: 0, codexText: "A weighted head built to break shell, bone, and stubborn armor." },
  { id: "wand", name: "Wand", type: "wand", slot: "mainHand", part: null, hands: 1, subType: "arcane", atk: 2, def: 1, hp: 0, crit: 1, dodge: 0, codexText: "A focus for quick rites and narrow lines of force." },
  { id: "staff", name: "Staff", type: "staff", slot: "mainHand", part: null, hands: 1, subType: "focus", atk: 3, def: 1, hp: 1, crit: 0, dodge: 0, codexText: "A long ritual focus that steadies the hand and the pulse." },
  { id: "greatsword", name: "Greatsword", type: "twoHandWeapon", slot: "mainHand", part: null, hands: 2, subType: "heavy", atk: 6, def: 0, hp: 0, crit: 0, dodge: -1, codexText: "A broad iron slab made for ending a fight in one clean exchange." },
  { id: "warhammer", name: "Warhammer", type: "twoHandWeapon", slot: "mainHand", part: null, hands: 2, subType: "heavy", atk: 7, def: 0, hp: 1, crit: 0, dodge: -2, codexText: "A heavy crusher suited for wardens, beetles, and doors." },
  { id: "buckler", name: "Buckler", type: "shield", slot: "offHand", part: null, hands: 1, subType: "guard", atk: 0, def: 2, hp: 0, crit: 0, dodge: 1, codexText: "Small enough to turn a blow without slowing the wrist." },
  { id: "kite_shield", name: "Kite Shield", type: "shield", slot: "offHand", part: null, hands: 1, subType: "guard", atk: 0, def: 3, hp: 1, crit: 0, dodge: 0, codexText: "A broad shield fit for a steady line and patient advance." },
  { id: "hood", name: "Hood", type: "armor", slot: "head", part: "head", hands: 0, subType: null, atk: 0, def: 1, hp: 1, crit: 0, dodge: 0, codexText: "A plain hood that hides more than it protects." },
  { id: "helmet", name: "Helmet", type: "armor", slot: "head", part: "head", hands: 0, subType: null, atk: 0, def: 2, hp: 1, crit: 0, dodge: -1, codexText: "Simple forged protection for anyone expecting a hard hit." },
  { id: "vest", name: "Vest", type: "armor", slot: "chest", part: "chest", hands: 0, subType: null, atk: 0, def: 1, hp: 2, crit: 0, dodge: 0, codexText: "A light chest layer made for motion before armor." },
  { id: "chestplate", name: "Chestplate", type: "armor", slot: "chest", part: "chest", hands: 0, subType: null, atk: 0, def: 3, hp: 2, crit: 0, dodge: -1, codexText: "Plated protection that trades comfort for survival." },
  { id: "belt", name: "Belt", type: "armor", slot: "belt", part: "belt", hands: 0, subType: null, atk: 0, def: 1, hp: 1, crit: 0, dodge: 0, codexText: "A practical strap for tools, charms, and emergency salvage." },
  { id: "pants", name: "Pants", type: "armor", slot: "legs", part: "legs", hands: 0, subType: null, atk: 0, def: 2, hp: 1, crit: 0, dodge: 0, codexText: "Workmanlike legwear meant for stairs, rubble, and grime." },
  { id: "boots", name: "Boots", type: "armor", slot: "boots", part: "boots", hands: 0, subType: null, atk: 0, def: 1, hp: 0, crit: 0, dodge: 1, codexText: "Good footing saves more lives than bravado ever has." },
  { id: "ring", name: "Ring", type: "accessory", slot: "ring", part: "ring", hands: 0, subType: null, atk: 0, def: 0, hp: 0, crit: 1, dodge: 1, codexText: "A small circle of luck, vanity, or quiet warding." },
  { id: "necklace", name: "Necklace", type: "accessory", slot: "necklace", part: "necklace", hands: 0, subType: null, atk: 0, def: 0, hp: 1, crit: 1, dodge: 0, codexText: "A worn charm resting close to the pulse." }
];

const PREFIXES = [
  { id: "rusted", name: "Rusted", allowedTypes: ["weapon", "twoHandWeapon", "shield", "armor"], atk: -1, def: 0, hp: 0, crit: 0, dodge: 0, effects: [], codexText: "Time and damp have thinned its edge and dulled its pride." },
  { id: "sharp", name: "Sharp", allowedTypes: ["weapon"], atk: 2, def: 0, hp: 0, crit: 1, dodge: 0, effects: [], codexText: "A careful edge that rewards clean intent." },
  { id: "heavy", name: "Heavy", allowedTypes: ["weapon", "twoHandWeapon", "shield", "armor"], atk: 2, def: 1, hp: 1, crit: 0, dodge: -1, effects: [], codexText: "Weight traded for certainty. Slow, but convincing." },
  { id: "balanced", name: "Balanced", allowedTypes: ["weapon", "wand", "staff", "shield"], atk: 1, def: 1, hp: 0, crit: 0, dodge: 1, effects: [], codexText: "Evenly made, with no wasted angle or pull." },
  { id: "runed", name: "Runed", allowedTypes: ["wand", "staff", "accessory"], atk: 1, def: 0, hp: 0, crit: 1, dodge: 0, effects: [], codexText: "Etched marks cling to quiet magic and old intent." },
  { id: "reinforced", name: "Reinforced", allowedTypes: ["shield", "armor"], atk: 0, def: 2, hp: 1, crit: 0, dodge: -1, effects: [], codexText: "Extra plate and stubborn craft turned toward endurance." }
];

const SUFFIXES = [
  { id: "of_ash", name: "of Ash", allowedTypes: ["weapon", "twoHandWeapon", "wand", "staff", "shield", "armor", "accessory"], atk: 0, def: 1, hp: 0, crit: 0, dodge: 0, effects: [], codexText: "Dust, ruin, and ember cling stubbornly to it." },
  { id: "of_stone", name: "of Stone", allowedTypes: ["shield", "armor"], atk: 0, def: 2, hp: 1, crit: 0, dodge: -1, effects: [], codexText: "Dense and unyielding, as if quarry weight lives inside it." },
  { id: "of_echoes", name: "of Echoes", allowedTypes: ["wand", "staff", "accessory"], atk: 1, def: 0, hp: 0, crit: 1, dodge: 0, effects: [], codexText: "Something in it hums with the memory of spoken rites." },
  { id: "of_decay", name: "of Decay", allowedTypes: ["weapon", "wand", "staff"], atk: 2, def: -1, hp: 0, crit: 0, dodge: 0, effects: [], codexText: "Rot-sick force lingers in the grain and edge." },
  { id: "of_the_hunt", name: "of the Hunt", allowedTypes: ["weapon", "twoHandWeapon", "armor", "accessory"], allowedSlots: ["boots", "ring", "necklace", "mainHand"], atk: 1, def: 0, hp: 0, crit: 0, dodge: 2, effects: [], codexText: "Made for pursuit, patience, and the last clean step." }
];

const RARITY_RULES = {
  common: { multiplier: 1.0, prefix: false, suffix: false },
  uncommon: { multiplier: 1.1, prefix: true, suffix: false },
  rare: { multiplier: 1.25, prefix: true, suffix: true },
  epic: { multiplier: 1.45, prefix: true, suffix: true },
  legendary: { multiplier: 1.7, prefix: true, suffix: true },
  unique: { multiplier: 1.0, prefix: false, suffix: false }
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
  },
  dungeon_guard: {
    name: "Dungeon Guard",
    symbol: "G",
    family: "Dungeon Wardens",
    colorClass: "enemy-elite",
    hp: 10, atk: 3, def: 3,
    behavior: {},
    lore: [
      { kills: 0,  text: "A hulking warden posted at the threshold of deeper ruins." },
      { kills: 5,  text: "Old armor, strong arms. Not clever, but doesn't need to be." },
      { kills: 12, text: "The guild pays a premium for warden-class chitin and plate." }
    ],
    drops: [
      { id: "chitin_plate", chance: 0.80 },
      { id: "scrap_metal",  chance: 0.50 }
    ]
  },
  shadow_stalker: {
    name: "Shadow Stalker",
    symbol: "S",
    family: "Deep Dwellers",
    colorClass: "enemy-corrupted",
    hp: 7, atk: 4, def: 0,
    behavior: { firstStrike: true },
    lore: [
      { kills: 0,  text: "A predator born from the dark between floors. Moves first." },
      { kills: 4,  text: "Its venomous coil leaves hunters weaker long after the bite." },
      { kills: 10, text: "Deep hunters carry antidotes. The rest don't come back." }
    ],
    drops: [
      { id: "bone_fragment", chance: 1 },
      { id: "venom_sac",     chance: 0.35 }
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

function getRarityOrder(rarity) {
  return {
    unique: 5,
    legendary: 4,
    epic: 3,
    rare: 2,
    uncommon: 1,
    common: 0
  }[rarity] || 0;
}

function getCodexTabItems(tab) {
  if (tab === "CREATURES") {
    return Object.entries(codex.enemies)
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  if (tab === "MATERIALS") {
    let tierOrder = { boss: 4, rare: 3, crafting: 2, common: 1 };
    return Object.entries(codex.materials)
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => {
        let tierDiff = (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
        if (tierDiff !== 0) return tierDiff;
        return a.name.localeCompare(b.name);
      });
  }

  if (tab === "EQUIPMENT") {
    return Object.entries(codex.equipment)
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => {
        let uniqueDiff = Number(b.rarity === "unique") - Number(a.rarity === "unique");
        if (uniqueDiff !== 0) return uniqueDiff;
        let rarityDiff = getRarityOrder(b.rarity) - getRarityOrder(a.rarity);
        if (rarityDiff !== 0) return rarityDiff;
        return (a.name || "").localeCompare(b.name || "");
      });
  }

  if (tab === "TOWN") return CODEX_TOWN_ENTRIES;
  if (tab === "LORE") return CODEX_LORE_ENTRIES;
  return [];
}

function clampCodexSelection(items) {
  if (!items.length) {
    codexSelection = 0;
    return;
  }
  codexSelection = Math.max(0, Math.min(items.length - 1, codexSelection));
}

function renderCodexRow(entry, tab, isSelected) {
  let marker = isSelected ? "→ " : "  ";

  if (tab === "CREATURES") {
    let colorClass = entry.colorClass || "enemy-common";
    let symbol = entry.symbol || "?";
    return `${marker}<span class="${colorClass}">${symbol} ${entry.name}</span> <span class="codex-meta">[${entry.family}] seen:${entry.seen} kills:${entry.kills}</span>`;
  }

  if (tab === "MATERIALS") {
    let colorClass = entry.colorClass || "material-common";
    return `${marker}<span class="${colorClass}">${entry.name}</span> <span class="codex-meta">[${entry.tier}]</span>`;
  }

  if (tab === "EQUIPMENT") {
    let rarity = entry.highestRarity || entry.rarity || "common";
    let prefixCount = Object.keys(entry.discoveredPrefixes || {}).length;
    let suffixCount = Object.keys(entry.discoveredSuffixes || {}).length;
    let brief = rarity === "unique"
      ? "lore relic"
      : `p:${prefixCount} s:${suffixCount} +${entry.bestAtk || 0}/+${entry.bestDef || 0}`;
    return `${marker}<span class="${rarity}">${entry.name}</span> <span class="codex-meta">${rarity} ${brief}</span>`;
  }

  let className = entry.className || "codex-note";
  return `${marker}<span class="${className}">${entry.title}</span> <span class="codex-meta">${entry.summary}</span>`;
}

function renderCodexDetail(entry, tab) {
  if (!entry) return '<span class="codex-meta">Nothing recorded yet.</span>';

  if (tab === "CREATURES") {
    let colorClass = entry.colorClass || "enemy-common";
    let lore = getEnemyLore(entry.key, entry);
    return `<span class="${colorClass}">${entry.name}</span> <span class="codex-meta">[${entry.family}]</span>\n`
      + `<span class="codex-meta">seen: ${entry.seen} | kills: ${entry.kills}</span>\n`
      + `<span class="codex-note">"${lore}"</span>`;
  }

  if (tab === "MATERIALS") {
    let colorClass = entry.colorClass || "material-common";
    return `<span class="${colorClass}">${entry.name}</span> <span class="codex-meta">[${entry.tier}]</span>\n`
      + `<span class="codex-note">${entry.uses}</span>`;
  }

  if (tab === "EQUIPMENT") {
    let rarity = entry.highestRarity || entry.rarity || "common";
    let typeLine = rarity === "unique"
      ? `<span class="codex-meta">ancient item record</span>`
      : `<span class="codex-meta">${entry.type} [${entry.slot}]${entry.hands === 2 ? " 2H" : ""}</span>`;
    let effectLine = entry.specialEffect
      ? `\n<span class="unique-effect">effect: ${entry.specialEffect}</span>`
      : "";
    let prefixes = Object.values(entry.discoveredPrefixes || {});
    let suffixes = Object.values(entry.discoveredSuffixes || {});
    let affixLine = rarity === "unique"
      ? `<span class="codex-note">${entry.description || "A relic with a name older than the ledger."}</span>`
      : `<span class="codex-note">prefixes: ${prefixes.length ? prefixes.join(", ") : "none"} | suffixes: ${suffixes.length ? suffixes.join(", ") : "none"}</span>`;
    let descriptionLine = rarity === "unique" || !entry.description
      ? ""
      : `\n<span class="codex-meta">${entry.description}</span>`;
    return `<span class="${rarity}">${entry.name}</span>\n`
      + `${typeLine}\n`
      + `<span class="codex-meta">seen: ${entry.seen} | equipped: ${entry.equipped}</span>\n`
      + `<span class="codex-note">best rolls: +${entry.bestAtk || 0} ATK / +${entry.bestDef || 0} DEF / +${entry.bestHp || 0} HP / +${entry.bestCrit || 0} CRIT / +${entry.bestDodge || 0} DODGE</span>\n`
      + affixLine
      + descriptionLine
      + effectLine;
  }

  return `<span class="${entry.className || "codex-note"}">${entry.title}</span>\n`
    + `<span class="codex-meta">${entry.summary}</span>\n`
    + `<span class="codex-note">${entry.detail}</span>`;
}

function renderCodexTabBar() {
  let parts = CODEX_TABS.map(tab => codexTab === tab ? `► ${tab}` : tab);
  return `<span class="codex-meta">[Tab] ${parts.join(" | ")}</span>`;
}

function getEnemyPool() {
  if (dungeon.floor <= 2)  return ["rat", "goblin"];
  if (dungeon.floor <= 4)  return ["rat", "goblin", "cave_snake"];
  if (dungeon.floor <= 6)  return ["goblin", "cave_snake", "stone_beetle", "dungeon_guard"];
  if (dungeon.floor <= 8)  return ["cave_snake", "stone_beetle", "dungeon_guard"];
  return ["stone_beetle", "dungeon_guard", "shadow_stalker"];
}

function getEnemyCount() {
  if (dungeon.floor === 1) return rand(1, 2);
  if (dungeon.floor <= 3)  return rand(2, 3);
  if (dungeon.floor <= 6)  return rand(2, 4);
  return rand(3, 5);
}

function spawnEnemy(type, x, y) {
  let def = ENEMY_DEFS[type];
  let hp = def.hp + (dungeon.floor - 1) * 2;
  let atk = def.atk + Math.floor(dungeon.floor * 0.65);
  let defStat = def.def + Math.floor((dungeon.floor - 1) / 3);

  let elite = dungeon.floor >= 5 && Math.random() < 0.20;
  if (elite) {
    hp = Math.round(hp * 1.6);
    atk = Math.round(atk * 1.4);
  }

  let entity = {
    type,
    x, y,
    spawnX: x,
    spawnY: y,
    state: "IDLE",
    alertTurns: 0,
    hp,
    maxHp: hp,
    atk,
    def: defStat,
    elite
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
    item.effects = Array.isArray(item.effects) ? item.effects : [];
    item.isUnique = true;
    item.baseId = item.baseId || item.id || item.name;
    item.baseName = item.baseName || item.name;
    item.prefixId = null;
    item.prefixName = null;
    item.suffixId = null;
    item.suffixName = null;
    item.codexText = item.codexText || item.specialEffect || "An old relic with a will of its own.";
    if (!item.specialEffect) item.specialEffect = "Ancient power stirs within.";
  } else {
    item.baseId = item.baseId || `legacy:${item.type}:${item.slot}:${item.part || item.subType || item.name || "gear"}`;
    item.baseName = item.baseName || item.name || item.type;
    item.prefixId = item.prefixId || null;
    item.prefixName = item.prefixName || null;
    item.suffixId = item.suffixId || null;
    item.suffixName = item.suffixName || null;
    item.effects = Array.isArray(item.effects) ? item.effects : [];
    item.codexText = item.codexText || "Recovered field gear logged by the guild.";
    item.isUnique = false;
  }
  delete item.stars;
  return item;
}

function rollBaseRarityByFloor() {
  let floor = dungeon.floor;
  let roll = Math.random();

  if (floor === 1) {
    return roll < 0.85 ? "common" : "uncommon";
  }
  if (floor === 2) {
    if (roll < 0.65) return "common";
    if (roll < 0.95) return "uncommon";
    return "rare";
  }
  if (floor <= 4) {
    if (roll < 0.40) return "common";
    if (roll < 0.75) return "uncommon";
    if (roll < 0.95) return "rare";
    return "epic";
  }
  if (floor <= 7) {
    if (roll < 0.24) return "common";
    if (roll < 0.56) return "uncommon";
    if (roll < 0.84) return "rare";
    if (roll < 0.97) return "epic";
    return "legendary";
  }
  if (floor <= 10) {
    if (roll < 0.12) return "common";
    if (roll < 0.34) return "uncommon";
    if (roll < 0.66) return "rare";
    if (roll < 0.91) return "epic";
    return "legendary";
  }
  if (roll < 0.08) return "common";
  if (roll < 0.23) return "uncommon";
  if (roll < 0.52) return "rare";
  if (roll < 0.81) return "epic";
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
    baseId: t.id,
    baseName: t.name,
    type: t.type,
    part: t.part || null,
    subType: t.subType || null,
    hands: t.hands,
    slot: t.slot,
    rarity: "unique",
    prefixId: null,
    prefixName: null,
    suffixId: null,
    suffixName: null,
    effects: [],
    isUnique: true,
    codexText: t.codexText || t.specialEffect,
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
  let isBossLike = enemyType === "stone_beetle" || enemyType === "dungeon_guard";
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
    : `base:${item.baseId || item.name}`;
  if (!codex.equipment[key]) {
    codex.equipment[key] = {
      name: item.rarity === "unique" ? item.name : (item.baseName || item.name),
      type: item.type,
      slot: item.slot,
      baseId: item.baseId || "",
      hands: item.hands || 0,
      rarity: item.rarity || "common",
      highestRarity: item.rarity || "common",
      specialEffect: item.specialEffect || "",
      description: item.codexText || "",
      seen: 0,
      equipped: 0,
      bestAtk: 0,
      bestDef: 0,
      bestHp: 0,
      bestCrit: 0,
      bestDodge: 0,
      discoveredPrefixes: {},
      discoveredSuffixes: {}
    };
  }

  codex.equipment[key].seen++;
  if (getRarityOrder(item.rarity || "common") > getRarityOrder(codex.equipment[key].highestRarity || codex.equipment[key].rarity)) {
    codex.equipment[key].highestRarity = item.rarity || "common";
  }
  codex.equipment[key].bestAtk = Math.max(codex.equipment[key].bestAtk, item.atk || 0);
  codex.equipment[key].bestDef = Math.max(codex.equipment[key].bestDef, item.def || 0);
  codex.equipment[key].bestHp = Math.max(codex.equipment[key].bestHp || 0, item.hp || 0);
  codex.equipment[key].bestCrit = Math.max(codex.equipment[key].bestCrit || 0, item.crit || 0);
  codex.equipment[key].bestDodge = Math.max(codex.equipment[key].bestDodge || 0, item.dodge || 0);
  codex.equipment[key].description = codex.equipment[key].description || item.codexText || "";
  if (item.prefixId && item.prefixName) codex.equipment[key].discoveredPrefixes[item.prefixId] = item.prefixName;
  if (item.suffixId && item.suffixName) codex.equipment[key].discoveredSuffixes[item.suffixId] = item.suffixName;
}

function registerEquipmentEquipped(item) {
  let key = item.rarity === "unique"
    ? `unique:${item.id || item.name}`
    : `base:${item.baseId || item.name}`;
  if (!codex.equipment[key]) registerEquipmentSeen(item);
  codex.equipment[key].equipped++;
}

function matchesAffix(base, affix) {
  if (affix.allowedTypes && !affix.allowedTypes.includes(base.type)) return false;
  if (affix.allowedSlots && !affix.allowedSlots.includes(base.slot)) return false;
  return true;
}

function pickAffix(pool, base) {
  let valid = pool.filter(affix => matchesAffix(base, affix));
  if (!valid.length) return null;
  return valid[rand(0, valid.length - 1)];
}

function buildGeneratedName(base, prefix, suffix) {
  return `${prefix ? `${prefix.name} ` : ""}${base.name}${suffix ? ` ${suffix.name}` : ""}`;
}

function buildGeneratedCodexText(base, prefix, suffix) {
  let parts = [base.codexText];
  if (prefix?.codexText) parts.push(prefix.codexText);
  if (suffix?.codexText) parts.push(suffix.codexText);
  return parts.filter(Boolean).join(" ");
}

function generateItem(rarity) {
  let base = BASE_ITEMS[rand(0, BASE_ITEMS.length - 1)];
  let rarityRule = RARITY_RULES[rarity] || RARITY_RULES.common;
  let prefix = rarityRule.prefix ? pickAffix(PREFIXES, base) : null;
  let suffix = rarityRule.suffix ? pickAffix(SUFFIXES, base) : null;
  let floorBonus = Math.max(0, Math.floor((dungeon.floor - 1) / 3));

  let atk = base.atk + (prefix?.atk || 0) + (suffix?.atk || 0);
  let def = base.def + (prefix?.def || 0) + (suffix?.def || 0);
  let hp = base.hp + (prefix?.hp || 0) + (suffix?.hp || 0);
  let crit = base.crit + (prefix?.crit || 0) + (suffix?.crit || 0);
  let dodge = base.dodge + (prefix?.dodge || 0) + (suffix?.dodge || 0);

  atk = Math.round(atk * rarityRule.multiplier);
  def = Math.round(def * rarityRule.multiplier);
  hp = Math.round(hp * rarityRule.multiplier);
  crit = Math.round(crit * rarityRule.multiplier);
  dodge = Math.round(dodge * rarityRule.multiplier);

  if (["weapon", "twoHandWeapon", "wand", "staff"].includes(base.type)) atk += floorBonus;
  if (["shield", "armor"].includes(base.type)) def += floorBonus;
  if (["shield", "armor", "accessory"].includes(base.type)) hp += Math.floor(floorBonus / 2);

  return {
    id: `gear_${base.id}_${prefix?.id || "plain"}_${suffix?.id || "plain"}_${turn}_${rand(1000, 9999)}`,
    name: buildGeneratedName(base, prefix, suffix),
    type: base.type,
    part: base.part || null,
    subType: base.subType || null,
    hands: base.hands,
    slot: base.slot,
    baseId: base.id,
    baseName: base.name,
    prefixId: prefix?.id || null,
    prefixName: prefix?.name || null,
    suffixId: suffix?.id || null,
    suffixName: suffix?.name || null,
    rarity,
    atk,
    def,
    hp,
    crit,
    dodge,
    effects: [...(prefix?.effects || []), ...(suffix?.effects || [])],
    codexText: buildGeneratedCodexText(base, prefix, suffix),
    isUnique: false
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
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "rarity")) {
        codex.equipment[key].rarity = "common";
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "highestRarity")) {
        codex.equipment[key].highestRarity = codex.equipment[key].rarity || "common";
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "specialEffect")) {
        codex.equipment[key].specialEffect = "";
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "description")) {
        codex.equipment[key].description = "";
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "bestHp")) {
        codex.equipment[key].bestHp = 0;
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "bestCrit")) {
        codex.equipment[key].bestCrit = 0;
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "bestDodge")) {
        codex.equipment[key].bestDodge = 0;
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "discoveredPrefixes")) {
        codex.equipment[key].discoveredPrefixes = {};
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "discoveredSuffixes")) {
        codex.equipment[key].discoveredSuffixes = {};
      }
    }
  }

  calculateStats();
  initClassResource(false);
  player.inCombat = false;
  player.hp = Math.min(player.hp || player.maxHp, player.maxHp);
  player.inventory = player.inventory.map(item => isMaterial(item) ? normalizeMaterialStack(item) : normalizeGearItem(item));

  for (let slot of Object.keys(player.equipment)) {
    player.equipment[slot] = normalizeGearItem(player.equipment[slot]);
  }

  return true;
}

function enterTown(message = "Returned to town.") {
  state = "TOWN";
  player.inCombat = false;
  logAction(message);
  setAtmosphereBanner("town");
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
  initClassResource(true);
  player.inCombat = false;
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
  setAtmosphereBanner("dungeon");
  updateCombatState();
}


// ===== DRAW =====
function draw() {
  applyClassTheme();

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
<span class="codex-note">  Arrows    Move / Navigate inventory or codex
  Enter     Confirm / Equip
  Q         Class skill (combat only)
  K         Toggle codex
  L         Toggle action log
  Tab       Switch tabs / Open inventory
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
K. Codex
M. Main Menu

Gold: ${player.gold}
HP: ${player.hp}
`;
  if (atmosphereBanner) {
    gameEl.innerHTML += `\n<span class="flow-banner">${atmosphereBanner}</span>`;
  }
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
      let effectLine = renderSpecialEffectLine(item);
      if (effectLine) text += `${effectLine}\n`;
    });
    text += "\nESC to exit";
    text += renderActionLog();
    gameEl.innerHTML = text;
    drawUI();
    return;
  }

  if (state === "CODEX") {
    let items = getCodexTabItems(codexTab);
    clampCodexSelection(items);
    let selected = items[codexSelection] || null;

    let text = `<span class="codex-title">${getCodexHeaderTitle()}</span>\n`;
    text += `${renderCodexTabBar()}\n\n`;
    text += `<span class="codex-section">-- ${codexTab} --</span>\n`;

    if (!items.length) {
      text += '<span class="codex-meta">Nothing recorded yet.</span>\n';
    } else {
      items.forEach((entry, index) => {
        text += `${renderCodexRow(entry, codexTab, index === codexSelection)}\n`;
      });
    }

    text += '\n<span class="codex-section">-- Detail --</span>\n';
    text += `${renderCodexDetail(selected, codexTab)}\n`;
    text += '\n<span class="codex-meta">[↑↓] navigate | [Tab] switch tab | [K/ESC] exit | [L] log</span>';
    if (atmosphereBanner) {
      text += `\n<span class="flow-banner">${atmosphereBanner}</span>`;
    }
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
        let effectLine = renderSpecialEffectLine(item);
        if (effectLine) text += `${effectLine}\n`;
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
          let effectLine = renderSpecialEffectLine(item);
          if (effectLine) text += `${effectLine}\n`;
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
            if (e.elite) drawClass += " enemy-elite-mark";
            if (visualFlash && e.x === visualFlash.x && e.y === visualFlash.y) {
              drawClass += ` tile-hit-${visualFlash.element}`;
            }
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

  output += `\nDungeon Floor: ${dungeon.floor}`;
  output += `\n${getClassCombatLabel()}: ${player.inCombat ? '<span class="log-alert">ENGAGED</span>' : '<span class="codex-meta">idle</span>'}`;
  output += `\n${player.resourceType}: ${player.resourceCurrent}/${player.resourceMax} | Skill[Q]: ${getClassSkillName()} (2 ${player.resourceType})`;
  output += `\nFloor: ${dungeon.floor}`;
  output += `\nRooms cleared: ${dungeon.roomsCleared}`;
  if (atmosphereBanner) {
    output += `\n<span class="flow-banner">${atmosphereBanner}</span>`;
  }
  output += renderActionLog();

  gameEl.innerHTML = output;
  drawUI();
}

// ===== UI =====
function drawUI() {
  if (state === "TOWN") {
    let text = `=== ASHROOT HUB ===\n`;
    text += `HP: ${player.hp}/${player.maxHp}\n`;
    text += `Gold: ${player.gold}\n`;
    text += `Floor: ${dungeon.floor} | Rooms: ${dungeon.roomsCleared}\n`;
    if (atmosphereBanner) text += `\n<span class="flow-banner">${atmosphereBanner}</span>\n`;
    uiEl.innerHTML = text;
    return;
  }

  if (state === "CODEX") {
    let text = `=== CODEX MODE ===\n`;
    text += `Active Tab: ${codexTab}\n`;
    text += `Class Lens: ${player.class || "neutral"}\n\n`;
    text += `=== NAVIGATION ===\n`;
    text += `<span class="codex-meta">[↑↓] select\n[Tab] cycle tabs\n[K/ESC] close codex\n[L] log</span>\n`;
    text += `${getClassFlavorHint()}\n`;
    uiEl.innerHTML = text;
    return;
  }

  let text = `=== CHARACTER ===\n`;
  text += `Class: ${player.class || "unknown"}\n`;
  text += `HP: ${player.hp}/${player.maxHp}\n`;
  text += `ATK: ${player.atk}\n`;
  text += `DEF: ${player.def}\n`;
  text += `CRIT: ${player.crit}%\n`;
  text += `DODGE: ${player.dodge}%\n`;
  text += `${player.resourceType}: ${player.resourceCurrent}/${player.resourceMax}${player.inCombat ? " [combat]" : " [idle]"}\n`;
  text += `${getClassCombatLabel()}: ${player.inCombat ? "ENGAGED" : "idle"}\n`;
  text += `Floor: ${dungeon.floor} | Rooms: ${dungeon.roomsCleared}\n`;
  text += `Gold: ${player.gold}\n\n`;
  text += `${getClassEquipmentHeader()}\n`;

  for (let [slot, item] of Object.entries(player.equipment)) {
    if (!item) {
      text += `${slot}: empty\n`;
      continue;
    }

    text += `${slot}: ${renderItemNameSpan(item)} `;
    text += `(+${item.atk} ATK / +${item.def} DEF / +${item.hp} HP / +${item.crit}% CRIT / +${item.dodge}% DODGE)\n`;
    let effectLine = renderSpecialEffectLine(item);
    if (effectLine) text += `${effectLine}\n`;
  }

  text += "\n=== HINTS ===\n";
  text += `<span class="codex-meta">Inventory: C / I / Tab\nCodex: K</span>\n`;
  text += `${getClassFlavorHint()}\n`;

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
    setAtmosphereBanner("codex");
    draw();
    return;
  }

  if (e.key.toLowerCase() === "k" && state === "CODEX") {
    state = codexReturnState;
    draw();
    return;
  }

  if (e.key.toLowerCase() === "l" && !menuScreens.includes(state)) {
    showActionLog = !showActionLog;
    draw();
    return;
  }

  // ===== INVENTORY TABS (global) =====
  if (e.key === "Tab" && state === "CODEX") {
    e.preventDefault();
    let currentIndex = CODEX_TABS.indexOf(codexTab);
    codexTab = CODEX_TABS[(currentIndex + 1) % CODEX_TABS.length];
    codexSelection = 0;
    draw();
    return;
  }

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

    let value = {
      common: 5,
      uncommon: 8,
      rare: 14,
      epic: 26,
      legendary: 54,
      unique: 120
    }[item.rarity] || 5;

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
  if (state === "CODEX") {
    let items = getCodexTabItems(codexTab);
    clampCodexSelection(items);

    if (e.key === "ArrowUp") {
      codexSelection = Math.max(0, codexSelection - 1);
      draw();
      return;
    }

    if (e.key === "ArrowDown") {
      codexSelection = Math.min(items.length - 1, codexSelection + 1);
      if (!items.length) codexSelection = 0;
      draw();
      return;
    }

    if (e.key === "Enter") {
      draw();
      return;
    }
  }

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

  if (e.key.toLowerCase() === "q") {
    useClassSkill();
    return;
  }

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
        let result = "";

        // firstHit: enemy ambushes before player reacts
        if (e.firstHit) {
          e.firstHit = false;
          if (Math.random() * 100 >= player.dodge) {
            let firstDmg = Math.max(1, e.atk * 2 - player.def);
            player.hp -= firstDmg;
            result += `${eDef.name} ambushes you for ${firstDmg}! `;
          } else {
            result += `Dodged ${eDef.name}'s ambush! `;
          }
          if (player.hp <= 0) {
            player.hp = player.maxHp;
            turn++;
            logAction(result.trim());
            enterTown("You were defeated and returned to town.");
            draw();
            return;
          }
        }

        // player attacks
        let critBonus = Math.random() * 100 < player.crit ? 2 : 1;
        let dealt = Math.max(1, player.atk * critBonus);
        e.hp -= dealt;
        result += critBonus > 1
          ? `[/] Critical hit on ${eDef.name} for ${dealt}.`
          : `[/] Hit ${eDef.name} for ${dealt}.`;

        if (e.hp <= 0) {
          result += collectEnemyRewards(e, eDef);
        } else {
          triggerFlash(e.x, e.y, getAttackElement());
          // enemy survives: flee or enter combat state
          if (eDef.behavior?.flees && e.hp < e.maxHp * 0.5) {
            e.state = "RETURN";
            result += ` ${eDef.name} fled wounded.`;
          } else {
            e.state = "ATTACK";
            e.spawnX = e.spawnX ?? e.x;
            e.spawnY = e.spawnY ?? e.y;
          }
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
        let chestLine = `Opened chest and found ${renderItemNameSpan(item)}.`;
        if (item.rarity === "unique") {
          chestLine += `\n${getUniqueStingerLine("chest")}`;
        }
        finishTurn(chestLine);
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
