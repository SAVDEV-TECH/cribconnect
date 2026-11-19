# CribConnect UNIPORT — Verified Student Housing Marketplace

**CribConnect** is a Next.js 14 full-stack student housing platform built for the **University of Port Harcourt (UNIPORT)** and surrounding Port Harcourt neighborhoods (**Choba, Ozuoba, Aluu, Rumuola, Rumuokoro, Rumuigbo, and GRA Port Harcourt**).

Students and relocators can browse verified rentals with video walkthroughs, post reverse-marketplace housing requests for local agents to pitch, schedule physical inspections, message agents directly, and lock rooms for 48 hours using a PIN-protected ₦10,000 escrow holding deposit.

---

## Core Features

- **Property Explorer & Campus Map (`/listings`, `/listings/[id]`)**: Filter by neighborhood, property type, max rent, and utilities with a split List/Map view powered by Leaflet and Google Maps directions.
- **48-Hour Escrow Hold & Student Tracker (`/escrow`)**: Students lock a property via Paystack (with server-side verification and signed HMAC-SHA512 webhooks at `/api/webhooks/paystack`) or admin-verified transfer. A CSPRNG 4-digit Release PIN is generated and unlocked only after payment confirmation, with 5-attempt lockout protection and 48-hour expiry enforcement.
- **Reverse Marketplace (`/requests`, `/requests/[id]`)**: Students post budget and preferred campus gate; registered Agents and Landlords submit itemized property proposals (`rent + agency fee + caution fee`), which students can shortlist, accept, or decline.
- **Agent Portal & Verification (`/agent/dashboard`, `/agent/profile`, `/list-property`)**: Authenticated agents/landlords upload real photos/videos (magic-byte validated, stored in PostgreSQL `MediaAsset` or Cloudinary), manage inspection bookings, and claim escrow payouts using the student's Release PIN.
- **In-App Messaging (`/messages`)**: Authenticated student-to-agent direct messaging scoped strictly to the signed-in user.
- **Founder Command Center (`/admin`)**: Server-enforced RBAC (`role === "ADMIN"` or `ADMIN_EMAILS`) for verifying agents, confirming bank-transfer escrows, marking released payouts disbursed, moderating scam reports, and managing listings.
- **PWA & Android Wrapper (`public/manifest.json`, `public/sw.js`, `android-native/`)**: Installable PWA with safe Service Worker caching rules and hardened Android WebView wrapper.

---

## Architecture & Persistence

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS v3
- **Database**: PostgreSQL via Prisma (`StoreRecord` + `MediaAsset` models in `prisma/schema.prisma`)
- **Authentication**: Unified HMAC-SHA256 signed `HttpOnly` `cribconnect_session` cookie (`lib/session.ts` + `lib/auth-security.ts`) with per-token `jti` revocation on logout, PBKDF2-SHA512 password hashing, and optional Google Identity Services ID token verification (`POST /api/auth/google`).

---

## Getting Started

### 1. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure required values:

```bash
cp .env.example .env.local
```

Required in production:
- `DATABASE_URL` (PostgreSQL connection string)
- `NEXTAUTH_SECRET` (random secret, minimum 16 characters; fails closed in production if missing)
- `ADMIN_EMAILS` (comma-separated admin email(s))

Recommended for full functionality:
- `NEXT_PUBLIC_SITE_URL` (e.g., `https://cribconnect-gold.vercel.app`)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Google OAuth Web Client ID)
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` & `PAYSTACK_SECRET_KEY` (live Paystack payments + webhook HMAC verification)
- `GEMINI_API_KEY` (optional AI listing parser; falls back to offline parser if unset)

### 2. Install & Initialize Prisma

```bash
npm ci
npx prisma generate
npx prisma db push
```

### 3. Run Locally

```bash
npm run dev
```

### 4. Verification Commands

```bash
npx prisma generate
npx tsc --noEmit
npm run lint
npm test
npm run build
```

---

## Key Routes

| Route | Purpose |
|---|---|
| `/` | Homepage with search bar, active UNIPORT listings, and reverse-marketplace preview |
| `/listings` & `/listings/[id]` | Property explorer (list/map), video tours, inspection booking, escrow reservation, scam reporting |
| `/escrow` | Student Escrow Tracker — view unlocked Release PIN, release after inspection, refund, or dispute |
| `/requests` & `/requests/[id]` | Reverse marketplace housing requests and agent proposal comparison |
| `/agents` & `/agents/[id]` | Public directory of agents/landlords with real verification status |
| `/messages` | Authenticated in-app inbox |
| `/list-property` | Authenticated Agent/Landlord property publisher |
| `/agent/dashboard` & `/agent/profile` | Agent listing, inspection, escrow claim, and payout profile management |
| `/admin` | Admin-only verification, escrow confirmation/disbursement, and scam-report moderation |
