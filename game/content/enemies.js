// ============================================================================
// ENEMY DEFINITIONS
// Responsibility: all enemy stat blocks, lore tiers, drop tables, behavior
// flags, and biome/role metadata.
// Consumed by: dungeon spawning, combat engine, codex creatures tab, loot.
// ============================================================================

const ENEMY_DEFS = {
  goblin: {
    name: "Goblin",
    symbol: "g",
    family: "Hollow Dungeon Dwellers",
    biome: "ashroot_outskirts",
    role: "roamer",
    anomalyTags: [],
    knownInteractions: "Follows a stronger leader when present. Dangerous when massed.",
    colorClass: "monster-goblin",
    eliteStyle: "bold",
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
    colorClass: "monster-rat",
    eliteStyle: "italic",
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
    colorClass: "monster-snake",
    eliteStyle: "italic",
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
    colorClass: "monster-beetle",
    eliteStyle: "bold",
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
    symbol: "d",
    family: "Dungeon Wardens",
    biome: "shattered_bastion",
    role: "guardian",
    anomalyTags: [],
    knownInteractions: "Throws barbed javelins before you close in. Break line or rush quickly.",
    colorClass: "monster-guard",
    eliteStyle: "bold",
    hp: 10, atk: 3, def: 3,
    behavior: { range: 3 },
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
    symbol: "x",
    family: "Deep Dwellers",
    biome: "umbral_hollows",
    role: "apex",
    anomalyTags: ["first_strike"],
    knownInteractions: "Its advantage is worst in cramped corridors. Draw it into open space.",
    colorClass: "monster-stalker",
    eliteStyle: "italic",
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
