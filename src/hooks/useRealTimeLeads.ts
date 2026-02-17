import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useEffect, useState } from 'react';

export interface RealTimeLead {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  car_listing_id: string;
  car_name: string;
  car_price: number;
  car_year: number;
  intent_score: number;
  intent_level: 'hot' | 'warm' | 'cold';
  buying_timeline: string;
  channel: string;
  is_active_now: boolean;
  competing_dealers_count: number;
  created_at: string;
  enrichment_data?: any;
}

export function useRealTimeLeads(filters?: {
  dateRange?: [Date, Date];
  city?: string;
  brand?: string;
  model?: string;
  channel?: string;
  search?: string;
}) {
  const [realtimeLeads, setRealtimeLeads] = useState<RealTimeLead[]>([]);

  const query = useQuery({
    queryKey: ['realtime-leads', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('car_enquiries')
        .select(`
          id,
          user_id,
          car_listing_id,
          enquiry_source,
          created_at,
          guest_name,
          guest_phone,
          profiles:user_id(full_name, phone_number),
          car_listings:car_listing_id(
            id,
            expected_price,
            year_of_make,
            brand:brand_id(name),
            model:model_id(name),
            city:city_id(name)
          ),
          lead_enrichment(
            ai_score,
            intent_level,
            buying_timeline,
            conversion_probability,
            behavioral_signals
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply date filter (default last 7 days)
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 7);
      const startDate = filters?.dateRange?.[0] || defaultStart;
      const endDate = filters?.dateRange?.[1] || new Date();

      query = query
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: enquiries, error } = await query;

      if (error) throw error;

      // Get competing dealers count for each lead
      const leadIds = (enquiries || []).map(e => e.id);
      const { data: competitionData } = await (supabase as any)
        .from('car_enquiries')
        .select('user_id, dealer_id')
        .in('user_id', (enquiries || []).map(e => e.user_id).filter(Boolean));

      const competitionMap = new Map<string, number>();
      (competitionData || []).forEach((item: any) => {
        const count = competitionMap.get(item.user_id) || 0;
        competitionMap.set(item.user_id, count + 1);
      });

      // Check for active users (activity in last 30 minutes in either table)
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const [interactionsResult, eventsResult] = await Promise.all([
        (supabase as any)
          .from('user_interactions')
          .select('user_id')
          .gte('created_at', thirtyMinsAgo)
          .in('user_id', (enquiries || []).map(e => e.user_id).filter(Boolean)),
        (supabase as any)
          .from('user_events')
          .select('user_id')
          .gte('at', thirtyMinsAgo)
          .in('user_id', (enquiries || []).map(e => e.user_id).filter(Boolean))
      ]);

      const activeUserIds = new Set([
        ...(interactionsResult.data || []).map((u: any) => u.user_id),
        ...(eventsResult.data || []).map((u: any) => u.user_id)
      ]);

      const leads: RealTimeLead[] = (enquiries || []).map((e: any) => {
        const enrichment = Array.isArray(e.lead_enrichment) ? e.lead_enrichment[0] : e.lead_enrichment;
        const carName = e.car_listings
          ? `${e.car_listings.brand?.name} ${e.car_listings.model?.name}`
          : 'Unknown Car';

        return {
          id: e.id,
          user_id: e.user_id,
          user_name: e.profiles?.full_name || e.guest_name || 'Guest User',
          user_phone: e.profiles?.phone_number || e.guest_phone || '',
          car_listing_id: e.car_listing_id,
          car_name: carName,
          car_price: e.car_listings?.expected_price || 0,
          car_year: e.car_listings?.year_of_make || 0,
          intent_score: enrichment?.ai_score || 50,
          intent_level: enrichment?.intent_level || 'warm',
          buying_timeline: enrichment?.buying_timeline || 'exploring',
          channel: e.enquiry_source || 'website',
          is_active_now: activeUserIds.has(e.user_id),
          competing_dealers_count: competitionMap.get(e.user_id) || 1,
          created_at: e.created_at,
          enrichment_data: enrichment
        };
      });

      // Apply client-side filters
      let filteredLeads = leads;

      if (filters?.city) {
        filteredLeads = filteredLeads.filter(l =>
          (enquiries || []).find((e: any) =>
            e.id === l.id && e.car_listings?.city?.name === filters.city
          )
        );
      }

      if (filters?.brand) {
        filteredLeads = filteredLeads.filter(l =>
          l.car_name.toLowerCase().includes(filters.brand!.toLowerCase())
        );
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredLeads = filteredLeads.filter(l =>
          l.user_name.toLowerCase().includes(searchLower) ||
          l.user_phone.includes(searchLower) ||
          l.car_name.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.channel && filters.channel !== 'all') {
        filteredLeads = filteredLeads.filter(l => l.channel === filters.channel);
      }

      return filteredLeads;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('realtime-leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'car_enquiries'
        },
        () => {
          // Refetch when new enquiry is added
          query.refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lead_enrichment'
        },
        () => {
          // Refetch when lead enrichment is updated
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    leads: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}
