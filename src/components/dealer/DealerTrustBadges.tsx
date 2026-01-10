import { Award, Clock, Shield, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DealerFullProfile } from '@/hooks/useDealerFullProfile';

interface DealerTrustBadgesProps {
  dealer: DealerFullProfile;
}

export function DealerTrustBadges({ dealer }: DealerTrustBadgesProps) {
  const badges = [
    {
      icon: Star,
      label: 'Google Rating',
      value: dealer.google_rating ? `${dealer.google_rating}/5` : 'N/A',
      subtitle: dealer.google_review_count ? `${dealer.google_review_count} reviews` : '',
      show: dealer.show_google_rating !== false,
    },
    {
      icon: Clock,
      label: 'Response Time',
      value: dealer.avg_response_time || '< 2 hours',
      subtitle: 'Average',
      show: true,
    },
    {
      icon: TrendingUp,
      label: 'Satisfaction Rate',
      value: dealer.customer_satisfaction_score ? `${dealer.customer_satisfaction_score}%` : '95%',
      subtitle: 'Customer satisfaction',
      show: true,
    },
    {
      icon: Shield,
      label: 'Verified Dealer',
      value: 'Certified',
      subtitle: 'By PickMyCar',
      show: dealer.is_active,
    },
  ];

  const gradients = [
    'from-[#236ceb] to-[#1a56c4]',
    'from-[#236ceb] to-[#1e5fc9]',
    'from-[#2975ed] to-[#236ceb]',
    'from-[#1a56c4] to-[#236ceb]',
  ];

  return (
    <div className="space-y-3">
      {/* Modern Colored Trust Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {badges
          .filter((badge) => badge.show)
          .map((badge, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${gradients[index]} p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow`}
            >
              <badge.icon className="w-8 h-8 text-white mb-2" />
              <div className="text-2xl font-bold text-white">{badge.value}</div>
              <div className="text-sm text-white/90">{badge.label}</div>
              {badge.subtitle && (
                <div className="text-xs text-white/75 mt-1">{badge.subtitle}</div>
              )}
            </div>
          ))}
      </div>

      {/* Awards - Compact Chips */}
      {dealer.show_awards !== false && dealer.awards && dealer.awards.length > 0 && (
        <div className="bg-card rounded-lg border p-3 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-semibold">Awards:</span>
            {dealer.awards.slice(0, 4).map((award, index) => (
              <div
                key={index}
                className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                {award}
              </div>
            ))}
            {dealer.awards.length > 4 && (
              <span className="text-xs text-muted-foreground">+{dealer.awards.length - 4} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
