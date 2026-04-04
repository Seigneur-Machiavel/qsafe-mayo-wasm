import { MayoSigner } from "../index.mjs";

const msg = new TextEncoder().encode('hello qsafe');

/** @param {'mayo1'|'mayo2'} variant */
async function testVariant(variant) {
    const mayo = await MayoSigner.create(variant);
    const seed1 = new Uint8Array(24).fill(1);
    const seed2 = new Uint8Array(24).fill(2);

    // -- Keypair determinism --
    const kp1a = mayo.keypairFromSeed(seed1);
    const kp1b = mayo.keypairFromSeed(seed1, false);
    console.assert(kp1a !== null, `${variant} keypair should not be null`);
    console.assert(kp1a.publicKey.every((b, i) => b === kp1b.publicKey[i]), `${variant} keypair should be deterministic`);
    console.log(`✓ ${variant} keypair determinism OK`);

    // -- Sign/verify roundtrip --
    const sig1 = mayo.sign(msg);
    console.assert(sig1 !== null, `${variant} signature should not be null`);
    console.assert(mayo.verify(msg, sig1, kp1a.publicKey), `${variant} signature should verify`);
    console.log(`✓ ${variant} sign/verify OK`);

    // -- Signature non-determinism (random salt) --
    const sig2 = mayo.sign(msg);
    console.assert(!sig1.every((b, i) => b === sig2[i]), `${variant} signatures should differ (random salt)`);
    console.assert(mayo.verify(msg, sig2, kp1a.publicKey), `${variant} second signature should also verify`);
    console.log(`✓ ${variant} signature non-determinism OK`);

    // -- Tampered message --
    const tamperedMsg = msg.slice();
    tamperedMsg[0] ^= 0xff;
    console.assert(!mayo.verify(tamperedMsg, sig1, kp1a.publicKey), `${variant} tampered msg should not verify`);
    console.log(`✓ ${variant} tampered message rejection OK`);

    // -- Tampered signature --
    const tamperedSig = sig1.slice();
    tamperedSig[0] ^= 0xff;
    console.assert(!mayo.verify(msg, tamperedSig, kp1a.publicKey), `${variant} tampered sig should not verify`);
    console.log(`✓ ${variant} tampered signature rejection OK`);

    // -- loadSecretKey --
    const mayo2 = await MayoSigner.create(variant);
    mayo2.loadSecretKey(kp1a.secretKey);
    const sig3 = mayo2.sign(msg);
    console.assert(mayo2.verify(msg, sig3, kp1a.publicKey), `${variant} loadSecretKey + sign should verify`);
    console.log(`✓ ${variant} loadSecretKey OK`);

    // -- Cross-key rejection --
    const kp2 = mayo.keypairFromSeed(seed2);
    console.assert(!mayo.verify(msg, sig1, kp2.publicKey), `${variant} signature should not verify with wrong key`);
    console.log(`✓ ${variant} cross-key rejection OK`);

    console.log(`✓ ${variant} all checks passed\n`);
}

await testVariant('mayo1');
await testVariant('mayo2');

console.log('-- TEST END --');