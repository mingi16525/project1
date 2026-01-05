# Hướng dẫn Migration từ Manual Deployment sang GitLab CI/CD

## Tổng quan

Tài liệu này hướng dẫn chuyển đổi từ deployment thủ công (theo DEPLOY_GUIDE.md) sang GitLab CI/CD tự động (theo SINGLE_VM_DEPLOYMENT.md).

## So sánh 2 phương pháp

| Khía cạnh | Manual Deployment | GitLab CI/CD |
|-----------|-------------------|--------------|
| **Backend** | JAR file + Systemd service | Docker container |
| **Frontend** | Build files trong /var/www/html | Docker container + Nginx |
| **Deploy** | Manual upload + restart | Tự động qua GitLab pipeline |
| **Rollback** | Manual restore backup | Pull image version cũ |
| **Scaling** | Khó mở rộng | Dễ scale với docker-compose |
| **Env separation** | Chung port | Staging (8080/3000) vs Prod (8081/3001) |

---

## Bước 1: Backup hệ thống hiện tại

Trước khi migration, backup toàn bộ:

```bash
# SSH vào VM
ssh gameadmin@152.42.196.25

# Backup backend
sudo systemctl stop game-backend
sudo cp -r /opt/game /opt/game-backup-$(date +%Y%m%d)

# Backup frontend
sudo cp -r /var/www/html /var/www/html-backup-$(date +%Y%m%d)

# Backup Nginx config
sudo cp /etc/nginx/sites-available/game-webapp /etc/nginx/sites-available/game-webapp.backup

# Export thông tin systemd service (để tham khảo sau)
sudo systemctl cat game-backend > ~/game-backend-service.backup
```

---

## Bước 2: Cài đặt Docker trên VM (nếu chưa có)

```bash
# Kiểm tra Docker đã cài chưa
docker --version

# Nếu chưa có, cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user vào docker group
sudo usermod -aG docker gameadmin

# Logout và login lại để áp dụng
exit
ssh gameadmin@152.42.196.25

# Verify
docker --version
docker ps

# Cài Docker Compose (nếu chưa có)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

---

## Bước 3: Tạo SSH Key cho GitLab CI/CD

```bash
# Trên VM, tạo SSH key mới cho GitLab
ssh-keygen -t rsa -b 4096 -C "gitlab-ci@game-webapp" -f ~/.ssh/gitlab_deploy_key

# Nhấn Enter để bỏ qua passphrase (quan trọng!)

# Thêm public key vào authorized_keys
cat ~/.ssh/gitlab_deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# In ra private key để copy vào GitLab
cat ~/.ssh/gitlab_deploy_key
```

**Lưu lại private key** (bắt đầu từ `-----BEGIN OPENSSH PRIVATE KEY-----` đến `-----END OPENSSH PRIVATE KEY-----`) để thêm vào GitLab Variables.

---

## Bước 4: Cấu hình GitLab Repository

### 4.1. Thêm CI/CD Variables

1. Vào GitLab repository: https://gitlab.com/migin165/project1
2. Settings → CI/CD → Variables
3. Thêm các biến sau:

| Variable Name | Value | Protected | Masked | Description |
|---------------|-------|-----------|--------|-------------|
| `SSH_PRIVATE_KEY` | Nội dung private key từ bước 3 | ✓ | ✓ | Key để SSH vào VM |
| `SERVER_IP` | `152.42.196.25` | ✓ | ✗ | IP của VM |
| `SERVER_USER` | `gameadmin` | ✓ | ✗ | Username SSH |
| `CI_REGISTRY` | `registry.gitlab.com` | ✗ | ✗ | GitLab Container Registry |
| `CI_REGISTRY_USER` | Your GitLab username | ✗ | ✗ | GitLab username |
| `CI_REGISTRY_PASSWORD` | GitLab Access Token | ✓ | ✓ | Token để push/pull images |

### 4.2. Tạo GitLab Access Token

1. Vào GitLab: Settings → Access Tokens
2. Token name: `ci-cd-deployment`
3. Expiration date: 1 year from now
4. Scopes:
   - ✓ `read_registry`
   - ✓ `write_registry`
5. Create token
6. **Copy token ngay** và lưu vào `CI_REGISTRY_PASSWORD`

---

## Bước 5: Chuẩn bị Docker Compose files trên VM

```bash
# SSH vào VM
ssh gameadmin@152.42.196.25
cd /opt/game-webapp

# Nếu chưa có thư mục, tạo mới
sudo mkdir -p /opt/game-webapp
sudo chown -R gameadmin:gameadmin /opt/game-webapp
cd /opt/game-webapp
```

### 5.1. Tạo docker-compose.staging.yml

```bash
cat > /opt/game-webapp/docker-compose.staging.yml << 'EOF'
version: '3.8'

services:
  backend-staging:
    image: registry.gitlab.com/migin165/project1/backend:latest
    container_name: game-backend-staging
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=staging
      - SERVER_PORT=8080
    volumes:
      - /opt/game/data:/app/data
      - ./logs/backend/staging:/app/logs
    networks:
      - game-network-staging
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/maps"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend-staging:
    image: registry.gitlab.com/migin165/project1/frontend:latest
    container_name: game-frontend-staging
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://152.42.196.25:8080
    depends_on:
      backend-staging:
        condition: service_healthy
    networks:
      - game-network-staging

networks:
  game-network-staging:
    driver: bridge
    name: game-staging-network
EOF
```

### 5.2. Tạo docker-compose.production.yml

```bash
cat > /opt/game-webapp/docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  backend-production:
    image: registry.gitlab.com/migin165/project1/backend:latest
    container_name: game-backend-production
    restart: unless-stopped
    ports:
      - "8081:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - SERVER_PORT=8080
      - JAVA_OPTS=-Xmx512m -Xms256m
    volumes:
      - /opt/game/data:/app/data
      - ./logs/backend/production:/app/logs
    networks:
      - game-network-production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/maps"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend-production:
    image: registry.gitlab.com/migin165/project1/frontend:latest
    container_name: game-frontend-production
    restart: unless-stopped
    ports:
      - "3001:80"
    environment:
      - REACT_APP_API_URL=https://prj1mg.me
    depends_on:
      backend-production:
        condition: service_healthy
    networks:
      - game-network-production
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

networks:
  game-network-production:
    driver: bridge
    name: game-production-network
EOF
```

### 5.3. Tạo thư mục logs

```bash
mkdir -p /opt/game-webapp/logs/backend/staging
mkdir -p /opt/game-webapp/logs/backend/production
```

---

## Bước 6: Login Docker Registry trên VM

```bash
# SSH vào VM (nếu chưa đăng nhập)
ssh gameadmin@152.42.196.25

# Login vào GitLab Container Registry
docker login registry.gitlab.com

# Username: Your GitLab username
# Password: Access Token đã tạo ở bước 4.2

# Verify login
docker info | grep -A 5 "Registry"
```

**Lưu credentials để không phải login lại:**
```bash
# Check file config
cat ~/.docker/config.json

# File này sẽ chứa auth token, giữ file này an toàn
```

---

## Bước 7: Dừng services cũ (Manual deployment)

```bash
# Stop và disable systemd service
sudo systemctl stop game-backend
sudo systemctl disable game-backend

# Verify đã dừng
sudo systemctl status game-backend
# Nên thấy: "inactive (dead)"

# Port 8080 giờ sẽ available cho Docker container
sudo netstat -tulpn | grep 8080
# Không nên thấy gì
```

---

## Bước 8: Update Nginx cho dual-environment setup

Nginx cần cấu hình để:
- Port 8081 (production backend) cho domain chính
- Port 8080 (staging backend) cho testing

```bash
# Backup Nginx config hiện tại
sudo cp /etc/nginx/sites-available/game-webapp /etc/nginx/sites-available/game-webapp.manual-backup

# Edit config
sudo nano /etc/nginx/sites-available/game-webapp
```

**Thay thế toàn bộ nội dung bằng:**

```nginx
# Production environment (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name prj1mg.me www.prj1mg.me;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/prj1mg.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prj1mg.me/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend - proxy to Docker container on port 3001
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API - proxy to Docker container on port 8081
    location /api/ {
        proxy_pass http://localhost:8081/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        # Handle preflight
        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    # Logs
    access_log /var/log/nginx/game-webapp-production-access.log;
    error_log /var/log/nginx/game-webapp-production-error.log;
}

# Staging environment (HTTP only, different subdomain - optional)
# Uncomment nếu muốn truy cập staging qua subdomain
# server {
#     listen 80;
#     server_name staging.prj1mg.me;
# 
#     location / {
#         proxy_pass http://localhost:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#     }
# 
#     location /api/ {
#         proxy_pass http://localhost:8080/api/;
#         proxy_http_version 1.1;
#         proxy_set_header Host $host;
#     }
# }

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name prj1mg.me www.prj1mg.me;
    return 301 https://$server_name$request_uri;
}
```

**Test và reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Bước 9: Test deployment thủ công trước khi dùng CI/CD

Trước khi bật CI/CD, test xem Docker containers có chạy được không:

### 9.1. Pull images từ registry

```bash
cd /opt/game-webapp

# Pull latest images
docker pull registry.gitlab.com/migin165/project1/backend:latest
docker pull registry.gitlab.com/migin165/project1/frontend:latest

# Verify
docker images | grep migin165
```

### 9.2. Test Staging environment

```bash
cd /opt/game-webapp

# Start staging
docker-compose -f docker-compose.staging.yml up -d

# Check status
docker-compose -f docker-compose.staging.yml ps

# View logs
docker-compose -f docker-compose.staging.yml logs -f backend-staging

# Test API
curl http://localhost:8080/api/maps

# Test frontend
curl http://localhost:3000

# Test từ browser
# http://152.42.196.25:3000
# http://152.42.196.25:8080/api/maps
```

**Nếu có lỗi:**
```bash
# Check container logs
docker logs game-backend-staging
docker logs game-frontend-staging

# Check networks
docker network ls

# Restart containers
docker-compose -f docker-compose.staging.yml restart
```

### 9.3. Test Production environment

```bash
cd /opt/game-webapp

# Start production
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# Test API
curl http://localhost:8081/api/maps

# Test frontend
curl http://localhost:3001

# Test qua domain
curl https://prj1mg.me/api/maps

# Test trong browser
# https://prj1mg.me
```

### 9.4. Kiểm tra cả 2 môi trường cùng chạy

```bash
# Xem tất cả containers
docker ps

# Nên thấy 4 containers:
# - game-backend-staging (port 8080)
# - game-frontend-staging (port 3000)
# - game-backend-production (port 8081)
# - game-frontend-production (port 3001)

# Check resource usage
docker stats
```

---

## Bước 10: Commit và push .gitlab-ci.yml

Nếu chưa có file `.gitlab-ci.yml` trong repository:

```bash
# Trên máy local
cd d:\2025.2\Project 1\game-webapp

# File .gitlab-ci.yml đã có sẵn
# Commit và push
git add .gitlab-ci.yml docker-compose.staging.yml docker-compose.production.yml
git commit -m "Add GitLab CI/CD configuration for single VM deployment"
git push origin main

```

---

## Bước 11: Test CI/CD Pipeline

### 11.1. Test với branch develop (Staging)

```bash
# Trên máy local
git checkout -b develop
git push origin develop

# Vào GitLab UI
# https://gitlab.com/migin165/project1/-/pipelines
```

**Pipeline sẽ chạy:**
1. ✅ Build backend
2. ✅ Build frontend
3. ✅ Build Docker images
4. ✅ Test backend
5. ✅ Test frontend
6. ✅ Deploy to staging (tự động)

**Check logs nếu có lỗi:**
- Click vào failed job
- Đọc logs để debug
- Sửa lỗi và push lại

### 11.2. Test với branch main (Production)

```bash
# Merge develop vào main
git checkout main
git merge develop
git push origin main
```

**Pipeline sẽ chạy:**
1. ✅ Build và test
2. ⏸️ Deploy to production (manual trigger)

**Manual deploy:**
1. Vào GitLab Pipelines
2. Tìm pipeline của branch main
3. Click nút **Play** (▶️) ở job `deploy:production`
4. Đợi deploy hoàn tất

---

## Bước 12: Verification sau Migration

### 12.1. Check Production

```bash
# Test API
curl https://prj1mg.me/api/maps

# Test frontend trong browser
# https://prj1mg.me
```

**Checklist:**
- [ ] Website load bình thường
- [ ] API hoạt động
- [ ] Maps hiển thị đúng
- [ ] Pathfinding chạy được
- [ ] Images load được
- [ ] Không có error trong Console (F12)

### 12.2. Check Staging

```bash
# Test staging API
curl http://152.42.196.25:8080/api/maps

# Test staging frontend
curl http://152.42.196.25:3000
```

### 12.3. Check Docker containers

```bash
# SSH vào VM
ssh gameadmin@152.42.196.25

# List containers
docker ps

# Check logs
docker logs game-backend-production
docker logs game-frontend-production

# Check resource usage
docker stats --no-stream
```

---

## Bước 13: Clean up old deployment

Sau khi CI/CD chạy ổn định (1-2 ngày), có thể dọn dẹp:

```bash
# SSH vào VM
ssh gameadmin@152.42.196.25

# Xóa systemd service file (backup trước)
sudo mv /etc/systemd/system/game-backend.service ~/game-backend.service.old
sudo systemctl daemon-reload

# Xóa old JAR files (backup trước)
sudo mv /opt/game/*.jar ~/old-jars/

# Giữ lại /opt/game/data vì Docker containers đang mount
# KHÔNG XÓA /opt/game/data/

# Xóa old frontend files (đã không dùng)
# Frontend giờ serve từ Docker container, không phải /var/www/html nữa
# Tuy nhiên có thể giữ lại làm backup

# Optional: Xóa old Node.js build files
rm -rf ~/game-webapp/frontend/build
rm -rf ~/game-webapp/frontend/node_modules
```

---

## Troubleshooting

### Lỗi: "Permission denied (publickey)"

**Nguyên nhân:** SSH key chưa được thêm vào GitLab Variables hoặc sai format

**Giải pháp:**
```bash
# Trên VM, kiểm tra lại private key
cat ~/.ssh/gitlab_deploy_key

# Copy toàn bộ (bao gồm header/footer)
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----

# Paste lại vào GitLab Variable SSH_PRIVATE_KEY
```

### Lỗi: "docker: command not found" trong pipeline

**Nguyên nhân:** GitLab Runner không có Docker

**Giải pháp:** Pipeline dùng Docker executor, không cần cài Docker trên VM. Lỗi này là do `.gitlab-ci.yml` config sai. Check file đã đúng chưa.

### Lỗi: Container không start

**Nguyên nhân:** Port conflict hoặc image lỗi

**Giải pháp:**
```bash
# Check port đang dùng
sudo netstat -tulpn | grep 8080
sudo netstat -tulpn | grep 8081

# Stop old services
sudo systemctl stop game-backend

# Remove containers
docker-compose -f docker-compose.staging.yml down
docker-compose -f docker-compose.production.yml down

# Pull lại images
docker pull registry.gitlab.com/migin165/project1/backend:latest
docker pull registry.gitlab.com/migin165/project1/frontend:latest

# Start lại
docker-compose -f docker-compose.production.yml up -d
```

### Lỗi: "exec format error"

**Nguyên nhân:** Image build cho arch khác (vd: ARM vs x86)

**Giải pháp:**
```bash
# Check arch của VM
uname -m  # x86_64 hoặc aarch64

# Rebuild images trên arch đúng, hoặc
# Update Dockerfile để support multi-arch
```

### Lỗi: Frontend không gọi được API

**Nguyên nhân:** `REACT_APP_API_URL` sai

**Giải pháp:**
```bash
# Check biến trong container
docker exec game-frontend-production env | grep REACT_APP

# Update docker-compose.production.yml
# environment:
#   - REACT_APP_API_URL=https://prj1mg.me

# Recreate container
docker-compose -f docker-compose.production.yml up -d --force-recreate frontend-production
```

---

## Best Practices sau Migration

### 1. Monitoring

```bash
# Setup cron job để check containers
crontab -e

# Thêm dòng:
*/5 * * * * docker ps | grep -q game-backend-production || docker-compose -f /opt/game-webapp/docker-compose.production.yml up -d
```

### 2. Backup định kỳ

```bash
# Backup data folder (maps, images)
0 2 * * * tar -czf /home/gameadmin/backups/game-data-$(date +\%Y\%m\%d).tar.gz /opt/game/data
```

### 3. Log rotation

Docker logs tự động rotate, nhưng nên check:
```bash
# Check log size
docker system df

# Prune logs cũ
docker system prune -f
```

### 4. Security updates

```bash
# Update Docker images định kỳ
cd /opt/game-webapp
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Update system packages
sudo apt update && sudo apt upgrade -y
```

---

## Rollback Plan

Nếu CI/CD gặp vấn đề nghiêm trọng, rollback về manual deployment:

```bash
# Stop Docker containers
docker-compose -f docker-compose.production.yml down

# Restore systemd service
sudo cp ~/game-backend.service.old /etc/systemd/system/game-backend.service
sudo systemctl daemon-reload
sudo systemctl start game-backend

# Restore Nginx config
sudo cp /etc/nginx/sites-available/game-webapp.manual-backup /etc/nginx/sites-available/game-webapp
sudo nginx -t
sudo systemctl reload nginx

# Test
curl http://localhost:8080/api/maps
```

---

## Kết luận

Sau khi hoàn tất migration:

✅ **Đã đạt được:**
- Tự động deploy từ GitLab
- Tách biệt staging và production trên cùng VM
- Dễ dàng rollback với Docker images
- Consistent deployment process

🎯 **Next steps:**
- Monitor logs và performance
- Tối ưu resource limits trong docker-compose
- Setup alerts (UptimeRobot, email notifications)
- Document deployment process cho team

📚 **Tài liệu tham khảo:**
- [SINGLE_VM_DEPLOYMENT.md](SINGLE_VM_DEPLOYMENT.md) - Hướng dẫn chi tiết CI/CD
- [.gitlab-ci.yml](.gitlab-ci.yml) - Pipeline configuration
- GitLab CI/CD docs: https://docs.gitlab.com/ee/ci/
