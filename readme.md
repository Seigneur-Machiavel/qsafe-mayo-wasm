# qsafe-mayo-wasm 🔐

> Post-quantum signatures in WebAssembly — MAYO-1 & MAYO-2, browser & Node.js ready

JavaScript/WASM wrapper around [MAYO-C](https://github.com/PQCMayo/MAYO-C), a NIST post-quantum signature scheme. Ships as self-contained single-file modules with a unified JS API.

Special thanks to Ward Beullens and his team — post-quantum crypto is hard enough without having to invent it yourself.

## ⚠️ Security notice

**Do not use MAYO alone in production.**

MAYO-C is a relatively recent scheme and has not yet accumulated the same cryptanalytic scrutiny as classical algorithms. Until post-quantum cryptography matures further, always combine MAYO with a classical signature (e.g. Ed25519) in a hybrid double-signing scheme. This library is designed to be used as one half of such a pair.

This library is provided as-is, without warranty. It wraps MAYO-C via Emscripten and has not undergone independent security audit. Use at your own risk.

## Links

- **NPM:** [npmjs.com/package/@pinkparrot/qsafe-mayo-wasm](https://www.npmjs.com/package/@pinkparrot/qsafe-mayo-wasm)
- **Browser bundle:** [unpkg.com/@pinkparrot/qsafe-mayo-wasm/dist/mayo.browser.min.js](https://unpkg.com/@pinkparrot/qsafe-mayo-wasm/dist/mayo.browser.min.js)
- **MAYO spec:** [pqmayo.org](https://pqmayo.org)
- **MAYO-C source:** [github.com/PQCMayo/MAYO-C](https://github.com/PQCMayo/MAYO-C)

## Install
```bash
npm install @pinkparrot/qsafe-mayo-wasm
```

## Usage
```js
import { MayoSigner } from 'qsafe-mayo-wasm';

const mayo = await MayoSigner.create('mayo1'); // or 'mayo2'

// Generate a deterministic keypair from a 24-byte seed
// storeSecretKey (default true) — set to false if you only need the keypair bytes
const { publicKey, secretKey } = mayo.keypairFromSeed(seed);

// Sign
const signature = mayo.sign(msg);

// Verify (stateless — no secret key needed)
const valid = mayo.verify(msg, signature, publicKey);

// Load an existing secret key from a previous session
mayo.loadSecretKey(secretKey);
```

## API

### `MayoSigner.create(variant?)` → `Promise<MayoSigner>`
Factory method. Loads the WASM module and returns a ready instance.
- `variant`: `'mayo1'` (default) or `'mayo2'`

### `new MayoSigner(variant?)` + `await signer.init(maxMsgSize?)`
Alternative if you need manual lifecycle control.
- `maxMsgSize`: maximum message size in bytes (default: `204800` — 200 KB). Messages exceeding this will throw at sign/verify time.
- Use `signer.ready` to check initialization state.

### `keypairFromSeed(seed, storeSecretKey?)` → `Keypair | null`
Derives a keypair deterministically from a 24-byte `Uint8Array` seed.
- `storeSecretKey` (default `true`): stores the secret key internally for subsequent `sign()` calls.
- Returns `null` if key generation failed.

### `loadSecretKey(secretKey)`
Loads an existing 24-byte secret key for subsequent `sign()` calls.

### `sign(msg)` → `Uint8Array | null`
Signs a message using the loaded secret key.
- Returns `null` on failure.
- **Throws** if no secret key is loaded, or if the message exceeds `maxMsgSize`.

### `verify(msg, signature, publicKey)` → `boolean`
Verifies a signature. Stateless — no secret key required.
- **Throws** if the message exceeds `maxMsgSize`.

## Key & signature sizes

| Variant | Secret key | Public key | Signature |
|---------|-----------|------------|-----------|
| MAYO-1  | 24 B      | 1420 B     | 454 B     |
| MAYO-2  | 24 B      | 4912 B     | 186 B     |

MAYO-2 trades a larger public key for a smaller signature — useful when bandwidth matters more than storage.

## Building from source

Prerequisites:
- **Node.js** ≥ 22
- **Emscripten** (`emcc`) — see [emscripten.org](https://emscripten.org/docs/getting_started/downloads.html)
- **cmake** (tested with 4.x)

For exact Emscripten/cmake version requirements, see the [MAYO-C build notes](https://github.com/PQCMayo/MAYO-C).
```powershell
git clone --recurse-submodules https://github.com/Seigneur-Machiavel/qsafe-mayo-wasm
npm i --include=dev
.\build_mayo1.ps1   # → dist/mayo1.cjs + dist/mayo1.js
.\build_mayo2.ps1   # → dist/mayo2.cjs + dist/mayo2.js
npm run build       # → dist/mayo.browser.min.js  (browser bundle)
```

WASM is inlined in each `.js` file (`SINGLE_FILE=1`) — no separate `.wasm` asset needed.

## License

Apache-2.0 — see [LICENSE](./LICENSE).  
MAYO-C is also Apache-2.0 — see [mayo-c/LICENSE](./mayo-c/LICENSE).
MAYO-C NOTICE — see [NOTICE-MAYO-C](./NOTICE-MAYO-C)