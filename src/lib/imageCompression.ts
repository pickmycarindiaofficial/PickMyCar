import imageCompression from 'browser-image-compression';

/**
 * World-class image optimization strategy:
 * 1. Compress on client-side before upload (reduce bandwidth)
 * 2. Generate multiple sizes (thumbnail, medium, large)
 * 3. Convert to WebP format (25-35% smaller than JPEG)
 * 4. Quality optimization at 85% (imperceptible loss, significant size reduction)
 * 5. Strip EXIF data (privacy + smaller file size)
 * 
 * Expected savings: 60-80% storage reduction
 */

export interface CompressionResult {
  file: File;
  url: string;
  size: number;
  width: number;
  height: number;
}

export interface OptimizedImages {
  thumbnail: CompressionResult;
  medium: CompressionResult;
  large: CompressionResult;
}

const SIZES = {
  thumbnail: 300,
  medium: 800,
  large: 1920,
};

const QUALITY = {
  thumbnail: 0.8,
  medium: 0.85,
  large: 0.85,
};

/**
 * Compress and resize image to specific dimensions
 */
async function compressImage(
  file: File,
  maxWidthOrHeight: number,
  quality: number
): Promise<CompressionResult> {
  const options = {
    maxWidthOrHeight,
    useWebWorker: true,
    maxIteration: 10,
    fileType: 'image/webp',
    initialQuality: quality,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // Get dimensions
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
          URL.revokeObjectURL(img.src);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(compressedFile);
      }
    );

    return {
      file: compressedFile,
      url: URL.createObjectURL(compressedFile),
      size: compressedFile.size,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image. Please try another image.');
  }
}

/**
 * Optimize single image into multiple sizes (thumbnail, medium, large)
 */
export async function optimizeCarImage(file: File): Promise<OptimizedImages> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Image size must be less than 20MB');
  }

  // Generate all sizes in parallel for speed
  const [thumbnail, medium, large] = await Promise.all([
    compressImage(file, SIZES.thumbnail, QUALITY.thumbnail),
    compressImage(file, SIZES.medium, QUALITY.medium),
    compressImage(file, SIZES.large, QUALITY.large),
  ]);

  return { thumbnail, medium, large };
}

/**
 * Batch optimize multiple images
 */
export async function optimizeMultipleImages(
  files: File[]
): Promise<OptimizedImages[]> {
  if (files.length === 0) {
    throw new Error('No files provided');
  }

  if (files.length > 20) {
    throw new Error('Maximum 20 images allowed');
  }

  // Process all images in parallel
  return Promise.all(files.map(file => optimizeCarImage(file)));
}

/**
 * Get image file info before processing
 */
export async function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  size: number;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const info = {
        width: img.width,
        height: img.height,
        size: file.size,
        aspectRatio: img.width / img.height,
      };
      URL.revokeObjectURL(img.src);
      resolve(info);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Estimate compression savings
 */
export function estimateCompressionSavings(originalSize: number): {
  estimatedSize: number;
  savingsPercent: number;
  savingsBytes: number;
} {
  // Typical WebP compression achieves 70% reduction
  const estimatedSize = Math.round(originalSize * 0.3);
  const savingsBytes = originalSize - estimatedSize;
  const savingsPercent = Math.round((savingsBytes / originalSize) * 100);

  return {
    estimatedSize,
    savingsPercent,
    savingsBytes,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
