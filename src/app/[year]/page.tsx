import { getEventsByYear, getYears } from '@/lib/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Gift, PartyPopper, ChevronLeft, BarChart3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type YearPageProps = {
  params: Promise<{ year: string }>;
};

export async function generateStaticParams() {
  const years = await getYears();
  return years.map(year => ({
    year: String(year),
  }));
}

export default async function YearPage({ params }: YearPageProps) {
  const { year: yearParam } = await params;
  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    notFound();
  }

  const events = await getEventsByYear(year);
  const allYears = await getYears();

  if (events.length === 0) {
    if (!allYears.includes(year)) {
      notFound();
    }
  }

  const birthdays = events.filter(e => e.type === 'birthday');
  const otherEvents = events.filter(e => e.type === 'event');
  const polls = events.filter(e => e.type === 'poll');
  const forms = events.filter(e => e.type === 'form');

  const EventCard = ({ event }: { event: { slug: string; name: string; date: string, type: 'birthday' | 'event' | 'poll' | 'form'} }) => {
    let linkHref = '';
    let icon = <PartyPopper className="h-8 w-8 text-primary" />;
    let buttonText = 'View';
    let buttonIcon = <Gift className="mr-2 h-4 w-4" />;

    switch (event.type) {
      case 'birthday':
        linkHref = `/${year}/birthday/${event.slug}`;
        icon = <Users className="h-8 w-8 text-primary" />;
        buttonText = 'Send a Wish';
        buttonIcon = <Gift className="mr-2 h-4 w-4" />;
        break;
      case 'event':
        linkHref = `/${year}/event/${event.slug}`;
        icon = <PartyPopper className="h-8 w-8 text-primary" />;
        buttonText = 'View Event';
        buttonIcon = <Gift className="mr-2 h-4 w-4" />;
        break;
      case 'poll':
        linkHref = `/${year}/poll/${event.slug}`;
        icon = <BarChart3 className="h-8 w-8 text-primary" />;
        buttonText = 'Vote Now';
        buttonIcon = <BarChart3 className="mr-2 h-4 w-4" />;
        break;
      case 'form':
        linkHref = `/${year}/form/${event.slug}`;
        icon = <FileText className="h-8 w-8 text-primary" />;
        buttonText = 'Fill Form';
        buttonIcon = <FileText className="mr-2 h-4 w-4" />;
        break;
    }
    
    return (
        <Card key={event.slug} className="flex flex-col">
        <CardHeader>
            <div className="flex items-center gap-4">
            <div className="bg-secondary p-3 rounded-full">
                {icon}
            </div>
            <div>
                <CardTitle className="font-headline text-2xl">
                {event.name}
                </CardTitle>
            </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">{event.date}</p>
            <div className="mt-6 text-right">
            <Button asChild>
                <Link href={linkHref}>
                {buttonIcon}
                {buttonText}
                </Link>
            </Button>
            </div>
        </CardContent>
        </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <div className="mb-8">
          <Button asChild variant="outline">
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to All Years
            </Link>
          </Button>
        </div>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl">
          Events in {year}
        </h2>
      </div>

      {events.length > 0 ? (
        <Tabs defaultValue="birthdays" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="birthdays">Birthdays ({birthdays.length})</TabsTrigger>
            <TabsTrigger value="events">Events ({otherEvents.length})</TabsTrigger>
            <TabsTrigger value="polls">Polls ({polls.length})</TabsTrigger>
            <TabsTrigger value="forms">Forms ({forms.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="birthdays">
            {birthdays.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {birthdays.map(event => <EventCard key={event.slug} event={event} />)}
              </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">No birthdays found for {year}.</p>
            )}
          </TabsContent>
          <TabsContent value="events">
           {otherEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherEvents.map(event => <EventCard key={event.slug} event={event} />)}
              </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">No other events found for {year}.</p>
            )}
          </TabsContent>
          <TabsContent value="polls">
           {polls.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {polls.map(event => <EventCard key={event.slug} event={event} />)}
              </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">No polls found for {year}.</p>
            )}
          </TabsContent>
          <TabsContent value="forms">
           {forms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {forms.map(event => <EventCard key={event.slug} event={event} />)}
              </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">No forms found for {year}.</p>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            No events found for {year}.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/">Back to Years</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
