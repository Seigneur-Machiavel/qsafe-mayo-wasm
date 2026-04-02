# qsafe-mayo-wasm 🔐

> Post-quantum signatures in WebAssembly — MAYO-1 & MAYO-2, browser & Node.js ready

JavaScript/WASM wrapper around [MAYO-C](https://github.com/PQCMayo/MAYO-C), a NIST post-quantum signature scheme finalist. Ships as two self-contained single-file modules with an unified JS API.

## Links

- **NPM:** coming soon
- **MAYO spec:** [pqmayo.org](https://pqmayo.org)
- **MAYO-C source:** [github.com/PQCMayo/MAYO-C](https://github.com/PQCMayo/MAYO-C)

## Install
```bash
npm install qsafe-mayo-wasm
```

## Usage
```js
import { MayoSigner } from 'qsafe-mayo-wasm';

const mayo = await MayoSigner.create('mayo1'); // or 'mayo2'

// Generate a deterministic keypair from a 24-byte seed
const { publicKey, secretKey } = mayo.keypairFromSeed(seed);

// Sign
const signature = mayo.sign(msg);

// Verify (stateless — no secret key needed)
const valid = mayo.verify(msg, signature, publicKey);

// Load an existing secret key
mayo.loadSecretKey(secretKey);
```

## API

### `MayoSigner.create(variant?)` → `Promise<MayoSigner>`
Factory method. Loads the WASM module and returns a ready instance.
- `variant`: `'mayo1'` (default) or `'mayo2'`

### `new MayoSigner(variant?)` + `await signer.init()`
Alternative if you need manual lifecycle control.

### `keypairFromSeed(seed, storeSecretKey?)` → `Keypair | null`
Derives a keypair deterministically from a 24-byte `Uint8Array` seed.
Stores the secret key internally by default (`storeSecretKey = true`).

### `loadSecretKey(secretKey)`
Loads an existing secret key for subsequent `sign()` calls.

### `sign(msg)` → `Uint8Array | null`
Signs a message using the loaded secret key. Returns `null` on failure.

### `verify(msg, signature, publicKey)` → `boolean`
Verifies a signature. Stateless — no secret key required.

## Key sizes

| Variant | Secret key | Public key | Signature |
|---------|-----------|------------|-----------|
| MAYO-1  | 24 B      | 1420 B     | 454 B     |
| MAYO-2  | 24 B      | 4912 B     | 186 B     |

## Building from source

Requires [Emscripten](https://emscripten.org/docs/getting_started/downloads.html).
```powershell
git clone --recurse-submodules https://github.com/you/qsafe-mayo-wasm
.\build_mayo1.ps1   # → dist/mayo1.js
.\build_mayo2.ps1   # → dist/mayo2.js
```

WASM is inlined in each `.js` file (`SINGLE_FILE=1`) — no separate `.wasm` asset needed.

## License

Apache-2.0 — see [LICENSE](./LICENSE).  
MAYO-C is also Apache-2.0 — see [mayo-c/LICENSE](./mayo-c/LICENSE).