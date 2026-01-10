import { Loader2 } from "lucide-react";

/**
 * PageLoader - Full-screen loading component for lazy-loaded pages
 * Shows a centered spinner with optional loading message
 */
export const PageLoader = ({ message = "Loading..." }: { message?: string }) => {
    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-background"
            role="status"
            aria-live="polite"
        >
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground text-sm">{message}</p>
        </div>
    );
};

/**
 * InlineLoader - Smaller loader for sections within a page
 */
export const InlineLoader = () => {
    return (
        <div
            className="flex items-center justify-center py-8"
            role="status"
            aria-live="polite"
        >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
};

export default PageLoader;
