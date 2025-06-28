'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CarouselProps {
  images: string[];
  className?: string;
  alt?: string;
}

export function Carousel({ images, className, alt = 'Product image' }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) {
    return (
      <div className={cn('relative', className)}>
        <Image
          src="/placeholder.svg"
          alt="No image available"
          width={300}
          height={200}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={cn('relative', className)}>
        <Image
          src={images[0]}
          alt={alt}
          width={300}
          height={200}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className={cn('relative', className)}>
          <Image
            src={images[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            width={300}
            height={200}
            className="w-full h-full object-cover"
            priority={currentIndex === 0}
            loading={currentIndex === 0 ? 'eager' : 'lazy'}
            unoptimized
          />
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPrevious}
        className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full transition-opacity"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNext}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full transition-opacity"
        aria-label="Next image"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all',
              index === currentIndex
                ? 'bg-white w-3'
                : 'bg-white/50 hover:bg-white/75'
            )}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
