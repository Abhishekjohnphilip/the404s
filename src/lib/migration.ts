'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { uploadFileToStorage } from './storage-actions';

interface MigrationResult {
  success: boolean;
  migrated: number;
  failed: number;
  errors: string[];
}

/**
 * Migrates local files to cloud storage
 * This utility helps move existing files from public/uploads to cloud storage
 */
export async function migrateLocalFilesToCloud(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migrated: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Import the database functions
    const { readDb, writeDb } = await import('./data');
    const db = await readDb();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Check if uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      result.errors.push('Uploads directory does not exist');
      return result;
    }

    // Get all files in uploads directory
    const files = await fs.readdir(uploadsDir);
    
    for (const fileName of files) {
      try {
        const filePath = path.join(uploadsDir, fileName);
        const fileStats = await fs.stat(filePath);
        
        if (fileStats.isFile()) {
          // Read the file
          const fileBuffer = await fs.readFile(filePath);
          
          // Create a File object for the storage service
          const file = new File([fileBuffer], fileName, {
            type: getMimeType(fileName),
          });

          // Upload to cloud storage
          const uploadResult = await uploadFileToStorage(file, 'migrated');
          
          // Update database URLs
          await updateDatabaseUrls(`/uploads/${fileName}`, uploadResult.url, db);
          
          result.migrated++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to migrate ${fileName}: ${error}`);
      }
    }

    // Save updated database
    await writeDb(db);
    result.success = true;
    
  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
  }

  return result;
}

/**
 * Updates database URLs from old local paths to new cloud URLs
 */
async function updateDatabaseUrls(oldUrl: string, newUrl: string, db: any): Promise<void> {
  // Update media URLs in events
  for (const yearData of db.years) {
    for (const event of yearData.events) {
      for (const mediaItem of event.media) {
        if (mediaItem.url === oldUrl) {
          mediaItem.url = newUrl;
        }
      }
      
      // Update wish image URLs
      for (const wish of event.wishes) {
        if (wish.imageUrl === oldUrl) {
          wish.imageUrl = newUrl;
        }
      }
    }
  }
}

/**
 * Gets MIME type based on file extension
 */
function getMimeType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Creates a backup of the current database before migration
 */
export async function backupDatabase(): Promise<string> {
  try {
    const { readDb } = await import('./data');
    const db = await readDb();
    const backupPath = path.join(
      process.cwd(),
      'backups',
      `db-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    
    // Ensure backups directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    // Write backup
    await fs.writeFile(backupPath, JSON.stringify(db, null, 2));
    
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup: ${error}`);
  }
}

/**
 * Restores database from backup
 */
export async function restoreDatabase(backupPath: string): Promise<void> {
  try {
    const { writeDb } = await import('./data');
    const backupData = await fs.readFile(backupPath, 'utf-8');
    const db = JSON.parse(backupData);
    await writeDb(db);
  } catch (error) {
    throw new Error(`Failed to restore backup: ${error}`);
  }
}
