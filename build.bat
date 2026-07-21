@echo off
cd /d "%~dp0parser"
echo Building WASM...
wasm-pack build --target web --out-dir ../web/pkg --release
if errorlevel 1 exit /b %errorlevel%

cd /d "%~dp0web"
echo Building web app...
call npm run build
if errorlevel 1 exit /b %errorlevel%

echo Done. Output in web/dist/
pause
