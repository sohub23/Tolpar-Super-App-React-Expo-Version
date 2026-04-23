# 🎉 Personalized Greeting System - QUICK START GUIDE

## Installation & Setup (5 Minutes)

### Step 1: Run SQL in Supabase (2 min)

1. Go to Supabase Console → SQL Editor
2. Open file: `SQL_SETUP.sql`
3. Copy entire content and paste into editor
4. Click **Run**
5. Wait for success ✅

**Result:** 4 tables created with sample data

```
✅ greeting_config      (settings for auto greetings)
✅ manual_greetings     (backend override messages)
✅ festival_calendar    (static festival dates)
✅ islamic_dates        (Eid, Ramadan, etc.)
```

### Step 2: Install Dependencies (1 min)

```bash
npm install dayjs
```

### Step 3: Use in Your Screen (2 min)

Add to your home/dashboard screen:

```tsx
import { useSupabaseGreetings } from '@/hooks/useSupabaseGreetings';
import { GreetingBanner } from '@/components/GreetingBanner';

export default function HomeScreen() {
  const { greeting, loading, error } = useSupabaseGreetings('Asia/Dhaka');

  return (
    <>
      <GreetingBanner greeting={greeting} loading={loading} error={error} />
      {/* Your other content */}
    </>
  );
}
```

**Done!** 🚀

---

## What You Get

| Time | Display |
|------|---------|
| 5-12 AM | 🌅 Good Morning, Alice! |
| 12-5 PM | ☀️ Good Afternoon, Alice! |
| 5-9 PM | 🌆 Good Evening, Alice! |
| 9-5 AM | 🌙 Good Night, Alice! |
| 14 Aug | 🇧🇩 Suvonabarsho, Alice! |
| 10 Jun | 🌙 Eid Mubarak, Alice! |
| Today (backend) | 🎉 Custom Message from Admin, Alice! |

---

## Test It

### Test 1: Time-Based Greeting
✅ Default - should show "Good Morning/Afternoon/Evening/Night"

### Test 2: Festival Greeting  
```sql
-- In Supabase SQL, check if today is a festival
SELECT * FROM festival_calendar 
WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
  AND day = EXTRACT(DAY FROM CURRENT_DATE)::INTEGER;
```

### Test 3: Manual Override by Admin
```sql
-- Admin creates a special greeting
INSERT INTO manual_greetings (
  greeting_message, emoji, start_date, end_date, priority, is_active
) VALUES (
  'Hello from Backend!', '🎉', CURRENT_DATE, CURRENT_DATE, 150, true
);
```
✅ Now refresh app - should show backend greeting at TOP

---

## Files Created/Modified

### New Files:
- ✅ `utils/supabase-queries.ts` - Database queries
- ✅ `utils/greetings.ts` - Greeting logic  
- ✅ `utils/festivals.ts` - Festival utilities
- ✅ `hooks/useSupabaseGreetings.ts` - Main hook
- ✅ `components/GreetingBanner.tsx` - UI component
- ✅ `types/greetings.d.ts` - TypeScript types
- ✅ `SQL_SETUP.sql` - Database schema
- ✅ `GREETING_SYSTEM_README.md` - Full docs
- ✅ `GREETING_IMPLEMENTATION_GUIDE.tsx` - Code example

### Modified Files:
- ✅ `lib/store.ts` - Added greeting state

---

## Architecture

```
Backend (Supabase)
    ↓
    ├→ greeting_config     (auto settings)
    ├→ manual_greetings    (admin messages)
    ├→ festival_calendar   (static dates)
    └→ islamic_dates       (Eid dates)
    
Mobile App (React Native)
    ↓
    useSupabaseGreetings() (hook)
    ↓
    Priority Check:
    1️⃣ Manual > 2️⃣ Festival > 3️⃣ Time-based
    ↓
    GreetingBanner (displays)
    ↓
    Auto-refresh every 1 min
```

---

## Key Features

✅ **Automatic Time-Based** - Good Morning/Afternoon/Evening/Night  
✅ **Festival-Aware** - Detects Suvonabarsho, Eid, Ramadan, etc.  
✅ **Backend Control** - Admins can override with custom messages  
✅ **Real-Time Sync** - Changes appear instantly  
✅ **Timezone Support** - Works with any timezone  
✅ **Performance** - Refreshes every minute, not every second  
✅ **Offline-Ready** - Cached locally  
✅ **Type-Safe** - Full TypeScript support  

---

## Configuration

### Change Time Periods

```sql
UPDATE greeting_config SET
  morning_start = 6,      -- Change 5 AM → 6 AM
  evening_end = 22        -- Change 9 PM → 10 PM
LIMIT 1;
```

### Disable Features

```sql
-- Disable time-based, keep only manual & festival
UPDATE greeting_config 
SET enable_time_greetings = false 
LIMIT 1;

-- Re-enable
UPDATE greeting_config 
SET enable_time_greetings = true 
LIMIT 1;
```

### Add Festival

```sql
INSERT INTO festival_calendar 
(festival_name, month, day, emoji, greeting_message, is_enabled)
VALUES
  ('My Holiday', 12, 25, '🎄', 'Happy Holiday!', true);
```

---

## Real-Time Updates

When you update in Supabase, the app updates **automatically** because of:
- Real-time subscription to database changes
- Auto-refresh every minute
- App focuses listeners

**No need to restart the app!**

---

## Debug Mode

In development build, see:
- Greeting type (manual/festival/time)
- Source (backend-override/automatic)
- Current timezone
- Refresh times

Check console:
```
[Hook] useSupabaseGreetings mounted
[DB] greeting_config fetched
[Greetings] Showing: Good Morning
[Hook] Next refresh in 45000ms
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Greeting not showing | Check `enable_time_greetings` in DB |
| Wrong timezone | Set: `setUserTimezone('Asia/Dhaka')` |
| Not updating | Restart app, check internet |
| Type errors | Run `npm run typecheck` |

---

## Next Steps

1. ✅ Run SQL setup
2. ✅ Install dayjs  
3. ✅ Add to home screen
4. ✅ Test with manual greeting
5. ✅ Push to production

---

## Need Help?

📖 Full documentation: `GREETING_SYSTEM_README.md`  
💻 Code example: `GREETING_IMPLEMENTATION_GUIDE.tsx`  
🗄️ Database schema: `SQL_SETUP.sql`

**You're all set!** Enjoy your personalized greetings! 🎉
