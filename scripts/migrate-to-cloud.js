#!/usr/bin/env node

/**
 * Migration script to move local files to cloud storage
 * 
 * Usage:
 *   node scripts/migrate-to-cloud.js
 * 
 * Make sure to set your environment variables first:
 *   - STORAGE_TYPE=s3 (or cloudinary)
 *   - AWS credentials (for S3) or Cloudinary credentials
 */

const { migrateLocalFilesToCloud, backupDatabase } = require('../src/lib/migration.ts');

async function runMigration() {
  console.log('🚀 Starting migration to cloud storage...');
  
  try {
    // Create backup first
    console.log('📦 Creating database backup...');
    const backupPath = await backupDatabase();
    console.log(`✅ Backup created: ${backupPath}`);
    
    // Run migration
    console.log('🔄 Migrating files to cloud storage...');
    const result = await migrateLocalFilesToCloud();
    
    if (result.success) {
      console.log('✅ Migration completed successfully!');
      console.log(`📊 Migrated: ${result.migrated} files`);
      console.log(`❌ Failed: ${result.failed} files`);
      
      if (result.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      console.log('❌ Migration failed!');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
  } catch (error) {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  }
}

// Check environment variables
const storageType = process.env.STORAGE_TYPE;
if (!storageType) {
  console.error('❌ STORAGE_TYPE environment variable is required');
  console.log('Set it to: local, s3, or cloudinary');
  process.exit(1);
}

if (storageType === 's3') {
  const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ Missing required AWS environment variables:', missing.join(', '));
    process.exit(1);
  }
}

if (storageType === 'cloudinary') {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ Missing required Cloudinary environment variables:', missing.join(', '));
    process.exit(1);
  }
}

runMigration();
