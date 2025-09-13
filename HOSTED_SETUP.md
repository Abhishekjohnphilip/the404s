# Hosted Environment Setup Guide

## The Problem
Your hosted site can't add media and wishes because it's using local file storage, which doesn't work on hosting platforms like Vercel, Netlify, etc.

## Quick Fix for Hosted Sites

### Option 1: Cloudinary (Easiest - Recommended)

1. **Create a Cloudinary account** at https://cloudinary.com
2. **Get your credentials** from the dashboard
3. **Create an upload preset**:
   - Go to Settings > Upload
   - Create a new unsigned upload preset
   - Set it to allow all file types
4. **Set environment variables** in your hosting platform:

```bash
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### Option 2: AWS S3

1. **Create an AWS account** and S3 bucket
2. **Create IAM user** with S3 permissions
3. **Set environment variables**:

```bash
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_REGION=us-east-1
AWS_S3_BASE_URL=https://your_bucket_name.s3.us-east-1.amazonaws.com
```

## Hosting Platform Setup

### Vercel
1. Go to your project dashboard
2. Settings > Environment Variables
3. Add all the variables above
4. Redeploy your site

### Netlify
1. Go to Site settings
2. Environment variables
3. Add all the variables above
4. Redeploy your site

### Railway/Render
1. Go to your project settings
2. Environment variables
3. Add all the variables above
4. Redeploy your site

## Testing

After setting up cloud storage:
1. Deploy your site
2. Try adding a wish with an image
3. Try uploading media through admin
4. Everything should work!

## Why This Fixes the Issue

- **Local storage** only works on your computer
- **Cloud storage** works everywhere (hosted sites, mobile, etc.)
- **Files are accessible** from any location
- **No file system dependencies** in production

## Need Help?

If you're still having issues:
1. Check your environment variables are set correctly
2. Verify your cloud storage credentials
3. Check the browser console for errors
4. Make sure your upload preset allows the file types you're using
