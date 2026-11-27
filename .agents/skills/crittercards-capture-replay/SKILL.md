---
name: crittercards-capture-replay
description: Turn a Crittercards bug report, playtest finding, or recorded run into a reproducible headless node:test regression or replay. Use when the user wants to preserve specific game behavior or reproduce a reported rules failure.
---

# Capture a Crittercards replay

Preserve the smallest sequence that demonstrates the behavior the user wants to protect. For a full-run milestone, keep the full sequence and assert the decisions and outcomes that make the replay valuable.

- Read `test/game.test.mjs` and the relevant actions in `game.mjs`. Use `test/fixtures/solo-campaign.json` as the format for a longer recorded run. A short regression usually fits inline in the existing test file.
- Capture the mode, seed, starting critter IDs and decks, and the ordered action objects that `applyAction` receives. Preserve exact hand indices and targets for recorded plays. When starting from an incomplete report, use a representative seed or a minimal constructed state if that reproduces the problem. Say which details came from the report and which you reconstructed.
- Start from `createRun` and use legal actions to reach the case when practical. Label a deliberately constructed corner case, such as a familiar at one HP before a lethal enemy turn. For rejection cases, check that the prior state is unchanged.
- Assert the relevant state at the decision or outcome, such as the active player, HP, status effects, or victory. Check that a fixed replay agrees at every step across two runs if determinism is part of the contract. Keep failure output centered on the seed, step, action, and expected result. Preserve the original failing sequence when recording a bug, including the first failing step.
- Run `node --test`. A reproduction for an open bug may fail by design. Report whether it reproduced and keep the game fix separate unless the user also asks for it. Treat room revisions and browser behavior as separate evidence from an engine replay. Exclude live room credentials from fixtures.
