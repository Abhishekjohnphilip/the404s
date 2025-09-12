
'use client';

import type { Event } from '@/lib/data';
import AdminToolbar from './admin-toolbar';

type AdminToolbarWrapperProps = {
  person: Event;
  year: number;
  isAdmin: boolean;
};

export default function AdminToolbarWrapper({
  person,
  year,
  isAdmin,
}: AdminToolbarWrapperProps) {
  if (!isAdmin) {
    return null;
  }

  return (
    <AdminToolbar
      year={year}
      eventSlug={person.slug}
      currentMedia={person.media}
    />
  );
}
