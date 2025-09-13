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
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  }

  async uploadFile(file: File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
    // This is a simplified version - in production, you'd want to use a proper file upload service
    const fileId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop() || 'bin';
    const key = `${folder}/${fileId}.${fileExtension}`;

    // For local development, we'll still use the file system
    // In production, this should be replaced with cloud storage
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

// Storage service factory
export function createStorageService(): StorageService {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  // In production/hosted environments, default to cloudinary if no storage is configured
  const isProduction = process.env.NODE_ENV === 'production';
  const isHosted = process.env.VERCEL || process.env.NETLIFY || process.env.RAILWAY_ENVIRONMENT;
  
  if ((isProduction || isHosted) && storageType === 'local') {
    console.warn('Local storage detected in production environment. This will not work on hosted platforms.');
    console.warn('Please configure cloud storage (Cloudinary or S3) for production deployment.');
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
    case 'local':
    default:
      return new LocalStorageService();
  }
}

// Export the default storage service instance
export const storageService = createStorageService();
