// Emberfall boot: build the game, stage a screenshot state when asked
// (?shot=title|play|win|loss), render, and wire input. No network, no build.
import { newGame, damageFace } from './state.js';
import { CARD_BY_ID } from './cards.js';
import { render } from './render.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';

const errlog = document.getElementById('errlog');
window.addEventListener('error', (ev) => {
  if (errlog) errlog.textContent += `ERROR: ${ev.message}\n`;
});
window.addEventListener('unhandledrejection', (ev) => {
  if (errlog) errlog.textContent += `REJECTION: ${String(ev.reason)}\n`;
});

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
let game;
let instant = false;
if (shot) {
  game = stageShot(shot);
  instant = true;
  if (!game) {
    game = newGame(20261123);
    if (errlog) errlog.textContent += `ERROR: unknown shot "${shot}"\n`;
  }
} else {
  game = newGame(20261123);
}

render(game);
bindInput(game, () => render(game), { instant: instant || params.get('selftest') === '1' });

// Dev-only play-test (?selftest=1): drives the real click handlers — start,
// play a card into a lane, end the turn, run the AI instantly — then forces
// a win and a loss, and reports PASS/FAIL in the document title.
if (params.get('selftest') === '1') {
  const results = [];
  const check = (name, cond) => results.push(`${name}:${cond ? 'ok' : 'FAIL'}`);
  const click = (sel) => {
    const el = document.querySelector(sel);
    if (!el) { results.push(`missing:${sel}`); return false; }
    el.click();
    return true;
  };
  try {
    check('boot-title', game.phase === 'title');
    click('[data-act="start"]');
    check('start-player', game.phase === 'player');
    check('hand-4', game.you.hand.length === 4);
    // Play the first affordable card, whatever kind it is. The test grants
    // full mana so the hand's luck of the draw cannot fail the test.
    game.you.mana = game.you.maxMana = 10;
    render(game);
    let played = false;
    for (let i = 0; i < game.you.hand.length && !played; i++) {
      const def = CARD_BY_ID[game.you.hand[i]];
      if (game.you.mana < def.cost) continue;
      click(`[data-hand="${i}"]`);
      if (!game.selected) continue;
      if (def.kind === 'creature') { click('.lane[data-lane="0"]'); played = true; }
      else if (def.target === 'enemy') { click('[data-hero="foe"]'); played = true; }
      else if (def.target === 'lane') { click('.lane[data-lane="0"]'); played = true; }
      else { click(`[data-hand="${i}"]`); played = true; }
    }
    check('played', played && game.stats.played === 1);
    click('[data-act="end-turn"]');
    check('round-2', game.round === 2 && game.phase === 'player');
    check('ai-moved', game.log.length > 0);
    // Force both end states through the real damage path.
    damageFace(game, 'foe', 99);
    check('win-phase', game.phase === 'win');
    render(game);
    check('win-overlay', !!document.querySelector('.win-screen'));
    click('[data-act="start"]');
    damageFace(game, 'you', 99);
    check('loss-phase', game.phase === 'loss');
    render(game);
    check('loss-overlay', !!document.querySelector('.loss-screen'));
    check('no-errors', !errlog.textContent.includes('ERROR'));
  } catch (e) {
    results.push(`exception:${e.message}`);
  }
  document.title = `SELFTEST ${results.every((r) => !r.includes('FAIL') && !r.startsWith('missing') && !r.startsWith('exception')) ? 'PASS' : 'FAIL'} | ${results.join(' ')}`;
}

// Exposed for play-testing in a console, never for the game itself.
window.__emberfall = { game, render: () => render(game) };
