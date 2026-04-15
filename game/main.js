const gameEl = document.getElementById("game");
const uiEl = document.getElementById("ui");

// ===== RUNTIME STATE =====
let state = "MENU";
let turn = 0;
let actionLog = ["Welcome to Wrogue."];
let inventoryReturnState = "TOWN";
let codexReturnState = "TOWN";
let inventoryTab = "GEAR";
let inventorySelection = 0;
let codexTab = "CREATURES";
let codexSelection = 0;
let codexEquipmentView = "BASES";
let showActionLog = true;
let loadSlotSelection = 0;
let deleteConfirmSlot = null;
let currentSaveSlot = 1;
let visualFlash = null;
let atmosphereBanner = "";
let atmosphereBannerTimeoutId = null;
let codex = { enemies: {}, materials: {}, equipment: {}, lore: [] };

let world = createDefaultWorldState();

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

// ===== STATIC UI DATA =====
const WIDTH = Math.floor(8 * 2.5);
const HEIGHT = Math.floor(5 * 2.5);
const SAVE_VERSION = 1;
const CODEX_TABS = ["CREATURES", "MATERIALS", "EQUIPMENT", "TOWN", "LORE"];
const CODEX_EQUIPMENT_VIEWS = ["BASES", "PREFIXES", "SUFFIXES", "RELICS"];
const CODEX_TOWN_ENTRIES = [
  {
    id: "ashroot",
    title: "Ashroot",
    className: "codex-section",
    summary: "Frontier town above the Wrogue.",
    detail: "Ashroot survives by trade, scavenging, and the hunters willing to descend below it."
  },
  {
    id: "merchant",
    title: "Merchant",
    className: "codex-note",
    summary: "Buys found gear for gold.",
    detail: "The merchant cares about salvage value, rarity, and whether the item can be flipped to another hunter."
  },
  {
    id: "blacksmith",
    title: "Blacksmith",
    className: "codex-note",
    summary: "Improves worn equipment.",
    detail: "The blacksmith turns gold into durability and edge. Craft throughput now also lowers upgrade costs across town services."
  },
  {
    id: "guild",
    title: "Guild",
    className: "codex-note",
    summary: "Pays for monster materials.",
    detail: "The guild tracks proof of work, purchases raw materials, and will eventually tie into contracts and requests."
  }
];
const CODEX_LORE_ENTRIES = [
  {
    id: "first_arrival",
    title: "First Arrival",
    className: "codex-section",
    summary: "You came to Ashroot under contract.",
    detail: "A guild contract, a rough weapon, and the promise of pay were enough to bring you to the mouth of the Wrogue."
  },
  {
    id: "guild_contract",
    title: "Guild Contract",
    className: "codex-note",
    summary: "Kill, loot, and return alive.",
    detail: "The terms are simple: descend, recover valuables, document threats, and make it back to town breathing."
  },
  {
    id: "ashroot_origin",
    title: "Root of Embers",
    className: "codex-note",
    summary: "Ashroot was built around an older structure.",
    detail: "Ashroot was not founded as a town. Early records call this place the Root of Embers: a vast, ancient form with roots plunging below bedrock. Whether it was tree, engine, or shrine is still disputed. People settled here for promise, not safety."
  },
  {
    id: "fall_fragment_i",
    title: "Fall Fragment I",
    className: "codex-note",
    summary: "Fragmented account recovered from guild archive.",
    detail: "\"They dug too deep, and found something that answered.\""
  },
  {
    id: "fall_fragment_ii",
    title: "Fall Fragment II",
    className: "codex-note",
    summary: "Fragmented account recovered from guild archive.",
    detail: "\"The roots were not dead. Only waiting.\""
  },
  {
    id: "fall_fragment_iii",
    title: "Fall Fragment III",
    className: "codex-note",
    summary: "Fragmented account recovered from guild archive.",
    detail: "\"The fire did not spread. It rose.\""
  },
  {
    id: "dungeon_notes",
    title: "The Wrogue",
    className: "codex-note",
    summary: "Not a dungeon. Something older.",
    detail: "Ashroot's founders called it the Wrogue long before anyone mapped it. The name stuck because no wall stays the same twice. Scouts report the geometry shifts between visits — rooms that were sealed are open, corridors end where doors were. The guild stopped sending surveyors after the third team didn't return."
  },
  {
    id: "lore_ashroot_outskirts",
    title: "Ashroot Outskirts",
    className: "codex-note",
    summary: "Floors 1-3. Vermin and scavengers.",
    detail: "The upper shafts were once storerooms for whatever was built here before Ashroot. Rats and goblins moved in when the builders left. Cave snakes followed the rats. None of them understand what they occupy — they just filled the space. The Wrogue tolerates them the way a body tolerates parasites."
  },
  {
    id: "lore_shattered_bastion",
    title: "Shattered Bastion",
    className: "codex-note",
    summary: "Floors 4-6. Old fortification remnants.",
    detail: "Mid-depth shows signs of construction: carved archways, fitted stonework, traces of a garrison. Stone beetles colonized the rubble after the walls fell. Dungeon guards are the last echo of whatever force was stationed here — stripped of rank and purpose, running patrol routes that lead nowhere. The bastion fell to something from below, not above."
  },
  {
    id: "lore_umbral_hollows",
    title: "Umbral Hollows",
    className: "codex-note",
    summary: "Floors 7+. The Wrogue's own depth.",
    detail: "Below the bastion the architecture ends. What replaces it isn't natural cave — the walls are too smooth, the angles wrong. Shadow stalkers don't come from somewhere else. They emerge from the dark itself, as if the Wrogue is generating them. The guild classifies them as local phenomenon, origin unknown. Hunters who've returned from this depth stop giving detailed reports."
  }
];

// ===== UTILITIES =====
function createDefaultWorldState() {
  return {
    town: {
      name: "Ashroot",
      rebuildTier: 0,
      districtState: "ruined",
      recoveryUnlocked: true,
      playerHomeUnlocked: false,
      merchantGuildUnlocked: false,
      contractBoardUnlocked: false
    },
    milestones: {
      completed: [],
      pending: []
    },
    biomeProgress: {
      activeBiome: "ashroot_outskirts",
      unlocked: ["ashroot_outskirts"],
      deepestFloorByBiome: {
        ashroot_outskirts: 0
      }
    },
    npcRelations: {
      merchant: 0,
      blacksmith: 0,
      guild: 0
    },
    narrative: {
      seenFamilies: [],
      seenMaterialTiers: [],
      lastWelcomedTier: 0
    },
    crafting: {
      attempts: 0,
      successes: 0,
      failures: 0,
      witchRites: 0,
      orcForgings: 0
    },
    featureFlags: {
      classExpansionReady: false,
      travelMapReady: false,
      gatherablesReady: false
    }
  };
}

function migrateSaveData(save) {
  let migrated = { ...save };
  let version = Number.isInteger(migrated.saveVersion) ? migrated.saveVersion : 0;

  if (version < 1) {
    migrated.world = createDefaultWorldState();
    version = 1;
  }

  migrated.saveVersion = version;
  return migrated;
}

function normalizeWorldState(savedWorld) {
  let defaults = createDefaultWorldState();
  let worldState = savedWorld || {};

  return {
    ...defaults,
    ...worldState,
    town: {
      ...defaults.town,
      ...(worldState.town || {})
    },
    milestones: {
      ...defaults.milestones,
      ...(worldState.milestones || {}),
      completed: Array.isArray(worldState.milestones?.completed) ? worldState.milestones.completed : defaults.milestones.completed,
      pending: Array.isArray(worldState.milestones?.pending) ? worldState.milestones.pending : defaults.milestones.pending
    },
    biomeProgress: {
      ...defaults.biomeProgress,
      ...(worldState.biomeProgress || {}),
      unlocked: Array.isArray(worldState.biomeProgress?.unlocked) ? worldState.biomeProgress.unlocked : defaults.biomeProgress.unlocked,
      deepestFloorByBiome: {
        ...defaults.biomeProgress.deepestFloorByBiome,
        ...(worldState.biomeProgress?.deepestFloorByBiome || {})
      }
    },
    npcRelations: {
      ...defaults.npcRelations,
      ...(worldState.npcRelations || {})
    },
    narrative: {
      ...defaults.narrative,
      ...(worldState.narrative || {}),
      seenFamilies: Array.isArray(worldState.narrative?.seenFamilies) ? worldState.narrative.seenFamilies : defaults.narrative.seenFamilies,
      seenMaterialTiers: Array.isArray(worldState.narrative?.seenMaterialTiers) ? worldState.narrative.seenMaterialTiers : defaults.narrative.seenMaterialTiers
    },
    crafting: {
      ...defaults.crafting,
      ...(worldState.crafting || {})
    },
    featureFlags: {
      ...defaults.featureFlags,
      ...(worldState.featureFlags || {})
    }
  };
}

function hasWorldMilestone(id) {
  return world.milestones.completed.includes(id);
}

function refreshTownProgression() {
  let completed = world.milestones.completed;
  let town = world.town;

  town.rebuildTier = 0;
  town.districtState = "ruined";
  town.playerHomeUnlocked = false;
  town.merchantGuildUnlocked = false;
  town.contractBoardUnlocked = false;

  if (completed.includes("first_warden_felled")) {
    town.rebuildTier = 1;
    town.districtState = "repairing";
    town.playerHomeUnlocked = true;
  }

  if (completed.includes("deep_paths_opened")) {
    town.rebuildTier = 2;
    town.districtState = "restored";
    town.playerHomeUnlocked = true;
    town.merchantGuildUnlocked = true;
  }

  if (completed.includes("guild_attention_earned")) {
    town.rebuildTier = 3;
    town.districtState = "thriving";
    town.playerHomeUnlocked = true;
    town.merchantGuildUnlocked = true;
    town.contractBoardUnlocked = true;
  }
}

function completeWorldMilestone(id, message) {
  if (hasWorldMilestone(id)) return false;
  world.milestones.completed.push(id);
  refreshTownProgression();
  if (message) logAction(message);
  return true;
}

function recordDeepestFloor() {
  syncBiomeProgressByDepth();
  let biomeId = world.biomeProgress.activeBiome;
  let current = world.biomeProgress.deepestFloorByBiome[biomeId] || 0;
  world.biomeProgress.deepestFloorByBiome[biomeId] = Math.max(current, dungeon.floor);

  if (dungeon.floor >= 4) {
    completeWorldMilestone("deep_paths_opened", "Ashroot stirs as the deeper paths begin to yield.");
  }
  if (dungeon.floor >= 7) {
    completeWorldMilestone("guild_attention_earned", "Word spreads beyond Ashroot. The guild begins preparing outside requests.");
  }
}

function getTownHeading() {
  return {
    ruined: "=== ASHROOT: RUIN EDGE ===",
    repairing: "=== ASHROOT: REBUILDING ===",
    restored: "=== ASHROOT: LANTERN DISTRICT ===",
    thriving: "=== ASHROOT: GROWING HOLD ==="
  }[world.town.districtState] || "=== ASHROOT HUB ===";
}

function getMerchantMenuLabel() {
  return world.town.merchantGuildUnlocked ? "Merchant Guild" : "Merchant";
}

function getGuildMenuLabel() {
  return world.town.contractBoardUnlocked ? "Guild Board" : "Guild";
}

const BIOME_DEFS = {
  ashroot_outskirts: {
    id: "ashroot_outskirts",
    name: "Ashroot Outskirts",
    floorMin: 1,
    floorMax: 3,
    enemyPool: ["rat", "goblin", "cave_snake"],
    tileWeights: { ".": 0.86, ",": 0.10, "~": 0.04 }
  },
  shattered_bastion: {
    id: "shattered_bastion",
    name: "Shattered Bastion",
    floorMin: 4,
    floorMax: 6,
    enemyPool: ["goblin", "stone_beetle", "dungeon_guard", "cave_snake"],
    tileWeights: { ".": 0.80, ",": 0.06, "~": 0.08, "^": 0.06 }
  },
  umbral_hollows: {
    id: "umbral_hollows",
    name: "Umbral Hollows",
    floorMin: 7,
    floorMax: 99,
    enemyPool: ["stone_beetle", "dungeon_guard", "shadow_stalker", "cave_snake"],
    tileWeights: { ".": 0.78, ",": 0.04, "~": 0.08, "^": 0.10 }
  }
};

const TILE_EFFECT_DEFS = {
  ".": { name: "Floor", walkable: true },
  ",": { name: "Moss", walkable: true },
  "~": { name: "Ash Mire", walkable: true },
  "^": { name: "Shardfield", walkable: true, playerDamageOnEnter: 1 },
  "#": { name: "Wall", walkable: false },
  ">": { name: "Exit", walkable: true }
};

function getBiomeByFloor(floor) {
  if (floor <= 3) return BIOME_DEFS.ashroot_outskirts;
  if (floor <= 6) return BIOME_DEFS.shattered_bastion;
  return BIOME_DEFS.umbral_hollows;
}

function syncBiomeProgressByDepth() {
  let biome = getBiomeByFloor(dungeon.floor);
  world.biomeProgress.activeBiome = biome.id;
  if (!world.biomeProgress.unlocked.includes(biome.id)) {
    world.biomeProgress.unlocked.push(biome.id);
    logAction(`Biome unlocked: ${biome.name}.`);
  }
}

function getActiveBiomeDef() {
  let active = BIOME_DEFS[world.biomeProgress.activeBiome];
  return active || getBiomeByFloor(dungeon.floor);
}

function pickBiomeTile(tileWeights) {
  let roll = Math.random();
  let running = 0;
  for (let tile of [".", ",", "~", "^"]) {
    running += tileWeights[tile] || 0;
    if (roll <= running) return tile;
  }
  return ".";
}

function applyPlayerTileEntryEffects(x, y) {
  let tile = map[y]?.[x] || ".";
  let def = TILE_EFFECT_DEFS[tile];
  if (!def || !def.playerDamageOnEnter) return false;

  player.hp = Math.max(0, player.hp - def.playerDamageOnEnter);
  logAction(`${def.name} cuts you for ${def.playerDamageOnEnter}.`);
  if (player.hp <= 0) {
    player.hp = player.maxHp;
    enterTown("You collapse in the ruins and wake under Ashroot's lanterns.");
    return true;
  }
  return false;
}

function renderMapTileSymbol(tile) {
  if (tile === "~") return '<span class="codex-meta">~</span>';
  if (tile === "^") return '<span class="log-damage">^</span>';
  if (tile === ",") return '<span class="codex-note">,</span>';
  return tile;
}

function generateClusterLayout() {
  map = [];
  for (let y = 0; y < HEIGHT; y++) {
    let row = [];
    for (let x = 0; x < WIDTH; x++) {
      row.push("#");
    }
    map.push(row);
  }

  function carveWalkable(x, y) {
    if (x <= 0 || y <= 0 || x >= WIDTH - 1 || y >= HEIGHT - 1) return;
    map[y][x] = ".";
  }

  let roomCenters = [];

  // Starter chamber guarantees a valid spawn area near the top-left corner.
  for (let y = 1; y <= 4; y++) {
    for (let x = 1; x <= 5; x++) {
      map[y][x] = ".";
    }
  }
  roomCenters.push({ x: 3, y: 2 });

  let roomCount = rand(4, 7);

  for (let i = 0; i < roomCount; i++) {
    let rw = rand(5, 9);
    let rh = rand(4, 6);
    let rx = rand(1, WIDTH - rw - 2);
    let ry = rand(1, HEIGHT - rh - 2);

    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        map[y][x] = ".";
      }
    }

    roomCenters.push({ x: Math.floor(rx + rw / 2), y: Math.floor(ry + rh / 2) });
  }

  for (let i = 1; i < roomCenters.length; i++) {
    let a = roomCenters[i - 1];
    let b = roomCenters[i];

    let x = a.x;
    while (x !== b.x) {
      carveWalkable(x, a.y);
      carveWalkable(x, a.y + 1);
      x += x < b.x ? 1 : -1;
    }

    let y = a.y;
    while (y !== b.y) {
      carveWalkable(b.x, y);
      carveWalkable(b.x + 1, y);
      y += y < b.y ? 1 : -1;
    }

    carveWalkable(b.x, b.y);
  }

  // Breach some interior walls so layouts are less corridor-locked.
  for (let y = 1; y < HEIGHT - 1; y++) {
    for (let x = 1; x < WIDTH - 1; x++) {
      if (map[y][x] !== "#") continue;
      let horizontal = (map[y][x - 1] !== "#") && (map[y][x + 1] !== "#");
      let vertical = (map[y - 1][x] !== "#") && (map[y + 1][x] !== "#");
      if ((horizontal || vertical) && Math.random() < 0.14) {
        map[y][x] = ".";
      }
    }
  }
}

function getTileNeighborCount(x, y) {
  let offsets = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let count = 0;

  for (let [ox, oy] of offsets) {
    if (isWalkableTile(x + ox, y + oy)) count++;
  }

  return count;
}

function getLocalWalkableCount(x, y, radius = 1) {
  let count = 0;

  for (let yy = y - radius; yy <= y + radius; yy++) {
    for (let xx = x - radius; xx <= x + radius; xx++) {
      if (isWalkableTile(xx, yy)) count++;
    }
  }

  return count;
}

function placeExitTile() {
  let candidates = [];

  for (let y = 1; y < HEIGHT - 1; y++) {
    for (let x = 1; x < WIDTH - 1; x++) {
      if (!isWalkableTile(x, y)) continue;
      if (x === 1 && y === 1) continue;

      let distanceFromStart = getDistance(1, 1, x, y);
      let neighbors = getTileNeighborCount(x, y);
      let localOpen = getLocalWalkableCount(x, y, 1);
      if (distanceFromStart >= 6 && neighbors >= 2 && localOpen >= 5) {
        candidates.push({ x, y });
      }
    }
  }

  if (!candidates.length) {
    for (let y = 1; y < HEIGHT - 1; y++) {
      for (let x = 1; x < WIDTH - 1; x++) {
        if (isWalkableTile(x, y) && !(x === 1 && y === 1)) {
          candidates.push({ x, y });
        }
      }
    }
  }

  let chosen = candidates[rand(0, Math.max(0, candidates.length - 1))];
  if (chosen) {
    map[chosen.y][chosen.x] = ">";
  }
}

function applyBiomeTiles() {
  let biome = getActiveBiomeDef();

  // Guardrail: keep only a few special tiles so onboarding remains readable.
  for (let y = 1; y < HEIGHT - 1; y++) {
    for (let x = 1; x < WIDTH - 1; x++) {
      if (map[y][x] !== ".") continue;
      if (x === 1 && y === 1) continue;
      map[y][x] = pickBiomeTile(biome.tileWeights);
    }
  }
}

function getTownStatusNote() {
  if (world.town.districtState === "ruined") return "Collapsed homes lean over the square, but the lanterns still hold.";
  if (world.town.districtState === "repairing") return "Fresh timber and stitched canvas mark the first signs of return.";
  if (world.town.districtState === "restored") return "Trade stalls and watchfires make Ashroot look lived in again.";
  return "Caravans, contracts, and rumor now gather where only ash once settled.";
}

function getClassDiscoveryLine(kind, value) {
  if (player.class === "witch") {
    if (kind === "family") return `Witch note: the ${value.toLowerCase()} carry the same old echo.`;
    if (kind === "material") return `Witch note: ${value} reagents may answer a proper rite.`;
  }
  if (player.class === "orc") {
    if (kind === "family") return `Orc note: the ${value.toLowerCase()} fight with a readable rhythm.`;
    if (kind === "material") return `Orc note: ${value} salvage can hold in field-forged work.`;
  }
  return "Field note recorded.";
}

function maybeLogFamilyDiscovery(family) {
  if (!family) return;
  if (world.narrative.seenFamilies.includes(family)) return;
  world.narrative.seenFamilies.push(family);
  logAction(getClassDiscoveryLine("family", family));
}

function maybeLogMaterialTierDiscovery(tier) {
  if (!tier) return;
  if (world.narrative.seenMaterialTiers.includes(tier)) return;
  world.narrative.seenMaterialTiers.push(tier);
  logAction(getClassDiscoveryLine("material", tier));
}

function maybeLogTownTierWelcome() {
  let tier = world.town.rebuildTier;
  if (tier <= (world.narrative.lastWelcomedTier || 0)) return;

  if (tier === 1) {
    logAction(`Merchant: '${getMerchantVoiceLine("tier_1")}'`);
    logAction("Blacksmith: 'First scaffolds are up. Steel sounds better in a living town.'");
  } else if (tier === 2) {
    logAction(`Merchant: '${getMerchantVoiceLine("tier_2")}'`);
    logAction(`Guild Keeper: '${getGuildVoiceLine("tier_2")}'`);
  } else if (tier >= 3) {
    logAction(`Guild Keeper: '${getGuildVoiceLine("tier_3")}'`);
    logAction(`Merchant: '${getMerchantVoiceLine("tier_3")}'`);
  }

  world.narrative.lastWelcomedTier = tier;
}

function getMerchantVoiceLine(context) {
  if (player.class === "witch") {
    if (context === "tier_1") return "Coin moves again. Keep the salvage clean and the names cleaner.";
    if (context === "tier_2") return "Clerks now price your finds by omen marks, not rust weight.";
    if (context === "tier_3") return "Caravans ask for your route notes before they ask for my prices.";
    if (context === "codex") return "She tracks value like a ritual: weight, wear, and who will trust the item next.";
  }
  if (player.class === "orc") {
    if (context === "tier_1") return "Coin is moving. Bring pieces I can shift by dusk.";
    if (context === "tier_2") return "Guild scales are out. Your hauls now set street rates.";
    if (context === "tier_3") return "Caravan bosses ask for your names on their buy lists.";
    if (context === "codex") return "He prices by utility first: edge, grip, and how fast another hunter will buy.";
  }
  if (context === "tier_1") return "People are spending coin again. Keep bringing salvage.";
  if (context === "tier_2") return "We are drafting guild charters. Ashroot is no longer a dead-end stall.";
  if (context === "tier_3") return "Caravans now ask for Ashroot by name.";
  return "The merchant cares about salvage value, rarity, and whether the item can be flipped to another hunter.";
}

function getGuildVoiceLine(context) {
  if (player.class === "witch") {
    if (context === "tier_2") return "Your reports read like ward maps. We are rewriting old hazard charts.";
    if (context === "tier_3") return "Outside petitions now request Ashroot notation and your signature marks.";
    if (context === "menu") return "The ledger is now half contract log, half omen index from your runs.";
    if (context === "codex") return "The keeper values disciplined notes as much as trophies, especially from deep paths.";
  }
  if (player.class === "orc") {
    if (context === "tier_2") return "Your runs gave us leverage. Deeper contracts now carry real pay.";
    if (context === "tier_3") return "Outside petitions are here. They trust Ashroot because your hunts held the line.";
    if (context === "menu") return "The desk runs like a war board now: marks, routes, and payout brackets.";
    if (context === "codex") return "The keeper keeps a hard ledger: proof of kills, recovered stock, and route discipline.";
  }
  if (context === "tier_2") return "Reports from your runs are drawing new attention to our contracts.";
  if (context === "tier_3") return "Outside petitions are arriving. We are becoming a real frontier office.";
  if (context === "menu") return "The guild still operates as a rough buying counter and rumor desk.";
  return "The guild tracks proof of work, purchases raw materials, and will eventually tie into contracts and requests.";
}

function getMerchantFlavorLine() {
  if (player.class === "witch") {
    if (world.town.rebuildTier === 0) return "The merchant checks each trinket for hidden marks before naming a price.";
    if (world.town.rebuildTier === 1) return "Her stall now keeps separate ledgers for salvage, reagents, and risky curios.";
    if (world.town.rebuildTier === 2) return "Guild clerks shadow each sale, asking how your omen notes shift demand.";
    return "Envoys compare route ledgers and ask which relic-signs make caravans hesitate.";
  }
  if (player.class === "orc") {
    if (world.town.rebuildTier === 0) return "The merchant weighs gear by practical edge, not polish.";
    if (world.town.rebuildTier === 1) return "The stall has grown into a loud trade row where hard bargains hold.";
    if (world.town.rebuildTier === 2) return "Guild clerks now benchmark your sales to set wider street rates.";
    return "Merchant envoys test bulk contracts and ask what a frontline kit should cost.";
  }
  if (world.town.rebuildTier === 0) return "The merchant counts every coin twice and every risk three times.";
  if (world.town.rebuildTier === 1) return "The merchant's stall has grown into a canvas-lined trading row.";
  if (world.town.rebuildTier === 2) return "Guild clerks now shadow each sale, testing prices for a larger market.";
  return "Merchant guild envoys compare route ledgers and ask about deeper demand.";
}

function getBlacksmithFlavorLine() {
  if (world.town.rebuildTier === 0) return "The blacksmith works from a half-collapsed shed and a stubborn anvil.";
  if (world.town.rebuildTier === 1) return "A second forge is lit. Repairs now outpace breakage.";
  if (world.town.rebuildTier === 2) return "Smith apprentices sort steel by depth marks and enemy wear patterns.";
  return "The forge hall now tracks custom requests from incoming caravans and hunters.";
}

function getGuildFlavorLine() {
  if (player.class === "witch") {
    if (world.town.rebuildTier === 0) return "A rough desk and warded ink keep the guild records barely coherent.";
    if (world.town.rebuildTier === 1) return "Pinned maps now include your margin notes on omen-heavy corridors.";
    if (world.town.rebuildTier === 2) return "Contract scribes classify risk by your route notation and encounter signs.";
    return "Outside seals now arrive requesting Ashroot's ward-index format by name.";
  }
  if (player.class === "orc") {
    if (world.town.rebuildTier === 0) return "A rough desk, a stamp, and stubborn discipline keep the guild alive.";
    if (world.town.rebuildTier === 1) return "Kill ledgers crowd the wall beside route sketches marked for clean withdrawal.";
    if (world.town.rebuildTier === 2) return "Scribes now draft pay brackets from your war-log pacing and casualty risk.";
    return "Outside petition seals now arrive with Ashroot priority marks already stamped.";
  }
  if (world.town.rebuildTier === 0) return "A rough desk, a stamp, and a promise of payment keep the guild alive.";
  if (world.town.rebuildTier === 1) return "Pinned maps and kill ledgers crowd the guild wall.";
  if (world.town.rebuildTier === 2) return "Contract scribes begin drafting rank brackets for deeper expeditions.";
  return "Petition seals from outside territories now sit beside Ashroot contracts.";
}

function getClassCodexPersonalityLine(tab, entryId) {
  if (tab === "TOWN" && entryId === "merchant") {
    return getMerchantVoiceLine("codex");
  }
  if (tab === "TOWN" && entryId === "guild") {
    return getGuildVoiceLine("codex");
  }
  if (tab === "LORE" && entryId === "first_arrival") {
    if (player.class === "witch") return "You framed the contract as a study in old forces and survivable rituals.";
    if (player.class === "orc") return "You took the contract as clean work: descend, hold, return with proof.";
  }
  if (tab === "LORE" && entryId === "guild_contract") {
    if (player.class === "witch") return "Your reports read like field liturgy: threat signs, safe routes, and residue notes.";
    if (player.class === "orc") return "Your reports read like campaign notes: contact pace, break points, and salvage discipline.";
  }
  return "";
}

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

    if (!isWalkableTile(x, y) || map[y][x] === ">") {
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

// ===== ENEMY MOVEMENT AND CLASS COMBAT =====

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
  if (enemy.type === "stone_beetle" || enemy.type === "dungeon_guard") {
    completeWorldMilestone("first_warden_felled", "Ashroot hears of a warden's fall. Work crews dare to rebuild by lanternlight.");
  }

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
  let tile = map[y][x];
  return TILE_EFFECT_DEFS[tile]?.walkable !== false;
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

function getEnemyStateLineBudgetByFloor() {
  if (dungeon.floor <= 1) return 1;
  if (dungeon.floor <= 2) return 2;
  if (dungeon.floor <= 3) return 3;
  return Infinity;
}

function shouldEmitEnemyStateLine(currentCount, budget) {
  if (currentCount >= budget) return false;
  // Early floors keep tactical logs readable by probabilistically thinning
  // non-damage state chatter while preserving direct attack and reward lines.
  if (dungeon.floor <= 1) return Math.random() < 0.55;
  if (dungeon.floor <= 2) return Math.random() < 0.72;
  if (dungeon.floor <= 3) return Math.random() < 0.88;
  return true;
}

function runEnemyBehaviorTurn() {
  if (state !== "DUNGEON") return;

  // Enemy turns use a compact state machine so patrol, aggro, attack, and reset
  // all stay readable while still leaving room for richer behavior later.
  let enemyEvents = [];
  let stateEventBudget = getEnemyStateLineBudgetByFloor();
  let stateEventCount = 0;
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
      if (enemy.state === "ALERT" && shouldEmitEnemyStateLine(stateEventCount, stateEventBudget)) {
        enemyEvents.push(`${eDef.name} noticed you!`);
        stateEventCount++;
      }
      if (enemy.state === "CHASE" && shouldEmitEnemyStateLine(stateEventCount, stateEventBudget)) {
        enemyEvents.push(`${eDef.name} is pursuing you.`);
        stateEventCount++;
      }
      if (enemy.state === "RETURN" && !enemyEvents.some(ev => ev.includes("fled wounded")) && shouldEmitEnemyStateLine(stateEventCount, stateEventBudget)) {
        enemyEvents.push(`${eDef.name} lost your trail.`);
        stateEventCount++;
      }
    }
  }

  for (let evt of enemyEvents) {
    logAction(evt);
  }
}

// ===== CONTENT REGISTRIES =====
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
  { id: "rusted", name: "Rusted", allowedTypes: ["weapon", "twoHandWeapon", "shield", "armor"], minFloor: 3, classWeight: { witch: 0.65, orc: 1.15 }, atk: -1, def: 0, hp: 0, crit: 0, dodge: 0, effects: [], codexText: "Time and damp have thinned its edge and dulled its pride." },
  { id: "sharp", name: "Sharp", allowedTypes: ["weapon"], minFloor: 1, classWeight: { witch: 0.9, orc: 1.25 }, atk: 2, def: 0, hp: 0, crit: 1, dodge: 0, effects: [], codexText: "A careful edge that rewards clean intent." },
  { id: "heavy", name: "Heavy", allowedTypes: ["weapon", "twoHandWeapon", "shield", "armor"], minFloor: 2, classWeight: { witch: 0.7, orc: 1.35 }, atk: 2, def: 1, hp: 1, crit: 0, dodge: -1, effects: [], codexText: "Weight traded for certainty. Slow, but convincing." },
  { id: "balanced", name: "Balanced", allowedTypes: ["weapon", "wand", "staff", "shield"], minFloor: 1, classWeight: { witch: 1.15, orc: 1.0 }, atk: 1, def: 1, hp: 0, crit: 0, dodge: 1, effects: [], codexText: "Evenly made, with no wasted angle or pull." },
  { id: "runed", name: "Runed", allowedTypes: ["wand", "staff", "accessory"], minFloor: 1, classWeight: { witch: 1.5, orc: 0.65 }, atk: 1, def: 0, hp: 0, crit: 1, dodge: 0, effects: [], codexText: "Etched marks cling to quiet magic and old intent." },
  { id: "reinforced", name: "Reinforced", allowedTypes: ["shield", "armor"], minFloor: 2, classWeight: { witch: 0.8, orc: 1.3 }, atk: 0, def: 2, hp: 1, crit: 0, dodge: -1, effects: [], codexText: "Extra plate and stubborn craft turned toward endurance." }
];

const SUFFIXES = [
  { id: "of_ash", name: "of Ash", allowedTypes: ["weapon", "twoHandWeapon", "wand", "staff", "shield", "armor", "accessory"], minFloor: 1, classWeight: { witch: 1.05, orc: 0.95 }, atk: 0, def: 1, hp: 0, crit: 0, dodge: 0, effects: [], codexText: "Dust, ruin, and ember cling stubbornly to it." },
  { id: "of_stone", name: "of Stone", allowedTypes: ["shield", "armor"], minFloor: 2, classWeight: { witch: 0.85, orc: 1.35 }, atk: 0, def: 2, hp: 1, crit: 0, dodge: -1, effects: [], codexText: "Dense and unyielding, as if quarry weight lives inside it." },
  { id: "of_echoes", name: "of Echoes", allowedTypes: ["wand", "staff", "accessory"], minFloor: 1, classWeight: { witch: 1.45, orc: 0.7 }, atk: 1, def: 0, hp: 0, crit: 1, dodge: 0, effects: [], codexText: "Something in it hums with the memory of spoken rites." },
  { id: "of_decay", name: "of Decay", allowedTypes: ["weapon", "wand", "staff"], minFloor: 3, classWeight: { witch: 1.15, orc: 1.0 }, atk: 2, def: -1, hp: 0, crit: 0, dodge: 0, effects: [], codexText: "Rot-sick force lingers in the grain and edge." },
  { id: "of_the_hunt", name: "of the Hunt", allowedTypes: ["weapon", "twoHandWeapon", "armor", "accessory"], allowedSlots: ["boots", "ring", "necklace", "mainHand"], minFloor: 2, classWeight: { witch: 0.95, orc: 1.2 }, atk: 1, def: 0, hp: 0, crit: 0, dodge: 2, effects: [], codexText: "Made for pursuit, patience, and the last clean step." }
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

const CRAFTING_RECIPES = {
  witch: [
    {
      id: "witch_ashthread_charm",
      name: "Ashthread Charm",
      path: "Charm Weaving",
      successRate: 0.78,
      requirements: [
        { id: "silk_thread", qty: 1 },
        { id: "bone_fragment", qty: 2 },
        { id: "cloth_rag", qty: 1 }
      ],
      reward: {
        baseId: "crafted_ashthread_charm",
        name: "Ashthread Charm",
        type: "accessory",
        slot: "necklace",
        part: "necklace",
        hands: 0,
        rarity: "uncommon",
        atk: 0,
        def: 1,
        hp: 2,
        crit: 1,
        dodge: 0,
        codexText: "A woven ward-charm that steadies pulse and breathing in omen-heavy halls."
      }
    },
    {
      id: "witch_venom_sigil",
      name: "Venom Sigil Ring",
      path: "Rune Inscription",
      successRate: 0.72,
      requirements: [
        { id: "venom_sac", qty: 1 },
        { id: "bone_fragment", qty: 1 },
        { id: "snake_skin", qty: 1 }
      ],
      reward: {
        baseId: "crafted_venom_sigil_ring",
        name: "Venom Sigil Ring",
        type: "accessory",
        slot: "ring",
        part: "ring",
        hands: 0,
        rarity: "rare",
        atk: 1,
        def: 0,
        hp: 0,
        crit: 3,
        dodge: 1,
        codexText: "A ring etched with toxin-lines that rewards precise strikes."
      }
    },
    {
      id: "witch_hollows_focus",
      name: "Hollows Focus",
      path: "Accessory Infusion",
      successRate: 0.66,
      requirements: [
        { id: "arcane_lens", qty: 1 },
        { id: "ethereal_essence", qty: 1 },
        { id: "silk_thread", qty: 1 }
      ],
      reward: {
        baseId: "crafted_hollows_focus",
        name: "Hollows Focus",
        type: "staff",
        slot: "mainHand",
        subType: "focus",
        hands: 1,
        rarity: "rare",
        atk: 5,
        def: 1,
        hp: 2,
        crit: 2,
        dodge: 0,
        codexText: "A focus-staff saturated with essence from the lower dark."
      }
    },
    {
      id: "witch_emberroot_diadem",
      name: "Emberroot Diadem",
      path: "Root Sigil Crownwork",
      successRate: 0.52,
      unlockMilestone: "guild_attention_earned",
      minDeepestFloor: 8,
      requirements: [
        { id: "ethereal_essence", qty: 2 },
        { id: "arcane_lens", qty: 2 },
        { id: "crown_fragment", qty: 1 }
      ],
      reward: {
        baseId: "crafted_emberroot_diadem",
        name: "Emberroot Diadem",
        type: "armor",
        slot: "head",
        part: "head",
        hands: 0,
        rarity: "epic",
        atk: 2,
        def: 4,
        hp: 5,
        crit: 3,
        dodge: 1,
        codexText: "A ritual diadem anchored with crown shards from the old collapse."
      }
    }
  ],
  orc: [
    {
      id: "orc_salvage_edge",
      name: "Salvage Edge",
      path: "Field Forge",
      successRate: 0.80,
      requirements: [
        { id: "scrap_metal", qty: 3 },
        { id: "stone_dust", qty: 1 }
      ],
      reward: {
        baseId: "crafted_salvage_edge",
        name: "Salvage Edge",
        type: "weapon",
        slot: "mainHand",
        subType: "blade",
        hands: 1,
        rarity: "uncommon",
        atk: 5,
        def: 0,
        hp: 1,
        crit: 1,
        dodge: 0,
        codexText: "A rough blade hammered from mixed scrap and battle judgment."
      }
    },
    {
      id: "orc_platebind_vest",
      name: "Platebind Vest",
      path: "War Kit Assembly",
      successRate: 0.74,
      requirements: [
        { id: "chitin_plate", qty: 2 },
        { id: "cloth_rag", qty: 2 },
        { id: "scrap_metal", qty: 1 }
      ],
      reward: {
        baseId: "crafted_platebind_vest",
        name: "Platebind Vest",
        type: "armor",
        slot: "chest",
        part: "chest",
        hands: 0,
        rarity: "rare",
        atk: 0,
        def: 4,
        hp: 3,
        crit: 0,
        dodge: -1,
        codexText: "A chest rig bound for front pressure and long retreat lines."
      }
    },
    {
      id: "orc_linebreaker_boots",
      name: "Linebreaker Boots",
      path: "Field Forge",
      successRate: 0.68,
      requirements: [
        { id: "snake_skin", qty: 2 },
        { id: "chitin_plate", qty: 1 },
        { id: "scrap_metal", qty: 2 }
      ],
      reward: {
        baseId: "crafted_linebreaker_boots",
        name: "Linebreaker Boots",
        type: "armor",
        slot: "boots",
        part: "boots",
        hands: 0,
        rarity: "rare",
        atk: 1,
        def: 2,
        hp: 1,
        crit: 0,
        dodge: 3,
        codexText: "Boots tuned for pressure-footing and sudden flanking steps."
      }
    },
    {
      id: "orc_bastionbreaker_maul",
      name: "Bastionbreaker Maul",
      path: "Warden-Break Forge",
      successRate: 0.55,
      unlockMilestone: "deep_paths_opened",
      minDeepestFloor: 6,
      requirements: [
        { id: "core_stone", qty: 1 },
        { id: "chitin_plate", qty: 3 },
        { id: "scrap_metal", qty: 4 }
      ],
      reward: {
        baseId: "crafted_bastionbreaker_maul",
        name: "Bastionbreaker Maul",
        type: "twoHandWeapon",
        slot: "mainHand",
        subType: "heavy",
        hands: 2,
        rarity: "epic",
        atk: 10,
        def: 1,
        hp: 3,
        crit: 1,
        dodge: -2,
        codexText: "A two-hand crusher built from bastion salvage and core stone spine."
      }
    }
  ]
};

function getCraftingRecipesForClass() {
  return CRAFTING_RECIPES[player.class] || [];
}

function getDeepestUnlockedFloor() {
  let values = Object.values(world.biomeProgress?.deepestFloorByBiome || {});
  let deepestTracked = values.length ? Math.max(...values) : 1;
  return Math.max(dungeon.floor || 1, deepestTracked);
}

function getCraftingRecipeLockReason(recipe) {
  if (recipe.unlockMilestone && !hasWorldMilestone(recipe.unlockMilestone)) {
    return `locked: milestone ${recipe.unlockMilestone}`;
  }

  let deepestFloor = getDeepestUnlockedFloor();
  if (recipe.minDeepestFloor && deepestFloor < recipe.minDeepestFloor) {
    return `locked: deepest floor ${deepestFloor}/${recipe.minDeepestFloor}`;
  }

  return "";
}

function isCraftingRecipeUnlocked(recipe) {
  return getCraftingRecipeLockReason(recipe) === "";
}

function getMaterialCount(materialId) {
  let total = 0;
  for (let item of player.inventory) {
    if (!isMaterial(item) || item.materialId !== materialId) continue;
    normalizeMaterialStack(item);
    total += item.quantity;
  }
  return total;
}

function hasMaterialRequirements(requirements) {
  return requirements.every(req => getMaterialCount(req.id) >= req.qty);
}

function consumeMaterialRequirements(requirements) {
  if (!hasMaterialRequirements(requirements)) return false;

  for (let req of requirements) {
    let remaining = req.qty;
    for (let i = 0; i < player.inventory.length && remaining > 0; i++) {
      let item = player.inventory[i];
      if (!isMaterial(item) || item.materialId !== req.id) continue;
      normalizeMaterialStack(item);

      let take = Math.min(remaining, item.quantity);
      let unitValue = Math.max(1, Math.round(item.totalValue / item.quantity));

      item.quantity -= take;
      item.totalValue -= unitValue * take;
      remaining -= take;

      if (item.quantity <= 0) {
        player.inventory.splice(i, 1);
        i--;
      } else {
        item.value = Math.max(1, Math.round(item.totalValue / item.quantity));
      }
    }
  }

  return true;
}

function formatMaterialRequirements(requirements) {
  return requirements.map(req => {
    let def = getMaterialDefinition(req.id);
    let owned = getMaterialCount(req.id);
    return `${def.name} ${owned}/${req.qty}`;
  }).join(" | ");
}

function buildCraftedItemFromRecipe(recipe) {
  let reward = recipe.reward;
  return normalizeGearItem({
    id: reward.baseId,
    baseId: reward.baseId,
    baseName: reward.name,
    name: reward.name,
    type: reward.type,
    slot: reward.slot,
    part: reward.part || null,
    subType: reward.subType || null,
    hands: reward.hands || 0,
    rarity: reward.rarity || "uncommon",
    atk: reward.atk || 0,
    def: reward.def || 0,
    hp: reward.hp || 0,
    crit: reward.crit || 0,
    dodge: reward.dodge || 0,
    effects: [],
    prefixId: null,
    prefixName: null,
    suffixId: null,
    suffixName: null,
    isUnique: false,
    craftedRecipeId: recipe.id,
    craftedPath: recipe.path,
    codexText: reward.codexText || "Crafted in Ashroot.",
    specialEffect: ""
  });
}

function getCraftingTier() {
  let successes = world.crafting.successes || 0;
  if (successes >= 10) return 3;
  if (successes >= 5) return 2;
  if (successes >= 2) return 1;
  return 0;
}

function getGuildDemandBonusPerUnit() {
  return getCraftingTier();
}

function getBlacksmithUpgradeCost() {
  let discount = getCraftingTier();
  return Math.max(6, 10 - discount);
}

function getCraftingFlavorLine() {
  let tier = getCraftingTier();
  if (player.class === "witch") {
    if (tier === 0) return "A chalk circle, salvage thread, and careful breath begin each rite.";
    if (tier === 1) return "Your charms now move through Ashroot as reliable ward stock.";
    if (tier === 2) return "Guild scribes now request your rune notation with each delivery.";
    return "Caravan buyers ask for your infused charms before they ask for ore.";
  }
  if (player.class === "orc") {
    if (tier === 0) return "Rough forge, rough tools, clean intent. Field work starts here.";
    if (tier === 1) return "Your forged kit now sets expected durability for hunt crews.";
    if (tier === 2) return "Guild quartermasters benchmark new contracts against your field gear.";
    return "Outside crews now request your forge marks on frontline orders.";
  }
  return "Crafting benches stand ready.";
}

function attemptCraftRecipe(recipe) {
  if (!isCraftingRecipeUnlocked(recipe)) {
    logAction(getCraftingRecipeLockReason(recipe));
    return;
  }

  if (!hasMaterialRequirements(recipe.requirements)) {
    logAction("Missing materials for that recipe.");
    return;
  }

  // Materials are consumed on both success and failure to keep stakes meaningful.
  consumeMaterialRequirements(recipe.requirements);
  world.crafting.attempts++;
  if (player.class === "witch") world.crafting.witchRites++;
  if (player.class === "orc") world.crafting.orcForgings++;

  if (Math.random() <= recipe.successRate) {
    let item = buildCraftedItemFromRecipe(recipe);
    player.inventory.push(item);
    registerEquipmentSeen(item);
    world.crafting.successes++;
    logAction(`Craft success: ${renderItemNameSpan(item)} added to inventory.`);
  } else {
    world.crafting.failures++;
    if (player.class === "witch") {
      addMaterialToInventory(createMaterialItem("stone_dust"));
      logAction("Craft failed. Components burned down to Stone Dust.");
    } else if (player.class === "orc") {
      addMaterialToInventory(createMaterialItem("scrap_metal"));
      logAction("Craft failed. The forge spat back salvageable scrap.");
    } else {
      logAction("Craft failed. Components were consumed.");
    }
  }

  calculateStats();
  saveGame(currentSaveSlot);
}

const ENEMY_DEFS = {
  goblin: {
    name: "Goblin",
    symbol: "g",
    family: "Hollow Dungeon Dwellers",
    biome: "ashroot_outskirts",
    role: "roamer",
    anomalyTags: [],
    knownInteractions: "Follows a stronger leader when present. Dangerous when massed.",
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
    biome: "ashroot_outskirts",
    role: "scout",
    anomalyTags: ["flees"],
    knownInteractions: "Scatters when wounded. Easier to ignore than other threats.",
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
    biome: "ashroot_outskirts",
    role: "predator",
    anomalyTags: ["first_strike"],
    knownInteractions: "Strikes before you close distance. Closing safely requires care.",
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
    biome: "shattered_bastion",
    role: "guardian",
    anomalyTags: ["armored"],
    knownInteractions: "High defense makes it costly without strong offense. Pairs well with guards.",
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
    biome: "shattered_bastion",
    role: "guardian",
    anomalyTags: [],
    knownInteractions: "Paired with beetles it creates a hard front. Focus the guard first.",
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
    biome: "umbral_hollows",
    role: "apex",
    anomalyTags: ["first_strike"],
    knownInteractions: "Its advantage is worst in cramped corridors. Draw it into open space.",
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

// ===== CODEX AND DISCOVERY =====
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
    maybeLogMaterialTierDiscovery(def.tier);
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
  // Equipment entries are transformed into view-specific records here so the
  // codex can pivot between bases, affixes, and relics without duplicating save data.
  if (tab === "CREATURES") {
    const biomeOrder = { ashroot_outskirts: 0, shattered_bastion: 1, umbral_hollows: 2 };
    return Object.entries(codex.enemies)
      .map(([key, entry]) => ({
        key, ...entry,
        biome: ENEMY_DEFS[key]?.biome || "",
        role: ENEMY_DEFS[key]?.role || "",
        anomalyTags: ENEMY_DEFS[key]?.anomalyTags || [],
        knownInteractions: ENEMY_DEFS[key]?.knownInteractions || ""
      }))
      .sort((a, b) => {
        let biomeDiff = (biomeOrder[a.biome] ?? 9) - (biomeOrder[b.biome] ?? 9);
        if (biomeDiff !== 0) return biomeDiff;
        return a.name.localeCompare(b.name);
      });
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
    if (codexEquipmentView === "BASES") {
      return Object.entries(codex.equipment)
        .map(([key, entry]) => ({ key, ...entry }))
        .filter(entry => (entry.highestRarity || entry.rarity) !== "unique")
        .sort((a, b) => {
          let rarityDiff = getRarityOrder((b.highestRarity || b.rarity || "common")) - getRarityOrder((a.highestRarity || a.rarity || "common"));
          if (rarityDiff !== 0) return rarityDiff;
          return (a.name || "").localeCompare(b.name || "");
        })
        .map(entry => ({ ...entry, itemKind: "base" }));
    }

    if (codexEquipmentView === "RELICS") {
      return Object.entries(codex.equipment)
        .map(([key, entry]) => ({ key, ...entry }))
        .filter(entry => (entry.highestRarity || entry.rarity) === "unique")
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        .map(entry => ({ ...entry, itemKind: "relic" }));
    }

    if (codexEquipmentView === "PREFIXES") {
      return PREFIXES
        .map(prefix => {
          let discoveredOn = Object.values(codex.equipment).filter(entry => Object.prototype.hasOwnProperty.call(entry.discoveredPrefixes || {}, prefix.id));
          let seen = discoveredOn.reduce((sum, entry) => sum + (entry.seen || 0), 0);
          return {
            ...prefix,
            itemKind: "prefix",
            discovered: discoveredOn.length > 0,
            seen,
            discoveredOn: discoveredOn.length
          };
        })
        .sort((a, b) => Number(b.discovered) - Number(a.discovered) || a.name.localeCompare(b.name));
    }

    if (codexEquipmentView === "SUFFIXES") {
      return SUFFIXES
        .map(suffix => {
          let discoveredOn = Object.values(codex.equipment).filter(entry => Object.prototype.hasOwnProperty.call(entry.discoveredSuffixes || {}, suffix.id));
          let seen = discoveredOn.reduce((sum, entry) => sum + (entry.seen || 0), 0);
          return {
            ...suffix,
            itemKind: "suffix",
            discovered: discoveredOn.length > 0,
            seen,
            discoveredOn: discoveredOn.length
          };
        })
        .sort((a, b) => Number(b.discovered) - Number(a.discovered) || a.name.localeCompare(b.name));
    }

    return [];
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
    let biomeName = BIOME_DEFS[entry.biome]?.name || entry.biome || "Unknown";
    let roleTag = entry.role ? ` · ${entry.role}` : "";
    return `${marker}<span class="${colorClass}">${symbol} ${entry.name}</span> <span class="codex-meta">[${biomeName}${roleTag}] seen:${entry.seen} kills:${entry.kills}</span>`;
  }

  if (tab === "MATERIALS") {
    let colorClass = entry.colorClass || "material-common";
    return `${marker}<span class="${colorClass}">${entry.name}</span> <span class="codex-meta">[${entry.tier}]</span>`;
  }

  if (tab === "EQUIPMENT") {
    if (entry.itemKind === "base") {
      let rarity = entry.highestRarity || entry.rarity || "common";
      let prefixCount = Object.keys(entry.discoveredPrefixes || {}).length;
      let suffixCount = Object.keys(entry.discoveredSuffixes || {}).length;
      let brief = `p:${prefixCount} s:${suffixCount} +${entry.bestAtk || 0}/+${entry.bestDef || 0}`;
      return `${marker}<span class="${rarity}">${entry.name}</span> <span class="codex-meta">${rarity} ${brief}</span>`;
    }

    if (entry.itemKind === "relic") {
      return `${marker}<span class="unique">${entry.name}</span> <span class="codex-meta">relic seen:${entry.seen || 0}</span>`;
    }

    if (entry.itemKind === "prefix" || entry.itemKind === "suffix") {
      let label = entry.itemKind === "prefix" ? "prefix" : "suffix";
      let className = entry.discovered ? "uncommon" : "codex-meta";
      let stateText = entry.discovered ? `seen:${entry.seen} on:${entry.discoveredOn}` : "undiscovered";
      return `${marker}<span class="${className}">${entry.name}</span> <span class="codex-meta">${label} ${stateText}</span>`;
    }
  }

  let className = entry.className || "codex-note";
  return `${marker}<span class="${className}">${entry.title}</span> <span class="codex-meta">${entry.summary}</span>`;
}

function renderCodexDetail(entry, tab) {
  if (!entry) return '<span class="codex-meta">Nothing recorded yet.</span>';

  if (tab === "CREATURES") {
    let colorClass = entry.colorClass || "enemy-common";
    let lore = getEnemyLore(entry.key, entry);
    let biomeName = BIOME_DEFS[entry.biome]?.name || entry.biome || "Unknown";
    let tagsLine = entry.anomalyTags && entry.anomalyTags.length
      ? `\n<span class="codex-meta">tags: ${entry.anomalyTags.join(", ")}</span>`
      : "";
    let interactionLine = entry.knownInteractions
      ? `\n<span class="codex-meta">known: ${entry.knownInteractions}</span>`
      : "";
    return `<span class="${colorClass}">${entry.name}</span> <span class="codex-meta">[${entry.family}]</span>\n`
      + `<span class="codex-meta">seen: ${entry.seen} | kills: ${entry.kills} | ${biomeName} · ${entry.role || "unknown"}</span>\n`
      + `<span class="codex-note">"${lore}"</span>`
      + tagsLine
      + interactionLine;
  }

  if (tab === "MATERIALS") {
    let colorClass = entry.colorClass || "material-common";
    return `<span class="${colorClass}">${entry.name}</span> <span class="codex-meta">[${entry.tier}]</span>\n`
      + `<span class="codex-note">${entry.uses}</span>`;
  }

  if (tab === "EQUIPMENT") {
    if (entry.itemKind === "base") {
      let rarity = entry.highestRarity || entry.rarity || "common";
      let prefixes = Object.values(entry.discoveredPrefixes || {});
      let suffixes = Object.values(entry.discoveredSuffixes || {});
      let craftedSourceIds = Object.keys(entry.craftedRecipes || {});
      let craftedSourceLine = craftedSourceIds.length
        ? `\n<span class="codex-meta">crafted source: ${craftedSourceIds.join(", ")}</span>`
        : "";
      let descriptionLine = entry.description
        ? `\n<span class="codex-meta">${entry.description}</span>`
        : "";
      return `<span class="${rarity}">${entry.name}</span>\n`
        + `<span class="codex-meta">${entry.type} [${entry.slot}]${entry.hands === 2 ? " 2H" : ""}</span>\n`
        + `<span class="codex-meta">seen: ${entry.seen} | equipped: ${entry.equipped}</span>\n`
        + `<span class="codex-note">best rolls: +${entry.bestAtk || 0} ATK / +${entry.bestDef || 0} DEF / +${entry.bestHp || 0} HP / +${entry.bestCrit || 0} CRIT / +${entry.bestDodge || 0} DODGE</span>\n`
        + `<span class="codex-note">prefixes: ${prefixes.length ? prefixes.join(", ") : "none"} | suffixes: ${suffixes.length ? suffixes.join(", ") : "none"}</span>`
        + craftedSourceLine
        + descriptionLine;
    }

    if (entry.itemKind === "relic") {
      let effectLine = entry.specialEffect
        ? `\n<span class="unique-effect">effect: ${entry.specialEffect}</span>`
        : "";
      return `<span class="unique">${entry.name}</span>\n`
        + `<span class="codex-meta">ancient item record</span>\n`
        + `<span class="codex-meta">seen: ${entry.seen} | equipped: ${entry.equipped}</span>\n`
        + `<span class="codex-note">${entry.description || "A relic with a name older than the ledger."}</span>`
        + effectLine;
    }

    if (entry.itemKind === "prefix" || entry.itemKind === "suffix") {
      let discoveredText = entry.discovered
        ? `<span class="codex-meta">discovered on ${entry.discoveredOn} base ${entry.discoveredOn === 1 ? "record" : "records"}</span>`
        : `<span class="codex-meta">status: undiscovered</span>`;
      let weightNote = player.class && entry.classWeight && entry.classWeight[player.class]
        ? `\n<span class="codex-meta">${player.class} affinity: x${entry.classWeight[player.class].toFixed(2)}</span>`
        : "";
      return `<span class="${entry.discovered ? "uncommon" : "codex-meta"}">${entry.name}</span>\n`
        + `<span class="codex-note">${entry.codexText}</span>\n`
        + discoveredText
        + weightNote;
    }
  }

  let classLine = getClassCodexPersonalityLine(tab, entry.id);
  let classDetail = classLine ? `\n<span class="codex-meta">Class lens: ${classLine}</span>` : "";

  return `<span class="${entry.className || "codex-note"}">${entry.title}</span>\n`
    + `<span class="codex-meta">${entry.summary}</span>\n`
    + `<span class="codex-note">${entry.detail}</span>`
    + classDetail;
}

function renderCodexTabBar() {
  let parts = CODEX_TABS.map(tab => codexTab === tab ? `► ${tab}` : tab);
  return `<span class="codex-meta">[Tab] ${parts.join(" | ")}</span>`;
}

function renderCodexEquipmentBar() {
  let parts = CODEX_EQUIPMENT_VIEWS.map(view => codexEquipmentView === view ? `► ${view}` : view);
  return `<span class="codex-meta">[\u2190\u2192] ${parts.join(" | ")}</span>`;
}

// ===== DUNGEON ENCOUNTERS, DROPS, AND GEAR =====
function getEnemyPool() {
  let biome = getActiveBiomeDef();
  return biome.enemyPool;
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
  maybeLogFamilyDiscovery(def.family);
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
  // Legacy saves can contain pre-affix gear. Normalize everything into the
  // current runtime shape before stats, codex tracking, or rendering touch it.
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
      discoveredSuffixes: {},
      craftedRecipes: {},
      craftedCount: 0
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
  if (item.craftedRecipeId) {
    codex.equipment[key].craftedRecipes[item.craftedRecipeId] = item.craftedPath || "crafted";
    codex.equipment[key].craftedCount = (codex.equipment[key].craftedCount || 0) + 1;
  }
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
  if (affix.minFloor && dungeon.floor < affix.minFloor) return false;
  return true;
}

function getAffixWeight(affix) {
  let weight = 1;
  if (player.class && affix.classWeight && affix.classWeight[player.class]) {
    weight *= affix.classWeight[player.class];
  }
  return Math.max(0.05, weight);
}

function pickAffix(pool, base) {
  let valid = pool.filter(affix => matchesAffix(base, affix));
  if (!valid.length) return null;
  // Weight is applied only after slot/type/floor validation so each class bends
  // the same valid pool instead of bypassing progression rules.
  let total = valid.reduce((sum, affix) => sum + getAffixWeight(affix), 0);
  let roll = Math.random() * total;
  for (let affix of valid) {
    roll -= getAffixWeight(affix);
    if (roll <= 0) return affix;
  }
  return valid[valid.length - 1];
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
  // Early floors still allow caster and accessory bases, but this nudge prevents
  // too many fragile openings before the player has tools to support them.
  if (dungeon.floor <= 2 && ["wand", "staff", "accessory"].includes(base.type) && Math.random() < 0.35) {
    let earlyPool = BASE_ITEMS.filter(item => item.type === "weapon" || item.type === "shield" || item.type === "armor");
    if (earlyPool.length) base = earlyPool[rand(0, earlyPool.length - 1)];
  }
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

// ===== PLAYER STATS AND PERSISTENCE =====
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

function saveGame(slotIndex = 1) {
  const slotKey = `save_${slotIndex}`;
  localStorage.setItem(slotKey, JSON.stringify({
    saveVersion: SAVE_VERSION,
    player,
    dungeon,
    codex,
    world,
    savedAt: new Date().toISOString()
  }));
}

function getAllSaves() {
  const saves = {};
  for (let i = 1; i <= 5; i++) {
    const slotKey = `save_${i}`;
    const data = localStorage.getItem(slotKey);
    if (data) {
      try {
        saves[i] = JSON.parse(data);
      } catch(err) {
        saves[i] = null;
      }
    }
  }
  return saves;
}

function getFirstFreeSaveSlot() {
  const saves = getAllSaves();
  for (let i = 1; i <= 5; i++) {
    if (!saves[i]) return i;
  }
  return 1;
}

function deleteSaveSlot(slotIndex) {
  const slotKey = `save_${slotIndex}`;
  localStorage.removeItem(slotKey);
}

function getSlotInfo(save) {
  if (!save) return null;
  try {
    const cls = save.player?.class || "?";
    const floor = save.dungeon?.floor || 1;
    const gold = save.player?.gold || 0;
    const hp = save.player?.hp ?? "?";
    const maxHp = save.player?.maxHp ?? "?";
    const savedAt = save.savedAt ? new Date(save.savedAt).toLocaleString() : "Unknown";
    return { cls, floor, gold, hp, maxHp, savedAt };
  } catch(err) {
    return null;
  }
}

function loadGame(slotIndex = 1) {
  const slotKey = `save_${slotIndex}`;
  let data = localStorage.getItem(slotKey);
  if (!data) return false;

  let save = migrateSaveData(JSON.parse(data));

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

  world = normalizeWorldState(save.world);
  refreshTownProgression();

  if (save.codex) {
    codex = {
      enemies:   { ...(save.codex.enemies   || {}) },
      materials: { ...(save.codex.materials || {}) },
      equipment: { ...(save.codex.equipment || {}) },
      lore: Array.isArray(save.codex.lore) ? save.codex.lore : []
    };

    // Backfill newer codex fields so local saves survive data-model growth.
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
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "craftedRecipes")) {
        codex.equipment[key].craftedRecipes = {};
      }
      if (!Object.prototype.hasOwnProperty.call(codex.equipment[key], "craftedCount")) {
        codex.equipment[key].craftedCount = 0;
      }
    }
  }

  calculateStats();
  initClassResource(false);
  recordDeepestFloor();
  player.inCombat = false;
  player.hp = Math.min(player.hp || player.maxHp, player.maxHp);
  player.inventory = player.inventory.map(item => isMaterial(item) ? normalizeMaterialStack(item) : normalizeGearItem(item));

  for (let slot of Object.keys(player.equipment)) {
    player.equipment[slot] = normalizeGearItem(player.equipment[slot]);
  }

  currentSaveSlot = slotIndex;
  return true;
}

// ===== WORLD FLOW =====
function enterTown(message = "Returned to town.") {
  state = "TOWN";
  player.inCombat = false;
  player.hp = player.maxHp;
  player.resourceCurrent = player.resourceMax;
  logAction(message);
  logAction("You rest under Ashroot's lanterns and recover your strength.");
  maybeLogTownTierWelcome();
  setAtmosphereBanner("town");
  saveGame(currentSaveSlot);
}

function startGame() {
  state = "LORE_INTRO";
  dungeon.floor = 1;
  dungeon.roomsCleared = 0;
  codex = { enemies: {}, materials: {}, equipment: {}, lore: [] };
  world = createDefaultWorldState();
  inventoryTab = "GEAR";
  inventorySelection = 0;
  currentSaveSlot = getFirstFreeSaveSlot();

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
  actionLog = ["A new journey begins.", `This journey is bound to slot ${currentSaveSlot}.`];

  if (player.class === "witch") {
    player.maxHp = 8;
  } else {
    player.maxHp = 12;
  }

  player.hp = player.maxHp;
  initClassResource(true);
  player.inCombat = false;
  calculateStats();
  refreshTownProgression();
  recordDeepestFloor();
  saveGame(currentSaveSlot);
}


// ===== MAP =====
function generateRoom() {
  entities = [];
  syncBiomeProgressByDepth();

  // Phase 4 layout: connected chambers keep navigation legible while making
  // each floor feel less like one open box.
  generateClusterLayout();
  applyBiomeTiles();

  // Exit placement avoids narrow chokepoints to preserve route freedom.
  placeExitTile();

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
  logAction(`Biome: ${getActiveBiomeDef().name}.`);
  setAtmosphereBanner("dungeon");
  updateCombatState();
}


// ===== RENDERING =====
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
    const saves = getAllSaves();
    let slotsHtml = "";
    for (let i = 1; i <= 5; i++) {
      const save = saves[i];
      const isSelected = i === loadSlotSelection;
      const marker = isSelected ? "▶" : " ";
      const slotClass = isSelected ? "codex-section" : "codex-note";
      
      if (save) {
        const info = getSlotInfo(save);
        if (info) {
          const clsClass = info.cls === "witch" ? "rare" : "epic";
          slotsHtml += `\n  <span class="${slotClass}">${marker} Slot ${i} — <span class="${clsClass}">${info.cls}</span> Fl${info.floor} HP${info.hp}/${info.maxHp} ${info.gold}g</span>`;
        }
      } else {
        slotsHtml += `\n  <span class="${slotClass}">${marker} Slot ${i} — [empty]</span>`;
      }
    }
    const saveText = `${slotsHtml}\n\n  <span class="codex-meta">↑↓ Navigate | <span class="epic">1</span> Load | <span class="epic">R</span> Delete | <span class="epic">ESC</span> Back</span>`;
    gameEl.innerHTML = `<span class="codex-title">[LOAD GAME — 5 SLOTS]</span>\n${saveText}`;
    uiEl.innerHTML = `<span class="codex-meta">Select a save slot.</span>`;
    return;
  }

  if (state === "CONFIRM_DELETE_SAVE") {
    const saves = getAllSaves();
    const save = saves[deleteConfirmSlot];
    let confirmText = "";
    if (save) {
      const info = getSlotInfo(save);
      if (info) {
        const clsClass = info.cls === "witch" ? "rare" : "epic";
        confirmText = `\n  You are about to erase the memories of\n  a <span class="${clsClass}">${info.cls}</span> adventurer on floor ${info.floor}.\n\n  <span class="codex-section">Y — Confirm deletion</span>\n  <span class="codex-section">N — Cancel</span>`;
      }
    }
    gameEl.innerHTML = `<span class="codex-title">[CONFIRM DELETION]</span>${confirmText}`;
    uiEl.innerHTML = `<span class="codex-meta">This cannot be undone.</span>`;
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
  I         Open inventory (dungeon)
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
    let biome = getActiveBiomeDef();
    gameEl.innerHTML = `
[TOWN]

1. Enter Dungeon
2. ${getMerchantMenuLabel()}
3. Blacksmith
4. ${getGuildMenuLabel()}
5. Class Crafting
C. Inventory
K. Codex
M. Main Menu

Gold: ${player.gold}
HP: ${player.hp}
Town Tier: ${world.town.rebuildTier}  [${world.town.districtState}]
Active Biome Track: ${biome.name}
${getTownStatusNote()}
`;
  if (atmosphereBanner) {
    gameEl.innerHTML += `\n<span class="flow-banner">${atmosphereBanner}</span>`;
  }
  gameEl.innerHTML += renderActionLog();
    drawUI();
    return;
  }

  if (state === "MERCHANT") {
    let text = `[${getMerchantMenuLabel().toUpperCase()}]\nSell items:\n`;
    text += `<span class="codex-note">${getMerchantFlavorLine()}</span>\n\n`;
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
    if (codexTab === "EQUIPMENT") {
      text += `${renderCodexEquipmentBar()}\n`;
    }

    if (!items.length) {
      text += '<span class="codex-meta">Nothing recorded yet.</span>\n';
    } else {
      items.forEach((entry, index) => {
        text += `${renderCodexRow(entry, codexTab, index === codexSelection)}\n`;
      });
    }

    text += '\n<span class="codex-section">-- Detail --</span>\n';
    text += `${renderCodexDetail(selected, codexTab)}\n`;
    text += codexTab === "EQUIPMENT"
      ? '\n<span class="codex-meta">[↑↓] navigate | [←→] equipment view | [Tab] switch tab | [K/ESC] exit | [L] log</span>'
      : '\n<span class="codex-meta">[↑↓] navigate | [Tab] switch tab | [K/ESC] exit | [L] log</span>';
    if (atmosphereBanner) {
      text += `\n<span class="flow-banner">${atmosphereBanner}</span>`;
    }
    text += renderActionLog();
    gameEl.innerHTML = text;
    drawUI();
    return;
  }

  if (state === "GUILD") {
    let text = `[${getGuildMenuLabel().toUpperCase()}]\nSell monster materials:\n`;
    text += `<span class="codex-note">${getGuildFlavorLine()}</span>\n\n`;
    let guildBonus = getGuildDemandBonusPerUnit();
    text += `<span class="codex-meta">craft demand bonus: +${guildBonus}g per unit</span>\n\n`;
    player.inventory.forEach((item, i) => {
      if (!isMaterial(item)) return;
      normalizeMaterialStack(item);
      let unitValue = item.value + guildBonus;
      let totalValue = unitValue * item.quantity;
      text += `${i}: ${renderMaterialSpan(item)} x${item.quantity} `;
      text += `<span class=\"codex-meta\">(${item.tier}, ${unitValue}g ea / ${totalValue}g total)</span>\n`;
    });
    if (world.town.contractBoardUnlocked) {
      text += "\n<span class=\"codex-note\">Requests are beginning to arrive from beyond Ashroot, but the board is not active yet.</span>\n";
    } else {
      text += `\n<span class=\"codex-meta\">${getGuildVoiceLine("menu")}</span>\n`;
    }
    text += "\n[number] sell 1 | Shift+[number] sell stack\nESC to exit";
    text += renderActionLog();
    gameEl.innerHTML = text;
    drawUI();
    return;
  }

  if (state === "BLACKSMITH") {
    let upgradeCost = getBlacksmithUpgradeCost();
    let text = `[BLACKSMITH]\nUpgrade gear (cost ${upgradeCost}):\n`;
    text += `<span class="codex-note">${getBlacksmithFlavorLine()}</span>\n\n`;
    text += `<span class="codex-meta">craft network discount: ${10 - upgradeCost}g</span>\n\n`;
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

  if (state === "CRAFTING") {
    let recipes = getCraftingRecipesForClass();
    let text = "[CLASS CRAFTING]\n";
    text += `<span class="codex-note">${getCraftingFlavorLine()}</span>\n\n`;
    text += `<span class="codex-meta">attempts:${world.crafting.attempts} successes:${world.crafting.successes} failures:${world.crafting.failures}</span>\n\n`;

    if (!recipes.length) {
      text += "No class recipes available yet.\n";
    } else {
      recipes.forEach((recipe, i) => {
        let odds = Math.round(recipe.successRate * 100);
        let lockReason = getCraftingRecipeLockReason(recipe);
        let status = lockReason ? lockReason : (hasMaterialRequirements(recipe.requirements) ? "ready" : "missing mats");
        text += `${i}: <span class="${recipe.reward.rarity || "uncommon"}">${recipe.name}</span> `;
        text += `<span class="codex-meta">[${recipe.path}] ${odds}% ${status}</span>\n`;
        text += `<span class="codex-meta">    ${formatMaterialRequirements(recipe.requirements)}</span>\n`;
      });
    }

    text += "\n[number] attempt craft\nESC to exit";
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
        else output += renderMapTileSymbol(map[y][x]);
      }
    }
    output += "\n";
  }

  let biome = getActiveBiomeDef();
  output += `\nDungeon Floor: ${dungeon.floor}`;
  output += `\nBiome: ${biome.name}`;
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

// ===== SIDE PANEL UI =====
function drawUI() {
  if (state === "TOWN") {
    let biome = getActiveBiomeDef();
    let text = `${getTownHeading()}\n`;
    text += `HP: ${player.hp}/${player.maxHp}\n`;
    text += `Gold: ${player.gold}\n`;
    text += `Floor: ${dungeon.floor} | Rooms: ${dungeon.roomsCleared}\n`;
    text += `Rebuild: Tier ${world.town.rebuildTier} [${world.town.districtState}]\n`;
    text += `Home: ${world.town.playerHomeUnlocked ? "open" : "not ready"}\n`;
    text += `Trade: ${world.town.merchantGuildUnlocked ? "merchant guild forming" : "single merchant stall"}\n`;
    text += `Guild: ${world.town.contractBoardUnlocked ? "board prepared" : "buyers' desk only"}\n`;
    text += `Craft: tier ${getCraftingTier()} (${world.crafting.successes} successes)\n`;
    text += `Depth Track: ${biome.name}\n`;
    text += `\n${getTownStatusNote()}\n`;
    if (atmosphereBanner) text += `\n<span class="flow-banner">${atmosphereBanner}</span>\n`;
    uiEl.innerHTML = text;
    return;
  }

  if (state === "CODEX") {
    let text = `=== CODEX MODE ===\n`;
    text += `Active Tab: ${codexTab}`;
    if (codexTab === "EQUIPMENT") text += ` / ${codexEquipmentView}`;
    text += `\n`;
    text += `Class Lens: ${player.class || "neutral"}\n\n`;
    text += `=== NAVIGATION ===\n`;
    text += codexTab === "EQUIPMENT"
      ? `<span class="codex-meta">[↑↓] select\n[←→] equipment view\n[Tab] cycle tabs\n[K/ESC] close codex\n[L] log</span>\n`
      : `<span class="codex-meta">[↑↓] select\n[Tab] cycle tabs\n[K/ESC] close codex\n[L] log</span>\n`;
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
  text += `<span class="codex-meta">Inventory: I\nCodex: K</span>\n`;
  text += `${getClassFlavorHint()}\n`;

  uiEl.innerHTML = text;
}

// ===== EQUIPMENT MANAGEMENT =====
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
  const menuScreens = ["MENU", "CLASS_SELECT", "LOAD_SCREEN", "CONFIRM_DELETE_SAVE", "LORE_INTRO", "SETTINGS"];

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
    if (codexTab !== "EQUIPMENT") codexEquipmentView = "BASES";
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
    if (e.key === "2") {
      state = "LOAD_SCREEN";
      loadSlotSelection = 1;
    }
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
      loadSlotSelection = 0;
    } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      loadSlotSelection = loadSlotSelection === 1 ? 5 : loadSlotSelection - 1;
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      loadSlotSelection = loadSlotSelection === 5 ? 1 : loadSlotSelection + 1;
    } else if (e.key === "1" || e.key === "Enter") {
      if (loadGame(loadSlotSelection)) {
        state = "TOWN";
        logAction(`Loaded save from slot ${loadSlotSelection}.`);
      } else {
        logAction("Slot is empty.");
      }
    } else if (e.key === "r" || e.key === "R") {
      const saves = getAllSaves();
      if (saves[loadSlotSelection]) {
        state = "CONFIRM_DELETE_SAVE";
        deleteConfirmSlot = loadSlotSelection;
      } else {
        logAction("Slot is empty.");
      }
    }
    draw();
    return;
  }

  if (state === "CONFIRM_DELETE_SAVE") {
    if (e.key === "y" || e.key === "Y") {
      deleteSaveSlot(deleteConfirmSlot);
      logAction(`Slot ${deleteConfirmSlot} deleted.`);
      state = "LOAD_SCREEN";
      deleteConfirmSlot = null;
    } else if (e.key === "n" || e.key === "N" || e.key === "Escape") {
      state = "LOAD_SCREEN";
      deleteConfirmSlot = null;
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
      if (state === "TOWN") saveGame(currentSaveSlot);
    } else if (state === "TOWN") {
      saveGame(currentSaveSlot);
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
    if (e.key === "5") state = "CRAFTING";
    if (e.key.toLowerCase() === "c") {
      inventoryReturnState = "TOWN";
      state = "INVENTORY";
    }
    if (e.key.toLowerCase() === "m") {
      saveGame(currentSaveSlot);
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
    // The current generator builds one bounded chamber. This stays intentionally
    // simple until biome layouts and tile effects are introduced in later phases.
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
    let guildBonus = getGuildDemandBonusPerUnit();
    let unitValue = item.value + guildBonus;

    if (e.shiftKey) {
      let stackTotal = unitValue * item.quantity;
      let stackCount = item.quantity;
      player.gold += stackTotal;
      player.inventory.splice(i, 1);
      logAction(`Sold ${item.name} x${stackCount} for ${stackTotal}g.`);
    } else {
      player.gold += unitValue;
      item.quantity -= 1;
      item.totalValue -= item.value;

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
    let upgradeCost = getBlacksmithUpgradeCost();

    if (item && player.gold >= upgradeCost) {
      item.atk += 1;
      item.def += 1;
      player.gold -= upgradeCost;
      calculateStats();
      logAction(`Upgraded ${slot} (+1 ATK / +1 DEF) for ${upgradeCost}g.`);
    } else if (item && player.gold < upgradeCost) {
      logAction("Not enough gold to upgrade.");
    }

    draw();
    return;
  }

  // ===== CRAFTING =====
  if (state === "CRAFTING" && keyIndex !== null) {
    let recipes = getCraftingRecipesForClass();
    let recipe = recipes[keyIndex];
    if (!recipe) {
      draw();
      return;
    }

    attemptCraftRecipe(recipe);
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

    if (codexTab === "EQUIPMENT" && e.key === "ArrowRight") {
      let currentIndex = CODEX_EQUIPMENT_VIEWS.indexOf(codexEquipmentView);
      codexEquipmentView = CODEX_EQUIPMENT_VIEWS[(currentIndex + 1) % CODEX_EQUIPMENT_VIEWS.length];
      codexSelection = 0;
      draw();
      return;
    }

    if (codexTab === "EQUIPMENT" && e.key === "ArrowLeft") {
      let currentIndex = CODEX_EQUIPMENT_VIEWS.indexOf(codexEquipmentView);
      codexEquipmentView = CODEX_EQUIPMENT_VIEWS[(currentIndex - 1 + CODEX_EQUIPMENT_VIEWS.length) % CODEX_EQUIPMENT_VIEWS.length];
      codexSelection = 0;
      draw();
      return;
    }

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
    // Keep exit tiles traversable so a generated gate never blocks the map.
    player.x = nx;
    player.y = ny;
    finishTurn("The descent gate is sealed until hostiles are cleared.", false);
    draw();
    return;
  }

  // go to next room
  dungeon.roomsCleared++;

  if (dungeon.roomsCleared % 3 === 0) {
    dungeon.floor++;
    recordDeepestFloor();
    logAction(`Advanced to floor ${dungeon.floor}.`);
  }

  generateRoom();
  saveGame(currentSaveSlot);
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
  if (applyPlayerTileEntryEffects(player.x, player.y)) {
    draw();
    return;
  }
  finishTurn(`Moved to (${player.x},${player.y}).`, false);

  draw();
});

// ===== START =====
calculateStats();
draw();
