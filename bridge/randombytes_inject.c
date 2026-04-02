// randombytes_inject.c
// Replaces randombytes_system.c - handles both seed injection and real entropy.

#include <randombytes.h>
#include <string.h>
#include <emscripten.h>

static unsigned char _seed_buf[40]; // SK_SEED_BYTES_MAX
static size_t _pending_seed_len = 0;

void randombytes_set_seed(const unsigned char *seed, size_t len) {
    memcpy(_seed_buf, seed, len);
    _pending_seed_len = len;
}

void randombytes_init(unsigned char *entropy_input,
                      unsigned char *personalization_string,
                      int security_strength) {
    (void)entropy_input;
    (void)personalization_string;
    (void)security_strength;
}

int randombytes(unsigned char *x, size_t xlen) {
    if (_pending_seed_len > 0 && xlen <= _pending_seed_len) {
        memcpy(x, _seed_buf, xlen);
        _pending_seed_len = 0;
        return 0;
    }
    // Fallback: real entropy via platform crypto API
    return EM_ASM_INT(
        {
            try {
                var arr = new Uint8Array($1);
                globalThis.crypto.getRandomValues(arr);
                Module.HEAPU8.set(arr, $0);
                return 0;
            } catch(e) {
                return -1;
            }
        },
        x, xlen
    );
}