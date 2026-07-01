/* ============================================================
   Merge Diner — redeemable codes.

   Each code grants a reward once (coins, a ready-made food tile, or a
   cosmetic unlock). Whether a code has been used is tracked in
   localStorage by main.js; this module just defines the catalog and a
   case-insensitive lookup. Rewards are applied by main.js so codes can
   reach the same wallet / board / wardrobe the rest of the game uses.

   reward fields: { coins?, food?(tier), clothing?(id), skin?(id), note }
   ============================================================ */

// Codes are deliberately opaque random tokens (no reward hints, no guessable
// words, no ambiguous 0/O/1/I/L characters) so players can't just type "PIZZA"
// or "FREE" to win. They're meant to be handed out, not guessed.
export const CODES = [
  { code: 'Y98D8F4',  reward: { coins: 100, food: 4, note: 'a free Sandwich + 100 coins' } },
  { code: 'GXEVYW',   reward: { food: 2, coins: 20, note: 'Cheesy Bread + 20 coins' } },
  { code: 'S6HN8GU6', reward: { coins: 150, note: '150 coins' } },
  { code: 'JZRFT29V', reward: { food: 6, coins: 50, note: 'Fried Chicken + 50 coins' } },
  { code: 'W4AFFZ',   reward: { food: 8, note: 'a hot plate of Pasta' } },
  { code: '2HC4ABV',  reward: { food: 9, note: 'a whole Pizza' } },
  { code: 'EK774SK',  reward: { food: 10, note: 'a juicy Steak' } },
  { code: 'P7HR4CB',  reward: { food: 12, note: 'the legendary Big Mac 👑' } },
  { code: 'NUXMPY6V', reward: { coins: 300, note: '300 coins' } },
  { code: 'XQNQH9FU', reward: { clothing: 'hero', note: 'the Super Chef top' } },
  { code: 'ES6NX2',   reward: { clothing: 'tophat', note: 'a dapper Top Hat' } },
  { code: 'HSTTD5D',  reward: { clothing: 'shades', note: 'a pair of Cool Shades' } },
  { code: 'YBEN2K5A', reward: { skin: 'gold', note: 'the Midas Platter tile skin ✨' } },
  // ---- second batch (added 2026-07-01) ----
  { code: 'QK7VM3',   reward: { coins: 500, note: '500 coins' } },
  { code: 'H4ZPXN9',  reward: { coins: 250, note: '250 coins' } },
  { code: 'T9BRUK2',  reward: { food: 11, note: 'a bowl of Mac & Cheese' } },
  { code: 'VXE6HQ',   reward: { food: 5, coins: 40, note: 'a Croissant + 40 coins' } },
  { code: 'RUZ7HKP',  reward: { clothing: 'crown', note: 'the Royal Crown 👑' } },
  { code: 'M6QVEB',   reward: { clothing: 'tux', note: 'a sharp Black Tie outfit' } },
  { code: 'PXK9RT4',  reward: { clothing: 'starshades', note: 'Star Shades ⭐' } },
  { code: 'DQH5NV8',  reward: { clothing: 'goldshoes', note: 'Golden Kicks ✨' } },
  { code: 'Y7KMXP2',  reward: { skin: 'royal', note: 'the Royal Velvet tile skin' } },
  { code: 'GNX8VUH',  reward: { skin: 'neon', note: 'the Midnight Neon tile skin' } },
];

export function normalizeCode(text) {
  return String(text || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function findCode(text) {
  const key = normalizeCode(text);
  if (!key) return null;
  return CODES.find((c) => c.code === key) || null;
}
