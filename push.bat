@echo off
cd /d "%~dp0"
git add .
git commit -m "auto save: %date% %time%"
git push origin feature/alba
git checkout main
git merge feature/alba --no-edit
git push origin main
git checkout feature/alba
echo.
echo Done! GitHub updated (feature/alba + main).
pause
