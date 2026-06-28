/* ============================================================
   Merge Diner — input.
   Slide: arrow keys / WASD / swipe -> 'move' (direction 0-3).
   Serve: click a tile, or tap it on touch    -> 'serve' { x, y }.
   Restart: R.

   Gesture split on touch: a finger that travels past the threshold is a
   swipe (move); a near-stationary touch is a tap and falls through to the
   synthesized click, which the delegated click handler turns into a serve.
   ============================================================ */

const KEY_MAP = {
  ArrowUp: 0,
  ArrowRight: 1,
  ArrowDown: 2,
  ArrowLeft: 3,
  KeyW: 0,
  KeyD: 1,
  KeyS: 2,
  KeyA: 3,
};

const SWIPE_THRESHOLD = 24; // px before a drag counts as a swipe

export class InputManager {
  constructor(boardEl) {
    this.handlers = {};
    this.board = boardEl;
    this.suppressClick = false;
    this.bindKeyboard();
    this.bindServe(boardEl);
    this.bindTouch(boardEl);
  }

  on(event, callback) {
    (this.handlers[event] ||= []).push(callback);
  }

  emit(event, data) {
    (this.handlers[event] || []).forEach((cb) => cb(data));
  }

  bindKeyboard() {
    document.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const direction = KEY_MAP[event.code];
      if (direction !== undefined) {
        event.preventDefault();
        this.emit('move', direction);
      } else if (event.code === 'KeyR') {
        event.preventDefault();
        this.emit('restart');
      }
    });
  }

  bindServe(boardEl) {
    if (!boardEl) return;
    boardEl.addEventListener('click', (event) => {
      if (this.suppressClick) return;
      const tileEl = event.target.closest('.tile');
      if (!tileEl || !boardEl.contains(tileEl)) return;
      const x = Number(tileEl.dataset.x);
      const y = Number(tileEl.dataset.y);
      if (Number.isInteger(x) && Number.isInteger(y)) this.emit('serve', { x, y });
    });
  }

  bindTouch(boardEl) {
    if (!boardEl) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    boardEl.addEventListener(
      'touchstart',
      (event) => {
        if (event.touches.length !== 1) return;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        tracking = true;
      },
      { passive: true },
    );

    boardEl.addEventListener(
      'touchmove',
      (event) => {
        if (tracking) event.preventDefault(); // stop the page scrolling mid-swipe
      },
      { passive: false },
    );

    boardEl.addEventListener('touchend', (event) => {
      if (!tracking) return;
      tracking = false;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) < SWIPE_THRESHOLD) return; // a tap -> let click serve

      // A real swipe: emit a move and swallow the click the browser may fire.
      const direction = absX > absY ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
      this.emit('move', direction);
      this.suppressClick = true;
      setTimeout(() => {
        this.suppressClick = false;
      }, 400);
    });
  }
}
