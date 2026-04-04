import Mayo1Module from './mayo1.cjs';
import Mayo2Module from './mayo2.cjs';

/** @typedef {{ secretKey: Uint8Array, publicKey: Uint8Array }} Keypair */

const SIZES = {
    mayo1: { secretKeySize: 24, publicKeySize: 1420, signatureSize: 454 },
    mayo2: { secretKeySize: 24, publicKeySize: 4912, signatureSize: 186 },
}; // Note: if we want to use MAYO5 we needs at least 40 bytes of seed.

function alloc(m, size) {
    const ptr = m._malloc(size);
    if (ptr === 0) throw new Error(`malloc failed (${size} bytes)`);
    return ptr;
}

export class MayoSigner {
    #m = null;
    #secretKey = null;
    #secretKeySize; #publicKeySize; #signatureSize;

    /** @param {string} [variant] Default: 'mayo1' */
    constructor(variant = 'mayo1') {
        if (variant !== 'mayo1' && variant !== 'mayo2') throw new Error(`Unsupported MAYO variant: ${variant}`);
        this.variant = variant;
        ({ secretKeySize: this.#secretKeySize,
           publicKeySize: this.#publicKeySize,
           signatureSize: this.#signatureSize } = SIZES[variant]);
    }

    /** Factory — preferred way to instantiate.
     * @param {string} [variant] Default: 'mayo1' */
    static async create(variant = 'mayo1') {
        const instance = new MayoSigner(variant);
        await instance.init();
        return instance;
    }

    /** Loads the WASM module. Must be called before any crypto operation if not using create(). */
    /*async init() {
        if (this.#m) return;
		if (this.variant === 'mayo1') this.#m = await Mayo1Module();
		else if (this.variant === 'mayo2') this.#m = await Mayo2Module();
		else throw new Error(`Unsupported MAYO variant: ${this.variant}`);
    }*/
	async init() {
		if (this.#m) return;
		if (this.variant === 'mayo1') this.#m = await Mayo1Module();
		else if (this.variant === 'mayo2') this.#m = await Mayo2Module();
		else throw new Error(`Unsupported MAYO variant: ${this.variant}`);
		
		// Initialize persistent WASM heap buffers
		if (this.#m._mayo_init_buffers() !== 0) throw new Error('mayo_init_buffers failed');
	}

    /** Indicates whether the WASM module is loaded and ready for crypto operations. */
    get ready() { return this.#m !== null; }

    #assertReady() {
        if (!this.#m) throw new Error('MayoSigner not initialized — call await init() first');
    }

    /** Derives a keypair deterministically from a seed, and loads the secret key.
     * @param {Uint8Array} seed - Must be exactly 24 bytes
     * @param {boolean} storeSecretKey - Whether to store the secret key internally for subsequent sign() calls. Set to false if you only need to generate keypair.
     * @returns {Keypair|null} null if key generation failed */
    keypairFromSeed(seed, storeSecretKey = true) {
        this.#assertReady();
        if (!(seed instanceof Uint8Array) || seed.length !== this.#secretKeySize)
            throw new TypeError(`seed must be a Uint8Array of ${this.#secretKeySize} bytes`);

        const m = this.#m;
        const seedPtr      = alloc(m, seed.length);
        const publicKeyPtr = alloc(m, this.#publicKeySize);
        const secretKeyPtr = alloc(m, this.#secretKeySize);

        m.HEAPU8.set(seed, seedPtr);
        const ret = m._keypair_from_seed(seedPtr, publicKeyPtr, secretKeyPtr);
        const keypair = ret === 0 ? {
            publicKey: m.HEAPU8.slice(publicKeyPtr, publicKeyPtr + this.#publicKeySize),
            secretKey: m.HEAPU8.slice(secretKeyPtr, secretKeyPtr + this.#secretKeySize),
        } : null;

        m._free(seedPtr); m._free(publicKeyPtr); m._free(secretKeyPtr);

        if (keypair && storeSecretKey) this.#secretKey = keypair.secretKey;
        return keypair;
    }

    /** Loads a secret key for subsequent sign() calls.
     * @param {Uint8Array} secretKey - Must be exactly 24 bytes */
    loadSecretKey(secretKey) {
        if (!(secretKey instanceof Uint8Array) || secretKey.length !== this.#secretKeySize)
            throw new TypeError(`secretKey must be a Uint8Array of ${this.#secretKeySize} bytes`);
        this.#secretKey = secretKey;
    }

    /** Signs a message using the loaded secret key.
     * @param {Uint8Array} msg @returns {Uint8Array|null} signature, or null if signing failed */
    sign(msg) {
        this.#assertReady();
        if (!this.#secretKey) throw new Error('No secret key loaded — call keypairFromSeed() or loadSecretKey() first');
        if (!(msg instanceof Uint8Array)) throw new TypeError('msg must be a Uint8Array');

        const m = this.#m;
        const msgPtr          = alloc(m, msg.length);
        const secretKeyPtr    = alloc(m, this.#secretKeySize);
        const signaturePtr    = alloc(m, this.#signatureSize);
        const signatureLenPtr = alloc(m, 4); // size_t in WASM32

        m.HEAPU8.set(msg, msgPtr);
        m.HEAPU8.set(this.#secretKey, secretKeyPtr);

        const ret = m._sign(msgPtr, msg.length, secretKeyPtr, signaturePtr, signatureLenPtr);
        const result = ret === 0 ? m.HEAPU8.slice(signaturePtr, signaturePtr + this.#signatureSize) : null;

        m._free(msgPtr); m._free(secretKeyPtr); m._free(signaturePtr); m._free(signatureLenPtr);
        return result;
    }

    /** Verifies a signature against a message and public key.
     * @param {Uint8Array} msg @param {Uint8Array} signature @param {Uint8Array} publicKey */
    verify(msg, signature, publicKey) {
        this.#assertReady();
        if (!(msg instanceof Uint8Array)) throw new TypeError('msg must be a Uint8Array');
        if (!(signature instanceof Uint8Array) || signature.length !== this.#signatureSize)
            throw new TypeError(`signature must be a Uint8Array of ${this.#signatureSize} bytes`);
        if (!(publicKey instanceof Uint8Array) || publicKey.length !== this.#publicKeySize)
            throw new TypeError(`publicKey must be a Uint8Array of ${this.#publicKeySize} bytes`);

        const m = this.#m;
        const msgPtr       = alloc(m, msg.length);
        const signaturePtr = alloc(m, this.#signatureSize);
        const publicKeyPtr = alloc(m, this.#publicKeySize);

        m.HEAPU8.set(msg, msgPtr);
        m.HEAPU8.set(signature, signaturePtr);
        m.HEAPU8.set(publicKey, publicKeyPtr);

        const ret = m._verify(msgPtr, msg.length, signaturePtr, publicKeyPtr);
        m._free(msgPtr); m._free(signaturePtr); m._free(publicKeyPtr);
        return ret === 0;
    }
}