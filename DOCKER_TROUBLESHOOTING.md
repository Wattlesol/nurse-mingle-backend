# Docker Deployment Troubleshooting Guide

## ✅ Local Docker Testing Results

The application has been successfully tested in a local Docker environment and is working correctly:

- ✅ **Server Status**: Running on port 3004 with host binding `0.0.0.0`
- ✅ **Database Connection**: PostgreSQL connected via Prisma
- ✅ **Health Check**: `/health` endpoint responding with 200 OK
- ✅ **API Endpoints**: All endpoints accessible
- ✅ **Firebase**: Admin SDK initialized successfully
- ✅ **AWS S3**: Configuration loaded properly

## 🔧 Fixed Issues for Docker Deployment

### 1. Port Configuration
**Problem**: Dockerfile exposed port 3011 but app used port 3004
**Solution**: Updated Dockerfile to expose port 3004

### 2. Host Binding
**Problem**: App bound to `localhost` which doesn't work in containers
**Solution**: Changed HOST to `0.0.0.0` in both app.js and .env

### 3. Database URL
**Problem**: Using external database URL in Docker environment
**Solution**: Updated to use Docker Compose service names

## 🚨 Potential Coolify Deployment Issues

### 1. Environment Variables
**Check**: Ensure all required environment variables are set in Coolify:
```bash
NODE_ENV=production
PORT=3004
HOST=0.0.0.0
DATABASE_URL=your_production_database_url
JWT_SECRET=your_jwt_secret
FIREBASE_PROJECT_ID=your_project_id
# ... other required vars
```

### 2. Port Configuration
**Issue**: Coolify might not be routing to the correct port
**Solution**: 
- Ensure Coolify is configured to route to port 3004
- Check if the application is binding to the correct port
- Verify PORT environment variable is set correctly

### 3. Health Check Configuration
**Issue**: Coolify health checks might be failing
**Solution**:
- Configure Coolify to use `/health` endpoint
- Set appropriate timeout values (30s+)
- Ensure health check path is correct

### 4. Database Connection
**Issue**: Database connection failures causing startup issues
**Solution**:
- Verify DATABASE_URL is correct for production
- Check database server accessibility from Coolify
- Ensure database credentials are valid
- Test connection manually if possible

### 5. Firebase Configuration
**Issue**: Firebase private key formatting issues
**Solution**:
- Ensure FIREBASE_PRIVATE_KEY is properly escaped
- Use base64 encoding for complex keys
- Verify all Firebase environment variables are set

### 6. Memory/Resource Limits
**Issue**: Container running out of memory
**Solution**:
- Increase memory limits in Coolify
- Monitor resource usage
- Optimize application if needed

## 🔍 Debugging Steps for Coolify

### 1. Check Container Logs
```bash
# In Coolify, check the application logs for:
- Startup errors
- Database connection issues
- Port binding problems
- Environment variable issues
```

### 2. Test Health Endpoint
```bash
# From within Coolify environment:
curl http://localhost:3004/health
```

### 3. Verify Environment Variables
```bash
# Check if all required env vars are set:
env | grep -E "(NODE_ENV|PORT|DATABASE_URL|JWT_SECRET)"
```

### 4. Database Connection Test
```bash
# Test database connectivity:
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => {
  console.log('Database connected');
  process.exit(0);
}).catch(err => {
  console.error('Database error:', err);
  process.exit(1);
});
"
```

## 📋 Coolify Configuration Checklist

- [ ] **Port**: Set to 3004
- [ ] **Health Check**: `/health` endpoint configured
- [ ] **Environment Variables**: All required vars set
- [ ] **Database**: Connection string correct
- [ ] **Memory**: Adequate memory allocated (512MB+)
- [ ] **Build**: Using correct Dockerfile
- [ ] **Network**: Proper network configuration
- [ ] **SSL**: HTTPS configuration if needed

## 🛠️ Recommended Coolify Settings

```yaml
# Coolify Configuration
port: 3004
health_check:
  path: /health
  timeout: 30s
  interval: 30s
  retries: 3
resources:
  memory: 512Mi
  cpu: 500m
environment:
  NODE_ENV: production
  PORT: 3004
  HOST: 0.0.0.0
```

## 🔄 Next Steps

1. **Deploy with Production Dockerfile**: Use `Dockerfile.production` for better optimization
2. **Monitor Logs**: Check Coolify logs during deployment
3. **Test Endpoints**: Verify all endpoints work after deployment
4. **Performance Testing**: Run load tests to ensure stability
5. **Monitoring**: Set up application monitoring and alerts

## 📞 Support

If issues persist, provide the following information:
- Coolify deployment logs
- Application container logs
- Environment variable configuration
- Database connection details (without credentials)
- Network configuration details
