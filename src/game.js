/* ============================================================
   Merge Diner — game logic (no DOM).

   A 5x5 sliding-merge board of food. Sliding merges identical foods up
   the chain (bread -> ... -> Big Mac). Customers queue with orders; you
   SERVE a tile (via the UI) when its food matches an open order, which
   clears the tile and pays coins. Orders lose patience on every move;
   if too many walk out — or the board jams — it's game over.

   Coordinates match the original: cells[x][y], x = column, y = row.
   Directions: 0 up, 1 right, 2 down, 3 left.
   ============================================================ */

import { MAX_TIER, coinsForTier, sellValue } from './foods.js';

const DIRECTIONS = {
  0: { x: 0, y: -1 },
  1: { x: 1, y: 0 },
  2: { x: 0, y: 1 },
  3: { x: -1, y: 0 },
};

let tileSeq = 0;
let orderSeq = 0;

export class Tile {
  constructor(position, value = 1) {
    this.id = ++tileSeq;
    this.x = position.x;
    this.y = position.y;
    this.value = value; // = food tier
    this.previousPosition = null;
    this.mergedFrom = null;
  }
  savePosition() {
    this.previousPosition = { x: this.x, y: this.y };
  }
  updatePosition(position) {
    this.x = position.x;
    this.y = position.y;
  }
  serialize() {
    return { position: { x: this.x, y: this.y }, value: this.value };
  }
}

export class Grid {
  constructor(size, previousState) {
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
  }
  empty() {
    const cells = [];
    for (let x = 0; x < this.size; x++) {
      cells[x] = [];
      for (let y = 0; y < this.size; y++) cells[x][y] = null;
    }
    return cells;
  }
  fromState(state) {
    const cells = [];
    for (let x = 0; x < this.size; x++) {
      cells[x] = [];
      for (let y = 0; y < this.size; y++) {
        const tile = state[x][y];
        cells[x][y] = tile ? new Tile(tile.position, tile.value) : null;
      }
    }
    return cells;
  }
  randomAvailableCell() {
    const cells = this.availableCells();
    if (cells.length) return cells[Math.floor(Math.random() * cells.length)];
  }
  availableCells() {
    const cells = [];
    this.eachCell((x, y, tile) => {
      if (!tile) cells.push({ x, y });
    });
    return cells;
  }
  eachCell(callback) {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) callback(x, y, this.cells[x][y]);
    }
  }
  cellsAvailable() {
    return this.availableCells().length > 0;
  }
  cellAvailable(cell) {
    return !this.cellOccupied(cell);
  }
  cellOccupied(cell) {
    return !!this.cellContent(cell);
  }
  cellContent(cell) {
    if (this.withinBounds(cell)) return this.cells[cell.x][cell.y];
    return null;
  }
  insertTile(tile) {
    this.cells[tile.x][tile.y] = tile;
  }
  removeTile(tile) {
    this.cells[tile.x][tile.y] = null;
  }
  withinBounds(position) {
    return (
      position.x >= 0 &&
      position.x < this.size &&
      position.y >= 0 &&
      position.y < this.size
    );
  }
  serialize() {
    const cellState = [];
    for (let x = 0; x < this.size; x++) {
      cellState[x] = [];
      for (let y = 0; y < this.size; y++) {
        cellState[x][y] = this.cells[x][y] ? this.cells[x][y].serialize() : null;
      }
    }
    return { size: this.size, cells: cellState };
  }
}

export class Game {
  constructor(size = 5) {
    this.size = size;
    this.startTiles = 3;
    this.orderSlots = 4;
    this.maxStrikes = 5;
    this.servesPerLevel = 6;

    this.onUpdate = () => {};
    this.onServe = () => {};
    this.onSell = () => {};
    this.onBigMac = () => {};
  }

  // ---- lifecycle -------------------------------------------------

  setup(previousState) {
    if (previousState) {
      this.grid = new Grid(previousState.grid.size, previousState.grid.cells);
      this.score = previousState.score || 0;
      this.strikes = previousState.strikes || 0;
      this.served = previousState.served || 0;
      this.over = previousState.over || false;
      this.orders = (previousState.orders || []).map((o) => ({ ...o }));
      this.fillOrders();
    } else {
      this.grid = new Grid(this.size);
      this.score = 0;
      this.strikes = 0;
      this.served = 0;
      this.over = false;
      this.orders = [];
      for (let i = 0; i < this.startTiles; i++) this.addRandomTile();
      this.fillOrders();
    }
    this.actuate();
  }

  get level() {
    return 1 + Math.floor(this.served / this.servesPerLevel);
  }

  addRandomTile() {
    if (!this.grid.cellsAvailable()) return;
    // Mostly bread, sometimes cheesy bread — your raw ingredients.
    const value = Math.random() < 0.85 ? 1 : 2;
    const tile = new Tile(this.grid.randomAvailableCell(), value);
    this.grid.insertTile(tile);
  }

  // ---- orders ----------------------------------------------------

  fillOrders() {
    while (this.orders.length < this.orderSlots) {
      this.orders.push(this.makeOrder());
    }
  }

  makeOrder() {
    const tier = this.pickOrderTier();
    const patience = this.patienceFor(tier);
    return { id: ++orderSeq, tier, patience, maxPatience: patience };
  }

  pickOrderTier() {
    const level = this.level;
    // Difficulty target climbs with level; cap so Big Macs aren't demanded.
    const center = Math.min(2 + Math.floor((level - 1) * 0.8), 9);
    const offsets = [-2, -1, 0, 0, 1];
    const offset = offsets[Math.floor(Math.random() * offsets.length)];
    const ceil = Math.min(level + 2, 11);
    return Math.max(1, Math.min(ceil, center + offset));
  }

  patienceFor(tier) {
    // Generous time to actually build the dish: higher tiers (which take more
    // merges to make) get proportionally longer, with only a gentle squeeze
    // as the levels climb.
    const base = 12 + tier * 3 - Math.floor(this.level * 0.4);
    return Math.max(10, Math.min(50, base));
  }

  openTiers() {
    const tiers = new Set();
    this.orders.forEach((o) => tiers.add(o.tier));
    return tiers;
  }

  serveableExists() {
    const wanted = this.openTiers();
    let found = false;
    this.grid.eachCell((x, y, tile) => {
      if (tile && wanted.has(tile.value)) found = true;
    });
    return found;
  }

  // ---- serving ---------------------------------------------------

  // Serve the tile at (x, y) to the most impatient matching customer.
  serve(x, y) {
    if (this.over) return { served: false };
    const tile = this.grid.cellContent({ x, y });
    if (!tile) return { served: false };

    const matches = this.orders
      .filter((o) => o.tier === tile.value)
      .sort((a, b) => a.patience - b.patience);
    if (!matches.length) return { served: false, reason: 'no-order' };

    const order = matches[0];
    const coins = coinsForTier(tile.value);

    this.grid.removeTile(tile);
    this.orders = this.orders.filter((o) => o.id !== order.id);
    this.score += coins + tile.value * 2;
    this.served += 1;

    if (tile.value >= MAX_TIER) this.onBigMac({ tier: tile.value });

    this.onServe({ tier: tile.value, coins, x, y, orderId: order.id });
    this.fillOrders();
    // Never let the board run completely dry, or sliding would no-op forever.
    if (this.grid.availableCells().length === this.size * this.size) {
      for (let i = 0; i < this.startTiles; i++) this.addRandomTile();
    }
    this.actuate();
    return { served: true, coins, tier: tile.value };
  }

  // ---- buy / sell (shop-driven) ----------------------------------

  // Drop a ready-made food tile of `tier` onto a random empty cell. Used by
  // the market and code rewards. Returns false if the board is full (so the
  // caller can refuse the purchase). Only the new tile animates in.
  grantFood(tier) {
    if (this.over) return false;
    if (!this.grid.cellsAvailable()) return false;
    this.grid.eachCell((x, y, tile) => {
      if (tile) tile.savePosition();
    });
    const cell = this.grid.randomAvailableCell();
    const tile = new Tile(cell, Math.max(1, Math.min(MAX_TIER, tier)));
    this.grid.insertTile(tile);
    this.actuate();
    return true;
  }

  // Sell (discard) the tile at (x, y) for a tiny number of coins. Selling
  // never costs patience or strikes. Returns { sold, coins, tier }.
  sellTile(x, y) {
    if (this.over) return { sold: false };
    const tile = this.grid.cellContent({ x, y });
    if (!tile) return { sold: false };

    const tier = tile.value;
    const coins = sellValue(tier);
    this.grid.eachCell((cx, cy, t) => {
      if (t) t.savePosition();
    });
    this.grid.removeTile(tile);

    // Never let the board run completely dry, or sliding would no-op forever.
    if (this.grid.availableCells().length === this.size * this.size) {
      for (let i = 0; i < this.startTiles; i++) this.addRandomTile();
    }
    this.onSell({ tier, coins, x, y });
    if (!this.over) this.checkBoardStuck();
    this.actuate();
    return { sold: true, coins, tier };
  }

  // ---- movement --------------------------------------------------

  move(direction) {
    if (this.over) return false;

    const vector = DIRECTIONS[direction];
    const traversals = this.buildTraversals(vector);
    let moved = false;

    this.prepareTiles();

    traversals.x.forEach((x) => {
      traversals.y.forEach((y) => {
        const cell = { x, y };
        const tile = this.grid.cellContent(cell);
        if (!tile) return;

        const positions = this.findFarthestPosition(cell, vector);
        const next = this.grid.cellContent(positions.next);

        if (next && next.value === tile.value && !next.mergedFrom) {
          const merged = new Tile(positions.next, tile.value + 1);
          merged.mergedFrom = [tile, next];
          this.grid.insertTile(merged);
          this.grid.removeTile(tile);
          tile.updatePosition(positions.next);
        } else {
          this.moveTile(tile, positions.farthest);
        }

        if (!this.positionsEqual(cell, tile)) moved = true;
      });
    });

    if (!moved) return false;

    this.addRandomTile();
    this.tickOrders();
    if (!this.over) this.checkBoardStuck();
    this.actuate();
    return true;
  }

  // Every successful move costs each waiting customer a tick of patience.
  tickOrders() {
    const survivors = [];
    let walkouts = 0;
    this.orders.forEach((o) => {
      o.patience -= 1;
      if (o.patience <= 0) walkouts += 1;
      else survivors.push(o);
    });
    this.orders = survivors;
    if (walkouts > 0) {
      this.strikes += walkouts;
      if (this.strikes >= this.maxStrikes) {
        this.strikes = this.maxStrikes;
        this.over = true;
      }
    }
    this.fillOrders();
  }

  checkBoardStuck() {
    if (!this.movesAvailable() && !this.serveableExists()) this.over = true;
  }

  prepareTiles() {
    this.grid.eachCell((x, y, tile) => {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }

  moveTile(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }

  buildTraversals(vector) {
    const traversals = { x: [], y: [] };
    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }
    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();
    return traversals;
  }

  findFarthestPosition(cell, vector) {
    let previous;
    let next = cell;
    do {
      previous = next;
      next = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(next) && this.grid.cellAvailable(next));
    return { farthest: previous, next };
  }

  positionsEqual(first, second) {
    return first.x === second.x && first.y === second.y;
  }

  movesAvailable() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  }

  tileMatchesAvailable() {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.grid.cellContent({ x, y });
        if (!tile) continue;
        for (let dir = 0; dir < 4; dir++) {
          const vector = DIRECTIONS[dir];
          const other = this.grid.cellContent({ x: x + vector.x, y: y + vector.y });
          if (other && other.value === tile.value) return true;
        }
      }
    }
    return false;
  }

  // ---- output ----------------------------------------------------

  actuate() {
    this.onUpdate(this.snapshot());
  }

  snapshot() {
    const tiles = [];
    this.grid.eachCell((x, y, tile) => {
      if (tile) tiles.push(tile);
    });
    const wanted = this.openTiers();
    return {
      tiles,
      size: this.size,
      orders: this.orders.map((o) => ({ ...o })),
      openTiers: [...wanted],
      score: this.score,
      strikes: this.strikes,
      maxStrikes: this.maxStrikes,
      level: this.level,
      served: this.served,
      over: this.over,
    };
  }

  serialize() {
    return {
      grid: this.grid.serialize(),
      score: this.score,
      strikes: this.strikes,
      served: this.served,
      over: this.over,
      orders: this.orders.map((o) => ({ ...o })),
    };
  }
}
