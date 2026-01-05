# VPS Quick Start Checklist

Quick reference for deploying School Management System on VPS.

## Quick Commands

### 1. Server Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Clone & Setup
```bash
cd /var/www/html
sudo git clone https://github.com/aungpyaeheinofficial-pixel/SchoolManagementSystem.git school-ms
sudo chown -R $USER:$USER /var/www/html/school-ms
cd school-ms
```

### 3. Backend Setup
```bash
cd backend
npm install
cp env.example .env
nano .env  # Edit with your settings
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 4. Create Backend Service
```bash
sudo nano /etc/systemd/system/school-ms-backend.service
# Paste service config (see VPS_DEPLOYMENT_GUIDE.md)
sudo systemctl daemon-reload
sudo systemctl enable --now school-ms-backend
```

### 5. Frontend Build
```bash
cd /var/www/html/school-ms
npm install
npm run build
```

### 6. Nginx Config
```bash
sudo nano /etc/nginx/sites-available/school-ms
# Paste nginx config (see VPS_DEPLOYMENT_GUIDE.md)
sudo ln -sf /etc/nginx/sites-available/school-ms /etc/nginx/sites-enabled/school-ms
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL (Optional)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

### 8. Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Important Files

- Backend config: `/var/www/html/school-ms/backend/.env`
- Backend service: `/etc/systemd/system/school-ms-backend.service`
- Nginx config: `/etc/nginx/sites-available/school-ms`
- Frontend build: `/var/www/html/school-ms/dist/`

## Quick Checks

```bash
# Check backend
sudo systemctl status school-ms-backend
curl http://127.0.0.1:5600/api/health

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# View logs
sudo journalctl -u school-ms-backend -f
sudo tail -f /var/log/nginx/error.log
```

## Update Application

```bash
cd /var/www/html/school-ms
git pull origin main
npm run build  # Frontend
sudo systemctl restart school-ms-backend
sudo systemctl reload nginx
```

