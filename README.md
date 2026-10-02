# Occaz

A polished, premium events, tickets, and opportunities discovery platform with a full admin control panel.

## Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Routing:** react-router-dom
- **Styling:** Tailwind CSS with custom design system
- **Animations:** framer-motion
- **Backend:** Supabase (Postgres + Auth + Realtime + Storage)
- **Currency:** PKR (₨) throughout

## Features

### User-facing app
- Home, Explore, Events, Opportunities pages
- Event and Opportunity detail pages
- Tickets, Saved, Profile, Search
- Magic-link and email/password auth
- Onboarding wizard (4 steps)
- Welcome/landing page for guests
- Multi-image upload with cover selection
- Save/bookmark events and opportunities
- Organizer subscription system (Free / Pro / Business)

### Admin control panel (22+ sections)
- Dashboard with analytics
- Events, Opportunities, Users, Organizations management
- Orders & Revenue
- Featured toggles with Pro plan gating
- Categories, Tags, Cities & Locations
- Reviews, Reports, Coupons
- Notifications, Email templates
- Homepage editor (drag-and-drop section order, hero background image)
- Domains & SEO
- Integrations, Backup & Data
- Settings, Roles & Permissions
- Audit log

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key
npm run dev
```

## Build for production

```bash
npm run build
# Outputs to dist/
```

## Deploy to Vercel

1. Push to GitHub (this repo)
2. Go to https://vercel.com/new
3. Import this repository
4. Vercel auto-detects Vite — no config needed (vercel.json included)
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click Deploy

## Database schema

See `supabase/schema.sql` for the full schema. Key tables:
- `events` — event listings
- `opportunities` — scholarships, fellowships, etc.
- `profiles` — user profiles
- `organizations` — organizers
- `registrations` — event bookings
- `saved_items` — bookmarks
- `cities` — location directory
- `homepage_settings` — homepage config (section order, hero bg)

## Storage

The `occaz` bucket holds all uploaded images (event covers, opportunity covers, gallery, organizer logos, hero backgrounds). Public read access.
