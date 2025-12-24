# DigitalOcean VPS Deploy (Nginx + Node backend)

This project is a **Vite React frontend** + an optional **Node/Express backend** in `backend/`.

You asked for:
- frontend port: **3200**
- backend port: **5600**

## 1) Clone / update code

```bash
cd /var/www/html
git clone https://github.com/aungpyaeheinofficial-pixel/SchoolManagementSystem.git school-ms
cd school-ms
git pull origin main
```

## 2) Backend setup (port 5600)

### 2.1 Install backend deps

```bash
cd /var/www/html/school-ms/backend
npm install
```

### 2.2 Create backend `.env`

Create a file: `/var/www/html/school-ms/backend/.env`

Use this as a starting point (adjust values):

```bash
PORT=5600
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://167.172.90.182
DATASET_KEY=default
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_password
ADMIN_ROLE=admin
```

### 2.3 Prisma migrate + seed

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 2.4 Run backend as a service (systemd)

Create: `/etc/systemd/system/school-ms-backend.service`

```ini
[Unit]
Description=School MS Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/html/school-ms/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now school-ms-backend
sudo systemctl status school-ms-backend --no-pager
```

Health check:

```bash
curl http://127.0.0.1:5600/api/health
```

## 3) Frontend build + Nginx

### 3.1 Build frontend

```bash
cd /var/www/html/school-ms
npm install
npm run build
```

This creates `dist/`.

### 3.2 Nginx site config

Create: `/etc/nginx/sites-available/school-ms`

```nginx
server {
  listen 80;
  server_name 167.172.90.182;

  root /var/www/html/school-ms/dist;
  index index.html;

  # SPA
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
  }
}
```

Enable and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/school-ms /etc/nginx/sites-enabled/school-ms
sudo nginx -t
sudo systemctl reload nginx
```

Now your site is served at `http://167.172.90.182/` and API at `http://167.172.90.182/api/...`.

## 4) Frontend API base URL

Because Nginx proxies `/api` to the backend, you can set:
- `VITE_API_BASE_URL=http://167.172.90.182`

Locally (dev):
- frontend: `http://localhost:3200`
- backend: `http://localhost:5600`

## 5) Debugging

### Backend logs

```bash
sudo journalctl -u school-ms-backend -n 200 --no-pager
```

### Nginx logs

```bash
sudo tail -n 200 /var/log/nginx/error.log
sudo tail -n 200 /var/log/nginx/access.log
```


