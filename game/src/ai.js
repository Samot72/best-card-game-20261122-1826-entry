// Mira the Rival: a readable heuristic opponent. She plays what she can
// afford, answers your strongest lane first, and never holds a killing blow.
import { CARD_BY_ID } from './cards.js';
import { canPlay, playCard, laneHasGuard } from './state.js';

export function planAiTurn(game) {
  // Returns a list of moves: { handIndex, lane, target } in play order.
  const moves = [];
  const foe = game.foe;
  let mana = foe.mana;

  // Work on a copy of the hand so indices stay valid as cards leave it.
  const hand = foe.hand.slice();
  const handIndexOf = (id, used) => {
    for (let i = 0; i < hand.length; i++) {
      if (hand[i] === id && !used.has(i)) return i;
    }
    return -1;
  };
  const used = new Set();

  // 1. Lethal check: Ember Nova / Emberbolt to the face when it ends the duel.
  for (const id of ['embernova', 'emberbolt']) {
    const i = handIndexOf(id, used);
    if (i < 0) continue;
    const def = CARD_BY_ID[id];
    if (mana < def.cost) continue;
    const dmg = id === 'embernova' ? 4 : 3;
    if (game.you.life <= dmg) {
      moves.push({ handIndex: i, lane: null, target: { type: 'face' } });
      used.add(i); mana -= def.cost;
      for (const m of moves) m.id = hand[m.handIndex];
      return moves;
    }
  }

  // 2. Remove your biggest threat with Emberbolt when it is worth it.
  const boltAt = handIndexOf('emberbolt', used);
  if (boltAt >= 0 && mana >= 2) {
    let best = null;
    for (let li = 0; li < 3; li++) {
      for (const c of game.lanes[li].you) {
        if (!best || c.atk > best.c.atk) best = { c, lane: li };
      }
    }
    if (best && best.c.atk >= 4) {
      moves.push({ handIndex: boltAt, lane: null, target: { type: 'creature', lane: best.lane, uid: best.c.uid } });
      used.add(boltAt); mana -= 2;
    }
  }

  // 3. Heal when hurt, draw when the hand is thin.
  const wellAt = handIndexOf('tidewell', used);
  if (wellAt >= 0 && mana >= 2 && game.foe.life <= 12) {
    moves.push({ handIndex: wellAt, lane: null, target: null });
    used.add(wellAt); mana -= 2;
  }
  const callAt = handIndexOf('tidecall', used);
  if (callAt >= 0 && mana >= 3 && foe.hand.length <= 3) {
    moves.push({ handIndex: callAt, lane: null, target: null });
    used.add(callAt); mana -= 3;
  }
  const strikeAt = handIndexOf('galestrike', used);
  if (strikeAt >= 0 && mana >= 4) {
    const enemyCount = game.lanes.reduce((n, l) => n + l.you.length, 0);
    if (enemyCount >= 3) {
      moves.push({ handIndex: strikeAt, lane: null, target: null });
      used.add(strikeAt); mana -= 4;
    }
  }

  // 4. Play creatures, strongest first, into the lane where you are weakest.
  const creatures = [];
  hand.forEach((id, i) => {
    if (used.has(i)) return;
    const def = CARD_BY_ID[id];
    if (def.kind === 'creature') creatures.push({ id, i, def });
  });
  creatures.sort((a, b) => (b.def.atk + b.def.hp) - (a.def.atk + a.def.hp));
  for (const { id, i, def } of creatures) {
    if (mana < def.cost) continue;
    const lane = pickLane(game, def);
    if (lane === -1) continue;
    moves.push({ handIndex: i, lane, target: null });
    used.add(i); mana -= def.cost;
  }

  // 5. Thornwall into the lane where your attack is heaviest.
  const wallAt = handIndexOf('thornwall', used);
  if (wallAt >= 0 && mana >= 3) {
    let lane = 0; let worst = -1;
    for (let li = 0; li < 3; li++) {
      const power = game.lanes[li].you.reduce((n, c) => n + c.atk, 0);
      if (power > worst) { worst = power; lane = li; }
    }
    if (worst > 0) {
      moves.push({ handIndex: wallAt, lane, target: null });
      used.add(wallAt); mana -= 3;
    }
  }
  // Tag every move with its card id: hand indices shift as cards leave the
  // hand, so execution finds the card by id in the live hand.
  for (const m of moves) m.id = hand[m.handIndex];
  return moves;
}

function pickLane(game, def) {
  // Prefer a lane with a same-suit ally (Resonance), then the lane where
  // the player is weakest, never a full lane.
  let best = -1; let bestScore = -Infinity;
  for (let li = 0; li < 3; li++) {
    if (game.lanes[li].foe.length >= 2) continue;
    const allies = game.lanes[li].foe;
    const enemies = game.lanes[li].you;
    let score = 0;
    if (allies.some((c) => c.suit === def.suit)) score += 3;
    if (laneHasGuard(game, 'foe', li)) score -= 1;
    score += (2 - enemies.length);
    score -= enemies.reduce((n, c) => n + c.atk, 0) * 0.4;
    if (def.keywords.includes('guard')) score += enemies.length > 0 ? 1 : 0;
    if (score > bestScore) { bestScore = score; best = li; }
  }
  return best;
}

// Execute one planned move against the live game (indices shift as cards
// leave the hand, so moves are applied by card id, not by stale index).
export function applyAiMove(game, move) {
  const foe = game.foe;
  const liveIndex = foe.hand.indexOf(move.id);
  if (liveIndex < 0) return false;
  const def = CARD_BY_ID[move.id];
  if (!canPlay(game, 'foe', move.id)) return false;
  const res = playCard(game, 'foe', liveIndex, move.lane, move.target);
  return res.ok;
}
