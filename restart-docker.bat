@echo off
echo === Buoc 1: Dung containers ===
docker-compose down

echo.
echo === Buoc 2: Rebuild containers (co the mat vai phut) ===
docker-compose build --no-cache

echo.
echo === Buoc 3: Khoi dong lai voi volumes mounted ===
docker-compose up -d

echo.
echo === Buoc 4: Doi containers khoi dong ===
timeout /t 5 /nobreak > nul

echo.
echo === Buoc 5: Kiem tra logs ===
echo Backend logs:
docker-compose logs --tail=20 backend

echo.
echo Frontend logs:
docker-compose logs --tail=20 frontend

echo.
echo === Buoc 6: Kiem tra files da mount ===
echo Checking backend files...
docker exec winform-backend ls -la /app/src/routes/permission.routes.js 2>nul && echo [OK] permission.routes.js exists || echo [ERROR] permission.routes.js NOT FOUND
docker exec winform-backend ls -la /app/src/services/permissionService.js 2>nul && echo [OK] permissionService.js exists || echo [ERROR] permissionService.js NOT FOUND

echo.
echo Checking frontend files...
docker exec winform-frontend ls -la /app/src/lib/store/permissionStore.ts 2>nul && echo [OK] permissionStore.ts exists || echo [ERROR] permissionStore.ts NOT FOUND
docker exec winform-frontend ls -la /app/src/lib/hooks/usePermission.ts 2>nul && echo [OK] usePermission.ts exists || echo [ERROR] usePermission.ts NOT FOUND

echo.
echo === Hoan tat! ===
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo De xem logs realtime:
echo   docker-compose logs -f backend
echo   docker-compose logs -f frontend

pause
