/* ============================================================
   Merge Diner — the chef character + wearable wardrobe.

   The chef is a single layered SVG. Each clothing item contributes an
   SVG fragment authored in the avatar's 0..120 x 0..170 coordinate space.
   buildAvatar() stacks the body and the equipped items back-to-front so
   pants sit over legs, shirts over the torso, hats over hair, etc.

   Slots: hat, face, top, bottom, shoes. Every slot has a free default so
   the chef is always fully dressed; everything else is bought with coins.
   ============================================================ */

const SKIN = '#f1c294';
const SKIN_DARK = '#e3ad7c';
const HAIR = '#5a3a1c';

// ---- fixed body parts (drawn between the clothing layers) -------

const BASE_LEGS = `
  <rect x="48" y="118" width="11" height="36" rx="5.5" fill="${SKIN}"/>
  <rect x="61" y="118" width="11" height="36" rx="5.5" fill="${SKIN}"/>`;

const BASE_BODY = `
  <rect x="21" y="82" width="14" height="42" rx="7" fill="${SKIN}"/>
  <rect x="85" y="82" width="14" height="42" rx="7" fill="${SKIN}"/>
  <circle cx="28" cy="126" r="8" fill="${SKIN}"/>
  <circle cx="92" cy="126" r="8" fill="${SKIN}"/>
  <rect x="35" y="74" width="50" height="52" rx="17" fill="${SKIN}"/>`;

const BASE_HEAD = `
  <rect x="52" y="62" width="16" height="18" rx="6" fill="${SKIN_DARK}"/>
  <circle cx="34" cy="46" r="5.5" fill="${SKIN}"/>
  <circle cx="86" cy="46" r="5.5" fill="${SKIN}"/>
  <circle cx="60" cy="44" r="26" fill="${SKIN}"/>
  <path d="M35 40 Q38 16 60 15 Q82 16 85 40 Q73 27 60 27 Q47 27 35 40 Z" fill="${HAIR}"/>
  <circle cx="51" cy="45" r="3.3" fill="#3a2a1a"/>
  <circle cx="69" cy="45" r="3.3" fill="#3a2a1a"/>
  <circle cx="46" cy="53" r="4.2" fill="#f0a487" opacity="0.55"/>
  <circle cx="74" cy="53" r="4.2" fill="#f0a487" opacity="0.55"/>
  <path d="M50 56 Q60 65 70 56" stroke="#a65b39" stroke-width="3" fill="none" stroke-linecap="round"/>`;

// ---- builders (keep item data terse) ----------------------------

function top(color, extra = '') {
  return `
    <rect x="32" y="74" width="56" height="54" rx="18" fill="${color}"/>
    <rect x="20" y="80" width="17" height="22" rx="8.5" fill="${color}"/>
    <rect x="83" y="80" width="17" height="22" rx="8.5" fill="${color}"/>
    ${extra}`;
}

function bottom(color, extra = '') {
  return `
    <rect x="41" y="115" width="38" height="16" rx="6" fill="${color}"/>
    <rect x="46" y="123" width="13" height="30" rx="4" fill="${color}"/>
    <rect x="61" y="123" width="13" height="30" rx="4" fill="${color}"/>
    ${extra}`;
}

function shoes(color, extra = '') {
  return `
    <ellipse cx="52" cy="154" rx="11" ry="7.5" fill="${color}"/>
    <ellipse cx="68" cy="154" rx="11" ry="7.5" fill="${color}"/>
    ${extra}`;
}

// ---- the wardrobe -----------------------------------------------

export const CLOTHING = [
  // ---------------- TOPS ----------------
  {
    id: 'apron', name: 'Diner Apron', slot: 'top', price: 0, rarity: 'common', icon: '🦺',
    svg: top('#e9e2d2', `
      <rect x="45" y="84" width="30" height="40" rx="6" fill="#fbf8f1"/>
      <rect x="51" y="103" width="18" height="13" rx="3" fill="none" stroke="#cfc3ad" stroke-width="2"/>
      <path d="M52 76 L56 88 M68 76 L64 88" stroke="#cfc3ad" stroke-width="2" fill="none"/>`),
  },
  {
    id: 'tee_red', name: 'Red Tee', slot: 'top', price: 60, rarity: 'common', icon: '👕',
    svg: top('#e0524a'),
  },
  {
    id: 'tee_blue', name: 'Blue Tee', slot: 'top', price: 60, rarity: 'common', icon: '👕',
    svg: top('#4a86c8'),
  },
  {
    id: 'stripes', name: 'Sailor Stripes', slot: 'top', price: 60, rarity: 'common', icon: '👚',
    svg: top('#f3f0ea', `
      <rect x="34" y="82" width="52" height="5" fill="#2f5c9e"/>
      <rect x="34" y="93" width="52" height="5" fill="#2f5c9e"/>
      <rect x="34" y="104" width="52" height="5" fill="#2f5c9e"/>
      <rect x="34" y="115" width="52" height="5" fill="#2f5c9e"/>`),
  },
  {
    id: 'hoodie', name: 'Cozy Hoodie', slot: 'top', price: 140, rarity: 'rare', icon: '🧥',
    svg: top('#5b6b7a', `
      <path d="M44 74 Q60 86 76 74 Q72 64 60 64 Q48 64 44 74 Z" fill="#4a5867"/>
      <rect x="56" y="92" width="8" height="26" rx="3" fill="#3f4b58"/>
      <path d="M53 78 L56 92 M67 78 L64 92" stroke="#dfe5ea" stroke-width="2.2" stroke-linecap="round"/>`),
  },
  {
    id: 'chefcoat', name: "Chef's Whites", slot: 'top', price: 140, rarity: 'rare', icon: '👨‍🍳',
    svg: top('#fbfaf6', `
      <path d="M60 74 L60 124" stroke="#e2ddd2" stroke-width="2"/>
      <circle cx="52" cy="88" r="2" fill="#cfc7b6"/>
      <circle cx="52" cy="100" r="2" fill="#cfc7b6"/>
      <circle cx="52" cy="112" r="2" fill="#cfc7b6"/>
      <path d="M60 74 Q50 84 49 100 L60 100 Z" fill="#f1eee6"/>`),
  },
  {
    id: 'hawaiian', name: 'Aloha Shirt', slot: 'top', price: 140, rarity: 'rare', icon: '🌺',
    svg: top('#2bb6a8', `
      <circle cx="46" cy="90" r="3.5" fill="#ff7aa8"/><circle cx="64" cy="100" r="3.5" fill="#ffd24e"/>
      <circle cx="74" cy="86" r="3.5" fill="#ff7aa8"/><circle cx="52" cy="112" r="3.5" fill="#ffd24e"/>
      <circle cx="70" cy="116" r="3.5" fill="#ff7aa8"/>`),
  },
  {
    id: 'tux', name: 'Black Tie', slot: 'top', price: 300, rarity: 'epic', icon: '🤵',
    svg: top('#22242b', `
      <path d="M44 74 L60 110 L76 74 Z" fill="#f4f4f6"/>
      <path d="M60 74 L52 96 L60 104 L68 96 Z" fill="#22242b"/>
      <path d="M54 82 L60 88 L66 82 L63 90 L57 90 Z" fill="#b5142b"/>
      <circle cx="60" cy="100" r="2" fill="#3a3d46"/>`),
  },
  {
    id: 'hero', name: 'Super Chef', slot: 'top', price: 300, rarity: 'epic', icon: '🦸',
    svg: top('#2a4fd0', `
      <path d="M60 80 l4.5 9 10 .8 -7.5 6.6 2.4 9.8 -9.4 -5.3 -9.4 5.3 2.4 -9.8 -7.5 -6.6 10 -.8 Z" fill="#ffd24e"/>`),
  },
  {
    id: 'rainbowtop', name: 'Rainbow Knit', slot: 'top', price: 600, rarity: 'legendary', icon: '🌈',
    svg: top('#ff5d8f', `
      <rect x="34" y="82" width="52" height="9" fill="#ff8a5c"/>
      <rect x="34" y="91" width="52" height="9" fill="#ffd34e"/>
      <rect x="34" y="100" width="52" height="9" fill="#5cd97a"/>
      <rect x="34" y="109" width="52" height="9" fill="#4fc3ff"/>
      <rect x="34" y="118" width="52" height="8" fill="#9b6bff"/>`),
  },

  // ---------------- BOTTOMS ----------------
  {
    id: 'trousers', name: 'Work Trousers', slot: 'bottom', price: 0, rarity: 'common', icon: '👖',
    svg: bottom('#8a6b4a'),
  },
  {
    id: 'jeans', name: 'Blue Jeans', slot: 'bottom', price: 60, rarity: 'common', icon: '👖',
    svg: bottom('#3f6ea5', `
      <path d="M46 123 L46 153 M73 123 L73 153" stroke="#34598a" stroke-width="1.5"/>
      <rect x="49" y="120" width="6" height="5" rx="1" fill="none" stroke="#ffd24e" stroke-width="0.8"/>`),
  },
  {
    id: 'shorts', name: 'Summer Shorts', slot: 'bottom', price: 60, rarity: 'common', icon: '🩳',
    svg: `
      <rect x="41" y="115" width="38" height="16" rx="6" fill="#d98a3a"/>
      <rect x="46" y="123" width="13" height="18" rx="4" fill="#d98a3a"/>
      <rect x="61" y="123" width="13" height="18" rx="4" fill="#d98a3a"/>`,
  },
  {
    id: 'joggers', name: 'Grey Joggers', slot: 'bottom', price: 140, rarity: 'rare', icon: '🩳',
    svg: bottom('#9aa0a6', `
      <rect x="46" y="148" width="13" height="5" rx="2" fill="#7d838a"/>
      <rect x="61" y="148" width="13" height="5" rx="2" fill="#7d838a"/>`),
  },
  {
    id: 'slacks', name: 'Tuxedo Slacks', slot: 'bottom', price: 300, rarity: 'epic', icon: '🕴️',
    svg: bottom('#23252c', `
      <path d="M52 123 L52 153 M67 123 L67 153" stroke="#3a3d46" stroke-width="1.5"/>`),
  },

  // ---------------- SHOES ----------------
  {
    id: 'clogs', name: 'Kitchen Clogs', slot: 'shoes', price: 0, rarity: 'common', icon: '🥿',
    svg: shoes('#f3efe6', `<ellipse cx="52" cy="158" rx="11" ry="3" fill="#d8d1c2"/><ellipse cx="68" cy="158" rx="11" ry="3" fill="#d8d1c2"/>`),
  },
  {
    id: 'sneakers', name: 'Red Sneakers', slot: 'shoes', price: 60, rarity: 'common', icon: '👟',
    svg: shoes('#e0524a', `<ellipse cx="52" cy="158" rx="11.5" ry="3" fill="#ffffff"/><ellipse cx="68" cy="158" rx="11.5" ry="3" fill="#ffffff"/>`),
  },
  {
    id: 'hightops', name: 'Black Hi-Tops', slot: 'shoes', price: 140, rarity: 'rare', icon: '👟',
    svg: `
      <path d="M41 150 h14 v4 a8 8 0 0 1 -8 8 h-6 Z" fill="#26282e"/>
      <path d="M65 150 h14 v12 h-6 a8 8 0 0 1 -8 -8 Z" fill="#26282e"/>
      <ellipse cx="48" cy="160" rx="9" ry="2.6" fill="#fafafa"/>
      <ellipse cx="72" cy="160" rx="9" ry="2.6" fill="#fafafa"/>`,
  },
  {
    id: 'boots', name: 'Cowboy Boots', slot: 'shoes', price: 140, rarity: 'rare', icon: '🥾',
    svg: shoes('#8a5a32', `<rect x="45" y="142" width="9" height="14" rx="3" fill="#8a5a32"/><rect x="66" y="142" width="9" height="14" rx="3" fill="#8a5a32"/>`),
  },
  {
    id: 'goldshoes', name: 'Golden Kicks', slot: 'shoes', price: 600, rarity: 'legendary', icon: '✨',
    svg: shoes('#f4c12e', `<ellipse cx="52" cy="158" rx="11.5" ry="3" fill="#fff3c4"/><ellipse cx="68" cy="158" rx="11.5" ry="3" fill="#fff3c4"/>`),
  },

  // ---------------- HATS ----------------
  {
    id: 'chefhat', name: "Chef's Toque", slot: 'hat', price: 0, rarity: 'common', icon: '👨‍🍳',
    svg: `
      <rect x="45" y="22" width="30" height="15" rx="4" fill="#f3efe6"/>
      <circle cx="47" cy="17" r="9" fill="#fbf9f4"/>
      <circle cx="60" cy="12" r="11" fill="#fbf9f4"/>
      <circle cx="73" cy="17" r="9" fill="#fbf9f4"/>`,
  },
  {
    id: 'cap', name: 'Ball Cap', slot: 'hat', price: 60, rarity: 'common', icon: '🧢',
    svg: `
      <path d="M37 32 Q37 14 60 14 Q83 14 83 32 Z" fill="#c8763e"/>
      <path d="M37 32 Q26 33 22 37 Q40 39 60 33 Z" fill="#a85c2c"/>`,
  },
  {
    id: 'beanie', name: 'Knit Beanie', slot: 'hat', price: 60, rarity: 'common', icon: '🧶',
    svg: `
      <path d="M37 33 Q37 12 60 12 Q83 12 83 33 Z" fill="#4a8d6a"/>
      <rect x="36" y="30" width="48" height="7" rx="3.5" fill="#3a7657"/>
      <circle cx="60" cy="9" r="4" fill="#bfe6cf"/>`,
  },
  {
    id: 'party', name: 'Party Hat', slot: 'hat', price: 140, rarity: 'rare', icon: '🎉',
    svg: `
      <path d="M60 2 L74 34 L46 34 Z" fill="#ff6fae"/>
      <path d="M60 2 L66 16 L54 16 Z" fill="#ffd24e"/>
      <circle cx="60" cy="2" r="3.5" fill="#ffd24e"/>
      <circle cx="56" cy="26" r="2" fill="#fff"/><circle cx="66" cy="22" r="2" fill="#fff"/>`,
  },
  {
    id: 'cowboy', name: 'Cowboy Hat', slot: 'hat', price: 140, rarity: 'rare', icon: '🤠',
    svg: `
      <ellipse cx="60" cy="33" rx="34" ry="8" fill="#9a6a3a"/>
      <path d="M44 33 Q44 12 60 12 Q76 12 76 33 Z" fill="#8a5a32"/>
      <rect x="44" y="28" width="32" height="5" fill="#5e3a1c"/>`,
  },
  {
    id: 'tophat', name: 'Top Hat', slot: 'hat', price: 300, rarity: 'epic', icon: '🎩',
    svg: `
      <ellipse cx="60" cy="33" rx="30" ry="6.5" fill="#1c1d22"/>
      <rect x="44" y="2" width="32" height="32" rx="3" fill="#23242b"/>
      <rect x="44" y="26" width="32" height="6" fill="#b5142b"/>`,
  },
  {
    id: 'crown', name: 'Royal Crown', slot: 'hat', price: 600, rarity: 'legendary', icon: '👑',
    svg: `
      <path d="M40 34 L40 16 L50 24 L60 10 L70 24 L80 16 L80 34 Z" fill="#f4c12e" stroke="#caa018" stroke-width="1.5"/>
      <rect x="40" y="30" width="40" height="6" rx="2" fill="#e0ad22"/>
      <circle cx="60" cy="12" r="3" fill="#e0524a"/><circle cx="42" cy="18" r="2.4" fill="#4a86c8"/><circle cx="78" cy="18" r="2.4" fill="#4a86c8"/>`,
  },

  // ---------------- FACE / ACCESSORIES ----------------
  { id: 'none', name: 'No Accessory', slot: 'face', price: 0, rarity: 'common', icon: '🚫', svg: '' },
  {
    id: 'glasses', name: 'Round Glasses', slot: 'face', price: 60, rarity: 'common', icon: '👓',
    svg: `
      <g fill="none" stroke="#3a2a1a" stroke-width="2.4">
        <circle cx="51" cy="45" r="7"/><circle cx="69" cy="45" r="7"/><line x1="58" y1="45" x2="62" y2="45"/>
        <line x1="44" y1="44" x2="40" y2="42"/><line x1="76" y1="44" x2="80" y2="42"/>
      </g>`,
  },
  {
    id: 'shades', name: 'Cool Shades', slot: 'face', price: 140, rarity: 'rare', icon: '🕶️',
    svg: `
      <g fill="#1c1d22">
        <rect x="43" y="40" width="15" height="10" rx="4"/><rect x="62" y="40" width="15" height="10" rx="4"/>
      </g>
      <line x1="58" y1="43" x2="62" y2="43" stroke="#1c1d22" stroke-width="2.5"/>`,
  },
  {
    id: 'mustache', name: "Fancy 'Stache", slot: 'face', price: 140, rarity: 'rare', icon: '🥸',
    svg: `<path d="M60 60 Q52 56 46 60 Q52 62 60 60 Q68 62 74 60 Q68 56 60 60 Z" fill="#5a3a1c"/>`,
  },
  {
    id: 'starshades', name: 'Star Shades', slot: 'face', price: 600, rarity: 'legendary', icon: '⭐',
    svg: `
      <path d="M51 39 l2 5 5.4 .3 -4.2 3.4 1.4 5.2 -4.6 -2.9 -4.6 2.9 1.4 -5.2 -4.2 -3.4 5.4 -.3 Z" fill="#ff3d6e"/>
      <path d="M69 39 l2 5 5.4 .3 -4.2 3.4 1.4 5.2 -4.6 -2.9 -4.6 2.9 1.4 -5.2 -4.2 -3.4 5.4 -.3 Z" fill="#ffd24e"/>`,
  },
];

export const SLOTS = [
  { key: 'hat', label: 'Hats', empty: 'No Hat' },
  { key: 'face', label: 'Accessories', empty: 'No Accessory' },
  { key: 'top', label: 'Tops', empty: null },
  { key: 'bottom', label: 'Bottoms', empty: null },
  { key: 'shoes', label: 'Shoes', empty: null },
];

export const DEFAULT_EQUIP = {
  hat: 'chefhat',
  face: 'none',
  top: 'apron',
  bottom: 'trousers',
  shoes: 'clogs',
};

export const CLOTHING_BY_ID = Object.fromEntries(CLOTHING.map((c) => [c.id, c]));

// Items that cost nothing are owned from the start.
export function defaultOwnedClothing() {
  return CLOTHING.filter((c) => c.price === 0).map((c) => c.id);
}

export function clothingForSlot(slot) {
  return CLOTHING.filter((c) => c.slot === slot);
}

// Assemble the chef SVG from the body + the equipped item in each slot.
export function buildAvatar(equipped = {}) {
  const frag = (slot) => {
    const id = equipped[slot] || DEFAULT_EQUIP[slot];
    const item = CLOTHING_BY_ID[id] || CLOTHING_BY_ID[DEFAULT_EQUIP[slot]];
    return item ? item.svg : '';
  };
  return `<svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg" class="avatar-svg" aria-label="Your chef">
  ${BASE_LEGS}
  ${frag('bottom')}
  ${frag('shoes')}
  ${BASE_BODY}
  ${frag('top')}
  ${BASE_HEAD}
  ${frag('face')}
  ${frag('hat')}
</svg>`;
}
