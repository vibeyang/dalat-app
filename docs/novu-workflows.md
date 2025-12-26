# Novu Workflow Templates for dalat.app

## Setup Instructions

Translations are handled in code (`lib/novu.ts`), so Novu templates are simple.

1. Go to [Novu Dashboard](https://dashboard-v2.novu.co) → Workflows
2. Create each workflow below
3. Add **In-App** channel step
4. Use the simple template pattern

---

## Universal Template Pattern

All workflows use the same simple template:

**Body:**
```
{{payload.message}}
```

**Primary Action:**
- Label: `{{payload.buttonText}}`
- Redirect URL: `{{payload.eventUrl}}`

---

## Workflows to Create

### 1. `waitlist-promotion`
**Trigger:** User gets promoted from waitlist

**Test Payload:**
```json
{
  "message": "🎉 You got a spot for \"Beach BBQ\"! See you there.",
  "buttonText": "View Event",
  "eventUrl": "https://dalat.app/events/beach-bbq"
}
```

### 2. `event-reminder`
**Trigger:** 24 hours before event

**Test Payload:**
```json
{
  "message": "⏰ \"Beach BBQ\" is tomorrow at 7:00 PM. Don't forget!",
  "buttonText": "View Event",
  "eventUrl": "https://dalat.app/events/beach-bbq"
}
```

### 3. `confirm-attendance`
**Trigger:** Ask confirmed attendees if still coming

**Template:**
- Body: `{{payload.message}}`
- Primary Action: `{{payload.yesButtonText}}` → `{{payload.confirmUrl}}`
- Secondary Action: `{{payload.noButtonText}}` → `{{payload.cancelUrl}}`

**Test Payload:**
```json
{
  "message": "👋 \"Beach BBQ\" is tomorrow. Still coming?",
  "yesButtonText": "Yes, coming",
  "noButtonText": "Can't make it",
  "confirmUrl": "https://dalat.app/events/beach-bbq?confirm=yes",
  "cancelUrl": "https://dalat.app/events/beach-bbq?confirm=no"
}
```

### 4. `waitlist-position-update`
**Trigger:** User moves up in waitlist

**Test Payload:**
```json
{
  "message": "📈 You're now #2 on the waitlist for \"Beach BBQ\".",
  "buttonText": "View Event",
  "eventUrl": "https://dalat.app/events/beach-bbq"
}
```

### 5. `new-rsvp-organizer`
**Trigger:** Someone RSVPs to organizer's event

**Test Payload:**
```json
{
  "message": "🙋 John is going to \"Beach BBQ\"",
  "buttonText": "View Event",
  "eventUrl": "https://dalat.app/events/beach-bbq"
}
```

---

## Translations

Handled in `lib/novu.ts` - supports English, French, Vietnamese.
Messages are pre-translated before sending to Novu.

---

## Testing

1. Click **"Test Workflow"** button
2. Enter subscriberId (your Supabase user ID)
3. Add test payload
4. Click Send
5. Check bell icon in app

---

## Adding SMS (Later)

1. Go to **Integration Store** → Add **Twilio**
2. Edit workflow → Add **SMS** step
3. Use same `{{payload.message}}` pattern
