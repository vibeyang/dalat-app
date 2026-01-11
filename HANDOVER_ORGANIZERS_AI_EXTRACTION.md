# Handover: Organizers + AI Event Extraction

## What Was Built

A system for **official organizers** (venues like Phố Bên Đồi) and **AI-powered event extraction** from poster images.

### Key Features
1. **Organizers** - Standalone entities representing venues/organizations
2. **User Roles** - `admin`, `contributor` (future points system ready)
3. **AI Extraction** - Upload poster → Claude Vision extracts events → Review → Bulk publish
4. **Smart Deduplication** - Fuzzy title matching with Vietnamese diacritic handling
5. **"More from Organizer"** - Shows related events on event pages

---

## Files Created/Modified

### Database Migrations (all applied)
- `supabase/migrations/20250111_001_user_roles.sql` - Added `role` column to profiles
- `supabase/migrations/20250112_001_organizers.sql` - Organizers table + storage bucket
- `supabase/migrations/20250113_001_events_organizer.sql` - `organizer_id` FK on events
- `supabase/migrations/20250114_001_extraction_logs.sql` - Extraction tracking table

### Types
- `lib/types/index.ts` - Added `UserRole`, `Organizer`, `ExtractedEventData`, `ExtractionLog`

### AI Extraction
- `lib/ai-extraction.ts` - Claude Vision extraction + deduplication logic

### API Routes
- `app/api/extract-events/route.ts` - POST: Upload image → Extract events
- `app/api/events/bulk/route.ts` - POST: Bulk create events

### Admin Section (`/admin`)
- `app/admin/layout.tsx` - Role-guarded layout (admin/contributor only)
- `app/admin/page.tsx` - Dashboard with stats
- `app/admin/organizers/page.tsx` - List organizers
- `app/admin/organizers/new/page.tsx` - Create organizer
- `app/admin/organizers/[id]/edit/page.tsx` - Edit organizer
- `app/admin/extract/page.tsx` - AI extraction workflow UI

### Admin Components
- `components/admin/organizer-form.tsx` - Create/edit form
- `components/admin/organizer-logo-upload.tsx` - Logo upload
- `components/admin/poster-upload.tsx` - Drag-drop poster upload
- `components/admin/event-review-card.tsx` - Review extracted events

### Public Pages
- `app/organizers/[slug]/page.tsx` - Public organizer page with events
- `app/events/[slug]/page.tsx` - Modified to show "More from organizer"
- `components/events/more-from-organizer.tsx` - Related events component

---

## Setup Required

### 1. Set Admin Role
In Supabase SQL editor:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

### 2. Add Anthropic API Key
In `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Install Dependency (already done)
```bash
npm install @anthropic-ai/sdk
```

---

## How to Test

1. **Access admin**: Go to `/admin` (must have admin role)
2. **Create organizer**: `/admin/organizers/new` → Add "Phố Bên Đồi"
3. **Extract events**: `/admin/extract` → Upload the poster image
4. **Review & publish**: Check extracted events, edit if needed, publish
5. **Verify**: Events appear on homepage and organizer page

---

## Known Limitations / Future Work

### Not Implemented (planned in original design)
- Points/rewards system for contributors
- Organizer membership tiers (free → paid)
- Tribe access control (public, invite-only, password)
- Facebook API integration (blocked by their API restrictions)

### Edge Cases to Watch
- Multi-day events (e.g., "Jan-Mar") create single event with start date
- Year inference assumes 2026 for dates without year
- Vietnamese diacritics are normalized for deduplication

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Organizers separate from Profiles | Allows venues to exist without user accounts; enables future "claim your venue" flow |
| Soft deduplication | AI flags but doesn't auto-reject; human makes final decision |
| Extraction logs | Tracks who submitted what; ready for points attribution |
| `organizer_id` nullable on events | Backward compatible; existing UGC events continue to work |

---

## Database Schema Summary

```
profiles
  └── role: 'user' | 'admin' | 'contributor'

organizers
  ├── id, slug, name, description
  ├── logo_url, website_url, facebook_url, instagram_url
  ├── is_verified, priority_score
  └── owner_id → profiles (optional)

events
  └── organizer_id → organizers (optional)

extraction_logs
  ├── user_id → profiles
  ├── image_url, organizer_id
  ├── extracted_count, published_count, skipped_count
  ├── raw_response (jsonb)
  └── status: 'pending' | 'reviewed' | 'completed'
```

---

## Testing Checklist

- [ ] Admin can access `/admin`
- [ ] Non-admin redirected from `/admin`
- [ ] Can create/edit/delete organizers
- [ ] Logo upload works
- [ ] AI extraction extracts events from poster
- [ ] Duplicate detection flags similar events
- [ ] Bulk publish creates events
- [ ] Events linked to organizer show badge
- [ ] "More from organizer" appears on event pages
- [ ] Organizer public page shows all their events
