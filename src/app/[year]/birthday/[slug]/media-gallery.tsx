
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Event, MediaItem } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Maximize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MediaGalleryProps = {
  media: Event['media'];
};

const GalleryMediaItem = ({
  item,
  className,
  priority = false,
  onOpen,
}: {
  item: MediaItem;
  className?: string;
  priority?: boolean;
  onOpen: () => void;
}) => (
  <Card
    className={cn(
      'overflow-hidden group w-full h-full relative cursor-pointer',
      className
    )}
    onClick={onOpen}
  >
    <CardContent className="p-0 relative flex items-center justify-center bg-secondary h-full">
      {item.type === 'image' ? (
        <Image
          src={item.url}
          alt={item.hint}
          data-ai-hint={item.hint}
          fill
          priority={priority}
          className="object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <video
          src={item.url}
          controls={false}
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Maximize className="text-white h-12 w-12" />
      </div>
    </CardContent>
  </Card>
);

const Lightbox = ({
  media,
  startIndex,
  open,
  onOpenChange,
}: {
  media: MediaItem[];
  startIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [api, setApi] = useState<any>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open || !api) return;
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        api.scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        api.scrollNext();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, api, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-screen h-screen p-0 bg-black/80 border-0 flex items-center justify-center">
        <DialogTitle className="sr-only">Media Gallery</DialogTitle>
        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            loop: true,
            startIndex: startIndex,
          }}
          className="w-full max-w-6xl"
        >
          <CarouselContent>
            {media.map((item, index) => (
              <CarouselItem key={index} className="flex items-center justify-center">
                <div className="relative max-w-full max-h-[90vh] w-full h-auto aspect-video">
                  {item.type === 'image' ? (
                    <Image
                      src={item.url}
                      alt={item.hint}
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      autoPlay
                      className="w-full h-full"
                    />
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80" />
        </Carousel>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 h-12 w-12 text-white hover:text-white hover:bg-white/20 bg-black/30 rounded-full"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-8 w-8" />
          <span className="sr-only">Close</span>
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const OneItem = ({ media, onOpen }: { media: MediaGalleryProps['media'], onOpen: (index: number) => void }) => (
  <div className="max-w-4xl mx-auto">
    <GalleryMediaItem item={media[0]} className="aspect-video" priority onOpen={() => onOpen(0)} />
  </div>
);

const TwoItems = ({ media, onOpen }: { media: MediaGalleryProps['media'], onOpen: (index: number) => void }) => (
  <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
    <GalleryMediaItem item={media[0]} className="aspect-video" priority onOpen={() => onOpen(0)} />
    <GalleryMediaItem item={media[1]} className="aspect-video" onOpen={() => onOpen(1)} />
  </div>
);

const ThreeItems = ({ media, onOpen }: { media: MediaGalleryProps['media'], onOpen: (index: number) => void }) => (
  <div className="max-w-6xl mx-auto grid grid-cols-2 grid-rows-2 gap-4 h-[600px]">
    <div className="col-span-2 row-span-1 md:col-span-1 md:row-span-2">
       <GalleryMediaItem item={media[0]} className="h-full" priority onOpen={() => onOpen(0)} />
    </div>
    <div className="col-span-1 row-span-1">
        <GalleryMediaItem item={media[1]} className="aspect-video" onOpen={() => onOpen(1)} />
    </div>
     <div className="col-span-1 row-span-1">
        <GalleryMediaItem item={media[2]} className="aspect-video" onOpen={() => onOpen(2)} />
    </div>
  </div>
);

const DenseGrid = ({ media, onOpen }: { media: MediaGalleryProps['media'], onOpen: (index: number) => void }) => (
  <div className="max-w-6xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
    {media.map((item, index) => (
      <div key={index} className="relative aspect-square">
        <GalleryMediaItem item={item} className="h-full" onOpen={() => onOpen(index)} />
      </div>
    ))}
  </div>
);


export default function MediaGallery({ media }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const openLightbox = (index: number) => {
    setStartIndex(index);
    setLightboxOpen(true);
  };
  
  const mediaCount = media.length;

  const renderGallery = () => {
    switch (mediaCount) {
      case 1:
        return <OneItem media={media} onOpen={openLightbox} />;
      case 2:
        return <TwoItems media={media} onOpen={openLightbox} />;
      case 3:
        return <ThreeItems media={media} onOpen={openLightbox} />;
      default:
        return <DenseGrid media={media} onOpen={openLightbox} />;
    }
  }

  return (
    <div className="mb-12">
      <h3 className="text-3xl font-headline font-bold mb-6 text-center">
        Photo Album
      </h3>
      {renderGallery()}
      {mediaCount > 0 && (
        <Lightbox 
            media={media}
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
            startIndex={startIndex}
        />
      )}
    </div>
  );
}
