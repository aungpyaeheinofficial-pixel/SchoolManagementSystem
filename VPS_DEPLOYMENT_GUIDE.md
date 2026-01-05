# VPS Deployment Guide - School Management System

Complete step-by-step guide to deploy the School Management System on a VPS (Ubuntu/Debian).

## Prerequisites

- VPS with Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- Domain name (optional, but recommended for SSL)
- SSH access to your VPS

---

## Step 1: Initial Server Setup

### 1.1 Connect to your VPS

```bash
ssh root@your_vps_ip
# or
ssh username@your_vps_ip
```

### 1.2 Update system packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Install essential tools

```bash
sudo apt install -y curl wget git build-essential
```

---

## Step 2: Install Node.js and npm

### 2.1 Install Node.js 18.x or 20.x (LTS)

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 3: Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## Step 4: Clone Repository

### 4.1 Create project directory

```bash
sudo mkdir -p /var/www/html
cd /var/www/html
```

### 4.2 Clone the repository

```bash
sudo git clone https://github.com/aungpyaeheinofficial-pixel/SchoolManagementSystem.git school-ms
cd school-ms
```

### 4.3 Set proper permissions

```bash
sudo chown -R $USER:$USER /var/www/html/school-ms
```

---

## Step 5: Backend Setup

### 5.1 Install backend dependencies

```bash
cd /var/www/html/school-ms/backend
npm install
```

### 5.2 Create backend environment file

```bash
cd /var/www/html/school-ms/backend
cp env.example .env
nano .env
```

**Edit the `.env` file with your configuration:**

```env
PORT=5600
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_KEY_HERE_CHANGE_THIS
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://your_domain.com
DATASET_KEY=default
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_secure_password
ADMIN_ROLE=admin
DEFAULT_SCHOOL_NAME=A7 smart School Managemnet
DEFAULT_SCHOOL_SLUG=a7-smart-school
```

**Important:** 
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- Change ADMIN_PASSWORD to a secure password
- Update CORS_ORIGIN with your domain or IP

### 5.3 Setup Prisma database

```bash
cd /var/www/html/school-ms/backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with admin user
npm run seed
```

### 5.4 Test backend locally

```bash
npm run start
# Or for development: npm run dev
```

Press `Ctrl+C` to stop. Test in another terminal:
```bash
curl http://127.0.0.1:5600/api/health
```

---

## Step 6: Create Backend Systemd Service

### 6.1 Create service file

```bash
sudo nano /etc/systemd/system/school-ms-backend.service
```

**Add this content:**

```ini
[Unit]
Description=School Management System Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/school-ms/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=school-ms-backend

[Install]
WantedBy=multi-user.target
```

### 6.2 Enable and start the service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable school-ms-backend

# Start the service
sudo systemctl start school-ms-backend

# Check status
sudo systemctl status school-ms-backend
```

### 6.3 View logs

```bash
# View logs
sudo journalctl -u school-ms-backend -f

# View last 100 lines
sudo journalctl -u school-ms-backend -n 100 --no-pager
```

---

## Step 7: Frontend Setup

### 7.1 Install frontend dependencies

```bash
cd /var/www/html/school-ms
npm install
```

### 7.2 Create frontend environment file (optional)

```bash
cd /var/www/html/school-ms
nano .env
```

**Add (if using backend):**

```env
VITE_API_BASE_URL=http://your_domain.com
# or for IP: VITE_API_BASE_URL=http://your_vps_ip
```

### 7.3 Build frontend for production

```bash
cd /var/www/html/school-ms
npm run build
```

This creates a `dist/` folder with the production build.

---

## Step 8: Configure Nginx

### 8.1 Create Nginx configuration

```bash
sudo nano /etc/nginx/sites-available/school-ms
```

**Add this configuration (replace `your_domain.com` with your domain or use IP):**

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    # Or use IP: server_name your_vps_ip;

    root /var/www/html/school-ms/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Frontend SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5600;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 8.2 Enable the site

```bash
# Create symbolic link
sudo ln -sf /etc/nginx/sites-available/school-ms /etc/nginx/sites-enabled/school-ms

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 9: Setup SSL with Let's Encrypt (Optional but Recommended)

### 9.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtain SSL certificate

```bash
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

Follow the prompts. Certbot will automatically configure Nginx.

### 9.3 Auto-renewal (already enabled by default)

```bash
# Test renewal
sudo certbot renew --dry-run
```

---

## Step 10: Configure Firewall

### 10.1 Setup UFW (Uncomplicated Firewall)

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP
sudo ufw allow 'Nginx Full'

# Or individually:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 11: Verify Deployment

### 11.1 Check services

```bash
# Backend service
sudo systemctl status school-ms-backend

# Nginx service
sudo systemctl status nginx

# Test backend API
curl http://127.0.0.1:5600/api/health
```

### 11.2 Access your application

- **Frontend:** `http://your_domain.com` or `http://your_vps_ip`
- **Backend API:** `http://your_domain.com/api/health`

---

## Step 12: Maintenance Commands

### 12.1 Update application

```bash
cd /var/www/html/school-ms
git pull origin main

# Rebuild frontend
npm run build

# Restart backend
sudo systemctl restart school-ms-backend

# Reload Nginx
sudo systemctl reload nginx
```

### 12.2 View logs

```bash
# Backend logs
sudo journalctl -u school-ms-backend -f

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### 12.3 Restart services

```bash
# Restart backend
sudo systemctl restart school-ms-backend

# Restart Nginx
sudo systemctl restart nginx
```

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
sudo journalctl -u school-ms-backend -n 50

# Check if port is in use
sudo netstat -tulpn | grep 5600

# Verify .env file exists and has correct values
cat /var/www/html/school-ms/backend/.env
```

### Nginx errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Permission issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/html/school-ms
sudo chmod -R 755 /var/www/html/school-ms
```

### Database issues

```bash
cd /var/www/html/school-ms/backend

# Reset database (WARNING: deletes all data)
rm prisma/prod.db
npm run prisma:migrate
npm run seed
```

---

## Security Checklist

- [ ] Changed JWT_SECRET to a strong random string
- [ ] Changed ADMIN_PASSWORD to a secure password
- [ ] Configured firewall (UFW)
- [ ] Installed SSL certificate (Let's Encrypt)
- [ ] Updated CORS_ORIGIN in backend .env
- [ ] Set proper file permissions
- [ ] Disabled root login (optional but recommended)
- [ ] Set up SSH key authentication (optional but recommended)

---

## Default Login Credentials

After seeding, you can login with:
- **Username:** `admin` (or as set in ADMIN_USERNAME)
- **Password:** The password you set in `ADMIN_PASSWORD` in backend/.env

**Important:** Change these credentials immediately after first login!

---

## Support

For issues, check:
1. Backend logs: `sudo journalctl -u school-ms-backend -f`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. GitHub Issues: https://github.com/aungpyaeheinofficial-pixel/SchoolManagementSystem/issues

