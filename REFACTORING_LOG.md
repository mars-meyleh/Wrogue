# Wrogue Refactoring Log

Systems-first extraction tracker for splitting game/main.js safely.

## Rules

1. Keep behavior identical in each phase.
2. Move one subsystem at a time.
3. Run tests and a manual smoke loop after each phase.
4. Do not store line numbers in comments or docs.

## Phase Status

| Phase | Scope | Status | Notes |
| --- | --- | --- | --- |
| 0 | In-file section headers and extraction markers | Complete | Added architecture separators in game/main.js and game/style.css. |
| 1 | content/* constants and registries | Pending | Lowest risk; no runtime behavior logic. |
| 2 | ui/glyphs + systems/narrative | Pending | Low coupling utility extraction. |
| 3 | systems/codex | Pending | Keep codex object shape stable. |
| 4 | systems/inventory foundation | Pending | Keep save compatibility and item normalization parity. |
| 5 | systems/crafting | Pending | Depends on inventory extraction. |
| 6 | systems/dungeon generation/spawning | Pending | Validate floor/biome flow parity. |
| 7 | systems/combat | Pending | Highest gameplay risk before input split. |
| 8 | state/persistence modules | Pending | Save/load migration guardrails required. |
| 9 | ui/rendering split | Pending | Keep output and CSS class contracts intact. |
| 10 | input routing split | Pending | Final orchestration split. |
| 11 | cleanup and docs hardening | Pending | Remove temporary extraction metadata. |

## Verification Checklist (Run Each Phase)

1. Automated tests in game/tests/tests.js.
2. Manual smoke loop: new run -> dungeon -> town -> merchant/guild/blacksmith/crafting -> codex -> save/load.
3. Save compatibility check with an old save slot.
