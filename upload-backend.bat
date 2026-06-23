@echo off
REM Upload backend to EC2
echo Uploading backend folder to EC2...
scp -i "C:\Users\RIZWAN\OneDrive\Documents\ipnl\ipnl.pem" -r "C:\Users\RIZWAN\OneDrive\Documents\ipnl\backend\*" ubuntu@34.229.0.119:~/ipnl/backend/
echo Upload complete!
pause
