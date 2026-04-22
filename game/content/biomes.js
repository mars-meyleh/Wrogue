// ============================================================================
// BIOME + TILE EFFECT DEFINITIONS
// Responsibility: biome floor ranges, enemy pools, tile weights, and tile
// effect properties (walkability, hazard damage).
// Consumed by: map generation, dungeon spawning, rendering.
// ============================================================================

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
