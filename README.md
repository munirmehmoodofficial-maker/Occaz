# Occaz

A modern events, ticketing and opportunity discovery platform.

## Features

- **User app**: Browse and book events, discover scholarships, internships and other opportunities
- **Admin panel**: Manage events, opportunities, users, organizers, subscriptions and more
- **Organizer hub**: Create events, manage tickets, view analytics, custom organizer pages
- **Authentication**: Email/password + magic link via Supabase Auth
- **Onboarding wizard**: Welcome → Auth → Interests → Done
- **Storage**: Supabase Storage with public bucket for event/opportunity images
- **Realtime**: Live data sync via Supabase Realtime subscriptions
- **Multi-tier subscriptions**: Free / Pro / Business plans for organizers

## Tech stack

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router
- **State**: React Context + custom hooks
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime)
- **Styling**: Custom CSS with dark/light theme

## Getting started

```bash
# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local with your Supabase project URL and anon key

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database

The app expects the following Supabase tables:
- `profiles` — user profile data
- `events` — event listings
- `opportunities` — scholarship/internship listings
- `organizations` — organizer profiles
- `registrations` — ticket bookings
- `saved_items` — bookmarked events
- `cities` — city directory
- `taxonomy_categories` / `taxonomy_subcategories` / `taxonomy_types`

Storage:
- `occaz` bucket (public) — event images, opportunity images, org logos

## Project structure

```
src/
  components/    # Reusable UI components
  data/         # Data store + Supabase adapter
  hooks/         # Custom React hooks
  lib/           # Supabase client, auth, storage, etc.
  pages/         # Top-level pages (routed)
    admin/       # Admin panel pages
    organizer/   # Organizer dashboard pages
  App.tsx        # Router + layout
  main.tsx       # Entry point
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — run linter
- `npm run typecheck` — TypeScript check
