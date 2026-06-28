# 2048

A faithful clone of [2048](https://play2048.co), the sliding-tile puzzle by
Gabriele Cirulli. Built with vanilla JavaScript and [Vite](https://vitejs.dev) —
no game frameworks.

## Play

```bash
npm install
npm run dev
```

Then open the printed URL (defaults to http://localhost:4178).

- **Arrow keys** / **WASD** / **HJKL** — slide the tiles
- **Swipe** — on touch devices
- **R** or **New Game** — start over

Tiles with the same number merge when they touch. Combine them to reach the
**2048** tile. Your best score and the in-progress board are saved in
`localStorage`, so you can pick up where you left off.

## How it works

The code separates pure logic from presentation:

| File | Responsibility |
| --- | --- |
| [`src/game.js`](src/game.js) | `Tile`, `Grid`, `Game` — board state, move/merge rules, win/over detection. No DOM. |
| [`src/ui.js`](src/ui.js) | Renders a state snapshot to DOM and animates slides/merges. |
| [`src/input.js`](src/input.js) | Maps keyboard + touch gestures to `move`/`restart` events. |
| [`src/main.js`](src/main.js) | Wires it together and persists score + game state. |
| [`src/style.css`](src/style.css) | The look — original color palette, layout, and animations. |

### The animation trick

Each tile is a positioned wrapper (`.tile`) whose `transform` slides via a CSS
transition, plus an inner element (`.tile-inner`) that handles the scale "pop".
Tiles render at their *previous* position first, then move to the new one on the
next animation frame, so the browser tweens the slide. Merges render the two
source tiles sliding together underneath a freshly popped merged tile. Keeping
the pop on the inner element means it never fights the wrapper's positioning.

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # serve the production build
```

## Credit

Game concept and original design by
[Gabriele Cirulli](https://github.com/gabrielecirulli/2048) (MIT). This is an
independent reimplementation for learning.
