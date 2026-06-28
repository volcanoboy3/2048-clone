/* ============================================================
   Merge Diner — the skin shop.

   Skins are cosmetic. Each skin's css/boardCss is scoped under
   [data-skin="<id>"]; we inject them all once, then switch the active
   skin by setting that attribute on <body>. Owned/equipped/coins live in
   localStorage via callbacks provided by main.
   ============================================================ */

import { SKINS } from './skins.js';
import { foodForTier } from './foods.js';

const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 };

export class Shop {
  constructor(refs, hooks) {
    this.modal = refs.modal;
    this.grid = refs.grid;
    this.closeBtn = refs.closeBtn;
    this.openBtn = refs.openBtn;
    this.coinsEl = refs.coinsEl; // coin counter inside the shop header

    this.getCoins = hooks.getCoins;
    this.spendCoins = hooks.spendCoins; // (amount) => boolean
    this.getOwned = hooks.getOwned; // () => string[]
    this.addOwned = hooks.addOwned; // (id) => void
    this.getEquipped = hooks.getEquipped; // () => string
    this.setEquipped = hooks.setEquipped; // (id) => void

    this.skins = [...SKINS].sort(
      (a, b) => (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0) || a.price - b.price,
    );

    this.injectStyles();
    this.applyEquipped();
    this.bind();
  }

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
    document.body.dataset.skin = this.getEquipped() || 'classic';
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

  open() {
    this.render();
    this.modal.hidden = false;
  }

  close() {
    this.modal.hidden = true;
  }

  refreshCoins() {
    if (this.coinsEl) this.coinsEl.textContent = this.getCoins();
  }

  render() {
    this.refreshCoins();
    const owned = new Set(this.getOwned());
    owned.add('classic');
    const equipped = this.getEquipped();

    const grid = this.grid;
    while (grid.firstChild) grid.removeChild(grid.firstChild);

    this.skins.forEach((skin) => {
      grid.appendChild(this.card(skin, owned, equipped));
    });
  }

  card(skin, owned, equipped) {
    const isOwned = owned.has(skin.id);
    const isEquipped = skin.id === equipped;

    const card = document.createElement('div');
    card.className = `skin-card rarity-${skin.rarity}`;

    // Live preview: a mini tile wearing this skin.
    const preview = document.createElement('div');
    preview.className = 'skin-preview';
    preview.dataset.skin = skin.id;
    const food = foodForTier(5); // croissant — a mid-tier, colorful sample
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.setProperty('--col', 0);
    tile.style.setProperty('--row', 0);
    tile.style.setProperty('--tier-bg', food.bg);
    tile.style.setProperty('--tier-fg', food.fg);
    const inner = document.createElement('div');
    inner.className = 'tile-inner';
    inner.innerHTML = `<span class="food-emoji">${food.emoji}</span><span class="food-label">${food.name}</span>`;
    tile.appendChild(inner);
    preview.appendChild(tile);
    card.appendChild(preview);

    const name = document.createElement('div');
    name.className = 'skin-name';
    name.textContent = skin.name;
    card.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'skin-desc';
    desc.textContent = skin.description;
    card.appendChild(desc);

    const rarity = document.createElement('div');
    rarity.className = 'skin-rarity';
    rarity.textContent = skin.rarity;
    card.appendChild(rarity);

    const btn = document.createElement('button');
    btn.className = 'button skin-btn';
    if (isEquipped) {
      btn.textContent = 'Equipped';
      btn.disabled = true;
      btn.classList.add('equipped');
    } else if (isOwned) {
      btn.textContent = 'Equip';
      btn.addEventListener('click', () => this.equip(skin.id));
    } else {
      btn.textContent = `🪙 ${skin.price}`;
      if (this.getCoins() < skin.price) btn.classList.add('cant-afford');
      btn.addEventListener('click', () => this.buy(skin));
    }
    card.appendChild(btn);

    return card;
  }

  buy(skin) {
    if (this.getCoins() < skin.price) {
      this.flashCantAfford();
      return;
    }
    if (!this.spendCoins(skin.price)) return;
    this.addOwned(skin.id);
    this.equip(skin.id);
    this.render();
  }

  equip(id) {
    this.setEquipped(id);
    this.applyEquipped();
    this.render();
  }

  flashCantAfford() {
    if (!this.coinsEl) return;
    this.coinsEl.classList.remove('shake');
    void this.coinsEl.offsetWidth;
    this.coinsEl.classList.add('shake');
  }
}
