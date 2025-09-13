# Storage Migration Guide

This guide will help you migrate from local file storage to cloud storage for production deployment.

## Overview

The application has been updated to support multiple storage backends:
- **Local Storage** (development only)
- **AWS S3** (recommended for production)
- **Cloudinary** (easy setup alternative)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Choose Your Storage Provider

#### Option A: AWS S3 (Recommended)

1. Create an AWS account and S3 bucket
2. Create an IAM user with S3 permissions
3. Set environment variables:

```bash
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_REGION=us-east-1
AWS_S3_BASE_URL=https://your_bucket_name.s3.us-east-1.amazonaws.com
```

#### Option B: Cloudinary (Easy Setup)

1. Create a Cloudinary account
2. Get your credentials from the dashboard
3. Set environment variables:

```bash
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

#### Option C: Local Storage (Development Only)

```bash
STORAGE_TYPE=local
NEXT_PUBLIC_BASE_URL=http://localhost:9002
```

### 3. Migrate Existing Files

If you have existing files in `public/uploads/`, run the migration:

#### Using the Admin Interface

1. Go to your admin dashboard
2. Use the Migration Panel to create a backup and migrate files

#### Using the Command Line

```bash
# Set your environment variables first
node scripts/migrate-to-cloud.js
```

## File Structure Changes

### New Files Added

- `src/lib/storage.ts` - Storage service abstraction
- `src/lib/migration.ts` - Migration utilities
- `src/app/api/migrate/route.ts` - Migration API endpoint
- `src/components/migration-panel.tsx` - Admin migration interface
- `scripts/migrate-to-cloud.js` - Command-line migration script

### Modified Files

- `src/app/actions.ts` - Updated to use cloud storage
- `src/lib/data.ts` - Updated to handle cloud URLs
- `package.json` - Added AWS SDK dependencies

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Storage Configuration
STORAGE_TYPE=s3  # or 'cloudinary' or 'local'

# For AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_REGION=us-east-1
AWS_S3_BASE_URL=https://your_bucket_name.s3.us-east-1.amazonaws.com

# For Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# For Local Development
NEXT_PUBLIC_BASE_URL=http://localhost:9002
```

## Migration Process

### 1. Backup Your Data

Before migrating, always create a backup:

```bash
# Using the API
curl -X POST http://localhost:9002/api/migrate \
  -H "Content-Type: application/json" \
  -d '{"action": "backup"}'
```

### 2. Test Your Configuration

Make sure your cloud storage is working by uploading a test file through the admin interface.

### 3. Run Migration

```bash
# Using the command line
node scripts/migrate-to-cloud.js

# Or using the admin interface
# Go to admin dashboard and use the Migration Panel
```

### 4. Verify Migration

Check that:
- Files are accessible via cloud URLs
- Database URLs have been updated
- No broken images or videos

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Make sure all required environment variables are set
   - Check that `.env.local` is in the project root

2. **AWS S3 Permissions**
   - Ensure your IAM user has `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions
   - Make sure the bucket allows public read access for uploaded files

3. **Cloudinary Upload Preset**
   - Create an unsigned upload preset in Cloudinary dashboard
   - Set it to allow all file types

4. **Migration Failures**
   - Check the error logs in the migration results
   - Ensure your cloud storage credentials are correct
   - Verify network connectivity

### Rollback

If migration fails, you can restore from backup:

```bash
# Restore from backup file
node -e "
const { restoreDatabase } = require('./src/lib/migration.ts');
restoreDatabase('path/to/backup.json');
"
```

## Production Deployment

### Hosting Platforms

#### Vercel
- Set environment variables in the Vercel dashboard
- Use AWS S3 or Cloudinary (local storage won't work)

#### Netlify
- Set environment variables in Netlify dashboard
- Use AWS S3 or Cloudinary

#### Railway/Render
- Set environment variables in platform dashboard
- Use AWS S3 or Cloudinary

### Security Best Practices

1. **Never commit `.env.local` to version control**
2. **Use IAM roles instead of access keys when possible**
3. **Set up proper CORS policies for your S3 bucket**
4. **Use signed uploads for better security**

## Support

If you encounter issues:

1. Check the migration logs for specific error messages
2. Verify your cloud storage configuration
3. Test with a small file first
4. Check network connectivity and permissions

## Benefits of Cloud Storage

- **Scalability**: Handle large numbers of files
- **Reliability**: Files are backed up and highly available
- **Performance**: CDN integration for fast delivery
- **Cost-effective**: Pay only for what you use
- **Production-ready**: Works with all hosting platforms

