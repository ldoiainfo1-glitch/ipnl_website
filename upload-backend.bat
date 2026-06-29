@echo off
REM Upload backend to EC2
echo Uploading backend folder to EC2...
scp -i "C:\Users\admin3\Documents\ipnl\ipnl_website\ipnl.pem" -r "C:\Users\admin3\Documents\ipnl\ipnl_website\backend\*" ubuntu@34.229.0.119:~/ipnl/backend/
echo Upload complete!
pause
