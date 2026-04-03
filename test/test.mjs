//import { MayoSigner } from '../dist/mayo_api.js';
import { MayoSigner } from "../dist/mayo.browser.min.js";

const msg = new TextEncoder().encode('hello qsafe');

/** @param {'mayo1'|'mayo2'} variant */
async function testVariant(variant) {
    const mayo = await MayoSigner.create(variant);
    const seed1 = new Uint8Array(24).fill(1);
    const seed2 = new Uint8Array(24).fill(2);

    // -- Keypair determinism --
    const kp1a = mayo.keypairFromSeed(seed1);
    const kp1b = mayo.keypairFromSeed(seed1, false); // no need to store twice
    console.assert(kp1a !== null, `${variant} keypair should not be null`);
    console.assert(kp1a.publicKey.every((b, i) => b === kp1b.publicKey[i]), `${variant} keypair should be deterministic`);
    console.log(`✓ ${variant} keypair determinism OK`);

    // -- Sign/verify roundtrip (secretKey stored from kp1a) --
    const signature = mayo.sign(msg);
    console.assert(signature !== null, `${variant} signature should not be null`);
    console.assert(mayo.verify(msg, signature, kp1a.publicKey), `${variant} signature should verify`);
    console.log(`✓ ${variant} sign/verify OK`);

    // -- loadSecretKey --
    const mayo2 = await MayoSigner.create(variant);
    mayo2.loadSecretKey(kp1a.secretKey);
    const signature2 = mayo2.sign(msg);
    console.assert(mayo2.verify(msg, signature2, kp1a.publicKey), `${variant} loadSecretKey + sign should verify`);
    console.log(`✓ ${variant} loadSecretKey OK`);

    // -- Cross-key rejection --
    const kp2 = mayo.keypairFromSeed(seed2); // stores seed2 secretKey
    console.assert(!mayo2.verify(msg, signature, kp2.publicKey), `${variant} signature should not verify with wrong key`);
    console.log(`✓ ${variant} cross-key rejection OK`);

    console.log(`✓ ${variant} all checks passed\n`);
}

await testVariant('mayo1');
await testVariant('mayo2');

console.log('All tests passed.');