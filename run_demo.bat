@echo off
setlocal

echo ===================================================
echo   LLM Evaluation Pipeline - Demo Launcher
echo ===================================================

:: 1. Check if running from root
if not exist "src\api.py" (
    echo [ERROR] Please run this script from the project root directory.
    pause
    exit /b
)

:: 2. Check Python Environment
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b
)

:: 3. Install Backend Dependencies
echo.
echo [1/4] Installing/Verifying Backend Dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b
)

:: Download Spacy Model if missing
python -m spacy info en_core_web_sm >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Downloading Spacy model 'en_core_web_sm'...
    python -m spacy download en_core_web_sm
)

:: 4. Check & Clear Port 8000
echo.
echo [2/4] Checking Port 8000...
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo [WARN] Port 8000 is in use. Attempting to clear it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %%a >nul 2>&1
)

:: 5. Start Backend
echo.
echo [3/4] Starting Backend API Server (Port 8000)...
start "LLM Backend API" cmd /k "python src/api.py || pause"

:: Wait for backend
echo Waiting for backend to warm up...
timeout /t 5 /nobreak >nul

:: 6. Setup & Start Frontend
echo.
echo [4/4] Checking Frontend Dependencies...
cd frontend
if not exist "node_modules" (
    echo [INFO] First time run detected. Installing npm packages...
    call npm install
)

echo Starting Frontend UI (Default Port 5173)...
:: Start frontend and keep window open if it fails
start "LLM Frontend UI" cmd /k "npm run dev || pause"

:: 7. Launch Browser
echo.
echo Opening Default Browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ===================================================
echo   Demo is RUNNING!
echo   - Backend: http://localhost:8000/health
echo   - Frontend: http://localhost:5173
echo.
echo   Use the "JSON Upload" tab to test with sample files.
echo   Close the terminal windows to stop the demo.
echo ===================================================
pause
