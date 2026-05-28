@echo off
REM Avvio Mailpit per intercettare le email in fase dev
REM SMTP: localhost:1025 (no auth)
REM UI web: http://localhost:8025
REM
REM Lascia questa finestra aperta durante lo sviluppo.

echo ============================================================
echo  Mailpit - Email catcher per gaurosa-site dev
echo ============================================================
echo  SMTP server:  localhost:1025
echo  Web UI:       http://localhost:8025
echo ============================================================
echo.

"%LOCALAPPDATA%\Microsoft\WinGet\Links\mailpit.exe" --smtp 0.0.0.0:1025 --listen 0.0.0.0:8025
