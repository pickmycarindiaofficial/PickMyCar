import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone } from 'lucide-react';

export function DealerProfileSection() {
  const { profile } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="px-4 py-6 border-b" style={{ borderColor: 'hsl(var(--dealer-border-light))' }}>
      <div className="flex flex-col items-center space-y-3">
        {/* Avatar */}
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback 
            className="text-lg font-bold text-white"
            style={{ 
              backgroundColor: 'hsl(var(--dealer-accent-primary))',
            }}
          >
            {profile?.full_name ? getInitials(profile.full_name) : 'D'}
          </AvatarFallback>
        </Avatar>

        {/* Dealer Info */}
        <div className="text-center space-y-1">
          <h3 className="font-semibold text-base" style={{ color: 'hsl(var(--dealer-text-primary))' }}>
            {profile?.full_name || 'Dealer Name'}
          </h3>
          <p className="text-xs" style={{ color: 'hsl(var(--dealer-text-muted))' }}>
            @{profile?.username || 'dealer'}
          </p>
        </div>
      </div>
    </div>
  );
}
