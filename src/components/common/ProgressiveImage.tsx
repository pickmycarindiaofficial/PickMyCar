import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    placeholder?: string;
    alt: string;
    className?: string;
    priority?: boolean;
}

export const ProgressiveImage = ({
    src,
    placeholder,
    alt,
    className,
    priority = false,
    ...props
}: ProgressiveImageProps) => {
    const [imgSrc, setImgSrc] = useState(placeholder || src);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Determine priority for eager loading
        const loadPriority = priority ? 'high' : 'low';

        // Create a new image to preload the high-res version
        const img = new Image();
        img.src = src;
        img.decoding = 'async';
        // @ts-ignore - fetchPriority is standard but TS might complain
        if (priority) img.fetchPriority = loadPriority;

        img.onload = () => {
            setImgSrc(src);
            setIsLoaded(true);
        };
    }, [src, priority]);

    return (
        <div className={cn("relative overflow-hidden w-full h-full bg-muted/20", className)}>
            {/* Visual Placeholder (Blurred) */}
            {placeholder && !isLoaded && (
                <img
                    src={placeholder}
                    alt={alt}
                    className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 transition-opacity duration-500 ease-out"
                    style={{ opacity: isLoaded ? 0 : 1 }}
                    aria-hidden="true"
                />
            )}

            {/* Main Image */}
            <img
                src={imgSrc}
                alt={alt}
                className={cn(
                    "w-full h-full object-contain transition-all duration-700 ease-in-out",
                    !isLoaded && placeholder ? "opacity-0" : "opacity-100",
                    isLoaded ? "scale-100 blur-0" : "scale-105 blur-sm"
                )}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                {...props}
            />
        </div>
    );
};
