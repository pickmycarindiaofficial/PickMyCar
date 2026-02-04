import { useState } from 'react';
import { toast } from 'sonner';
import { Car } from '@/types';

interface ShareOptions {
  car: Car;
  source: 'card' | 'detail' | 'dealer';
}

export function useCarShare() {
  const [isSharing, setIsSharing] = useState(false);

  const formatPrice = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    return `₹${(value / 100000).toFixed(2)} Lakh`;
  };

  const generateShareUrl = (carId: string, source: string) => {
    const baseUrl = window.location.origin;
    // Use PHP script for rich social previews (og:image)
    return `${baseUrl}/share.php?id=${carId}&utm_source=${source}&utm_medium=share`;
  };

  const generateShareText = (car: Car) => {
    return `🚗 ${car.title} – ${formatPrice(car.price)}

${car.year} • ${car.transmission} • ${car.fuelType} • ${car.kmsDriven.toLocaleString()} km
📍 ${car.location}

👉 View Full Details:`;
  };

  const shareViaNative = async ({ car, source }: ShareOptions) => {
    if (!navigator.share) {
      return false;
    }

    try {
      setIsSharing(true);
      const shareUrl = generateShareUrl(car.id, source);
      const shareText = generateShareText(car);

      await navigator.share({
        title: `${car.title} – ${formatPrice(car.price)}`,
        text: shareText,
        url: shareUrl,
      });

      toast.success('Shared successfully!');
      return true;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error('Failed to share');
      }
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  const shareViaWhatsApp = ({ car, source }: ShareOptions) => {
    const shareUrl = generateShareUrl(car.id, 'whatsapp');
    const shareText = generateShareText(car);
    const message = `${shareText}\n${shareUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const shareViaTelegram = ({ car, source }: ShareOptions) => {
    const shareUrl = generateShareUrl(car.id, 'telegram');
    const shareText = generateShareText(car);

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
    toast.success('Opening Telegram...');
  };

  const copyToClipboard = async ({ car, source }: ShareOptions) => {
    try {
      const shareUrl = generateShareUrl(car.id, 'copy');
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return {
    isSharing,
    shareViaNative,
    shareViaWhatsApp,
    shareViaTelegram,
    copyToClipboard,
  };
}
