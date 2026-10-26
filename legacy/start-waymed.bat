@echo off
setlocal
set "ROOT=%~dp0"

if exist "%ROOT%.env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ROOT%.env") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)

if not exist "%ROOT%backend\.venv\Scripts\python.exe" (
  py -3 -m venv "%ROOT%backend\.venv"
  if errorlevel 1 goto :error
)

"%ROOT%backend\.venv\Scripts\python.exe" -m pip install -r "%ROOT%backend\requirements.txt"
if errorlevel 1 goto :error

if not exist "%ROOT%frontend\node_modules" (
  call npm --prefix "%ROOT%frontend" ci
  if errorlevel 1 goto :error
)

pushd "%ROOT%backend"
if errorlevel 1 goto :error
"%ROOT%backend\.venv\Scripts\python.exe" "scripts\seed.py"
if errorlevel 1 goto :error
popd

if not exist "%ROOT%backend\model_artifacts\department_model.joblib" (
  pushd "%ROOT%backend"
  if errorlevel 1 goto :error
  "%ROOT%backend\.venv\Scripts\python.exe" "scripts\train_recommender.py"
  if errorlevel 1 goto :error
  popd
)

start "WayMed API" /D "%ROOT%backend" cmd /k ""%ROOT%backend\.venv\Scripts\python.exe" -m uvicorn app.api:app --reload --host 127.0.0.1 --port 8000"
start "WayMed Web" /D "%ROOT%frontend" cmd /k "npm run dev"

echo WayMed is starting.
echo Web app: http://127.0.0.1:5173/
echo API docs: http://127.0.0.1:8000/docs
echo Close the WayMed API and WayMed Web windows to stop the demo.
exit /b 0

:error
echo WayMed could not start. Read the error above, fix it, and try again.
exit /b 1
