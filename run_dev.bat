@echo off
echo Starting ISP Fault Management Platform...
set SECRET_KEY=local-dev-secret-change-before-prod-0123456789
set DATABASE_URL=sqlite:///./dev_runtime.db
set INITIAL_ADMIN_USERNAME=admin
set INITIAL_ADMIN_PASSWORD=bccit
set INITIAL_ADMIN_EMAIL=admin@bcc.gov.zw
set ALLOW_WEAK_LOCAL_PASSWORDS=true
npm run dev
