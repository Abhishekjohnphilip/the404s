
'use client';

import type { MediaItem } from '@/lib/data';
import MediaDialog from '@/app/admin/media-dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type AdminToolbarProps = {
  year: number;
  eventSlug: string;
  currentMedia: MediaItem[];
};

export default function AdminToolbar({
  year,
  eventSlug,
  currentMedia,
}: AdminToolbarProps) {
  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/admin">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Link>
      </Button>
      <MediaDialog
        year={year}
        eventSlug={eventSlug}
        currentMedia={currentMedia}
      />
    </div>
  );
}
