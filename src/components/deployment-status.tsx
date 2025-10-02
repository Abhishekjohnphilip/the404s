'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DeploymentStatus() {
  const [isHosted, setIsHosted] = useState(false);
  const [storageType, setStorageType] = useState<string>('unknown');

  useEffect(() => {
    // Check if we're in a hosted environment
    const hosted = window.location.hostname !== 'localhost';
    setIsHosted(hosted);
    
    // Try to determine storage type from environment
    fetch('/api/storage-status')
      .then(res => res.json())
      .then(data => setStorageType(data.storageType))
      .catch(() => setStorageType('unknown'));
  }, []);

  if (!isHosted) {
    return null; // Don't show in development
  }

  return (
    <div className="space-y-4 mb-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Hosted Environment Detected</AlertTitle>
        <AlertDescription>
          You're viewing THE404s on a hosted platform. The application is running in production mode.
        </AlertDescription>
      </Alert>

      {storageType === 'inline' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Data Persistence Warning</AlertTitle>
          <AlertDescription>
            New data (wishes, events, uploads) will be stored temporarily and may be lost when the application redeploys. 
            For persistent storage, consider configuring cloud storage or a database.
          </AlertDescription>
        </Alert>
      )}

      {(storageType === 'cloudinary' || storageType === 's3') && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Cloud Storage Active</AlertTitle>
          <AlertDescription>
            Files are being stored in {storageType === 'cloudinary' ? 'Cloudinary' : 'AWS S3'}. 
            However, data changes may still be lost on redeployment without a database.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
