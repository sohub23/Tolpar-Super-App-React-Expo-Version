import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { GreetingConfig, TimeBasedGreeting, TimePeriod, CurrentGreeting } from '@/types/greetings';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Get current time in a specific timezone
 */
export function getTimeInTimezone(tzName: string): dayjs.Dayjs {
  try {
    return dayjs().tz(tzName);
  } catch (error) {
    console.warn(`[Greetings] Invalid timezone: ${tzName}, using UTC`);
    return dayjs.utc();
  }
}

/**
 * Determine time period based on hour
 */
export function getTimePeriod(hour: number, config: GreetingConfig): TimePeriod {
  if (hour >= config.morning_start && hour < config.morning_end) {
    return 'morning';
  } else if (hour >= config.afternoon_start && hour < config.afternoon_end) {
    return 'afternoon';
  } else if (hour >= config.evening_start && hour < config.evening_end) {
    return 'evening';
  } else {
    return 'night';
  }
}

/**
 * Get time-based greeting message
 */
export function getTimeBasedGreetingMessage(period: TimePeriod): TimeBasedGreeting {
  const greetings: Record<TimePeriod, TimeBasedGreeting> = {
    morning: {
      period: 'morning',
      message: 'Good Morning',
      emoji: '🌅',
    },
    afternoon: {
      period: 'afternoon',
      message: 'Good Afternoon',
      emoji: '☀️',
    },
    evening: {
      period: 'evening',
      message: 'Good Evening',
      emoji: '🌆',
    },
    night: {
      period: 'night',
      message: 'Good Night',
      emoji: '🌙',
    },
  };

  return greetings[period];
}

/**
 * Calculate time-based greeting for a timezone
 */
export function calculateTimeBasedGreeting(
  timezone: string,
  config: GreetingConfig
): TimeBasedGreeting | null {
  if (!config.enable_time_greetings) {
    return null;
  }

  try {
    const now = getTimeInTimezone(timezone);
    const hour = now.hour();
    const period = getTimePeriod(hour, config);
    return getTimeBasedGreetingMessage(period);
  } catch (error) {
    console.error('[Greetings] Error calculating time-based greeting:', error);
    return null;
  }
}

/**
 * Format greeting with username
 */
export function formatGreetingMessage(
  baseMessage: string,
  userName?: string,
  emoji?: string
): string {
  let message = emoji ? `${emoji} ${baseMessage}` : baseMessage;

  if (userName) {
    message += `, ${userName}!`;
  } else {
    message += '!';
  }

  return message;
}

/**
 * Check if we're in Ramadan (simplified - checks Islamic date range)
 * Returns true if current date is between any Ramadan start and end
 */
export function isRamadanNow(): boolean {
  // This is a placeholder - in production, you'd check actual Islamic calendar
  // For now, return false and let the database handle it
  return false;
}

/**
 * Validate greeting timing
 * Ensure greeting should be displayed
 */
export function isGreetingValid(greeting: CurrentGreeting): boolean {
  if (!greeting) return false;

  // Check if greeting is too old (older than 2 hours)
  if (greeting.displayedAt) {
    const age = dayjs().diff(dayjs(greeting.displayedAt), 'hour');
    if (age > 2) {
      return false;
    }
  }

  return true;
}

/**
 * Get next greeting refresh time
 * Always refresh at the top of the next minute
 */
export function getNextRefreshTime(): number {
  const now = new Date();
  const nextMinute = new Date(now.getTime() + 60000);
  nextMinute.setSeconds(0);
  nextMinute.setMilliseconds(0);

  return nextMinute.getTime() - now.getTime();
}

/**
 * Log greeting for analytics
 */
export function logGreetingDisplay(greeting: CurrentGreeting, userId?: string): void {
  const logData = {
    type: greeting.type,
    source: greeting.source,
    message: greeting.message,
    emoji: greeting.emoji,
    userId,
    timestamp: new Date().toISOString(),
  };

  console.log('[Greetings] Display:', JSON.stringify(logData));

  // TODO: Send to analytics service
}
