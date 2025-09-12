
'use client';

import { useState, useEffect } from 'react';
import type { Wish } from '@/lib/data';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { deleteWish } from '@/app/actions';
import Image from 'next/image';

type WishCardProps = {
  wish: Wish;
  isAdmin: boolean;
  removeWish: (wishId: string) => void;
  personSlug: string;
  year: number;
};

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="ghost"
      size="icon"
      type="submit"
      disabled={pending}
      aria-label="Delete wish"
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

export default function WishCard({
  wish,
  isAdmin,
  removeWish,
  personSlug,
  year,
}: WishCardProps) {
  const [clientFormattedDate, setClientFormattedDate] = useState('');

  useEffect(() => {
    setClientFormattedDate(
      new Date(wish.createdAt).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    );
  }, [wish.createdAt]);


  const handleDeleteAction = async (formData: FormData) => {
    // This provides an optimistic UI update by immediately removing the wish from the client state.
    removeWish(wish.id);
    // This calls the server action to handle the deletion on the backend.
    await deleteWish(formData);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {wish.author === 'Anonymous' ? (
                  <User />
                ) : (
                  wish.author.charAt(0).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg font-semibold">{wish.author}</CardTitle>
          </div>
          {isAdmin && (
            <form action={handleDeleteAction}>
              <input type="hidden" name="wishId" value={wish.id} />
              <input type="hidden" name="personSlug" value={personSlug} />
              <input type="hidden" name="year" value={year} />
              <DeleteButton />
            </form>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground/90">{wish.message}</p>
        {wish.imageUrl && (
          <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden border">
            <Image
              src={wish.imageUrl}
              alt={`Image shared by ${wish.author}`}
              width={400}
              height={300}
              className="w-full h-auto object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">{clientFormattedDate || '...'}</p>
      </CardFooter>
    </Card>
  );
}

    