// mayo2_bridge.c - WASM bridge for MAYO-2
#include "../mayo-c/src/mayo_2/api.h"
#include <stdlib.h>
#include <string.h>

extern void randombytes_set_seed(const unsigned char *seed, size_t len);

// -- Persistent WASM heap buffers --
// Allocated once at init, reused across all sign/verify calls.
// Max message size: 1 MB. Adjust if needed.
#define MAX_MSG_SIZE (1024 * 1024)

static unsigned char *_msg_buf     = NULL;
static unsigned char *_sig_buf     = NULL;
static unsigned char *_sk_buf      = NULL;
static unsigned char *_pk_buf      = NULL;

// Must be called once before any sign/verify. Returns 0 on success.
int mayo_init_buffers(void) {
    if (_msg_buf) return 0; // already initialized
    _msg_buf = (unsigned char *)malloc(MAX_MSG_SIZE);
    _sig_buf = (unsigned char *)malloc(CRYPTO_BYTES);
    _sk_buf  = (unsigned char *)malloc(CRYPTO_SECRETKEYBYTES);
    _pk_buf  = (unsigned char *)malloc(CRYPTO_PUBLICKEYBYTES);
    if (!_msg_buf || !_sig_buf || !_sk_buf || !_pk_buf) return 1;
    return 0;
}

int keypair_from_seed(const unsigned char *seed,
                      unsigned char *cpk, unsigned char *csk) {
    randombytes_set_seed(seed, CRYPTO_SECRETKEYBYTES);
    return crypto_sign_keypair(cpk, csk);
}

// Uses pre-allocated buffers — no malloc/free on hot path.
// Returns 1 if msg is too large or buffers not initialized.
int sign(const unsigned char *msg, size_t msglen,
         const unsigned char *csk,
         unsigned char *sig, size_t *siglen) {
    if (!_msg_buf) return 1;
    if (msglen > MAX_MSG_SIZE) return 1;
    memcpy(_msg_buf, msg, msglen);
    memcpy(_sk_buf,  csk,  CRYPTO_SECRETKEYBYTES);
    int ret = crypto_sign_signature(_sig_buf, siglen, _msg_buf, msglen, _sk_buf);
    if (ret == 0) memcpy(sig, _sig_buf, *siglen);
    return ret;
}

int verify(const unsigned char *msg, size_t msglen,
           const unsigned char *sig,
           const unsigned char *cpk) {
    if (!_msg_buf) return 1;
    if (msglen > MAX_MSG_SIZE) return 1;
    memcpy(_msg_buf, msg, msglen);
    memcpy(_sig_buf, sig, CRYPTO_BYTES);
    memcpy(_pk_buf,  cpk, CRYPTO_PUBLICKEYBYTES);
    return crypto_sign_verify(_sig_buf, CRYPTO_BYTES, _msg_buf, msglen, _pk_buf);
}