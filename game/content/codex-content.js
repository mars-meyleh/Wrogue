// ============================================================================
// CODEX STATIC CONTENT
// Responsibility: tab labels, equipment view labels, town codex entries,
// lore entries, and milestone → lore unlock mapping.
// Consumed by: codex rendering, discovery registry, milestone processing.
// ============================================================================

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

const MILESTONE_LORE_UNLOCKS = {
  first_warden_felled:   ["dungeon_notes"],
  deep_paths_opened:     ["lore_shattered_bastion"],
  guild_attention_earned:["lore_umbral_hollows"]
};
