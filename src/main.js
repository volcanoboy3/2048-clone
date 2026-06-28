/* ============================================================
   2048 — entry point. Wires game logic to the renderer and input,
   and persists the best score + in-progress game to localStorage.
   ============================================================ */

import './style.css';
import { Game } from './game.js';
import { InputManager } from './input.js';
import { Renderer } from './ui.js';

const BEST_KEY = 'game-2048-best';
const STATE_KEY = 'game-2048-state';

const storage = {
  getBest() {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  },
  setBest(value) {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch {
      /* storage unavailable (private mode) — best score just won't persist */
    }
  },
  getState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setState(state) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  },
  clearState() {
    try {
      localStorage.removeItem(STATE_KEY);
    } catch {
      /* ignore */
    }
  },
};

const byId = (id) => document.getElementById(id);

const board = byId('board');
const renderer = new Renderer({
  tileLayer: byId('tile-layer'),
  scoreEl: byId('score'),
  bestEl: byId('best'),
  overlay: byId('overlay'),
  overlayMsg: byId('overlay-msg'),
  keepGoingBtn: byId('keep-going'),
});

const game = new Game(4);
let best = storage.getBest();
renderer.setBest(best);

game.onUpdate = (state) => {
  renderer.render(state);

  if (state.score > best) {
    best = state.score;
    storage.setBest(best);
  }
  renderer.setBest(best);

  if (state.terminated) storage.clearState();
  else storage.setState(game.serialize());
};

function restart() {
  storage.clearState();
  game.setup();
}

const input = new InputManager(board);
input.on('move', (direction) => game.move(direction));
input.on('restart', restart);

byId('new-game').addEventListener('click', restart);
byId('retry').addEventListener('click', restart);
byId('keep-going').addEventListener('click', () => game.keepGoing());

// Resume an in-progress game if one was saved, otherwise start fresh.
game.setup(storage.getState());

// Debug handle: inspect or poke the game from the console (e.g. `game2048.move(0)`).
window.game2048 = game;
