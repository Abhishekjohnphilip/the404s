import { getYears } from '@/lib/data';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default async function Home() {
  const years = await getYears();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl">
          Welcome to THE404s
        </h2>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Celebrate the special moments. Select a year to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {years.map(year => (
          <Link href={`/${year}`} key={year} className="group">
            <Card className="h-full transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-primary">
              <CardHeader className="flex flex-col items-center justify-center text-center p-8">
                <Calendar className="h-12 w-12 mb-4 text-primary transition-colors group-hover:text-accent" />
                <CardTitle className="text-4xl font-bold font-headline">
                  {year}
                </CardTitle>
                <CardDescription className="mt-2">View Events</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
