import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormModal } from '@/components/common/FormModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, Banner } from '@/hooks/useBanners'; // Assuming useBanners hook is created as planned
import { toast } from 'sonner';

import { GalleryManager } from './GalleryManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function BannerManager() {
    const { data: banners = [], isLoading } = useBanners();
    const createBanner = useCreateBanner();
    const updateBanner = useUpdateBanner();
    const deleteBanner = useDeleteBanner();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        link_url: '',
        is_active: true,
        display_order: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
    });

    const handleSubmit = () => {
        // Basic validation
        if (!formData.title || !formData.image_url) {
            toast.error('Title and Image URL are required');
            return;
        }

        const payload = {
            ...formData,
            display_order: formData.display_order || (banners.length + 1), // Auto-increment order if not set
            end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined, // Handle optional end date clearly
            start_date: new Date(formData.start_date).toISOString(), // Ensure ISO format
        };

        if (editingBanner) {
            updateBanner.mutate({ id: editingBanner.id, ...payload }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    resetForm();
                }
            });
        } else {
            createBanner.mutate(payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    resetForm();
                }
            });
        }
    };

    const resetForm = () => {
        setEditingBanner(null);
        setFormData({
            title: '',
            image_url: '',
            link_url: '',
            is_active: true,
            display_order: 0,
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
        });
    };

    const handleEdit = (banner: Banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            image_url: banner.image_url,
            link_url: banner.link_url || '',
            is_active: banner.is_active,
            display_order: banner.display_order,
            start_date: banner.start_date.split('T')[0], // Extract YYYY-MM-DD
            end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    if (isLoading) return <Skeleton className="h-96 w-full" />;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Banner Management</CardTitle>
                        <CardDescription>Manage homepage carousel banners</CardDescription>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Banner
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {banners.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                            No banners found. Add one to get started.
                        </div>
                    ) : (
                        banners.map((banner) => (
                            <div
                                key={banner.id}
                                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                                <div className="cursor-grab text-muted-foreground hover:text-foreground">
                                    <GripVertical className="h-5 w-5" />
                                </div>

                                <div className="h-16 w-32 relative rounded-md overflow-hidden bg-muted flex-shrink-0 border">
                                    <img
                                        src={banner.image_url}
                                        alt={banner.title}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image';
                                        }}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold truncate">{banner.title}</h4>
                                        <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                                            {banner.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex gap-4">
                                        <span>Order: {banner.display_order}</span>
                                        {banner.link_url && (
                                            <span className="truncate max-w-[200px]" title={banner.link_url}>
                                                Link: {banner.link_url}
                                            </span>
                                        )}
                                        <span>
                                            {new Date(banner.start_date).toLocaleDateString()}
                                            {banner.end_date ? ` - ${new Date(banner.end_date).toLocaleDateString()}` : ' - Forever'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this banner?')) {
                                                deleteBanner.mutate(banner.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            <FormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
                onSubmit={handleSubmit}
                isLoading={createBanner.isPending || updateBanner.isPending}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Banner Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Summer Sale"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image_url">Image URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="image_url"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="https://..."
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setIsGalleryOpen(true)}
                                title="Select from Gallery"
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                        </div>
                        {formData.image_url && (
                            <div className="mt-2 relative h-32 rounded-md overflow-hidden border bg-muted">
                                <img
                                    src={formData.image_url}
                                    alt="Preview"
                                    className="h-full w-full object-contain"
                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                />
                            </div>
                        )}
                    </div>

                    {/* Gallery Selection Modal */}
                    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                        <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Select Image from Gallery</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto p-1">
                                <GalleryManager
                                    onSelect={(url) => {
                                        setFormData(prev => ({ ...prev, image_url: url }));
                                        setIsGalleryOpen(false);
                                    }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="space-y-2">
                        <Label htmlFor="link_url">Link URL (Optional)</Label>
                        <Input
                            id="link_url"
                            value={formData.link_url}
                            onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                            placeholder="/cars?segment=premium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date (Optional)</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="display_order">Display Order</Label>
                            <Input
                                id="display_order"
                                type="number"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                    </div>
                </div>
            </FormModal>
        </Card>
    );
}
