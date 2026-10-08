import * as faceapi from '@vladmandic/face-api'
import wasmUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm?url'
import wasmSimdUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm?url'
import wasmThreadedSimdUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm?url'

const tf = faceapi.tf

// face-api bundles the wasm backend's glue JS but ships no .wasm binaries. Without
// this, the backend fetches /tfjs-backend-wasm-simd.wasm from the site root, gets
// index.html from the SPA fallback, and dies on `expected magic word 00 61 73 6d`.
// All three keys are mandatory — setWasmPaths throws if any is missing. Must run
// before any setBackend/ready call.
tf.setWasmPaths({
  'tfjs-backend-wasm.wasm': wasmUrl,
  'tfjs-backend-wasm-simd.wasm': wasmSimdUrl,
  'tfjs-backend-wasm-threaded-simd.wasm': wasmThreadedSimdUrl,
})

// Threading needs SharedArrayBuffer (COOP/COEP headers we don't send) and pulls in
// a sibling worker script. Pin it off so we always land on the plain SIMD binary.
tf.env().set('WASM_HAS_MULTITHREAD_SUPPORT', false)

const BACKENDS = ['webgl', 'wasm', 'cpu']

// Must mirror tfjs's own context attributes, or the probe is not predictive.
// failIfMajorPerformanceCaveat in particular is what rejects software rendering —
// with defaults the probe succeeds on machines where tfjs then fails.
const GL_ATTRS = {
  alpha: false,
  antialias: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  depth: false,
  stencil: false,
  failIfMajorPerformanceCaveat: true,
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2', GL_ATTRS) || canvas.getContext('webgl', GL_ATTRS),
    )
  } catch {
    return false
  }
}

// setBackend resolving true isn't proof the backend computes — force a real kernel.
async function trySetBackend(name) {
  try {
    if (!(await tf.setBackend(name))) return false
    await tf.ready()
    const probe = tf.square(tf.tensor1d([2]))
    try {
      await probe.data()
    } finally {
      probe.dispose()
    }
    return true
  } catch {
    return false
  }
}

let pending = null

async function selectBackend() {
  for (const name of BACKENDS) {
    // Skip the tfjs webgl path entirely when the context is unavailable, rather
    // than letting it fail loudly inside the library.
    if (name === 'webgl' && !hasWebGL()) continue
    if (await trySetBackend(name)) return name
  }
  throw new Error('No usable TensorFlow.js backend (tried webgl, wasm, cpu).')
}

/** Pin a working tf backend before any model load. Memoized. */
export function initBackend() {
  pending ??= selectBackend()
  return pending
}
