import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const storageType = process.env.STORAGE_TYPE || 'local';
    const isProduction = process.env.NODE_ENV === 'production';
    const isHosted = process.env.VERCEL || process.env.NETLIFY || process.env.RAILWAY_ENVIRONMENT;
    
    let configured = false;
    let error: string | undefined;

    switch (storageType) {
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
      type: storageType,
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

