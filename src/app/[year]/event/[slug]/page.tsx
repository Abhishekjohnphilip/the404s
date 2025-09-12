import { getEventBySlug, getYears, getEventsByYear } from '@/lib/data';
import { notFound } from 'next/navigation';
import MediaGallery from '@/app/[year]/birthday/[slug]/media-gallery';
import { Calendar, PartyPopper } from 'lucide-react';
import AdminToolbarWrapper from '@/app/[year]/birthday/[slug]/admin-toolbar-wrapper';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

type EventPageProps = {
  params: Promise<{
    year: string;
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateStaticParams() {
  const years = await getYears();
  let allParams: { year: string; slug: string }[] = [];

  for (const year of years) {
    const events = await getEventsByYear(year);
    if (events) {
      const eventParams = events
        .filter(event => event.type === 'event')
        .map((event: { slug: any }) => ({
          year: String(year),
          slug: event.slug,
        }));
      allParams = [...allParams, ...eventParams];
    }
  }

  return allParams;
}

export default async function EventPage({
  params,
  searchParams,
}: EventPageProps) {
  const { year: yearParam, slug } = await params;
  const searchParamsData = await searchParams;
  const year = parseInt(yearParam, 10);
  const event = await getEventBySlug(year, slug);

  if (!event || event.type !== 'event') {
    notFound();
  }

  const isAdmin = searchParamsData.admin === 'true';

  return (
    <div className="bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button asChild variant="outline">
            <Link href={`/${year}`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to {year} Events
            </Link>
          </Button>
        </div>

        <div className="relative text-center rounded-lg p-8 bg-card shadow-lg mb-12">
          <AdminToolbarWrapper person={event} year={year} isAdmin={isAdmin} />
          <h2 className="text-5xl font-headline font-bold tracking-tight sm:text-6xl text-primary">
            {event.name}
          </h2>
          <div className="mt-4 flex items-center justify-center gap-4 text-muted-foreground text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>
                {event.date}, {year}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5" />
              <span>Special Event</span>
            </div>
          </div>
        </div>

        {event.media.length > 0 && <MediaGallery media={event.media} />}

      </div>
    </div>
  );
}
