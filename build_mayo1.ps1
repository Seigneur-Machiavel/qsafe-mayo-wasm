# build_mayo1.ps1
$env:PATH = "D:\dev\emsdk;D:\dev\emsdk\upstream\emscripten;" + $env:PATH

$MAYO = "./mayo-c/src"
$COMMON = "$MAYO/common"

emcc `
  bridge/mayo1_bridge.c `
  $MAYO/mayo.c `
  $MAYO/arithmetic.c `
  $MAYO/params.c `
  $MAYO/mayo_1/api.c `
  $COMMON/fips202.c `
  $COMMON/aes128ctr.c `
  $COMMON/aes_c.c `
  $COMMON/mem.c `
  bridge/randombytes_inject.c `
  -I ./mayo-c/include `
  -I ./mayo-c/src `
  -I ./mayo-c/src/common `
  -I ./mayo-c/src/generic `
  -I ./mayo-c/src/mayo_1 `
  -DENABLE_PARAMS_DYNAMIC `
  -msimd128 `
  -O3 `
  -flto `
  -o ./dist/mayo1.cjs `
  -s WASM=1 `
  -s "EXPORTED_FUNCTIONS=['_mayo_init_buffers','_keypair_from_seed','_sign','_verify','_malloc','_free','_get_msg_buf','_get_sig_buf','_get_sk_buf','_get_pk_buf','_get_sig_len']" `
  -s "EXPORTED_RUNTIME_METHODS=['HEAPU8']" `
  -s FILESYSTEM=0 `
  -s MODULARIZE=1 `
  -s EXPORT_NAME="Mayo1Module" `
  -s SINGLE_FILE=1 `
  -s STACK_SIZE=4194304  `
  -s INITIAL_MEMORY=8388608  `

Write-Host "Build done -> dist/mayo1.cjs"
node post-build.mjs
Write-Host "Post-build done -> dist/mayo1.js"