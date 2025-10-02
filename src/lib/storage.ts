import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Storage service interface
export interface StorageService {
  uploadFile(file: File, folder?: string): Promise<{ url: string; key: string }>;
  deleteFile(key: string): Promise<boolean>;
  getFileUrl(key: string): string;
}

// AWS S3 Storage Implementation
export class S3StorageService implements StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private baseUrl: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME!;
    this.region = process.env.AWS_S3_REGION || 'us-east-1';
    this.baseUrl = process.env.AWS_S3_BASE_URL || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(file: File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
    const fileId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop() || 'bin';
    const key = `${folder}/${fileId}.${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read', // Make files publicly accessible
    });

    await this.s3Client.send(command);

    return {
      url: `${this.baseUrl}/${key}`,
      key,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      return false;
    }
  }

  getFileUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}

// Cloudinary Storage Implementation (Alternative)
export class CloudinaryStorageService implements StorageService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    this.apiKey = process.env.CLOUDINARY_API_KEY!;
    this.apiSecret = process.env.CLOUDINARY_API_SECRET!;
  }

  async uploadFile(file: File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!);
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      key: data.public_id,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = crypto
        .createHash('sha1')
        .update(`public_id=${key}&timestamp=${timestamp}${this.apiSecret}`)
        .digest('hex');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: key,
            timestamp,
            signature,
            api_key: this.apiKey,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      return false;
    }
  }

  getFileUrl(key: string): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${key}`;
  }
}

// Local Storage Implementation (Fallback for development)
export class LocalStorageService implements StorageService {
  private baseUrl: string;

  constructor() {
    // Use the Vercel URL in production, localhost in development
    this.baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  }

  async uploadFile(file: File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
    const fileId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop() || 'bin';
    const key = `${folder}/${fileId}.${fileExtension}`;

    // Check if we're in a hosted environment where file system writes won't work
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

    if (isHosted || process.env.NODE_ENV === 'production') {
      // In hosted environments, fall back to inline storage (base64)
      console.warn('Local file storage not available in hosted environment. Falling back to inline storage.');
      const inlineService = new InlineStorageService();
      return await inlineService.uploadFile(file, folder);
    }

    // For local development, we'll still use the file system
    const { writeFile, mkdir } = await import('fs/promises');
    const path = await import('path');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const filePath = path.join(uploadsDir, `${fileId}.${fileExtension}`);
    await writeFile(filePath, Buffer.from(bytes));

    return {
      url: `${this.baseUrl}/uploads/${fileId}.${fileExtension}`,
      key,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const { unlink } = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'public', key);
      await unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting local file:', error);
      return false;
    }
  }

  getFileUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}

// Inline Storage Implementation (Saves files as base64 data URIs in the database)
export class InlineStorageService implements StorageService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit for inline storage

  async uploadFile(file: File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
    // Check file size limit
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size for inline storage is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    const fileId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop() || 'bin';
    const key = `${folder}/${fileId}.${fileExtension}`;

    // Convert file to base64 data URI
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    console.log(`Inline storage: Saved file ${file.name} (${file.size} bytes) as base64 data URI`);

    return {
      url: dataUri,
      key,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    // For inline storage, files are stored in the database
    // Deletion would need to be handled at the database level
    // This is a no-op for now since the data URI is embedded in the JSON
    console.log(`Inline storage: File ${key} would be deleted from database`);
    return true;
  }

  getFileUrl(key: string): string {
    // For inline storage, the URL is the data URI itself
    // This method is not typically used since URLs are stored directly
    return key;
  }
}

// Storage service factory
export function createStorageService(): StorageService {
  const storageType = process.env.STORAGE_TYPE || 'auto';
  
  // In production/hosted environments, default to inline storage if no cloud storage is configured
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
  

  // Auto-detect storage type for hosted environments
  if (storageType === 'auto') {
    if (isHosted || isProduction) {
      // Check if cloud storage is configured
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Using Cloudinary storage for hosted environment');
        return new CloudinaryStorageService();
      } else if (process.env.AWS_S3_BUCKET_NAME) {
        console.log('Using AWS S3 storage for hosted environment');
        return new S3StorageService();
      } else {
        // Use inline storage for hosted environments without cloud storage
        console.log('Using inline storage for hosted environment (files saved as base64 in database)');
        return new InlineStorageService();
      }
    } else {
      // Use local storage for development
      console.log('Using local storage for development environment');
      return new LocalStorageService();
    }
  }

  switch (storageType) {
    case 's3':
      if (!process.env.AWS_S3_BUCKET_NAME) {
        throw new Error('AWS S3 configuration missing. Please set AWS_S3_BUCKET_NAME and other AWS environment variables.');
      }
      return new S3StorageService();
    case 'cloudinary':
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        throw new Error('Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME and other Cloudinary environment variables.');
      }
      return new CloudinaryStorageService();
    case 'inline':
      return new InlineStorageService();
    case 'local':
    default:
      if ((isProduction || isHosted) && storageType === 'local') {
        console.warn('Local storage detected in production environment. This will not work on hosted platforms.');
        console.warn('Switching to inline storage for hosted environment.');
        return new InlineStorageService();
      }
      return new LocalStorageService();
  }
}

// Export the default storage service instance
export const storageService = createStorageService();
