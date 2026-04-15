# WROGUE

A keyboard-first ASCII roguelike set beneath the town of Ashroot.
Descend the shifting ruin called the Wrogue, fight your way through hostile floors, recover salvage, and return to town alive.

WROGUE is currently a solo, in-progress project focused on tight loop gameplay:
- Town preparation
- Dungeon descent
- Loot and materials recovery
- Character progression through gear, upgrades, codex discovery, and class crafting

## Current Highlights

- Two playable classes:
  - Witch: lower HP, high pressure through arcane style
  - Orc: higher HP, frontline durability and blunt force
- Procedural floor flow with escalating threats and biome progression
- Town services:
  - Merchant (sell gear)
  - Guild (sell materials)
  - Blacksmith (upgrade equipped gear)
  - Class Crafting (class-specific recipes)
- Hunter Codex with tabs for:
  - Creatures
  - Materials
  - Equipment
  - Town
  - Lore
- Save system with up to 5 slots, slot selection, and deletion confirmation

## Tech Stack

- Vanilla JavaScript
- HTML + CSS
- Browser localStorage for persistence

No build step is required.

## How To Run

1. Open the project folder.
2. Start a simple local server from the project root.
3. Open the game in your browser.

Example options:

```bash
# Python 3
python3 -m http.server 8000
```

Then open:

http://localhost:8000/game/

You can also open `game/index.html` directly, but using a local server is recommended.

## Core Controls

### Global / Menus

- Number keys: select menu options
- Escape: back / close panel
- K: open/close Codex (outside menu screens)
- L: toggle action log

### Town

- 1: Enter Dungeon
- 2: Merchant
- 3: Blacksmith
- 4: Guild
- 5: Class Crafting
- C: Inventory
- M: Main Menu

### Dungeon

- Arrow keys: move
- Q: class skill
- I: inventory
- X: return to town

### Inventory

- Tab: switch between Gear and Materials
- Arrow Up/Down: move selection
- Enter: equip selected gear
- Number keys: equip by index

### Codex

- Tab: switch codex tab
- Arrow Up/Down: move selection
- Arrow Left/Right: switch equipment subview

### Load Game (5 Slots)

- Arrow Up/Down or W/S: move slot selection
- 1 or Enter: load selected slot
- R: delete selected slot
- Y/N: confirm or cancel delete

## Save System Notes

- WROGUE uses 5 save slots in browser localStorage.
- Loading a slot makes it the active autosave slot.
- Starting a new game uses the first free slot automatically.
- If all slots are full, a new game reuses slot 1.

## Development Notes

Project layout:

- `game/index.html`
- `game/style.css`
- `game/main.js`

Main gameplay logic is currently centralized in `game/main.js`.

## Roadmap Direction

Near-term focus includes:
- More class content and recipe depth
- Additional enemy and biome behaviors
- Expanded guild systems (contracts/requests)
- Continued codex and lore growth

---

Created by Mars Meyleh
Studio: Orcaery (working title)
