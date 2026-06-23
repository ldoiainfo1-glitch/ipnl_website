# EC2 Deployment Guide

## Prerequisites

- SSH key file: C:\Users\RIZWAN\OneDrive\Documents\ipnl\ipnl.pem
- Git repository with your code
- EC2 instance running at 34.229.0.119

## Step 1: Connect to EC2

```bash
ssh -i "C:\Users\RIZWAN\OneDrive\Documents\ipnl\ipnl.pem" ec2-user@34.229.0.119
# OR if Ubuntu:
ssh -i "C:\Users\RIZWAN\OneDrive\Documents\ipnl\ipnl.pem" ubuntu@34.229.0.119
```

## Step 2: Install Node.js (if not installed)

```bash
# For Amazon Linux 2023 / AL2
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# OR for Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Step 3: Install Git (if not installed)

```bash
# Amazon Linux
sudo yum install -y git

# Ubuntu
sudo apt-get install -y git
```

## Step 4: Clone your repository

```bash
cd ~
git clone <YOUR_REPO_URL>
cd ipnl/backend
```

## Step 5: Install dependencies

```bash
npm install
```

## Step 6: Create .env file

```bash
nano .env
```

Paste this content:

```
SUPABASE_URL=https://gseweobaonxdntbjgest.supabase.co/
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZXdlb2Jhb254ZG50YmpnZXN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg1ODc3MywiZXhwIjoyMDk3NDM0NzczfQ.XLfWhQZ6S0w6v7vmg5tRcRzjJXFRW18d8ArFCp2rI64
PORT=4000
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

## Step 7: Build the backend

```bash
npm run build
```

## Step 8: Install PM2 and start the server

```bash
sudo npm install -g pm2
pm2 start npm --name "ipnl-backend" -- start
pm2 startup
pm2 save
```

## Step 9: Check if it's running

```bash
pm2 status
pm2 logs ipnl-backend
curl http://localhost:4000/api/health
```

## Test from your browser

Open: http://34.229.0.119:4000/api/health

## Useful PM2 Commands

```bash
pm2 restart ipnl-backend    # Restart
pm2 stop ipnl-backend        # Stop
pm2 logs ipnl-backend        # View logs
pm2 delete ipnl-backend      # Remove
```

## Update deployed code

```bash
cd ~/ipnl/backend
git pull
npm install
npm run build
pm2 restart ipnl-backend
```
