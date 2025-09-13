'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertCircle, CheckCircle, Cloud, Database } from 'lucide-react';

interface StorageStatus {
  type: string;
  configured: boolean;
  error?: string;
}

export default function StorageStatus() {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStorageStatus();
  }, []);

  const checkStorageStatus = async () => {
    try {
      const response = await fetch('/api/storage-status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        type: 'unknown',
        configured: false,
        error: 'Failed to check storage status'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Checking storage configuration...</p>
        </CardContent>
      </Card>
    );
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isHosted = typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('netlify.app') ||
    window.location.hostname.includes('railway.app')
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Storage Status
        </CardTitle>
        <CardDescription>
          Current file storage configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Storage Type:</span>
          <Badge variant={status?.configured ? 'default' : 'destructive'}>
            {status?.type || 'unknown'}
          </Badge>
        </div>

        {status?.configured ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Storage is properly configured and ready to use.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {status?.error || 'Storage is not properly configured.'}
            </AlertDescription>
          </Alert>
        )}

        {(isProduction || isHosted) && status?.type === 'local' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Local storage detected in production!</strong></p>
                <p>This will not work on hosted platforms. You need to configure cloud storage.</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer">
                      <Cloud className="mr-2 h-4 w-4" />
                      Setup Cloudinary
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href="https://aws.amazon.com/s3/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Setup AWS S3
                    </a>
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>Environment:</strong> {isProduction ? 'Production' : 'Development'}</p>
          <p><strong>Hosted:</strong> {isHosted ? 'Yes' : 'No'}</p>
        </div>

        <Button onClick={checkStorageStatus} variant="outline" size="sm">
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
}
