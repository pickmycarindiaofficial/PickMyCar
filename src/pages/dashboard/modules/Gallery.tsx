import { GalleryManager } from '@/components/powerdesk/GalleryManager';

export default function Gallery() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
                <p className="text-muted-foreground">
                    Upload and manage images for use across the platform.
                </p>
            </div>

            <GalleryManager />
        </div>
    );
}
