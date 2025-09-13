import { NextRequest, NextResponse } from 'next/server';
import { migrateLocalFilesToCloud, backupDatabase } from '@/lib/migration';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'migrate') {
      // Create backup first
      const backupPath = await backupDatabase();
      
      // Run migration
      const result = await migrateLocalFilesToCloud();
      
      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? `Migration completed. Migrated ${result.migrated} files, ${result.failed} failed.`
          : 'Migration failed.',
        details: result,
        backupPath,
      });
    }

    if (action === 'backup') {
      const backupPath = await backupDatabase();
      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        backupPath,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { success: false, message: 'Migration failed', error: String(error) },
      { status: 500 }
    );
  }
}

