import { forwardRef, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    /** Image source URL */
    src: string;
    /** Alt text (required for accessibility) */
    alt: string;
    /** Enable lazy loading (default: true) */
    lazy?: boolean;
    /** Priority image (disables lazy loading) */
    priority?: boolean;
    /** Fallback image on error */
    fallbackSrc?: string;
}

/**
 * OptimizedImage - Enterprise-grade image component
 * 
 * Features:
 * - Lazy loading by default (loading="lazy")
 * - Async decoding for non-blocking rendering
 * - Error fallback support
 * - Accessibility enforcement (alt required)
 */
export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
    ({ src, alt, lazy = true, priority = false, fallbackSrc, className, onError, ...props }, ref) => {
        const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
            if (fallbackSrc) {
                (e.target as HTMLImageElement).src = fallbackSrc;
            }
            onError?.(e);
        };

        return (
            <img
                ref={ref}
                src={src}
                alt={alt}
                loading={priority ? 'eager' : lazy ? 'lazy' : undefined}
                decoding={priority ? 'sync' : 'async'}
                onError={handleError}
                className={className}
                {...props}
            />
        );
    }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
