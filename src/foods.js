// The food chain. Index = tier (1-based). Merge two of tier N to make tier N+1.
// Bread is the humble start; the Big Mac is the crown jewel.
export const FOODS = [
  null, // tier 0 unused so FOODS[tier] lines up
  { tier: 1, id: 'bread', name: 'Bread', emoji: '🍞', bg: '#f0ddb0', fg: '#7c5a2a' },
  { tier: 2, id: 'cheese', name: 'Cheesy Bread', emoji: '🧀', bg: '#f3cf63', fg: '#6e5414' },
  { tier: 3, id: 'ham', name: 'Ham Bread', emoji: '🥓', bg: '#f0a98c', fg: '#7c3a2a' },
  { tier: 4, id: 'sandwich', name: 'Sandwich', emoji: '🥪', bg: '#e7bd72', fg: '#6d4a1c' },
  { tier: 5, id: 'croissant', name: 'Croissant', emoji: '🥐', bg: '#e89f4d', fg: '#5d3510' },
  { tier: 6, id: 'chicken', name: 'Fried Chicken', emoji: '🍗', bg: '#db8638', fg: '#fff4e6' },
  { tier: 7, id: 'burger', name: 'Burger', emoji: '🍔', bg: '#d06a2b', fg: '#fff4e6' },
  { tier: 8, id: 'pasta', name: 'Pasta', emoji: '🍝', bg: '#d6604a', fg: '#fff1ec' },
  { tier: 9, id: 'pizza', name: 'Pizza', emoji: '🍕', bg: '#cb4231', fg: '#fff1ec' },
  { tier: 10, id: 'steak', name: 'Steak', emoji: '🥩', bg: '#8f4a36', fg: '#ffe9df' },
  { tier: 11, id: 'macncheese', name: 'Mac & Cheese', emoji: '🥘', bg: '#ecbb46', fg: '#5e4710' },
  { tier: 12, id: 'bigmac', name: 'Big Mac', emoji: '🍔', bg: '#f4c12e', fg: '#6b4a00', crown: true, best: true },
];

export const MAX_TIER = 12;

// Food descriptor for a tier. Tiers beyond the chain render as a glorified
// Big Mac with a "+N" badge (effectively unreachable on a 5x5, but safe).
export function foodForTier(tier) {
  if (tier >= 1 && tier <= MAX_TIER) return FOODS[tier];
  const base = FOODS[MAX_TIER];
  return { ...base, name: 'Mega Mac', overflow: tier - MAX_TIER };
}

// Coins earned for serving a given tier — grows quickly so fancy dishes pay off.
export function coinsForTier(tier) {
  return Math.round(3 * Math.pow(tier, 1.7));
}

// Price to BUY a ready-made food from the market. A steep curve — cheap early,
// luxury late — anchored so the crown dish (Big Mac, top tier) costs 700 coins.
// Fancier "good food" is dramatically more expensive than the humble stuff.
export function buyPrice(tier) {
  return Math.round(700 * Math.pow(tier / MAX_TIER, 2.5));
}

// Coins for SELLING a food tile. Same shape as buying, anchored so a Big Mac
// sells for 400 (~57% of its buy price); cheaper foods sell for proportionally
// less. Selling a food always returns less than buying it.
export function sellValue(tier) {
  return Math.max(1, Math.round(400 * Math.pow(tier / MAX_TIER, 2.5)));
}
