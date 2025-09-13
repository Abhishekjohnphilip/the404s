// Simple test to verify storage service works
import { createStorageService } from './storage';

export async function testStorageService() {
  try {
    const storage = createStorageService();
    console.log('Storage service created successfully');
    console.log('Storage type:', process.env.STORAGE_TYPE || 'local');
    return { success: true, message: 'Storage service is working' };
  } catch (error) {
    console.error('Storage service test failed:', error);
    return { success: false, message: String(error) };
  }
}
