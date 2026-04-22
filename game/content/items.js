// ============================================================================
// ITEM CONTENT — BASE ITEMS, AFFIXES, RARITY RULES, UNIQUE TEMPLATES
// Responsibility: all immutable item definitions used by loot generation,
// crafting, and the codex equipment tab.
// Consumed by: loot spawning, generateItem, codex equipment tab.
// ============================================================================

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
  unique: { multiplier: 1.55, prefix: false, suffix: false }
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
