# 🔧 Coolify Configuration for Port 3011

## ✅ **Updated Configuration**

I've updated all files to use port **3011** consistently. Your application was already working on this port, so this should resolve the routing issue.

## 🚀 **Coolify Configuration Steps**

### **Step 1: Update Environment Variables in Coolify**

Set these environment variables in your Coolify deployment:

```bash
# CRITICAL - Use port 3011
PORT=3011
HOST=0.0.0.0
NODE_ENV=production

# Your existing variables (keep these as they are)
DATABASE_URL=your_existing_database_url
JWT_SECRET=your_existing_jwt_secret
FIREBASE_PROJECT_ID=your_existing_firebase_project_id
FIREBASE_PRIVATE_KEY=your_existing_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_existing_firebase_client_email
AWS_ACCESS_KEY_ID=your_existing_aws_access_key
AWS_SECRET_ACCESS_KEY=your_existing_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nurse-mingle-media-storage
```

### **Step 2: Update Coolify Service Settings**

In Coolify service configuration:
- **Port**: `3011`
- **Protocol**: `HTTP`
- **Health Check Path**: `/health`
- **Health Check Timeout**: `30` seconds
- **Health Check Retries**: `3`

### **Step 3: Redeploy**

After updating the configuration:
1. Save the environment variables
2. Save the service settings
3. Redeploy the application

## 📋 **Files Updated**

I've updated these files to use port 3011:
- ✅ `src/app.js` - Default port changed to 3011
- ✅ `Dockerfile` - Expose port 3011
- ✅ `Dockerfile.production` - Expose port 3011
- ✅ `docker-compose.yml` - Port mapping updated
- ✅ `.env` - PORT=3011
- ✅ `.env.production.example` - PORT=3011

## 🎯 **Expected Result**

After redeployment, your logs should show:
```
📍 Server Details:
   • Environment: production
   • Host: 0.0.0.0
   • Port: 3011
   • URL: http://0.0.0.0:3011

🔗 API Endpoints:
   • Health Check: http://0.0.0.0:3011/health
   • API Base: http://0.0.0.0:3011/api
```

## ✅ **Test After Deployment**

1. **Health Check**: `https://nursemingle.wattlesol.com/health`
2. **Root Endpoint**: `https://nursemingle.wattlesol.com/`
3. **API Base**: `https://nursemingle.wattlesol.com/api`

## 🔍 **Why This Should Fix the Issue**

Your original logs showed:
- ✅ Application running successfully on port 3011
- ✅ Healthcheck passing
- ❌ Coolify routing to wrong port (3004)

By aligning everything to port 3011:
- ✅ Application runs on 3011
- ✅ Coolify routes to 3011
- ✅ Health checks work on 3011
- ✅ External traffic reaches the application

## 🚨 **Important Notes**

1. **Commit Changes**: Make sure to commit and push the updated files to your repository
2. **Environment Variables**: The most critical change is setting `PORT=3011` in Coolify
3. **Service Port**: Update the Coolify service port to 3011

This should resolve your Bad Gateway error immediately!
