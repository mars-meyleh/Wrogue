// ============================================================================
// GLYPH + ELEMENT TABLES
// Responsibility: tile display symbols, element diacritics, boss glyphs,
// tier multipliers, and per-biome tile glyph overrides.
// Consumed by: rendering, map generation, enemy spawning.
// ============================================================================

const GLYPH_SET = {
  tiles: {
    ".": { ascii: ".", unicode: "·", emoji: "·" },
    ",": { ascii: ",", unicode: "⸱", emoji: "⸱" },
    "~": { ascii: "~", unicode: "≈", emoji: "≈" },
    "^": { ascii: "^", unicode: "▴", emoji: "▴" },
    "#": { ascii: "#", unicode: "█", emoji: "█" },
    ">": { ascii: ">", unicode: "⮞", emoji: "⮞" },
    "T": { ascii: "T", unicode: "♣", emoji: "🌲" }
  },
  entities: {
    player: { ascii: "@", unicode: "⚔", emoji: "🧙" },
    chestClosed: { ascii: "□", unicode: "◻", emoji: "📦" },
    chestOpen: { ascii: "▪", unicode: "◼", emoji: "📭" }
  },
  enemies: {
    goblin:        { ascii: "g", unicode: "g" },
    rat:           { ascii: "r", unicode: "r" },
    cave_snake:    { ascii: "s", unicode: "s" },
    stone_beetle:  { ascii: "b", unicode: "b" },
    dungeon_guard: { ascii: "d", unicode: "d" },
    shadow_stalker:{ ascii: "x", unicode: "x" }
  },
  states: {
    ALERT: { ascii: "!", unicode: "‼", emoji: "‼" },
    CHASE: { ascii: "»", unicode: "»", emoji: "»" },
    ATTACK: { ascii: "*", unicode: "✱", emoji: "💥" },
    RETURN: { ascii: "~", unicode: "↩", emoji: "↩" }
  },
  vfx: {
    projectile: { ascii: "*", unicode: "✶", emoji: "✨" }
  },
  bars: {
    filled: { ascii: "#", unicode: "█", emoji: "█" },
    empty: { ascii: ".", unicode: "░", emoji: "░" }
  },
  ui: {
    sectionLeft: { ascii: "[", unicode: "├", emoji: "├" },
    sectionRight: { ascii: "]", unicode: "┤", emoji: "┤" },
    optionMarker: { ascii: ">", unicode: "▸", emoji: "▸" },
    panelTitleLeft: { ascii: "[", unicode: "┌", emoji: "┌" },
    panelTitleRight: { ascii: "]", unicode: "┐", emoji: "┐" },
    panelBottomLeft: { ascii: "[", unicode: "└", emoji: "└" },
    panelBottomRight: { ascii: "]", unicode: "┘", emoji: "┘" }
  }
};

// ── Element variant glyphs ──────────────────────────────────────────────────
// Diacritics encode element type; each mark has one global meaning.
//   Acute  ´  → fire    │  Caron ˇ → frost
//   Dot above ˙ → poison │  Umlaut ¨ → shock
// Neutral monsters use the plain base letter (no diacritic).
// Uppercase is reserved for boss-tier only.
const ELEMENT_VARIANT_GLYPHS = {
  goblin: {
    fire:   "ǵ",          // g + acute   (U+01F5)
    frost:  "ǧ",          // g + caron   (U+01E7)
    poison: "ġ",          // g + dot     (U+0121)
    shock:  "g\u0308"     // g + umlaut  (combining)
  },
  rat: {
    fire:   "ŕ",          // r + acute   (U+0155)
    frost:  "ř",          // r + caron   (U+0159)
    poison: "ṙ",          // r + dot     (U+1E59)
    shock:  "r\u0308"     // r + umlaut  (combining)
  },
  cave_snake: {
    fire:   "ś",          // s + acute   (U+015B)
    frost:  "š",          // s + caron   (U+0161)
    poison: "ṡ",          // s + dot     (U+1E61)
    shock:  "s\u0308"     // s + umlaut  (combining)
  },
  stone_beetle: {
    fire:   "b\u0301",    // b + acute   (combining; no precomposed)
    frost:  "b\u030C",    // b + caron   (combining; no precomposed)
    poison: "ḃ",          // b + dot     (U+1E03)
    shock:  "b\u0308"     // b + umlaut  (combining)
  },
  dungeon_guard: {
    fire:   "d\u0301",    // d + acute   (combining; no precomposed)
    frost:  "ď",          // d + caron   (U+010F)
    poison: "ḋ",          // d + dot     (U+1E0B)
    shock:  "d\u0308"     // d + umlaut  (combining)
  },
  shadow_stalker: {
    fire:   "x\u0301",    // x + acute   (combining; no precomposed)
    frost:  "x\u030C",    // x + caron   (combining; no precomposed)
    poison: "ẋ",          // x + dot     (U+1E8B)
    shock:  "ẍ"           // x + umlaut  (U+1E8D)
  }
};

const ELEMENT_TYPES = ["fire", "frost", "poison", "shock"];

const BOSS_VARIANT_GLYPHS = {
  goblin:         "G",
  rat:            "R",
  cave_snake:     "S",
  stone_beetle:   "B",
  dungeon_guard:  "D",
  shadow_stalker: "X"
};

const TIER_MODIFIERS = {
  weak:   { hpMult: 0.7,  atkMult: 0.7,  defMult: 0.7  },
  normal: { hpMult: 1.0,  atkMult: 1.0,  defMult: 1.0  },
  strong: { hpMult: 1.3,  atkMult: 1.3,  defMult: 1.3  },
  elite:  { hpMult: 1.6,  atkMult: 1.4,  defMult: 1.4  },
  boss:   { hpMult: 2.5,  atkMult: 2.0,  defMult: 1.5  }
};

const BIOME_TILE_GLYPH_OVERRIDES = {
  ashroot_outskirts: {
    ".": { ascii: ".", unicode: "·", emoji: "·" },
    ",": { ascii: ",", unicode: "♣", emoji: "🌲" },
    "~": { ascii: "~", unicode: "≈", emoji: "🌫" }
  },
  shattered_bastion: {
    ".": { ascii: ".", unicode: "▪", emoji: "▪" },
    ",": { ascii: ",", unicode: "¤", emoji: "🧱" },
    "^": { ascii: "^", unicode: "▴", emoji: "🗡" }
  },
  umbral_hollows: {
    ".": { ascii: ".", unicode: "∙", emoji: "∙" },
    ",": { ascii: ",", unicode: "✦", emoji: "🕸" },
    "~": { ascii: "~", unicode: "≋", emoji: "🌌" },
    "^": { ascii: "^", unicode: "▲", emoji: "🩸" }
  }
};
