// mayo1_bridge.c - WASM bridge for MAYO-1
#include "../mayo-c/src/mayo_1/api.h"
#include <stdlib.h>
#include <string.h>

extern void randombytes_set_seed(const unsigned char *seed, size_t len);

static size_t          _max_msg_size = 0;
static unsigned char  *_msg_buf      = NULL;
static unsigned char  *_sig_buf      = NULL;
static unsigned char  *_sk_buf       = NULL;
static unsigned char  *_pk_buf       = NULL;
static size_t          _sig_len      = 0; // written by sign(), read by JS

int mayo_init_buffers(size_t max_msg_size) {
    if (_msg_buf) return 0;
    _max_msg_size = max_msg_size;
    _msg_buf = (unsigned char *)malloc(max_msg_size);
    _sig_buf = (unsigned char *)malloc(CRYPTO_BYTES);
    _sk_buf  = (unsigned char *)malloc(CRYPTO_SECRETKEYBYTES);
    _pk_buf  = (unsigned char *)malloc(CRYPTO_PUBLICKEYBYTES);
    if (!_msg_buf || !_sig_buf || !_sk_buf || !_pk_buf) return 1;
    return 0;
}

// Pointer accessors — called once at init by JS, then cached.
unsigned char *get_msg_buf(void) { return _msg_buf; }
unsigned char *get_sig_buf(void) { return _sig_buf; }
unsigned char *get_sk_buf(void)  { return _sk_buf;  }
unsigned char *get_pk_buf(void)  { return _pk_buf;  }
size_t         get_sig_len(void) { return _sig_len; }

int keypair_from_seed(const unsigned char *seed,
                      unsigned char *cpk, unsigned char *csk) {
    randombytes_set_seed(seed, CRYPTO_SECRETKEYBYTES);
    return crypto_sign_keypair(cpk, csk);
}

// Return codes for sign/verify
#define MAYO_ERR_MSG_TOO_LARGE 2
#define MAYO_ERR_NOT_INIT      3

int sign(size_t msglen) {
    if (!_msg_buf) return MAYO_ERR_NOT_INIT;
    if (msglen > _max_msg_size) return MAYO_ERR_MSG_TOO_LARGE;
    return crypto_sign_signature(_sig_buf, &_sig_len, _msg_buf, msglen, _sk_buf);
}

int verify(size_t msglen) {
    if (!_msg_buf) return MAYO_ERR_NOT_INIT;
    if (msglen > _max_msg_size) return MAYO_ERR_MSG_TOO_LARGE;
    return crypto_sign_verify(_sig_buf, CRYPTO_BYTES, _msg_buf, msglen, _pk_buf);
}