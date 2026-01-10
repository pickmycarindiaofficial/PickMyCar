import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  carTitle: string;
}

export const ImageGallery = ({ images, carTitle }: ImageGalleryProps) => {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted">
        <img
          src={images[activeImage]}
          alt={`${carTitle} - Image ${activeImage + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(index)}
              className={cn(
                'relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden transition-all',
                activeImage === index
                  ? 'ring-2 ring-primary opacity-100'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
