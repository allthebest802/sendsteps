/* =========================================================================
   Visual Timer — WORKED EXAMPLE of the tool contract.

   This is a small, working timer so you can see the pattern live. It is NOT
   meant to replace your real Visual Timer — it's the wrapper shape you'll
   pour your existing timer's guts into.

   THE CONTRACT every tool follows:
     export function mount(el)   -> render your tool INTO `el`
     export function unmount()   -> stop timers / remove listeners (optional)

   TO USE YOUR REAL TIMER: keep mount()/unmount() as the outer shell, delete
   the demo body below, and paste your existing timer code inside — pointing
   it at elements you create under `el` instead of document.body.
   ========================================================================= */

let intervalId = null;

export function mount(el) {
  el.innerHTML = `
    <section style="text-align:center">
      <h1 style="font-family:var(--font-head);font-size:1.6rem;margin:.2em 0">Visual Timer</h1>
      <p style="color:var(--ink2);margin-top:0">Tap a length. Watch the ring empty.</p>

      <svg viewBox="0 0 120 120" width="240" height="240" role="img"
           aria-label="Time remaining" style="max-width:70vw;height:auto">
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--green-l)" stroke-width="12"/>
        <circle id="ring" cx="60" cy="60" r="54" fill="none" stroke="var(--green)"
                stroke-width="12" stroke-linecap="round" transform="rotate(-90 60 60)"/>
        <text id="label" x="60" y="66" text-anchor="middle"
              font-size="20" font-family="var(--font-head)" fill="var(--ink)">0:00</text>
      </svg>

      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:16px 0">
        <button class="btn btn--ghost" data-min="1">1 min</button>
        <button class="btn btn--ghost" data-min="2">2 min</button>
        <button class="btn btn--ghost" data-min="5">5 min</button>
        <button class="btn btn--ghost" data-min="10">10 min</button>
      </div>
      <button class="btn" id="stop">Stop</button>
    </section>`;

  const ring = el.querySelector('#ring');
  const label = el.querySelector('#label');
  const C = 2 * Math.PI * 54; // ring circumference
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = 0;

  let total = 0, left = 0;

  function draw() {
    const frac = total ? left / total : 0;
    ring.style.strokeDashoffset = C * (1 - frac);
    const m = Math.floor(left / 60), s = left % 60;
    label.textContent = `${m}:${String(s).padStart(2, '0')}`;
  }

  function start(mins) {
    clearInterval(intervalId);
    total = left = mins * 60;
    draw();
    intervalId = setInterval(() => {
      left = Math.max(0, left - 1);
      draw();
      if (left === 0) clearInterval(intervalId);
    }, 1000);
  }

  el.querySelectorAll('[data-min]').forEach(b =>
    b.addEventListener('click', () => start(+b.dataset.min)));
  el.querySelector('#stop').addEventListener('click', () => {
    clearInterval(intervalId); left = 0; draw();
  });

  draw();
}

export function unmount() {
  clearInterval(intervalId);
  intervalId = null;
}
