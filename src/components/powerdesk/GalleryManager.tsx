import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Copy, Trash2, Check, Loader2, X, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useGalleryImages, useUploadGalleryImage, useDeleteGalleryImage, GalleryImage } from '@/hooks/useGallery';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FOLDERS = [
    { value: 'all', label: 'All Images' },
    { value: 'general', label: 'General' },
    { value: 'banners', label: 'Banners' },
    { value: 'logos', label: 'Logos' },
    { value: 'icons', label: 'Icons' },
    { value: 'backgrounds', label: 'Backgrounds' },
];

export function GalleryManager() {
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [uploadFolder, setUploadFolder] = useState('general');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);

    const { data: images, isLoading } = useGalleryImages(selectedFolder);
    const uploadMutation = useUploadGalleryImage();
    const deleteMutation = useDeleteGalleryImage();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            uploadMutation.mutate({ file, folder: uploadFolder });
        });
    }, [uploadMutation, uploadFolder]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
        },
        multiple: true,
    });

    const handleCopyUrl = async (image: GalleryImage) => {
        try {
            await navigator.clipboard.writeText(image.url);
            setCopiedId(image.id);
            toast.success('URL copied to clipboard!');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            toast.error('Failed to copy URL');
        }
    };

    const handleDelete = (image: GalleryImage) => {
        setImageToDelete(image);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (imageToDelete) {
            deleteMutation.mutate(imageToDelete, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setImageToDelete(null);
                },
            });
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'Unknown';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gallery</h2>
                    <p className="text-muted-foreground">
                        Upload and manage images. Copy URLs to use anywhere.
                    </p>
                </div>
            </div>

            {/* Upload Zone */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Upload Images</CardTitle>
                        <Select value={uploadFolder} onValueChange={setUploadFolder}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FOLDERS.filter(f => f.value !== 'all').map((folder) => (
                                    <SelectItem key={folder.value} value={folder.value}>
                                        {folder.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                            isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                            uploadMutation.isPending && "pointer-events-none opacity-50"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2">
                            {uploadMutation.isPending ? (
                                <>
                                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    <p className="text-muted-foreground">Uploading...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 text-muted-foreground" />
                                    <p className="text-muted-foreground">
                                        {isDragActive
                                            ? "Drop images here..."
                                            : "Drag & drop images here, or click to select"}
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">
                                        PNG, JPG, GIF, WebP, SVG up to 10MB
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FOLDERS.map((folder) => (
                            <SelectItem key={folder.value} value={folder.value}>
                                {folder.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                    {images?.length || 0} images
                </span>
            </div>

            {/* Gallery Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                </div>
            ) : images && images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {images.map((image) => (
                        <Card
                            key={image.id}
                            className="group overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                        >
                            <div
                                className="aspect-square relative cursor-pointer"
                                onClick={() => setPreviewImage(image)}
                            >
                                <img
                                    src={image.url}
                                    alt={image.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyUrl(image);
                                        }}
                                    >
                                        {copiedId === image.id ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(image);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-2">
                                <p className="text-xs font-medium truncate" title={image.name}>
                                    {image.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(image.file_size)}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No images yet</h3>
                    <p className="text-muted-foreground">
                        Upload your first image to get started
                    </p>
                </Card>
            )}

            {/* Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{previewImage?.name}</DialogTitle>
                        <DialogDescription>
                            {formatFileSize(previewImage?.file_size || null)} • {previewImage?.file_type}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center bg-muted/50 rounded-lg p-4 max-h-[60vh] overflow-auto">
                        <img
                            src={previewImage?.url}
                            alt={previewImage?.name}
                            className="max-w-full max-h-[55vh] object-contain"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            value={previewImage?.url || ''}
                            readOnly
                            className="flex-1 font-mono text-xs"
                        />
                        <Button
                            variant="outline"
                            onClick={() => previewImage && handleCopyUrl(previewImage)}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Image</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{imageToDelete?.name}"?
                            This will permanently remove the image from storage and database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
