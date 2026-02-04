// Define interface locally to avoid circular dependency
export interface AISuggestion {
    id: string;
    target_id: string;
    suggestion_type: string;
    title: string;
    description: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
    expected_impact: string;
    action_label: string;
    action_url: string;
    status: 'pending' | 'acted' | 'dismissed';
    created_at: string;
    acted_at?: string;
    dismissed_at?: string;
    outcome_success?: boolean;
    outcome_notes?: string;
}

export const MOCK_SUGGESTIONS: AISuggestion[] = [
    {
        id: '1',
        target_id: 'user_1',
        suggestion_type: 'pricing_optimization',
        title: 'Optimize Pricing for Maruti Swift',
        description: 'Your 2018 Maruti Swift is priced 10% higher than similar listings in your area.',
        reasoning: 'Market analysis shows high demand but price sensitivity for this model.',
        priority: 'high',
        expected_impact: 'Potential 2x increase in leads',
        action_label: 'Adjust Price',
        action_url: '/dashboard/inventory',
        status: 'pending',
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        target_id: 'user_1',
        suggestion_type: 'inventory_gap',
        title: 'High Demand: Compact SUVs',
        description: 'There is a surge in searches for Compact SUVs (Tata Nexon, Brezza) in Chennai.',
        reasoning: 'Supply is low (only 5 active listings) while demand has increased by 40%.',
        priority: 'medium',
        expected_impact: 'Fast turnover expected (< 7 days)',
        action_label: 'View Demand Gaps',
        action_url: '/dashboard/demand-gaps',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
        id: '3',
        target_id: 'user_1',
        suggestion_type: 'listing_quality',
        title: 'Improve Photo Quality',
        description: '3 of your listings have low-resolution images.',
        reasoning: 'Listings with HD photos get 3.5x more engagement.',
        priority: 'medium',
        expected_impact: 'Better click-through rate',
        action_label: 'Review Listings',
        action_url: '/dashboard/inventory',
        status: 'pending',
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    }
];

export const MockAISuggestionService = {
    getSuggestions: async (): Promise<{ suggestions: AISuggestion[], stats: any }> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        return {
            suggestions: MOCK_SUGGESTIONS,
            stats: {
                pending: 3,
                acted: 12,
                dismissed: 2,
                successRate: 85
            }
        };
    }
};
