import { getEventBySlug, getYears, getEventsByYear } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Calendar, BarChart3, Users, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PollVoting from './poll-voting';
import PollResults from './poll-results';

type PollPageProps = {
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
      const pollParams = events
        .filter(event => event.type === 'poll')
        .map((event: { slug: any }) => ({
          year: String(year),
          slug: event.slug,
        }));
      allParams = [...allParams, ...pollParams];
    }
  }

  return allParams;
}

export default async function PollPage({
  params,
  searchParams,
}: PollPageProps) {
  const { year: yearParam, slug } = await params;
  const searchParamsData = await searchParams;
  const year = parseInt(yearParam, 10);
  const event = await getEventBySlug(year, slug);

  if (!event || event.type !== 'poll' || !event.pollData) {
    notFound();
  }

  const isAdmin = searchParamsData.admin === 'true';
  const showResults = searchParamsData.results === 'true' || isAdmin;
  const poll = event.pollData;

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
          <h2 className="text-5xl font-headline font-bold tracking-tight sm:text-6xl text-primary">
            {poll.name}
          </h2>
          <div className="mt-4 flex items-center justify-center gap-4 text-muted-foreground text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{event.date}, {year}</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Poll</span>
            </div>
          </div>
          <p className="mt-4 text-xl text-muted-foreground">
            {poll.question}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {showResults ? (
            <PollResults poll={poll} year={year} eventSlug={slug} />
          ) : (
            <PollVoting poll={poll} year={year} eventSlug={slug} />
          )}

          <div className="mt-8 text-center">
            {!showResults ? (
              <Button asChild variant="outline">
                <Link href={`/${year}/poll/${slug}?results=true`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Results
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={`/${year}/poll/${slug}`}>
                  <Users className="mr-2 h-4 w-4" />
                  Back to Voting
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
