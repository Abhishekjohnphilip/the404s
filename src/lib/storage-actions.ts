'use server';

import { storageService } from './storage';

export async function uploadFileToStorage(file: File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
  try {
    return await storageService.uploadFile(file, folder);
  } catch (error) {
    console.error('Storage upload error:', error);
    
    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('configuration missing')) {
      throw new Error('Storage not configured. Please set up cloud storage (Cloudinary or S3) for file uploads.');
    }
    
    // Check if it's a local storage error in production
    const isProduction = process.env.NODE_ENV === 'production';
    const isHosted = process.env.VERCEL || process.env.NETLIFY || process.env.RAILWAY_ENVIRONMENT;
    
    if ((isProduction || isHosted) && process.env.STORAGE_TYPE === 'local') {
      throw new Error('Local storage does not work in hosted environments. Please configure cloud storage.');
    }
    
    throw new Error('Failed to upload file. Please try again or contact support.');
  }
}

export async function deleteFileFromStorage(key: string): Promise<boolean> {
  try {
    return await storageService.deleteFile(key);
  } catch (error) {
    console.error('Storage delete error:', error);
    return false;
  }
}

export async function getFileUrlFromStorage(key: string): Promise<string> {
  try {
    return storageService.getFileUrl(key);
  } catch (error) {
    console.error('Storage URL error:', error);
    return key; // Return the key as fallback
  }
}
