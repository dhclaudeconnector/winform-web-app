@echo off
echo ========================================
echo Starting WinForm Web App
echo ========================================
echo.

@REM Check PostgreSQL (optional)
@REM pg_isready -h localhost -p 5432 >nul 2>&1
@REM if errorlevel 1 (
@REM   echo PostgreSQL is not running. Please start PostgreSQL first.
@REM   exit /b 1
@REM )

echo Starting backend...
cd ..\backend
if not exist "node_modules" (
  echo Installing backend dependencies...
  call npm install
)

if not exist ".env" (
  echo .env file not found. Copying from .env.example...
  copy .env.example .env
  echo Please edit backend\.env with your database credentials
  pause
)

start "Backend Server" cmd /k npm run dev

echo Starting frontend...
cd ..\frontend
if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install
)

if not exist ".env.local" (
  echo Creating .env.local...
  copy .env.local.example .env.local
)

timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k npm run dev

cd ..\scripts

echo.
echo ========================================
echo All services started!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo ========================================
echo.
echo Press any key to stop all servers...
pause >nul

taskkill /FI "WindowTitle eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>&1

echo.
echo All servers stopped.
