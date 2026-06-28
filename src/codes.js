/* ============================================================
   Merge Diner — redeemable codes.

   Each code grants a reward once (coins, a ready-made food tile, or a
   cosmetic unlock). Whether a code has been used is tracked in
   localStorage by main.js; this module just defines the catalog and a
   case-insensitive lookup. Rewards are applied by main.js so codes can
   reach the same wallet / board / wardrobe the rest of the game uses.

   reward fields: { coins?, food?(tier), clothing?(id), skin?(id), note }
   ============================================================ */

export const CODES = [
  { code: 'WELCOME',     reward: { coins: 100, food: 4, note: 'a free Sandwich + 100 coins' } },
  { code: 'FREEBREAD',   reward: { food: 2, coins: 20, note: 'Cheesy Bread + 20 coins' } },
  { code: 'DINERTIME',   reward: { coins: 150, note: '150 coins' } },
  { code: 'CHEFLIFE',    reward: { food: 6, coins: 50, note: 'Fried Chicken + 50 coins' } },
  { code: 'MERGEMASTER', reward: { food: 8, note: 'a hot plate of Pasta' } },
  { code: 'PIZZAPARTY',  reward: { food: 9, note: 'a whole Pizza' } },
  { code: 'STEAKNIGHT',  reward: { food: 10, note: 'a juicy Steak' } },
  { code: 'BIGMAC',      reward: { food: 12, note: 'the legendary Big Mac 👑' } },
  { code: 'GOLDRUSH',    reward: { coins: 300, note: '300 coins' } },
  { code: 'SUPERCHEF',   reward: { clothing: 'hero', note: 'the Super Chef top' } },
  { code: 'TOPCLASS',    reward: { clothing: 'tophat', note: 'a dapper Top Hat' } },
  { code: 'STYLISH',     reward: { clothing: 'shades', note: 'a pair of Cool Shades' } },
  { code: 'GOLDENTOUCH', reward: { skin: 'gold', note: 'the Midas Platter tile skin ✨' } },
];

export function normalizeCode(text) {
  return String(text || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function findCode(text) {
  const key = normalizeCode(text);
  if (!key) return null;
  return CODES.find((c) => c.code === key) || null;
}
