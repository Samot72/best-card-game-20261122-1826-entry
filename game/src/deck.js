// Emberfall decks: a small seeded RNG so screenshot states are reproducible.
import { buildDeckIds, CARD_BY_ID } from './cards.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(ids, rand) {
  const out = ids.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A deck is a queue of card ids plus a discard pile.
export function newDeck(seed) {
  const rand = mulberry32(seed);
  return { queue: shuffle(buildDeckIds(), rand), discard: [], rand };
}

export function drawFrom(deck, n) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (deck.queue.length === 0) {
      if (deck.discard.length === 0) break;
      deck.queue = shuffle(deck.discard, deck.rand);
      deck.discard = [];
    }
    drawn.push(deck.queue.shift());
  }
  return drawn;
}

export function makeCreature(cardId, owner, uid) {
  const def = CARD_BY_ID[cardId];
  return {
    uid, id: cardId, owner,
    name: def.name, suit: def.suit, kind: def.kind, cost: def.cost,
    atk: def.atk, hp: def.hp, maxHp: def.hp,
    keywords: def.keywords.slice(), ability: def.ability || null,
    text: def.text, sigil: def.sigil,
    justPlayed: true, // Swift creatures may strike the turn they arrive.
  };
}
