# Crittercards · The Hollow Trail

A two-player deckbuilding roguelite set in a dark mythic woodland. Each player brings one cousin or woodland familiar. Beat rival trainers, draft cards, pick level-up perks, and recruit new animals for later runs.

## Play

Run `node server.mjs` with Node 22 or newer, then open [localhost:4173](http://localhost:4173). There are no packages to install.

**Music** in the header toggles the original instrumental soundtrack. Each act has a trail theme and a faster arrangement for its boss fight. All six loops were synthesized for Crittercards without third-party recordings or samples. The setting is saved in your browser. Open the [soundtrack page](soundtrack.html) to play or download individual tracks.

- **Single player.** Choose one character and build their deck. Ally effects apply to your own character, and rivals have reduced health and attack damage.
- **Share a screen.** Pick a character and build a deck for each player, then choose **Begin the trail**. Take turns using the same controls. One person can also play both hands.
- **Play with a room code.** Open the game in two browser tabs or on two devices that can reach the same server. The host creates a room, the guest joins by code, and each player picks a character and confirms a deck. For devices on the same trusted network, start with `HOST=0.0.0.0 node server.mjs` and use the host machine’s LAN address on both devices.

The four cousins are playable from the start. Hudson practices poison magic, while Quinn, Alba, and Tito practice different kinds of necromancy.

Each cousin chooses a recruited woodland animal as a companion. Its special ability is free once per turn. Drag targeted cards and companion moves onto the rival you want to hit. Tap untargeted moves to play them. With a keyboard, press Enter on a targeted move, then use Tab and Enter to choose a rival. Each animal’s attacks use its own type and benefit from the cousin’s attack bonuses. In solo play, effects that help an ally help your own character. The companion has no separate health bar. Animal characters remain available on their own.

- **Hudson · Poison Witch · 45 HP.** Venom Ward shields the team and applies 3 Poison to a rival. Poison takes HP before the rival acts and then drops by 1.
- **Quinn · Bone Witch · 34 HP.** Bone Hex conjures a skeletal ward that makes a rival Vulnerable and Frail.
- **Alba · Spirit-Song Witch · 32 HP.** Spirit Chorus calls a spirit to strike for every energy spent. Extra spirits move to the next rival.
- **Tito · Star-Spirit Witch · 24 HP.** The youngest cousin starts with the lowest health. His Secret Star summons a ghost that deals 22 base damage through Block for 3 energy. It has a 1-in-3 chance to appear in his opening hand. Otherwise, Tito draws it in round two. He can cast it once per fight.

Ember the fox and Pip the hare are available from the start, too. Recruit Bramble the badger and Latch the raccoon at your first win. The collection shows requirements for all 30 species, and your browser remembers your recruits across runs. Each animal has a signature card, a role, and its own starting health. Level-up perks include attack damage, health, starting Block, extra cards, starting energy, and healing.

Everyone starts with 15 cards. Twelve are shared, including Claw Strike, Hold Fast, and Stand Together. Three slots are specific to the character, including two copies of most signatures or one Secret Star and two specialty cards for Tito. Each character draws five cards per round, with extra draws from Keen Senses. The library has twenty unlocked cards and nine earned from rival encounters. An energy card joins the draft options after every fourth level.

Solo trail goals track your personal best, the Act I boss, three trial wins in a single run, and a full clear. Progress stays in your browser. A solo animal can aim its own special move once per round for free. After a solo run, **Run again with this team** returns you to setup with the familiar and companion preselected. The next run uses a fresh seed.

Rallying Howl adds Strength, which boosts every attack for the rest of the fight. Expose applies Vulnerable, which makes the next hit deal 50% more damage. Brittle Hex applies Frail, which reduces the target’s next Block gain by 3. Ironhide and Cindermaw can apply Frail to your familiars.

Every animal has one type. Ember beats Grove, Grove beats Tide, Tide beats Stone, and Stone beats Ember. Attacks deal 50% more damage against the type they beat and 25% less against the type that beats them. Other matchups deal normal damage. The multiplier applies before Vulnerable and Block, and enemy attacks use the same rules.

Fixed costs range from 0 to 3 energy. Quick Jab and Quick Brace cost 0 and give you 2 damage or 2 Block. Briar Lunge costs 2 for 13 damage, while Root Barricade costs 2 for 11 Block for you and 10 for your partner. Crownfall spends 3 for 24 damage and 5 Block for your partner. X-cost cards spend all remaining energy and repeat once per energy spent. Wild Flurry deals four base damage per hit and moves to another rival if its target falls. Thorn Circle grants both familiars Block per energy spent.

The campaign has three acts of 20 levels each. Defeat the Ash Regent in **The Hollow Trail**, the Mire Matron in **The Drowned Canopy**, and the Thorn Sovereign in **The Thorn Court**. The target is 90–120 minutes for a full clear. After each of the first two bosses, the pack recovers to full health and carries its decks, upgrades, perks, and gold into the next act.

Each level offers at least two fights. Hard fights appear at levels 3, 6, 10, 14, 18, and 20 of each act. Standard routes pay 8 gold per rival for the first seven levels and 4 afterward. Hard routes pay three times as much. The map shows each enemy’s health and the total gold available. After every fight through level 19 of the last act, each player levels up, gains health capacity, picks a perk, and can take or skip a card. During combat, read intents, cover your partner, and follow up on your partner’s latest target for a Bond Strike.

Trials open at levels 5, 9, 13, and 17 of every act. At the **Briar Infirmary**, a healer restores its partner’s HP and halves incoming attack damage to it. Poison bypasses that ward. At the **Floodgate**, the lightly shielded rival surges after the pack’s second attack or at the end of round one, whichever comes first. Each damaging card or companion strike counts once, even if it hits several times. If any familiar fully blocks their hit, both rivals lose Block and become Vulnerable. The bracing rival skips its guard action. If both attacks target the surging rival and nobody fully blocks the surge, the recoil deals 35% of each rival’s max HP through Block. Defeating the surging rival within two attacks cancels the surge outright. At the **War Grove**, rivals build Strength over the fight. The map shows the featured draft card for each trial. Each player can take it, take another offered card, or skip the draft.

Win the level 3 Hard fight in the first act to choose an extra run-long perk per familiar. Briar Ambush adds 5 base damage to your first attack hit each fight. Trail Ward starts every fight with 8 extra Block. In co-op, Bond Ward grants both familiars 5 Block per player who chose it on the first Bond Strike each fight.

The Ash Regent uses Eclipse to damage the team and apply Vulnerable, Shadow Ward to gain Block and heal, and Crown Curse to attack one familiar and apply Frail and Vulnerable. Watch the intent shown above each turn.

Optional merchants at levels 4, 8, 12, 16, and 19 of each act sell cards from different inventories and remove unwanted cards for 30 gold each. Card prices rise deeper into the campaign. Gold is shared and each purchase goes into one player’s deck for the current run. Visit each merchant once, then return to choose a fight on that level. In room play, Player 1 chooses routes and each player manages their own deck.

Each player can carry **three potions**. A defeated rival has a 10% chance to drop one for the active player if their pouch has room. Merchants sell Moss Remedy, Barkskin Brew, and Briar Tonic. Open **Potions** during your turn to use one without spending energy. Potions and the pouch carry through saves and acts.

Optional camps appear at levels 3, 7, 11, 15, and 19 of each act. Each familiar can recover 30% of its maximum health, rounded up, upgrade one card, or remove one card for 30 gold for this run. Each card can be upgraded once. Decks must keep at least five cards and one attack. A camp can be visited once, and each player chooses separately in co-op.

Room state lives in one server process and expires after six hours of inactivity. Where room recovery is enabled, Player 1 can save a **Private room recovery code** from the menu after the latest move. If the server restarts, Player 1 can use **Restore with a private recovery code** from the reconnect screen. Player 2 can keep the original tab open and choose **Retry connection** after the host restores. Keep the recovery code private. Collection progress stays in its original browser.

Use **Save game** during a run and **Continue saved game** on the opening screen to resume on the same browser. One manual save is kept, and saving again replaces it. A saved room game resumes as shared-screen play, with both players controlled on that browser.

## Tests

Run `node --test` from the repository root. The tests drive game actions directly in Node.

## Roadmap

See the [Crittercards roadmap](ROADMAP.md) for workstream ownership, milestones, issue acceptance criteria, and the local verification queue.

## Artwork

The trail banner and the 34 portraits are bundled in [assets/](assets/). They were made with built-in ImageGen and exported as WebP. The banner brief called for a moon gate, an ember fox, and a moon hare in a dark spruce forest. The portrait brief used four-by-two contact sheets of identifiable species with gouache texture, woodcut lines, and subtle ember, moonlight, or shadow effects.

### Card combination check

Run `node scripts/check-card-combos.mjs` to exercise ordered card pairs and chains of two energy cards followed by an attack. The check uses neutral targets, armor, low health, and finishing blows. It highlights bonus damage, net energy, and energy gain without exhausting a card so strong interactions can be reviewed in actual runs.
