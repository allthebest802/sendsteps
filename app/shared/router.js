/* =========================================================================
   Router + hub for the Helpset combined app.

   HOW IT WORKS
   - One registry (TOOLS) describes every tool: id, name, blurb, icon,
     whether it's `ready`, and a `load()` that dynamically imports its module.
   - Each tool module exports `mount(element)` and, when it's replaced or the
     user navigates away, an optional `unmount()` for cleanup.
   - Routes are hash-based (#/timer), so this works on plain static hosting
     with NO server config and NO Netlify redirect rules.

   TO ADD A TOOL: set ready:true and point load() at its file. That's it.
   ========================================================================= */

const TOOLS = [
  {
    id: 'now-next', name: 'Now & Next', accent: 'teal', icon: '🔜',
    blurb: 'See what’s happening now and what comes next.',
    ready: true, load: () => import('/app/tools/now-next.js'),
  },
  {
    id: 'timer', name: 'Visual Timer', accent: 'green', icon: '⏱️',
    blurb: 'A coloured disc that shrinks as time passes.',
    ready: true, load: () => import('/app/tools/timer.js'),
  },
  {
    id: 'choice', name: 'Choice Board', accent: 'amber', icon: '✅',
    blurb: 'Tap to choose between two, three or four pictures.',
    ready: false, load: () => import('/app/tools/choice.js'),
  },
  {
    id: 'comm-cards', name: 'Communication Cards', accent: 'purple', icon: '🗣️',
    blurb: 'Tap a card and the phone says it out loud.',
    ready: false, load: () => import('/app/tools/comm-cards.js'),
  },
  {
    id: 'brain-battery', name: 'Brain Battery', accent: 'blue', icon: '🔋',
    blurb: 'An energy check-in your child can show you.',
    ready: false, load: () => import('/app/tools/brain-battery.js'),
  },
  {
    id: 'token-board', name: 'Token Board', accent: 'green', icon: '⭐',
    blurb: 'A visual reward chart when motivation needs a boost.',
    ready: false, load: () => import('/app/tools/token-board.js'),
  },
];

const mountEl = document.getElementById('app');
const backLink = document.querySelector('.app-bar__back');
let current = null; // the currently mounted tool module

function path() {
  return location.hash.replace(/^#/, '') || '/';
}

async function render() {
  // Let the previous tool clean up (stop timers, remove listeners, etc.)
  if (current && typeof current.unmount === 'function') {
    try { current.unmount(); } catch (e) { /* non-fatal */ }
  }
  current = null;
  mountEl.replaceChildren();

  const id = path().replace(/^\//, '');
  const tool = TOOLS.find(t => t.id === id && t.ready);

  if (!tool) {
    backLink.hidden = true;
    document.title = 'Helpset: SEND Toolkit';
    renderHub();
    mountEl.focus();
    return;
  }

  backLink.hidden = false;
  document.title = `${tool.name} · Helpset`;

  try {
    const mod = await tool.load();
    mod.mount(mountEl);
    current = mod;
  } catch (err) {
    console.error(err);
    mountEl.innerHTML =
      `<p>Sorry — that tool couldn’t load. <a href="#/">Back to all tools</a></p>`;
  }
  mountEl.focus();
}

function renderHub() {
  const grid = TOOLS.map(t => {
    const disabled = t.ready ? '' : 'aria-disabled="true"';
    const href = t.ready ? `href="#/${t.id}"` : 'href="#/"';
    const soon = t.ready ? '' : `<span class="tile__soon">Coming soon</span>`;
    return `
      <a class="tile" ${href} ${disabled}>
        <span class="tile__icon tile__icon--${t.accent}" aria-hidden="true">${t.icon}</span>
        <span class="tile__name">${t.name}</span>
        <span class="tile__blurb">${t.blurb}</span>
        ${soon}
      </a>`;
  }).join('');

  mountEl.innerHTML = `
    <section class="hub">
      <h1 class="hub__lead">Calm tools for SEND families.</h1>
      <p class="hub__sub">Free, offline, no accounts — nothing you add ever leaves your phone. Pick a tool to begin.</p>
      <div class="hub__grid">${grid}</div>
    </section>`;
}

window.addEventListener('hashchange', render);
window.addEventListener('load', render);
