/* ============================================================
   Merge Diner — entry point. Wires logic, renderer, input, and shop,
   and persists wallet / unlocks / wardrobe / redeemed codes / best /
   in-progress game.
   ============================================================ */

import './style.css';
import { Game } from './game.js';
import { InputManager } from './input.js';
import { Renderer } from './ui.js';
import { Shop } from './shop.js';
import { foodForTier, buyPrice } from './foods.js';
import { buildAvatar, defaultOwnedClothing } from './character.js';
import { findCode } from './codes.js';

const KEYS = {
  best: 'diner-best',
  coins: 'diner-coins',
  owned: 'diner-owned', // skin ids
  equipped: 'diner-equipped', // skin id
  clothingOwned: 'diner-clothing-owned',
  clothingEquipped: 'diner-clothing-equipped',
  codes: 'diner-codes',
  cheat: 'diner-cheat',
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

const firstVisit = localStorage.getItem(KEYS.coins) === null;
let coins = firstVisit ? 150 : store.num(KEYS.coins);
if (firstVisit) store.setNum(KEYS.coins, coins);
let best = store.num(KEYS.best);

// Tile skins
let owned = new Set(store.json(KEYS.owned, ['classic']));
let equipped = localStorage.getItem(KEYS.equipped) || 'classic';

// Chef wardrobe
let clothingOwned = new Set(store.json(KEYS.clothingOwned, defaultOwnedClothing()));
defaultOwnedClothing().forEach((id) => clothingOwned.add(id)); // free items always owned
let clothingEquipped = store.json(KEYS.clothingEquipped, {}) || {};

// Redeemed codes
const redeemed = new Set(store.json(KEYS.codes, []));

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

// ---- chef avatar (topbar) ---------------------------------------

const avatarMount = byId('avatar-mount');
function renderAvatar() {
  avatarMount.innerHTML = buildAvatar(clothingEquipped);
}

// ---- game (declared early so shop hooks can reach it) -----------

const game = new Game(5);

// ---- shop -------------------------------------------------------

const shop = new Shop(
  {
    modal: byId('shop-modal'),
    body: byId('shop-body'),
    tabs: byId('shop-tabs'),
    title: byId('shop-title'),
    sub: byId('shop-sub'),
    msg: byId('shop-msg'),
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
    // tile skins
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
    // food market
    buyFood,
    // chef wardrobe
    getClothingOwned: () => [...clothingOwned],
    addClothingOwned: (id) => {
      clothingOwned.add(id);
      store.setJson(KEYS.clothingOwned, [...clothingOwned]);
    },
    getClothingEquipped: () => clothingEquipped,
    setClothingEquipped: (slot, id) => {
      clothingEquipped = { ...clothingEquipped, [slot]: id };
      store.setJson(KEYS.clothingEquipped, clothingEquipped);
    },
    onClothingChange: renderAvatar,
    // codes
    redeemCode,
  },
);

// ---- market + codes (need game + wallet) ------------------------

function buyFood(tier) {
  const food = foodForTier(tier);
  const price = buyPrice(tier);
  if (coins < price) {
    return { ok: false, reason: 'coins', message: `Need ${price} 🪙 for a ${food.name}.` };
  }
  if (game.over) return { ok: false, message: 'Game over — start a new game first.' };
  if (!game.grantFood(tier)) {
    return { ok: false, message: 'No room on the board — make some space first!' };
  }
  setCoins(coins - price);
  return { ok: true, message: `Served up a fresh ${food.name}! 🍽️` };
}

function redeemCode(text) {
  const entry = findCode(text);
  if (!entry) return { ok: false, message: 'Unknown code — check the spelling and try again.' };
  if (redeemed.has(entry.code)) return { ok: false, message: `You already used ${entry.code}.` };

  const r = entry.reward;
  // Food rewards can fail if the board is full — don't consume the code then.
  if (r.food) {
    if (game.over) return { ok: false, message: 'Start a new game before redeeming a food code.' };
    if (!game.grantFood(r.food)) {
      return { ok: false, message: 'Make room on the board, then redeem this code again!' };
    }
  }
  if (r.coins) setCoins(coins + r.coins);
  if (r.clothing) {
    clothingOwned.add(r.clothing);
    store.setJson(KEYS.clothingOwned, [...clothingOwned]);
  }
  if (r.skin) {
    owned.add(r.skin);
    store.setJson(KEYS.owned, [...owned]);
  }
  redeemed.add(entry.code);
  store.setJson(KEYS.codes, [...redeemed]);
  return { ok: true, message: `🎉 ${entry.code} unlocked — ${r.note}!` };
}

// ---- game wiring ------------------------------------------------

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

game.onSell = (info) => {
  setCoins(coins + info.coins);
  renderer.playServe(info, 'sell');
};

game.onBigMac = () => {
  document.body.classList.remove('bigmac-flash');
  void document.body.offsetWidth;
  document.body.classList.add('bigmac-flash');
};

// ---- input + sell mode ------------------------------------------

const boardEl = byId('board');
const sellBtn = byId('sell-btn');
const sellHint = byId('sell-hint');
let sellMode = false;

function setSellMode(on) {
  sellMode = on;
  sellBtn.classList.toggle('active', on);
  boardEl.classList.toggle('sell-mode', on);
  sellHint.hidden = !on;
}
sellBtn.addEventListener('click', () => setSellMode(!sellMode));

const input = new InputManager(boardEl);
input.on('move', (direction) => game.move(direction));
input.on('serve', ({ x, y }) => {
  if (sellMode) {
    game.sellTile(x, y);
    return;
  }
  const result = game.serve(x, y);
  if (!result.served && result.reason === 'no-order') renderer.wiggle(x, y);
});
input.on('restart', restart);

function restart() {
  store.remove(KEYS.state);
  setSellMode(false);
  game.setup();
}

byId('new-game').addEventListener('click', restart);
byId('retry').addEventListener('click', restart);
byId('avatar-btn').addEventListener('click', () => shop.open('chef'));

// ---- secret coin button (password-gated) ------------------------
// The tagline under the title is a hidden button. First tap asks for a
// password; once unlocked, every tap pays out coins. Unlock persists.
const CHEAT_PASSWORD = 'timmy486'; // compared case-insensitively
const CHEAT_PAYOUT = 1000;
let cheatUnlocked = store.num(KEYS.cheat) === 1;

const secretSpot = byId('tagline');
const secretModal = byId('secret-modal');
const secretForm = byId('secret-form');
const secretInput = byId('secret-input');
const secretMsg = byId('secret-msg');
const walletEl = document.querySelector('.wallet');

function coinPop(amount) {
  const pop = document.createElement('span');
  pop.className = 'coin-pop';
  pop.textContent = `+${amount}`;
  pop.addEventListener('animationend', () => pop.remove());
  walletEl.appendChild(pop);
}

function payCheat() {
  setCoins(coins + CHEAT_PAYOUT);
  coinPop(CHEAT_PAYOUT);
}

// Once unlocked the tagline is a genuine control, so make it keyboard- and
// screen-reader-operable. (Left inert while locked to keep it hidden.)
function markSecretInteractive() {
  secretSpot.setAttribute('role', 'button');
  secretSpot.setAttribute('tabindex', '0');
  secretSpot.setAttribute('aria-label', 'Collect bonus coins');
}
if (cheatUnlocked) markSecretInteractive();

secretSpot.addEventListener('click', () => {
  if (cheatUnlocked) {
    payCheat();
    return;
  }
  secretMsg.hidden = true;
  secretInput.value = '';
  secretModal.hidden = false;
  requestAnimationFrame(() => secretInput.focus());
});

// Keyboard activation (only reachable via Tab after unlock sets tabindex).
secretSpot.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' || e.code === 'Space') {
    e.preventDefault();
    secretSpot.click();
  }
});

secretForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (secretInput.value.trim().toLowerCase() === CHEAT_PASSWORD) {
    cheatUnlocked = true;
    store.setNum(KEYS.cheat, 1);
    markSecretInteractive();
    secretModal.hidden = true;
    payCheat();
  } else {
    secretMsg.textContent = 'Wrong password.';
    secretMsg.classList.add('bad');
    secretMsg.hidden = false;
    secretInput.classList.remove('shake');
    void secretInput.offsetWidth;
    secretInput.classList.add('shake');
    secretInput.select();
  }
});

byId('secret-close').addEventListener('click', () => {
  secretModal.hidden = true;
});
secretModal.addEventListener('click', (e) => {
  if (e.target === secretModal) secretModal.hidden = true;
});
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && !secretModal.hidden) secretModal.hidden = true;
});

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
renderAvatar();
game.setup(store.json(KEYS.state, null));

// Console debug handle.
window.mergeDiner = {
  game,
  shop,
  addCoins: (n) => setCoins(coins + n),
  grant: (tier) => game.grantFood(tier),
};
