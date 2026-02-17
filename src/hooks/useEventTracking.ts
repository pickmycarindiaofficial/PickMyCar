import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { generateUUID } from '@/lib/utils';

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
      const sessionId = localStorage.getItem('session_id') || generateUUID();
      if (!localStorage.getItem('session_id')) {
        localStorage.setItem('session_id', sessionId);
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
      const sessionId = localStorage.getItem('session_id') || generateUUID();
      if (!localStorage.getItem('session_id')) {
        localStorage.setItem('session_id', sessionId);
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
