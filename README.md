# Merge Diner

A cozy food-merge puzzle game built from a 2048 engine. Slide to merge
ingredients up a tasty chain, serve impatient customers, earn coins, and spend
them on a shop full of cosmetic tile skins. Vanilla JavaScript +
[Vite](https://vitejs.dev), no game frameworks.

## Play

```bash
npm install
npm run dev          # → http://localhost:4178
node test/game.test.mjs   # run the logic tests
```

- **Slide** — arrow keys / WASD / swipe — merges identical foods into the next
  tier.
- **Tap / click a glowing tile** — serves it to a customer who ordered it,
  clearing the tile and paying out coins.
- **R** or **New Game** — restart.

### The food chain

Merge two of the same to climb it:

🍞 Bread → 🧀 Cheesy Bread → 🥓 Ham Bread → 🥪 Sandwich → 🥐 Croissant →
🍗 Fried Chicken → 🍔 Burger → 🍝 Pasta → 🍕 Pizza → 🥩 Steak → 🥘 Mac & Cheese →
👑🍔 **Big Mac** (the best one)

### How to win (and lose)

Customers queue in the **order bar**, each wanting a specific food with a
**patience meter** that drains a little on every move. Make what they want and
tap it to serve. As you serve more, the **level** rises: orders demand fancier
dishes and patience gets shorter. You lose if **three customers walk out** or the
board **jams up** with no moves left.

### Coins & the skin shop

Serving pays coins (fancier food = more coins). Coins persist between games.
Spend them in the 🛍️ **Shop** on cosmetic skins that restyle *all* your food and
the whole board — wood, chalkboard, chrome, marble, neon, gold, and more. Owned
skins and your wallet are saved in `localStorage`.

## How it works

| File | Responsibility |
| --- | --- |
| [`src/game.js`](src/game.js) | `Tile` / `Grid` / `Game` — board, merges, orders, serving, coins, lose conditions. No DOM. |
| [`src/foods.js`](src/foods.js) | The food chain (emoji, colors, coin values). |
| [`src/ui.js`](src/ui.js) | Renders the board, order bar, HUD, serve effects, and overlays. |
| [`src/input.js`](src/input.js) | Keyboard + swipe to move; click/tap to serve. |
| [`src/shop.js`](src/shop.js) | Injects skin CSS, renders the shop, handles buy/equip. |
| [`src/skins.js`](src/skins.js) | Auto-generated cosmetic skin catalog (CSS scoped per skin). |
| [`src/main.js`](src/main.js) | Wires everything and persists wallet / unlocks / best / game state. |
| [`src/style.css`](src/style.css) | The base diner look and all animations. |
| [`test/game.test.mjs`](test/game.test.mjs) | Framework-free logic tests. |

### Skins

Each skin's CSS is scoped under `[data-skin="<id>"]`. All skins are injected
once into a `<style>` tag; switching the active skin just sets that attribute on
`<body>`. The shop renders a live mini-tile preview per skin by setting the same
attribute on a small wrapper.

The animation trick from 2048 is preserved: a tile is a positioned wrapper
(`.tile`) that slides via a CSS `transform` transition, with the scale "pop" on
the inner element (`.tile-inner`) so the two never fight.

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # serve the production build
```

## Credit

Merge mechanic derived from [2048](https://play2048.co) by Gabriele Cirulli
(MIT). Food, customers, economy, and shop are original.
