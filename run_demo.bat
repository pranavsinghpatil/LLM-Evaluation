@echo off
echo ===================================================
echo   LLM Evaluation Pipeline - Demo Launcher
echo ===================================================

echo.
echo [1/3] Starting Backend API Server...
start "LLM Backend API" cmd /k "python src/api.py"

echo.
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Starting Frontend UI...
cd frontend
start "LLM Frontend UI" cmd /k "npm run dev"

echo.
echo [3/3] Opening Default Browser...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo ===================================================
echo   Demo is RUNNING!
echo   - Backend: http://localhost:8000
echo   - Frontend: http://localhost:5173
echo.
echo   Close the popup terminal windows to stop the demo.
echo ===================================================
pause
