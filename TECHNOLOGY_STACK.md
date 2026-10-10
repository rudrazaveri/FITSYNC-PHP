# FitSync AI — Technology Stack & Architectural Specification

> **"Your Fitness. Your Health. Your Intelligence."**  
> A comprehensive overview of all languages, frameworks, libraries, database engines, mathematical models, and deployment infrastructure used to build the FitSync AI platform.

---

## 1. Executive Technology Summary

FitSync AI is built as a commercial-grade, full-stack web application designed for high performance, zero-latency responsive interactions, clinical-grade patient privacy, and cross-platform accessibility.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FITSYNC AI CLIENT LAYER                         │
│   Next.js 14 App Router • React 18 • TypeScript • Tailwind CSS         │
│   BioDigital Kinetic Design System • Web Audio API Tactile Haptics     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                       APPLICATION LOGIC & ENGINES                      │
│   • Mifflin-St Jeor Biometric Engine • U.S. Navy Body Fat Model       │
│   • Real-Time Allergen Conflict Scanner • Food Reaction Pattern Engine │
│   • Transactional Appointment Engine with Double-Booking Prevention    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                    SUPABASE BACKEND & DATABASE LAYER                   │
│   • PostgreSQL (Relational Normalized Schema with UUIDs & GiST)        │
│   • Row Level Security (RLS) Sovereign Patient Consent Matrix          │
│   • Supabase Auth (Role-Based JWT Authorization across 6 Roles)        │
│   • Supabase Storage (Encrypted Private Vaults with Signed URLs)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                      DEVOPS & GLOBAL HOSTING LAYER                     │
│   • Vercel Global Edge Network • GitHub CI/CD Pipeline                 │
│   • Cloudflare Quick Tunnels (Encrypted Public HTTPS)                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Technologies & User Interface

### 2.1 Core Frameworks & Languages
* **[Next.js 14 (App Router)](https://nextjs.org/)**
  * Employs React Server Components (RSC) and Client Components (`'use client'`).
  * Optimized route handling (`src/app/page.tsx`, `src/app/layout.tsx`).
  * Built-in serverless API route handlers (`src/app/api/*`).
* **[React 18](https://react.dev/)**
  * Component-driven modular architecture.
  * State lifecycle management with `useState`, `useEffect`, and `useContext`.
* **[TypeScript 5.7](https://www.typescriptlang.org/)**
  * Strict mode enabled (`strict: true`).
  * Exhaustive type definitions for all entities (`UserProfile`, `Exercise`, `PredefinedDietPlan`, `Appointment`, `HealthReport`, etc.).

### 2.2 Styling & Design System: "BioDigital Kinetic"
* **[Tailwind CSS 3.4](https://tailwindcss.com/)**
  * Utility-first styling framework with extended theme configuration (`tailwind.config.ts`).
  * Dark space glassmorphism surfaces (`backdrop-filter: blur(12px)`).
  * Custom glow shadows (`shadow-glow-fitness`, `shadow-glow-healthcare`, `shadow-glow-nebula`).
* **[PostCSS 8 & Autoprefixer 10](https://postcss.org/)**
  * Cross-browser CSS optimization and automatic vendor prefixing.
* **Curated Typography (Google Fonts CDN)**
  * **Space Grotesk:** Primary display typography, hero numbers, and section headlines.
  * **Plus Jakarta Sans:** Highly legible modern body, label, and dialogue typography.
  * **JetBrains Mono:** Tabular numerals for biometric lab panels, BMR/TDEE calculations, and countdown timers.

### 2.3 Iconography & Tactile Audio Feedback
* **[Lucide React 0.468](https://lucide.dev/)**
  * Lightweight, pixel-perfect icon set across navigation, fitness indicators, and medical badges.
* **[Web Audio API (Native Browser Synthesis)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)**
  * Custom oscillator-based audio synthesizer (`src/lib/audio-haptics.ts`).
  * Synthesizes native-feeling tactile clicks, completion chimes, and timer alarms without loading external MP3/WAV assets.

---

## 3. Backend, Database & Security Infrastructure

### 3.1 [Supabase (Backend as a Service)](https://supabase.com/)
* **PostgreSQL Database:**
  * Normalized relational architecture across 12 tables.
  * UUID primary keys generated using `uuid-ossp`.
  * Cascading foreign keys, unique indexes, and audit timestamps (`created_at`, `updated_at`).
* **Row Level Security (RLS):**
  * Enforces row-level isolation at the database layer.
  * Guarantees members can only access their own biometric records and meal logs.
  * Limits doctor/physiotherapist access to health reports strictly according to the user's explicit consent toggles.
* **Database Extensions:**
  * `uuid-ossp`: High-entropy UUID generation.
  * `btree_gist`: GiST indexing supporting exclusion constraints (`no_overlapping_provider_appointments`) to mathematically prevent appointment double-booking.
* **Supabase Storage:**
  * Private bucket (`health-reports`) for medical PDFs, accessible only via temporary 15-minute signed URLs.
  * Private bucket (`progress-photos`) and public bucket (`avatars`).
* **Client SDKs:**
  * `@supabase/supabase-js 2.47`: Universal client library for browser and server requests.
  * `@supabase/ssr 0.5`: Server-side cookie-based session synchronization.

---

## 4. Mathematical Engines & Physiological Models

The application replaces static mockups with real data-driven mathematical algorithms (`src/lib/assessment-calculator.ts`):

1. **Body Mass Index (BMI):**
   $$\text{BMI} = \frac{\text{Weight (kg)}}{(\text{Height (m)})^2}$$
2. **Basal Metabolic Rate (BMR) — Mifflin-St Jeor Formula:**
   * Men: $\text{BMR} = 10 \times \text{Weight} + 6.25 \times \text{Height} - 5 \times \text{Age} + 5$
   * Women: $\text{BMR} = 10 \times \text{Weight} + 6.25 \times \text{Height} - 5 \times \text{Age} - 161$
3. **Total Daily Energy Expenditure (TDEE):**
   $$\text{TDEE} = \text{BMR} \times \text{Activity Multiplier (1.20 to 1.90)}$$
4. **Calorie & Macronutrient Partitioning:**
   * Muscle Gain Surplus (+250 kcal) / Fat Loss Deficit (-500 kcal).
   * Protein: $2.1\text{g per kg bodyweight}$ (athletic preservation).
   * Fats: $25\%$ of total calories divided by 9.
   * Carbohydrates: Remaining calories divided by 4.
5. **Body Fat Estimation (U.S. Navy Circumference Model):**
   * Uses waist, neck, hip circumferences and height to estimate body composition.
6. **Real-Time Allergen Conflict Engine:**
   * String parsing and conflict matrix comparing user-flagged allergens (e.g., Peanuts) against food entries.
7. **Adverse Food Reaction Pattern Engine:**
   * Longitudinal counter flagging recurrent symptoms (e.g. 4+ occurrences of dairy triggering bloating).

---

## 5. Telehealth & Clinical Communications

* **Telehealth Video Room Interface (`src/components/TelehealthVideoRoom.tsx`):**
  * Fullscreen virtual consultation room for sports doctors and physiotherapists.
  * Live ticking session timer, audio input/output toggles, and camera controls.
  * Real-time in-session clinical notes drawer.
  * Architecture-ready integration hooks for WebRTC / Twilio Video / Daily.co.

---

## 6. State Management & Offline Resilience

* **Unified Persistent Store (`src/lib/store.ts`):**
  * Single source of truth managing all 6 user roles, active workouts, meal logs, appointments, and telemetry.
  * Automatic synchronization with browser `localStorage` ensuring instant offline availability and persistence across reloads.
  * Smooth fallback mechanism allowing the app to function with full interactivity even when remote database keys are being configured.

---

## 7. DevOps, Version Control & Cloud Hosting

| Service / Tool | Purpose & Configuration |
| :--- | :--- |
| **[Git](https://git-scm.com/)** | Distributed version control with branching strategy (`main`). |
| **[GitHub](https://github.com/rudrazaveri/FITSYNC-AI)** | Source code repository and automated deployment trigger. |
| **[Vercel](https://vercel.com/)** | Production hosting platform with Next.js edge caching, automatic SSL, and global CDN. |
| **[Supabase Cloud](https://supabase.com/)** | Hosted managed PostgreSQL instance, Auth, and Storage. |
| **[Cloudflare Tunnels](https://cloudflare.com/)** | Zero-trust tunnel client (`cloudflared`) providing instant public HTTPS access from local builds. |

---

## 8. Summary Table of Dependencies

```json
{
  "production_dependencies": {
    "next": "^14.2.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.47.10",
    "@supabase/ssr": "^0.5.2",
    "lucide-react": "^0.468.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "developer_dependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "tailwindcss": "^3.4.16",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20"
  }
}
```
