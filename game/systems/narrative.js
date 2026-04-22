// ============================================================================
// NARRATIVE PROGRESSION HELPERS
// Responsibility: codex lore seeding and milestone/NPC-triggered lore unlocks.
// Consumed by: startup flow, milestone completion, NPC interactions.
// ============================================================================

function seedStartingLoreEntries() {
  ["first_arrival", "guild_contract", "lore_ashroot_outskirts"].forEach(id => {
    if (!codex.lore.includes(id)) codex.lore.push(id);
  });
}

function unlockMilestoneLore(milestoneId) {
  let ids = MILESTONE_LORE_UNLOCKS[milestoneId] || [];
  ids.forEach(id => unlockLoreEntry(id));
}

function maybeUnlockNpcLore(npc) {
  if (npc === "guild") {
    if (hasWorldMilestone("guild_attention_earned")) {
      unlockLoreEntry("fall_fragment_iii");
    } else if (hasWorldMilestone("first_warden_felled")) {
      unlockLoreEntry("ashroot_origin");
    }
  }
  if (npc === "merchant" && hasWorldMilestone("deep_paths_opened")) {
    unlockLoreEntry("fall_fragment_i");
  }
  if (npc === "blacksmith" && hasWorldMilestone("deep_paths_opened")) {
    unlockLoreEntry("fall_fragment_ii");
  }
}
