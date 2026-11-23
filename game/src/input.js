// Emberfall input: click and keyboard, one handler each, wired by main.js.
// Clicking a hand card selects it; clicking a lane plays it there; a spell
// that needs a target waits for a click on a foe creature or on Mira.
import { CARD_BY_ID } from './cards.js';
import {
  newGame, playCard, endPlayerTurn, startMatch,
  resolveCombat, startTurn,
} from './state.js';
import { planAiTurn, applyAiMove } from './ai.js';
import { sfx, setMuted, isMuted } from './audio.js';

export function bindInput(game, rerender, opts = {}) {
  const instant = !!opts.instant; // shot mode: no AI delays, no sounds
  const app = document.getElementById('app');

  app.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-act]');
    if (btn) { handleAction(btn.dataset.act, game, rerender, instant); return; }
    if (game.phase !== 'player') return;

    // Targeting a spell: enemy creature, then Mira's portrait.
    if (game.targetMode === 'enemy') {
      const creatureEl = ev.target.closest('[data-uid]');
      const heroEl = ev.target.closest('[data-hero="foe"]');
      if (creatureEl || heroEl) {
        const target = creatureEl
          ? { type: 'creature', lane: Number(creatureEl.dataset.lane), uid: Number(creatureEl.dataset.uid) }
          : { type: 'face' };
        castSelected(game, target, rerender, instant);
        return;
      }
      game.targetMode = null; game.selected = null; rerender(); return;
    }
    if (game.targetMode === 'lane') {
      const laneEl = ev.target.closest('[data-lane]');
      if (laneEl) { castSelected(game, null, rerender, instant, Number(laneEl.dataset.lane)); return; }
      game.targetMode = null; game.selected = null; rerender(); return;
    }

    const handEl = ev.target.closest('[data-hand]');
    if (handEl) {
      const i = Number(handEl.dataset.hand);
      if (game.selected && game.selected.handIndex === i) {
        // Second click on a target-free spell casts it at once.
        const def = CARD_BY_ID[game.you.hand[i]];
        if (def.kind === 'spell' && !def.target) { castSelected(game, null, rerender, instant); return; }
        game.selected = null; rerender(); return;
      }
      selectCard(game, i, rerender, instant);
      return;
    }
    const laneEl = ev.target.closest('.lane[data-lane]');
    if (laneEl && game.selected) {
      const def = CARD_BY_ID[game.you.hand[game.selected.handIndex]];
      if (def.kind === 'creature') playSelectedInto(game, Number(laneEl.dataset.lane), rerender, instant);
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA')) return;
    const k = ev.key;
    if (k === 'm' || k === 'M') { setMuted(!isMuted()); rerender(); return; }
    if (k === 'r' || k === 'R') { handleAction('restart', game, rerender, instant); return; }
    if (k === 'h' || k === 'H') { handleAction('help', game, rerender, instant); return; }
    if (game.phase === 'title' || game.phase === 'win' || game.phase === 'loss') {
      if (k === 'Enter' || k === ' ') { ev.preventDefault(); handleAction('start', game, rerender, instant); }
      return;
    }
    if (game.phase !== 'player') return;
    if (k >= '1' && k <= '7') {
      const i = Number(k) - 1;
      if (i < game.you.hand.length) selectCard(game, i, rerender, instant);
      return;
    }
    if (k === 'Enter' || k === ' ') { ev.preventDefault(); handleAction('end-turn', game, rerender, instant); return; }
    if (k === 'Escape') { game.selected = null; game.targetMode = null; rerender(); return; }
    if (game.selected && ['1', '2', '3'].includes(k)) {
      const def = CARD_BY_ID[game.you.hand[game.selected.handIndex]];
      if (def.kind === 'creature') playSelectedInto(game, Number(k) - 1, rerender, instant);
    }
  });
}

function selectCard(game, i, rerender, instant) {
  const def = CARD_BY_ID[game.you.hand[i]];
  if (!def) return;
  if (game.you.mana < def.cost) {
    game.message = `Not enough mana for ${def.name} (${def.cost}).`;
    if (!instant) sfx.error();
    rerender();
    return;
  }
  game.selected = { handIndex: i };
  if (def.target === 'enemy') game.targetMode = 'enemy';
  else if (def.target === 'lane') game.targetMode = 'lane';
  else game.targetMode = null;
  if (!instant) sfx.select();
  rerender();
}

function afterAction(game, rerender, instant) {
  rerender();
  if (game.phase === 'ai') runAiTurn(game, rerender, instant);
  if (game.phase === 'win' && !instant) sfx.win();
  if (game.phase === 'loss' && !instant) sfx.loss();
}

function playSelectedInto(game, lane, rerender, instant) {
  const i = game.selected.handIndex;
  const res = playCard(game, 'you', i, lane, null);
  game.selected = null; game.targetMode = null;
  if (!res.ok) {
    game.message = res.why || 'Cannot play that there.';
    if (!instant) sfx.error();
    rerender();
    return;
  }
  if (!instant) sfx.play();
  afterAction(game, rerender, instant);
}

function castSelected(game, target, rerender, instant, lane = null) {
  const i = game.selected.handIndex;
  const res = playCard(game, 'you', i, lane, target);
  game.selected = null; game.targetMode = null;
  if (!res.ok) {
    game.message = res.why || 'Cannot cast that.';
    if (!instant) sfx.error();
    rerender();
    return;
  }
  if (!instant) sfx.play();
  afterAction(game, rerender, instant);
}

function handleAction(act, game, rerender, instant) {
  if (act === 'start') {
    startMatch(game);
    if (!instant) sfx.play();
    rerender();
    return;
  }
  if (act === 'restart') {
    // Rebuild in place so the bound handlers keep working.
    const g2 = newGame(game.seed + 1);
    Object.keys(game).forEach((k) => delete game[k]);
    Object.assign(game, g2);
    game.phase = 'title';
    rerender();
    return;
  }
  if (act === 'mute') { setMuted(!isMuted()); rerender(); return; }
  if (act === 'help') {
    game.message = 'Play cards into lanes, then End Turn. Same-suit pairs in a lane get +1/+1. Reduce Mira to 0 life.';
    rerender();
    return;
  }
  if (act === 'end-turn') {
    if (game.phase !== 'player') return;
    game.selected = null; game.targetMode = null;
    endPlayerTurn(game);
    rerender();
    if (game.phase === 'ai') runAiTurn(game, rerender, instant);
    if (game.phase === 'win' && !instant) sfx.win();
    if (game.phase === 'loss' && !instant) sfx.loss();
  }
}

function runAiTurn(game, rerender, instant) {
  const moves = planAiTurn(game);
  if (instant) {
    for (const m of moves) {
      if (game.phase === 'win' || game.phase === 'loss') break;
      applyAiMove(game, m);
    }
    finishAiTurn(game, rerender);
    return;
  }
  let step = 0;
  const tick = () => {
    if (game.phase !== 'ai') return;
    if (step < moves.length) {
      applyAiMove(game, moves[step]);
      step++;
      rerender();
      setTimeout(tick, 650);
      return;
    }
    finishAiTurn(game, rerender);
  };
  setTimeout(tick, 700);
}

function finishAiTurn(game, rerender) {
  if (game.phase !== 'ai') { rerender(); return; }
  game.phase = 'combat';
  game.message = 'The lanes clash…';
  resolveCombat(game);
  if (game.phase === 'win' || game.phase === 'loss') { rerender(); return; }
  game.round++;
  game.stats.rounds = game.round;
  startTurn(game, 'you');
  rerender();
}
