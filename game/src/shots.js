// Emberfall screenshot staging: deterministic states painted by the same
// renderer the player sees, so every screenshot is a real game state.
import { CONFIG } from './config.js';
import { newGame, startMatch, nextUid } from './state.js';
import { makeCreature } from './deck.js';

function place(game, side, lane, cardId) {
  const c = makeCreature(cardId, side, nextUid());
  c.justPlayed = false;
  game.lanes[lane][side].push(c);
  return c;
}

function midGame(game) {
  startMatch(game);
  game.round = 4;
  game.stats.rounds = 4;
  game.you.life = 17;
  game.foe.life = 14;
  game.you.mana = 5; game.you.maxMana = 5;
  game.foe.mana = 4; game.foe.maxMana = 4;
  game.score = 120;
  game.stats.dealt = 9;
  game.stats.played = 7;
  game.stats.healed = 2;
  // A full, readable table: Resonance pair in lane 0, a Guard in lane 1.
  place(game, 'you', 0, 'ember-hound');
  place(game, 'you', 0, 'ember-imp');
  place(game, 'foe', 0, 'tide-serpent');
  place(game, 'you', 1, 'thorn-golem');
  place(game, 'foe', 1, 'ember-knight');
  place(game, 'you', 2, 'gale-griffin');
  place(game, 'foe', 2, 'gale-rogue');
  place(game, 'foe', 2, 'thorn-wolf');
  game.you.hand = ['ember-drake', 'tidewell', 'thorn-queen', 'galestrike', 'tide-serpent', 'emberbolt'];
  game.foe.hand = ['ember-imp', 'tide-sprite', 'thorn-sprout', 'gale-sparrow', 'tide-warden'];
  game.you.deck.queue = game.you.deck.queue.slice(0, 18);
  game.foe.deck.queue = game.foe.deck.queue.slice(0, 19);
  game.selected = { handIndex: 0 };
  game.log = [
    'Ember Drake waits in your hand — 5 mana.',
    'Gale Griffin hits Tide Serpent for 4.',
    'Resonance! Your Ember pair in Ashen Field strikes +1.',
    'Mira plays Cinder Hound (2 mana).',
    'Round 4 — your move.',
  ];
  game.message = 'Play a card, then End Turn.';
  game.phase = 'player';
}

export function stageShot(name) {
  const game = newGame(20261123);
  if (name === 'title') {
    game.phase = 'title';
    return game;
  }
  if (name === 'play') {
    midGame(game);
    return game;
  }
  if (name === 'win') {
    midGame(game);
    game.round = 7;
    game.you.life = 9;
    game.foe.life = 0;
    game.score = 1240;
    game.stats = { played: 14, dealt: 22, healed: 5, rounds: 7 };
    game.phase = 'win';
    return game;
  }
  if (name === 'loss') {
    midGame(game);
    game.round = 6;
    game.you.life = 0;
    game.foe.life = 12;
    game.score = 310;
    game.stats = { played: 11, dealt: 11, healed: 3, rounds: 6 };
    game.phase = 'loss';
    return game;
  }
  return null;
}

export const SHOT_NAMES = ['title', 'play', 'win', 'loss'];
