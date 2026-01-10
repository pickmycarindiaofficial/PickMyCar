import { supabase } from './supabase-client';
import { optimizeCarImage } from './imageCompression';

export async function uploadCarImages(files: File[], userId: string): Promise<Array<{url: string; thumbnail_url: string; medium_url: string; size: number; originalSize: number}>> {
  const results = [];
  
  for (const file of files) {
    const originalSize = file.size;
    const optimized = await optimizeCarImage(file);
    const timestamp = Date.now();
    
    // Upload all three sizes
    const [largeUrl, mediumUrl, thumbnailUrl] = await Promise.all([
      uploadFile(optimized.large.file, `${userId}/large/${timestamp}-${file.name}`),
      uploadFile(optimized.medium.file, `${userId}/medium/${timestamp}-${file.name}`),
      uploadFile(optimized.thumbnail.file, `${userId}/thumb/${timestamp}-${file.name}`),
    ]);
    
    results.push({
      url: largeUrl,
      medium_url: mediumUrl,
      thumbnail_url: thumbnailUrl,
      size: optimized.large.size,
      originalSize,
    });
  }
  
  return results;
}

async function uploadFile(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('car-listings')
    .upload(path, file, { upsert: true });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('car-listings')
    .getPublicUrl(data.path);
  
  return publicUrl;
}
