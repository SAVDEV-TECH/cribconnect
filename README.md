# 🏠 CribConnect — "Zillow + Upwork" Hybrid Rental Platform for Students & Relocators

**CribConnect** is a full-stack rental property marketplace built specifically for students and newcomers relocating to unfamiliar university environments (localized around the **University of Lagos / Yaba** student hub with multi-currency support).

Unlike traditional property platforms that only focus on static house listings, CribConnect puts **verified local agents** at the center of the experience through an **Upwork-style reverse marketplace**: renters post structured housing requests, and accredited local agents respond with matching property proposals, video walkthroughs, and transparent fee itemization.

---

## 🌟 Key Features

### 1. Reverse Marketplace ("Upwork for Rentals")
- **Students Post Housing Requests**: Specify desired campus proximity, max annual budget ceiling, move-in timeline, roommate preferences, and required utilities (borehole water, generator backup, security).
- **Agents Submit Structured Proposals**: Verified agents pitch properties with transparent upfront cost breakdowns:
  $$\text{Total Upfront} = \text{Annual Base Rent} + \text{Legal/Agreement Fee (10\%)} + \text{Caution Deposit (10\%)}$$
- **Side-by-Side Proposal Comparison**: Compare agent ratings, verified credentials, and proposed accommodations in a side-by-side deck with 1-click acceptance.

### 2. Dual Search & Campus Proximity Map
- **Split View, List View & Map View**: Seamless toggle powered by **Leaflet & OpenStreetMap**.
- **Campus Gate Pins**: Distance indicators to key campus entrances (e.g. *5 mins to UNILAG New Hall Gate*, *Education Gate*, *Main Gate*).
- **Student-Specific Utility Filters**: Filter by uninterrupted borehole water, backup generators, personal prepaid meters, and gated compounds.

### 3. Trust & Safety: Verified Agent Protocol
- **Screened Agents**: National Identity Number (NIN) and government ID document validation before badges are conferred.
- **Dynamic Badges**: *"Verified Agent"*, *"UNILAG Specialist"*, *"Top Rated"*, and *"Zero Scam Guarantee"*.
- **Admin Verification Portal**: Platform administrators review pending agent credentials, inspect scanned IDs, and approve or reject applications with notes.
- **Community Scam Reports**: Students can flag suspicious middlemen, undocumented inspection fees, or inaccurate photos directly to platform compliance officers.

### 4. Dual Communication Channels
- **In-App Messaging**: Real-time message thread with persistent anti-scam advisories and attached proposal context.
- **1-Click WhatsApp Quick-Connect**: Direct WhatsApp chat triggers formatted with property and request context for fast communication.

### 5. Freemium Monetization Model & Pro Agent Tier
- **Free Tier**: Capped at 2 active property listings.
- **CribConnect Pro Tier**: Unlimited listings, 3 included "Featured Crib" spotlight placements, priority lead alerts, and an agent analytics dashboard (impressions, leads, proposal conversion).
- **Interactive Upgrade Checkout**: Simulated Paystack payment flow.

### 6. Relocation Mode Concierge
- Interactive onboarding wizard for students moving from outside the state (e.g. Enugu, Abuja, Port Harcourt, or abroad) to match them with verified agents offering video walkthroughs and arrival guidance.

---

## 👥 Instant Demo Persona Switcher

The top navigation bar includes an instant 1-click **Demo Switcher** allowing you to test the platform from four distinct perspectives without manual login credentials:

| Persona | Role | Description |
|---|---|---|
| **Chidi Nwosu** | `STUDENT` | Incoming UNILAG Computer Science fresher relocating from Enugu. Browses rentals, posts housing requests, and compares proposals. |
| **Kolawole Adebayo** | `AGENT` (Pro Verified) | CampusNest Realty. Top-rated UNILAG specialist (★ 4.95, 28 reviews) with full portfolio and analytics access. |
| **Bisi Adeleke** | `AGENT` (Pending Free) | Independent Yaba agent whose submitted NIN/ID credentials are in the Admin review queue. Demonstrates Free Tier limits. |
| **Tola Balogun** | `ADMIN` | Platform Trust & Safety Lead. Inspects pending agent documents, approves/rejects credentials, and moderates scam reports. |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom brand palette
- **Database & ORM**: SQLite with Prisma ORM
- **Maps**: Leaflet & React-Leaflet with custom SVG/DIV pins
- **Icons**: Lucide React
- **Server State**: Next.js Route Handlers & Cookies

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Seed UNILAG Ecosystem
```bash
npx prisma db push
npx ts-node prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```

Or run the production build:
```bash
npm run build
npm run start
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗺️ Route Sitemap

- `/` — Homepage (Hero, Relocation Mode Quick-Start, Upwork Request feed preview, Featured Cribs, Top Agents, Safety Pledge)
- `/listings` — Dual View Property Explorer (Interactive Map + Filterable List)
- `/listings/[id]` — Detailed Property View (Photo gallery, Video Tour player, Transparent Cost Itemization, Verified Agent Card)
- `/requests` — Housing Request Board ("Upwork for Housing")
- `/requests/[id]` — Side-by-side Proposal Comparison Deck for Students
- `/agents` — Verified Agents Directory
- `/agents/[id]` — Public Agent Profile, Badges, Portfolio, and Student Reviews
- `/agent/dashboard` — Agent Management Portal (Free vs Pro Tier, Analytics, Add Listing, ID Verification)
- `/messages` — In-App Chat Hub with Scam Warning Banner & WhatsApp triggers
- `/admin` — Platform Administration & Trust & Safety Verification Queue
