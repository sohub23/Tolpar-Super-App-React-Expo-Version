import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type { Festival, IslamicDate } from '@/types/greetings';

dayjs.extend(isBetween);

/**
 * Check if today is a festival
 */
export function isTodayFestival(
  timezone: string,
  festivals: Festival[]
): Festival | null {
  try {
    const now = dayjs().tz(timezone);
    const month = now.month() + 1; // dayjs.month() is 0-indexed
    const day = now.date();

    const todayFestival = festivals.find(
      (f) => f.month === month && f.day === day && f.is_enabled
    );

    return todayFestival || null;
  } catch (error) {
    console.error('[Festivals] Error checking today festival:', error);
    return null;
  }
}

/**
 * Check if today is an Islamic date (Eid, etc.)
 */
export function isTodayIslamicDate(
  timezone: string,
  islamicDates: IslamicDate[]
): IslamicDate | null {
  try {
    const now = dayjs().tz(timezone);
    const todayStr = now.format('YYYY-MM-DD');

    const todayIslamic = islamicDates.find(
      (d) => d.gregorian_date === todayStr && d.is_enabled
    );

    return todayIslamic || null;
  } catch (error) {
    console.error('[Festivals] Error checking today Islamic date:', error);
    return null;
  }
}

/**
 * Get upcoming festivals
 */
export function getUpcomingFestivals(
  festivals: Festival[],
  daysAhead: number = 30
): Festival[] {
  try {
    const now = dayjs();
    const endDate = now.add(daysAhead, 'days');

    const upcoming: Festival[] = [];

    for (const festival of festivals) {
      if (!festival.is_enabled) continue;

      // Create date for this year
      let festivalDate = dayjs()
        .month(festival.month - 1)
        .date(festival.day)
        .startOf('day');

      // If festival has already passed this year, check next year
      if (festivalDate.isBefore(now)) {
        festivalDate = festivalDate.add(1, 'year');
      }

      // If it's within our range, add it
      if (festivalDate.isBetween(now, endDate, null, '[]')) {
        upcoming.push(festival);
      }
    }

    return upcoming.sort((a, b) => {
      const dateA = dayjs()
        .month(a.month - 1)
        .date(a.day);
      const dateB = dayjs()
        .month(b.month - 1)
        .date(b.day);
      return dateA.diff(dateB);
    });
  } catch (error) {
    console.error('[Festivals] Error getting upcoming festivals:', error);
    return [];
  }
}

/**
 * Get upcoming Islamic dates
 */
export function getUpcomingIslamicDates(
  islamicDates: IslamicDate[],
  daysAhead: number = 30
): IslamicDate[] {
  try {
    const now = dayjs().startOf('day');
    const endDate = now.add(daysAhead, 'days');

    return islamicDates
      .filter((d) => d.is_enabled)
      .filter((d) => {
        const date = dayjs(d.gregorian_date).startOf('day');
        return date.isBetween(now, endDate, null, '[]');
      })
      .sort((a, b) => dayjs(a.gregorian_date).diff(dayjs(b.gregorian_date)));
  } catch (error) {
    console.error('[Festivals] Error getting upcoming Islamic dates:', error);
    return [];
  }
}

/**
 * Get festival by date
 */
export function getFestivalByDate(
  month: number,
  day: number,
  festivals: Festival[]
): Festival | null {
  return festivals.find(
    (f) => f.month === month && f.day === day && f.is_enabled
  ) || null;
}

/**
 * Format festival greeting
 */
export function formatFestivalGreeting(
  festival: Festival | IslamicDate,
  timezone: string
): { message: string; emoji?: string } {
  const emoji = festival.emoji || '🎉';
  let message = festival.greeting_message || festival.festival_name;

  // Add timezone info in debug mode
  if (__DEV__) {
    message += ` [${timezone}]`;
  }

  return { message, emoji };
}

/**
 * Check if in Ramadan period (simplified)
 * This is a placeholder - real implementation would check Islamic calendar
 */
export function isInRamadan(islamicDates: IslamicDate[]): boolean {
  const today = dayjs();
  const todayStr = today.format('YYYY-MM-DD');

  return islamicDates.some(
    (d) =>
      d.festival_name.toLowerCase().includes('ramadan') &&
      d.gregorian_date === todayStr &&
      d.is_enabled
  );
}

/**
 * Get Ramadan greeting (if applicable)
 */
export function getRamadanGreeting(islamicDates: IslamicDate[]): IslamicDate | null {
  const today = dayjs();
  const todayStr = today.format('YYYY-MM-DD');

  return (
    islamicDates.find(
      (d) =>
        d.festival_name.toLowerCase().includes('ramadan') &&
        d.gregorian_date === todayStr &&
        d.is_enabled
    ) || null
  );
}
