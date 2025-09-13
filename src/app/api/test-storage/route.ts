import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToStorage } from '@/lib/storage-actions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Test upload
    const result = await uploadFileToStorage(file, 'test');
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: result.url,
      key: result.key
    });

  } catch (error) {
    console.error('Storage test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

