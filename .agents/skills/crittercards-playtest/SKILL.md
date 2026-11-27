---
name: crittercards-playtest
description: Playtest a Crittercards change or mechanic and explore adjacent design tradeoffs. Use for recent changes, difficulty, progression, combat, or player-flow reviews that call for evidence and design ideas beyond a bug fix.
---

# Crittercards playtest

Run a focused playtest of the requested change and the player decisions it affects. Default to reporting findings and experiments. Change game code or record regression tests when the user asks for implementation.

## Pick the test

- Identify the change, the player-facing promise, and the nearest decision before and after it. For recent changes, inspect the diff against a confirmed baseline. If the local checkout has an unborn Git branch, compare against a verified snapshot or remote ref if available. State which version you tested and what you compared it with.
- Use one ordinary path, one contrasting player choice, and one plausible edge. Choose variations that could change your recommendation. For Hard routes, try the same deck and starting seed on Standard and Hard, then follow each path through the next draft or merchant to see how the reward changes the next decision.
- Consider who bears the cost or gets the benefit. A solo effect may behave differently with a partner, a cautious player may react differently from a risk-taker, and a new player may miss a cue an experienced player expects.

## Play it

- Run `node --test` as a baseline. The seeded full-campaign fixture in `test/fixtures/solo-campaign.json` is a known line of play. Check which decisions it actually exercises.
- For mechanics, use short headless runs through `createRun` and `applyAction` in `game.mjs`. Use fixed seeds, legal game actions, and fresh state for each comparison. Match starting conditions where possible. Run scratch probes inline or in a temporary directory. Label constructed corner-case states and naturally reached states so the evidence is clear.
- Compare outcomes that matter to the decision, such as HP lost, resources brought into the next fight, draft or shop options, boss moves seen, or whether both co-op players can affect the outcome. Measure the immediate outcome and the state at the next choice, since healing or rewards can erase the initial cost. Record the mode, seed, deck, route and action sequence or key steps needed to reproduce a finding. Use more than one seed before claiming a pattern and describe the strategy used.
- For input, wording, focus, layout, or reconnect, use the smallest available check that observes the behavior. Treat engine results as rules evidence. Claims about interaction or readability need a browser observation or human feedback, as appropriate. Keep core mechanics checks headless and avoid adding browser dependencies for a playtest.

## Report what to try

Lead with the most consequential observations. For each, give the evidence, who it affects, and what the next playtest should check. Identify reproducible bugs and examine the surrounding choice. Look for an incentive players can optimize around, a reasonable strategy the change makes less viable, or information players need earlier.

Offer a few experiments tied to the evidence. Explain each tradeoff and how to tell whether the experiment helped. Distinguish confirmed behavior, design hypotheses, and questions for human players. Label anything untested. When the user requests a fix, rerun the original case and an adjacent case that could plausibly regress.
