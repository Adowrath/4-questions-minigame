@echo off
cd %~p0
start npm run mongodb

set NODE_ENV=production

call npm install
call npm start
pause
