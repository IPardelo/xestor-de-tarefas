@echo off
setlocal

REM Ir o directorio do proxecto
cd /d "%~dp0"

REM Arrancar Vite nunha venta aparte
start "Tarefas Dev Server" cmd /k "npm run dev"

REM Esperar un pouco a que o servidor arranque
timeout /t 3 /nobreak >nul

REM Abrir o navegador
start "" "http://localhost:5173"

endlocal
