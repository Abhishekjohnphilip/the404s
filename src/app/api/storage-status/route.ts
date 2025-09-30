import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const storageType = process.env.STORAGE_TYPE || 'auto';
    const isProduction = process.env.NODE_ENV === 'production';
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
    
    let configured = false;
    let error: string | undefined;
    let actualStorageType = storageType;

    // Auto-detect storage type for hosted environments
    if (storageType === 'auto') {
      if (isHosted || isProduction) {
        // Check if cloud storage is configured
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          actualStorageType = 'cloudinary';
        } else if (process.env.AWS_S3_BUCKET_NAME) {
          actualStorageType = 's3';
        } else {
          // Use inline storage for hosted environments without cloud storage
          actualStorageType = 'inline';
        }
      } else {
        // Use local storage for development
        actualStorageType = 'local';
      }
    }

    switch (actualStorageType) {
      case 's3':
        configured = !!(
          process.env.AWS_ACCESS_KEY_ID &&
          process.env.AWS_SECRET_ACCESS_KEY &&
          process.env.AWS_S3_BUCKET_NAME
        );
        if (!configured) {
          error = 'AWS S3 configuration incomplete. Missing required environment variables.';
        }
        break;
        
      case 'cloudinary':
        configured = !!(
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET &&
          process.env.CLOUDINARY_UPLOAD_PRESET
        );
        if (!configured) {
          error = 'Cloudinary configuration incomplete. Missing required environment variables.';
        }
        break;
        
      case 'inline':
        // Inline storage always works - files are saved as base64 in the database
        configured = true;
        break;
        
      case 'local':
      default:
        if (isProduction || isHosted) {
          configured = false;
          error = 'Local storage does not work in production/hosted environments.';
        } else {
          configured = true;
        }
        break;
    }

    return NextResponse.json({
      type: actualStorageType,
      configured,
      error,
      environment: {
        isProduction,
        isHosted: !!isHosted,
        platform: isHosted ? (process.env.VERCEL ? 'Vercel' : process.env.NETLIFY ? 'Netlify' : 'Railway') : 'Local'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        type: 'unknown', 
        configured: false, 
        error: 'Failed to check storage status' 
      },
      { status: 500 }
    );
  }
}


