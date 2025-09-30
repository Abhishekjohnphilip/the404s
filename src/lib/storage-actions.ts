'use server';

import { storageService } from './storage';
import crypto from 'crypto';

/**
 * Uploads a file to the configured storage service
 * @param file - The file to upload
 * @param folder - The folder to upload to (default: 'uploads')
 * @returns Promise with the upload result containing URL and key
 */
export async function uploadFileToStorage(
  file: File,
  folder: string = 'uploads'
): Promise<{ url: string; key: string }> {
  try {
    // Use the configured storage service
    const result = await storageService.uploadFile(file, folder);
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes a file from the configured storage service
 * @param key - The file key to delete
 * @returns Promise with boolean indicating success
 */
export async function deleteFileFromStorage(key: string): Promise<boolean> {
  try {
    return await storageService.deleteFile(key);
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Gets the URL for a file from the configured storage service
 * @param key - The file key
 * @returns The file URL
 */
export async function getFileUrl(key: string): Promise<string> {
  return storageService.getFileUrl(key);
}

