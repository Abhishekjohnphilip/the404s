'use client';

import { useEffect, useRef, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { Event, Wish } from '@/lib/data';
import { submitWish, type WishFormState } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Send, Loader2, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

type WishFormProps = {
  person: Event;
  addWish: (newWish: Wish) => void;
  year: number;
};

const initialState: WishFormState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      Post Wish
    </Button>
  );
}

export default function WishForm({ person, addWish, year }: WishFormProps) {
  const [state, formAction, isPending] = useActionState(submitWish, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousPending = useRef(isPending);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (JPG, PNG, GIF)',
          variant: 'destructive',
        });
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const customFormAction = (formData: FormData) => {
    if (selectedFile) {
      formData.append('image', selectedFile);
    }
    formAction(formData);
  };

  useEffect(() => {
    if (previousPending.current && !isPending && state.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      if (state.newWish) {
        addWish(state.newWish as Wish);
      }
      formRef.current?.reset();
      setSelectedImage(null);
      setSelectedFile(null);
    }
    previousPending.current = isPending;
  }, [state, isPending, addWish, toast]);

  return (
    <Card>
      <form action={customFormAction} ref={formRef}>
        <input type="hidden" name="personSlug" value={person.slug} />
        <input type="hidden" name="year" value={year} />
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            Send Your Wishes
          </CardTitle>
          <CardDescription>Share a message for {person.name}!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!state.success && state.message && !isPending && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="author" className="sr-only">
                Your Name
              </label>
              <Input
                id="author"
                name="author"
                placeholder="Your Name (or leave blank for Anonymous)"
              />
            </div>
            <div>
              <label htmlFor="message" className="sr-only">
                Your Message
              </label>
              <Textarea
                id="message"
                name="message"
                placeholder="Write your birthday message here..."
                required
                rows={4}
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <label htmlFor="image" className="text-sm font-medium">
                Add an Image (Optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Choose Image
                </Button>
                {selectedImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              {selectedImage && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <Image
                    src={selectedImage}
                    alt="Selected image"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
