/* Logic tests for Merge Diner. Run: node test/game.test.mjs
   No framework — plain assertions. */

import { Game, Grid, Tile } from '../src/game.js';

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

/** A game with an explicit board + orders, with random tile spawns disabled. */
function gameWith(placements, orders = []) {
  const game = new Game(5);
  game.grid = new Grid(5);
  game.score = 0;
  game.strikes = 0;
  game.served = 0;
  game.over = false;
  game.orders = orders;
  game.onUpdate = () => {};
  game.onServe = () => {};
  game.onBigMac = () => {};
  game.addRandomTile = () => {}; // deterministic
  placements.forEach(([x, y, v]) => game.grid.insertTile(new Tile({ x, y }, v)));
  return game;
}

function tilesOf(game) {
  const out = [];
  game.grid.eachCell((x, y, t) => {
    if (t) out.push({ x, y, v: t.value });
  });
  return out;
}

console.log('Merging two foods makes the next tier up:');
{
  const game = gameWith([
    [0, 0, 1], // bread
    [1, 0, 1], // bread
  ]);
  const moved = game.move(3); // left
  const tiles = tilesOf(game);
  assert('move happened', moved === true);
  assert('one tile remains', tiles.length === 1);
  assert('bread + bread = cheesy bread (tier 2)', tiles[0].v === 2);
}

console.log('No chain merge in a single slide (1,1,1,1 -> 2,2):');
{
  const game = gameWith([
    [0, 0, 1],
    [1, 0, 1],
    [2, 0, 1],
    [3, 0, 1],
  ]);
  game.move(3);
  const tiles = tilesOf(game).sort((a, b) => a.x - b.x);
  assert('two tiles remain', tiles.length === 2);
  assert('both are tier 2', tiles.every((t) => t.v === 2));
}

console.log('Serving a matching tile clears it and pays out:');
{
  const order = { id: 1, tier: 3, patience: 5, maxPatience: 5 };
  const game = gameWith([[2, 2, 3]], [order]);
  const result = game.serve(2, 2);
  assert('served successfully', result.served === true);
  assert('earned coins', result.coins > 0);
  assert('tile is gone', tilesOf(game).length === 0);
  assert('served counter went up', game.served === 1);
  assert('score increased', game.score > 0);
  assert('orders refilled to the slot count', game.orders.length === game.orderSlots);
}

console.log('Serving the last tile restocks the board (no soft-lock):');
{
  const game = gameWith([[2, 2, 1]], [{ id: 1, tier: 1, patience: 5, maxPatience: 5 }]);
  game.addRandomTile = Game.prototype.addRandomTile.bind(game); // re-enable real spawns
  game.serve(2, 2);
  assert('board is not left empty', tilesOf(game).length > 0);
}

console.log('Tapping a tile nobody ordered does nothing:');
{
  const game = gameWith([[2, 2, 3]], [{ id: 1, tier: 6, patience: 5, maxPatience: 5 }]);
  const result = game.serve(2, 2);
  assert('not served', result.served === false);
  assert('flagged as no matching order', result.reason === 'no-order');
  assert('tile stays on the board', tilesOf(game).length === 1);
}

console.log('Running customers out of patience ends the game:');
{
  const orders = [
    { id: 1, tier: 4, patience: 1, maxPatience: 8 },
    { id: 2, tier: 5, patience: 1, maxPatience: 8 },
    { id: 3, tier: 6, patience: 1, maxPatience: 8 },
  ];
  // two breads that can merge, guaranteeing a real move
  const game = gameWith([[0, 0, 1], [1, 0, 1]], orders);
  game.move(3); // a move ticks patience; all three expire at once
  assert('three strikes recorded', game.strikes === 3);
  assert('game is over', game.over === true);
}

console.log('A move that changes nothing is a no-op:');
{
  const game = gameWith([[0, 0, 2]]);
  let spawned = false;
  game.addRandomTile = () => { spawned = true; };
  const moved = game.move(3); // already against the wall, nothing to merge
  assert('move reports no movement', moved === false);
  assert('nothing spawned', spawned === false);
}

console.log('Order tiers stay within the food chain:');
{
  const game = gameWith([]);
  let ok = true;
  for (let served = 0; served < 80; served++) {
    game.served = served;
    const tier = game.pickOrderTier();
    if (tier < 1 || tier > 11 || !Number.isInteger(tier)) ok = false;
  }
  assert('every generated order tier is a valid food (1-11)', ok);
}

console.log('Serialize / restore round-trips the board and run state:');
{
  const game = gameWith([[0, 0, 5], [4, 4, 7]], [{ id: 9, tier: 5, patience: 4, maxPatience: 10 }]);
  game.score = 120;
  game.served = 3;
  game.strikes = 1;
  const restored = new Game(5);
  restored.onUpdate = () => {};
  restored.setup(game.serialize());
  const tiles = tilesOf(restored).sort((a, b) => a.v - b.v);
  assert('score restored', restored.score === 120);
  assert('served restored', restored.served === 3);
  assert('strikes restored', restored.strikes === 1);
  assert('tiles restored', tiles.length === 2 && tiles[0].v === 5 && tiles[1].v === 7);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
