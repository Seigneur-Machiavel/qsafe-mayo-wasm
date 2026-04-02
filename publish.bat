@echo off
echo Building qsafe-mayo-wasm...
call npm run build:min
echo.
set /p PUBLISH="Publish to npm? (y/n): "
if /i not "%PUBLISH%"=="y" (
    echo Build complete. Nothing published.
    pause
    exit /b 0
)
call npm version patch
call npm publish --access public
echo Done.
pause