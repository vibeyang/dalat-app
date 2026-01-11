# Handover: Moments UGC System

## Completed (Phase 1)
- Event lifecycle tabs: Upcoming/Now/Past on home feed
- DB: `get_events_by_lifecycle()` RPC in `20260118_001_lifecycle_rpc.sql`
- Components: `event-feed-tabs.tsx`, `event-lifecycle-badge.tsx`
- URL nav: `?tab=happening` or `?tab=past`

## Completed (Phase 2) - Moments UGC

### What Was Built
- **Database**: `supabase/migrations/20260119_001_moments_ugc.sql`
  - `event_settings` table (per-event config)
  - `moments` table (UGC content)
  - `moments` storage bucket with RLS
  - RPC functions: `get_event_moments()`, `get_moment_counts()`, `create_moment()`
  - `can_post_moment()` helper for permission checks

- **Types**: Added to `lib/types/index.ts`
  - `MomentContentType`, `MomentStatus`, `MomentsWhoCanPost`
  - `EventSettings`, `Moment`, `MomentWithProfile`, `MomentCounts`

- **Components**: `components/moments/`
  - `moment-card.tsx` - Individual moment in grid
  - `moment-grid.tsx` - Grid layout with empty state
  - `moment-form.tsx` - Create form with media upload
  - `moments-preview.tsx` - Preview card for event page sidebar

- **Pages**:
  - `app/[locale]/events/[slug]/moments/page.tsx` - Gallery view
  - `app/[locale]/events/[slug]/moments/new/page.tsx` - Create form
  - `app/[locale]/moments/[id]/page.tsx` - Individual moment (SEO)

- **Translations**: Added `moments` namespace to en/vi/fr

- **Integration**: Event page now shows MomentsPreview in sidebar

### Features
- Photo, video, and text-only posts
- Permission levels: anyone / rsvp / confirmed
- Optional approval queue per event
- Event creator can always post
- SEO-optimized individual moment pages

## Next Steps (Optional)
- Moderation UI for event creators
- Event settings UI to enable/configure moments
- Infinite scroll pagination for large galleries
- Like/react functionality

### Stack
Next.js 16 + Supabase + next-intl (en/vi/fr) + Tailwind

### Mobile Touch Targets
Per CLAUDE.md: min 44x44px, use `px-3 py-2`, `active:scale-95`
