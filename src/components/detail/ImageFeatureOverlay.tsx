import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Shield, Zap, Wind, Camera, Lock, Radio, Smartphone, Speaker, Wifi, Bluetooth, Clock, Navigation, Thermometer, Sun, Snowflake, CircleDot } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  icon: string | null;
  category: string | null;
}

interface ImageFeatureOverlayProps {
  images: string[];
  carTitle: string;
  features: Feature[];
}

// Icon mapping from database icon strings to Lucide components
const iconMap: Record<string, any> = {
  'shield': Shield,
  'shield-alert': Shield,
  'zap': Zap,
  'wind': Wind,
  'camera': Camera,
  'lock': Lock,
  'key': Lock,
  'radio': Radio,
  'smartphone': Smartphone,
  'speaker': Speaker,
  'wifi': Wifi,
  'bluetooth': Bluetooth,
  'clock': Clock,
  'navigation': Navigation,
  'thermometer': Thermometer,
  'sun': Sun,
  'snowflake': Snowflake,
  'gauge': Zap,
  'battery-charging': Zap,
  'circle': CircleDot,
  'circle-dot': CircleDot,
};

export const ImageFeatureOverlay = ({ images, carTitle, features }: ImageFeatureOverlayProps) => {
  const [activeImage, setActiveImage] = useState(0);

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  // Get top 4 features for display
  const topFeatures = features.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Main Image with Feature Overlay */}
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted group">
        <img
          src={images[activeImage]}
          alt={`${carTitle} - Image ${activeImage + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Dark gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 md:p-3 rounded-full backdrop-blur-sm transition-all z-20 hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 md:p-3 rounded-full backdrop-blur-sm transition-all z-20 hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}

        {/* Feature Overlay - ONLY ON 2ND IMAGE */}
        {topFeatures.length > 0 && activeImage === 1 && (
          <>
            {/* Section 1: "Top Highlights" Heading ONLY - TOP LEFT */}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10 pointer-events-none z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-1 h-6 sm:h-8 md:h-10 bg-primary" />
                <h3 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold drop-shadow-lg">
                  Top Highlights
                </h3>
              </div>
            </div>

            {/* Section 2: Feature Grid - BOTTOM 1/4th */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10">
              {/* Dark Gradient - Bottom to Top (for bottom features) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Feature Grid Container - Bottom 1/4th of image */}
              <div className="relative px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6 md:pb-8 lg:pb-10 pt-6 sm:pt-8 md:pt-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 md:gap-y-5 gap-x-4 sm:gap-x-6 md:gap-x-8 max-w-4xl">
                  {topFeatures.map((feature, index) => {
                    const IconComponent = feature.icon ? iconMap[feature.icon] : CircleDot;
                    return (
                      <div
                        key={feature.id}
                        className="flex items-center gap-2 sm:gap-3"
                        style={{
                          animation: `fadeInUp 0.6s ease-out forwards`,
                          animationDelay: `${index * 150}ms`,
                          opacity: 0,
                        }}
                      >
                        {/* Icon with White Circular Background */}
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <IconComponent 
                            className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" 
                            strokeWidth={2}
                          />
                        </div>
                        
                        {/* Feature Text - Properly Aligned */}
                        <span className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-medium leading-snug drop-shadow-md">
                          {feature.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}


        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-black/60 backdrop-blur-md text-white px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-sm font-medium z-20 border border-white/10">
            {activeImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="mt-3 sm:mt-4 md:mt-6 flex gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(index)}
              className={cn(
                "relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md sm:rounded-lg overflow-hidden transition-all",
                "border-2",
                activeImage === index
                  ? "border-primary ring-2 ring-primary/20 scale-105"
                  : "border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={img}
                alt={`${carTitle} - view ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {activeImage === index && (
                <div className="absolute inset-0 bg-primary/10" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
