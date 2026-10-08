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

Single-page React 19 + Vite app that runs face detection fully client-side with `@vladmandic/face-api` (TinyFaceDetector). The user pastes an image URL; the image is loaded with `crossOrigin="anonymous"` (so only CORS-enabled hosts work), detected, and boxes are overlaid.

### TensorFlow.js backend selection (`src/tfBackend.js`)

`initBackend()` must resolve before any face-api model is loaded or run. It is memoized and:

1. Points tfjs's WASM backend at `.wasm` binaries imported via Vite `?url` from `@tensorflow/tfjs-backend-wasm` (a devDependency, pinned to `4.22.0` to match the tfjs bundled inside face-api). face-api ships the WASM glue but not the binaries; without `setWasmPaths` the SPA fallback serves `index.html` and WASM init fails with a magic-word error. All three path keys are required.
2. Disables WASM multithreading (no COOP/COEP headers are sent, so no `SharedArrayBuffer`).
3. Tries backends in order `webgl → wasm → cpu`. WebGL is pre-probed with the same context attributes tfjs uses (notably `failIfMajorPerformanceCaveat`), and each backend is validated by running a real kernel, because `setBackend` returning true doesn't guarantee it works.

Use `faceapi.tf` rather than importing `@tensorflow/tfjs` separately — face-api bundles its own tfjs instance.

### Model weights

TinyFaceDetector weights are served statically from `public/models/` and loaded via `faceapi.nets.tinyFaceDetector.loadFromUri("/models")`. Adding another face-api net (landmarks, expressions, etc.) means copying its manifest + `.bin` shards into `public/models/` and loading it after `initBackend()`.

### UI (`src/App.jsx`)

`App.jsx` holds two hooks and the `App` component, which only keeps the URL input text and renders:

- `useFaceApi` — backend init → model load → `ready`/`error`/`backend`.
- `useFaceDetection` — the scan flow. `scan(url)` bumps a scan id that is used as the `<img>` `key`, so every submit remounts the image and fires `load`/`error` even for the same URL; detection runs in that `onLoad` and drops its result if a newer scan started meanwhile. `status` goes `idle → loading → detecting → done | error`.

Detection boxes are in the image's natural pixel space. `fitContain` maps them onto the rendered `<img>` (size tracked with a `ResizeObserver` callback ref) and must stay in sync with `.canvas img`'s `object-fit: contain` in `App.css`.

Styling is plain CSS in `src/App.css` / `src/index.css` with a "HUD/scanner" aesthetic. The author signature link (`.sig` in `App.jsx`) and the author meta/backlink in `index.html` are intentional — keep them.
