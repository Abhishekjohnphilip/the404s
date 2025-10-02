# Vercel Deployment Guide for THE404s

This guide will help you deploy THE404s website to Vercel with all the necessary configurations.

## Environment Variables

Set these environment variables in your Vercel dashboard:

### Required Variables

```bash
# Base URL for the application
NEXT_PUBLIC_BASE_URL=https://your-app-name.vercel.app

# Google AI API Key (for content moderation and image hints)
# Get your API key from https://ai.google.dev/
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here
```

### Optional Cloud Storage Variables

If you want to use cloud storage instead of inline storage (recommended for better performance):

#### Option 1: Cloudinary (Recommended)
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

#### Option 2: AWS S3
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_REGION=us-east-1
```

## Deployment Steps

1. **Fork or Clone the Repository**
   ```bash
   git clone https://github.com/your-username/the404s.git
   cd the404s
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Set the environment variables in Vercel dashboard
   - Deploy the application

4. **Update Base URL**
   - After deployment, update `NEXT_PUBLIC_BASE_URL` with your actual Vercel URL
   - Redeploy if necessary

## Important Notes

### Data Persistence
- **⚠️ Important**: This application stores data in memory only when hosted on Vercel
- New wishes, events, and media uploads will be lost when the application redeploys
- This is a limitation of the "no external database" requirement
- For persistent data, consider using:
  - Vercel KV (Redis)
  - Vercel Postgres
  - Supabase
  - Firebase

### File Storage
- The application automatically detects the hosting environment
- On Vercel, it uses inline storage (base64 encoding) by default
- For better performance, configure Cloudinary or AWS S3
- Local file uploads are converted to base64 and stored in the database

### Admin Access
- Default admin credentials: `admin` / `admin123`
- Add `?admin=true` to any page URL to access admin features
- Admin login is available at `/admin/login`

## Troubleshooting

### Build Errors
- Ensure all environment variables are set correctly
- Check that the Google AI API key is valid
- Verify that cloud storage credentials (if used) are correct

### Runtime Issues
- Check Vercel function logs for errors
- Ensure the base URL matches your deployment URL
- Verify that images are loading correctly

### Data Loss
- Remember that data changes are temporary on Vercel
- Consider implementing a backup/restore mechanism
- For production use, implement a proper database solution

## Features That Work on Vercel

✅ **Working Features:**
- View existing events and wishes
- Add new wishes (temporary)
- Upload images (converted to base64)
- Admin panel access
- Content moderation
- Image hint generation
- Responsive design

⚠️ **Limitations:**
- Data persistence (changes lost on redeploy)
- Large file uploads (base64 increases size)
- Performance with many images

## Recommended Improvements

For a production deployment, consider:

1. **Add a Database**
   - Vercel Postgres
   - Supabase
   - Firebase Firestore

2. **Implement Proper File Storage**
   - Cloudinary (recommended)
   - AWS S3
   - Vercel Blob

3. **Add Authentication**
   - NextAuth.js
   - Clerk
   - Auth0

4. **Implement Caching**
   - Redis for session storage
   - CDN for static assets

## Support

If you encounter issues:
1. Check the Vercel deployment logs
2. Verify environment variables
3. Test locally first with `npm run dev`
4. Check the browser console for client-side errors
