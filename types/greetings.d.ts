/**
 * Type definitions for Greeting System
 */

export interface GreetingConfig {
  id: string;
  enable_time_greetings: boolean;
  morning_start: number;
  morning_end: number;
  afternoon_start: number;
  afternoon_end: number;
  evening_start: number;
  evening_end: number;
  enable_festival_greetings: boolean;
  enable_ramadan_greetings: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManualGreeting {
  id: string;
  greeting_message: string;
  emoji: string | null;
  start_date: string;
  end_date: string;
  priority: number;
  is_active: boolean;
  applicable_timezones: string[] | null;
  timezone_filter: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Festival {
  id: string;
  festival_name: string;
  month: number;
  day: number;
  emoji: string | null;
  greeting_message: string | null;
  description: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IslamicDate {
  id: string;
  festival_name: string;
  gregorian_date: string;
  hijri_date_start: string | null;
  emoji: string | null;
  greeting_message: string | null;
  description: string | null;
  year: number;
  duration_days: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Combined greeting response from the system
 */
export interface CurrentGreeting {
  type: 'manual' | 'festival' | 'time' | 'none';
  message: string;
  emoji?: string;
  source: 'backend-override' | 'automatic-festival' | 'automatic-time' | 'none';
  displayedAt?: Date;
}

/**
 * Time period for greeting
 */
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeBasedGreeting {
  period: TimePeriod;
  message: string;
  emoji: string;
}
