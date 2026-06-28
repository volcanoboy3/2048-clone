/* Minimal logic tests for the 2048 engine. Run: node test/game.test.mjs
   No framework — just assertions, so it runs anywhere with plain node. */

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

/** Build a game with an explicit board, bypassing random start tiles. */
function gameWith(placements) {
  const game = new Game(4);
  game.grid = new Grid(4);
  game.score = 0;
  game.over = false;
  game.won = false;
  game.keepPlaying = false;
  game.onUpdate = () => {};
  placements.forEach(([x, y, v]) => game.grid.insertTile(new Tile({ x, y }, v)));
  // Stop new tiles from appearing so assertions stay deterministic.
  game.addRandomTile = () => {};
  return game;
}

function tilesOf(game) {
  const out = [];
  game.grid.eachCell((x, y, t) => {
    if (t) out.push({ x, y, v: t.value });
  });
  return out;
}

console.log('Two equal tiles merge on move:');
{
  const game = gameWith([
    [0, 0, 2],
    [1, 0, 2],
  ]);
  const moved = game.move(3); // left
  const tiles = tilesOf(game);
  assert('move reports movement', moved === true);
  assert('exactly one tile remains', tiles.length === 1);
  assert('merged value is 4', tiles[0] && tiles[0].v === 4);
  assert('merged tile sits at the wall (0,0)', tiles[0].x === 0 && tiles[0].y === 0);
  assert('score increased by 4', game.score === 4);
}

console.log('Only one merge per pair per move (no chaining):');
{
  // 2,2,2,2 in a row sliding left -> 4,4 (not 8)
  const game = gameWith([
    [0, 0, 2],
    [1, 0, 2],
    [2, 0, 2],
    [3, 0, 2],
  ]);
  game.move(3); // left
  const tiles = tilesOf(game).sort((a, b) => a.x - b.x);
  assert('two tiles remain', tiles.length === 2);
  assert('both are 4', tiles.every((t) => t.v === 4));
  assert('score is 8', game.score === 8);
}

console.log('Reaching 2048 sets the win flag:');
{
  const game = gameWith([
    [0, 0, 1024],
    [1, 0, 1024],
  ]);
  game.move(3);
  assert('won flag set', game.won === true);
  assert('a 2048 tile exists', tilesOf(game).some((t) => t.v === 2048));
}

console.log('A move that changes nothing does not spawn or advance:');
{
  const game = gameWith([[0, 0, 2]]);
  let spawned = false;
  game.addRandomTile = () => {
    spawned = true;
  };
  const moved = game.move(3); // already at the left wall, nothing to merge
  assert('move reports no movement', moved === false);
  assert('no tile spawned', spawned === false);
}

console.log('Game over when the board is full with no merges:');
{
  // Checkerboard of 2/4 — full board, zero adjacent matches.
  const placements = [];
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      placements.push([x, y, (x + y) % 2 === 0 ? 2 : 4]);
    }
  }
  const game = gameWith(placements);
  assert('no moves available', game.movesAvailable() === false);
}

console.log('Serialize / restore round-trips the board:');
{
  const game = gameWith([
    [0, 0, 8],
    [3, 3, 16],
  ]);
  game.score = 42;
  const restored = new Game(4);
  restored.onUpdate = () => {};
  restored.setup(game.serialize());
  const tiles = tilesOf(restored).sort((a, b) => a.v - b.v);
  assert('score restored', restored.score === 42);
  assert('tiles restored', tiles.length === 2 && tiles[0].v === 8 && tiles[1].v === 16);
  assert('positions restored', tiles[1].x === 3 && tiles[1].y === 3);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
