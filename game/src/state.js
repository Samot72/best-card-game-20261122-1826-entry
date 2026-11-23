// Emberfall state: the whole game in one plain object, no DOM here.
// Sides: 'you' (bottom) and 'foe' (top). Lanes hold up to laneSlots creatures each.
import { CONFIG } from './config.js';
import { CARD_BY_ID } from './cards.js';
import { newDeck, drawFrom, makeCreature } from './deck.js';

let uidCounter = 1;
export function nextUid() { return uidCounter++; }

export function newGame(seed = 20261123) {
  const game = {
    seed,
    phase: 'title', // title | player | combat | ai | win | loss
    round: 1,
    turn: 'you',
    you: freshSide(seed),
    foe: freshSide(seed + 7919),
    lanes: [ [], [], [] ], // each lane: { you: Creature[], foe: Creature[] }
    log: [],
    selected: null, // { handIndex } or null
    targetMode: null, // 'enemy' | 'lane' | null (spell targeting)
    score: 0,
    stats: { played: 0, dealt: 0, healed: 0, rounds: 0 },
    message: '',
  };
  game.lanes = [[], [], []].map(() => ({ you: [], foe: [] }));
  return game;
}

function freshSide(seed) {
  return {
    life: CONFIG.startLife,
    mana: CONFIG.startMana,
    maxMana: CONFIG.startMana,
    deck: newDeck(seed),
    hand: [],
    name: '',
  };
}

export function startMatch(game) {
  // A fresh duel every time: new decks, empty lanes, full life.
  game.you = freshSide(game.seed);
  game.foe = freshSide(game.seed + 7919);
  game.lanes = [[], [], []].map(() => ({ you: [], foe: [] }));
  game.log = [];
  game.selected = null;
  game.targetMode = null;
  game.score = 0;
  game.stats = { played: 0, dealt: 0, healed: 0, rounds: 1 };
  game.phase = 'player';
  game.round = 1;
  game.turn = 'you';
  game.you.name = 'You';
  game.foe.name = 'Mira the Rival';
  game.you.hand = drawFrom(game.you.deck, CONFIG.startHand);
  game.foe.hand = drawFrom(game.foe.deck, CONFIG.startHand);
  game.you.mana = game.you.maxMana = CONFIG.startMana;
  game.foe.mana = game.foe.maxMana = CONFIG.startMana;
  game.log = ['The currents stir. Round 1 — your move.'];
  game.message = 'Play a card, then End Turn.';
}

export function log(game, text) {
  game.log.unshift(text);
  if (game.log.length > 6) game.log.length = 6;
}

// Effective attack: Resonance (+1/+1 while two same-suit creatures share a lane)
// plus the Thorn Queen aura (+1 attack to your other Thorn creatures).
export function effectiveStats(game, creature, laneIndex) {
  let atk = creature.atk;
  let hp = creature.hp;
  const lane = game.lanes[laneIndex][creature.owner];
  const sameSuit = lane.filter((c) => c.uid !== creature.uid && c.suit === creature.suit);
  if (sameSuit.length > 0) { atk += CONFIG.resonanceBonus; hp += CONFIG.resonanceBonus; }
  const queen = game.lanes.flatMap((l) => l[creature.owner])
    .some((c) => c.ability === 'auraThorn' && c.uid !== creature.uid);
  if (queen && creature.suit === 'thorn') atk += 1;
  return { atk, hp, resonant: sameSuit.length > 0 };
}

export function laneHasGuard(game, side, laneIndex) {
  return game.lanes[laneIndex][side].some((c) => c.keywords.includes('guard'));
}

export function canPlay(game, side, cardId) {
  const def = CARD_BY_ID[cardId];
  return def && game[side].mana >= def.cost;
}

export function playCard(game, side, handIndex, laneIndex = null, target = null) {
  const s = game[side];
  const cardId = s.hand[handIndex];
  if (!cardId) return { ok: false, why: 'No card there.' };
  const def = CARD_BY_ID[cardId];
  if (s.mana < def.cost) return { ok: false, why: `Need ${def.cost} mana.` };
  if (s.hand.length > CONFIG.maxHand) return { ok: false, why: 'Hand is full.' };

  if (def.kind === 'creature') {
    if (laneIndex === null || laneIndex < 0 || laneIndex > 2) return { ok: false, why: 'Choose a lane.' };
    if (game.lanes[laneIndex][side].length >= CONFIG.laneSlots) return { ok: false, why: 'That lane is full.' };
    s.mana -= def.cost;
    s.hand.splice(handIndex, 1);
    const creature = makeCreature(cardId, side, nextUid());
    game.lanes[laneIndex][side].push(creature);
    game.stats.played++;
    log(game, `${side === 'you' ? 'You play' : 'Mira plays'} ${def.name} (${def.cost} mana).`);
    applyOnPlay(game, side, creature);
    return { ok: true, creature };
  }

  // Spells.
  if (def.id === 'emberbolt') {
    if (!target) return { ok: false, why: 'Choose a target.', needTarget: 'enemy' };
    s.mana -= def.cost;
    s.hand.splice(handIndex, 1);
    dealDamageToTarget(game, side, target, 3);
    log(game, `${side === 'you' ? 'You cast' : 'Mira casts'} Emberbolt for 3.`);
    game.stats.played++;
    return { ok: true };
  }
  if (def.id === 'tidewell') {
    s.mana -= def.cost;
    s.hand.splice(handIndex, 1);
    heal(game, side, 5);
    const drawn = drawFrom(s.deck, 1);
    s.hand.push(...drawn.slice(0, Math.max(0, CONFIG.maxHand - s.hand.length)));
    log(game, `${side === 'you' ? 'You cast' : 'Mira casts'} Tidewell: +5 life, draw 1.`);
    game.stats.played++;
    return { ok: true };
  }
  if (def.id === 'thornwall') {
    if (laneIndex === null) return { ok: false, why: 'Choose a lane.', needTarget: 'lane' };
    if (game.lanes[laneIndex][side].length >= CONFIG.laneSlots) return { ok: false, why: 'That lane is full.' };
    s.mana -= def.cost;
    s.hand.splice(handIndex, 1);
    game.lanes[laneIndex][side].push(makeCreature('thorn-wall', side, nextUid()));
    log(game, `${side === 'you' ? 'You raise' : 'Mira raises'} a Thorn Wall.`);
    game.stats.played++;
    return { ok: true };
  }
  if (def.id === 'galestrike') {
    s.mana -= def.cost;
    s.hand.splice(handIndex, 1);
    for (let li = 0; li < 3; li++) {
      for (const c of game.lanes[li][side === 'you' ? 'foe' : 'you'].slice()) damageCreature(game, c, li, 2);
    }
    log(game, `${side === 'you' ? 'You cast' : 'Mira casts'} Galestrike: 2 to every enemy creature.`);
    game.stats.played++;
    return { ok: true };
  }
  if (def.id === 'embernova') {
    s.mana -= def.cost;
    s.hand.splice(handIndex, 1);
    damageFace(game, side === 'you' ? 'foe' : 'you', 4);
    log(game, `${side === 'you' ? 'You cast' : 'Mira casts'} Ember Nova for 4.`);
    game.stats.played++;
    return { ok: true };
  }
  if (def.id === 'tidecall') {
    s.mana -= def.cost;
    s.hand.splice(handIndex, 1);
    const drawn = drawFrom(s.deck, 3);
    const room = Math.max(0, CONFIG.maxHand - s.hand.length);
    s.hand.push(...drawn.slice(0, room));
    log(game, `${side === 'you' ? 'You cast' : 'Mira casts'} Tidecall: draw ${Math.min(3, room)}.`);
    game.stats.played++;
    return { ok: true };
  }
  return { ok: false, why: 'Unknown card.' };
}

function applyOnPlay(game, side, creature) {
  if (creature.ability === 'draw1') {
    const drawn = drawFrom(game[side].deck, 1);
    const room = Math.max(0, CONFIG.maxHand - game[side].hand.length);
    game[side].hand.push(...drawn.slice(0, room));
    log(game, `${creature.name} draws a card.`);
  }
  if (creature.ability === 'heal2') heal(game, side, 2);
  if (creature.ability === 'strike2') damageFace(game, side === 'you' ? 'foe' : 'you', 2);
}

export function heal(game, side, n) {
  const before = game[side].life;
  game[side].life = Math.min(CONFIG.maxLife, game[side].life + n);
  const gained = game[side].life - before;
  if (side === 'you') game.stats.healed += gained;
  if (gained > 0) log(game, `${side === 'you' ? 'You mend' : 'Mira mends'} ${gained} life.`);
}

export function damageFace(game, side, n) {
  game[side].life = Math.max(0, game[side].life - n);
  if (side === 'foe') { game.score += n * 10; game.stats.dealt += n; }
  log(game, `${side === 'you' ? 'You take' : 'Mira takes'} ${n} damage.`);
  checkEnd(game);
}

export function dealDamageToTarget(game, side, target, n) {
  // target: { type: 'face' } | { type: 'creature', lane, uid }
  if (target.type === 'face') {
    damageFace(game, side === 'you' ? 'foe' : 'you', n);
    return;
  }
  const lane = game.lanes[target.lane][side === 'you' ? 'foe' : 'you'];
  const c = lane.find((x) => x.uid === target.uid);
  if (c) damageCreature(game, c, target.lane, n);
}

export function damageCreature(game, creature, laneIndex, n) {
  creature.hp -= n;
  log(game, `${creature.name} takes ${n}.`);
  if (creature.hp <= 0) {
    const lane = game.lanes[laneIndex][creature.owner];
    const i = lane.findIndex((x) => x.uid === creature.uid);
    if (i >= 0) lane.splice(i, 1);
    game[creature.owner === 'you' ? 'foe' : 'you'].deck.discard.push(creature.id);
    log(game, `${creature.name} falls.`);
  }
}

// Combat: each lane, both sides strike across. Guards are struck first;
// a creature with no foe across the lane hits the rival's life instead.
// Swift creatures strike the turn they arrive; others wait one turn.
export function resolveCombat(game) {
  const events = [];
  for (let li = 0; li < 3; li++) {
    for (const side of ['you', 'foe']) {
      const foes = game.lanes[li][side === 'you' ? 'foe' : 'you'];
      for (const c of game.lanes[li][side].slice()) {
        // Summoning sickness: a creature played this turn only strikes at
        // once when it is Swift; the rest wait for the next clash.
        if (c.justPlayed && !c.keywords.includes('swift')) continue;
        const { atk } = effectiveStats(game, c, li);
        if (atk <= 0) continue;
        if (foes.length === 0) {
          damageFace(game, side === 'you' ? 'foe' : 'you', atk);
          events.push(`${c.name} hits the rival for ${atk}.`);
        } else {
          const guards = foes.filter((f) => f.keywords.includes('guard'));
          const target = guards.length > 0 ? guards[0] : foes[0];
          damageCreature(game, target, li, atk);
          events.push(`${c.name} hits ${target.name} for ${atk}.`);
        }
        if (game.phase === 'win' || game.phase === 'loss') return events;
      }
    }
    // End of lane: clear justPlayed flags for the next round.
    for (const side of ['you', 'foe']) {
      for (const c of game.lanes[li][side]) c.justPlayed = false;
    }
  }
  return events;
}

export function startTurn(game, side) {
  game.turn = side;
  const s = game[side];
  s.maxMana = Math.min(CONFIG.maxMana, game.round);
  s.mana = s.maxMana;
  const drawn = drawFrom(s.deck, CONFIG.drawPerTurn);
  const room = Math.max(0, CONFIG.maxHand - s.hand.length);
  s.hand.push(...drawn.slice(0, room));
  // Turn-start abilities.
  for (const lane of game.lanes) {
    for (const c of lane[side]) {
      if (c.ability === 'ember1') damageFace(game, side === 'you' ? 'foe' : 'you', 1);
      if (c.ability === 'heal1turn') heal(game, side, 1);
    }
  }
  if (game.phase === 'win' || game.phase === 'loss') return;
  game.phase = side === 'you' ? 'player' : 'ai';
  if (side === 'you') {
    game.message = `Round ${game.round} — ${s.mana} mana, ${drawn.length} cards drawn. Your move.`;
    log(game, `Round ${game.round}: you draw ${drawn.length}, ${s.mana} mana.`);
  }
}

export function endPlayerTurn(game) {
  if (game.phase !== 'player') return;
  game.phase = 'combat';
  game.message = 'The lanes clash…';
  resolveCombat(game);
  if (game.phase === 'win' || game.phase === 'loss') return;
  // The round number counts YOUR turns: it rises when the duel comes back
  // to you (in finishAiTurn), not here.
  startTurn(game, 'foe');
}

export function checkEnd(game) {
  if (game.you.life <= 0 && game.foe.life <= 0) {
    game.phase = 'win'; // A draw counts as a win for the player in this duel.
    finishScore(game);
    return;
  }
  if (game.foe.life <= 0) { game.phase = 'win'; finishScore(game); return; }
  if (game.you.life <= 0) { game.phase = 'loss'; finishScore(game); }
}

function finishScore(game) {
  game.score += game.you.life * CONFIG.winBonusPerLife;
  game.score += Math.max(0, 12 - game.round) * CONFIG.winBonusPerRound;
}
