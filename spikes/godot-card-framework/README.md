# Crittercards Godot spike

A playable Moonlit Clearing fight with Hudson, Bramble, four existing card designs, and a take-or-skip reward. Tap or click a card to play it. On desktop, an attack card can also be dragged onto Bramble. End Turn resolves Bramble’s displayed intent and deals the next hand.

The prototype uses Godot 4.6.1 and [Card Framework](https://github.com/chun92/card-framework) at revision `a74b713863adb27a22965a8e6ed039d0c4016791`. The upstream license travels with the downloaded add-on. Existing Crittercards artwork is copied by setup.

## Run it

From this directory, with Godot 4.6.1 installed and available as `godot`:

```sh
./setup.sh
godot --headless --path . --import
godot --path .
```

To run the battle smoke test:

```sh
godot --headless --path . --script smoke.gd
```

To build for the browser, install the matching export templates in Godot and run:

```sh
mkdir -p web
godot --headless --path . --export-release Web web/index.html
uv run python3 -m http.server --bind 127.0.0.1 --directory web 8767
```

Open [the local Web build](http://127.0.0.1:8767/). The export uses the Compatibility renderer and the single-threaded Web template.

## Findings

- Card Framework handled hand layout, piles, and tweened card transfers in a real Web export. The spike uses standard Godot button input and a drop target that checks Crittercards’ energy rules before committing a move. Framework hand layout needed a setting changed when its drop sensors were disabled.
- Desktop Chrome accepted both a card click and a drag onto Bramble. Emulated phone Chrome accepted a tap. A headless Godot run verified the fight, card movement, reward, and restarting. Physical-device performance, browser accessibility, and co-op were outside the spike.
- The Web export produced a 37.7 MB Wasm file (9.4 MB gzipped), a 2.6 MB game pack, and 0.3 MB of JavaScript, before minor shell assets. Those are file sizes, with download and launch times on a real phone still to measure.
- The prototype runs simplified GDScript combat for one fight. The complete JavaScript rules, 60-level campaign, collections and saves, and live co-op remain in the web game.

## Migration boundary

If the goal is better presentation, try Godot as a second client first. Keep the Node engine and authoritative room state, map existing snapshots to the HUD and card zones, and send the existing action shapes back to the server. That brings across card balance, fights, Mystery routes and mutations together. Same-browser solo play would need a bridge to the existing JavaScript engine or a change to server-backed solo. Native standalone solo would need its own rules core or port.

Use the recorded solo and co-op runs as parity checks before moving more content. The next useful test is one fight driven by the actual Node rules, with co-op reconnect, Shiny collection carryover, and launch time and touch checked on a physical phone. A public Web preview would also need normal Wasm MIME handling and compression.
