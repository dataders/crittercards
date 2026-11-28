# Crittercards Godot preview

The second client is available at `/godot`. Godot renders live combat, including the player, rival targets and intents, and the hand, draw, and discard piles. The surrounding web controls handle rooms, routes, camps, merchants, and rewards.

The preview calls the existing JavaScript combat engine directly in solo and uses the existing room API in co-op. The Node server is authoritative for both clients in a room. The classic web client can play alongside the Godot client using the same room code. Godot solo autosaves are separate from classic solo saves. Mutation unlocks and equipped skins use the same browser collection in both clients.

Tap or click a card to play it. Cards that need a target can be aimed by selecting a rival. On desktop, an attack card can also be dragged onto a rival. Potions and the companion action appear during combat.

## Build

Install Godot 4.6.1 with matching Web export templates and WebP tools (`cwebp`). The setup script fetches the MIT-licensed [Card Framework](https://github.com/chun92/card-framework) at revision `a74b713863adb27a22965a8e6ed039d0c4016791` and prepares game art from the repository.

```sh
cd spikes/godot-card-framework
./setup.sh
./build-web.sh
cd ../..
node server.mjs
```

Open [the served preview](http://127.0.0.1:4173/godot). Use `GODOT_BIN` to point to an engine outside your path. `GODOT_WEB_TEMPLATE` may point to a local single-threaded release template zip. The build packages the output under `godot-preview/`, with a precompressed WebAssembly file served by Node.

A separate fixed-data native combat scene remains available as a framework smoke test:

```sh
godot --headless --path spikes/godot-card-framework --script smoke.gd
```

The preview has been exercised in desktop and emulated phone Chrome. Physical-device performance and a full Godot campaign remain to be tested.
