/* =========================================================================
   Brain Battery — wrapper module.

   Your original app is UNCHANGED and lives in brain-battery.app.html (only its own
   service-worker registration was removed, since the shell now handles
   caching). This module just embeds that app and tears it down cleanly when
   the user leaves the tool. State (localStorage) and photo cards (IndexedDB)
   persist under the helpset.uk origin as normal.

   This is the "framed" pattern — best for complex, self-contained tools you
   don't want to rewrite. For simpler tools you can instead build the UI
   directly in mount() (see _template.js).
   ========================================================================= */

let frame = null;

export function mount(el) {
  el.replaceChildren();
  frame = document.createElement('iframe');
  frame.src = '/app/tools/brain-battery.app.html';
  frame.title = 'Brain Battery';
  frame.style.cssText =
    'width:100%;height:82dvh;border:0;border-radius:16px;' +
    'background:#f6f3ec;box-shadow:var(--shadow);display:block';
  el.appendChild(frame);
}

export function unmount() {
  if (frame) {
    frame.src = 'about:blank'; // stop the framed app before removal
    frame.remove();
    frame = null;
  }
}
