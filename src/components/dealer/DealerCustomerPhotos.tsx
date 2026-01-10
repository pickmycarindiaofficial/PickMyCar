import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

interface CustomerPhoto {
  url: string;
  caption?: string;
  uploaded_at?: string;
}

interface DealerCustomerPhotosProps {
  photos: CustomerPhoto[];
}

export function DealerCustomerPhotos({ photos }: DealerCustomerPhotosProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<CustomerPhoto | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    slidesToScroll: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (!photos || photos.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#236ceb] to-[#1a56c4] p-4">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Camera className="w-4 h-4" />
            Happy Customers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground text-sm py-8">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No customer photos yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#236ceb] to-[#1a56c4] p-4">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Camera className="w-4 h-4" />
            Happy Customers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {/* Carousel Container */}
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-2">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.333%]"
                  >
                    <div
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform bg-muted"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || `Customer photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - Only show if more than 3 photos */}
            {photos.length > 3 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#236ceb]/90 hover:bg-[#236ceb] text-white rounded-full w-8 h-8 disabled:opacity-30"
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#236ceb]/90 hover:bg-[#236ceb] text-white rounded-full w-8 h-8 disabled:opacity-30"
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Dot Indicators */}
          {photos.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === selectedIndex
                      ? 'w-6 bg-[#236ceb]'
                      : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to photo ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Photo Counter */}
          <p className="text-center text-xs text-muted-foreground mt-2">
            {selectedIndex + 1} / {photos.length}
          </p>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedPhoto && (
              <div className="space-y-4 p-4">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || 'Customer photo'}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
                {selectedPhoto.caption && (
                  <p className="text-center text-muted-foreground">{selectedPhoto.caption}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
