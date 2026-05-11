@echo off
cd /d "%~dp0"
git add .
git commit -m "auto save: %date% %time%"
git push
echo.
echo Done! GitHub updated.
pause
