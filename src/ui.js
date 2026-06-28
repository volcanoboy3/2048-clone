/* ============================================================
   Merge Diner — renderer. Turns a game snapshot into DOM.

   Tiles keep the original 2048 animation trick: a positioned wrapper
   (.tile) slides via a CSS transform transition, while the inner element
   (.tile-inner) does the scale "pop", so the two never fight.
   ============================================================ */

import { foodForTier } from './foods.js';

export class Renderer {
  constructor(refs) {
    this.tileLayer = refs.tileLayer;
    this.effectLayer = refs.effectLayer || refs.tileLayer;
    this.ordersEl = refs.ordersEl;
    this.scoreEl = refs.scoreEl;
    this.bestEl = refs.bestEl;
    this.levelEl = refs.levelEl;
    this.heartsEl = refs.heartsEl;
    this.coinsEl = refs.coinsEl;
    this.overlay = refs.overlay;
    this.overlayTitle = refs.overlayTitle;
    this.overlayStats = refs.overlayStats;
    this.maxStrikes = 3;
  }

  render(state) {
    this.maxStrikes = state.maxStrikes;
    const open = new Set(state.openTiers);

    this.clearTiles();
    state.tiles.forEach((tile) => this.addTile(tile, open));

    this.renderOrders(state.orders);
    this.scoreEl.textContent = state.score;
    this.levelEl.textContent = state.level;
    this.renderHearts(state.strikes, state.maxStrikes);
    this.updateOverlay(state);
  }

  clearTiles() {
    const layer = this.tileLayer;
    while (layer.firstChild) layer.removeChild(layer.firstChild);
  }

  addTile(tile, openTiers) {
    const food = foodForTier(tile.value);
    const wrapper = document.createElement('div');
    wrapper.className = 'tile';
    wrapper.dataset.tier = tile.value;
    wrapper.dataset.x = tile.x;
    wrapper.dataset.y = tile.y;
    wrapper.style.setProperty('--tier-bg', food.bg);
    wrapper.style.setProperty('--tier-fg', food.fg);
    if (food.best) wrapper.classList.add('is-best');
    if (openTiers.has(tile.value)) wrapper.classList.add('serveable');

    const inner = document.createElement('div');
    inner.className = 'tile-inner';

    const emoji = document.createElement('span');
    emoji.className = 'food-emoji';
    emoji.textContent = food.emoji;
    inner.appendChild(emoji);

    const label = document.createElement('span');
    label.className = 'food-label';
    label.textContent = food.name;
    inner.appendChild(label);

    if (food.crown) {
      const crown = document.createElement('span');
      crown.className = 'crown';
      crown.textContent = '👑';
      inner.appendChild(crown);
    }

    const from = tile.previousPosition || { x: tile.x, y: tile.y };
    this.setPosition(wrapper, from);

    if (tile.previousPosition) {
      requestAnimationFrame(() => this.setPosition(wrapper, { x: tile.x, y: tile.y }));
    } else if (tile.mergedFrom) {
      wrapper.classList.add('tile-merged');
      tile.mergedFrom.forEach((source) => this.addTile(source, openTiers));
    } else {
      wrapper.classList.add('tile-new');
    }

    wrapper.appendChild(inner);
    this.tileLayer.appendChild(wrapper);
  }

  setPosition(el, position) {
    el.style.setProperty('--col', position.x);
    el.style.setProperty('--row', position.y);
  }

  renderOrders(orders) {
    const el = this.ordersEl;
    while (el.firstChild) el.removeChild(el.firstChild);

    orders.forEach((order) => {
      const food = foodForTier(order.tier);
      const card = document.createElement('div');
      card.className = 'order';
      card.dataset.orderid = order.id;
      card.style.setProperty('--tier-bg', food.bg);

      const ratio = Math.max(0, Math.min(1, order.patience / order.maxPatience));
      if (ratio <= 0.34) card.classList.add('urgent');

      const bubble = document.createElement('div');
      bubble.className = 'order-bubble';
      bubble.textContent = food.emoji;
      card.appendChild(bubble);

      const name = document.createElement('div');
      name.className = 'order-name';
      name.textContent = food.name;
      card.appendChild(name);

      const meter = document.createElement('div');
      meter.className = 'patience';
      const bar = document.createElement('div');
      bar.className = 'patience-bar';
      bar.style.width = `${ratio * 100}%`;
      bar.style.background = patienceColor(ratio);
      meter.appendChild(bar);
      card.appendChild(meter);

      el.appendChild(card);
    });
  }

  renderHearts(strikes, maxStrikes) {
    const el = this.heartsEl;
    while (el.firstChild) el.removeChild(el.firstChild);
    const remaining = maxStrikes - strikes;
    for (let i = 0; i < maxStrikes; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart' + (i < remaining ? '' : ' lost');
      heart.textContent = i < remaining ? '❤️' : '🤍';
      el.appendChild(heart);
    }
  }

  setCoins(coins) {
    this.coinsEl.textContent = coins;
  }

  setBest(best) {
    this.bestEl.textContent = best;
  }

  // A coin burst that floats up from the served (or sold) tile.
  playServe(info, kind = 'serve') {
    const float = document.createElement('div');
    float.className = 'serve-float';
    this.setPosition(float, { x: info.x, y: info.y });
    const inner = document.createElement('span');
    inner.className = 'serve-float-inner' + (kind === 'sell' ? ' is-sell' : '');
    inner.textContent = `+${info.coins} 🪙`;
    inner.addEventListener('animationend', () => float.remove());
    float.appendChild(inner);
    this.effectLayer.appendChild(float);

    if (this.coinsEl) {
      this.coinsEl.classList.remove('bump');
      // reflow so the animation restarts each serve
      void this.coinsEl.offsetWidth;
      this.coinsEl.classList.add('bump');
    }
  }

  // Quick shake when a tapped tile isn't wanted by anyone.
  wiggle(x, y) {
    const tileEl = this.tileLayer.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
    if (!tileEl) return;
    tileEl.classList.remove('wiggle');
    void tileEl.offsetWidth;
    tileEl.classList.add('wiggle');
  }

  updateOverlay(state) {
    if (!state.over) {
      this.overlay.hidden = true;
      return;
    }
    this.overlay.hidden = false;
    this.overlayTitle.textContent =
      state.strikes >= state.maxStrikes ? 'Too many walkouts!' : 'Kitchen jammed!';
    const orderWord = state.served === 1 ? 'order' : 'orders';
    this.overlayStats.textContent = `You served ${state.served} ${orderWord} and scored ${state.score} — reached level ${state.level}.`;
  }
}

function patienceColor(ratio) {
  if (ratio > 0.6) return '#5fb86a';
  if (ratio > 0.34) return '#e7b53c';
  return '#e0524a';
}
