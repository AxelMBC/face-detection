# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is Yarn 1 (`packageManager` pinned in `package.json`; lockfile is `yarn.lock`).

- `yarn dev` — Vite dev server with HMR
- `yarn build` — production build to `dist/`
- `yarn preview` — serve the built `dist/`
- `yarn lint` — ESLint (flat config, `eslint.config.js`)

There is no test suite and no TypeScript; `yarn lint` and `yarn build` are the only automated checks. Detection behaviour can only be confirmed in a browser.

## Architecture

Single-page React 19 + Vite app that runs face detection fully client-side with `@vladmandic/face-api` (TinyFaceDetector). The user pastes an image URL, or picks, drops or pastes an image file; the image is loaded with `crossOrigin="anonymous"` (so only CORS-enabled hosts work for URLs; files become same-origin `blob:` object URLs), detected, and boxes are overlaid.

### TensorFlow.js backend selection (`src/detection/tfBackend.js`)

`initBackend()` must resolve before any face-api model is loaded or run. It is memoized and:

1. Points tfjs's WASM backend at `.wasm` binaries imported via Vite `?url` from `@tensorflow/tfjs-backend-wasm` (a devDependency, pinned to `4.22.0` to match the tfjs bundled inside face-api). face-api ships the WASM glue but not the binaries; without `setWasmPaths` the SPA fallback serves `index.html` and WASM init fails with a magic-word error. All three path keys are required.
2. Disables WASM multithreading (no COOP/COEP headers are sent, so no `SharedArrayBuffer`).
3. Tries backends in order `webgl → wasm → cpu`. WebGL is pre-probed with the same context attributes tfjs uses (notably `failIfMajorPerformanceCaveat`), and each backend is validated by running a real kernel, because `setBackend` returning true doesn't guarantee it works.

Use `faceapi.tf` rather than importing `@tensorflow/tfjs` separately — face-api bundles its own tfjs instance.

### Model weights

TinyFaceDetector weights are served statically from `public/models/` and loaded via `faceapi.nets.tinyFaceDetector.loadFromUri("/models")`. Adding another face-api net (landmarks, expressions, etc.) means copying its manifest + `.bin` shards into `public/models/` and loading it after `initBackend()`.

### UI

`src/App.jsx` is composition only: it calls the two detection hooks and passes props to the components. It holds no state of its own.

- `src/detection/` — `tfBackend.js`, plus the two hooks:
  - `useFaceApi` — backend init → model load → `ready`/`error`/`backend`.
  - `useFaceDetection({ ready })` — the scan flow. `scan(url)` is ignored until `ready`; otherwise it bumps a scan id that is used as the `<img>` `key`, so every submit remounts the image and fires `load`/`error` even for the same URL; detection runs in that `onLoad` and drops its result if a newer scan started meanwhile. `status` goes `idle → loading → detecting → done | error`. `scanFile(file, source)` goes through the same path with an object URL; the hook owns that URL and revokes it when the next scan starts and on unmount (not in `onLoad`, so a re-render of the same `<img>` still works). Non-`image/*` files are rejected without loading anything. `source` (URL host, file name or `CLIPBOARD`) feeds the HUD.
- `src/lib/format.js` — formatters shared by more than one component (`formatCount`, `formatIndex`, `formatScore`, `modelState`).
- `src/components/` — one `.jsx` + `.css` pair per visual block (`Header`, `Hero`, `Footer`, `Signature`), shared `Corners`, and folders for `ScanForm/`, `Stage/` and `Hud/`, which carry private helpers. Helpers live next to their only consumer and move to `lib/` once a second one appears.
- `ScanForm/` owns the URL input text and every input method: the URL form, the hidden file picker, and `useWindowImageInput`, which listens for file drags, drops and pastes on `window` (attached once, reading `enabled`/`onFile` via `useEffectEvent`) and drives `DropOverlay`. File drags always get `preventDefault` so the browser never opens the file; a file scan clears the URL input. `canScan` (the model is ready) gates all of them.
- `WorkspaceBoundary` wraps the stage + HUD in an error boundary keyed by scan id, so a render error shows a HUD-styled fallback instead of blanking the page, and the next scan retries.

Detection boxes are in the image's natural pixel space. `Stage` measures the rendered `<img>` with `useRenderedSize` (a stable `ResizeObserver` callback ref) and maps boxes with `fitContain`, all in `src/components/Stage/`. `fitContain` must stay in sync with `.canvas img`'s `object-fit: contain` in `Stage/Stage.css`.

Styling is plain CSS with a "HUD/scanner" aesthetic: tokens and base styles in `src/index.css`, layout and shared utilities (`.muted`, `.dot`, `.hud-error`) in `src/App.css`, everything else in each component's own stylesheet. The author signature link (`Signature.jsx`) and the author meta/backlink in `index.html` are intentional — keep them.
