import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useEventTracking } from '@/hooks/useEventTracking';

export function DealerContactLock() {
  const navigate = useNavigate();
  const { trackFunnel } = useEventTracking();

  const handleLoginClick = () => {
    // Track 'intent' stage when user clicks login to contact dealer
    trackFunnel.mutate({ 
      stage: 'intent',
      meta: { 
        action: 'login_to_contact_dealer',
        blocked_by: 'authentication',
      }
    });
    navigate('/auth?returnTo=' + window.location.pathname);
  };

  return (
    <Card className="p-6 bg-muted/50 border-2 border-dashed">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="rounded-full bg-primary/10 p-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Login to View Dealer Contact</h3>
          <p className="text-sm text-muted-foreground">
            Sign in to access dealer information and contact details
          </p>
        </div>
        <Button 
          onClick={handleLoginClick}
          size="lg"
          className="w-full"
        >
          Login to Continue
        </Button>
      </div>
    </Card>
  );
}
