@echo off
REM ============================================================
REM  Sincronizza i file PHP root da dev a XAMPP htdocs.
REM
REM  Necessario perche' solo la cartella api/ e' symlinkata,
REM  mentre i file PHP nella root di gaurosa-site (api-products.php,
REM  api-product.php, api-config.php, ecc.) sono copie fisiche
REM  in C:\xampp\htdocs\gaurosa-site\ che vanno sincronizzate
REM  manualmente.
REM
REM  Lancia questo script ogni volta che modifichi un file PHP
REM  nella ROOT del progetto (non in api/ — quella va automatic).
REM ============================================================

set SRC=D:\Development\gaurosa-site
set DST=C:\xampp\htdocs\gaurosa-site

echo Sincronizzo PHP root dev -^> XAMPP...
echo.

for %%F in (
    api-config.php
    api-products.php
    api-product.php
    api-collections.php
    api-filters.php
    api-check-dependencies.php
    api-maintenance.php
    api-sync-attributes.php
    api-sync-batch-delete.php
) do (
    if exist "%SRC%\%%F" (
        copy /Y "%SRC%\%%F" "%DST%\%%F" >nul
        echo   [OK] %%F
    ) else (
        echo   [SKIP] %%F ^(non esiste in dev^)
    )
)

echo.
echo Fatto. PHP riletti automaticamente al prossimo request.
pause
