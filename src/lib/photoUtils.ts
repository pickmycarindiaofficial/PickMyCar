/**
 * Utility functions for parsing and handling car photos from various data formats
 */

/**
 * Extracts a photo URL from a photo object
 * Tries multiple possible keys in order of preference
 */
function extractUrlFromObject(photoObj: any): string | null {
  if (typeof photoObj === 'string') return photoObj;
  if (typeof photoObj !== 'object' || photoObj === null) return null;
  
  // Try different possible keys
  return photoObj.url || 
         photoObj.medium_url || 
         photoObj.photo_url || 
         photoObj.thumbnail_url || 
         null;
}

/**
 * Parses photos from various formats and returns an array of URL strings
 * Handles:
 * - Array of strings: ["url1", "url2"]
 * - Array of objects: [{url: "..."}, {url: "..."}]
 * - JSON string: '["url1", "url2"]' or '[{url: "..."}]'
 * - Mixed arrays
 * - Nested JSONB structures
 */
export function parsePhotos(photos: any): string[] {
  try {
    // If null or undefined, return empty array
    if (!photos) return [];
    
    // If already an array
    if (Array.isArray(photos)) {
      return photos
        .map(photo => {
          // If photo is a string, use it directly
          if (typeof photo === 'string') return photo;
          // If photo is an object, extract URL
          return extractUrlFromObject(photo);
        })
        .filter((url): url is string => typeof url === 'string' && url.length > 0);
    }
    
    // If it's a JSON string, parse it
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        // Recursively call parsePhotos on the parsed result
        return parsePhotos(parsed);
      } catch {
        // If JSON parse fails, might be a single URL
        return [photos];
      }
    }
    
    // If it's a single object, try to extract URL
    if (typeof photos === 'object') {
      const url = extractUrlFromObject(photos);
      return url ? [url] : [];
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing photos:', error, photos);
    return [];
  }
}

/**
 * Gets the best available photo URL (prefers medium size)
 */
export function getBestPhotoUrl(photoObj: any): string {
  if (typeof photoObj === 'string') return photoObj;
  if (!photoObj) return '/placeholder.svg';
  
  return photoObj.medium_url || 
         photoObj.url || 
         photoObj.photo_url || 
         photoObj.thumbnail_url || 
         '/placeholder.svg';
}

/**
 * Gets the thumbnail URL (prefers smaller size for performance)
 */
export function getThumbnailUrl(photoObj: any): string {
  if (typeof photoObj === 'string') return photoObj;
  if (!photoObj) return '/placeholder.svg';
  
  return photoObj.thumbnail_url || 
         photoObj.url || 
         photoObj.medium_url || 
         photoObj.photo_url || 
         '/placeholder.svg';
}
