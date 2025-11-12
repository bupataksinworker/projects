@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ==============================================
::  mongo_export_CSV_JSON_to_gdrive.bat
::  รวมการ export JSON + CSV + copy ไป GDrive
::  เวอร์ชันล่าสุด (2025)
:: ==============================================

:: การใช้งาน:
:: mongo_export_CSV_JSON_to_gdrive.bat collection "field1,field2,field3,..."

:: ---------------- CONFIG ----------------
set "DBNAME=bupataksin"
set "BACKUP_DIR=C:\mongo_backup"
set "TOOLS_PATH=C:\Program Files\MongoDB\Tools\bin"
set "DRIVE_TARGET=G:\My Drive\MongoBackups"
set "LOGFILE=%BACKUP_DIR%\export.log"
:: ----------------------------------------

:: ถ้าต้องการปิดการสร้าง JSON ชั่วคราว ให้ตั้งค่า SKIP_JSON=1
:: ปัจจุบันตั้งเป็น 1 เพื่อปิด JSON โดยค่าเริ่มต้น (เปลี่ยนเป็นคอมเมนต์หรือลบเพื่อเปิด)
set "SKIP_JSON=1"

set "COLLECTION=%~1"
set "FIELDS=%~2"

if "%COLLECTION%"=="" (
  echo [ERROR] ต้องระบุชื่อ collection เช่น:
  echo   %~nx0 saleentrys "field1,field2,field3"
  exit /b 2
)

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set "JSON_FILE=%BACKUP_DIR%\%COLLECTION%.json"
set "CSV_FILE=%BACKUP_DIR%\%COLLECTION%.csv"
set "TMP_CSV=%BACKUP_DIR%\%COLLECTION%.tmp.csv"
set "BOM_FILE=%BACKUP_DIR%\__BOM.bin"

echo ========================================================== >> "%LOGFILE%"
echo [%date% %time%] เริ่ม export collection %COLLECTION% >> "%LOGFILE%"
echo ========================================================== >> "%LOGFILE%"

:: ---------- STEP 1: Export JSON (skippable) ----------
if not defined SKIP_JSON (
  echo [%date% %time%] Export JSON... >> "%LOGFILE%"
  "%TOOLS_PATH%\mongoexport.exe" ^
    --db "%DBNAME%" ^
    --collection "%COLLECTION%" ^
    --out "%JSON_FILE%" ^
    --jsonArray >> "%LOGFILE%" 2>&1
  set "RC_JSON=%ERRORLEVEL%"

  if not exist "%JSON_FILE%" (
    echo [%date% %time%] ❌ ERROR: ไม่พบไฟล์ JSON >> "%LOGFILE%"
    echo Export JSON ล้มเหลว
    exit /b 3
  ) else (
    echo [%date% %time%] ✅ JSON export เสร็จ rc=%RC_JSON% >> "%LOGFILE%"
  )
)
if defined SKIP_JSON (
  echo [%date% %time%] ⚠️ ข้ามการสร้าง JSON ตามการตั้งค่า SKIP_JSON >> "%LOGFILE%"
  set "RC_JSON=0"
)

:: ---------- STEP 2: Export CSV ----------
if "%FIELDS%"=="" (
  echo [%date% %time%] ⚠️ ไม่ได้ระบุ fields สำหรับ CSV export — จะข้ามการสร้าง CSV >> "%LOGFILE%"
  set "SKIP_CSV=1"
)

if not defined SKIP_CSV (
  echo [%date% %time%] Export CSV... >> "%LOGFILE%"
  :: Log the exact mongoexport command for debugging
  echo [%date% %time%] CMD: "%TOOLS_PATH%\mongoexport.exe" --db "%DBNAME%" --collection "%COLLECTION%" --type=csv --fields "%FIELDS%" --out "%TMP_CSV%" >> "%LOGFILE%"
  "%TOOLS_PATH%\mongoexport.exe" ^
    --db "%DBNAME%" ^
    --collection "%COLLECTION%" ^
    --type=csv ^
    --fields "%FIELDS%" ^
    --out "%TMP_CSV%" >> "%LOGFILE%" 2>&1
  set "RC_CSV=%ERRORLEVEL%"

  if not exist "%TMP_CSV%" (
    echo [%date% %time%] ❌ ERROR: ไม่พบไฟล์ CSV >> "%LOGFILE%"
    echo Export CSV ล้มเหลว
    exit /b 5
  )
else (
  echo [%date% %time%] ข้ามการสร้าง CSV เพราะไม่ได้ระบุ fields >> "%LOGFILE%"
)

:: ---------- STEP 3: Add UTF-8 BOM ----------
echo [%date% %time%] เพิ่ม BOM ให้ไฟล์ CSV... >> "%LOGFILE%"
powershell -NoProfile -Command ^
  " [IO.File]::WriteAllBytes('%BOM_FILE%', [System.Text.Encoding]::UTF8.GetPreamble()) " >> "%LOGFILE%" 2>&1

if not exist "%BOM_FILE%" (
  echo [%date% %time%] ❌ ERROR: ไม่สามารถสร้าง BOM file >> "%LOGFILE%"
  exit /b 6
)

if not defined SKIP_CSV (
  copy /b "%BOM_FILE%" + "%TMP_CSV%" "%CSV_FILE%" >nul 2>&1
  if exist "%CSV_FILE%" (
    del /f /q "%TMP_CSV%" "%BOM_FILE%" >nul 2>&1
    echo [%date% %time%] ✅ สร้างไฟล์ CSV เรียบร้อย: "%CSV_FILE%" >> "%LOGFILE%"
  ) else (
    echo [%date% %time%] ❌ ERROR: สร้างไฟล์ CSV ไม่สำเร็จ >> "%LOGFILE%"
    exit /b 7
  )
)
if defined SKIP_CSV (
  echo [%date% %time%] ⚠️ ข้ามการสร้าง CSV ตามการตั้งค่า SKIP_CSV >> "%LOGFILE%"
)

:: ---------- STEP 4: Copy to Google Drive ----------
echo [%date% %time%] กำลัง copy ไปยัง GDrive... >> "%LOGFILE%"
:: หากมีไฟล์เก่า ให้ลบทิ้งก่อนเพื่อความสะอาด
if not defined SKIP_JSON (
  if exist "%DRIVE_TARGET%\%COLLECTION%.json" (
    del /f /q "%DRIVE_TARGET%\%COLLECTION%.json" >> "%LOGFILE%" 2>&1
  )
  copy /Y "%JSON_FILE%" "%DRIVE_TARGET%\%COLLECTION%.json" >> "%LOGFILE%" 2>&1
  set "RC_COPY_JSON=%ERRORLEVEL%"
) else (
  echo [%date% %time%] ⚠️ ข้ามการ copy JSON ตามการตั้งค่า SKIP_JSON >> "%LOGFILE%"
  set "RC_COPY_JSON=0"
)

if not defined SKIP_CSV (
  if exist "%DRIVE_TARGET%\%COLLECTION%.csv" (
    del /f /q "%DRIVE_TARGET%\%COLLECTION%.csv" >> "%LOGFILE%" 2>&1
  )
  copy /Y "%CSV_FILE%" "%DRIVE_TARGET%\%COLLECTION%.csv" >> "%LOGFILE%" 2>&1
  set "RC_COPY_CSV=%ERRORLEVEL%"
) else (
  echo [%date% %time%] ⚠️ ข้ามการ copy CSV ตามการตั้งค่า SKIP_CSV >> "%LOGFILE%"
  set "RC_COPY_CSV=0"
)

if "%RC_COPY_JSON%"=="0" (
  echo [%date% %time%] ✅ JSON copy สำเร็จ >> "%LOGFILE%"
) else (
  echo [%date% %time%] ❌ ERROR copy JSON rc=%RC_COPY_JSON% >> "%LOGFILE%"
)

if "%RC_COPY_CSV%"=="0" (
  echo [%date% %time%] ✅ CSV copy สำเร็จ >> "%LOGFILE%"
) else (
  echo [%date% %time%] ❌ ERROR copy CSV rc=%RC_COPY_CSV% >> "%LOGFILE%"
)

echo [%date% %time%] เสร็จสิ้นการ export %COLLECTION% >> "%LOGFILE%"
echo ========================================================== >> "%LOGFILE%"

endlocal
exit /b 0
