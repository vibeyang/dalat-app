# Admin Dashboard Analytics - Handover Document

**Date:** January 11, 2026
**Session Focus:** Fix admin 500 errors, add session/login analytics
**Commits:** `e00b99c` → `89bad86` (8 commits)

---

## Quick Start for Next Session

```bash
# 1. Ensure migrations are applied (if not already)
npx supabase db push

# 2. Verify admin dashboard works
npm run dev
# Visit http://localhost:3000/admin

# 3. Check for errors in console
# If you see "Error fetching..." - the RPC function may be missing
```

---

## Summary of Changes

### 1. Fixed 500 Error on `/admin` (Critical)

**Problem:** The admin dashboard was returning 500 errors in production.

**Root Causes Fixed:**
1. **Server/Client Component boundary violation** - Passing Lucide icon components (functions) from Server Components to Client Components is not allowed in Next.js App Router
2. **Missing error handling** - RPC functions could throw exceptions that weren't caught
3. **Unsafe optional chaining** - `overview?.users.total` throws if `overview` exists but `users` is undefined

**Files Changed:**
- [stat-card.tsx](components/admin/analytics/stat-card.tsx) - Changed `icon: LucideIcon` to `icon: ReactNode`
- [admin/page.tsx](app/[locale]/admin/page.tsx) - Pass rendered JSX icons (`<Users className="..." />`) instead of component functions
- [analytics.ts](lib/admin/analytics.ts) - Added try-catch to all 9 analytics functions
- [admin/layout.tsx](app/[locale]/admin/layout.tsx) - Added try-catch around auth/profile fetching

### 2. Added Session Stats to Main Dashboard

**New Stats Cards on `/admin`:**
- **Connections** - Total users who have logged in + active today count
- **Last Login** - Most recent login timestamp across all users

**Files:**
- [lib/types/index.ts](lib/types/index.ts) - Added optional `sessions` field to `DashboardOverview`
- [lib/admin/analytics.ts](lib/admin/analytics.ts) - Added `SessionStats` interface and `getSessionStats()` function
- [20260121_001_session_stats.sql](supabase/migrations/20260121_001_session_stats.sql) - RPC function `get_session_stats()`

### 3. Added Login Tracking to User Management

**New Columns on `/admin/users`:**
- **Logins** - Number of tracked logins per user (md+ screens)
- **Last Login** - Per-user last sign-in timestamp (lg+ screens)

**Files:**
- [users/page.tsx](app/[locale]/admin/users/page.tsx) - Fetches auth data via RPC, passes to table
- [user-management-table.tsx](components/admin/user-management-table.tsx) - Added `authDataMap` prop and new columns
- [20260122_001_user_auth_data.sql](supabase/migrations/20260122_001_user_auth_data.sql) - Creates:
  - `login_events` table for tracking login counts
  - `get_users_with_login_stats()` RPC function

---

## Design Decisions & Rationale

### Why `ReactNode` for Icons Instead of `LucideIcon`?

Next.js App Router enforces strict Server/Client Component boundaries. Components marked `"use client"` cannot receive functions as props from Server Components. Since `LucideIcon` is a function type, we switched to `ReactNode` which accepts pre-rendered JSX.

```tsx
// ❌ WRONG - Passing function to client component
<StatCard icon={Users} />

// ✅ CORRECT - Passing rendered JSX
<StatCard icon={<Users className="h-6 w-6 text-primary" />} />
```

### Why Parallel Fetches with Individual Try-Catch?

Each analytics query (`getFullDashboardData`) runs in parallel using `Promise.all`, but each has its own try-catch. This means:
- **Fast**: All queries run simultaneously (~200ms total vs ~2s sequential)
- **Resilient**: One failing query doesn't break the whole dashboard
- **Debuggable**: Failed queries return `null` and log specific errors

### Why a Separate `login_events` Table?

Supabase's `auth.users` table only stores `last_sign_in_at` - it doesn't track login count. The `login_events` table enables:
- Accurate per-user login counts
- Historical login data for audit trails
- Future analytics (login patterns, IP tracking, etc.)

---

## Architecture Notes

### Analytics Data Flow

```
Admin Page (Server Component)
    ↓
getFullDashboardData() - Parallel fetch of 9 RPC functions
    ↓
Each RPC function has try-catch, returns null/[] on error
    ↓
StatCard components receive ReactNode icons (not functions)
    ↓
Charts receive data arrays, handle empty state gracefully
```

### RPC Functions (Supabase)

| Function | Returns | Used By |
|----------|---------|---------|
| `get_dashboard_overview` | User/event/RSVP counts | Main dashboard |
| `get_session_stats` | Total logins, active today, last login | Main dashboard |
| `get_users_with_login_stats` | Per-user login count + last login | User management |
| `get_users_auth_data` | Per-user last_sign_in_at | User management (fallback) |
| `get_user_growth` | Time series data | User growth chart |
| `get_role_distribution` | Role breakdown | Role distribution chart |
| `get_event_activity` | Event creation over time | Event activity chart |
| `get_rsvp_trends` | RSVP trends over time | RSVP trends chart |
| `get_verification_queue_stats` | Pending/approved counts | Verification card |
| `get_extraction_stats` | AI extraction metrics | Extraction stats |
| `get_festival_stats` | Festival counts | Festival card |

---

## Dependencies

This feature uses existing dependencies (no new packages added):

| Package | Purpose |
|---------|---------|
| `recharts` | Chart rendering (UserGrowthChart, etc.) |
| `lucide-react` | Icons for stat cards |
| `date-fns` | Date formatting for timestamps |

---

## Known Limitations

### 1. Login Count Tracking Not Yet Active

The `login_events` table exists but isn't being populated. **Existing users show 0 logins.**

**To enable login tracking**, add this Supabase Auth trigger via SQL Editor or a new migration:

```sql
-- Trigger function to track logins
CREATE OR REPLACE FUNCTION track_user_login()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    INSERT INTO public.login_events (user_id, logged_in_at)
    VALUES (NEW.id, NEW.last_sign_in_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION track_user_login();
```

**How to apply:** Run this SQL in Supabase Dashboard → SQL Editor, or create a new migration file and run `npx supabase db push`.

### 2. Missing RPC Functions Fail Gracefully

If any RPC function doesn't exist in Supabase, the dashboard shows 0/empty data instead of crashing. Check Vercel logs for "Error fetching..." messages to identify missing functions.

### 3. Stats Grid Responsiveness

The main dashboard stats grid uses:
- `xl:grid-cols-6` - 6 cards on extra-large screens
- `lg:grid-cols-3` - 3 cards on large screens
- `sm:grid-cols-2` - 2 cards on small screens

If adding more stat cards, consider the layout impact.

---

## File Reference

### Core Admin Files
```
app/[locale]/admin/
├── page.tsx              # Main dashboard with stats + charts
├── layout.tsx            # Auth check, role validation
└── users/
    └── page.tsx          # User management with login stats

components/admin/
├── analytics/
│   ├── index.ts          # Barrel export
│   ├── stat-card.tsx     # Generic stat card (icon: ReactNode)
│   ├── user-growth-chart.tsx
│   ├── role-distribution-chart.tsx
│   ├── event-activity-chart.tsx
│   ├── rsvp-trends-chart.tsx
│   └── verification-queue-card.tsx
└── user-management-table.tsx  # User list with role editing

lib/admin/
└── analytics.ts          # All analytics fetch functions

lib/types/index.ts        # DashboardOverview, SessionStats types
```

### Migrations
```
supabase/migrations/
├── 20260121_001_session_stats.sql      # get_session_stats()
└── 20260122_001_user_auth_data.sql     # login_events + get_users_with_login_stats()
```

**Note on migration naming:** Files use sequential dates (20260113, 20260114, ..., 20260122) to ensure correct execution order. Supabase runs migrations alphabetically, so this pattern guarantees proper sequencing regardless of creation date.

---

## Deployment Checklist

**Before deploying to production:**

- [ ] Run `npx supabase db push` to apply migrations
- [ ] Verify RPC functions exist in Supabase Dashboard → Database → Functions
- [ ] Check Vercel environment variables are set (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Test `/admin` page loads without 500 error
- [ ] Verify you can see stats (even if 0)

**After deployment:**

- [ ] Check Vercel logs for any "Error fetching..." messages
- [ ] Verify charts render (or show "No data available" gracefully)
- [ ] Test role changes work via dropdown on `/admin/users`

---

## Testing Checklist

### Functional Tests
- [ ] `/admin` loads without 500 error
- [ ] All 6 stat cards display (or show 0/—)
- [ ] Charts render (or show "No data available")
- [ ] `/admin/users` shows Logins and Last Login columns
- [ ] Role changes work via dropdown
- [ ] Mobile responsive layout works

### Error Handling Tests
- [ ] Dashboard still loads if one RPC fails
- [ ] Missing RPC shows 0/empty, not crash
- [ ] Non-admin users are redirected (not 500)

### Edge Cases
- [ ] Empty database (new install) - shows zeros, not errors
- [ ] User with no logins shows "—" not error
- [ ] Very long user list paginates correctly

---

## Troubleshooting

### "Error fetching dashboard overview"
The `get_dashboard_overview` RPC doesn't exist. Run the migration in `20260116_001_analytics_functions.sql`.

### All stats show 0
Either the database is empty, or migrations haven't been applied. Run `npx supabase db push`.

### "Cannot read properties of undefined"
Likely the defensive null checks aren't in place. Ensure you're using `overview?.users?.total ?? 0` pattern, not `overview?.users.total`.

### Icons not rendering on stat cards
Make sure you're passing rendered JSX, not component functions. See the "Design Decisions" section above.

---

## Next Steps / Ideas

1. **Enable login tracking** - Add Supabase Auth trigger (see limitation #1 above)
2. **Add refresh button** - Allow manual data refresh without page reload
3. **Add date range selector** - Filter charts by custom date range
4. **Export functionality** - CSV export of user data
5. **Real-time updates** - Supabase realtime for live dashboard updates
