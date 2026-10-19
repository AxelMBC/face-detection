# Review: add-local-image-input

Snapshot: ce2a7788a860ffc05d2f089cfd1812f88f358993

1. [defect] src/components/ScanForm/useWindowImageInput.js:4 — resetting the depth counter on any `dragleave` with a null `relatedTarget` hides the overlay mid-drag in browsers that leave `relatedTarget` null on drag events (WebKit/Safari): `dragenter(B)` raises depth to 2, then `dragleave(A)` with null resets it to 0 while the file is still over the page. The reset isn't needed for a real exit, where the counter already reaches 0 · fixed
   Fix: only treat it as leaving when the pointer is outside the viewport, e.g. `e.relatedTarget === null && (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= innerWidth || e.clientY >= innerHeight)`; or drop the counter and drive `dragging` from `dragover` (it fires every ~50 ms), clearing it on `drop` or after ~150 ms without one (timer cleared in the effect cleanup)
2. [defect] src/components/Hud/Hud.css:52 — `.hud-value.source` gets `min-width: 0` but `.hud-label` keeps `flex-shrink: 1`, so a long file name shrinks the label too and `▸ SOURCE` wraps onto two lines instead of the value truncating · fixed
   Fix: add `flex-shrink: 0; white-space: nowrap;` to `.hud-label`, or give `.hud-value.source` `flex: 1 1 0; text-align: right;`
