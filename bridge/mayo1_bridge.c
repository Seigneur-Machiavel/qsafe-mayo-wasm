// mayo_bridge.c - WASM bridge for MAYO-1
#include "../mayo-c/src/mayo_1/api.h"
#include <string.h>

extern void randombytes_set_seed(const unsigned char *seed, size_t len);

// Derives keypair deterministically from a 24-byte seed.
// randombytes_inject.c will consume the seed on the first randombytes() call
// made internally by crypto_sign_keypair — subsequent calls fall back to system entropy.
int keypair_from_seed(const unsigned char *seed,
                             unsigned char *cpk, unsigned char *csk) {
    randombytes_set_seed(seed, CRYPTO_SECRETKEYBYTES);
    return crypto_sign_keypair(cpk, csk);
}

int sign(const unsigned char *msg, size_t msglen,
               const unsigned char *csk,
               unsigned char *sig, size_t *siglen) {
    return crypto_sign_signature(sig, siglen, msg, msglen, csk);
}

int verify(const unsigned char *msg, size_t msglen,
                 const unsigned char *sig,
                 const unsigned char *cpk) {
    return crypto_sign_verify(sig, CRYPTO_BYTES, msg, msglen, cpk);
}