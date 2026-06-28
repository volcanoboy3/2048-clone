/* ============================================================
   2048 — game logic (no DOM).

   Coordinate convention (matches the original):
     - cells[x][y]: x is the column, y is the row.
     - Directions: 0 up, 1 right, 2 down, 3 left.

   Tiles carry `previousPosition` and `mergedFrom` so the renderer can
   animate slides and merges; these are reset at the start of each move.
   ============================================================ */

const DIRECTIONS = {
  0: { x: 0, y: -1 }, // up
  1: { x: 1, y: 0 }, //  right
  2: { x: 0, y: 1 }, //  down
  3: { x: -1, y: 0 }, // left
};

export class Tile {
  constructor(position, value = 2) {
    this.x = position.x;
    this.y = position.y;
    this.value = value;
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
    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
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
  constructor(size = 4, winValue = 2048) {
    this.size = size;
    this.winValue = winValue;
    this.startTiles = 2;
    /** Called with a state snapshot whenever the board changes. */
    this.onUpdate = () => {};
  }

  /** Start fresh, or restore a previously serialized state. */
  setup(previousState) {
    if (previousState) {
      this.grid = new Grid(previousState.grid.size, previousState.grid.cells);
      this.score = previousState.score;
      this.over = previousState.over;
      this.won = previousState.won;
      this.keepPlaying = previousState.keepPlaying;
    } else {
      this.grid = new Grid(this.size);
      this.score = 0;
      this.over = false;
      this.won = false;
      this.keepPlaying = false;
      for (let i = 0; i < this.startTiles; i++) this.addRandomTile();
    }
    this.actuate();
  }

  addRandomTile() {
    if (this.grid.cellsAvailable()) {
      const value = Math.random() < 0.9 ? 2 : 4;
      const tile = new Tile(this.grid.randomAvailableCell(), value);
      this.grid.insertTile(tile);
    }
  }

  /** Emit the current state to listeners (the renderer). */
  actuate() {
    this.onUpdate(this.snapshot());
  }

  snapshot() {
    const tiles = [];
    this.grid.eachCell((x, y, tile) => {
      if (tile) tiles.push(tile);
    });
    return {
      tiles,
      size: this.size,
      score: this.score,
      over: this.over,
      won: this.won,
      keepPlaying: this.keepPlaying,
      terminated: this.isGameTerminated(),
    };
  }

  isGameTerminated() {
    return this.over || (this.won && !this.keepPlaying);
  }

  /** Save each tile's position and clear merge info before a move. */
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

  /** Move all tiles in a direction (0 up, 1 right, 2 down, 3 left). */
  move(direction) {
    if (this.isGameTerminated()) return false;

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

        // Merge with the next tile if it has the same value and hasn't
        // already merged this turn.
        if (next && next.value === tile.value && !next.mergedFrom) {
          const merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          this.grid.insertTile(merged);
          this.grid.removeTile(tile);
          tile.updatePosition(positions.next);

          this.score += merged.value;
          if (merged.value === this.winValue) this.won = true;
        } else {
          this.moveTile(tile, positions.farthest);
        }

        if (!this.positionsEqual(cell, tile)) moved = true;
      });
    });

    if (moved) {
      this.addRandomTile();
      if (!this.movesAvailable()) this.over = true;
      this.actuate();
    }

    return moved;
  }

  buildTraversals(vector) {
    const traversals = { x: [], y: [] };
    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }
    // Always traverse from the farthest cell in the chosen direction.
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

  /** Is any adjacent pair mergeable? (used to detect game over) */
  tileMatchesAvailable() {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.grid.cellContent({ x, y });
        if (!tile) continue;
        for (let dir = 0; dir < 4; dir++) {
          const vector = DIRECTIONS[dir];
          const other = this.grid.cellContent({
            x: x + vector.x,
            y: y + vector.y,
          });
          if (other && other.value === tile.value) return true;
        }
      }
    }
    return false;
  }

  /** Dismiss the win overlay and keep playing past 2048. */
  keepGoing() {
    this.keepPlaying = true;
    this.actuate();
  }

  serialize() {
    return {
      grid: this.grid.serialize(),
      score: this.score,
      over: this.over,
      won: this.won,
      keepPlaying: this.keepPlaying,
    };
  }
}
