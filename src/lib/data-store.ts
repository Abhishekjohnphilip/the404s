'use server';

import type { Wish, MediaItem, Event, YearData, AdminUser, SocialPost } from './data';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Interface for the single document structure in Firestore
interface DbData {
  years: YearData[];
  admins: AdminUser[];
  socialPosts: SocialPost[];
}

// In-memory fallback for development without Firebase credentials
let memoryStore: DbData = {
  years: [],
  admins: [{ username: 'admin', password: 'admin123' }],
  socialPosts: [],
};

const DB_COLLECTION = 'app-data';
const DB_DOC_ID = 'main';

// Initialize data store
async function initializeDataStore(): Promise<DbData> {
  // Check if Firebase is configured
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    try {
      const docRef = doc(db, DB_COLLECTION, DB_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as DbData;
      } else {
        // Initialize with default data if document doesn't exist
        // Try to load from local JSON as initial seed if available
        try {
          const localDb = await import('./db.json');
          const initialData: DbData = {
            years: localDb.years || [],
            admins: localDb.admins || [{ username: 'admin', password: 'admin123' }],
            socialPosts: localDb.socialPosts || [],
          };
          await setDoc(docRef, initialData);
          return initialData;
        } catch (e) {
          // Fallback to empty default
          const defaultData: DbData = {
            years: [],
            admins: [{ username: 'admin', password: 'admin123' }],
            socialPosts: [],
          };
          await setDoc(docRef, defaultData);
          return defaultData;
        }
      }
    } catch (error) {
      console.error('Error connecting to Firestore:', error);
      // Fallback to memory store if connection fails
      return memoryStore;
    }
  } else {
    // Fallback to local JSON/memory for development
    try {
      const dbData = await import('./db.json');
      memoryStore = {
        years: dbData.years || [],
        admins: dbData.admins || [{ username: 'admin', password: 'admin123' }],
        socialPosts: dbData.socialPosts || [],
      };
    } catch (error) {
      console.error('Error loading local data:', error);
    }
    return memoryStore;
  }
}

// Get the current data store
export async function getDataStore() {
  return await initializeDataStore();
}

// Update the data store
export async function updateDataStore(newData: DbData) {
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    try {
      const docRef = doc(db, DB_COLLECTION, DB_DOC_ID);
      await setDoc(docRef, newData);
    } catch (error) {
      console.error('Error updating Firestore:', error);
      // Update memory store as fallback so app doesn't crash
      memoryStore = newData;
    }
  } else {
    memoryStore = newData;
  }
}

// Helper function to log data changes
export async function logDataChange(operation: string, data: any) {
  console.log(`[DATA CHANGE] ${operation}:`, JSON.stringify(data, null, 2));
}
