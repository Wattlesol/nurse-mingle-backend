# AWS S3 Setup Guide for Nurse Mingle Backend

## Current Issue
The AWS credentials in the `.env` file are returning a "SignatureDoesNotMatch" error, which means:
- The AWS Access Key ID is incorrect/invalid
- The AWS Secret Access Key is incorrect/invalid  
- The credentials have been revoked or expired
- The IAM user doesn't have sufficient permissions

## Required AWS Setup

### 1. Create IAM User
1. Go to AWS IAM Console
2. Click "Users" → "Create user"
3. Enter username (e.g., `nurse-mingle-s3-user`)
4. Select "Programmatic access" (for API access)

### 2. Attach S3 Permissions
Attach one of these policies to the IAM user:

#### Option A: Full S3 Access (Recommended for development)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "*"
        }
    ]
}
```

#### Option B: Bucket-Specific Access (Recommended for production)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::nurse-mingle-media-storage/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::nurse-mingle-media-storage"
        }
    ]
}
```

### 3. Create Access Keys
1. After creating the user, go to "Security credentials" tab
2. Click "Create access key"
3. Choose "Application running outside AWS"
4. Copy the Access Key ID and Secret Access Key

### 4. Verify S3 Bucket Exists
Ensure the bucket `nurse-mingle-media-storage` exists in the `us-east-1` region.

If it doesn't exist:
1. Go to S3 Console
2. Click "Create bucket"
3. Name: `nurse-mingle-media-storage`
4. Region: `us-east-1`
5. Keep default settings and create

### 5. Update Environment Variables
Replace these values in the `.env` file:

```env
AWS_ACCESS_KEY_ID=YOUR_NEW_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_NEW_SECRET_ACCESS_KEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=nurse-mingle-media-storage
AWS_S3_URL=https://nurse-mingle-media-storage.s3.amazonaws.com
```

## Testing the Setup

After updating the credentials, test with:

```bash
# Test AWS connection
node -e "
require('dotenv').config();
const AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();
s3.listBuckets((err, data) => {
  if (err) {
    console.log('AWS Error:', err.message);
  } else {
    console.log('AWS Connection successful!');
    console.log('Available buckets:', data.Buckets.map(b => b.Name));
  }
});
"
```

## Security Best Practices

1. **Never commit AWS credentials to version control**
2. **Use environment variables only**
3. **Rotate access keys regularly**
4. **Use least privilege principle** (bucket-specific permissions)
5. **Enable CloudTrail for audit logging**

## Troubleshooting

### Common Errors:
- `SignatureDoesNotMatch`: Invalid credentials
- `AccessDenied`: Insufficient permissions
- `NoSuchBucket`: Bucket doesn't exist or wrong region
- `CredentialsError`: Missing or malformed credentials

### Debug Steps:
1. Verify credentials are correct
2. Check IAM user has proper policies attached
3. Ensure bucket exists in the correct region
4. Test with AWS CLI: `aws s3 ls s3://nurse-mingle-media-storage`

## Required Information from Client

Please provide:
1. **New AWS Access Key ID**
2. **New AWS Secret Access Key**
3. **Confirmation that the IAM user has S3 permissions**
4. **Confirmation that the bucket `nurse-mingle-media-storage` exists in `us-east-1`**

Once you provide these, the file upload functionality will work correctly.
