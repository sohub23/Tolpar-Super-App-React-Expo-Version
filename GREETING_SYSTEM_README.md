# 🎉 Personalized Greeting System Implementation Guide

## Overview

A complete greeting system for your Expo app that supports:
- ✅ **Time-based greetings** (Good Morning, Afternoon, Evening, Night)
- ✅ **Festival greetings** (Suvonabarsho, Eid, etc.)
- ✅ **Manual overrides** (Backend controls from Supabase)
- ✅ **Dynamic timezones** (Auto-detect or manual set)
- ✅ **Real-time updates** (Changes sync instantly)
- ✅ **Auto-refresh** (Updates every minute)

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
npm install dayjs
```

### Step 2: Run SQL Setup in Supabase

1. Open [Supabase Console](https://app.supabase.io) → Your Project → SQL Editor
2. Create a new query
3. Copy and paste the entire content from `SQL_SETUP.sql`
4. Click "Run" button
5. Wait for all 4 tables to be created with sample data

**Tables Created:**
- `greeting_config` - Global settings for automatic greetings
- `manual_greetings` - Backend override messages
- `festival_calendar` - Static festival dates
- `islamic_dates` - Islamic holiday dates

### Step 3: Verify Tables in Supabase

Go to Table Editor and you should see:
```
greeting_config     ✓
manual_greetings    ✓ (with 4 sample entries)
festival_calendar   ✓ (with 5 festivals)
islamic_dates       ✓ (with 4 Islamic dates for 2026)
```

---

## 🏗️ File Structure

```
utils/
├── supabase-queries.ts       # Database query functions
├── greetings.ts              # Greeting calculation logic
└── festivals.ts              # Festival utilities

hooks/
└── useSupabaseGreetings.ts   # Main greeting hook

components/
└── GreetingBanner.tsx        # Display component

types/
└── greetings.d.ts            # TypeScript definitions

lib/
└── store.ts                  # Updated with greeting state

SQL_SETUP.sql                 # Database setup script
GREETING_IMPLEMENTATION_GUIDE.tsx  # Usage example
```

---

## 🚀 Quick Start

### Option 1: In Your Home/Dashboard Screen

```tsx
import { useSupabaseGreetings } from '@/hooks/useSupabaseGreetings';
import { GreetingBanner } from '@/components/GreetingBanner';

export default function HomeScreen() {
  const { greeting, loading, error, refresh } = useSupabaseGreetings('Asia/Dhaka');

  return (
    <>
      <GreetingBanner
        greeting={greeting}
        loading={loading}
        error={error}
        showAnimation={true}
        onRefresh={refresh}
      />
      {/* Rest of your screen */}
    </>
  );
}
```

### Option 2: With Dynamic Timezone

```tsx
import { useAppStore } from '@/lib/store';

export default function HomeScreen() {
  const { userTimezone } = useAppStore();
  const { greeting, loading } = useSupabaseGreetings(userTimezone);

  return (
    <GreetingBanner greeting={greeting} loading={loading} />
  );
}
```

---

## 📱 How It Works

### Priority System

The greeting displays based on this priority order:

```
1️⃣  HIGHEST PRIORITY: Manual Greeting (from backend)
    └─ If today's date is in active manual greeting range
    
2️⃣  MEDIUM PRIORITY: Festival/Holiday
    └─ Check Islamic dates first (Eid > Ramadan > etc.)
    └─ Then check static festivals
    
3️⃣  LOW PRIORITY: Time-based
    └─ Good Morning: 5 AM - 12 PM
    └─ Good Afternoon: 12 PM - 5 PM
    └─ Good Evening: 5 PM - 9 PM
    └─ Good Night: 9 PM - 5 AM
    
4️⃣  NONE: No greeting (if all disabled)
```

### Data Flow

```
Supabase Tables
    ↓
Hook fetches all data on mount
    ↓
Real-time listener enabled
    ↓
Calculate best greeting based on priority
    ↓
Display in GreetingBanner
    ↓
Auto-refresh every minute
    ↓
Update when app regains focus
```

---

## 🎮 Testing the System

### Test 1: Verify Database Setup

Run these queries in Supabase SQL Editor:

```sql
-- Check greeting config
SELECT * FROM greeting_config LIMIT 1;

-- Check today's manual greeting
SELECT * FROM manual_greetings 
WHERE start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE;

-- Check if today is a festival
SELECT * FROM festival_calendar 
WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
  AND day = EXTRACT(DAY FROM CURRENT_DATE)::INTEGER;
```

### Test 2: Create a Manual Greeting

```sql
INSERT INTO manual_greetings (
  greeting_message, 
  emoji, 
  start_date, 
  end_date, 
  priority, 
  is_active
) VALUES (
  'Test Greeting from Backend!',
  '🎉',
  CURRENT_DATE,
  CURRENT_DATE,
  150,
  true
);
```

**Expected Result:** App shows "🎉 Test Greeting from Backend!" at top

### Test 3: Enable/Disable Features

```sql
-- Disable time-based, keep only manual & festival
UPDATE greeting_config 
SET enable_time_greetings = false
WHERE id = (SELECT id FROM greeting_config LIMIT 1);
```

---

## 🔧 Configuration Options

### Changing Time Periods

Edit in `greeting_config` table:

```sql
UPDATE greeting_config SET
  morning_start = 6,      -- Change 5 AM to 6 AM
  morning_end = 11,       -- Change 12 PM to 11 AM
  afternoon_start = 11,
  afternoon_end = 16,     -- Change 5 PM to 4 PM
  evening_start = 16,
  evening_end = 22        -- Change 9 PM to 10 PM
WHERE id = (SELECT id LIMIT 1);
```

### Disabling Features Remotely

```sql
-- Disable all automatic greetings
UPDATE greeting_config SET
  enable_time_greetings = false,
  enable_festival_greetings = false,
  enable_ramadan_greetings = false;

-- Re-enable
UPDATE greeting_config SET
  enable_time_greetings = true;
```

### Adding New Festivals

```sql
INSERT INTO festival_calendar (
  festival_name, 
  month, 
  day, 
  emoji, 
  greeting_message, 
  is_enabled
) VALUES 
  ('My Custom Holiday', 12, 25, '🎄', 'Happy Custom Holiday!', true),
  ('Another Festival', 7, 4, '🎆', 'Happy Festival Day!', true);
```

---

## 🌍 Timezone Support

### Supported Timezones

```typescript
// Default: 'Asia/Dhaka'
// Other examples:
'Etc/UTC'
'America/New_York'
'Europe/London'
'Asia/Kolkata'
'Australia/Sydney'
```

### Setting User Timezone

```tsx
import { useAppStore } from '@/lib/store';

function SettingsScreen() {
  const { setUserTimezone } = useAppStore();

  return (
    <Button 
      title="Use Bangladesh Time"
      onPress={() => setUserTimezone('Asia/Dhaka')}
    />
  );
}
```

---

## 🔍 Debug Mode

Enable debug info in dev builds:

```tsx
// In GreetingBanner.tsx - debug section shows:
// - Greeting type (manual/festival/time)
// - Source (backend-override/automatic-festival/automatic-time)
// - User timezone
```

Check console logs:

```
[Hook] useSupabaseGreetings mounted
[DB] greeting_config updated
[Greetings] Time period: morning
[Hook] Greeting data refreshed
```

---

## 📝 API Reference

### Hook: `useSupabaseGreetings(timezone)`

```typescript
const {
  greeting,      // Current greeting object (or null)
  loading,       // Boolean - data loading
  error,         // String - error message (or null)
  refresh,       // Function - manually refresh data
  timezone       // Current timezone being used
} = useSupabaseGreetings('Asia/Dhaka');
```

### Component: `GreetingBanner`

```typescript
<GreetingBanner
  greeting={greeting}           // CurrentGreeting object
  loading={false}               // Optional boolean
  error={error}                 // Optional error string
  timezone="Asia/Dhaka"         // Optional timezone display
  showAnimation={true}          // Optional animation toggle
  onRefresh={() => refresh()}   // Optional refresh handler
/>
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Greeting not showing | Check `enable_time_greetings` in `greeting_config` |
| Wrong timezone | Set timezone in store: `setUserTimezone('Asia/Dhaka')` |
| Outdated greeting | Force refresh with the `refresh` button or restart app |
| Database not syncing | Check Row Level Security policies in Supabase |
| Performance slow | Clear app cache, restart Expo Go |

---

## 🎨 Customization

### Change Greeting Colors

Edit `GreetingBanner.tsx`:

```typescript
const styles_map = {
  manual: {
    container: { backgroundColor: '#FFF3CD' }, // Change yellow
    text: { color: '#856404' },                 // Change text color
  },
  // ... other types
};
```

### Add More Greeting Types

1. Add to database: `ALTER TABLE greeting_config ADD COLUMN new_setting BOOLEAN;`
2. Update hook to check this setting
3. Add new logic to calculate greeting
4. Add styling to `GreetingBanner.tsx`

---

## 📊 Sample Greetings

| Time | Timezone | Output |
|------|----------|--------|
| 7:30 AM | Asia/Dhaka | 🌅 Good Morning, Alice! |
| 2:15 PM | Asia/Dhaka | ☀️ Good Afternoon, Alice! |
| 6:45 PM | Asia/Dhaka | 🌆 Good Evening, Alice! |
| 1:00 AM | Asia/Dhaka | 🌙 Good Night, Alice! |
| 14 Aug | Asia/Dhaka | 🇧🇩 Suvonabarsho, Alice! |
| 10 Jun | Asia/Dhaka | 🌙 Eid Mubarak, Alice! |
| Today (custom) | Any | 🎉 Special Holiday from Backend, Alice! |

---

## 📚 Related Files

- [SQL_SETUP.sql](./SQL_SETUP.sql) - Database schema and sample data
- [GREETING_IMPLEMENTATION_GUIDE.tsx](./GREETING_IMPLEMENTATION_GUIDE.tsx) - Code example
- [utils/supabase-queries.ts](./utils/supabase-queries.ts) - Database functions
- [hooks/useSupabaseGreetings.ts](./hooks/useSupabaseGreetings.ts) - Main hook
- [components/GreetingBanner.tsx](./components/GreetingBanner.tsx) - UI component

---

## ✅ Checklist

- [ ] Run SQL_SETUP.sql in Supabase
- [ ] Verify 4 tables created with data
- [ ] Install dayjs: `npm install dayjs`
- [ ] Add GreetingBanner to home screen
- [ ] Test with time-based greeting
- [ ] Test with manual greeting
- [ ] Test with festival date
- [ ] Verify timezone handling
- [ ] Check real-time sync
- [ ] Test in production build

---

## 🚀 Next Steps

1. **Run SQL setup** → Create tables in Supabase
2. **Install dayjs** → `npm install dayjs`
3. **Add to home screen** → Use the implementation guide
4. **Test locally** → Verify greeting displays
5. **Deploy** → Push to production

Congratulations! You now have a fully functional greeting system! 🎉
