/* =========================================================================
   TOOL TEMPLATE — copy this file to add one of your existing tools.

   Steps to convert an existing Helpset tool:
   1. Copy this file to e.g. tools/now-next.js
   2. Paste your existing tool's HTML into the `el.innerHTML = ...` below
      (or build it with createElement — whatever you already do).
   3. Paste your existing JS logic inside mount(), but scope every lookup to
      the tool's own container: use `el.querySelector(...)` NOT
      `document.querySelector(...)`, so tools never clash with each other.
   4. Move any always-on setup (setInterval, addEventListener on window, etc.)
      so it can be torn down in unmount().
   5. In shared/router.js, set that tool's `ready: true`.

   Shared helpers live in /app/shared/ — import your card library, child lock,
   TTS, etc. here so all six tools reuse one copy:
     // import { cards } from '/app/shared/cards.js';
     // import { speak } from '/app/shared/tts.js';
   ========================================================================= */

// Keep references you need to clean up at module scope:
let cleanup = [];

export function mount(el) {
  el.innerHTML = `
    <section>
      <h1 style="font-family:var(--font-display)">Tool name</h1>
      <p style="color:var(--ink-soft)">Replace this with your tool.</p>
    </section>`;

  // Example of a listener registered for later cleanup:
  // const onKey = (e) => { /* ... */ };
  // window.addEventListener('keydown', onKey);
  // cleanup.push(() => window.removeEventListener('keydown', onKey));
}

export function unmount() {
  cleanup.forEach(fn => fn());
  cleanup = [];
}
