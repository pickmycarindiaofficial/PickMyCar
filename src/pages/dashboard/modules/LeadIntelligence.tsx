import { useState } from 'react';
import { useRealTimeLeads } from '@/hooks/useRealTimeLeads';
import { useLeadIntelligence } from '@/hooks/useLeadIntelligence';
import { useMarketSignals } from '@/hooks/useMarketSignals';
import { useUserActivityTimeline } from '@/hooks/useUserActivityTimeline';
import { useDealerBehaviorMetrics } from '@/hooks/useDealerBehaviorMetrics';
import { LeadManagementFilters } from '@/components/leads/LeadManagementFilters';
import { LeadManagementKPIs } from '@/components/leads/LeadManagementKPIs';
import { ActiveLeadsFeed } from '@/components/leads/ActiveLeadsFeed';
import { MarketPulseChart } from '@/components/leads/MarketPulseChart';
import { AreaTrendsChart } from '@/components/leads/AreaTrendsChart';
import { UserActivityTimelineCard } from '@/components/leads/UserActivityTimelineCard';
import { DealerBehaviorPanel } from '@/components/leads/DealerBehaviorPanel';
import { DealerLeaderboardTable } from '@/components/leads/DealerLeaderboardTable';
import { UserBehaviorDrawer } from '@/components/leads/UserBehaviorDrawer';
import { Loader2 } from 'lucide-react';

export default function LeadIntelligence() {
  const [filters, setFilters] = useState<any>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { leads, isLoading: leadsLoading } = useRealTimeLeads(filters);
  const { data: intelligenceData, isLoading: intelligenceLoading } = useLeadIntelligence();
  const { data: marketSignalsData } = useMarketSignals();
  const { data: dealerMetricsData } = useDealerBehaviorMetrics();

  // Get first active lead for timeline demo
  const firstActiveLead = leads.find(l => l.is_active_now) || leads[0];
  const { data: timelineData } = useUserActivityTimeline(firstActiveLead?.user_id);

  const isLoading = leadsLoading || intelligenceLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate KPI metrics
  const hotLeadsCount = leads.filter(l => l.intent_level === 'hot' || l.is_active_now).length;
  const avgCompetition = leads.length > 0
    ? leads.reduce((sum, l) => sum + l.competing_dealers_count, 0) / leads.length
    : 0;
  
  // Get dealer metrics - handle both single dealer and array
  const dealerMetrics = Array.isArray(dealerMetricsData) ? dealerMetricsData[0] : dealerMetricsData;
  const avgReactionTime = dealerMetrics?.avg_response_time_minutes || 45;
  const followUpDiscipline = dealerMetrics?.response_rate || 75;

  // Transform market signals for charts
  const trendingBrands = marketSignalsData?.trendingBrands || [];
  const marketPulseData = trendingBrands.map(signal => ({
    brand: signal.entity_name,
    demand: signal.metric_value,
    change: signal.change_percentage || 0
  }));

  // Transform area trends (mock data - enhance with real city data)
  const areaTrendsData = [
    { city: 'Mumbai', hatchbacks: 45, sedans: 30, suvs: 25 },
    { city: 'Delhi', hatchbacks: 40, sedans: 35, suvs: 30 },
    { city: 'Bangalore', hatchbacks: 35, sedans: 25, suvs: 40 },
    { city: 'Chennai', hatchbacks: 50, sedans: 30, suvs: 20 }
  ];

  // Transform dealer metrics for leaderboard
  const leaderboard = Array.isArray(dealerMetricsData) ? dealerMetricsData : [];
  const dealerLeaderboardData = leaderboard.slice(0, 10).map(dealer => ({
    dealer_name: dealer.dealer_name || 'Dealer',
    avg_response_time_minutes: dealer.avg_response_time_minutes || 0,
    hot_lead_win_rate: dealer.conversion_rate || 0
  }));

  const handleLeadClick = (userId: string) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Lead Intelligence</h1>
        <p className="text-muted-foreground">Real-time lead management with AI-powered insights</p>
      </div>

      {/* Filters */}
      <LeadManagementFilters onFilterChange={setFilters} />

      {/* KPIs */}
      <LeadManagementKPIs
        avgReactionTimeMinutes={avgReactionTime}
        hotLeadsCount={hotLeadsCount}
        competitionRisk={avgCompetition}
        leadsInView={leads.length}
      />

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Leads Feed */}
        <ActiveLeadsFeed leads={leads} onLeadClick={handleLeadClick} />

        {/* Middle Column: Market Signals & User Activity */}
        <div className="space-y-6">
          <MarketPulseChart data={marketPulseData} timeRange="Last 24h" />
          <AreaTrendsChart data={areaTrendsData} />
          {firstActiveLead && timelineData && (
            <UserActivityTimelineCard
              userName={firstActiveLead.user_name}
              carInterest={firstActiveLead.car_name}
              hotnessScore={firstActiveLead.intent_score}
              activities={timelineData.activities}
              learnedPreferences={timelineData.preferences}
            />
          )}
        </div>

        {/* Right Column: Dealer Intelligence */}
        <div className="space-y-6">
          <DealerBehaviorPanel
            avgReactionTimeMinutes={avgReactionTime}
            followUpDiscipline={followUpDiscipline}
          />
          <DealerLeaderboardTable dealers={dealerLeaderboardData} />
        </div>
      </div>

      {/* User Behavior Drawer */}
      <UserBehaviorDrawer
        userId={selectedUserId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
}
