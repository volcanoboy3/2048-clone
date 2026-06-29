/* ============================================================
   Merge Diner — the shop.

   A single modal with four tabs:
     • Tiles     — cosmetic food-tile skins (scoped [data-skin] CSS).
     • Market    — buy a ready-made food tile with coins.
     • Chef      — dress up your character (hats, tops, bottoms, shoes,
                   accessories); the avatar updates live.
     • Codes     — redeem secret codes for food / coins / cosmetics.

   Wallet, ownership and equip state live in localStorage via the hook
   callbacks supplied by main.js.
   ============================================================ */

import { SKINS } from './skins.js';
import { foodForTier, buyPrice } from './foods.js';
import { SLOTS, DEFAULT_EQUIP, CLOTHING_BY_ID, clothingForSlot, buildAvatar } from './character.js';

const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 };

// Foods you can buy ready-made: Ham Bread (3) up through the Big Mac (12).
const MARKET_TIERS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const TABS = [
  { key: 'tiles', label: '🍽️ Tiles', title: '🍽️ Tile Skins',
    sub: 'Spend coins to restyle all your food — fancier plates, cooler shapes, shinier everything.' },
  { key: 'market', label: '🍔 Market', title: '🍔 Food Market',
    sub: 'Buy a ready-made dish straight onto the board. The fancier the food, the pricier it is.' },
  { key: 'chef', label: '🧑‍🍳 Chef', title: '🧑‍🍳 Dress Your Chef',
    sub: 'Kit out your chef with hats, outfits, shoes and accessories. Tap an item to wear it.' },
  { key: 'codes', label: '🎁 Codes', title: '🎁 Redeem a Code',
    sub: 'Got a secret code? Type it in for free food, coins or rare cosmetics.' },
];

export class Shop {
  constructor(refs, hooks) {
    this.modal = refs.modal;
    this.body = refs.body;
    this.tabsEl = refs.tabs;
    this.titleEl = refs.title;
    this.subEl = refs.sub;
    this.msgEl = refs.msg;
    this.closeBtn = refs.closeBtn;
    this.openBtn = refs.openBtn;
    this.coinsEl = refs.coinsEl;

    this.hooks = hooks;
    this.tab = 'tiles';

    this.skins = [...SKINS].sort(
      (a, b) => (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0) || a.price - b.price,
    );

    this.injectStyles();
    this.applyEquipped();
    this.buildTabs();
    this.bind();
  }

  // ---- skins plumbing (unchanged behaviour) ----------------------

  injectStyles() {
    let style = document.getElementById('skin-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'skin-styles';
      document.head.appendChild(style);
    }
    style.textContent = SKINS.map((s) => `${s.css || ''}\n${s.boardCss || ''}`).join('\n');
  }

  applyEquipped() {
    document.body.dataset.skin = this.hooks.getEquipped() || 'classic';
  }

  // ---- shell -----------------------------------------------------

  buildTabs() {
    this.tabsEl.innerHTML = '';
    TABS.forEach((t) => {
      const btn = document.createElement('button');
      btn.className = 'shop-tab';
      btn.dataset.tab = t.key;
      btn.textContent = t.label;
      btn.addEventListener('click', () => this.setTab(t.key));
      this.tabsEl.appendChild(btn);
    });
  }

  bind() {
    this.openBtn.addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && !this.modal.hidden) this.close();
    });
  }

  open(tab) {
    if (tab) this.tab = tab;
    this.modal.hidden = false;
    this.setTab(this.tab);
  }

  close() {
    this.modal.hidden = true;
  }

  setTab(key) {
    this.tab = key;
    if (this.msgEl) this.msgEl.hidden = true; // clear any stale toast
    const meta = TABS.find((t) => t.key === key) || TABS[0];
    this.titleEl.textContent = meta.title;
    this.subEl.textContent = meta.sub;
    [...this.tabsEl.children].forEach((b) =>
      b.classList.toggle('active', b.dataset.tab === key),
    );
    this.render();
  }

  refreshCoins() {
    if (this.coinsEl) this.coinsEl.textContent = this.hooks.getCoins();
  }

  // A brief toast at the foot of the panel.
  showMsg(text, ok = true) {
    if (!this.msgEl) return;
    this.msgEl.textContent = text;
    this.msgEl.classList.toggle('bad', !ok);
    this.msgEl.hidden = false;
    this.msgEl.classList.remove('pop');
    void this.msgEl.offsetWidth;
    this.msgEl.classList.add('pop');
  }

  flashCantAfford() {
    if (!this.coinsEl) return;
    this.coinsEl.classList.remove('shake');
    void this.coinsEl.offsetWidth;
    this.coinsEl.classList.add('shake');
  }

  render() {
    this.refreshCoins();
    const body = this.body;
    while (body.firstChild) body.removeChild(body.firstChild);

    if (this.tab === 'tiles') this.renderTiles(body);
    else if (this.tab === 'market') this.renderMarket(body);
    else if (this.tab === 'chef') this.renderChef(body);
    else if (this.tab === 'codes') this.renderCodes(body);
  }

  // ---- tab: tile skins -------------------------------------------

  renderTiles(body) {
    const owned = new Set(this.hooks.getOwned());
    owned.add('classic');
    const equipped = this.hooks.getEquipped();

    const grid = document.createElement('div');
    grid.className = 'shop-grid';
    this.skins.forEach((skin) => grid.appendChild(this.skinCard(skin, owned, equipped)));
    body.appendChild(grid);
  }

  skinCard(skin, owned, equipped) {
    const isOwned = owned.has(skin.id);
    const isEquipped = skin.id === equipped;

    const card = el('div', `skin-card rarity-${skin.rarity}`);

    const preview = el('div', 'skin-preview');
    preview.dataset.skin = skin.id;
    const food = foodForTier(5);
    const tile = el('div', 'tile');
    tile.style.setProperty('--col', 0);
    tile.style.setProperty('--row', 0);
    tile.style.setProperty('--tier-bg', food.bg);
    tile.style.setProperty('--tier-fg', food.fg);
    const inner = el('div', 'tile-inner');
    inner.innerHTML = `<span class="food-emoji">${food.emoji}</span><span class="food-label">${food.name}</span>`;
    tile.appendChild(inner);
    preview.appendChild(tile);
    card.appendChild(preview);

    card.appendChild(el('div', 'skin-name', skin.name));
    card.appendChild(el('div', 'skin-desc', skin.description));
    card.appendChild(el('div', 'skin-rarity', skin.rarity));

    const btn = el('button', 'button shop-buy');
    if (isEquipped) {
      btn.textContent = 'Equipped';
      btn.disabled = true;
      btn.classList.add('equipped');
    } else if (isOwned) {
      btn.textContent = 'Equip';
      btn.addEventListener('click', () => this.equipSkin(skin.id));
    } else {
      btn.textContent = `🪙 ${skin.price}`;
      if (this.hooks.getCoins() < skin.price) btn.classList.add('cant-afford');
      btn.addEventListener('click', () => this.buySkin(skin));
    }
    card.appendChild(btn);
    return card;
  }

  buySkin(skin) {
    if (this.hooks.getCoins() < skin.price) {
      this.flashCantAfford();
      this.showMsg(`Need ${skin.price} 🪙 for ${skin.name}.`, false);
      return;
    }
    if (!this.hooks.spendCoins(skin.price)) return;
    this.hooks.addOwned(skin.id);
    this.equipSkin(skin.id);
    this.showMsg(`Unlocked ${skin.name}!`);
  }

  equipSkin(id) {
    this.hooks.setEquipped(id);
    this.applyEquipped();
    this.render();
  }

  // ---- tab: food market ------------------------------------------

  renderMarket(body) {
    const grid = document.createElement('div');
    grid.className = 'shop-grid market-grid';
    MARKET_TIERS.forEach((tier) => grid.appendChild(this.marketCard(tier)));
    body.appendChild(grid);
  }

  marketCard(tier) {
    const food = foodForTier(tier);
    const price = buyPrice(tier);
    const card = el('div', 'market-card');
    card.style.setProperty('--tier-bg', food.bg);

    const puck = el('div', 'market-emoji', food.emoji);
    card.appendChild(puck);
    card.appendChild(el('div', 'market-name', food.name));

    const btn = el('button', 'button shop-buy');
    btn.textContent = `🪙 ${price}`;
    if (this.hooks.getCoins() < price) btn.classList.add('cant-afford');
    btn.addEventListener('click', () => {
      const res = this.hooks.buyFood(tier);
      this.showMsg(res.message, res.ok);
      if (!res.ok && res.reason === 'coins') this.flashCantAfford();
      this.render();
    });
    card.appendChild(btn);
    return card;
  }

  // ---- tab: chef / wardrobe --------------------------------------

  renderChef(body) {
    const equipped = this.hooks.getClothingEquipped();
    const owned = new Set(this.hooks.getClothingOwned());

    const stage = el('div', 'chef-stage');
    const av = el('div', 'chef-avatar');
    av.innerHTML = buildAvatar(equipped);
    stage.appendChild(av);
    body.appendChild(stage);

    SLOTS.forEach((slot) => {
      body.appendChild(el('div', 'wardrobe-label', slot.label));
      const grid = el('div', 'shop-grid wardrobe-grid');
      clothingForSlot(slot.key).forEach((item) =>
        grid.appendChild(this.clothingCard(item, owned, equipped)),
      );
      body.appendChild(grid);
    });
  }

  clothingCard(item, owned, equipped) {
    const isOwned = item.price === 0 || owned.has(item.id);
    const isEquipped = (equipped[item.slot] || DEFAULT_EQUIP[item.slot]) === item.id;

    const card = el('div', `wardrobe-card rarity-${item.rarity}` + (isEquipped ? ' worn' : ''));
    card.appendChild(el('div', 'wardrobe-icon', item.icon));
    card.appendChild(el('div', 'wardrobe-name', item.name));

    const btn = el('button', 'button shop-buy');
    if (isEquipped) {
      btn.textContent = 'Worn';
      btn.disabled = true;
      btn.classList.add('equipped');
    } else if (isOwned) {
      btn.textContent = 'Wear';
      btn.addEventListener('click', () => this.wear(item));
    } else {
      btn.textContent = `🪙 ${item.price}`;
      if (this.hooks.getCoins() < item.price) btn.classList.add('cant-afford');
      btn.addEventListener('click', () => this.buyClothing(item));
    }
    card.appendChild(btn);
    return card;
  }

  buyClothing(item) {
    if (this.hooks.getCoins() < item.price) {
      this.flashCantAfford();
      this.showMsg(`Need ${item.price} 🪙 for ${item.name}.`, false);
      return;
    }
    if (!this.hooks.spendCoins(item.price)) return;
    this.hooks.addClothingOwned(item.id);
    this.wear(item);
    this.showMsg(`Unlocked ${item.name}!`);
  }

  wear(item) {
    this.hooks.setClothingEquipped(item.slot, item.id);
    this.hooks.onClothingChange();
    this.render();
  }

  // ---- tab: codes ------------------------------------------------

  renderCodes(body) {
    const wrap = el('div', 'codes-wrap');

    const form = el('form', 'codes-form');
    const input = el('input', 'codes-input');
    input.type = 'text';
    input.placeholder = 'Enter code…';
    input.autocomplete = 'off';
    input.autocapitalize = 'characters';
    input.spellcheck = false;
    const submit = el('button', 'button codes-submit', 'Redeem');
    submit.type = 'submit';
    form.appendChild(input);
    form.appendChild(submit);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const res = this.hooks.redeemCode(input.value);
      this.showMsg(res.message, res.ok);
      if (res.ok) input.value = '';
      this.refreshCoins();
    });
    wrap.appendChild(form);

    wrap.appendChild(
      el(
        'p',
        'codes-hint',
        'Codes are secret — handed out by the chef, hidden in updates, and shared by other players. Enter one above to redeem it.',
      ),
    );
    body.appendChild(wrap);
    requestAnimationFrame(() => input.focus());
  }
}

// tiny DOM helper
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
