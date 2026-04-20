// ============================================================
// Wrogue — Automated Test Suite
// Open game/tests/test.html in a browser to run.
// All tests run after main.js loads in the same page context.
// ============================================================

// ── Test runner ───────────────────────────────────────────────────────────────
const results = [];

function suite(name, fn) {
  const group = { name, tests: [] };
  results.push(group);
  currentGroup = group;
  try { fn(); } catch (e) { group.tests.push({ name: "SUITE SETUP CRASH", pass: false, msg: e.message }); }
  currentGroup = null;
}

let currentGroup = null;

function test(name, fn) {
  try {
    fn();
    currentGroup.tests.push({ name, pass: true });
  } catch (e) {
    currentGroup.tests.push({ name, pass: false, msg: e.message });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function assertEqual(a, b, label) {
  if (a !== b) throw new Error(`${label ?? "assertEqual"}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertDeepEqual(a, b, label) {
  const as = JSON.stringify(a), bs = JSON.stringify(b);
  if (as !== bs) throw new Error(`${label ?? "assertDeepEqual"}: expected ${bs}, got ${as}`);
}

// Helper: reset shared global state before each test that needs it
function resetPlayer() {
  player = {
    class: "orc",
    x: 1, y: 1,
    hp: 12, maxHp: 12,
    atk: 2, def: 0,
    crit: 0, dodge: 0,
    resourceType: "ST",
    resourceCurrent: 3, resourceMax: 5,
    inCombat: false,
    gold: 10,
    equipment: {
      head: null, chest: null, belt: null,
      legs: null, boots: null, necklace: null,
      ring1: null, ring2: null, mainHand: null, offHand: null
    },
    inventory: []
  };
}

function resetDungeon() {
  dungeon = { floor: 1, roomsCleared: 0 };
}

function resetHudDelta() {
  hudDelta = { lastHeal: null, damageEvents: [], displayedAt: null };
}

function resetVisualFlash() {
  visualFlash = null;
}

function resetProjectileTrailVfx() {
  projectileTrailVfx = [];
}

function resetLocalStorage() {
  localStorage.clear();
}

function resetBuyback() {
  townVisitSoldHistory = [];
}

// ── Suites ────────────────────────────────────────────────────────────────────

// ── 1. Pure helpers ───────────────────────────────────────────────────────────
suite("Pure Helpers", () => {
  test("isMaterial returns true for material type", () => {
    assertEqual(isMaterial({ type: "material" }), true);
  });

  test("isMaterial returns false for gear", () => {
    assertEqual(isMaterial({ type: "weapon" }), false);
  });

  test("isMaterial returns false for undefined", () => {
    assertEqual(isMaterial({}), false);
  });

  test("getRarityOrder returns correct ordering", () => {
    assert(getRarityOrder("legendary") > getRarityOrder("rare"), "legendary > rare");
    assert(getRarityOrder("epic") > getRarityOrder("uncommon"), "epic > uncommon");
    assertEqual(getRarityOrder("common"), 0);
    assertEqual(getRarityOrder("unique"), 5);
    assertEqual(getRarityOrder("unknown_rarity"), 0, "fallback to 0");
  });

  test("normalizeMaterialStack fills missing quantity", () => {
    let item = { type: "material", value: 3, quantity: 0, totalValue: 0 };
    normalizeMaterialStack(item);
    assert(item.quantity >= 1, "quantity should be at least 1");
  });

  test("normalizeMaterialStack keeps existing quantity intact", () => {
    let item = { type: "material", value: 5, quantity: 4, totalValue: 20 };
    normalizeMaterialStack(item);
    assertEqual(item.quantity, 4);
    assertEqual(item.value, 5);
  });

  test("normalizeMaterialStack is a no-op for gear", () => {
    let item = { type: "weapon", value: 10 };
    normalizeMaterialStack(item);
    assertEqual(item.value, 10); // unchanged
  });

  test("getSlotInfo returns null for null save", () => {
    assertEqual(getSlotInfo(null), null);
  });

  test("getSlotInfo returns correct fields", () => {
    const save = {
      player: { class: "witch", hp: 6, maxHp: 8, gold: 50 },
      dungeon: { floor: 3 },
      savedAt: new Date("2026-04-01").toISOString()
    };
    const info = getSlotInfo(save);
    assertEqual(info.cls, "witch");
    assertEqual(info.floor, 3);
    assertEqual(info.gold, 50);
    assertEqual(info.hp, 6);
    assertEqual(info.maxHp, 8);
    assert(typeof info.savedAt === "string" && info.savedAt.length > 0, "savedAt should be a string");
  });

  test("createDefaultWorldState returns expected shape", () => {
    const w = createDefaultWorldState();
    assert(typeof w.town === "object", "has town");
    assert(Array.isArray(w.milestones.completed), "milestones.completed is array");
    assertEqual(w.town.rebuildTier, 0);
  });

  test("shouldLogAction suppresses regen maintenance ticks", () => {
    assertEqual(shouldLogAction("Regen +1 HP."), false);
  });

  test("shouldLogAction suppresses move-coordinate spam", () => {
    assertEqual(shouldLogAction("Moved to (4,7)."), false);
  });

  test("shouldLogAction keeps tactical combat events", () => {
    assertEqual(shouldLogAction("Rat strikes you for 3."), true);
  });
});

suite("Screen Instructions", () => {
  test("merchant context returns sell instruction", () => {
    const out = renderScreenInstructions("merchant");
    assert(out.includes("[number] sell"), "merchant instruction missing sell hint");
    assert(out.includes("instruction"), "should use instruction class");
  });
  test("guild context returns sell stack instruction", () => {
    const out = renderScreenInstructions("guild");
    assert(out.includes("sell stack"), "guild instruction missing sell stack hint");
  });
  test("blacksmith context returns upgrade instruction", () => {
    const out = renderScreenInstructions("blacksmith");
    assert(out.includes("upgrade"), "blacksmith instruction missing upgrade hint");
  });
  test("crafting context returns attempt craft instruction", () => {
    const out = renderScreenInstructions("crafting");
    assert(out.includes("attempt craft"), "crafting instruction missing attempt craft hint");
  });
  test("town context returns navigation instruction", () => {
    const out = renderScreenInstructions("town");
    assert(out.includes("[1-5]"), "town instruction missing navigation hint");
  });
});

// ── 2. migrateSaveData + normalizeWorldState ──────────────────────────────────
suite("Save Migration", () => {
  test("migrateSaveData adds world to v0 save", () => {
    const raw = { saveVersion: 0, player: {}, dungeon: {} };
    const migrated = migrateSaveData(raw);
    assert(typeof migrated.world === "object", "world should be added");
    assertEqual(migrated.saveVersion, 1);
  });

  test("migrateSaveData preserves existing version-1 save", () => {
    const raw = { saveVersion: 1, player: { class: "orc" }, dungeon: { floor: 2 }, world: createDefaultWorldState() };
    const migrated = migrateSaveData(raw);
    assertEqual(migrated.saveVersion, 1);
    assertEqual(migrated.player.class, "orc");
  });

  test("normalizeWorldState fills missing fields from defaults", () => {
    const partial = { town: { rebuildTier: 2 } };
    const normalized = normalizeWorldState(partial);
    assertEqual(normalized.town.rebuildTier, 2, "rebuildTier preserved");
    assert(typeof normalized.crafting === "object", "crafting backfilled");
    assert(Array.isArray(normalized.milestones.completed), "milestones.completed backfilled");
  });

  test("normalizeWorldState handles null input", () => {
    const normalized = normalizeWorldState(null);
    assertEqual(normalized.town.rebuildTier, 0);
  });
});

// ── 3. Save / Load ────────────────────────────────────────────────────────────
suite("Save / Load", () => {
  test("saveGame writes to correct slot key", () => {
    resetPlayer();
    resetDungeon();
    resetLocalStorage();
    saveGame(2);
    assert(localStorage.getItem("save_2") !== null, "save_2 should exist");
    assert(localStorage.getItem("save_1") === null, "save_1 should be empty");
  });

  test("saveGame serializes player class", () => {
    resetPlayer();
    resetLocalStorage();
    player.class = "witch";
    saveGame(1);
    const data = JSON.parse(localStorage.getItem("save_1"));
    assertEqual(data.player.class, "witch");
  });

  test("loadGame restores player data", () => {
    resetPlayer();
    resetLocalStorage();
    player.class = "orc";
    player.gold = 99;
    dungeon.floor = 4;
    saveGame(3);

    // Reset state
    resetPlayer();
    resetDungeon();

    const ok = loadGame(3);
    assert(ok, "loadGame should return true");
    assertEqual(player.class, "orc");
    assertEqual(player.gold, 99);
    assertEqual(dungeon.floor, 4);
  });

  test("loadGame returns false for empty slot", () => {
    resetLocalStorage();
    const ok = loadGame(5);
    assertEqual(ok, false);
  });

  test("getAllSaves returns only occupied slots", () => {
    resetLocalStorage();
    resetPlayer();
    resetDungeon();
    saveGame(1);
    saveGame(3);
    const saves = getAllSaves();
    assert(saves[1] !== undefined, "slot 1 present");
    assert(saves[3] !== undefined, "slot 3 present");
    assert(saves[2] === undefined, "slot 2 absent");
    assert(saves[4] === undefined, "slot 4 absent");
  });

  test("getFirstFreeSaveSlot returns slot 1 when all empty", () => {
    resetLocalStorage();
    assertEqual(getFirstFreeSaveSlot(), 1);
  });

  test("getFirstFreeSaveSlot skips occupied slots", () => {
    resetLocalStorage();
    resetPlayer();
    resetDungeon();
    saveGame(1);
    saveGame(2);
    assertEqual(getFirstFreeSaveSlot(), 3);
  });

  test("getFirstFreeSaveSlot falls back to 1 when all slots full", () => {
    resetLocalStorage();
    resetPlayer();
    resetDungeon();
    for (let i = 1; i <= 5; i++) saveGame(i);
    assertEqual(getFirstFreeSaveSlot(), 1);
  });

  test("deleteSaveSlot removes the correct slot", () => {
    resetLocalStorage();
    resetPlayer();
    resetDungeon();
    saveGame(2);
    assert(localStorage.getItem("save_2") !== null, "pre: slot 2 populated");
    deleteSaveSlot(2);
    assert(localStorage.getItem("save_2") === null, "post: slot 2 removed");
  });

  test("deleteSaveSlot does not affect other slots", () => {
    resetLocalStorage();
    resetPlayer();
    resetDungeon();
    saveGame(1);
    saveGame(2);
    deleteSaveSlot(2);
    assert(localStorage.getItem("save_1") !== null, "slot 1 untouched");
  });
});

// ── 4. calculateStats ─────────────────────────────────────────────────────────
suite("calculateStats", () => {
  test("base stats with no equipment", () => {
    resetPlayer();
    player.class = "orc";
    calculateStats();
    assertEqual(player.atk, 2, "base atk is 2");
    assertEqual(player.def, 0, "base def is 0");
    assertEqual(player.maxHp, 12, "orc base hp is 12");
  });

  test("base stats for witch", () => {
    resetPlayer();
    player.class = "witch";
    calculateStats();
    assertEqual(player.maxHp, 8, "witch base hp is 8");
  });

  test("equipment adds to stats correctly", () => {
    resetPlayer();
    player.class = "orc";
    player.equipment.mainHand = { atk: 5, def: 0, hp: 0, crit: 10, dodge: 0 };
    player.equipment.chest = { atk: 0, def: 3, hp: 4, crit: 0, dodge: 5 };
    calculateStats();
    assertEqual(player.atk, 7, "2 base + 5 from weapon");
    assertEqual(player.def, 3);
    assertEqual(player.maxHp, 16, "12 base + 4 from chest");
    assertEqual(player.crit, 10);
    assertEqual(player.dodge, 5);
  });

  test("hp is clamped to maxHp after calculateStats", () => {
    resetPlayer();
    player.class = "orc";
    player.hp = 99; // inflated
    calculateStats();
    assert(player.hp <= player.maxHp, "hp should not exceed maxHp");
  });
});

// ── 5. Crafting helpers ────────────────────────────────────────────────────────
suite("Crafting Helpers", () => {
  function makeMat(id, qty) {
    return { type: "material", materialId: id, name: id, value: 2, quantity: qty, totalValue: 2 * qty };
  }

  test("hasMaterialRequirements returns true when inventory satisfies requirements", () => {
    resetPlayer();
    player.inventory = [makeMat("rat_hide", 3), makeMat("goblin_ear", 2)];
    const ok = hasMaterialRequirements([{ id: "rat_hide", qty: 2 }, { id: "goblin_ear", qty: 1 }]);
    assertEqual(ok, true);
  });

  test("hasMaterialRequirements returns false when short on mats", () => {
    resetPlayer();
    player.inventory = [makeMat("rat_hide", 1)];
    const ok = hasMaterialRequirements([{ id: "rat_hide", qty: 5 }]);
    assertEqual(ok, false);
  });

  test("hasMaterialRequirements returns false when material absent", () => {
    resetPlayer();
    player.inventory = [];
    const ok = hasMaterialRequirements([{ id: "rat_hide", qty: 1 }]);
    assertEqual(ok, false);
  });

  test("consumeMaterialRequirements deducts correct amount", () => {
    resetPlayer();
    player.inventory = [makeMat("rat_hide", 5)];
    const ok = consumeMaterialRequirements([{ id: "rat_hide", qty: 3 }]);
    assertEqual(ok, true);
    const remaining = player.inventory.find(i => i.materialId === "rat_hide");
    assertEqual(remaining.quantity, 2, "should have 2 left");
  });

  test("consumeMaterialRequirements removes item when fully consumed", () => {
    resetPlayer();
    player.inventory = [makeMat("goblin_ear", 2)];
    consumeMaterialRequirements([{ id: "goblin_ear", qty: 2 }]);
    assertEqual(player.inventory.length, 0, "item should be removed when depleted");
  });

  test("consumeMaterialRequirements returns false and leaves inventory intact when short", () => {
    resetPlayer();
    player.inventory = [makeMat("rat_hide", 1)];
    const ok = consumeMaterialRequirements([{ id: "rat_hide", qty: 5 }]);
    assertEqual(ok, false);
    assertEqual(player.inventory[0].quantity, 1, "inventory should be untouched");
  });
});

// ── 6. combatq resolveEnemyAttack ─────────────────────────────────────────────
suite("resolveEnemyAttack", () => {
  function fakeEnemy(atk = 4) {
    return { type: "rat", x: 2, y: 2, hp: 10, maxHp: 10, atk, def: 0, state: "CHASE" };
  }
  const fakeEDef = { name: "Rat", behavior: {} };

  test("attack deals damage when dodge fails", () => {
    resetPlayer();
    resetHudDelta();
    player.def = 0;
    player.dodge = 0;
    const orig = Math.random;
    Math.random = () => 0.99; // always hits
    const events = [];
    const dead = resolveEnemyAttack(fakeEnemy(4), fakeEDef, events);
    Math.random = orig;
    assert(!dead, "player should survive a 4 atk hit with 12 hp");
    assertEqual(player.hp, 8, "should take 4 damage (4 atk - 0 def)");
    assert(events.some(m => m.includes("strikes")), "should log strike event");
  });

  test("attack is dodged when random favors player", () => {
    resetPlayer();
    resetHudDelta();
    player.dodge = 100; // guaranteed dodge
    const orig = Math.random;
    Math.random = () => 0.0; // 0 * 100 < 100 → dodge condition fails... let's use actual dodge logic
    // dodge check: Math.random() * 100 >= player.dodge → 0 * 100 (=0) >= 100 is false → DODGE
    const events = [];
    resolveEnemyAttack(fakeEnemy(4), fakeEDef, events);
    Math.random = orig;
    assertEqual(player.hp, 12, "hp should be unchanged on dodge");
    assert(events.some(m => m.includes("dodge")), "should log dodge event");
  });

  test("attack returns true when player hp reaches 0", () => {
    resetPlayer();
    resetHudDelta();
    player.hp = 1;
    player.def = 0;
    player.dodge = 0;
    const orig = Math.random;
    Math.random = () => 0.99; // never dodge
    const events = [];
    const dead = resolveEnemyAttack(fakeEnemy(10), fakeEDef, events);
    Math.random = orig;
    assertEqual(dead, true, "should return true when player dies");
  });

  test("def reduces damage taken", () => {
    resetPlayer();
    resetHudDelta();
    player.def = 2;
    player.dodge = 0;
    const orig = Math.random;
    Math.random = () => 0.99;
    const events = [];
    resolveEnemyAttack(fakeEnemy(4), fakeEDef, events);
    Math.random = orig;
    assertEqual(player.hp, 10, "4 atk - 2 def = 2 damage → 12-2=10 hp");
  });

  test("damage minimum is 1 regardless of def", () => {
    resetPlayer();
    resetHudDelta();
    player.def = 99;
    player.dodge = 0;
    const orig = Math.random;
    Math.random = () => 0.99;
    const events = [];
    resolveEnemyAttack(fakeEnemy(1), fakeEDef, events);
    Math.random = orig;
    assertEqual(player.hp, 11, "minimum 1 damage should always apply");
  });

  test("fleeing enemy sets state to RETURN and logs event", () => {
    resetPlayer();
    const fleeEnemy = { ...fakeEnemy(4), hp: 4, maxHp: 10, state: "CHASE" };
    const fleeEDef = { name: "Coward", behavior: { flees: true } };
    const events = [];
    const dead = resolveEnemyAttack(fleeEnemy, fleeEDef, events);
    assertEqual(fleeEnemy.state, "RETURN");
    assertEqual(dead, false);
    assert(events.some(m => m.includes("fled")), "should log flee event");
  });
});

// ── 7. HUD Delta ──────────────────────────────────────────────────────────────
suite("HUD Delta", () => {
  test("recordHealDelta sets lastHeal for current turn", () => {
    resetHudDelta();
    turn = 5;
    recordHealDelta(3);
    assertEqual(hudDelta.lastHeal.amount, 3);
    assertEqual(hudDelta.lastHeal.turn, 5);
  });

  test("recordDamageDelta adds to damageEvents", () => {
    resetHudDelta();
    turn = 2;
    recordDamageDelta("Rat", 4);
    assertEqual(hudDelta.damageEvents.length, 1);
    assertEqual(hudDelta.damageEvents[0].source, "Rat");
    assertEqual(hudDelta.damageEvents[0].amount, 4);
  });

  test("recordDamageDelta keeps only last 3 events", () => {
    resetHudDelta();
    turn = 1;
    for (let i = 0; i < 5; i++) recordDamageDelta("Enemy", i + 1);
    assert(hudDelta.damageEvents.length <= 3, "should keep at most 3 events");
  });

  test("clearHudDeltaOnStateChange resets all delta state", () => {
    turn = 1;
    recordHealDelta(2);
    recordDamageDelta("Rat", 3);
    clearHudDeltaOnStateChange();
    assertEqual(hudDelta.lastHeal, null);
    assertEqual(hudDelta.damageEvents.length, 0);
    assertEqual(hudDelta.displayedAt, null);
  });

  test("renderHudDelta returns empty string when no current-turn events", () => {
    resetHudDelta();
    turn = 99;
    // No events recorded for turn 99
    const result = renderHudDelta();
    assertEqual(result, "", "should be empty when no events for current turn");
  });

  test("renderHudDelta includes heal span for current-turn heal", () => {
    resetHudDelta();
    turn = 10;
    recordHealDelta(1);
    const result = renderHudDelta();
    assert(result.includes("+1"), "should show +1");
    assert(result.includes("hud-delta-heal"), "should use heal class");
  });

  test("renderHudDelta includes damage span for current-turn damage", () => {
    resetHudDelta();
    turn = 15;
    recordDamageDelta("Goblin", 5);
    const result = renderHudDelta();
    assert(result.includes("-5"), "should show -5");
    assert(result.includes("hud-delta-damage"), "should use damage class");
  });

  test("triggerPlayerFlash marks the player tile as the flash target", () => {
    resetPlayer();
    resetVisualFlash();
    player.x = 4;
    player.y = 3;
    triggerPlayerFlash();
    assertEqual(visualFlash.x, 4);
    assertEqual(visualFlash.y, 3);
    assertEqual(visualFlash.element, "player-damage");
  });

  test("dungeon draw applies player damage flash class to @ tile", () => {
    resetPlayer();
    resetHudDelta();
    resetVisualFlash();
    state = "DUNGEON";
    showActionLog = false;
    atmosphereBanner = "";
    entities = [];
    map = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => "."));
    player.x = 2;
    player.y = 2;
    triggerPlayerFlash();
    draw();
    assert(gameEl.innerHTML.includes('tile-player tile-hit-player-damage'), "player tile should include flash class");
  });

  test("queueProjectileTrail creates elemental trail entries", () => {
    resetProjectileTrailVfx();
    queueProjectileTrail(1, 1, 5, 1, "frost");
    assert(projectileTrailVfx.length > 0, "trail entries should be queued");
    assert(projectileTrailVfx.every(fx => fx.element === "frost"), "trail should keep requested element");
  });

  test("dungeon draw renders projectile trail class when active", () => {
    resetPlayer();
    resetHudDelta();
    resetVisualFlash();
    resetProjectileTrailVfx();
    state = "DUNGEON";
    showActionLog = false;
    atmosphereBanner = "";
    entities = [];
    map = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => "."));
    player.x = 1;
    player.y = 1;
    projectileTrailVfx.push({
      x: 2,
      y: 1,
      element: "arcane",
      glyph: "*",
      startsAt: 0,
      endsAt: Date.now() + 1000
    });
    draw();
    assert(gameEl.innerHTML.includes('projectile-trail projectile-arcane'), "trail tile should include projectile class");
  });
});

suite("Equipment and Attack Identity", () => {
  test("witch can equip blade mainHand weapon", () => {
    resetPlayer();
    player.class = "witch";
    player.inventory = [{
      type: "weapon",
      slot: "mainHand",
      subType: "blade",
      name: "Test Sword",
      atk: 2,
      def: 0,
      hp: 0,
      crit: 0,
      dodge: 0,
      hands: 1
    }];

    let result = equipItem(0, false);
    assert(result && result.includes("Equipped"), "witch should equip blade after restriction removal");
    assert(player.equipment.mainHand && player.equipment.mainHand.name === "Test Sword", "mainHand should be equipped");
    assertEqual(player.inventory.length, 0, "item should be removed from inventory");
  });

  test("suffix-based element overrides subtype", () => {
    resetPlayer();
    player.class = "witch";
    player.equipment.mainHand = {
      type: "weapon",
      slot: "mainHand",
      subType: "blade",
      suffixId: "of_decay",
      name: "Rust Fang",
      atk: 2,
      def: 0,
      hp: 0,
      crit: 0,
      dodge: 0,
      hands: 1
    };

    assertEqual(getAttackElement(), "poison", "suffix should override subtype element");
    let profile = getAttackProfile();
    assert(profile.dot && profile.dot.id === "decay", "decay suffix should grant dot profile");
  });

  test("empty hand element differs by class", () => {
    resetPlayer();
    player.equipment.mainHand = null;
    player.class = "witch";
    assertEqual(getAttackElement(), "hexhand", "witch empty hand element");
    player.class = "orc";
    assertEqual(getAttackElement(), "brawl", "orc empty hand element");
  });

  test("tickEnemyStatusEffects deals damage and expires", () => {
    const enemy = {
      x: 3,
      y: 3,
      hp: 7,
      maxHp: 7,
      statusEffects: [{ id: "decay", damagePerTurn: 2, duration: 1, element: "poison" }]
    };
    const events = [];
    const dead = tickEnemyStatusEffects(enemy, { name: "Dummy" }, events);
    assertEqual(dead, false);
    assertEqual(enemy.hp, 5, "dot should reduce hp");
    assertEqual(enemy.statusEffects.length, 0, "effect should expire after duration reaches 0");
    assert(events.some(m => m.includes("decay")), "dot tick should log status damage");
  });
});


// ── 8. Buyback Ledger ────────────────────────────────────────────────────────
suite("Buyback Ledger", () => {
  test("pushBuybackEntry inserts newest first", () => {
    resetPlayer();
    resetBuyback();
    turn = 1;
    pushBuybackEntry({ type: "weapon", name: "Old Axe", rarity: "common" }, 5, "merchant");
    turn = 2;
    pushBuybackEntry({ type: "weapon", name: "Iron Axe", rarity: "uncommon" }, 8, "merchant");
    assertEqual(townVisitSoldHistory.length, 2);
    assertEqual(townVisitSoldHistory[0].label, "Iron Axe");
    assertEqual(townVisitSoldHistory[1].label, "Old Axe");
  });

  test("pushBuybackEntry caps at 10 entries", () => {
    resetBuyback();
    for (let i = 0; i < 12; i++) {
      pushBuybackEntry({ type: "weapon", name: `Item ${i}`, rarity: "common" }, 5, "merchant");
    }
    assertEqual(townVisitSoldHistory.length, 10);
  });

  test("attemptBuyback fails for missing entry", () => {
    resetPlayer();
    resetBuyback();
    assertEqual(attemptBuyback(0), false);
  });

  test("attemptBuyback fails when gold is low", () => {
    resetPlayer();
    resetBuyback();
    player.gold = 3;
    pushBuybackEntry({ type: "weapon", slot: "mainHand", name: "Costly Blade", rarity: "epic", atk: 3, def: 0, hp: 0, crit: 0, dodge: 0 }, 20, "merchant");
    assertEqual(attemptBuyback(0), false);
    assertEqual(player.inventory.length, 0);
    assertEqual(townVisitSoldHistory.length, 1);
  });

  test("attemptBuyback restores gear and removes entry", () => {
    resetPlayer();
    resetBuyback();
    player.gold = 50;
    pushBuybackEntry({ type: "weapon", slot: "mainHand", name: "Reclaimed Blade", rarity: "rare", atk: 4, def: 1, hp: 0, crit: 0, dodge: 0 }, 14, "merchant");
    assertEqual(attemptBuyback(0), true);
    assertEqual(player.gold, 36);
    assertEqual(player.inventory.length, 1);
    assertEqual(player.inventory[0].name, "Reclaimed Blade");
    assertEqual(townVisitSoldHistory.length, 0);
  });

  test("attemptBuyback restores material stack", () => {
    resetPlayer();
    resetBuyback();
    player.gold = 100;
    addMaterialToInventory({ type: "material", materialId: "rat_hide", tier: "common", name: "Rat Hide", value: 2, quantity: 2, totalValue: 4 });
    pushBuybackEntry({ type: "material", materialId: "rat_hide", tier: "common", name: "Rat Hide", value: 2, quantity: 3, totalValue: 6 }, 9, "guild");
    assertEqual(attemptBuyback(0), true);
    let mat = player.inventory.find(i => isMaterial(i) && i.materialId === "rat_hide");
    assert(mat, "material should be restored");
    assertEqual(mat.quantity, 5);
  });

  test("resetTownVisitBuyback clears entries", () => {
    resetBuyback();
    pushBuybackEntry({ type: "weapon", name: "Spare Dagger", rarity: "common" }, 5, "merchant");
    resetTownVisitBuyback();
    assertEqual(townVisitSoldHistory.length, 0);
  });

  test("getBuybackIndexFromKey maps A-J to 0-9", () => {
    assertEqual(getBuybackIndexFromKey({ key: "a" }), 0);
    assertEqual(getBuybackIndexFromKey({ key: "A" }), 0);
    assertEqual(getBuybackIndexFromKey({ key: "j" }), 9);
    assertEqual(getBuybackIndexFromKey({ key: "k" }), null);
  });
});

// ── Narrative Intro ───────────────────────────────────────────────────────────
suite("Narrative Intro", () => {
  test("introLetterRead defaults to false in new world state", () => {
    const w = createDefaultWorldState();
    assertEqual(w.narrative.introLetterRead, false);
  });

  test("normalizeWorldState fills introLetterRead from defaults when missing", () => {
    const partial = { narrative: { seenFamilies: [], seenMaterialTiers: [], lastWelcomedTier: 0 } };
    const normalized = normalizeWorldState(partial);
    assertEqual(normalized.narrative.introLetterRead, false);
  });

  test("normalizeWorldState preserves introLetterRead: true from saved data", () => {
    const saved = { narrative: { seenFamilies: [], seenMaterialTiers: [], lastWelcomedTier: 0, introLetterRead: true } };
    const normalized = normalizeWorldState(saved);
    assertEqual(normalized.narrative.introLetterRead, true);
  });

  test("startGame resets introLetterRead to false", () => {
    world.narrative.introLetterRead = true;
    player.class = "witch";
    startGame();
    assertEqual(world.narrative.introLetterRead, false);
  });
});

// ── Town Progression ──────────────────────────────────────────────────────────
suite("Town Progression", () => {
  function resetWorld() {
    world = createDefaultWorldState();
  }

  test("refreshTownProgression sets tier 0 with no milestones", () => {
    resetWorld();
    refreshTownProgression();
    assertEqual(world.town.rebuildTier, 0);
    assertEqual(world.town.districtState, "ruined");
  });

  test("refreshTownProgression sets tier 1 on first_warden_felled", () => {
    resetWorld();
    world.milestones.completed = ["first_warden_felled"];
    refreshTownProgression();
    assertEqual(world.town.rebuildTier, 1);
    assertEqual(world.town.districtState, "repairing");
  });

  test("refreshTownProgression sets tier 2 on deep_paths_opened", () => {
    resetWorld();
    world.milestones.completed = ["first_warden_felled", "deep_paths_opened"];
    refreshTownProgression();
    assertEqual(world.town.rebuildTier, 2);
    assertEqual(world.town.districtState, "restored");
  });

  test("refreshTownProgression sets tier 3 on guild_attention_earned", () => {
    resetWorld();
    world.milestones.completed = ["first_warden_felled", "deep_paths_opened", "guild_attention_earned"];
    refreshTownProgression();
    assertEqual(world.town.rebuildTier, 3);
    assertEqual(world.town.districtState, "thriving");
  });

  test("completeWorldMilestone is idempotent", () => {
    resetWorld();
    const r1 = completeWorldMilestone("first_warden_felled", null);
    const r2 = completeWorldMilestone("first_warden_felled", null);
    assertEqual(r1, true);
    assertEqual(r2, false);
    assertEqual(world.milestones.completed.length, 1);
  });

  test("maybeLogScoutReport does not log when floor is 1", () => {
    dungeon.floor = 1;
    const before = actionLog.length;
    maybeLogScoutReport();
    assertEqual(actionLog.length, before);
  });

  test("maybeLogScoutReport logs when floor is greater than 1", () => {
    dungeon.floor = 3;
    const before = actionLog.length;
    maybeLogScoutReport();
    assert(actionLog.length > before, "should have logged a scout note");
    assert(actionLog[actionLog.length - 1].includes("Scout note"), "log should contain scout note");
  });
});

// ── NPC Relations ─────────────────────────────────────────────────────────────
suite("NPC Relations", () => {
  function resetWorld() {
    world = createDefaultWorldState();
  }

  test("npcRelations defaults to 0 for all NPCs", () => {
    resetWorld();
    assertEqual(world.npcRelations.merchant, 0);
    assertEqual(world.npcRelations.blacksmith, 0);
    assertEqual(world.npcRelations.guild, 0);
  });

  test("getNpcRelationLabel returns stranger at 0", () => {
    resetWorld();
    assertEqual(getNpcRelationLabel("merchant"), "stranger");
  });

  test("getNpcRelationLabel returns acquaintance at 1", () => {
    resetWorld();
    world.npcRelations.merchant = 1;
    assertEqual(getNpcRelationLabel("merchant"), "acquaintance");
  });

  test("getNpcRelationLabel returns acquaintance at 2", () => {
    resetWorld();
    world.npcRelations.merchant = 2;
    assertEqual(getNpcRelationLabel("merchant"), "acquaintance");
  });

  test("getNpcRelationLabel returns known at 3", () => {
    resetWorld();
    world.npcRelations.guild = 3;
    assertEqual(getNpcRelationLabel("guild"), "known");
  });

  test("getNpcRelationLabel returns trusted at 6", () => {
    resetWorld();
    world.npcRelations.blacksmith = 6;
    assertEqual(getNpcRelationLabel("blacksmith"), "trusted");
  });

  test("normalizeWorldState preserves npcRelations values", () => {
    const saved = { npcRelations: { merchant: 4, blacksmith: 7, guild: 2 } };
    const normalized = normalizeWorldState(saved);
    assertEqual(normalized.npcRelations.merchant, 4);
    assertEqual(normalized.npcRelations.blacksmith, 7);
    assertEqual(normalized.npcRelations.guild, 2);
  });
});

// ── Render ────────────────────────────────────────────────────────────────────
function renderResults() {
  let total = 0, passed = 0;
  const container = document.createElement("div");
  container.innerHTML = `<h1>Wrogue Test Suite</h1>`;

  for (const suite of results) {
    const suiteEl = document.createElement("div");
    suiteEl.className = "suite";
    suiteEl.innerHTML = `<div class="suite-name">${suite.name}</div>`;

    for (const t of suite.tests) {
      total++;
      if (t.pass) passed++;
      const icon = t.pass ? "✓" : "✗";
      const cls = t.pass ? "pass" : "fail";
      const detail = t.pass ? "" : ` — ${t.msg}`;
      suiteEl.innerHTML += `<pre class="${cls}">  ${icon} ${t.name}${detail}</pre>`;
    }

    container.appendChild(suiteEl);
  }

  const allPass = passed === total;
  const summaryEl = document.createElement("div");
  summaryEl.className = `summary ${allPass ? "all-pass" : "has-fail"}`;
  summaryEl.textContent = `${passed} / ${total} tests passed`;
  container.appendChild(summaryEl);

  document.body.appendChild(container);
}

renderResults();
