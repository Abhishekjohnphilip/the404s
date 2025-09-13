'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Cloud, AlertCircle, CheckCircle } from 'lucide-react';

interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    migrated: number;
    failed: number;
    errors: string[];
  };
  backupPath?: string;
}

export default function MigrationPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const runMigration = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'migrate' }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to run migration',
        details: {
          migrated: 0,
          failed: 0,
          errors: [String(error)],
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'backup' }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to create backup',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Storage Migration
        </CardTitle>
        <CardDescription>
          Migrate local files to cloud storage for production deployment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={createBackup}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Create Backup
          </Button>
          <Button
            onClick={runMigration}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Cloud className="mr-2 h-4 w-4" />
            )}
            Migrate to Cloud
          </Button>
        </div>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p>{result.message}</p>
                {result.details && (
                  <div className="text-sm">
                    <p>Migrated: {result.details.migrated} files</p>
                    <p>Failed: {result.details.failed} files</p>
                    {result.details.errors.length > 0 && (
                      <div>
                        <p className="font-semibold">Errors:</p>
                        <ul className="list-disc list-inside">
                          {result.details.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {result.backupPath && (
                  <p className="text-sm text-muted-foreground">
                    Backup created: {result.backupPath}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>Before migrating:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Set your cloud storage environment variables</li>
            <li>Ensure STORAGE_TYPE is set to 's3' or 'cloudinary'</li>
            <li>Test your cloud storage configuration</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

