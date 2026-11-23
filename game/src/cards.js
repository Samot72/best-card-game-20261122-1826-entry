// Emberfall cards: four original suits, each told apart by colour AND shape.
// Suits are drawn as inline SVG, never by text alone.
export const SUITS = {
  ember: { name: 'Ember', color: '#e5484d', dark: '#8f1d22', light: '#ff8a5c', glow: 'rgba(229,72,77,.55)',
    path: 'M12 2 C14.5 6 18 8 18 13 A6 6 0 1 1 6 13 C6 8 9.5 6 12 2 Z' },
  tide: { name: 'Tide', color: '#3e9bff', dark: '#144a8a', light: '#7fd4ff', glow: 'rgba(62,155,255,.55)',
    path: 'M12 2 C12 2 5 11 5 15 A7 7 0 0 0 19 15 C19 11 12 2 12 2 Z' },
  thorn: { name: 'Thorn', color: '#46a758', dark: '#1d5c2e', light: '#8fe388', glow: 'rgba(70,167,88,.55)',
    path: 'M20 4 C10 4 4 10 4 20 C14 20 20 14 20 4 Z M5 19 C9 15 13 11 19 5' },
  gale: { name: 'Gale', color: '#f5b83d', dark: '#8a5c00', light: '#ffe08a', glow: 'rgba(245,184,61,.55)',
    path: 'M13 2 L4 14 H11 L9 22 L20 9 H13 Z' },
};

export function suitIcon(suit, size = 22) {
  const s = SUITS[suit];
  return `<svg class="suit-icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">`
    + `<path d="${s.path}" fill="${s.color}" stroke="${s.dark}" stroke-width="1.4" stroke-linejoin="round"/>`
    + `</svg>`;
}

// Sigil shapes give every card its own piece of art (pure SVG, no files).
export const SIGILS = {
  triangle: 'M12 3 L21 20 L3 20 Z',
  diamond: 'M12 2 L20 12 L12 22 L4 12 Z',
  circle: 'M12 12 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0',
  star: 'M12 2 L14.6 8.6 L21.5 9 L16.4 13.4 L18 20.2 L12 16.6 L6 20.2 L7.6 13.4 L2.5 9 L9.4 8.6 Z',
  hex: 'M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z',
  ring: 'M12 12 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M12 12 m-3.5 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0',
};

export function sigilArt(card, size = 64) {
  const s = SUITS[card.suit];
  return `<svg class="sigil" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">`
    + `<defs><radialGradient id="sg-${card.id}" cx="50%" cy="35%" r="75%">`
    + `<stop offset="0%" stop-color="${s.light}"/><stop offset="60%" stop-color="${s.color}"/>`
    + `<stop offset="100%" stop-color="${s.dark}"/></radialGradient></defs>`
    + `<path d="${SIGILS[card.sigil]}" fill="url(#sg-${card.id})" stroke="${s.dark}" stroke-width="1" stroke-linejoin="round"/>`
    + `</svg>`;
}

// kind: 'creature' | 'spell'.  keywords: guard, swift.
// ability: draw1 | heal2 | heal1turn | ember1 | strike2 | auraThorn
export const CARD_DEFS = [
  // ---- Ember creatures ----
  { id: 'ember-imp', name: 'Ember Imp', suit: 'ember', kind: 'creature', cost: 1, atk: 2, hp: 1, sigil: 'triangle', keywords: ['swift'], text: 'Swift: strikes the turn it is played.' },
  { id: 'ember-hound', name: 'Cinder Hound', suit: 'ember', kind: 'creature', cost: 2, atk: 3, hp: 2, sigil: 'triangle', keywords: [], text: 'A fast bite from the ash fields.' },
  { id: 'ember-knight', name: 'Ash Knight', suit: 'ember', kind: 'creature', cost: 3, atk: 3, hp: 4, sigil: 'diamond', keywords: ['guard'], text: 'Guard: foes strike it first.' },
  { id: 'ember-sage', name: 'Pyre Sage', suit: 'ember', kind: 'creature', cost: 4, atk: 2, hp: 5, sigil: 'star', keywords: [], ability: 'ember1', text: 'At your turn start, burn the rival for 1.' },
  { id: 'ember-drake', name: 'Ember Drake', suit: 'ember', kind: 'creature', cost: 5, atk: 6, hp: 5, sigil: 'star', keywords: [], text: 'Wings of cinder, jaws of coal.' },
  // ---- Tide creatures ----
  { id: 'tide-sprite', name: 'Tide Sprite', suit: 'tide', kind: 'creature', cost: 1, atk: 1, hp: 2, sigil: 'circle', keywords: [], ability: 'draw1', text: 'When played, draw a card.' },
  { id: 'tide-warden', name: 'Tide Warden', suit: 'tide', kind: 'creature', cost: 2, atk: 2, hp: 3, sigil: 'hex', keywords: ['guard'], text: 'Guard: foes strike it first.' },
  { id: 'tide-serpent', name: 'Tide Serpent', suit: 'tide', kind: 'creature', cost: 3, atk: 4, hp: 3, sigil: 'circle', keywords: [], text: 'It coils where the current runs.' },
  { id: 'tide-monk', name: 'Mist Monk', suit: 'tide', kind: 'creature', cost: 3, atk: 1, hp: 4, sigil: 'ring', keywords: [], ability: 'heal2', text: 'When played, mend 2 life.' },
  { id: 'tide-leviathan', name: 'Tide Leviathan', suit: 'tide', kind: 'creature', cost: 6, atk: 7, hp: 7, sigil: 'hex', keywords: [], text: 'The whole sea, given teeth.' },
  // ---- Thorn creatures ----
  { id: 'thorn-sprout', name: 'Thorn Sprout', suit: 'thorn', kind: 'creature', cost: 1, atk: 1, hp: 3, sigil: 'diamond', keywords: [], text: 'Small, sharp, patient.' },
  { id: 'thorn-wolf', name: 'Briar Wolf', suit: 'thorn', kind: 'creature', cost: 2, atk: 3, hp: 2, sigil: 'triangle', keywords: ['swift'], text: 'Swift: strikes the turn it is played.' },
  { id: 'thorn-golem', name: 'Root Golem', suit: 'thorn', kind: 'creature', cost: 4, atk: 3, hp: 6, sigil: 'hex', keywords: ['guard'], text: 'Guard: foes strike it first.' },
  { id: 'thorn-dryad', name: 'Dryad Keeper', suit: 'thorn', kind: 'creature', cost: 3, atk: 2, hp: 4, sigil: 'ring', keywords: [], ability: 'heal1turn', text: 'At your turn start, mend 1 life.' },
  { id: 'thorn-queen', name: 'Thorn Queen', suit: 'thorn', kind: 'creature', cost: 5, atk: 5, hp: 5, sigil: 'star', keywords: [], ability: 'auraThorn', text: 'Your other Thorn creatures get +1 attack.' },
  // ---- Gale creatures ----
  { id: 'gale-sparrow', name: 'Gale Sparrow', suit: 'gale', kind: 'creature', cost: 1, atk: 2, hp: 1, sigil: 'circle', keywords: ['swift'], text: 'Swift: strikes the turn it is played.' },
  { id: 'gale-rogue', name: 'Storm Rogue', suit: 'gale', kind: 'creature', cost: 2, atk: 3, hp: 2, sigil: 'diamond', keywords: [], text: 'Gone before the thunder lands.' },
  { id: 'gale-herald', name: 'Wind Herald', suit: 'gale', kind: 'creature', cost: 3, atk: 2, hp: 3, sigil: 'ring', keywords: [], ability: 'draw1', text: 'When played, draw a card.' },
  { id: 'gale-griffin', name: 'Gale Griffin', suit: 'gale', kind: 'creature', cost: 4, atk: 4, hp: 4, sigil: 'star', keywords: ['swift'], text: 'Swift: strikes the turn it is played.' },
  { id: 'gale-titan', name: 'Storm Titan', suit: 'gale', kind: 'creature', cost: 6, atk: 6, hp: 6, sigil: 'hex', keywords: [], ability: 'strike2', text: 'When played, strike the rival for 2.' },
  // ---- Spells ----
  { id: 'emberbolt', name: 'Emberbolt', suit: 'ember', kind: 'spell', cost: 2, sigil: 'triangle', target: 'enemy', text: 'Deal 3 damage to an enemy creature or the rival.' },
  { id: 'tidewell', name: 'Tidewell', suit: 'tide', kind: 'spell', cost: 2, sigil: 'circle', text: 'Mend 5 life and draw a card.' },
  { id: 'thornwall', name: 'Thornwall', suit: 'thorn', kind: 'spell', cost: 3, sigil: 'hex', target: 'lane', text: 'Raise a 0/5 Thorn Wall with Guard in a lane you choose.' },
  { id: 'galestrike', name: 'Galestrike', suit: 'gale', kind: 'spell', cost: 4, sigil: 'diamond', text: 'Deal 2 damage to every enemy creature.' },
  { id: 'embernova', name: 'Ember Nova', suit: 'ember', kind: 'spell', cost: 5, sigil: 'star', text: 'Deal 4 damage to the rival.' },
  { id: 'tidecall', name: 'Tidecall', suit: 'tide', kind: 'spell', cost: 3, sigil: 'ring', text: 'Draw 3 cards.' },
  // ---- Summoned only (never in a deck) ----
  { id: 'thorn-wall', name: 'Thorn Wall', suit: 'thorn', kind: 'creature', cost: 0, atk: 0, hp: 5, sigil: 'hex', keywords: ['guard'], text: 'Guard. Raised by Thornwall.' },
];

export const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map((c) => [c.id, c]));

// A 30-card deck: every design once, plus a second copy of the four 1-cost scouts.
export function buildDeckIds() {
  const ids = CARD_DEFS.filter((c) => c.id !== 'thorn-wall').map((c) => c.id);
  ids.push('ember-imp', 'tide-sprite', 'thorn-sprout', 'gale-sparrow');
  return ids;
}
