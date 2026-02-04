import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { uploadCarImages } from '@/lib/imageUpload';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ImageItem {
  url: string;
  thumbnail_url?: string;
  medium_url?: string;
  size: number;
  originalSize?: number;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  minImages?: number;
}

interface SortableImageProps {
  image: ImageItem;
  index: number;
  onRemove: () => void;
}

function SortableImage({ image, index, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  const compressionSavings = image.originalSize
    ? {
      saved: image.originalSize - image.size,
      percent: Math.round(((image.originalSize - image.size) / image.originalSize) * 100),
    }
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
    >
      <img
        src={image.thumbnail_url || image.url}
        alt={`Car ${index + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Drag Handle */}
      <button
        type="button"
        className="absolute top-2 left-2 bg-background/90 p-1.5 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {index === 0 && (
        <div className="absolute top-2 left-12 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
          Thumbnail
        </div>
      )}

      {/* Compression Stats */}
      {compressionSavings && (
        <div className="absolute bottom-2 left-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-foreground font-medium">
            {formatBytes(image.originalSize!)} → {formatBytes(image.size)}
          </div>
          <div className="text-green-600 font-semibold">
            {compressionSavings.percent}% saved
          </div>
        </div>
      )}

      <Button
        type="button"
        size="icon"
        variant="destructive"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
        <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export function ImageUploader({
  images = [],
  onChange,
  maxImages = 20,
  minImages = 3,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.url === active.id);
      const newIndex = images.findIndex((img) => img.url === over.id);
      onChange(arrayMove(images, oldIndex, newIndex));
      toast.success('Image order updated');
    }
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const remainingSlots = maxImages - images.length;

      if (fileArray.length > remainingSlots) {
        toast.error(
          `You can only upload ${remainingSlots} more image(s). Maximum ${maxImages} images allowed.`
        );
        return;
      }

      const validFiles = fileArray.filter((file) => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setUploading(true);
      setUploadProgress(0);

      try {
        // Check for Supabase auth user first
        const { data: { user } } = await supabase.auth.getUser();

        // Also check for dealer token (dealers use custom auth)
        const dealerToken = localStorage.getItem('dealer_token');
        const dealerInfoStr = localStorage.getItem('dealer_info');

        // Determine user ID for upload
        let uploadUserId: string;

        if (user) {
          uploadUserId = user.id;
        } else if (dealerToken && dealerInfoStr) {
          try {
            const dealerInfo = JSON.parse(dealerInfoStr);
            uploadUserId = dealerInfo.id;
          } catch {
            toast.error('Please log in to upload images');
            return;
          }
        } else {
          toast.error('Please log in to upload images');
          return;
        }

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const uploadedImages = await uploadCarImages(validFiles, uploadUserId);

        clearInterval(progressInterval);
        setUploadProgress(100);

        onChange([...images, ...uploadedImages]);

        // Calculate total savings
        const totalOriginal = uploadedImages.reduce((sum, img) => sum + (img.originalSize || 0), 0);
        const totalCompressed = uploadedImages.reduce((sum, img) => sum + img.size, 0);
        const totalSaved = totalOriginal - totalCompressed;
        const savedPercent = Math.round((totalSaved / totalOriginal) * 100);

        toast.success(
          `${uploadedImages.length} image(s) uploaded! Saved ${(totalSaved / 1024 / 1024).toFixed(1)} MB (${savedPercent}%)`
        );

        setTimeout(() => setUploadProgress(0), 500);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload images. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, onChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    toast.success('Image removed');
  };

  const remainingSlots = maxImages - images.length;
  const isMinimumMet = images.length >= minImages;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {remainingSlots > 0 && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            uploading && 'pointer-events-none opacity-50'
          )}
        >
          <input
            type="file"
            id="image-upload"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />

          <div
            className="cursor-pointer flex flex-col items-center gap-3"
            onClick={() => !uploading && document.getElementById('image-upload')?.click()}
          >
            {uploading ? (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}

            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Uploading images...' : 'Click anywhere to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP up to 10MB ({remainingSlots} slots remaining)
              </p>
              <p className="text-xs text-muted-foreground">Minimum {minImages} images required</p>
            </div>

            {!uploading && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-2 relative z-10"
              >
                Select Images
              </Button>
            )}
          </div>

          {uploading && uploadProgress > 0 && (
            <div className="mt-4 w-full max-w-xs mx-auto">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{uploadProgress}% complete</p>
            </div>
          )}
        </div>
      )}

      {/* Image Grid with Drag and Drop */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              {images.length} / {maxImages} images
              {!isMinimumMet && (
                <span className="text-destructive ml-2">(Need {minImages - images.length} more)</span>
              )}
            </p>
            {images.length > 0 && (
              <p className="text-xs text-muted-foreground">First image will be the thumbnail</p>
            )}
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map((img) => img.url)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <SortableImage
                    key={image.url}
                    image={image}
                    index={index}
                    onRemove={() => handleRemove(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <p className="text-xs text-muted-foreground mt-3">
            💡 Tip: Drag images to reorder. First image will be used as the thumbnail.
          </p>
        </div >
      )
      }

      {
        images.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No images uploaded yet</p>
          </div>
        )
      }
    </div >
  );
}
