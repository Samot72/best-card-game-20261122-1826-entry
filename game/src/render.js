// Emberfall rendering: the whole table is plain DOM, re-rendered from state
// after every move, so what the screenshots show is the live game itself.
import { CONFIG, LANE_NAMES, LANE_SUBS } from './config.js';
import { SUITS, CARD_BY_ID, suitIcon, sigilArt } from './cards.js';
import { effectiveStats } from './state.js';

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function cardHtml(card, opts = {}) {
  const def = typeof card === 'object' && card !== null
    ? (CARD_BY_ID[card.id] || card)
    : CARD_BY_ID[card];
  const suit = SUITS[def.suit];
  const isSpell = def.kind === 'spell';
  const cls = [
    'card', `suit-${def.suit}`, isSpell ? 'spell' : 'creature',
    opts.selected ? 'selected' : '',
    opts.playable === false ? 'unplayable' : '',
    opts.targetable ? 'targetable' : '',
    opts.resonant ? 'resonant' : '',
    opts.small ? 'small' : '',
  ].filter(Boolean).join(' ');
  const kw = (def.keywords || []).map((k) => `<span class="kw">${esc(k.toUpperCase())}</span>`).join('');
  const stats = isSpell
    ? '<div class="stats"><span class="spell-tag">SPELL</span></div>'
    : `<div class="stats"><span class="atk" title="Attack">⚔ ${opts.atk ?? def.atk}</span>`
      + `<span class="hp" title="Health">♥ ${opts.hp ?? def.hp}</span></div>`;
  return `<div class="${cls}" data-card="${esc(def.id)}" ${opts.uid ? `data-uid="${opts.uid}"` : ''} `
    + `${opts.handIndex !== undefined ? `data-hand="${opts.handIndex}"` : ''} `
    + `${opts.lane !== undefined ? `data-lane="${opts.lane}"` : ''} role="button" tabindex="0" `
    + `aria-label="${esc(def.name)}, cost ${def.cost}${isSpell ? '' : `, ${def.atk} attack, ${def.hp} health`}">`
    + `<div class="cost" title="Mana cost">${def.cost}</div>`
    + `<div class="card-suit">${suitIcon(def.suit, opts.small ? 16 : 20)}</div>`
    + `<div class="art">${sigilArt(def, opts.small ? 44 : 58)}</div>`
    + `<div class="name">${esc(def.name)}</div>`
    + `<div class="text">${esc(def.text)}</div>${kw}${stats}</div>`;
}

export function cardBackHtml() {
  return '<div class="card back" aria-hidden="true"><div class="back-art">✦</div><div class="back-name">EMBERFALL</div></div>';
}

function hearts(n) { return '♥'.repeat(Math.max(0, Math.min(n, 20))); }

function manaHtml(mana, maxMana) {
  let out = '';
  for (let i = 0; i < CONFIG.maxMana; i++) {
    if (i < maxMana) out += `<span class="crystal ${i < mana ? 'full' : 'empty'}">◆</span>`;
    else out += '<span class="crystal dim">◇</span>';
  }
  return `<div class="mana" title="Mana crystals">${out}<span class="mana-num">${mana}/${maxMana}</span></div>`;
}

function heroHtml(side, game) {
  const s = game[side];
  const isFoe = side === 'foe';
  const targetable = game.targetMode === 'enemy' && isFoe;
  return `<div class="hero ${isFoe ? 'foe' : 'you'} ${targetable ? 'targetable' : ''}" data-hero="${side}">`
    + `<div class="portrait ${isFoe ? 'foe-face' : 'you-face'}">${isFoe ? 'M' : 'Y'}</div>`
    + `<div class="hero-info"><div class="hero-name">${esc(s.name || (isFoe ? 'Mira the Rival' : 'You'))}</div>`
    + `<div class="life" title="Life"><span class="life-num">${s.life}</span><span class="life-hearts">${hearts(s.life)}</span></div>`
    + `${manaHtml(s.mana, s.maxMana)}</div>`
    + `<div class="deck-count" title="Cards left in deck">Deck ${s.deck.queue.length}</div></div>`;
}

function laneHtml(game, li) {
  const lane = game.lanes[li];
  const foeCells = [];
  for (let i = 0; i < CONFIG.laneSlots; i++) {
    const c = lane.foe[i];
    if (!c) { foeCells.push('<div class="slot empty"></div>'); continue; }
    const { atk } = effectiveStats(game, c, li);
    foeCells.push(cardHtml(c, {
      uid: c.uid, lane: li, small: true, atk, hp: c.hp,
      resonant: effectiveStats(game, c, li).resonant,
      targetable: game.targetMode === 'enemy',
    }));
  }
  const youCells = [];
  for (let i = 0; i < CONFIG.laneSlots; i++) {
    const c = lane.you[i];
    if (!c) { youCells.push('<div class="slot empty"></div>'); continue; }
    const { atk } = effectiveStats(game, c, li);
    youCells.push(cardHtml(c, {
      uid: c.uid, lane: li, small: true, atk, hp: c.hp,
      resonant: effectiveStats(game, c, li).resonant,
    }));
  }
  const dropHint = game.selected && game.selected.kind === 'creature'
    ? ' drop-target' : (game.targetMode === 'lane' ? ' drop-target' : '');
  return `<section class="lane${dropHint}" data-lane="${li}" aria-label="${esc(LANE_NAMES[li])}">`
    + `<div class="lane-side foe-side">${foeCells.join('')}</div>`
    + `<div class="lane-mid"><span class="lane-name">${esc(LANE_NAMES[li])}</span>`
    + `<span class="lane-sub">${esc(LANE_SUBS[li])}</span></div>`
    + `<div class="lane-side you-side">${youCells.join('')}</div></section>`;
}

function handHtml(game) {
  return game.you.hand.map((id, i) => {
    const def = CARD_BY_ID[id];
    const playable = game.phase === 'player' && game.you.mana >= def.cost;
    const selected = game.selected && game.selected.handIndex === i;
    return cardHtml(id, { handIndex: i, playable, selected });
  }).join('');
}

function foeHandHtml(game) {
  return game.foe.hand.map(() => cardBackHtml()).join('');
}

function logHtml(game) {
  return game.log.map((line) => `<div class="log-line">${esc(line)}</div>`).join('');
}

export function renderTable(game) {
  const sel = game.selected ? CARD_BY_ID[game.you.hand[game.selected.handIndex]] : null;
  const hint = game.targetMode === 'enemy'
    ? 'Choose a target: an enemy creature, or Mira herself.'
    : game.targetMode === 'lane'
      ? 'Choose a lane for the Thorn Wall.'
      : game.selected
        ? (sel.kind === 'creature'
          ? `Click a lane to play ${sel.name} — or press 1–3.`
          : `Cast ${sel.name}?`)
        : game.message;
  const endDisabled = game.phase !== 'player';
  return `<div class="table">`
    + `<header class="topbar"><div class="brand">✦ EMBERFALL</div>`
    + `<div class="top-meta"><span>Round ${game.round}</span><span class="sep">·</span>`
    + `<span>Score <b>${game.score}</b></span><span class="sep">·</span>`
    + `<span>Duel of the Four Currents</span></div>`
    + `<div class="top-btns"><button data-act="mute" title="Mute (M)">♪</button>`
    + `<button data-act="restart" title="Restart (R)">↻</button>`
    + `<button data-act="help" title="How to play (H)">?</button></div></header>`
    + `<main class="board">`
    + `<section class="foe-row">${heroHtml('foe', game)}<div class="foe-hand">${foeHandHtml(game)}</div></section>`
    + `<section class="lanes">${game.lanes.map((_, li) => laneHtml(game, li)).join('')}</section>`
    + `<section class="you-row">${heroHtml('you', game)}<div class="hand" aria-label="Your hand">${handHtml(game)}</div></section>`
    + `</main>`
    + `<aside class="side">`
    + `<div class="hint" role="status">${esc(hint)}</div>`
    + `<button class="end-turn" data-act="end-turn" ${endDisabled ? 'disabled' : ''}>END TURN ⏎</button>`
    + (sel ? `<div class="selected-card"><div class="sel-title">Selected</div>${cardHtml(game.you.hand[game.selected.handIndex], { selected: true })}`
      + `<div class="sel-help">${sel.kind === 'creature' ? 'Click a lane (or press 1, 2, 3) to play it.' : sel.target === 'enemy' ? 'Click an enemy creature or Mira to cast it.' : sel.target === 'lane' ? 'Click a lane to raise the wall.' : 'Click again to cast it.'}</div></div>`
      : `<div class="rules-mini"><b>How a round works</b><br>1. Mana refills, draw 2 cards.<br>2. Play cards into the 3 lanes.<br>3. End Turn — the lanes clash.<br><br><b>Resonance:</b> two same-suit creatures in one lane get +1/+1.<br><b>Guard</b> must be struck first in its lane.<br><b>Swift</b> strikes the turn it is played.</div>`)
    + `<div class="log" aria-label="Battle log">${logHtml(game)}</div>`
    + `</aside></div>`;
}

function overlayHtml(kind, game) {
  if (kind === 'title') {
    return `<div class="overlay title-screen"><div class="title-inner">`
      + `<div class="title-kicker">A DUEL OF THE FOUR CURRENTS</div>`
      + `<h1>EMBERFALL</h1>`
      + `<div class="title-rule"></div>`
      + `<p class="tagline">Three lanes. Four currents. Twenty life.<br>Outplay Mira the Rival before she burns yours away.</p>`
      + `<div class="title-fan">${cardHtml('ember-drake', {})}${cardHtml('tide-leviathan', {})}${cardHtml('thorn-queen', {})}${cardHtml('gale-titan', {})}</div>`
      + `<button class="big-btn" data-act="start">▶ &nbsp;PLAY THE DUEL</button>`
      + `<div class="title-how"><span><b>1–7</b> select a card</span><span><b>Click a lane</b> to play it</span><span><b>Enter</b> ends the turn</span><span><b>M</b> mute</span></div>`
      + `<div class="title-foot">An original game — its names, art, suits and sounds were made for Emberfall. No network, no account, just the table.</div>`
      + `</div></div>`;
  }
  const won = kind === 'win';
  const s = game.stats;
  return `<div class="overlay ${won ? 'win-screen' : 'loss-screen'}"><div class="end-inner">`
    + `<div class="end-kicker">${won ? 'THE CURRENTS BOW TO YOU' : 'MIRA TAKES THE TABLE'}</div>`
    + `<h1>${won ? 'VICTORY' : 'DEFEAT'}</h1>`
    + `<p class="tagline">${won
      ? 'Mira\u2019s life runs dry. The table is yours — the four currents sing your name.'
      : 'Your life runs dry. Mira keeps the table… this time. Shuffle up and take it back.'}</p>`
    + `<div class="end-score"><span>FINAL SCORE</span><b>${game.score}</b></div>`
    + `<div class="end-stats">`
    + `<div><b>${s.rounds}</b><span>rounds</span></div>`
    + `<div><b>${s.dealt}</b><span>damage dealt</span></div>`
    + `<div><b>${s.played}</b><span>cards played</span></div>`
    + `<div><b>${game.you.life}</b><span>life left</span></div>`
    + `<div><b>${s.healed}</b><span>life mended</span></div>`
    + `</div>`
    + `<button class="big-btn" data-act="start">↻ &nbsp;PLAY AGAIN</button>`
    + `<div class="title-foot">Emberfall — Duel of the Four Currents</div>`
    + `</div></div>`;
}

export function render(game) {
  const app = document.getElementById('app');
  let html = renderTable(game);
  if (game.phase === 'title') html += overlayHtml('title', game);
  if (game.phase === 'win') html += overlayHtml('win', game);
  if (game.phase === 'loss') html += overlayHtml('loss', game);
  app.innerHTML = html;
  const status = document.getElementById('status');
  if (status) {
    status.textContent = game.phase === 'player'
      ? `Round ${game.round}. Your life ${game.you.life}, Mira's life ${game.foe.life}. Mana ${game.you.mana}.`
      : game.phase;
  }
}
