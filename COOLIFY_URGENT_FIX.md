# 🚨 URGENT COOLIFY FIX REQUIRED

## Critical Issues Found in Container Logs

Your application is running but with **wrong configuration**:

❌ **Port**: 3011 (should be 3004)
❌ **Host**: localhost (should be 0.0.0.0)  
❌ **Environment**: development (should be production)

## 🔧 IMMEDIATE ACTION REQUIRED

### Step 1: Set These Environment Variables in Coolify

Go to your Coolify deployment settings and add/update these environment variables:

```bash
# CRITICAL - Fix port and host
PORT=3004
HOST=0.0.0.0
NODE_ENV=production

# Your existing database and other vars
DATABASE_URL=your_existing_database_url
JWT_SECRET=your_existing_jwt_secret
FIREBASE_PROJECT_ID=your_existing_firebase_project_id
FIREBASE_PRIVATE_KEY=your_existing_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_existing_firebase_client_email
AWS_ACCESS_KEY_ID=your_existing_aws_access_key
AWS_SECRET_ACCESS_KEY=your_existing_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nurse-mingle-media-storage

# Add any other environment variables you have
```

### Step 2: Update Coolify Port Configuration

In Coolify settings:
- Set **Port** to: `3004`
- Set **Health Check Path** to: `/health`
- Set **Health Check Timeout** to: `30` seconds

### Step 3: Redeploy

After setting the environment variables, redeploy the application.

## 🎯 Expected Result After Fix

The logs should show:
```
• Environment: production
• Host: 0.0.0.0
• Port: 3004
• URL: http://0.0.0.0:3004
```

## 🔍 Why This Causes Bad Gateway

1. **Port Mismatch**: Coolify is trying to route traffic to port 3004, but your app is running on 3011
2. **Host Binding**: App bound to localhost can't receive external traffic in containers
3. **Health Check**: Coolify health checks are failing because of wrong port

## ⚡ Quick Test After Fix

Once redeployed, test:
```bash
curl https://your-app-domain.com/health
```

Should return:
```json
{
  "status": "OK",
  "database": "Connected",
  ...
}
```

## 📋 Environment Variables Checklist

Make sure these are set in Coolify:

- [ ] `PORT=3004`
- [ ] `HOST=0.0.0.0`
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL=...`
- [ ] `JWT_SECRET=...`
- [ ] `FIREBASE_PROJECT_ID=...`
- [ ] `FIREBASE_PRIVATE_KEY=...`
- [ ] `FIREBASE_CLIENT_EMAIL=...`
- [ ] `AWS_ACCESS_KEY_ID=...`
- [ ] `AWS_SECRET_ACCESS_KEY=...`
- [ ] All other required variables

## 🚀 This Should Fix Your Bad Gateway Error

The bad gateway error is happening because:
1. Coolify expects the app on port 3004
2. Your app is running on port 3011
3. Health checks are failing
4. Traffic can't reach the application

Setting `PORT=3004` and `HOST=0.0.0.0` will resolve this immediately.
