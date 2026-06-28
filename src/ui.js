/* ============================================================
   2048 — renderer. Turns a game-state snapshot into DOM.

   Animation trick (from the original): each tile is a positioned
   wrapper (.tile) whose transform slides via a CSS transition, plus an
   inner element (.tile-inner) that handles the scale "pop". Keeping the
   pop on the child means it never fights the wrapper's position.
   ============================================================ */

export class Renderer {
  constructor(refs) {
    this.tileLayer = refs.tileLayer;
    this.scoreEl = refs.scoreEl;
    this.bestEl = refs.bestEl;
    this.overlay = refs.overlay;
    this.overlayMsg = refs.overlayMsg;
    this.keepGoingBtn = refs.keepGoingBtn;
    this.displayedScore = 0;
    this.initialized = false;
  }

  render(state) {
    this.clearTiles();
    // Snapshot order is column-major and stable; merge sources are appended
    // before their merged tile inside addTile, so stacking is already correct.
    state.tiles.forEach((tile) => this.addTile(tile));

    this.updateScore(state.score);
    this.updateOverlay(state);
  }

  clearTiles() {
    const layer = this.tileLayer;
    while (layer.firstChild) layer.removeChild(layer.firstChild);
  }

  addTile(tile) {
    const wrapper = document.createElement('div');
    const inner = document.createElement('div');

    const classes = ['tile', `tile-${tile.value}`];
    if (tile.value > 2048) classes.push('tile-super');
    wrapper.className = classes.join(' ');

    inner.className = 'tile-inner';
    inner.textContent = tile.value;

    // Render at the previous position first, then transition to the new one.
    const from = tile.previousPosition || { x: tile.x, y: tile.y };
    this.setPosition(wrapper, from);

    if (tile.previousPosition) {
      // Next frame: move to the current position (CSS transitions the slide).
      requestAnimationFrame(() => {
        this.setPosition(wrapper, { x: tile.x, y: tile.y });
      });
    } else if (tile.mergedFrom) {
      wrapper.classList.add('tile-merged');
      // Render the two source tiles sliding into this cell underneath.
      tile.mergedFrom.forEach((source) => this.addTile(source));
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

  updateScore(score) {
    // First render (fresh game or resumed state): set the number without
    // animating a "+N", which would otherwise pop in on page load.
    if (!this.initialized) {
      this.initialized = true;
      this.displayedScore = score;
      this.scoreEl.textContent = score;
      return;
    }

    const diff = score - this.displayedScore;
    this.displayedScore = score;
    this.scoreEl.textContent = score;

    if (diff > 0) {
      const addition = document.createElement('div');
      addition.className = 'score-addition';
      addition.textContent = `+${diff}`;
      addition.addEventListener('animationend', () => addition.remove());
      this.scoreEl.parentNode.appendChild(addition);
    }
  }

  setBest(best) {
    this.bestEl.textContent = best;
  }

  updateOverlay(state) {
    if (!state.terminated) {
      this.overlay.hidden = true;
      this.overlay.className = 'overlay';
      return;
    }

    const won = state.won && !state.over;
    this.overlay.hidden = false;
    this.overlay.className = `overlay ${won ? 'overlay-won' : 'overlay-over'}`;
    this.overlayMsg.textContent = won ? 'You win!' : 'Game over!';
    this.keepGoingBtn.hidden = !won;
  }
}
