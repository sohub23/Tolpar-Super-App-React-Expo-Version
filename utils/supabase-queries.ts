import { supabase } from '@/lib/supabase';
import type { GreetingConfig, ManualGreeting, Festival, IslamicDate } from '@/types/greetings';

/**
 * Fetch greeting configuration from Supabase
 * Controls which automatic greetings are enabled
 */
export async function fetchGreetingConfig(): Promise<GreetingConfig | null> {
  try {
    const { data, error } = await supabase
      .from('greeting_config')
      .select('*')
      .single();

    if (error) {
      console.error('[DB] Error fetching greeting config:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[DB] Exception fetching greeting config:', error);
    return null;
  }
}

/**
 * Fetch active manual greeting for today
 * Check if there's a backend override active right now
 */
export async function fetchActiveManualGreeting(
  timezone: string | null = null
): Promise<ManualGreeting | null> {
  try {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('manual_greetings')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('priority', { ascending: false });

    // Filter by timezone if provided and not empty
    if (timezone && timezone.length > 0) {
      query = query.or(`timezone_filter.is.null,timezone_filter.eq.${timezone}`);
    }

    const { data, error } = await query.limit(1).single();

    if (error?.code === 'PGRST116') {
      // No rows returned - this is expected
      return null;
    }

    if (error) {
      console.error('[DB] Error fetching manual greeting:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[DB] Exception fetching manual greeting:', error);
    return null;
  }
}

/**
 * Fetch all enabled festivals
 * Use for checking if today is a special occasion
 */
export async function fetchFestivalCalendar(): Promise<Festival[]> {
  try {
    const { data, error } = await supabase
      .from('festival_calendar')
      .select('*')
      .eq('is_enabled', true)
      .order('month', { ascending: true })
      .order('day', { ascending: true });

    if (error) {
      console.error('[DB] Error fetching festivals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[DB] Exception fetching festivals:', error);
    return [];
  }
}

/**
 * Fetch Islamic dates for the current year
 * Check for Eid, Ramadan, etc.
 */
export async function fetchIslamicDates(): Promise<IslamicDate[]> {
  try {
    const currentYear = new Date().getFullYear();

    const { data, error } = await supabase
      .from('islamic_dates')
      .select('*')
      .eq('is_enabled', true)
      .gte('gregorian_date', `${currentYear}-01-01`)
      .lte('gregorian_date', `${currentYear}-12-31`)
      .order('gregorian_date', { ascending: true });

    if (error) {
      console.error('[DB] Error fetching Islamic dates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[DB] Exception fetching Islamic dates:', error);
    return [];
  }
}

/**
 * Check if today matches any festival or Islamic date
 */
export async function getTodaysFestival(): Promise<Festival | IslamicDate | null> {
  try {
    const today = new Date();
    const month = today.getMonth() + 1; // getMonth is 0-indexed
    const day = today.getDate();
    const dateStr = today.toISOString().split('T')[0];

    // Check static festivals first
    const { data: festival } = await supabase
      .from('festival_calendar')
      .select('*')
      .eq('is_enabled', true)
      .eq('month', month)
      .eq('day', day)
      .single();

    if (festival) {
      return festival;
    }

    // Check Islamic dates
    const { data: islamic } = await supabase
      .from('islamic_dates')
      .select('*')
      .eq('is_enabled', true)
      .eq('gregorian_date', dateStr)
      .single();

    if (islamic) {
      return islamic;
    }

    return null;
  } catch (error) {
    console.error('[DB] Exception checking today festival:', error);
    return null;
  }
}

/**
 * Subscribe to real-time updates on greeting tables
 * Updates UI when backend changes greeting settings or adds manual greetings
 */
export function subscribeToGreetingUpdates(
  callback: (payload: any) => void
): ReturnType<typeof supabase.channel> {
  const channel = supabase.channel('greeting_updates', {
    config: {
      broadcast: { self: true },
    },
  });

  // Listen to greeting_config changes
  channel
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'greeting_config' },
      (payload) => {
        console.log('[DB] greeting_config updated:', payload);
        callback({ type: 'greeting_config', payload });
      }
    )
    // Listen to manual_greetings changes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'manual_greetings' },
      (payload) => {
        console.log('[DB] manual_greetings updated:', payload);
        callback({ type: 'manual_greetings', payload });
      }
    )
    // Listen to festival_calendar changes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'festival_calendar' },
      (payload) => {
        console.log('[DB] festival_calendar updated:', payload);
        callback({ type: 'festival_calendar', payload });
      }
    )
    // Listen to islamic_dates changes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'islamic_dates' },
      (payload) => {
        console.log('[DB] islamic_dates updated:', payload);
        callback({ type: 'islamic_dates', payload });
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from real-time updates
 */
export async function unsubscribeFromGreetingUpdates(
  channel: ReturnType<typeof supabase.channel>
) {
  await supabase.removeChannel(channel);
}
