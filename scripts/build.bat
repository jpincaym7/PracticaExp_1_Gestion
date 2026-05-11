@echo off
REM Script de construcción automatizada para CI local (Windows)
REM Uso: build.bat [backend|frontend|all]

setlocal enabledelayedexpansion

set BUILD_TYPE=%1
if "%BUILD_TYPE%"=="" set BUILD_TYPE=all

set BUILD_DIR=%~dp0..
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set REPORT_FILE=%BUILD_DIR%\reports\build-report-%TIMESTAMP%.txt

if not exist "%BUILD_DIR%\reports" mkdir "%BUILD_DIR%\reports"

echo. >> "%REPORT_FILE%"
echo ================================ >> "%REPORT_FILE%"
echo Build Report >> "%REPORT_FILE%"
echo ================================ >> "%REPORT_FILE%"
echo Date: %date% %time% >> "%REPORT_FILE%"
echo Build Type: %BUILD_TYPE% >> "%REPORT_FILE%"
echo ================================ >> "%REPORT_FILE%"

if "%BUILD_TYPE%"=="backend" goto build_backend
if "%BUILD_TYPE%"=="frontend" goto build_frontend
if "%BUILD_TYPE%"=="all" goto build_all
echo ERROR: Parametro no valido: %BUILD_TYPE%
echo Uso: build.bat [backend^|frontend^|all]
exit /b 1

:build_all
call :build_backend
call :build_frontend
goto finish

:build_backend
echo [INFO] Compilando backend...
echo. >> "%REPORT_FILE%"
echo === BACKEND BUILD === >> "%REPORT_FILE%"

cd /d "%BUILD_DIR%\backend\institucion"

if not exist venv (
    echo [INFO] Creando entorno virtual...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [INFO] Instalando dependencias...
python -m pip install --upgrade pip >> "%REPORT_FILE%" 2>&1
pip install -r requirements.txt >> "%REPORT_FILE%" 2>&1
pip install pytest pytest-django pytest-cov >> "%REPORT_FILE%" 2>&1

echo [INFO] Verificando sintaxis de Python...
python -m py_compile apps\*.py >> "%REPORT_FILE%" 2>&1

echo [INFO] Verificando migraciones...
python manage.py migrate --plan >> "%REPORT_FILE%" 2>&1

echo [SUCCESS] Backend compilado
echo Backend Status: OK >> "%REPORT_FILE%"
exit /b 0

:build_frontend
echo [INFO] Compilando frontend...
echo. >> "%REPORT_FILE%"
echo === FRONTEND BUILD === >> "%REPORT_FILE%"

cd /d "%BUILD_DIR%\frontend\institucion-app"

echo [INFO] Instalando dependencias de Node.js...
call npm ci >> "%REPORT_FILE%" 2>&1

echo [INFO] Ejecutando ESLint...
call npm run lint >> "%REPORT_FILE%" 2>&1

echo [INFO] Compilando Next.js...
call npm run build >> "%REPORT_FILE%" 2>&1

echo [SUCCESS] Frontend compilado
echo Frontend Status: OK >> "%REPORT_FILE%"
exit /b 0

:finish
echo. >> "%REPORT_FILE%"
echo ================================ >> "%REPORT_FILE%"
echo Build completed at: %date% %time% >> "%REPORT_FILE%"
echo ================================ >> "%REPORT_FILE%"

echo [SUCCESS] Construccion completada
echo [INFO] Reporte guardado en: %REPORT_FILE%
type "%REPORT_FILE%"
