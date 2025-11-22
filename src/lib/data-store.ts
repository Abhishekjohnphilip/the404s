'use server';

import type { Wish, MediaItem, Event, YearData, AdminUser, SocialPost } from './data';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { promises as fs } from 'fs';
import path from 'path';

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

import { getGitHubFile, saveGitHubFile } from './github-store';

const DB_COLLECTION = 'app-data';
const DB_DOC_ID = 'main';
const LOCAL_DB_PATH = path.join(process.cwd(), 'src', 'lib', 'db.json');
const GITHUB_DB_PATH = 'src/lib/db.json';

// Initialize data store
async function initializeDataStore(): Promise<DbData> {
  // 1. Try GitHub (Highest Priority for Vercel "Save in Code")
  if (process.env.GITHUB_TOKEN) {
    const ghData = await getGitHubFile(GITHUB_DB_PATH);
    if (ghData) {
      try {
        return JSON.parse(ghData.content) as DbData;
      } catch (e) {
        console.error('Error parsing GitHub data:', e);
      }
    }
  }

  // 2. Try Firebase
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
          const fileContent = await fs.readFile(LOCAL_DB_PATH, 'utf-8');
          const localDb = JSON.parse(fileContent);
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
  }

  // 3. Fallback to local JSON/memory (Dev mode)
  try {
    const fileContent = await fs.readFile(LOCAL_DB_PATH, 'utf-8');
    const dbData = JSON.parse(fileContent);
    memoryStore = {
      years: dbData.years || [],
      admins: dbData.admins || [{ username: 'admin', password: 'admin123' }],
      socialPosts: dbData.socialPosts || [],
    };
  } catch (error) {
    console.error('Error loading local data:', error);
    // If file doesn't exist or error, keep default memoryStore
  }
  return memoryStore;
}

// Get the current data store
export async function getDataStore() {
  return await initializeDataStore();
}

// Update the data store
export async function updateDataStore(newData: DbData) {
  // 1. Try GitHub
  if (process.env.GITHUB_TOKEN) {
    await saveGitHubFile(
      GITHUB_DB_PATH,
      JSON.stringify(newData, null, 2),
      'Update data via App'
    );
    // Also update memory store for immediate read (though next request might be stale until rebuild)
    memoryStore = newData;
    return;
  }

  // 2. Try Firebase
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
    // 3. Persist to local file
    try {
      await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(newData, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing to local db.json:', error);
    }
  }
}


// Helper function to log data changes
export async function logDataChange(operation: string, data: any) {
  console.log(`[DATA CHANGE] ${operation}:`, JSON.stringify(data, null, 2));
}

