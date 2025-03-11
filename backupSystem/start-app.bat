@echo off
cd C:/WEB

:: รัน npm start ใน Background และบันทึก Log
start "" cmd /c "npm start > start-log.txt 2>&1"