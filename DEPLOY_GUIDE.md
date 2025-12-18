# 🚀 Hướng dẫn Deploy lên Internet

Hướng dẫn chi tiết để triển khai Game Web Application - Pathfinding Visualizer lên môi trường production.

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Chuẩn bị trước khi deploy](#chuẩn-bị-trước-khi-deploy)
3. [Phương án deploy](#phương-án-deploy)
4. [Deploy Backend](#deploy-backend)
5. [Deploy Frontend](#deploy-frontend)
6. [Cấu hình Domain và SSL](#cấu-hình-domain-và-ssl)
7. [Monitoring và Maintenance](#monitoring-và-maintenance)
8. [Rollback Strategy](#rollback-strategy)

---

## 🎯 Tổng quan

### Kiến trúc Production

```
┌─────────────────────────────────────────────────┐
│              Internet Users                      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│         CDN / Static Hosting (Frontend)         │
│         - Vercel / Netlify / AWS S3             │
└──────────────────┬──────────────────────────────┘
                   │
                   │ API Calls
                   ▼
┌─────────────────────────────────────────────────┐
│         Backend Server (Spring Boot)            │
│         - Heroku / Railway / AWS EC2            │
│         - Port 8080 → Expose via reverse proxy  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│         Static Files (Images, Maps)             │
│         - Local disk / S3 / Cloud Storage       │
└─────────────────────────────────────────────────┘
```

### Yêu cầu hệ thống Production

- **Backend**: Java 17+, 512MB RAM minimum (1GB recommended)
- **Frontend**: Static hosting với HTTPS
- **Database**: Không cần (file-based)
- **Storage**: ~50MB cho images và map files

---

## 🛠️ Chuẩn bị trước khi deploy

### 1. Checklist Backend

- [ ] Build thành công: `mvn clean package`
- [ ] Tạo file `application-prod.properties`
- [ ] Cấu hình CORS cho domain production
- [ ] Kiểm tra log level (INFO/WARN cho production)
- [ ] Đóng gói data folder (maps, images)

### 2. Checklist Frontend

- [ ] Build production: `npm run build`
- [ ] Kiểm tra build output trong `build/`
- [ ] Cập nhật API base URL cho production
- [ ] Test responsive trên mobile/tablet
- [ ] Optimize images nếu cần

### 3. Tài khoản cần có

- [ ] GitHub account (để host source code)
- [ ] Domain name (tùy chọn, hoặc dùng subdomain free)
- [ ] Tài khoản hosting (chọn 1):
  - Vercel/Netlify (Frontend - Free tier)
  - Heroku/Railway (Backend - Free/Paid tier)
  - AWS/DigitalOcean (Full control - Paid)

---

## 🎨 Phương án deploy

### Option 1: Free Tier (Recommended cho bắt đầu)

**Frontend**: Vercel hoặc Netlify
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Auto deploy từ Git
- ✅ Custom domain support

**Backend**: Railway hoặc Render
- ✅ Free tier với giới hạn hours
- ✅ Auto restart
- ✅ Environment variables
- ⚠️ Sleep sau 15 phút không hoạt động (Railway)

### Option 2: Low-Cost VPS

**Hosting**: DigitalOcean Droplet hoặc AWS Lightsail
- ✅ Full control
- ✅ $5-10/month
- ✅ Có thể host cả Frontend + Backend
- ⚠️ Cần tự quản lý server

### Option 3: Enterprise (Full AWS/Azure)

**Infrastructure**: 
- Frontend: AWS S3 + CloudFront
- Backend: AWS EC2 / ECS / Elastic Beanstalk
- Storage: AWS S3
- ⚠️ Phức tạp, chi phí cao hơn

---

## 🔧 Deploy Backend

### A. Deploy lên Railway (Recommended)

#### 1. Chuẩn bị project

**Tạo file `Procfile` trong thư mục `backend/`:**
```
web: java -Dserver.port=$PORT -jar target/game-backend-0.0.1-SNAPSHOT.jar
```

**Tạo `system.properties` trong thư mục `backend/`:**
```properties
java.runtime.version=17
```

**Cập nhật `application.properties`:**
```properties
# Production profile
spring.profiles.active=${SPRING_PROFILES_ACTIVE:prod}
server.port=${PORT:8080}

# CORS - Cập nhật domain thực tế
cors.allowed.origins=${CORS_ORIGINS:https://your-frontend-domain.vercel.app}
```

#### 2. Deploy steps

```bash
# 1. Push code lên GitHub
git init
git add .
git commit -m "Prepare for production deployment"
git branch -M main
git remote add origin https://github.com/your-username/game-webapp.git
git push -u origin main

# 2. Truy cập Railway
# - Đăng nhập https://railway.app
# - Click "New Project" → "Deploy from GitHub repo"
# - Chọn repository: game-webapp
# - Chọn thư mục: backend/

# 3. Cấu hình Environment Variables
# Trong Railway Dashboard → Variables:
SPRING_PROFILES_ACTIVE=prod
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
```

#### 3. Upload static files

Railway không persistent storage, cần upload `data/` folder:

**Option A**: Commit vào Git
```bash
# Đảm bảo data/ không trong .gitignore
git add backend/data/
git commit -m "Add data files"
git push
```

**Option B**: Sử dụng AWS S3
- Upload `data/img/` lên S3 bucket
- Cập nhật `ImageController.java` để load từ S3
- Set environment variables: `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `S3_BUCKET_NAME`

#### 4. Verify deployment

```bash
# Test API endpoint
curl https://your-app.railway.app/api/maps

# Test image endpoint
curl https://your-app.railway.app/api/images/mario.jpeg
```

### B. Deploy lên Heroku

#### 1. Cài đặt Heroku CLI

```bash
# Windows (PowerShell)
# Download và cài đặt từ: https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. Deploy commands

```bash
cd backend

# Login Heroku
heroku login

# Tạo app
heroku create your-game-backend

# Set Java version
heroku config:set JAVA_TOOL_OPTIONS="-Xmx300m -Xss512k"

# Set environment variables
heroku config:set SPRING_PROFILES_ACTIVE=prod
heroku config:set CORS_ORIGINS=https://your-frontend.vercel.app

# Deploy
git subtree push --prefix backend heroku main

# Hoặc nếu backend là root:
git push heroku main

# View logs
heroku logs --tail
```

### C. Deploy lên VPS (Ubuntu)

#### 1. Setup server

```bash
# SSH vào server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Cài Java 17
apt install openjdk-17-jdk -y

# Verify
java -version
```

#### 2. Upload và chạy application

```bash
# Trên local machine, build JAR
cd backend
mvn clean package -DskipTests

# Upload lên server (sử dụng SCP)
scp target/game-backend-0.0.1-SNAPSHOT.jar root@your-server-ip:/opt/game/
scp -r data/ root@your-server-ip:/opt/game/

# Trên server, tạo systemd service
sudo nano /etc/systemd/system/game-backend.service
```

**File `game-backend.service`:**
```ini
[Unit]
Description=Game Backend Service
After=syslog.target network.target

[Service]
User=root
WorkingDirectory=/opt/game
ExecStart=/usr/bin/java -jar /opt/game/game-backend-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="CORS_ORIGINS=https://your-frontend-domain.com"

[Install]
WantedBy=multi-user.target
```

```bash
# Enable và start service
sudo systemctl daemon-reload
sudo systemctl enable game-backend
sudo systemctl start game-backend

# Check status
sudo systemctl status game-backend

# View logs
sudo journalctl -u game-backend -f
```

#### 3. Setup Nginx reverse proxy

```bash
# Cài Nginx
apt install nginx -y

# Cấu hình
sudo nano /etc/nginx/sites-available/game-backend
```

**File cấu hình:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/game-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🎨 Deploy Frontend

### A. Deploy lên Vercel (Recommended)

#### 1. Chuẩn bị project

**Tạo `vercel.json` trong thư mục `frontend/`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**Cập nhật `src/services/api.js`:**
```javascript
import axios from 'axios';

// Sử dụng environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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

// Export base URL cho images
export const getImageUrl = (filename) => `${API_BASE_URL}/api/images/${filename}`;

export default api;
```

**Cập nhật `GameBoard.js` để sử dụng dynamic URL:**
```javascript
import { getImageUrl } from '../services/api';

// Trong renderTileContent:
if (playerPosition && playerPosition.row === rowIndex && playerPosition.col === colIndex) {
  return <img src={getImageUrl('mario.jpeg')} alt="Player" className="player-marker-image" />;
}

if (tile === 'x') {
  if (isAnimating && playerPosition && !(playerPosition.row === rowIndex && playerPosition.col === colIndex)) {
    return null;
  }
  return <img src={getImageUrl('mario.jpeg')} alt="Start" className="tile-image" />;
} else if (tile === 'y') {
  return <img src={getImageUrl('diamond.jpg')} alt="End" className="tile-image" />;
}
```

**Tạo file `.env.production` trong `frontend/`:**
```env
REACT_APP_API_URL=https://your-backend.railway.app
```

#### 2. Deploy lên Vercel

```bash
# Cài Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Hoặc deploy qua Web UI:
# 1. Push code lên GitHub
# 2. Truy cập https://vercel.com
# 3. Import project từ GitHub
# 4. Chọn thư mục: frontend
# 5. Set environment variable: REACT_APP_API_URL
# 6. Deploy
```

#### 3. Cấu hình Environment Variables trên Vercel

Trong Vercel Dashboard → Settings → Environment Variables:
```
REACT_APP_API_URL=https://your-backend.railway.app
```

### B. Deploy lên Netlify

#### 1. Chuẩn bị

**Tạo `netlify.toml` trong `frontend/`:**
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  REACT_APP_API_URL = "https://your-backend.railway.app"
```

#### 2. Deploy

```bash
# Cài Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod

# Hoặc qua Web UI:
# 1. Push lên GitHub
# 2. https://app.netlify.com → New site from Git
# 3. Chọn repo → Chọn thư mục frontend
# 4. Build command: npm run build
# 5. Publish directory: build
# 6. Environment variables: REACT_APP_API_URL
```

### C. Deploy lên AWS S3 + CloudFront

#### 1. Build production

```bash
cd frontend
REACT_APP_API_URL=https://your-backend.railway.app npm run build
```

#### 2. Upload lên S3

```bash
# Cài AWS CLI
# Windows: https://aws.amazon.com/cli/

# Configure AWS
aws configure

# Tạo S3 bucket
aws s3 mb s3://your-game-frontend

# Upload build folder
aws s3 sync build/ s3://your-game-frontend --delete

# Enable static website hosting
aws s3 website s3://your-game-frontend --index-document index.html --error-document index.html
```

#### 3. Setup CloudFront (Optional - cho CDN)

```bash
# Tạo CloudFront distribution qua AWS Console
# Origin: S3 bucket
# Default cache behavior: Redirect HTTP to HTTPS
# Custom error pages: 404 → /index.html (cho SPA routing)
```

---

## 🔒 Cấu hình Domain và SSL

### 1. Mua Domain

**Nhà cung cấp:**
- Namecheap (Rẻ, dễ dùng)
- GoDaddy
- Google Domains
- Tên miền Việt Nam: .vn, .com.vn (VNNIC)

### 2. Cấu hình DNS

**Trên Domain provider (ví dụ Namecheap):**

```
Type    Host        Value                           TTL
A       @           IP-cua-backend-server           Automatic
CNAME   www         your-app.vercel.app             Automatic
CNAME   api         your-backend.railway.app        Automatic
```

**Hoặc nếu dùng Vercel/Netlify cho frontend:**
```
Type    Host        Value                           TTL
CNAME   @           cname.vercel-dns.com            Automatic
CNAME   www         cname.vercel-dns.com            Automatic
CNAME   api         your-backend.railway.app        Automatic
```

### 3. SSL Certificate

**Option A: Tự động (Vercel/Netlify/Railway)**
- SSL tự động enable khi add custom domain
- Let's Encrypt certificate tự động renew

**Option B: Certbot (cho VPS)**
```bash
# Cài Certbot
apt install certbot python3-certbot-nginx -y

# Generate certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto renew
certbot renew --dry-run
```

### 4. Cập nhật CORS trong Backend

**File `application-prod.properties`:**
```properties
cors.allowed.origins=https://yourdomain.com,https://www.yourdomain.com
```

**Hoặc trong `CorsConfig.java`:**
```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    String allowedOrigins = environment.getProperty("cors.allowed.origins", 
        "https://yourdomain.com,https://www.yourdomain.com");
    
    registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins.split(","))
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
}
```

---

## 📊 Monitoring và Maintenance

### 1. Health Check Endpoints

**Thêm vào `MapController.java`:**
```java
@GetMapping("/health")
public ResponseEntity<Map<String, String>> health() {
    Map<String, String> status = new HashMap<>();
    status.put("status", "UP");
    status.put("timestamp", LocalDateTime.now().toString());
    return ResponseEntity.ok(status);
}
```

### 2. Logging

**Production logging (application-prod.properties):**
```properties
# Log level
logging.level.root=WARN
logging.level.com.game=INFO

# Log file
logging.file.name=logs/game-backend.log
logging.file.max-size=10MB
logging.file.max-history=7
```

### 3. Monitoring Tools

**Free options:**
- **UptimeRobot**: Monitor uptime, alert khi down
- **Google Analytics**: Track frontend usage
- **Railway/Heroku Metrics**: Built-in metrics
- **CloudWatch** (AWS): Logs và metrics

**Setup UptimeRobot:**
```
1. Đăng ký https://uptimerobot.com (Free)
2. Add Monitor:
   - Type: HTTPS
   - URL: https://api.yourdomain.com/api/health
   - Interval: 5 minutes
3. Add Alert Contacts (Email, SMS)
```

### 4. Backup Strategy

**Backend data:**
```bash
# Backup script (chạy định kỳ)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz /opt/game/data/
# Upload to S3 or Google Drive
aws s3 cp backup_$DATE.tar.gz s3://your-backup-bucket/
```

**Frontend:**
- Code đã có trên Git → Không cần backup riêng
- Build artifacts có thể tái tạo từ code

---

## 🔄 Rollback Strategy

### 1. Backend Rollback

**Railway/Heroku:**
```bash
# Heroku - Rollback to previous release
heroku releases
heroku rollback v123

# Railway - Qua Web UI
# Deployments → Chọn deployment trước → Redeploy
```

**VPS:**
```bash
# Keep multiple JAR versions
/opt/game/
├── current -> game-backend-v1.2.0.jar
├── game-backend-v1.2.0.jar
├── game-backend-v1.1.0.jar
└── game-backend-v1.0.0.jar

# Rollback
cd /opt/game
ln -sf game-backend-v1.1.0.jar current
systemctl restart game-backend
```

### 2. Frontend Rollback

**Vercel:**
```bash
# Qua Web UI: Deployments → Previous deployment → Promote to Production
# Hoặc CLI:
vercel rollback
```

**S3 + CloudFront:**
```bash
# Enable S3 versioning
aws s3api put-bucket-versioning --bucket your-game-frontend --versioning-configuration Status=Enabled

# Restore previous version khi cần
aws s3api list-object-versions --bucket your-game-frontend
# Copy old version back
```

---

## 🚨 Troubleshooting Production Issues

### Issue 1: CORS Error

**Triệu chứng:** Frontend không gọi được API, Console có lỗi CORS

**Giải pháp:**
```bash
# Kiểm tra CORS_ORIGINS environment variable
# Railway: Settings → Variables
# Heroku: heroku config
# VPS: Kiểm tra application-prod.properties

# Test CORS bằng curl
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.yourdomain.com/api/maps -v
```

### Issue 2: Images không load

**Triệu chứng:** Mario và Diamond không hiển thị

**Giải pháp:**
```bash
# Kiểm tra data/img/ folder có được deploy không
# Railway/Heroku: Commit vào Git
git add backend/data/img/
git commit -m "Add image files"
git push

# Hoặc chuyển sang S3
```

### Issue 3: Backend sleep/crash

**Triệu chứng:** API chậm hoặc không response (Railway free tier)

**Giải pháp:**
```bash
# Option 1: Upgrade plan
# Option 2: Keep-alive ping
# Tạo cron job ping /api/health mỗi 10 phút

# Option 3: Di chuyển sang VPS
```

### Issue 4: Build failed

**Triệu chứng:** Deploy lỗi khi build

**Giải pháp:**
```bash
# Backend: Kiểm tra Java version
java -version  # Phải match với system.properties

# Frontend: Clear cache và rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# Kiểm tra logs chi tiết
# Railway: View logs tab
# Vercel: Deployment → View function logs
```

---

## 📝 Checklist Deploy Production

### Pre-Deploy
- [ ] Code đã commit và push lên Git
- [ ] Build local thành công (backend + frontend)
- [ ] Environment variables đã chuẩn bị
- [ ] Domain đã mua (nếu cần)
- [ ] Hosting accounts đã tạo

### Deploy Backend
- [ ] Deploy lên Railway/Heroku/VPS
- [ ] Upload data files (maps, images)
- [ ] Set environment variables (CORS_ORIGINS)
- [ ] Test API endpoints
- [ ] Verify images load được

### Deploy Frontend
- [ ] Update API_URL trong .env.production
- [ ] Build production bundle
- [ ] Deploy lên Vercel/Netlify
- [ ] Test trên nhiều devices/browsers
- [ ] Verify tất cả features hoạt động

### Post-Deploy
- [ ] Configure custom domain
- [ ] Enable SSL certificate
- [ ] Setup monitoring (UptimeRobot)
- [ ] Document deployment process
- [ ] Create backup strategy
- [ ] Test rollback procedure

---

## 🎓 Resources

### Documentation
- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [Spring Boot Deployment](https://docs.spring.io/spring-boot/docs/current/reference/html/deployment.html)

### Tutorials
- [Deploy Spring Boot to Railway](https://railway.app/templates/spring-boot)
- [Deploy React to Vercel](https://vercel.com/guides/deploying-react-with-vercel)
- [Setup Nginx Reverse Proxy](https://www.digitalocean.com/community/tutorials/how-to-configure-nginx-as-a-reverse-proxy-on-ubuntu-22-04)

### Cost Estimation
- **Free Tier**: $0/month (Vercel + Railway free tier)
- **Low Budget**: $5-15/month (VPS DigitalOcean/Lightsail)
- **Production**: $50-200/month (AWS với autoscaling)

---

## 📞 Support

Nếu gặp vấn đề khi deploy, check:
1. Logs của service (Railway/Heroku/VPS)
2. Browser Console (F12) cho frontend errors
3. Network tab để xem API calls
4. CORS configuration
5. Environment variables

Good luck với deployment! 🚀

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Author**: Game Web Application Team
