# 🚀 Hướng dẫn Deploy lên DigitalOcean VPS

Hướng dẫn chi tiết từng bước để triển khai Game Web Application - Pathfinding Visualizer lên DigitalOcean VPS với SSL certificate miễn phí.

## 📋 Mục lục

1. [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
2. [Chuẩn bị trước khi deploy](#chuẩn-bị-trước-khi-deploy)
3. [Tạo và cấu hình DigitalOcean Droplet](#bước-1-tạo-và-cấu-hình-digitalocean-droplet)
4. [Deploy Backend Spring Boot](#bước-2-deploy-backend-spring-boot)
5. [Deploy Frontend React](#bước-3-deploy-frontend-react)
6. [Cấu hình Nginx Reverse Proxy](#bước-4-cấu-hình-nginx-reverse-proxy)
7. [Cài đặt SSL Certificate](#bước-5-cài-đặt-ssl-certificate)
8. [Cấu hình Domain](#bước-6-cấu-hình-domain)
9. [Monitoring và Maintenance](#monitoring-và-maintenance)
10. [Backup và Rollback](#backup-và-rollback)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan kiến trúc

### Kiến trúc Production trên DigitalOcean

```
┌─────────────────────────────────────────────────────┐
│                  Internet Users                      │
│              (HTTP/HTTPS Requests)                   │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│               Domain DNS (yourdomain.com)            │
│         A Record → DigitalOcean Droplet IP           │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│          DigitalOcean Droplet (Ubuntu 22.04)        │
│                  IP: xxx.xxx.xxx.xxx                │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │          Nginx (Port 80/443)                   │ │
│  │         - Reverse Proxy                        │ │
│  │         - SSL Termination                      │ │
│  │         - Static File Serving                  │ │
│  └────────┬────────────────────────┬──────────────┘ │
│           │                        │                │
│           │ API Requests           │ Static Files   │
│           ▼                        ▼                │
│  ┌─────────────────────┐  ┌────────────────────┐    │
│  │  Spring Boot         │  │  React Build       │   │
│  │  (Port 8080)         │  │  (/var/www/html)   │   │
│  │  - REST API          │  │  - index.html      │   │
│  │  - Pathfinding       │  │  - static/         │   │
│  │  - Systemd Service   │  │                    │   │
│  └──────────┬───────────┘  └────────────────────┘   │
│             │                                       │
│             ▼                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │        Data Storage                         │    │
│  │  /opt/game/data/                            │    │
│  │  ├── maps/ (Map1.txt, Map2.txt)             │    │
│  │  └── img/ (mario.jpeg, diamond.jpg)         │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

**Server**: DigitalOcean Droplet Ubuntu 22.04 LTS
**Backend**: Spring Boot (Java 17) - Port 8080
**Frontend**: React (Static Build) - Served by Nginx
**Web Server**: Nginx - Reverse Proxy + Static Files
**SSL**: Let's Encrypt (Certbot)
**Process Manager**: Systemd

### Chi phí ước tính

- **Droplet**: $6/tháng (1GB RAM, 1 vCPU, 25GB SSD) - Đủ cho application này
- **Domain**: $10-15/năm
- **SSL Certificate**: $0 (Let's Encrypt miễn phí)

**Tổng**: ~$7-8/tháng

---

## 🛠️ Chuẩn bị trước khi deploy

### 1. Yêu cầu

#### Tài khoản và dịch vụ
- [ ] **DigitalOcean Account** - [Đăng ký tại đây](https://www.digitalocean.com/)
  - Có thể nhận $200 credit miễn phí trong 60 ngày cho tài khoản mới
- [ ] **Domain Name** (khuyến nghị)
  - Namecheap, GoDaddy, hoặc nhà cung cấp tên miền Việt Nam
  - Ví dụ: `prj1mg.me `
- [ ] **SSH Client** 
  - Windows: Git Bash, PowerShell, hoặc PuTTY
  - Mac/Linux: Terminal built-in
- [ ] **Git** - Đã cài đặt trên máy local

#### Công cụ local
- Java 17+ và Maven (để build backend)
- Node.js 14+ và npm (để build frontend)
- Git

### 2. Chuẩn bị Project

#### Build và test local

```bash
# Backend
cd backend
mvn clean package -DskipTests
# Verify JAR file: target/game-backend-0.0.1-SNAPSHOT.jar

# Frontend
cd frontend
npm install
npm run build
# Verify build folder: build/
```

#### Commit code lên GitHub

```bash
cd game-webapp
git init
git add .
git commit -m "Prepare for production deployment"
git branch -M main
git remote add origin https://github.com/yourusername/game-webapp.git
git push -u origin main
```

### 3. Thông tin cần ghi chú

Tạo file `deployment-info.txt` để lưu các thông tin sau (dùng sau này):

```txt
=== DEPLOYMENT INFO ===
Droplet IP: [Sẽ có sau khi tạo]
Domain: prj1mg.me 
SSH User: root
GitHub Repo: https://github.com/yourusername/game-webapp

=== CREDENTIALS ===
DigitalOcean: [email/password]
Domain Registrar: [email/password]

=== NOTES ===
Backend Port: 8080
Frontend Build Path: /var/www/html
Backend JAR Path: /opt/game/
Data Path: /opt/game/data/
```

---

## 🖥️ BƯỚC 1: Tạo và cấu hình DigitalOcean Droplet

### 1.1. Tạo Droplet

1. **Đăng nhập DigitalOcean Console**
   - Truy cập: https://cloud.digitalocean.com/

2. **Create Droplet**
   - Click nút **"Create"** → **"Droplets"**

3. **Chọn cấu hình:**

   **Choose an image:**
   - Distribution: **Ubuntu 22.04 LTS x64**

   **Choose Size:**
   - Plan: **Basic**
   - CPU options: **Regular** (Shared CPU)
   - RAM: **1 GB** / 1 vCPU / 25 GB SSD / 1000 GB Transfer ($6/month)
   
   **Choose a datacenter region:**
   - Chọn region gần người dùng:
     - Singapore (sgp1) - Tốt cho Việt Nam
     - Bangalore (blr1) - Alternative
     - San Francisco (sfo3) - Nếu target US

   **Authentication:**
   - Chọn **"SSH keys"** (Khuyến nghị - an toàn hơn)
   - Hoặc **"Password"** (đơn giản cho người mới)

   **Tạo SSH Key (nếu chưa có):**
   ```bash
   # Trên máy local (Git Bash hoặc Terminal)
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   # Nhấn Enter để lưu mặc định: ~/.ssh/id_rsa
   # Nhập passphrase (tùy chọn)
   
   # Copy public key
   cat ~/.ssh/id_rsa.pub
   # Paste nội dung này vào DigitalOcean SSH Key form
   ```

   **Finalize Details:**
   - Hostname: `game-webapp-prod`
   - Tags: `production`, `game-app`
   - Project: Default hoặc tạo project mới

4. **Create Droplet**
   - Click **"Create Droplet"**
   - Đợi 1-2 phút để droplet được tạo
   - Ghi lại **IP Address** (ví dụ: 159.65.128.45)

### 1.2. Kết nối SSH lần đầu

```bash
# Kết nối với SSH key
ssh root@152.42.196.25

# Hoặc với password (nếu chọn password authentication)
# Password sẽ được gửi qua email

# First login message sẽ hiển thị
# Đọc và nhấn 'yes' để tiếp tục
```

### 1.3. Cấu hình bảo mật cơ bản

```bash
# Update system packages
apt update && apt upgrade -y

# Tạo user mới (không dùng root trực tiếp)
adduser gameadmin
password: my_password
usermod -aG sudo gameadmin

# Copy SSH key sang user mới (nếu dùng SSH key)
rsync --archive --chown=gameadmin:gameadmin ~/.ssh /home/gameadmin

# Test login với user mới (mở terminal mới)
ssh gameadmin@152.42.196.25

# Disable root login qua SSH (sau khi test gameadmin OK)
sudo nano /etc/ssh/sshd_config
# Tìm và sửa: PermitRootLogin no
# Restart SSH:
sudo systemctl restart sshd
```

### 1.4. Cấu hình Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

Kết quả mong đợi:
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## ☕ BƯỚC 2: Deploy Backend Spring Boot

### 2.1. Cài đặt Java 17

```bash
# Install OpenJDK 17
sudo apt update
sudo apt install openjdk-17-jdk -y

# Verify installation
java -version
# Output: openjdk version "17.x.x"

# Set JAVA_HOME (optional but recommended)
echo 'JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"' | sudo tee -a /etc/environment
source /etc/environment
```

### 2.2. Tạo thư mục ứng dụng

```bash
# Tạo folder structure
sudo mkdir -p /opt/game/data/maps
sudo mkdir -p /opt/game/data/img

# Set ownership
sudo chown -R $USER:$USER /opt/game
```

### 2.3. Upload Backend files

**Option A: Upload JAR và data files từ local (Khuyến nghị cho lần đầu)**

```bash
# Trên máy local, từ thư mục game-webapp/
cd backend

# Build JAR nếu chưa build
mvn clean package -DskipTests

# Upload JAR file
scp target/game-backend-0.0.1-SNAPSHOT.jar gameadmin@152.42.196.25:/opt/game/

# Upload data folder
scp -r data/maps/* gameadmin@152.42.196.25:/opt/game/data/maps/
scp -r data/img/* gameadmin@152.42.196.25:/opt/game/data/img/
```

**Option B: Clone từ GitHub và build trên server**

```bash
# Trên server
cd /opt/game

# Install Maven
sudo apt install maven -y

# Clone repository
git clone https://github.com/yourusername/game-webapp.git
cd game-webapp/backend

# Build
mvn clean package -DskipTests

# Copy files
cp target/game-backend-0.0.1-SNAPSHOT.jar /opt/game/
cp -r data/* /opt/game/data/
```

### 2.4. Tạo Production Configuration

```bash
# Tạo application-prod.properties
sudo nano /opt/game/application-prod.properties
```

**Nội dung file:**
```properties
# Server Configuration
server.port=8080
server.address=localhost

# Application name
spring.application.name=game-backend

# CORS Configuration - Cập nhật sau khi có domain
cors.allowed.origins=http://152.42.196.25,http://prj1mg.me ,https://prj1mg.me 

# Logging
logging.level.root=WARN
logging.level.com.game=INFO
logging.file.name=/opt/game/logs/application.log
logging.file.max-size=10MB
logging.file.max-history=7
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n

# Data path (relative to JAR location)
game.data.path=/opt/game/data
```

### 2.5. Tạo Systemd Service

```bash
# Tạo service file
sudo nano /etc/systemd/system/game-backend.service
```

**Nội dung file:**
```ini
[Unit]
Description=Game Pathfinding Backend Service
After=syslog.target network.target

[Service]
User=gameadmin
WorkingDirectory=/opt/game
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod -Dspring.config.location=/opt/game/application-prod.properties /opt/game/game-backend-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
StandardOutput=journal
StandardError=journal
Restart=always
RestartSec=10

# Environment Variables
Environment="JAVA_OPTS=-Xmx512m -Xms256m"

[Install]
WantedBy=multi-user.target
```

### 2.6. Start Backend Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (auto start on boot)
sudo systemctl enable game-backend

# Start service
sudo systemctl start game-backend

# Check status
sudo systemctl status game-backend

# View logs (real-time)
sudo journalctl -u game-backend -f

# Test API locally
curl http://localhost:8080/api/maps
```

**Kết quả mong đợi:**
```json
[
  {"id": "1", "name": "Map 1", "width": 10, "height": 5},
  {"id": "2", "name": "Map 2", "width": 15, "height": 8}
]
```

**Nếu có lỗi:**
```bash
# Check logs chi tiết
sudo journalctl -u game-backend -n 100 --no-pager

# Check JAR file có đúng không
ls -lh /opt/game/*.jar

# Test chạy trực tiếp (debug)
cd /opt/game
java -jar game-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

---

## ⚛️ BƯỚC 3: Deploy Frontend React

### 3.1. Install Node.js và npm

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 3.2. Build Frontend trên Server

**Option A: Upload build folder từ local (Nhanh hơn)**

```bash
# Trên máy local, từ thư mục game-webapp/frontend/
npm run build

# Upload build folder
scp -r build/* gameadmin@152.42.196.25:/tmp/frontend-build/

# Trên server
sudo mkdir -p /var/www/html
sudo cp -r /tmp/frontend-build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

**Option B: Build trên server (Khuyến nghị cho update sau này)**

```bash
# Clone repository nếu chưa có
cd ~
git clone https://github.com/yourusername/game-webapp.git
cd game-webapp/frontend

# Install dependencies
npm install

# Tạo .env.production
nano .env.production
```

**File `.env.production`:**
```env
REACT_APP_API_URL=http://152.42.196.25
```

**Lưu ý:** Sau khi cài SSL và domain, update thành:
```env
REACT_APP_API_URL=https://prj1mg.me 
```

```bash
# Build production
npm run build

# Copy to web root
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

### 3.3. Cập nhật API URL trong Frontend

**Cập nhật `src/services/api.js` (nếu chưa có environment variable support):**

Trên local, sửa file:
```javascript
import axios from 'axios';

// Sử dụng environment variable hoặc fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMaps = () => api.get('/maps');
export const getMapById = (id) => api.get(`/maps/${id}`);
export const findPath = (tiles, width, height, algorithm) => {
  return api.post('/pathfinding', { tiles, width, height, algorithm });
};

export const getImageUrl = (filename) => `${API_BASE_URL}/api/images/${filename}`;

export default api;
```

Rebuild và upload lại nếu cần.

---

## 🌐 BƯỚC 4: Cấu hình Nginx Reverse Proxy

### 4.1. Cài đặt Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test: Truy cập http://152.42.196.25 trên browser
# Sẽ thấy "Welcome to nginx" page
```

### 4.2. Cấu hình Nginx cho Application

```bash
# Xóa default config
sudo rm /etc/nginx/sites-enabled/default

# Tạo config mới
sudo nano /etc/nginx/sites-available/game-webapp
```

**Nội dung file `/etc/nginx/sites-available/game-webapp`:**

```nginx
# HTTP Server Block
server {
    listen 80;
    listen [::]:80;
    
    server_name 152.42.196.25 prj1mg.me  www.prj1mg.me ;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Root directory for React build
    root /var/www/html;
    index index.html;
    
    # Client max body size (nếu cần upload files)
    client_max_body_size 10M;
    
    # Serve static files (React build)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy API requests to Spring Boot backend
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        
        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
    }
    
    # Access and error logs
    access_log /var/log/nginx/game-webapp-access.log;
    error_log /var/log/nginx/game-webapp-error.log;
}
```

**Giải thích cấu hình:**
- `listen 80` - Lắng nghe HTTP port 80
- `root /var/www/html` - Thư mục chứa React build
- `location /` - Serve React SPA, rewrite tất cả routes về index.html
- `location /api/` - Proxy tất cả API requests tới Spring Boot backend (localhost:8080)
- Cache static files (JS, CSS, images) trong 1 năm

### 4.3. Enable và Test Configuration

```bash
# Tạo symbolic link để enable site
sudo ln -s /etc/nginx/sites-available/game-webapp /etc/nginx/sites-enabled/

# Test configuration syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

**Kết quả mong đợi từ `nginx -t`:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4.4. Test Application

```bash
# Test từ server
curl http://localhost/api/maps

# Test từ browser
# Mở: http://152.42.196.25
# Application sẽ load và có thể:
# - Chọn maps
# - Chỉnh sửa map
# - Chạy thuật toán pathfinding
```

**Nếu có lỗi 502 Bad Gateway:**
```bash
# Check backend đang chạy
sudo systemctl status game-backend

# Check backend logs
sudo journalctl -u game-backend -n 50

# Check Nginx error logs
sudo tail -f /var/log/nginx/game-webapp-error.log
```

---

## 🔒 BƯỚC 5: Cài đặt SSL Certificate

### 5.1. Cài đặt Certbot

```bash
# Install Certbot và Nginx plugin
sudo apt install certbot python3-certbot-nginx -y

# Verify installation
certbot --version
```

### 5.2. Obtain SSL Certificate

**Điều kiện:** Domain đã trỏ về Droplet IP (làm ở Bước 6 trước)

```bash
# Generate certificate
sudo certbot --nginx -d prj1mg.me  -d www.prj1mg.me 

# Certbot sẽ hỏi:
# 1. Email address (cho renewal notifications): your-email@example.com
# 2. Agree to Terms of Service: Yes (Y)
# 3. Share email with EFF: No (N) - tùy chọn
# 4. Redirect HTTP to HTTPS: Yes (2) - Chọn option 2
```

**Certbot sẽ tự động:**
- Generate SSL certificate
- Modify Nginx config để enable HTTPS
- Setup auto-renewal (certificate valid 90 days)

### 5.3. Verify SSL Installation

```bash
# Check Nginx config sau khi Certbot sửa
sudo cat /etc/nginx/sites-available/game-webapp

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**File config sẽ được Certbot thêm các dòng:**
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name prj1mg.me  www.prj1mg.me ;
    
    ssl_certificate /etc/letsencrypt/live/prj1mg.me /fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prj1mg.me /privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # ... rest of config ...
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    
    server_name prj1mg.me  www.prj1mg.me ;
    
    return 301 https://$server_name$request_uri;
}
```

### 5.4. Test HTTPS

```bash
# Test từ command line
curl https://prj1mg.me /api/maps

# Test trong browser
# Mở: https://prj1mg.me 
# Kiểm tra:
# ✓ Padlock icon hiển thị
# ✓ Certificate valid
# ✓ No mixed content warnings
```

**Check SSL quality:**
- Truy cập: https://www.ssllabs.com/ssltest/
- Nhập domain: prj1mg.me 
- Đợi kết quả (grade A/A+ là tốt)

### 5.5. Setup Auto-Renewal

```bash
# Certbot tự động setup systemd timer
sudo systemctl status certbot.timer

# Test renewal (dry-run)
sudo certbot renew --dry-run

# Nếu thành công, certificate sẽ tự động renew trước khi expire
```

**Manual renewal nếu cần:**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### 5.6. Update Frontend API URL

Sau khi có HTTPS, cập nhật `.env.production`:

```bash
cd ~/game-webapp/frontend
nano .env.production
```

**Update to:**
```env
REACT_APP_API_URL=https://prj1mg.me 
```

```bash
# Rebuild
npm run build

# Deploy
sudo cp -r build/* /var/www/html/
sudo systemctl reload nginx
```

### 5.7. Update CORS trong Backend

```bash
# Edit application-prod.properties
sudo nano /opt/game/application-prod.properties
```

**Update CORS:**
```properties
cors.allowed.origins=https://prj1mg.me ,https://www.prj1mg.me 
```

```bash
# Restart backend
sudo systemctl restart game-backend

# Verify
sudo systemctl status game-backend
```

---

## 🌍 BƯỚC 6: Cấu hình Domain (prj1mg.me từ Namecheap)

### 6.1. Chuẩn bị thông tin

**Domain:** prj1mg.me  
**Server IP:** 152.42.196.25  
**Registrar:** Namecheap

### 6.2. Cấu hình DNS Records trên Namecheap

#### Bước 1: Đăng nhập Namecheap

1. Truy cập: https://www.namecheap.com/
2. Đăng nhập với tài khoản của bạn
3. Vào **Dashboard** → **Domain List**
4. Click **Manage** bên cạnh domain `prj1mg.me`

#### Bước 2: Chọn DNS Settings

1. Trong trang domain management, tìm phần **NAMESERVERS**
2. Đảm bảo đang dùng: **Namecheap BasicDNS** (mặc định)
   - Nếu đang dùng Custom DNS, đổi về BasicDNS
3. Click tab **Advanced DNS**

#### Bước 3: Thêm DNS Records

Trong phần **HOST RECORDS**, thêm các records sau:

**Record 1 - Root domain (@):**
```
Type: A Record
Host: @
Value: 152.42.196.25
TTL: Automatic
```

**Record 2 - WWW subdomain:**
```
Type: A Record  
Host: www
Value: 152.42.196.25
TTL: Automatic
```

**Record 3 - Optional API subdomain:**
```
Type: A Record
Host: api
Value: 152.42.196.25
TTL: Automatic
```

#### Bước 4: Xóa các records không cần thiết

Namecheap thường tạo sẵn một số records mặc định. **Xóa các records sau nếu có:**
- CNAME Record với Host là `www` trỏ đến parking page
- URL Redirect Records
- Bất kỳ A Record nào trỏ đến IP khác

**Chỉ giữ lại:**
- 2 A Records bạn vừa tạo (@ và www → 152.42.196.25)
- Records cho email (nếu có dùng email)

#### Hình ảnh minh họa cấu hình

Sau khi hoàn tất, HOST RECORDS của bạn sẽ trông như thế này:

```
┌──────────┬──────┬─────────────────┬───────────┐
│ Type     │ Host │ Value           │ TTL       │
├──────────┼──────┼─────────────────┼───────────┤
│ A Record │ @    │ 152.42.196.25   │ Automatic │
│ A Record │ www  │ 152.42.196.25   │ Automatic │
└──────────┴──────┴─────────────────┴───────────┘
```

#### Lưu ý về TTL

- **Automatic TTL** của Namecheap = 1800 seconds (30 phút)
- Trong quá trình testing, có thể để 300 seconds (5 phút) để thay đổi nhanh hơn
- Sau khi stable, nên để 3600 seconds (1 giờ) hoặc 14400 (4 giờ)

### 6.3. Verify DNS Propagation

DNS thường mất **5-30 phút** để propagate globally, tối đa 48 giờ.

#### A. Kiểm tra từ máy local

**Trên Windows PowerShell:**
```powershell
# Check root domain
nslookup prj1mg.me

# Check www subdomain  
nslookup www.prj1mg.me

# Hoặc dùng Resolve-DnsName
Resolve-DnsName prj1mg.me
Resolve-DnsName www.prj1mg.me
```

**Kết quả mong đợi:**
```
Server:  dns.google
Address:  8.8.8.8

Name:    prj1mg.me
Address: 152.42.196.25
```

**Trên Linux/Mac/Git Bash:**
```bash
# Check với dig
dig prj1mg.me
dig www.prj1mg.me

# Hoặc host
host prj1mg.me
host www.prj1mg.me
```

#### B. Kiểm tra DNS từ nhiều locations

Truy cập các tools online để check từ nhiều DNS servers khác nhau:

1. **DNSChecker.org** (Khuyến nghị)
   - URL: https://dnschecker.org
   - Nhập: `prj1mg.me`
   - Xem kết quả từ 20+ locations worldwide
   - Tất cả phải trả về: `152.42.196.25`

2. **WhatsMyDNS.net**
   - URL: https://www.whatsmydns.net
   - Check: `prj1mg.me` và `www.prj1mg.me`

3. **Google DNS Checker**
   ```bash
   # Trên terminal
   nslookup prj1mg.me 8.8.8.8
   nslookup prj1mg.me 1.1.1.1
   ```

#### C. Flush DNS Cache (nếu cần)

Nếu domain chưa resolve sau 10-15 phút:

**Windows:**
```powershell
ipconfig /flushdns
```

**Mac:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Linux:**
```bash
sudo systemd-resolve --flush-caches
# Hoặc
sudo /etc/init.d/nscd restart
```

### 6.3.1. Test Domain Resolution trên Server

SSH vào server và test:
```bash
ssh gameadmin@152.42.196.25

# Test ping từ server
ping -c 4 prj1mg.me

# Test DNS lookup
nslookup prj1mg.me
```

### 6.4. Update Nginx Config với Domain

### 6.4. Update Nginx Config với Domain

Sau khi DNS đã propagate (resolve đúng IP), cập nhật Nginx config:

```bash
# SSH vào server
ssh gameadmin@152.42.196.25

# Edit Nginx config
sudo nano /etc/nginx/sites-available/game-webapp
```

**Tìm dòng `server_name` và cập nhật:**
```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Thêm domain vào server_name
    server_name prj1mg.me www.prj1mg.me 152.42.196.25;
    
    # ... rest of config
}
```

**Test và reload Nginx:**
```bash
# Test cấu hình
sudo nginx -t

# Nếu OK, reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### 6.5. Test Domain truy cập Web

#### A. Test HTTP (trước khi cài SSL)

**Từ browser:**
```
http://prj1mg.me
http://www.prj1mg.me
```

**Từ command line:**
```bash
# Trên local machine
curl -I http://prj1mg.me

# Nên thấy: HTTP/1.1 200 OK
```

#### B. Test API endpoints

```bash
# Test backend API
curl http://prj1mg.me/api/maps
curl http://www.prj1mg.me/api/maps

# Nên trả về JSON list maps
```

### 6.6. Update Frontend Environment (Quan trọng!)

Sau khi domain hoạt động, cập nhật frontend để sử dụng domain thay vì IP:

#### Trên local machine:

```bash
cd d:\2025.2\Project 1\game-webapp\frontend

# Tạo/Edit file .env.production
notepad .env.production
```

**Nội dung file `.env.production`:**
```env
# Sử dụng domain thay vì IP
REACT_APP_API_URL=http://prj1mg.me
```

**Rebuild và deploy lại frontend:**
```powershell
# Build lại với env mới
npm run build

# Upload lên server
scp -r build/* gameadmin@152.42.196.25:/tmp/frontend-new/

# Trên server, deploy
ssh gameadmin@152.42.196.25
sudo cp -r /tmp/frontend-new/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
rm -rf /tmp/frontend-new

# Clear browser cache và test lại
```

### 6.7. Cài đặt SSL Certificate (QUAN TRỌNG - Làm ngay sau khi domain hoạt động)

**Yêu cầu:** DNS đã propagate (bước 6.3 đã pass)

```bash
# SSH vào server
ssh gameadmin@152.42.196.25

# Cài đặt Certbot nếu chưa có
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot --nginx -d prj1mg.me -d www.prj1mg.me
```

**Certbot sẽ hỏi:**
```
Enter email address (for renewal notifications): your-email@example.com
[Enter]

Agree to Terms of Service: Y
Share email with EFF: N (tùy chọn)

Select redirect HTTP to HTTPS:
1: No redirect
2: Redirect - Make all requests redirect to secure HTTPS access
Select: 2 [Enter]
```

**Output mong đợi:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/prj1mg.me/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/prj1mg.me/privkey.pem
This certificate expires on 2026-03-19.
```

### 6.8. Verify SSL Installation

```bash
# Check nginx config sau khi Certbot modify
sudo cat /etc/nginx/sites-available/game-webapp

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

**Nginx config sẽ có thêm HTTPS server block:**
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name prj1mg.me www.prj1mg.me;
    
    ssl_certificate /etc/letsencrypt/live/prj1mg.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prj1mg.me/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Location blocks...
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name prj1mg.me www.prj1mg.me;
    return 301 https://$server_name$request_uri;
}
```

### 6.9. Update Frontend cho HTTPS

```bash
# Trên local machine
cd d:\2025.2\Project 1\game-webapp\frontend

# Update .env.production
notepad .env.production
```

**Đổi thành HTTPS:**
```env
REACT_APP_API_URL=https://prj1mg.me
```

**Rebuild và deploy:**
```powershell
npm run build
scp -r build/* gameadmin@152.42.196.25:/tmp/frontend-ssl/
ssh gameadmin@152.42.196.25 "sudo cp -r /tmp/frontend-ssl/* /var/www/html/ && sudo chown -R www-data:www-data /var/www/html && rm -rf /tmp/frontend-ssl"
```

### 6.10. Update Backend CORS cho HTTPS

```bash
# SSH vào server
ssh gameadmin@152.42.196.25

# Edit application-prod.properties
sudo nano /opt/game/application-prod.properties
```

**Update CORS origins:**
```properties
cors.allowed.origins=https://prj1mg.me,https://www.prj1mg.me
```

**Restart backend:**
```bash
sudo systemctl restart game-backend
sudo systemctl status game-backend
```

### 6.11. Final Testing với HTTPS

#### A. Test HTTPS Website

**Từ browser:**
```
https://prj1mg.me
https://www.prj1mg.me
```

**Kiểm tra:**
- ✅ Padlock icon hiển thị (bảo mật)
- ✅ Certificate valid
- ✅ HTTP tự động redirect sang HTTPS
- ✅ Không có Mixed Content warnings
- ✅ Game hoạt động bình thường

#### B. Test SSL Quality

**SSL Labs Test:**
1. Truy cập: https://www.ssllabs.com/ssltest/
2. Nhập: `prj1mg.me`
3. Đợi kết quả (2-3 phút)
4. Mong đợi: **Grade A** hoặc **A+**

#### C. Test API với HTTPS

```bash
# Test từ command line
curl https://prj1mg.me/api/maps
curl https://www.prj1mg.me/api/maps

# Test trong browser console (F12)
fetch('https://prj1mg.me/api/maps')
  .then(r => r.json())
  .then(d => console.log(d));
```

### 6.12. Setup SSL Auto-Renewal

Certbot tự động cài đặt systemd timer cho renewal.

**Verify auto-renewal:**
```bash
# Check certbot timer
sudo systemctl status certbot.timer

# Test renewal (dry-run - không thực sự renew)
sudo certbot renew --dry-run
```

**Output mong đợi:**
```
Congratulations, all simulated renewals succeeded:
  /etc/letsencrypt/live/prj1mg.me/fullchain.pem (success)
```

**Certificate sẽ tự động renew 30 ngày trước khi expire.**

**Manual renewal nếu cần:**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### 6.13. Checklist Hoàn thành Domain Setup

- [ ] DNS A Records đã cấu hình trên Namecheap (@ và www)
- [ ] DNS đã propagate (nslookup trả về đúng IP)
- [ ] Nginx config đã thêm server_name domain
- [ ] Domain truy cập được qua HTTP
- [ ] SSL certificate đã cài đặt thành công
- [ ] HTTPS hoạt động, HTTP redirect sang HTTPS
- [ ] Frontend đã rebuild với HTTPS URL
- [ ] Backend CORS đã update cho HTTPS
- [ ] Game hoạt động hoàn toàn trên HTTPS
- [ ] SSL auto-renewal đã verify

### 6.14. Troubleshooting Domain Issues

#### Lỗi: Domain không resolve

**Nguyên nhân:**
- DNS chưa propagate
- DNS records cấu hình sai
- ISP cache DNS cũ

**Giải pháp:**
```bash
# Đợi thêm 10-30 phút
# Flush DNS cache local
ipconfig /flushdns  # Windows

# Test với Google DNS
nslookup prj1mg.me 8.8.8.8

# Check DNS trên dnschecker.org
```

#### Lỗi: "ERR_TOO_MANY_REDIRECTS"

**Nguyên nhân:** Loop redirect giữa HTTP và HTTPS

**Giải pháp:**
```bash
# Check nginx config
sudo nano /etc/nginx/sites-available/game-webapp

# Đảm bảo chỉ có 1 server block port 80 với redirect
# Xóa các dòng redirect duplicate

sudo nginx -t
sudo systemctl reload nginx
```

#### Lỗi: SSL Certificate generation failed

**Nguyên nhân:** DNS chưa point đến server

**Giải pháp:**
```bash
# Đảm bảo DNS đã resolve
nslookup prj1mg.me

# Đảm bảo port 80 open và Nginx đang chạy
sudo ufw status
sudo systemctl status nginx

# Retry Certbot
sudo certbot --nginx -d prj1mg.me -d www.prj1mg.me
```

#### Lỗi: Mixed Content warnings

**Nguyên nhân:** Frontend gọi API qua HTTP trong HTTPS page

**Giải pháp:**
```bash
# Đảm bảo .env.production dùng https://
REACT_APP_API_URL=https://prj1mg.me

# Rebuild frontend
npm run build

# Redeploy
```

### 6.15. Domain Management Tips

#### A. Renew Domain trước khi hết hạn

- Namecheap sẽ email nhắc trước 30-60 ngày
- Enable auto-renewal trong Namecheap dashboard
- Domain thường expire sau 1 năm

#### B. DNS Management Best Practices

- **Không xóa** DNS records đang dùng khi production
- Test thay đổi DNS với subdomain test trước
- Sau khi stable, tăng TTL lên 3600 hoặc 14400
- Backup DNS records (screenshot hoặc note lại)

#### C. Subdomain cho môi trường khác

Nếu muốn có môi trường staging:

**Thêm subdomain:**
```
Type: A Record
Host: staging
Value: <STAGING_SERVER_IP>
TTL: Automatic
```

Access: `https://staging.prj1mg.me`

---

## 📊 Monitoring và Maintenance

### 7.1. Setup Basic Monitoring

#### A. System Resource Monitoring

```bash
# Install htop
sudo apt install htop -y

# Monitor realtime
htop

# Check disk usage
df -h

# Check memory
free -h

# Check running processes
ps aux | grep java
```

#### B. Application Logs

```bash
# Backend logs (systemd journal)
sudo journalctl -u game-backend -f

# Hoặc từ file (nếu cấu hình)
tail -f /opt/game/logs/application.log

# Nginx access logs
tail -f /var/log/nginx/game-webapp-access.log

# Nginx error logs
tail -f /var/log/nginx/game-webapp-error.log
```

#### C. Setup Log Rotation

Nginx logs đã tự động rotate. Cho backend logs:

```bash
sudo nano /etc/logrotate.d/game-backend
```

**Nội dung:**
```
/opt/game/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 gameadmin gameadmin
    sharedscripts
    postrotate
        systemctl reload game-backend > /dev/null 2>&1 || true
    endscript
}
```

### 7.2. Health Check Endpoint

**Thêm vào Backend (optional):**

Trong `MapController.java`:
```java
@GetMapping("/health")
public ResponseEntity<Map<String, String>> health() {
    Map<String, String> status = new HashMap<>();
    status.put("status", "UP");
    status.put("timestamp", LocalDateTime.now().toString());
    status.put("version", "1.0.0");
    return ResponseEntity.ok(status);
}
```

**Test:**
```bash
curl https://prj1mg.me /api/health
```

### 7.3. External Monitoring với UptimeRobot

1. **Đăng ký miễn phí:** https://uptimerobot.com
2. **Add New Monitor:**
   - Monitor Type: HTTPS
   - Friendly Name: Game Webapp
   - URL: `https://prj1mg.me /api/health`
   - Monitoring Interval: 5 minutes
3. **Alert Contacts:** Add email/SMS
4. **Save**

UptimeRobot sẽ gửi alert khi site down.

### 7.4. Performance Monitoring

```bash
# Check Nginx connections
sudo netstat -an | grep :80 | wc -l
sudo netstat -an | grep :443 | wc -l

# Check backend performance
# Install jconsole hoặc dùng Spring Boot Actuator (production-ready features)
```

### 7.5. Security Updates

```bash
# Setup unattended-upgrades (auto security updates)
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
# Chọn "Yes"

# Manual update
sudo apt update
sudo apt upgrade -y

# Check if reboot needed
[ -f /var/run/reboot-required ] && echo "Reboot required" || echo "No reboot needed"
```

---

## 💾 Backup và Rollback

### 8.1. Backup Strategy

#### A. Backup Script

```bash
# Tạo backup script
sudo nano /opt/game/backup.sh
```

**Nội dung:**
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/gameadmin/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="game-webapp-backup-$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
echo "Backing up application files..."
tar -czf $BACKUP_DIR/$BACKUP_NAME-app.tar.gz \
    /opt/game/game-backend-*.jar \
    /opt/game/application-prod.properties \
    /opt/game/data/

# Backup frontend
echo "Backing up frontend..."
tar -czf $BACKUP_DIR/$BACKUP_NAME-frontend.tar.gz /var/www/html/

# Backup Nginx config
echo "Backing up Nginx config..."
tar -czf $BACKUP_DIR/$BACKUP_NAME-nginx.tar.gz /etc/nginx/sites-available/game-webapp

# Keep only last 7 backups
echo "Cleaning old backups..."
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: $BACKUP_DIR/$BACKUP_NAME-*.tar.gz"
```

```bash
# Make executable
chmod +x /opt/game/backup.sh

# Test backup
/opt/game/backup.sh
```

#### B. Schedule Automated Backups

```bash
# Add to crontab
crontab -e
```

**Add line:**
```cron
# Daily backup at 2 AM
0 2 * * * /opt/game/backup.sh >> /var/log/game-backup.log 2>&1
```

### 8.2. Rollback Procedure

#### Rollback Backend

```bash
# Stop service
sudo systemctl stop game-backend

# Restore from backup
cd /home/gameadmin/backups
# List backups
ls -lh

# Extract backup
sudo tar -xzf game-webapp-backup-20250115_020000-app.tar.gz -C /

# Start service
sudo systemctl start game-backend
sudo systemctl status game-backend
```

#### Rollback Frontend

```bash
# Extract backup
sudo tar -xzf game-webapp-backup-20250115_020000-frontend.tar.gz -C /

# Reload Nginx
sudo systemctl reload nginx
```

### 8.3. Keep Multiple Versions

```bash
# Structure for versioned deployments
/opt/game/
├── releases/
│   ├── v1.0.0/
│   │   └── game-backend-1.0.0.jar
│   ├── v1.1.0/
│   │   └── game-backend-1.1.0.jar
│   └── v1.2.0/
│       └── game-backend-1.2.0.jar
├── current -> releases/v1.2.0/game-backend-1.2.0.jar
└── data/

# Rollback bằng cách change symlink
cd /opt/game
sudo ln -sfn releases/v1.1.0/game-backend-1.1.0.jar current
sudo systemctl restart game-backend
```

---

## 🐛 Troubleshooting

### Issue 1: Backend không start

**Triệu chứng:**
```bash
sudo systemctl status game-backend
# Output: failed, exit code 1
```

**Giải pháp:**
```bash
# Check logs chi tiết
sudo journalctl -u game-backend -n 100 --no-pager

# Common issues:
# 1. Port 8080 đã được sử dụng
sudo lsof -i :8080
# Kill process nếu cần

# 2. JAR file không tồn tại
ls -lh /opt/game/*.jar

# 3. Permission issues
sudo chown gameadmin:gameadmin /opt/game -R

# 4. Java version
java -version  # Phải >= 17

# Test run manually
cd /opt/game
java -jar game-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### Issue 2: 502 Bad Gateway

**Triệu chứng:** Browser hiển thị "502 Bad Gateway"

**Giải pháp:**
```bash
# 1. Check backend running
sudo systemctl status game-backend
curl http://localhost:8080/api/health

# 2. Check Nginx config
sudo nginx -t

# 3. Check Nginx logs
sudo tail -50 /var/log/nginx/game-webapp-error.log

# 4. Verify proxy_pass URL
sudo grep proxy_pass /etc/nginx/sites-available/game-webapp
# Should be: http://localhost:8080/api/

# 5. Restart services
sudo systemctl restart game-backend
sudo systemctl reload nginx
```

### Issue 3: CORS Errors

**Triệu chứng:** Console hiển thị:
```
Access to XMLHttpRequest at 'https://prj1mg.me /api/maps' has been blocked by CORS policy
```

**Giải pháp:**
```bash
# 1. Check CORS config
sudo cat /opt/game/application-prod.properties | grep cors

# 2. Update CORS origins
sudo nano /opt/game/application-prod.properties
# Add:
cors.allowed.origins=https://prj1mg.me ,https://www.prj1mg.me 

# 3. Restart backend
sudo systemctl restart game-backend

# 4. Test CORS
curl -H "Origin: https://prj1mg.me " \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://prj1mg.me /api/maps -v
```

### Issue 4: Images không load

**Triệu chứng:** Mario và Diamond không hiển thị

**Giải pháp:**
```bash
# 1. Check files exist
ls -lh /opt/game/data/img/

# 2. Check permissions
sudo chmod 644 /opt/game/data/img/*

# 3. Test image endpoint
curl -I https://prj1mg.me /api/images/mario.jpeg

# 4. Check backend logs
sudo journalctl -u game-backend | grep ImageController
```

### Issue 5: SSL Certificate Errors

**Triệu chứng:** "Your connection is not private" hoặc certificate expired

**Giải pháp:**
```bash
# 1. Check certificate expiry
sudo certbot certificates

# 2. Renew certificate
sudo certbot renew --force-renewal

# 3. Check auto-renewal timer
sudo systemctl status certbot.timer

# 4. Test renewal
sudo certbot renew --dry-run

# 5. Reload Nginx
sudo systemctl reload nginx
```

### Issue 6: Slow Performance

**Triệu chứng:** API response chậm, website load lâu

**Giải pháp:**
```bash
# 1. Check system resources
htop
free -h
df -h

# 2. Check backend memory
# Add to systemd service:
sudo nano /etc/systemd/system/game-backend.service
# Update:
Environment="JAVA_OPTS=-Xmx768m -Xms256m"

sudo systemctl daemon-reload
sudo systemctl restart game-backend

# 3. Enable Nginx caching (thêm vào nginx config)
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ... rest of config
}

# 4. Optimize frontend
# Enable Gzip compression (thường đã có)
sudo nano /etc/nginx/nginx.conf
# Ensure:
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### Issue 7: Disk Space Full

**Triệu chứng:**
```bash
df -h
# Output: /dev/vda1 100% ...
```

**Giải pháp:**
```bash
# 1. Find large files
sudo du -h /var/log | sort -rh | head -20
sudo du -h /opt | sort -rh | head -20

# 2. Clean logs
sudo journalctl --vacuum-size=100M
sudo truncate -s 0 /var/log/nginx/*.log

# 3. Clean apt cache
sudo apt clean
sudo apt autoremove -y

# 4. Remove old backups
rm /home/gameadmin/backups/*.tar.gz

# 5. Upgrade Droplet if needed
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code tested locally
- [ ] Backend builds successfully (`mvn clean package`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] GitHub repository updated
- [ ] DigitalOcean account created
- [ ] Domain purchased and ready

### Server Setup
- [ ] Droplet created (Ubuntu 22.04)
- [ ] SSH access configured
- [ ] Firewall enabled (ports 22, 80, 443)
- [ ] Non-root user created
- [ ] Java 17 installed
- [ ] Node.js installed
- [ ] Nginx installed

### Backend Deployment
- [ ] JAR file uploaded to `/opt/game/`
- [ ] Data files uploaded (maps, images)
- [ ] `application-prod.properties` created
- [ ] Systemd service created
- [ ] Backend service started and enabled
- [ ] API endpoint tested (`curl http://localhost:8080/api/maps`)

### Frontend Deployment
- [ ] React build uploaded to `/var/www/html/`
- [ ] API URL configured in `.env.production`
- [ ] Static files served correctly

### Nginx Configuration
- [ ] Nginx config created
- [ ] Config tested (`nginx -t`)
- [ ] Site enabled
- [ ] Nginx reloaded
- [ ] Application accessible via HTTP

### Domain & SSL
- [ ] Domain DNS configured (A records)
- [ ] DNS propagation verified
- [ ] SSL certificate obtained (Certbot)
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] SSL grade A/A+ (SSLLabs)

### Post-Deployment
- [ ] CORS configured correctly
- [ ] All features tested (maps, pathfinding, images)
- [ ] Monitoring setup (UptimeRobot)
- [ ] Backup script created
- [ ] Automated backups scheduled
- [ ] Documentation updated

---

## 📞 Support & Resources

### Documentation
- [DigitalOcean Docs](https://docs.digitalocean.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/docs/)
- [Spring Boot Deployment](https://docs.spring.io/spring-boot/docs/current/reference/html/deployment.html)

### Useful Commands Cheatsheet

```bash
# Backend Management
sudo systemctl start game-backend
sudo systemctl stop game-backend
sudo systemctl restart game-backend
sudo systemctl status game-backend
sudo journalctl -u game-backend -f

# Nginx Management
sudo systemctl reload nginx
sudo systemctl restart nginx
sudo nginx -t
tail -f /var/log/nginx/game-webapp-error.log

# SSL Certificate
sudo certbot certificates
sudo certbot renew
sudo certbot renew --dry-run

# System Monitoring
htop
df -h
free -h
sudo lsof -i :8080
sudo netstat -tlnp

# Firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Cost Breakdown

| Item | Cost | Period |
|------|------|--------|
| DigitalOcean Droplet (1GB) | $6 | /month |
| Domain Name | $10-15 | /year |
| SSL Certificate | $0 | Free (Let's Encrypt) |
| **Total** | **~$7/month** | |

### Next Steps

Sau khi deploy thành công, xem thêm:
- **DEVOPS_GUIDE.md** - Hướng dẫn tích hợp Docker, Kubernetes, CI/CD
- **README.md** - Tài liệu về features và sử dụng application

---

## 🎓 Deployment Best Practices

1. **Always use HTTPS** - Bảo mật và SEO tốt hơn
2. **Keep backups** - Daily automated backups
3. **Monitor uptime** - Setup external monitoring
4. **Update regularly** - Security patches và dependencies
5. **Use version control** - Git for all code changes
6. **Test before deploy** - Local testing trước khi push lên production
7. **Document changes** - Keep deployment log
8. **Use environment variables** - Không hardcode credentials
9. **Implement logging** - Đầy đủ logs cho troubleshooting
10. **Plan for scaling** - Prepare for traffic growth

---

**Version**: 2.0.0 - DigitalOcean Focused
**Last Updated**: December 2025
**Maintainer**: Game Web Application Team

---

🎉 **Chúc mừng!** Bạn đã deploy thành công ứng dụng lên DigitalOcean với SSL!

Truy cập: **https://prj1mg.me ** và enjoy! 🚀
