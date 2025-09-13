# Environment Variables Setup

## Storage Configuration

Add these environment variables to your `.env.local` file:

### Storage Type Selection
```bash
# Choose storage type: 'local', 's3', or 'cloudinary'
STORAGE_TYPE=local
```

### For Local Development
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:9002
```

### AWS S3 Configuration (when STORAGE_TYPE=s3)
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_REGION=us-east-1
AWS_S3_BASE_URL=https://your_bucket_name.s3.us-east-1.amazonaws.com
```

### Cloudinary Configuration (when STORAGE_TYPE=cloudinary)
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## Setup Instructions

### Option 1: AWS S3 (Recommended for Production)

1. Create an AWS account and S3 bucket
2. Create an IAM user with S3 permissions
3. Set the environment variables above
4. Set `STORAGE_TYPE=s3`

### Option 2: Cloudinary (Easy Setup)

1. Create a Cloudinary account
2. Get your cloud name, API key, and secret
3. Create an upload preset
4. Set the environment variables above
5. Set `STORAGE_TYPE=cloudinary`

### Option 3: Local Storage (Development Only)

1. Keep `STORAGE_TYPE=local`
2. Files will be stored in `public/uploads/` directory
3. **Note**: This won't work in production hosting environments

## Migration from Local Storage

If you have existing files in `public/uploads/`, you'll need to:

1. Upload them to your chosen cloud storage service
2. Update the database URLs to point to the new cloud URLs
3. Or run a migration script to move the files

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment variables in your hosting platform
- For AWS S3, use IAM roles when possible instead of access keys
- For Cloudinary, use signed uploads for better security

