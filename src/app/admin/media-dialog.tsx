'use client';
import { useState, useEffect, useActionState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Loader2, Save, Upload, X, Video } from 'lucide-react';
import { addMediaToEvent } from '@/app/actions';
import { useFormStatus } from 'react-dom';
import type { Event, MediaItem } from '@/lib/data';

type MediaDialogProps = {
  year: number;
  eventSlug: string;
  currentMedia: Event['media'];
};

type PreviewMedia = {
  file: File;
  dataUrl: string;
  type: 'image' | 'video';
};

const initialState = {
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
        <Save className="mr-2 h-4 w-4" />
      )}
      Save Changes
    </Button>
  );
}

const MediaPreview = ({ media }: { media: MediaItem | PreviewMedia }) => {
  const url = 'dataUrl' in media ? media.dataUrl : media.url;
  const alt = 'hint' in media ? media.hint : 'Preview';
  
  if (media.type === 'video') {
    return (
      <video
        src={url}
        controls
        className="object-cover w-full h-full rounded-md bg-black"
      />
    );
  }
  
  return (
    <Image
      src={url}
      alt={alt}
      data-ai-hint={'hint' in media ? media.hint : undefined}
      fill
      className="object-contain rounded-md"
      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
    />
  );
};


export default function MediaDialog({
  year,
  eventSlug,
  currentMedia,
}: MediaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    addMediaToEvent,
    initialState
  );
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia[]>([]);
  const [existingMedia, setExistingMedia] = useState(currentMedia);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      setPreviewMedia([]);
    }
  }, [state, isPending]);

  useEffect(() => {
    if (isOpen) {
      setExistingMedia(currentMedia);
      setPreviewMedia([]);
    }
  }, [isOpen, currentMedia]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newPreviews: PreviewMedia[] = [];

    files.forEach(file => {
      const reader = new FileReader();
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      
      reader.onload = e => {
        newPreviews.push({ file, dataUrl: e.target?.result as string, type: mediaType });
        if (newPreviews.length === files.length) {
          setPreviewMedia(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreviewMedia = (index: number) => {
    setPreviewMedia(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (id: string) => {
    setExistingMedia(prev => prev.filter(img => img.id !== id));
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const customFormAction = (formData: FormData) => {
    existingMedia.forEach(media => {
      formData.append('existingMediaIds[]', media.id);
    });
    
    previewMedia.forEach(media => {
      formData.append('media[]', media.file);
      formData.append('mediaTypes[]', media.type);
    });

    formAction(formData);
  };
  

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Camera className="mr-2 h-4 w-4" />
          Manage Media
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Media</DialogTitle>
          <DialogDescription>
            Upload new photos or videos, or remove existing ones from the event
            album.
          </DialogDescription>
        </DialogHeader>
        <form action={customFormAction}>
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="eventSlug" value={eventSlug} />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />

          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary hover:bg-secondary/50"
              onClick={triggerFileSelect}
            >
              <div className="flex justify-center items-center gap-4 text-muted-foreground">
                <Upload className="h-8 w-8 " />
                <div>
                  <p className="font-semibold text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm">
                    PNG, JPG, GIF, MP4, WEBM up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="h-72 w-full rounded-md border">
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingMedia.map(media => (
                  <div key={media.id} className="relative group aspect-square">
                    <MediaPreview media={media} />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => removeExistingMedia(media.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {previewMedia.map((media, index) => (
                  <div key={index} className="relative group aspect-square">
                    <MediaPreview media={media} />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => removePreviewMedia(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
