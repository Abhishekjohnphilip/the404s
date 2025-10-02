'use server';

import type { DbData } from './data';

/**
 * Migration helper functions for data format updates
 */

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedCount?: number;
}

/**
 * Migrates localhost URLs to relative URLs
 */
export function migrateLocalHostUrls(data: DbData): MigrationResult {
  let migratedCount = 0;
  
  try {
    // Migrate media URLs
    data.years.forEach(year => {
      year.events.forEach(event => {
        event.media.forEach(media => {
          if (media.url.includes('localhost:9002')) {
            media.url = media.url.replace('http://localhost:9002', '');
            migratedCount++;
          }
        });
        
        // Migrate wish image URLs
        event.wishes.forEach(wish => {
          if (wish.imageUrl && wish.imageUrl.includes('localhost:9002')) {
            wish.imageUrl = wish.imageUrl.replace('http://localhost:9002', '');
            migratedCount++;
          }
        });
      });
    });
    
    return {
      success: true,
      message: `Successfully migrated ${migratedCount} URLs from localhost to relative paths`,
      migratedCount
    };
  } catch (error) {
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates data structure and fixes common issues
 */
export function validateAndFixData(data: DbData): MigrationResult {
  let fixedCount = 0;
  
  try {
    // Ensure all required fields exist
    if (!data.years) {
      data.years = [];
      fixedCount++;
    }
    
    if (!data.admins) {
      data.admins = [{ username: 'admin', password: 'admin123' }];
      fixedCount++;
    }
    
    if (!data.socialPosts) {
      data.socialPosts = [];
      fixedCount++;
    }
    
    // Validate and fix events
    data.years.forEach(year => {
      if (!year.events) {
        year.events = [];
        fixedCount++;
      }
      
      year.events.forEach(event => {
        if (!event.media) {
          event.media = [];
          fixedCount++;
        }
        
        if (!event.wishes) {
          event.wishes = [];
          fixedCount++;
        }
        
        // Ensure all wishes have required fields
        event.wishes.forEach(wish => {
          if (typeof wish.isAppropriate === 'undefined') {
            wish.isAppropriate = true;
            fixedCount++;
          }
          
          if (!wish.createdAt) {
            wish.createdAt = new Date().toISOString();
            fixedCount++;
          }
        });
        
        // Ensure all media items have required fields
        event.media.forEach(media => {
          if (!media.hint) {
            media.hint = media.type === 'image' ? 'image' : 'video';
            fixedCount++;
          }
        });
      });
    });
    
    return {
      success: true,
      message: `Data validation completed. Fixed ${fixedCount} issues.`,
      migratedCount: fixedCount
    };
  } catch (error) {
    return {
      success: false,
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Converts absolute URLs to relative URLs for better portability
 */
export function normalizeUrls(data: DbData, baseUrl?: string): MigrationResult {
  let normalizedCount = 0;
  
  try {
    const urlsToNormalize = [
      'http://localhost:9002',
      'https://localhost:9002',
      baseUrl
    ].filter(Boolean);
    
    data.years.forEach(year => {
      year.events.forEach(event => {
        // Normalize media URLs
        event.media.forEach(media => {
          urlsToNormalize.forEach(urlToReplace => {
            if (urlToReplace && media.url.startsWith(urlToReplace)) {
              media.url = media.url.replace(urlToReplace, '');
              normalizedCount++;
            }
          });
        });
        
        // Normalize wish image URLs
        event.wishes.forEach(wish => {
          if (wish.imageUrl) {
            urlsToNormalize.forEach(urlToReplace => {
              if (urlToReplace && wish.imageUrl!.startsWith(urlToReplace)) {
                wish.imageUrl = wish.imageUrl!.replace(urlToReplace, '');
                normalizedCount++;
              }
            });
          }
        });
      });
    });
    
    return {
      success: true,
      message: `Normalized ${normalizedCount} URLs to relative paths`,
      migratedCount: normalizedCount
    };
  } catch (error) {
    return {
      success: false,
      message: `URL normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
