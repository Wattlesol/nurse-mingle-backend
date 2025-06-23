# Orange Backend Deployment Guide

This guide covers deploying the Orange Backend to various platforms including Coolify, Docker, and cloud providers.

## 🚀 Quick Start with Coolify

### Prerequisites
- Coolify instance running
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

### Step 1: Prepare Environment Variables
Create a `.env` file with production values:

```env
NODE_ENV=production
PORT=3004
DATABASE_URL=postgresql://user:pass@host:5432/orange_db
JWT_SECRET=your-production-jwt-secret
# ... other production variables
```

### Step 2: Deploy to Coolify

1. **Create New Application**
   - Go to your Coolify dashboard
   - Click "New Application"
   - Choose "Docker Compose" or "Dockerfile"

2. **Configure Repository**
   - Connect your Git repository
   - Set branch to `main` or `production`
   - Set build context to `/NodeProject`

3. **Environment Configuration**
   - Add all environment variables from `.env`
   - Set `PORT=3004` (avoid port 80 as it conflicts with Coolify)

4. **Domain Configuration**
   - Set your domain (e.g., `api.orange.com`)
   - Enable SSL/TLS
   - Configure reverse proxy

5. **Deploy**
   - Click "Deploy"
   - Monitor logs for any issues

### Step 3: Database Setup
```bash
# Connect to your application container
docker exec -it orange-api bash

# Run database migrations
npm run db:push

# Seed initial data
npm run db:seed
```

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd NodeProject
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Setup Database**
   ```bash
   docker-compose exec api npm run db:push
   docker-compose exec api npm run db:seed
   ```

### Using Docker Only

1. **Build Image**
   ```bash
   docker build -t orange-backend .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     --name orange-api \
     -p 3004:3004 \
     --env-file .env \
     orange-backend
   ```

---

## ☁️ Cloud Platform Deployment

### AWS ECS with Fargate

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name orange-backend
   ```

2. **Build and Push Image**
   ```bash
   # Get login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Build and tag
   docker build -t orange-backend .
   docker tag orange-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/orange-backend:latest

   # Push
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/orange-backend:latest
   ```

3. **Create ECS Task Definition**
   ```json
   {
     "family": "orange-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "orange-api",
         "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/orange-backend:latest",
         "portMappings": [
           {
             "containerPort": 3004,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/orange-backend",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

### Google Cloud Run

1. **Build and Push to Container Registry**
   ```bash
   # Configure Docker for GCR
   gcloud auth configure-docker

   # Build and push
   docker build -t gcr.io/PROJECT-ID/orange-backend .
   docker push gcr.io/PROJECT-ID/orange-backend
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy orange-backend \
     --image gcr.io/PROJECT-ID/orange-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3004 \
     --set-env-vars NODE_ENV=production
   ```

### DigitalOcean App Platform

1. **Create App Spec**
   ```yaml
   name: orange-backend
   services:
   - name: api
     source_dir: /NodeProject
     github:
       repo: your-username/orange-backend
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     http_port: 3004
     envs:
     - key: NODE_ENV
       value: production
     - key: PORT
       value: "3004"
   ```

2. **Deploy**
   ```bash
   doctl apps create --spec app.yaml
   ```

---

## 🗄️ Database Setup

### PostgreSQL on Cloud

#### AWS RDS
1. Create RDS PostgreSQL instance
2. Configure security groups
3. Update `DATABASE_URL` in environment variables

#### Google Cloud SQL
1. Create Cloud SQL PostgreSQL instance
2. Configure authorized networks
3. Update connection string

#### DigitalOcean Managed Database
1. Create managed PostgreSQL cluster
2. Add trusted sources
3. Update connection details

### Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run migrations (if using migrations)
npx prisma migrate deploy

# Seed initial data
npm run db:seed
```

---

## 🔧 Production Configuration

### Environment Variables
```env
# Production settings
NODE_ENV=production
PORT=3004

# Database
DATABASE_URL=postgresql://user:pass@host:5432/orange_db

# Security
JWT_SECRET=complex-production-secret
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com

# External Services
FIREBASE_PROJECT_ID=your-prod-project
AWS_S3_BUCKET=your-prod-bucket
AGORA_APP_ID=your-prod-agora-id

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=error
```

### Nginx Configuration (if using reverse proxy)
```nginx
server {
    listen 80;
    server_name api.orange.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.orange.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO support
    location /socket.io/ {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Monitoring & Logging

### Health Checks
The application provides a health check endpoint:
```
GET /health
```

### Logging
Configure structured logging for production:
```javascript
// In production, use structured logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}
```

### Monitoring Tools
- **Sentry**: Error tracking and performance monitoring
- **New Relic**: Application performance monitoring
- **DataDog**: Infrastructure and application monitoring
- **Prometheus + Grafana**: Custom metrics and dashboards

---

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT secrets
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database connection encryption
- [ ] File upload validation
- [ ] Input sanitization
- [ ] API authentication

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check network connectivity

2. **File Upload Issues**
   - Verify AWS S3 credentials
   - Check bucket permissions
   - Validate file size limits

3. **Socket.IO Connection Issues**
   - Check CORS configuration
   - Verify WebSocket support
   - Check firewall settings

4. **High Memory Usage**
   - Monitor for memory leaks
   - Optimize database queries
   - Consider horizontal scaling

### Logs Location
- Application logs: `/app/logs/`
- Container logs: `docker logs <container-name>`
- System logs: `/var/log/`

---

## 📈 Scaling

### Horizontal Scaling
- Use load balancer (nginx, AWS ALB, etc.)
- Deploy multiple instances
- Configure session storage (Redis)
- Database read replicas

### Vertical Scaling
- Increase CPU/memory allocation
- Optimize database queries
- Enable caching (Redis)
- CDN for static assets

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Build and push Docker image
      run: |
        docker build -t orange-backend .
        docker tag orange-backend ${{ secrets.REGISTRY_URL }}/orange-backend:latest
        docker push ${{ secrets.REGISTRY_URL }}/orange-backend:latest
    
    - name: Deploy to production
      run: |
        # Your deployment commands here
```

---

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify environment variables
3. Test database connectivity
4. Check external service configurations
5. Contact the development team

---

**Note**: Always test deployments in a staging environment before production!
