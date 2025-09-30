import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/data';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST() {
  try {
    const db = await readDb();
    let migratedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each year and event
    for (const yearData of db.years) {
      for (const event of yearData.events) {
        // Process media items
        for (const mediaItem of event.media) {
          // Check if this is a local file path that needs migration
          if (mediaItem.url.startsWith('/uploads/')) {
            try {
              // Read the file from the local uploads directory
              const filePath = path.join(process.cwd(), 'public', mediaItem.url);
              const fileBuffer = await fs.readFile(filePath);
              
              // Determine MIME type based on file extension
              const extension = path.extname(mediaItem.url).toLowerCase();
              let mimeType = 'application/octet-stream';
              
              switch (extension) {
                case '.jpg':
                case '.jpeg':
                  mimeType = 'image/jpeg';
                  break;
                case '.png':
                  mimeType = 'image/png';
                  break;
                case '.gif':
                  mimeType = 'image/gif';
                  break;
                case '.webp':
                  mimeType = 'image/webp';
                  break;
                case '.mp4':
                  mimeType = 'video/mp4';
                  break;
                case '.webm':
                  mimeType = 'video/webm';
                  break;
              }
              
              // Convert to base64 data URI
              const base64 = fileBuffer.toString('base64');
              const dataUri = `data:${mimeType};base64,${base64}`;
              
              // Update the media item
              mediaItem.url = dataUri;
              migratedCount++;
              
              console.log(`Migrated: ${mediaItem.url} -> data URI (${fileBuffer.length} bytes)`);
              
            } catch (error) {
              errorCount++;
              const errorMsg = `Failed to migrate ${mediaItem.url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              errors.push(errorMsg);
              console.error(errorMsg);
            }
          }
        }
      }
    }

    // Save the updated database
    if (migratedCount > 0) {
      await writeDb(db);
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. Migrated ${migratedCount} files, ${errorCount} errors.`,
      stats: {
        migrated: migratedCount,
        errors: errorCount,
        errorDetails: errors
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
