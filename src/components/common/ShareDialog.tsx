import { Car } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Copy, Share2, Facebook } from 'lucide-react';
import { useCarShare } from '@/hooks/useCarShare';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShareDialogProps {
  car: Car | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: 'card' | 'detail' | 'dealer';
}

export function ShareDialog({ car, open, onOpenChange, source = 'card' }: ShareDialogProps) {
  const { shareViaNative, shareViaWhatsApp, shareViaTelegram, copyToClipboard } = useCarShare();
  const [copied, setCopied] = useState(false);

  if (!car) return null;

  const formatPrice = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    return `₹${(value / 100000).toFixed(2)} Lakh`;
  };

  const shareUrl = `${window.location.origin}/cars/${car.id}`;

  const handleNativeShare = async () => {
    const shared = await shareViaNative({ car, source });
    if (shared) {
      onOpenChange(false);
    }
  };

  const handleWhatsApp = () => {
    shareViaWhatsApp({ car, source });
    onOpenChange(false);
  };

  const handleTelegram = () => {
    shareViaTelegram({ car, source });
    onOpenChange(false);
  };

  const handleFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    onOpenChange(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this car</DialogTitle>
          <DialogDescription>
            Share {car.title} with friends and family
          </DialogDescription>
        </DialogHeader>

        {/* Car Preview with Large Thumbnail */}
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="flex gap-3 p-3">
            <img
              src={car.imageUrl}
              alt={car.title}
              className="w-24 h-24 object-cover rounded-md flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-2 mb-1">{car.title}</h4>
              <p className="text-xl font-bold text-primary mb-1">{formatPrice(car.price)}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{car.year}</span>
                <span>•</span>
                <span>{car.kmsDriven.toLocaleString()} km</span>
                <span>•</span>
                <span>{car.fuelType}</span>
                <span>•</span>
                <span>{car.transmission}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">📍 {car.location}</p>
            </div>
          </div>

          {/* URL Display with Copy */}
          <div className="border-t bg-secondary/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 text-xs bg-transparent border-0 outline-none text-muted-foreground"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2"
              >
                {copied ? (
                  <span className="text-xs text-green-600">Copied!</span>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Share via</p>
          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp */}
            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-auto py-3 px-4"
              onClick={handleWhatsApp}
            >
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium">WhatsApp</span>
            </Button>

            {/* Telegram */}
            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-auto py-3 px-4"
              onClick={handleTelegram}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Send className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium">Telegram</span>
            </Button>

            {/* Facebook */}
            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-auto py-3 px-4"
              onClick={handleFacebook}
            >
              <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                <Facebook className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-sm font-medium">Facebook</span>
            </Button>

            {/* Native Share (Mobile) */}
            {navigator.share && (
              <Button
                variant="outline"
                className="flex items-center justify-start gap-3 h-auto py-3 px-4"
                onClick={handleNativeShare}
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Share2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium">More...</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
