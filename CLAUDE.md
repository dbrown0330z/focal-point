# Project: Focal Point (working title)

## What This Is
A web platform for camera clubs. Replaces existing club management tools with a single, easy-to-use platform covering:
- Club website (public-facing marketing site for prospective members)
- Member image library
- Monthly photo competitions with external judges
- Member news/activity hub

Long-term goal: evolve into a multi-tenant SaaS product for camera clubs broadly. Start with a single-club MVP.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Database & Auth**: Supabase
- **Hosting**: Vercel
- **Payments** (future): Stripe

## User Roles
- **Admin**: full control over everything
- **Member**: manages own image library, submits to competitions
- **Judge**: scoped access to a single assigned competition only (magic-link/token access, no full account needed)
- **Anonymous visitor**: sees public marketing site only

## Key Business Rules
- Each image may only ever be submitted to one competition at a time (withdrawn submissions free the image)
- Competitions are monthly with configurable categories and per-member submission limits
- The homepage renders differently based on auth state:
  - Anonymous → public marketing/landing page
  - Authenticated member → news feed and activity hub
- Judge access is temporary and scoped — no persistent login required

## Design Principles
- Ease of use is the top priority — this is a tool for non-technical club members
- No unnecessary complexity; club management not community/social features
- UX clarity comes first; functionality follows clean design

## Auth & UX Decisions
- Submission flow: competition-first — member goes to open competition, picks category, then selects from their library
- Judge token expiry: tied to competition.status = 'judging', not a timestamp
- Signup: self-serve but role defaults to null until admin approves; null-role users cannot access member zone

## Current Status
- Project initialized: Next.js + Tailwind + Supabase SSR
- Data model designed, migrations not yet written
- Next: write Supabase migrations and scaffold route structure

## Component Library
MUI v6 is installed. Theme is in `src/theme/index.ts` (main app)
and `src/theme/admin.ts` (admin). Both map to the tokens in
`design-tokens.md`. Always use MUI components — never raw HTML
buttons, inputs, or selects. Use `variant="contained"` for primary
actions and `variant="outlined" color="secondary"` for secondary actions.
Admin pages use `adminTheme` via their own layout provider.

@./design-tokens.md