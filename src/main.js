/* ============================================================
   Merge Diner — entry point. Wires logic, renderer, input, and shop,
   and persists wallet / unlocks / best score / in-progress game.
   ============================================================ */

import './style.css';
import { Game } from './game.js';
import { InputManager } from './input.js';
import { Renderer } from './ui.js';
import { Shop } from './shop.js';

const KEYS = {
  best: 'diner-best',
  coins: 'diner-coins',
  owned: 'diner-owned',
  equipped: 'diner-equipped',
  state: 'diner-state',
};

const store = {
  num(key) {
    return Number(localStorage.getItem(key)) || 0;
  },
  setNum(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* private mode — non-fatal */
    }
  },
  json(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  setJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

const byId = (id) => document.getElementById(id);

// ---- wallet + unlocks (persistent meta-progression) -------------

// Welcome bonus on the very first visit, so the shop is fun to explore early.
const firstVisit = localStorage.getItem(KEYS.coins) === null;
let coins = firstVisit ? 150 : store.num(KEYS.coins);
if (firstVisit) store.setNum(KEYS.coins, coins);
let best = store.num(KEYS.best);
let owned = new Set(store.json(KEYS.owned, ['classic']));
let equipped = localStorage.getItem(KEYS.equipped) || 'classic';

function setCoins(value) {
  coins = Math.max(0, Math.round(value));
  store.setNum(KEYS.coins, coins);
  renderer.setCoins(coins);
  shop.refreshCoins();
}

// ---- renderer ---------------------------------------------------

const renderer = new Renderer({
  tileLayer: byId('tile-layer'),
  effectLayer: byId('effect-layer'),
  ordersEl: byId('orders'),
  scoreEl: byId('score'),
  bestEl: byId('best'),
  levelEl: byId('level'),
  heartsEl: byId('hearts'),
  coinsEl: byId('coins'),
  overlay: byId('overlay'),
  overlayTitle: byId('overlay-title'),
  overlayStats: byId('overlay-stats'),
});

// ---- shop -------------------------------------------------------

const shop = new Shop(
  {
    modal: byId('shop-modal'),
    grid: byId('shop-grid'),
    closeBtn: byId('shop-close'),
    openBtn: byId('shop-btn'),
    coinsEl: byId('shop-coins'),
  },
  {
    getCoins: () => coins,
    spendCoins: (amount) => {
      if (coins < amount) return false;
      setCoins(coins - amount);
      return true;
    },
    getOwned: () => [...owned],
    addOwned: (id) => {
      owned.add(id);
      store.setJson(KEYS.owned, [...owned]);
    },
    getEquipped: () => equipped,
    setEquipped: (id) => {
      equipped = id;
      try {
        localStorage.setItem(KEYS.equipped, id);
      } catch {
        /* ignore */
      }
    },
  },
);

// ---- game -------------------------------------------------------

const game = new Game(5);

game.onUpdate = (state) => {
  renderer.render(state);
  if (state.score > best) {
    best = state.score;
    store.setNum(KEYS.best, best);
  }
  renderer.setBest(best);
  if (state.over) store.remove(KEYS.state);
  else store.setJson(KEYS.state, game.serialize());
};

game.onServe = (info) => {
  setCoins(coins + info.coins);
  renderer.playServe(info);
};

game.onBigMac = () => {
  document.body.classList.remove('bigmac-flash');
  void document.body.offsetWidth;
  document.body.classList.add('bigmac-flash');
};

// ---- input ------------------------------------------------------

const input = new InputManager(byId('board'));
input.on('move', (direction) => game.move(direction));
input.on('serve', ({ x, y }) => {
  const result = game.serve(x, y);
  if (!result.served && result.reason === 'no-order') renderer.wiggle(x, y);
});
input.on('restart', restart);

function restart() {
  store.remove(KEYS.state);
  game.setup();
}

byId('new-game').addEventListener('click', restart);
byId('retry').addEventListener('click', restart);

// ---- boot -------------------------------------------------------

const gridBg = byId('grid-bg');
gridBg.style.setProperty('--size', game.size);
for (let i = 0; i < game.size * game.size; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  gridBg.appendChild(cell);
}

renderer.setCoins(coins);
renderer.setBest(best);
game.setup(store.json(KEYS.state, null));

// Console debug handle.
window.mergeDiner = { game, shop, addCoins: (n) => setCoins(coins + n) };
