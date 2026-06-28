/* ============================================================
   2048 — input. Translates keyboard and touch gestures into
   high-level events: 'move' (with a direction 0-3), 'restart'.
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
  KeyK: 0, // vim
  KeyL: 1,
  KeyJ: 2,
  KeyH: 3,
};

const SWIPE_THRESHOLD = 20; // px before a drag counts as a swipe

export class InputManager {
  constructor(boardEl) {
    this.handlers = {};
    this.bindKeyboard();
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
      const modified =
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      const direction = KEY_MAP[event.code];

      if (!modified && direction !== undefined) {
        event.preventDefault();
        this.emit('move', direction);
      } else if (!modified && event.code === 'KeyR') {
        event.preventDefault();
        this.emit('restart');
      }
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
      { passive: true }
    );

    boardEl.addEventListener(
      'touchmove',
      (event) => {
        // Stop the page from scrolling while swiping on the board.
        if (tracking) event.preventDefault();
      },
      { passive: false }
    );

    boardEl.addEventListener('touchend', (event) => {
      if (!tracking) return;
      tracking = false;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;

      let direction;
      if (absX > absY) {
        direction = dx > 0 ? 1 : 3; // right : left
      } else {
        direction = dy > 0 ? 2 : 0; // down : up
      }
      this.emit('move', direction);
    });
  }
}
