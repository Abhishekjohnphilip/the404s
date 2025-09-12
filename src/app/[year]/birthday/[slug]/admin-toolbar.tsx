
'use client';

import type { MediaItem } from '@/lib/data';
import MediaDialog from '@/app/admin/media-dialog';

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
    <div className="absolute top-4 right-4">
      <MediaDialog
        year={year}
        eventSlug={eventSlug}
        currentMedia={currentMedia}
      />
    </div>
  );
}
