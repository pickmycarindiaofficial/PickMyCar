import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateUUID, safeLocalStorage } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

type FunnelStage = 'view' | 'interest' | 'engage' | 'intent' | 'convert';

interface TrackEventParams {
  event: 'view' | 'click' | 'scroll' | 'favorite' | 'compare' | 'contact_click' | 'test_drive_request' | 'loan_attempt' | 'wishlist_add' | 'wishlist_remove' | 'search' | 'filter_change' | 'exit_intent' | 'unmet_demand_submit';
  car_id?: string;
  dealer_id?: string;
  meta?: Record<string, any>;
}

interface TrackFunnelParams {
  stage: FunnelStage;
  car_id?: string;
  dealer_id?: string;
  meta?: Record<string, any>;
}

export function useEventTracking() {
  const { user } = useAuth();

  const trackEvent = useMutation({
    mutationFn: async ({ event, car_id, dealer_id, meta = {} }: TrackEventParams) => {
      // Always track, even for anonymous users
      const sessionId = safeLocalStorage.getItem('session_id') || generateUUID();
      if (!safeLocalStorage.getItem('session_id')) {
        safeLocalStorage.setItem('session_id', sessionId);
      }

      const eventData = {
        user_id: user?.id || null,
        session_id: sessionId,
        event,
        car_id: car_id || null,
        meta: {
          ...meta,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
          url: window.location.href,
          device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browser: navigator.userAgent.split(' ').pop() || 'unknown',
          referrer: document.referrer,
          time_of_day: new Date().getHours(),
          day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        },
      };

      // @ts-ignore - user_events table not in generated types yet
      const { error } = await (supabase as any)
        .from('user_events')
        .insert(eventData);

      if (error) throw error;

      // ═══ Forward to Meta Pixel + Google Ads ═══
      // This bridges internal tracking to ad platforms automatically
      switch (event) {
        case 'view':
          analytics.viewContent({
            id: car_id || '',
            name: meta.car_name || '',
            category: meta.category || 'Used Car',
            value: meta.price || 0,
            brand: meta.brand,
            model: meta.model,
            year: meta.year,
          });
          break;
        case 'contact_click':
          analytics.lead({
            id: car_id,
            type: 'contact_click',
            carName: meta.car_name,
            value: meta.price,
          });
          break;
        case 'test_drive_request':
          analytics.scheduleTestDrive({
            id: car_id,
            carName: meta.car_name,
            dealerId: dealer_id,
          });
          break;
        case 'loan_attempt':
          analytics.initiateCheckout({
            id: car_id,
            carName: meta.car_name,
            value: meta.price,
          });
          break;
        case 'favorite':
        case 'wishlist_add':
          analytics.addToWishlist({
            id: car_id || '',
            name: meta.car_name || '',
            value: meta.price,
            category: meta.category,
          });
          break;
        case 'search':
          analytics.search({
            query: meta.query,
            filters: meta.filters,
            resultsCount: meta.results_count,
          });
          break;
      }

      // Update user profile intent score for logged-in users
      if (user?.id && ['test_drive_request', 'loan_attempt', 'contact_click'].includes(event)) {
        // @ts-ignore - user_profile table and RPC not in generated types yet
        await (supabase as any).rpc('increment_intent_score', {
          p_user_id: user.id,
          p_event: event
        });
      }

      return eventData;
    },
  });

  const trackFunnel = useMutation({
    mutationFn: async ({ stage, car_id, dealer_id, meta = {} }: TrackFunnelParams) => {
      const sessionId = safeLocalStorage.getItem('session_id') || generateUUID();
      if (!safeLocalStorage.getItem('session_id')) {
        safeLocalStorage.setItem('session_id', sessionId);
      }

      const funnelData = {
        session_id: sessionId,
        user_id: user?.id || null,
        car_listing_id: car_id || null,
        dealer_id: dealer_id || null,
        stage,
        metadata: {
          ...meta,
          device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browser: navigator.userAgent.split(' ').pop() || 'unknown',
          referrer: document.referrer,
          time_of_day: new Date().getHours(),
          day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          page_url: window.location.href,
        },
      };

      // @ts-ignore - conversion_funnel table not in generated types
      const { error } = await (supabase as any)
        .from('conversion_funnel')
        .insert(funnelData);

      if (error) throw error;

      return funnelData;
    },
  });

  return { trackEvent, trackFunnel };
}
