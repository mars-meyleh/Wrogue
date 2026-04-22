// ============================================================================
// CRAFTING RECIPES
// Responsibility: all per-class crafting recipes with requirements, rewards,
// success rates, and optional unlock conditions.
// Consumed by: crafting system, crafting UI, getCraftingRecipesForClass.
// ============================================================================

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
