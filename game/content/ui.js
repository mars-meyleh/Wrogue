// ============================================================================
// UI CORE CONSTANTS
// Responsibility: viewport dimensions, save version, theme-neutral states,
// and shared ASCII panel charter symbols.
// Consumed by: rendering, input routing, save/load flow.
// ============================================================================

const WIDTH = Math.floor(8 * 2.5);
const HEIGHT = Math.floor(5 * 2.5);
const SAVE_VERSION = 1;

const THEME_NEUTRAL_STATES = [
  "MENU",
  "CLASS_SELECT",
  "LOAD_SCREEN",
  "CONFIRM_DELETE_SAVE",
  "LORE_INTRO",
  "SETTINGS"
];

const UI_CHARTER = {
  optionMarker: "▸",
  selectedMarker: "▶",
  sectionFill: "─",
  panelTitleLeft: "┌",
  panelTitleRight: "┐",
  panelBottomLeft: "└",
  panelBottomRight: "┘"
};
