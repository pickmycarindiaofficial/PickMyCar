import { Button } from '@/components/ui/button';
import { MessageCircle, Send } from 'lucide-react';
import { shareToWhatsApp, shareToTelegram, LeadData } from '@/lib/shareHelpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ShareButtonsProps {
  lead: LeadData;
  platformName?: string;
  platformUrl?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
}

export function ShareButtons({ 
  lead, 
  platformName = 'PickMyCar', 
  platformUrl = 'https://pickmycar.in',
  size = 'sm',
  variant = 'outline'
}: ShareButtonsProps) {
  return (
    <div className="flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={size}
              variant={variant}
              onClick={(e) => {
                e.stopPropagation();
                shareToWhatsApp(lead, platformName);
              }}
              className="text-green-600 hover:text-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              {size !== 'icon' && <span className="ml-1">WhatsApp</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share via WhatsApp</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={size}
              variant={variant}
              onClick={(e) => {
                e.stopPropagation();
                shareToTelegram(lead, platformName, platformUrl);
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <Send className="h-4 w-4" />
              {size !== 'icon' && <span className="ml-1">Telegram</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share via Telegram</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
