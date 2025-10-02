import { NextResponse } from 'next/server';

export async function GET() {
  const storageType = process.env.STORAGE_TYPE || 'auto';
  
  // Determine actual storage type being used
  let actualStorageType = 'local';
  
  const isHosted = !!(
    process.env.VERCEL || 
    process.env.NETLIFY || 
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RENDER ||
    process.env.HEROKU_APP_NAME ||
    process.env.FLY_APP_NAME ||
    process.env.PLATFORM ||
    process.env.HOSTING_PLATFORM
  );

  if (storageType === 'auto') {
    if (isHosted || process.env.NODE_ENV === 'production') {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        actualStorageType = 'cloudinary';
      } else if (process.env.AWS_S3_BUCKET_NAME) {
        actualStorageType = 's3';
      } else {
        actualStorageType = 'inline';
      }
    } else {
      actualStorageType = 'local';
    }
  } else {
    actualStorageType = storageType;
  }

  return NextResponse.json({
    storageType: actualStorageType,
    isHosted,
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL ? 'vercel' : 
              process.env.NETLIFY ? 'netlify' :
              process.env.RAILWAY_ENVIRONMENT ? 'railway' :
              process.env.RENDER ? 'render' :
              process.env.HEROKU_APP_NAME ? 'heroku' :
              process.env.FLY_APP_NAME ? 'fly' :
              'unknown'
  });
}