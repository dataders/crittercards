# Crittercards roadmap and coordination

Snapshot for November 27, 2026. Use this document to coordinate work. GitHub [#9](https://github.com/dataders/crittercards/issues/9) is the public roadmap umbrella. Existing issues #1–#9 were updated and issues [#10](https://github.com/dataders/crittercards/issues/10), [#11](https://github.com/dataders/crittercards/issues/11), and [#12](https://github.com/dataders/crittercards/issues/12) were created. CC labels are local references.

## Milestones

1. **Make the build ready for invited players.** Finish room recovery and reconnect, keep combat and save controls understandable, and verify one release at a named commit. Work on CC-01 through CC-05 in parallel where ownership permits.
2. **Run a measured playtest.** Cover solo and co-op openings, all three trial types, and a timed full clear. Use the findings to choose campaign, economy, and character tuning. Work on CC-06 through CC-08.
3. **Add reasons to replay.** Make recruitment and familiar progression meaningful, then shorten the path into a second run. Start with CC-09 and CC-10 after the first-playtest findings.

The campaign remains three acts of 20 levels. Treat 90–120 minutes as a human pacing target. Automated clears establish that the campaign can finish. They provide no estimate of how long players spend reading, discussing, choosing, or taking breaks.

## Workstream ownership

“Update Crittercards roadmap” is the coordinator. The five sibling chats below were visible in the Crittercards project. A chat can own a lane while idle. Its latest completed check and the current repo diff establish what work is available to pick up.

| Lane | Sibling Codex chat | Feedback and last confirmed boundary | Next handoff |
| --- | --- | --- | --- |
| Rooms and gold economy | Build co-op animal deckbuilder MVP | Reported “Room not found,” recover after restart, and keep storage free. The Postgres change was reverted. Signed recovery is committed at [`c0fb70b`](https://github.com/dataders/crittercards/commit/c0fb70b) and awaits authorized hosted configuration. Guest-first browser reconnect still needs work. Price floor is 15 gold, removal costs 30, and Hard pays triple. | Own CC-01 and CC-02. Hand off exact release evidence and the remaining economy question for CC-07. |
| Characters and hand size | Add Four Cousin Characters | Hudson, Quinn, Alba, and Tito have distinct roles. Tito is fragile, with Secret Star opening odds of one in three and a round-two fallback. Five-card hands and both seeded fixtures are committed in [`5c43bdd`](https://github.com/dataders/crittercards/commit/5c43bdd). The chat verified the five-card opening and round two in the browser. | Own character inputs to CC-07 and lead CC-09 only after the first playtest. |
| Combat controls and fixtures | Add enemy targeting by dragging | Players wanted obvious targets and deliberate aiming. Drag works for attack cards and companion moves, with a keyboard path and direct Block controls. The chat verified mouse, touch, and keyboard in Chrome. It confirmed that the five-card fixtures were already in the hand-size commit. | Own CC-03. Coordinate with the gameplay owner before refreshing shared fixtures. |
| Runtime, release, and regression checks | Review architecture and safeguards | One seeded rules engine serves all modes. The full co-op replay covers all three trials through level 60. The chat verified Render at [`f49a76d`](https://github.com/dataders/crittercards/commit/f49a76d6aae7dbdee9d957299a03940b4c386a27) with a two-client room check. That evidence applies to that release. | Own CC-05 and maintain the release evidence. |
| Music, presentation, and pacing | Compare Crittercards to Slay the Spire | The user asked for 90–120 minutes, six original act/boss tracks, continuous play, and an attachment download for the one-hour mix. The chat verified the public download. | Own soundtrack checks in CC-05 and contribute the pacing protocol for CC-06. |
| Trials, campaign balance, and integration | Update Crittercards roadmap · current coordinator | Floodgate recoil is committed in [`68811a9`](https://github.com/dataders/crittercards/commit/68811a9). Matched starter runs on that revision found a tempo advantage in 9/16 co-op fights and a full round saved in 2/16 solo fights. Full-block and two-hit cancellation are covered separately. | Own CC-04, prioritize the queue, and resolve cross-lane conflicts before release. |

**Current coordination risks.** Rooms and UI share `app.mjs`. Hand size, trial mechanics, and replay capture share `game.mjs` and the fixtures. The shared checkout had unpublished Floodgate edits while room work was landing. Assign one writer to each overlapping path at a time. Local reviews can run independently on a pinned Git archive in a temporary directory. Implementation goes in an isolated branch or worktree when another owner is editing the same checkout.

## Issue drafts

Each heading is a suggested issue title. Prefer updating the linked issue when it covers the same acceptance criteria. CC-01 and CC-02 can be child issues of #8 if split ownership helps.

### CC-01 · Finish database-free room checkpoint recovery

Priority P0. [Existing #8](https://github.com/dataders/crittercards/issues/8). Owner: rooms.

**Done when**

- [ ] A host exports a private checkpoint, quits and restarts the service, restores the room, and both original seats continue the same saved revision with the usual room code. Exercise a checkpoint after a real combat action or purchase.
- [ ] The app distinguishes the shareable invite code from the private checkpoint, explains restoration to the saved point, and tells the host when to save again. No paid database is required.
- [ ] Restore validates checkpoint integrity and version, rejects expired or invalid input, retains size limits, and never overwrites an already-active room. A newer active revision wins. Document how old checkpoints behave when the server has no durability.
- [ ] Save, restore, replay of a request, and another host/guest action pass on an isolated HTTP instance. Documentation describes the host and guest steps. Record a separate hosted check on the release candidate.

### CC-02 · Keep the guest seat through disconnect, restart, and expiry

Priority P0. [Existing #8](https://github.com/dataders/crittercards/issues/8). Owner: rooms. Coordinate with CC-01.

**Done when**

- [ ] In two separate browser contexts, the guest refreshes while the server is back but before the host restores. The app preserves the saved seat and offers retry. After restore, the guest returns to the original seat and revision.
- [ ] A temporary network or service failure does not discard the seat. A permanently expired or invalid room has a clear path to retry, restore where appropriate, or return to setup.
- [ ] Stale and duplicate actions cannot spend gold or claim rewards twice. Both seats converge after the next valid action.
- [ ] Report the local two-client result and then repeat on two devices over the hosted HTTPS service before calling room play ready for a wider test.

### CC-03 · Make combat targeting and reward choices readable on every input

Priority P1. [Existing #3](https://github.com/dataders/crittercards/issues/3). Owner: controls.

**Done when**

- [ ] With a mouse, on a narrow touch viewport, and by keyboard, a player can identify the active familiar and the surging or selected rival, target a card or companion move deliberately, cancel, and take a valid action next.
- [ ] The floating drag preview is readable. Verify at least 4.5:1 contrast while dragging over the battlefield. Play Tito’s Secret Star from a fresh fight using click or tap and using drag; each valid gesture spends one card and hits the intended rival once.
- [ ] Invalid drops, stale input, and an out-of-turn seat spend no energy and do not change the hand. Block or support plays directly when it needs no target. Touch scrolling and keyboard focus support reaching rivals above the hand.
- [ ] Both seats can read enemy intent, see their own reward status, and independently draft or skip. Verify the display at full and narrow widths and collect the first human confusion point in CC-06.

### CC-04 · Lock in Floodgate’s three viable openings

Priority P1. [Issue #10](https://github.com/dataders/crittercards/issues/10). Owner: gameplay.

**Done when**

- [ ] On the same draw and starting HP, replay full Block, a legal two-hit cancellation, and rushing that takes the surge and triggers recoil. Verify the indicated target, countdown, HP, and reward path after recoil can finish a fight.
- [ ] Across every Floodgate level and at least two seeds, run matched solo-starter, co-op-starter, and upgraded profiles. Report rounds, player turns, HP after the next fight, and any losses. Label constructed low-HP starts.
- [ ] In the normal-health sample, both opening styles are viable. Rushing has a tempo win in both starter modes, and blocking has an HP-preservation win in both. Reproduce a case where the survivor can use the full-block counter in co-op.
- [ ] Verify the current five-card solo and co-op fixtures on the same revision. Include one browser check of the recoil and Block cues. Publish under CC-05.

### CC-05 · Release from one tested commit and verify the live build

Priority P1. [Issue #11](https://github.com/dataders/crittercards/issues/11). Owner: release, with music and controls reviewers.

**Done when**

- [ ] Record clean commit, Node version, complete `node --test` result, and the local two-client room smoke. Both campaign fixtures pass. Gameplay and its changed fixture travel together.
- [ ] Record GitHub commit and the exact deployed Render commit. A green result for an earlier release remains attached to its original revision. Confirm Render deploy configuration before the next authorized release.
- [ ] On live HTTPS, record private room, public matching, share/invite, guest reload, and one real combat-to-reward transition. For a release with CC-01 or CC-02, exercise the corresponding restart and reconnect checks separately.
- [ ] Smoke the six tracks in order with wrap/stop, Music toggle, public ZIP and one-hour attachment link. Spot-check that a range request for playback and a download request return usable audio. [Live game](https://crittercards.onrender.com/) · [Soundtrack](https://crittercards.onrender.com/soundtrack.html)

### CC-06 · Run the first measured player sessions

Priority P1 after the local basics are stable. [Existing #1](https://github.com/dataders/crittercards/issues/1). Owner: coordinator and human playtesters.

**Done when**

- [ ] Observe one new solo player and one shared-screen pair through the first merchant and trial, plus one two-device room session. Observe one unassisted opening before giving instruction.
- [ ] Record mode, revision, characters, route, active play time, stalls, first turn handoff, whether the player read intent correctly, and meaningful purchase or reward choices. Capture exact reproduction steps for blockers.
- [ ] Record at least one timed full clear or the precise stopping point. Report time by act and active time separately from breaks. Compare a completed run with the 90–120 minute target before adjusting campaign length.
- [ ] Triage feedback into CC-03, CC-07, CC-08 or a new issue when it represents a distinct problem. Keep human observations distinct from headless balance results.

### CC-07 · Make late gold and build choices matter

Priority P2. [Existing #7](https://github.com/dataders/crittercards/issues/7). Owners: gameplay and economy after CC-04.

**Done when**

- [ ] Record gold earned, balance before selected shops in each act, items bought or deferred, and whether 30-gold removal competes with a card purchase. Compare matched Standard/Hard routes and solo/shared-screen play.
- [ ] Keep the chosen 15-gold merchant floor, 30-gold removal, and triple Hard reward unless the user changes them. Starting deck, companions, and legal purchase rules stay consistent within each comparison.
- [ ] Identify any late shop where optimized players can buy every desirable option without sacrificing another. Test one focused intervention against that baseline and document its effect on early affordability and late decisions.
- [ ] Check five-card draw, Keen Senses, Tito’s opener/fallback, and two contrasting cousin/companion pairings. Record any character-specific imbalance as a reproducible setup instead of changing several knobs in one pass.

### CC-08 · Finish local save and make the trail readable across acts

Priority P2. [Existing #2](https://github.com/dataders/crittercards/issues/2) and [#4](https://github.com/dataders/crittercards/issues/4). Owner: client after CC-03.

**Done when**

- [ ] From solo and shared-screen, save and reload during route choice, combat, merchant, camp, reward and an act transition. Resume the same pending choice, hand, inventory and ownership.
- [ ] A malformed or older save gives a recoverable explanation or migrates cleanly. A resumed purchase, unlock or reward applies once. A completed or abandoned save can be intentionally cleared.
- [ ] On a narrow viewport, players can find the current level, selected route, upcoming Hard/Trial and optional stops, and the next act boss. Record any [#2](https://github.com/dataders/crittercards/issues/2) criteria already covered by the current map.

### CC-09 · Make recruitment and familiar progression shape the next run

Priority P3 after CC-06. [Existing #5](https://github.com/dataders/crittercards/issues/5) and [#6](https://github.com/dataders/crittercards/issues/6). Owner: characters and gameplay. Split into two tickets when implementation starts.

**Done when**

- [ ] Players encounter at least one recruitment choice on the trail, understand what it unlocks, and can use the recruit in a later run. The collection exposes combat role and recruitment progress without hiding the unlock requirement.
- [ ] Route-specific unlocks use actual encounter outcomes if a new choice changes the rivals faced. Confirm recruits and card unlocks agree after online polling skips a snapshot or a save is resumed.
- [ ] Ember and Pip each have two explained, mechanically distinct upgrade paths. Each player independently selects their path in solo/shared-screen/room reward flow where applicable and sees the effect in card text or combat.
- [ ] Existing recruits and saves load. The choice adds a meaningful decision in a short human playtest. Basic perk progression works for familiars outside the first pilot.

### CC-10 · Reduce friction between runs and vary later encounters

Priority P3 after CC-06, with rematch independent of CC-09. [Issue #12](https://github.com/dataders/crittercards/issues/12) covers rematch and [#7](https://github.com/dataders/crittercards/issues/7) covers encounters. Owners: client for rematch, gameplay and design for encounters.

**Done when**

- [ ] A rematch pre-fills the previous characters and starting decks, allows edits, and creates a fresh run with the collection carried forward.
- [ ] Add a new encounter pattern or biome presentation only when playtest notes identify a repetitive region. Verify that the pattern changes a player decision and that intent stays readable with reduced motion.
- [ ] Recheck run pacing and replay intent after a second playtest. Evaluate PvP once co-op reliability and pacing are established.

## Coordinator protocol

1. **Route feedback by issue.** The coordinator reads incoming feedback, asks the current owner for a handoff when needed, and logs the next gate here. A sibling chat is a work lane. A subagent handles a bounded investigation or test within a lane.
2. **Dispatch one bounded slice.** Include the issue, exact base commit and absolute checkout, allowed edit paths, evidence to return, owner of integration, and scope of publication. Assign one writer per overlapping file set. Read-only investigators can share a committed snapshot.
3. **Keep status evidence-sized.** Record **Queued**, **Working**, **Local verified**, **Hosted verified**, or **Player accepted**, with the owner, commit or diff, first failed check, and next action. Send a short update at a changed gate or required decision. Keep GitHub and Render release facts separate.
4. **Keep moving.** Resolve reversible details inside the issue’s scope. If a task needs a live deployment, a durable signing credential, a paid service, or human playtime that has not been authorized or arranged, record that dependency and pick the next ready item. Continue local tests, documentation, and evidence capture in parallel. Existing issue drafts can be published together after authorization.
5. **Integrate in order.** For rooms, test the restore protocol before reconnect UX, then cross-device and hosted. For game changes, land mechanics and the matching replay together. For UI, pin the game revision before testing input. Send the user one combined update instead of making them reconcile separate chat summaries.

Handoff template:

```text
Issue and owner
Base commit and absolute checkout
Paths owned
Player behavior or decision being tested
Done when
Verified results and evidence
Remaining dependency and next action
```

## First unattended work block

Estimated **75–95 minutes** of local work, with independent fallbacks. Start with a committed archive for reproducibility and identify concurrent owners before proposing patches. Keep all evidence keyed to a commit or an explicit working-tree snapshot.

| Order | Time | Work and output |
| --- | ---: | --- |
| 1 | 10–15 min | Pin committed and working-tree revisions, run `node --test` against both, and record any divergence by seed and action. Mark which chat owns each dirty path. |
| 2 | 20–25 min | With the rooms owner or a read-only reviewer, reproduce host restart, guest refresh before restore, and stale/repeated actions on isolated loopback. Record the first wrong state or status and map it to CC-01 or CC-02. If the owner is changing the code, pin a separate snapshot and characterize the contract. |
| 3 | 20–25 min | Run matched Floodgate trials at levels 5/9/13/17 of Act II using four normal-health seeds per profile, covering solo starter, co-op starter, and upgraded decks. Record turns and HP through the next fight. Use a constructed low-HP edge to separate real risk from normal pacing. |
| 4 | 15–20 min | Check keyboard and narrow touch targeting plus route/combat/camp/shop/reward save and resume. If browser automation is unavailable, substitute an in-process room and saved-state matrix and retain the browser checks as open. |
| 5 | 10 min | Update ticket evidence, identify the next single-writer slice, and send one handoff with relevant actions completed and any human or hosted verification still due. |

The first block is ready to run independently of human playtest scheduling or hosting decisions. The current released evidence and newly observed evidence belong on the corresponding issue draft.

### Work already dispatched

| Issue | State | Evidence or next step |
| --- | --- | --- |
| CC-01 | Local verified · rooms owner | Signed recovery lands at `c0fb70b`. The coordinator ran all 33 Node tests against an isolated copy. The rooms chat requested authorization for the hosted signing configuration. The hosted restart gate is open. |
| CC-02 | Working · rooms owner | The early unsigned checkpoint passed Node and loopback checks but failed in Chrome. The signed `c0fb70b` candidate joins successfully in Chrome. A guest reload before host restore still drops the browser seat, though host restore preserves that seat server-side. Dispatched the bounded browser-reconnect fix to the rooms owner, scoped to local app/transport and tests. |
| CC-03 | Local input verified · controls owner | Isolated `68811a9`, headless Chrome: keyboard Escape restored focus and preserved HP, hand, and energy. At 375 × 420, touch drag scrolled to the rival, cancel preserved state, and retry hit the intended rival. Physical touch and co-op reward UI remain open. |
| CC-04 | Local verified · coordinator | Pinned `68811a9`: both openings won all 48 normal-health pairs across three profiles. Rush won sooner in 2/16 solo-starter, 9/16 co-op-starter, and 3/16 upgraded-solo pairs by player turns. Block preserved more HP in 14/16, 16/16, and 11/16. Both starter lines lost both constructed low-HP starts in each starter profile. |
| CC-05 | Local verified · coordinator | Clean `68811a9`: 32/32 Node tests. The release owner’s earlier hosted result was `f49a76d`. Await the new exact hosted record. |
| CC-08 | Local scenes verified · coordinator | On clean `68811a9`, Chrome saved and restored route choice, combat, camp, shop, and reward in solo and shared-screen. The shared-screen Act II transition also round-tripped. An unsupported version showed a recovery message. A version-1 save with malformed nested data raised a rendering error instead. Duplicate-effect checks remain open. |
