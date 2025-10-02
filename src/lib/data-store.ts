'use server';

import type { Wish, MediaItem, Event, YearData, AdminUser, SocialPost } from './data';

// In-memory data store that gets initialized from the JSON file
// This approach works better for Vercel hosting since we can't write to the file system
let dataStore: {
  years: YearData[];
  admins: AdminUser[];
  socialPosts: SocialPost[];
} | null = null;

// Initialize data store from the JSON file (read-only)
async function initializeDataStore() {
  if (dataStore) return dataStore;
  
  try {
    // Import the JSON data directly
    const dbData = await import('./db.json');
    dataStore = {
      years: dbData.years || [],
      admins: dbData.admins || [
        { username: 'admin', password: 'admin123' } // Default admin
      ],
      socialPosts: dbData.socialPosts || [],
    };
  } catch (error) {
    console.error('Error loading data:', error);
    // Fallback to empty data structure
    dataStore = {
      years: [],
      admins: [{ username: 'admin', password: 'admin123' }],
      socialPosts: [],
    };
  }
  
  return dataStore;
}

// Get the current data store
export async function getDataStore() {
  return await initializeDataStore();
}

// For Vercel hosting, we'll store new data in environment variables or use a simple in-memory approach
// This is a limitation but works for the hosting requirement of not using external databases

// Note: In production on Vercel, any new data added will be lost on redeployment
// This is a trade-off for not using a database as requested
export async function updateDataStore(newData: typeof dataStore) {
  if (newData) {
    dataStore = newData;
  }
}

// Helper function to log data changes (for debugging in hosted environment)
export async function logDataChange(operation: string, data: any) {
  console.log(`[DATA CHANGE] ${operation}:`, JSON.stringify(data, null, 2));
}
