import { getEventBySlug, getYears, getEventsByYear } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Calendar, FileText, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import FormSubmission from './form-submission';
import FormResults from './form-results';

type FormPageProps = {
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
      const formParams = events
        .filter(event => event.type === 'form')
        .map((event: { slug: any }) => ({
          year: String(year),
          slug: event.slug,
        }));
      allParams = [...allParams, ...formParams];
    }
  }

  return allParams;
}

export default async function FormPage({
  params,
  searchParams,
}: FormPageProps) {
  const { year: yearParam, slug } = await params;
  const searchParamsData = await searchParams;
  const year = parseInt(yearParam, 10);
  const event = await getEventBySlug(year, slug);

  if (!event || event.type !== 'form' || !event.formData) {
    notFound();
  }

  const isAdmin = searchParamsData.admin === 'true';
  const showResults = searchParamsData.results === 'true' || isAdmin;
  const form = event.formData;

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
            {form.name}
          </h2>
          <div className="mt-4 flex items-center justify-center gap-4 text-muted-foreground text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{event.date}, {year}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Form</span>
            </div>
          </div>
          <p className="mt-4 text-xl text-muted-foreground">
            {form.description}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {showResults && isAdmin ? (
            <FormResults form={form} year={year} eventSlug={slug} />
          ) : (
            <FormSubmission form={form} year={year} eventSlug={slug} />
          )}

          {isAdmin && !showResults && (
            <div className="mt-8 text-center">
              <Button asChild variant="outline">
                <Link href={`/${year}/form/${slug}?results=true&admin=true`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Submissions
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
