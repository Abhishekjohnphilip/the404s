
'use client';

import { useState, useTransition } from 'react';
import type { Event, Wish } from '@/lib/data';
import WishCard from './wish-card';
import WishForm from './wish-form';
import { Separator } from '@/components/ui/separator';

type WishWallProps = {
  person: Event;
  isAdmin: boolean;
  year: number;
};

export default function WishWall({ person, isAdmin, year }: WishWallProps) {
  const [wishes, setWishes] = useState<Wish[]>(person.wishes);
  const [isPending, startTransition] = useTransition();

  const addWish = (newWish: Wish) => {
    startTransition(() => {
      setWishes(prevWishes => [newWish, ...prevWishes]);
    });
  };

  const removeWish = (wishId: string) => {
    startTransition(() => {
      setWishes(prevWishes => prevWishes.filter(w => w.id !== wishId));
    });
  };

  return (
    <div>
      <h3 className="text-3xl font-headline font-bold mb-6 text-center">
        Wall of Wishes
      </h3>
      <div className="max-w-2xl mx-auto">
        <WishForm person={person} addWish={addWish} year={year} />
        <Separator className="my-8" />
        <div className="space-y-6">
          {wishes.map((wish, index) => (
            <div
              key={wish.id}
              className="animate-in fade-in-0 duration-700"
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both',
              }}
            >
              <WishCard
                wish={wish}
                isAdmin={isAdmin}
                removeWish={removeWish}
                personSlug={person.slug}
                year={year}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

    