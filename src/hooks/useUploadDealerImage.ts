import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { optimizeCarImage } from '@/lib/imageCompression';
import { toast } from 'sonner';

export type ImageType = 'logo' | 'banner';

export function useUploadDealerImage(dealerId: string | undefined, imageType: ImageType) {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!dealerId) throw new Error('Dealer ID is required');

      // Optimize image based on type
      const optimized = await optimizeCarImage(file);
      const imageFile = imageType === 'logo' ? optimized.medium.file : optimized.large.file;
      
      const timestamp = Date.now();
      const path = `dealers/${dealerId}/${imageType}/${timestamp}-${file.name}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('car-listings')
        .upload(path, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('car-listings')
        .getPublicUrl(data.path);

      return publicUrl;
    },
    onSuccess: () => {
      toast.success(`${imageType === 'logo' ? 'Logo' : 'Banner'} uploaded successfully`);
    },
    onError: (error: any) => {
      console.error(`Error uploading ${imageType}:`, error);
      toast.error(error.message || `Failed to upload ${imageType}`);
    },
  });
}
