# Crittercards · The Hollow Trail

A two-player deckbuilding roguelite set in a dark mythic woodland. Each player brings one cousin or woodland familiar. Beat rival trainers, draft cards, pick level-up perks, and recruit new animals for later runs.

## Play

Run `node server.mjs` with Node 22 or newer, then open [localhost:4173](http://localhost:4173). There are no packages to install.

**Music** in the header toggles the original instrumental soundtrack. Each act has a trail theme and a faster arrangement for its boss fight. All six loops were synthesized for Crittercards without third-party recordings or samples. The setting is saved in your browser.

- **Single player.** Choose one character and build their deck. Ally effects apply to your own character, and rivals have reduced health and attack damage.
- **Share a screen.** Pick a character and build a deck for each player, then choose **Begin the trail**. Take turns using the same controls. One person can also play both hands.
- **Play with a room code.** Open the game in two browser tabs or on two devices that can reach the same server. The host creates a room, the guest joins by code, and each player picks a character and confirms a deck. For devices on the same trusted network, start with `HOST=0.0.0.0 node server.mjs` and use the host machine’s LAN address on both devices.

The four cousins are playable from the start. Hudson practices poison magic, while Quinn, Alba, and Tito practice different kinds of necromancy.

Each cousin chooses a recruited woodland animal as a companion. Select a rival and use the companion’s special ability for free once per turn. Each animal has its own ability, and its attacks use its type and benefit from the cousin’s attack bonuses. In solo play, effects that help an ally help your own character. The companion has no separate health bar. Animal characters remain available on their own.

- **Hudson · Poison Witch · 45 HP.** Venom Ward shields the team and applies 3 Poison to a rival. Poison takes HP before the rival acts and then drops by 1.
- **Quinn · Bone Witch · 34 HP.** Bone Hex conjures a skeletal ward that makes a rival Vulnerable and Frail.
- **Alba · Spirit-Song Witch · 32 HP.** Spirit Chorus calls a spirit to strike for every energy spent. Extra spirits move to the next rival.
- **Tito · Star-Spirit Witch · 35 HP.** His Secret Star summons a ghost that deals 22 base damage through Block for 3 energy.

Ember the fox and Pip the hare are available from the start, too. Recruit Bramble the badger and Latch the raccoon at your first win. The collection shows requirements for all 30 species, and your browser remembers your recruits across runs. Each animal has a signature card, a role, and its own starting health. Level-up perks include attack damage, health, starting Block, extra cards, starting energy, and healing.

Each starting deck contains two copies of the character’s signature and five cards you choose from the shared library. Start with eleven library cards and unlock nine more by defeating individual rival creatures. Unlocks stay in the browser even if the run ends in defeat. Drafted cards go into your current deck.

Rallying Howl adds Strength, which boosts every attack for the rest of the fight. Expose applies Vulnerable, which makes the next hit deal 50% more damage. Brittle Hex applies Frail, which reduces the target’s next Block gain by 3. Ironhide and Cindermaw can apply Frail to your familiars.

Every animal has one type. Ember beats Grove, Grove beats Tide, Tide beats Stone, and Stone beats Ember. Attacks deal 50% more damage against the type they beat and 25% less against the type that beats them. Other matchups deal normal damage. The multiplier applies before Vulnerable and Block, and enemy attacks use the same rules.

Fixed costs range from 0 to 3 energy. Quick Jab and Quick Brace cost 0 and give you 2 damage or 2 Block. Briar Lunge costs 2 for 13 damage, while Root Barricade costs 2 for 11 Block for you and 10 for your partner. Crownfall spends 3 for 24 damage and 5 Block for your partner. X-cost cards spend all remaining energy and repeat once per energy spent. Wild Flurry deals four base damage per hit and moves to another rival if its target falls. Thorn Circle grants both familiars Block per energy spent.

The campaign has three acts of 20 levels each. Defeat the Ash Regent in **The Hollow Trail**, the Mire Matron in **The Drowned Canopy**, and the Thorn Sovereign in **The Thorn Court**. The target is 90–120 minutes for a full clear. After each of the first two bosses, the pack recovers to full health and carries its decks, upgrades, perks, and gold into the next act.

Each level offers two fights. Hard fights appear at levels 3, 6, 10, 14, 18, and 20 of each act. Standard routes pay 8 gold per rival. Hard routes have stronger enemies and pay 24 gold per rival. The map shows each enemy’s health and the total gold available. After every fight through level 19 of the last act, each player levels up, gains health capacity, picks a perk, and can take or skip a card. During combat, read intents, cover your partner, and follow up on your partner’s latest target for a Bond Strike.

Win the level 3 Hard fight in the first act to choose an extra run-long perk per familiar. Briar Ambush adds 5 base damage to your first attack hit each fight. Trail Ward starts every fight with 8 extra Block. In co-op, Bond Ward grants both familiars 5 Block per player who chose it on the first Bond Strike each fight.

The Ash Regent uses Eclipse to damage the team and apply Vulnerable, Shadow Ward to gain Block and heal, and Crown Curse to attack one familiar and apply Frail and Vulnerable. Watch the intent shown above each turn.

Optional merchants at levels 4, 8, 12, 16, and 19 of each act sell cards from different inventories. Gold is shared and each purchase goes into one player’s deck for the current run. Visit each merchant once, then return to choose a fight on that level. In room play, Player 1 chooses routes and each player buys for their own deck.

Optional camps appear at levels 3, 7, 11, 15, and 19 of each act. Each familiar chooses either to recover 30% of its maximum health, rounded up, or upgrade one card for this run. Each card can be upgraded once. A camp can be visited once, and each player chooses separately in co-op.

Room state lives in one server process and expires after six hours of inactivity. A reload can recover your seat in the same tab while the room still exists. Restarting the process clears the rooms. Collection progress is saved in the browser and stays with that browser.

Use **Save game** during a run and **Continue saved game** on the opening screen to resume on the same browser. One manual save is kept, and saving again replaces it. A saved room game resumes as shared-screen play, with both players controlled on that browser.

## Tests

Run `node --test` from the repository root. The tests drive game actions directly in Node.

## Roadmap

| Milestone | Gameplay | Visual design | Engineering |
| --- | --- | --- | --- |
| First playtest | Watch two players share a screen. Ask which animal they want next, whether the first level-up changes a decision, and whether they coordinate without prompting. Record wins and run time by pair. | Check whether both players can read whose turn it is, what rival creatures intend to do, and what unlocks next. | Test the full run loop, then repeat the room flow across two devices and capture reconnect failures. |
| Collection update | Add recruitment choices tied to animals met on the trail. Give a few favorites distinct level paths and try a draft choice to remove or upgrade a card. | Make recruitment and level-ups more visible with short, skippable reveals. Give the collection filters for combat role and recruitment progress. | Add rematches and save/resume for shared-screen runs. Add deterministic replays for balancing and regression checks. |
| Wider playtest | Add more trainer patterns and encounters before evaluating PvP. Tune creature pairings using playtest results. | Give each biome distinct arena artwork and tune combat effects for readability with reduced motion. | Persist online rooms and actions, test recovery across browsers, and put the service behind HTTPS before opening a public playtest. |

## Artwork

The trail banner and the 34 portraits are bundled in [assets/](assets/). They were made with built-in ImageGen and exported as WebP. The banner brief called for a moon gate, an ember fox, and a moon hare in a dark spruce forest. The portrait brief used four-by-two contact sheets of identifiable species with gouache texture, woodcut lines, and subtle ember, moonlight, or shadow effects.
