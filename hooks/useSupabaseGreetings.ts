import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { CurrentGreeting, GreetingConfig, ManualGreeting, Festival, IslamicDate } from '@/types/greetings';
import {
  fetchGreetingConfig,
  fetchActiveManualGreeting,
  fetchFestivalCalendar,
  fetchIslamicDates,
  subscribeToGreetingUpdates,
  unsubscribeFromGreetingUpdates,
} from '@/utils/supabase-queries';
import {
  calculateTimeBasedGreeting,
  formatGreetingMessage,
  getNextRefreshTime,
} from '@/utils/greetings';
import {
  isTodayFestival,
  isTodayIslamicDate,
  formatFestivalGreeting,
} from '@/utils/festivals';
import { useAppStore } from '@/lib/store';

/**
 * Main hook for greeting system
 * Handles fetching from DB, calculating greeting, and auto-refresh
 */
export const useSupabaseGreetings = (timezone: string = 'Asia/Dhaka') => {
  const [greeting, setGreeting] = useState<CurrentGreeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store references
  const configRef = useRef<GreetingConfig | null>(null);
  const festivalRef = useRef<Festival[]>([]);
  const islamicRef = useRef<IslamicDate[]>([]);
  const subscriptionRef = useRef<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const { user } = useAppStore();
  const userName = user?.name || '';

  /**
   * Calculate the most appropriate greeting based on priority
   */
  const calculateGreeting = useCallback(async (): Promise<CurrentGreeting | null> => {
    try {
      // 1. CHECK MANUAL OVERRIDE (HIGHEST PRIORITY)
      const manual = await fetchActiveManualGreeting(timezone);
      if (manual) {
        return {
          type: 'manual',
          message: formatGreetingMessage(manual.greeting_message, userName),
          emoji: manual.emoji || undefined,
          source: 'backend-override',
          displayedAt: new Date(),
        };
      }

      // Get config for auto settings
      const config = configRef.current;
      if (!config) return null;

      // 2. CHECK FESTIVAL/ISLAMIC DATE (MEDIUM PRIORITY)
      if (config.enable_festival_greetings) {
        // Check Islamic dates first (more important)
        const islamicToday = isTodayIslamicDate(timezone, islamicRef.current);
        if (islamicToday) {
          const formatted = formatFestivalGreeting(islamicToday, timezone);
          return {
            type: 'festival',
            message: formatGreetingMessage(formatted.message, userName),
            emoji: formatted.emoji,
            source: 'automatic-festival',
            displayedAt: new Date(),
          };
        }

        // Then check static festivals
        const festivalToday = isTodayFestival(timezone, festivalRef.current);
        if (festivalToday) {
          const formatted = formatFestivalGreeting(festivalToday, timezone);
          return {
            type: 'festival',
            message: formatGreetingMessage(formatted.message, userName),
            emoji: formatted.emoji,
            source: 'automatic-festival',
            displayedAt: new Date(),
          };
        }
      }

      // 3. CHECK TIME-BASED (LOWEST PRIORITY)
      if (config.enable_time_greetings) {
        const timeGreeting = calculateTimeBasedGreeting(timezone, config);
        if (timeGreeting) {
          return {
            type: 'time',
            message: formatGreetingMessage(timeGreeting.message, userName),
            emoji: timeGreeting.emoji,
            source: 'automatic-time',
            displayedAt: new Date(),
          };
        }
      }

      // No greeting should be displayed
      return {
        type: 'none',
        message: '',
        source: 'none',
      };
    } catch (err) {
      console.error('[Hook] Error calculating greeting:', err);
      return null;
    }
  }, [timezone, userName]);

  /**
   * Fetch all data from Supabase
   */
  const refreshGreetingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch in parallel
      const [config, festivals, islamic] = await Promise.all([
        fetchGreetingConfig(),
        fetchFestivalCalendar(),
        fetchIslamicDates(),
      ]);

      configRef.current = config;
      festivalRef.current = festivals;
      islamicRef.current = islamic;

      // Calculate new greeting
      const newGreeting = await calculateGreeting();
      setGreeting(newGreeting);

      console.log('[Hook] Greeting data refreshed', {
        hasConfig: !!config,
        festivalCount: festivals.length,
        islamicCount: islamic.length,
        currentGreeting: newGreeting?.type,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Hook] Error refreshing greeting data:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [calculateGreeting]);

  /**
   * Setup real-time subscription
   */
  const setupSubscription = useCallback(() => {
    try {
      subscriptionRef.current = subscribeToGreetingUpdates((update) => {
        console.log('[Hook] Real-time update received:', update.type);

        // Refresh all data on any change
        refreshGreetingData();
      });

      console.log('[Hook] Real-time subscription activated');
    } catch (err) {
      console.error('[Hook] Error setting up subscription:', err);
    }
  }, [refreshGreetingData]);

  /**
   * Setup auto-refresh interval
   */
  const setupAutoRefresh = useCallback(() => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Calculate next refresh time
    const nextRefresh = getNextRefreshTime();

    // Set timeout for next minute
    refreshIntervalRef.current = setTimeout(() => {
      calculateGreeting().then(setGreeting);

      // Setup recurring interval for every minute after first refresh
      refreshIntervalRef.current = setInterval(() => {
        calculateGreeting().then(setGreeting);
      }, 60000); // 60 seconds
    }, nextRefresh);

    console.log('[Hook] Auto-refresh setup, next refresh in', nextRefresh, 'ms');
  }, [calculateGreeting]);

  /**
   * Handle app state changes (foreground/background)
   */
  const setupAppStateListener = useCallback(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        console.log('[Hook] App regained focus, refreshing greeting');
        refreshGreetingData();
      }

      appStateRef.current = nextAppState;
    });

    return subscription;
  }, [refreshGreetingData]);

  /**
   * Initial setup and cleanup
   */
  useEffect(() => {
    console.log('[Hook] useSupabaseGreetings mounted, timezone:', timezone);

    // Initial fetch
    refreshGreetingData();

    // Setup real-time subscription
    setupSubscription();

    // Setup auto-refresh
    setupAutoRefresh();

    // Setup app state listener
    const appStateSubscription = setupAppStateListener();

    // Cleanup on unmount
    return () => {
      console.log('[Hook] useSupabaseGreetings cleanup');

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      if (subscriptionRef.current) {
        unsubscribeFromGreetingUpdates(subscriptionRef.current);
      }

      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, [timezone, refreshGreetingData, setupSubscription, setupAutoRefresh, setupAppStateListener, calculateGreeting]);

  return {
    greeting,
    loading,
    error,
    refresh: refreshGreetingData,
    timezone,
  };
};
