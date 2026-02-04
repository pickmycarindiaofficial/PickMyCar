import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export interface GalleryImage {
    id: string;
    name: string;
    original_name: string | null;
    url: string;
    file_size: number | null;
    file_type: string | null;
    width: number | null;
    height: number | null;
    uploaded_by: string | null;
    created_at: string;
    folder: string;
}

// Fetch all gallery images
export function useGalleryImages(folder?: string) {
    return useQuery({
        queryKey: ['gallery-images', folder],
        queryFn: async () => {
            let query = supabase
                .from('gallery_images')
                .select('*')
                .order('created_at', { ascending: false });

            if (folder && folder !== 'all') {
                query = query.eq('folder', folder);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as GalleryImage[];
        },
    });
}

// Upload image mutation
export function useUploadGalleryImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            file,
            folder = 'general',
            name
        }: {
            file: File;
            folder?: string;
            name?: string;
        }) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Generate unique filename
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `gallery/${folder}/${timestamp}-${sanitizedName}`;

            // Upload to storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('gallery')
                .upload(filePath, file, {
                    upsert: false,
                    contentType: file.type
                });

            if (uploadError) {
                // If bucket doesn't exist, try car-listings bucket as fallback
                const fallbackPath = `gallery/${folder}/${timestamp}-${sanitizedName}`;
                const { data: fallbackData, error: fallbackError } = await supabase.storage
                    .from('car-listings')
                    .upload(fallbackPath, file, {
                        upsert: false,
                        contentType: file.type
                    });

                if (fallbackError) throw fallbackError;

                // Get public URL from fallback bucket
                const { data: { publicUrl } } = supabase.storage
                    .from('car-listings')
                    .getPublicUrl(fallbackPath);

                // Save to database
                const { data: dbData, error: dbError } = await supabase
                    .from('gallery_images')
                    .insert({
                        name: name || file.name.split('.')[0],
                        original_name: file.name,
                        url: publicUrl,
                        file_size: file.size,
                        file_type: file.type,
                        uploaded_by: user.id,
                        folder,
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;
                return dbData;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('gallery')
                .getPublicUrl(uploadData.path);

            // Save to database
            const { data: dbData, error: dbError } = await supabase
                .from('gallery_images')
                .insert({
                    name: name || file.name.split('.')[0],
                    original_name: file.name,
                    url: publicUrl,
                    file_size: file.size,
                    file_type: file.type,
                    uploaded_by: user.id,
                    folder,
                })
                .select()
                .single();

            if (dbError) throw dbError;
            return dbData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
            toast.success('Image uploaded successfully!');
        },
        onError: (error: Error) => {
            console.error('Upload error:', error);
            toast.error('Failed to upload image', { description: error.message });
        },
    });
}

// Delete image mutation
export function useDeleteGalleryImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (image: GalleryImage) => {
            // Extract path from URL for storage deletion
            const url = image.url;
            let storagePath: string | null = null;
            let bucket = 'gallery';

            // Try to extract path from gallery bucket
            const galleryMatch = url.match(/\/gallery\/(.+)$/);
            if (galleryMatch) {
                storagePath = galleryMatch[1];
                bucket = 'gallery';
            } else {
                // Try car-listings bucket
                const carListingsMatch = url.match(/\/car-listings\/(.+)$/);
                if (carListingsMatch) {
                    storagePath = carListingsMatch[1];
                    bucket = 'car-listings';
                }
            }

            // Delete from storage if we found the path
            if (storagePath) {
                const { error: storageError } = await supabase.storage
                    .from(bucket)
                    .remove([storagePath]);

                if (storageError) {
                    console.error('Storage delete error:', storageError);
                    // Continue to delete from database anyway
                }
            }

            // Delete from database
            const { error: dbError } = await supabase
                .from('gallery_images')
                .delete()
                .eq('id', image.id);

            if (dbError) throw dbError;

            return image.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
            toast.success('Image deleted successfully!');
        },
        onError: (error: Error) => {
            console.error('Delete error:', error);
            toast.error('Failed to delete image', { description: error.message });
        },
    });
}
