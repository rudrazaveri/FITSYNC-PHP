# FitSync – Master Migration Plan: PHP + MySQL to PHP + Supabase
**Document Version:** 1.0.0  
**Phase:** Stage A – Comprehensive Architecture Audit & Migration Blueprint  
**Author:** FitSync AI Architecture Team  
**Status:** Complete – Awaiting Review & Approval Before Stage B  

---

## Executive Summary

FitSync is migrating from a traditional **PHP + MySQL/MariaDB (PDO)** stack to **PHP 8.2+ with Supabase (Hosted PostgreSQL, Supabase Auth, PostgREST Data API, Supabase Storage, and Supabase Realtime)**.

### Core Architecture Directives
1. **Frontend Preservation (Zero Redesign):** 100% of the developed HTML5, CSS3 (`css/style.css`, `css/responsive.css`, `css/trainer.css`), and Vanilla JavaScript (`js/app.js`, `js/auth.js`, `js/trainer.js`) is retained without redesign or alterations.
2. **Unified Visual Identity:** The single design system established in Phase 3 (Inter typography, `#F5F7FF` canvas, `#FFFFFF` cards, `#155DFC` primary blue, Lucide vector icons) remains the visual standard across all portals (User, Trainer, Gym Owner, Platform Admin).
3. **Backend Remains Native PHP:** The PHP application layer remains authoritative. No Node.js backend, React, Next.js, or Laravel frameworks will be introduced.
4. **Supabase as Managed Infrastructure:** Supabase replaces MySQL as the persistent relational database (PostgreSQL 15+), authentication identity provider (Supabase GoTrue Auth), binary object storage (Supabase Storage), and realtime telemetry hub.
5. **Defense-in-Depth RLS:** All database access is governed by PostgreSQL Row Level Security (RLS) policies evaluated against the authenticated user's JWT (`auth.uid()`), ensuring physical database-level isolation between users, trainers, and gyms.
6. **Credential Privacy:** Supabase secret keys are kept strictly on the PHP server. The browser client never receives service keys or raw refresh tokens.

---

## 1. Existing Architecture & Baseline Audit

### 1.1 Existing Technology Stack
- **Web Server:** Apache via local XAMPP / Production LAMP.
- **Backend Language:** PHP 8.2+ with strict typing (`declare(strict_types=1)`).
- **Authoritative Database:** MySQL 8.0 / MariaDB 10.4+.
- **Database Access:** PHP PDO prepared statements with centralized connection in `config/db.php`.
- **Authentication:** Custom PHP password hashing (`password_hash` with BCRYPT) against table `users`, session tokens in `user_sessions`, and CSRF protection in `includes/csrf.php`.
- **Frontend Architecture:** Multi-portal server-rendered PHP routing with client-side reactive DOM modules (Vanilla JS, Lucide icons, Chart.js telemetry, anatomical SVG mapping, rest timer, workout logger).

### 1.2 Current Phase 3 Status
Phase 3 is **100% complete and fully verified**:
- **Authoritative MySQL Schema:** `database/fitsync_mysql_schema.sql` (81 tables, 128 foreign keys, SHA-256 verified).
- **User Portal (`/user/`):** 12 clean routes (`dashboard`, `workouts`, `exercise_library`, `progress`, `nutrition`, `attendance`, `trainer`, `messages`, `notifications`, `profile`, `settings`, `index`) backed by `portal_template.php`.
- **Trainer Portal (`/trainer/`):** 14 verified endpoints including dashboard, member roster, 5-tab dossier (`member_details.php`), schedule, workouts, exercise library, attendance, messages, notifications, profile, settings.
- **Security & Privacy:** Server-side `requireRole('user')` and `requireRole('trainer')` on all portal routes. Member privacy strictly enforced with HTTP 403 Forbidden for unauthorized member IDs.
- **Design Alignment:** Both portals share 100% identical styling, typography, CSS variables, and Lucide icons.

---

## 2. Supabase Infrastructure Architecture

### 2.1 Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FITSYNC BROWSER FRONTEND                              │
│   (index.html, user/portal_template.php, trainer/*.php, CSS, Vanilla JS)    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ Standard Fetch / AJAX (Form-Data / JSON)
                                  │ HttpOnly Secure Session Cookies
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PHP 8.2+ BACKEND                                 │
│  ┌───────────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │
│  │     Route / Page      │  │    REST API Hub     │  │  Session & RBAC   │  │
│  │   (/user, /trainer)   │  │   (api/auth, etc.)  │  │  (includes/auth)  │  │
│  └───────────┬───────────┘  └──────────┬──────────┘  └─────────┬─────────┘  │
│              │                         │                       │            │
│              ▼                         ▼                       ▼            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        SERVICES LAYER                                 │  │
│  │  • SupabaseClient.php   (cURL transport, error handling, timeouts)    │  │
│  │  • SupabaseAuth.php     (GoTrue API: signup, login, refresh, logout)  │  │
│  │  • SupabaseDatabase.php (PostgREST API: SELECT, INSERT, UPDATE, RLS)  │  │
│  │  • SupabaseStorage.php  (Storage API: avatars, documents, signed URLs)│  │
│  │  • SupabaseRealtime.php (SSE / Polling / WebSocket telemetry bridge)  │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │ HTTPS / REST (PostgREST + GoTrue)
                                     │ Headers: apikey + Bearer <User_JWT>
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE MANAGED CLOUD BACKEND                         │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │    Supabase Auth     │  │   Supabase Storage   │  │ Supabase Realtime │  │
│  │    (auth.users)      │  │   (S3-compatible)    │  │  (WebSockets/SSE) │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └─────────┬─────────┘  │
│             │                         │                        │            │
│             ▼                         ▼                        ▼            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    SUPABASE POSTGRESQL 15+                            │  │
│  │   • 81 Relational Tables (Public Schema)                              │  │
│  │   • Row Level Security (RLS) on Every Table                           │  │
│  │   • auth.uid() & JWT Claim Enforcement                                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Environment Configuration (`.env`)

```ini
# FitSync AI — Supabase Environment Configuration
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost/FIT-SYNC%20AI%20php

# Supabase Project Credentials
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional Direct PostgreSQL Connection (Used exclusively for migrations & CLI seeding)
SUPABASE_DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require

# Application Session Security
SESSION_LIFETIME=7200
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=Lax
```

> [!CAUTION]
> `SUPABASE_SECRET_KEY` (service_role) bypasses all Row Level Security. It must NEVER be committed to Git, NEVER sent to the browser, and NEVER used in standard user/trainer queries. Only trusted administrative tasks and initial schema migration scripts may read it.

---

## 3. Database Migration: MySQL to Supabase PostgreSQL

### 3.1 Syntax Conversion Matrix

| MySQL 8.0 Concept | Supabase PostgreSQL Equivalent | Architectural Rationale |
|---|---|---|
| `INT / BIGINT AUTO_INCREMENT` | `UUID DEFAULT gen_random_uuid()` for user records; `BIGINT GENERATED ALWAYS AS IDENTITY` for catalogs | Matches Supabase Auth UUID primary keys (`auth.users.id`). |
| `DATETIME` | `TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP` | PostgreSQL timezone-aware timestamps prevent time-drift across mobile devices and check-in turnstiles. |
| `TINYINT(1)` | `BOOLEAN DEFAULT true / false` | Native boolean types with strict PostgreSQL type validation. |
| `JSON` | `JSONB` | Binary JSON allows efficient GIN indexing and deep query filtering for telemetry metadata. |
| `ENUM('val1', 'val2')` | `VARCHAR(50) CHECK (col IN ('val1', 'val2'))` or native `CREATE TYPE` | Check constraints allow seamless enum additions without requiring non-transactional DDL locks. |
| `ON UPDATE CURRENT_TIMESTAMP` | PostgreSQL trigger `BEFORE UPDATE FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()` | Standard PostgreSQL idiom for automatic timestamp refreshing. |
| `UNSIGNED` integers | Standard signed integer types (`SMALLINT`, `INTEGER`, `BIGINT`) | PostgreSQL does not have unsigned types; bounds checks applied via `CHECK (val >= 0)`. |
| Passwords in `users.password_hash` | Delegated to `auth.users.encrypted_password` | Supabase Auth securely stores and handles bcrypt hashes within its protected `auth` schema. |

### 3.2 Complete 81-Table PostgreSQL Migration Map

The 81 MySQL tables are structured into 12 coherent functional domains:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FITSYNC 81-TABLE DOMAIN TOPOLOGY                                │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ 1. Core Identity & Auth (8)   │ 2. Gyms & Facilities (8)      │ 3. Trainer Operations (8)
│  • files                      │  • gyms                       │  • trainer_profiles    │
│  • users                      │  • gym_photos                 │  • trainer_credentials │
│  • auth_tokens (obsolete)     │  • gym_operating_hours        │  • specializations     │
│  • user_sessions (obsolete)   │  • facilities                 │  • trainer_specializ.  │
│  • account_deletion_requests  │  • gym_facilities             │  • trainer_assignments │
│  • user_settings              │  • equipment                  │  • reassignment_req.   │
│  • notification_preferences   │  • gym_equipment              │  • trainer_data_perm.  │
│  • user_profiles              │  • gym_trainers               │  • trainer_avail_rules │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ 4. Memberships & Plans (4)    │ 5. Workouts & Exercises (11)  │ 6. Trainer Sched & Notes (3)
│  • membership_plans           │  • muscle_groups              │  • trainer_unavail.    │
│  • memberships                │  • body_regions               │  • trainer_sessions    │
│  • verification_requests      │  • exercises                  │  • trainer_notes       │
│  • verification_documents     │  • exercise_media             │                        │
│                               │  • exercise_muscles           │                        │
│                               │  • exercise_equipment         │                        │
│                               │  • workout_plans              │                        │
│                               │  • plan_days                  │                        │
│                               │  • plan_day_exercises         │                        │
│                               │  • plan_assignments          │                        │
│                               │  • plan_modification_requests │                        │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ 7. Workout Sessions (3)       │ 8. Biometrics & Goals (5)     │ 9. Nutrition & Diet (17)
│  • scheduled_workouts         │  • fitness_goals              │  • food_categories     │
│  • workout_sessions           │  • body_measurements          │  • foods               │
│  • session_exercises          │  • progress_photos            │  • food_servings       │
│  • exercise_set_logs          │  • fitness_assessments        │  • allergens           │
│                               │  • fitness_interests          │  • food_allergens      │
│                               │  • user_fitness_interests     │  • dietary_tags        │
│                               │                               │  • food_dietary_tags   │
│                               │                               │  • user_allergies      │
│                               │                               │  • user_dietary_restr. │
│                               │                               │  • food_reactions      │
│                               │                               │  • recipe_categories   │
│                               │                               │  • recipes             │
│                               │                               │  • recipe_ingredients │
│                               │                               │  • favourite_foods     │
│                               │                               │  • favourite_recipes   │
│                               │                               │  • meals               │
│                               │                               │  • meal_items          │
│                               │                               │  • water_logs          │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ 10. Attendance & Gym Log (1)  │ 11. Reports & Clinical-Free(3)│ 12. Comms, Alerts & Admin(7)
│  • attendance                 │  • report_categories          │  • conversations       │
│                               │  • health_reports             │  • messages            │
│                               │  • report_exports             │  • notifications       │
│                               │                               │  • reminders           │
│                               │                               │  • complaints          │
│                               │                               │  • platform_settings   │
│                               │                               │  • audit_logs          │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

#### Detailed Domain Conversions

1. **Identity & User Core:**
   - `public.users`: Primary key converted from `BIGINT AUTO_INCREMENT` to `UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`. Columns: `id`, `email`, `role` (`user`, `trainer`, `gym_owner`, `admin`), `full_name`, `mobile`, `status`, `created_at`, `updated_at`.
   - `auth_tokens` & `user_sessions`: Replaced by native Supabase Auth JWT token management and server-side PHP sessions.
   - `user_profiles`: `user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE`, `gender`, `date_of_birth`, `height_cm`, `weight_kg`, `fitness_experience`, `bio`.
   - `user_settings`, `notification_preferences`, `account_deletion_requests`: `user_id UUID NOT NULL REFERENCES public.users(id)`.

2. **Gyms, Branches & Staff:**
   - `gyms`: `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `owner_user_id UUID REFERENCES public.users(id)`, `name`, `branch_code`, `city`, `address`, `status`.
   - `gym_operating_hours`: Preserves daily opening/closing schedules for gym facilities.
   - `gym_trainers`: Links `gym_id BIGINT` and `trainer_user_id UUID`.
   - `facilities`, `equipment`, `gym_facilities`, `gym_equipment`, `gym_photos`.

3. **Trainer Profiles & Scheduling:**
   - `trainer_profiles`: `user_id UUID PRIMARY KEY REFERENCES public.users(id)`, `certification_name`, `certifying_body`, `experience_years`, `bio`, `hourly_rate`, `rating`.
   - `trainer_assignments`: `trainer_user_id UUID`, `user_id UUID`, `gym_id BIGINT`, `status` (`active`, `paused`, `terminated`), `start_date`.
   - `trainer_availability_rules`: Weekly recurring shift schedule (`day_of_week`, `start_time`, `end_time`, `is_available`).
   - `trainer_sessions`: 1-on-1 scheduled PT sessions (`trainer_user_id UUID`, `member_user_id UUID`, `session_date`, `start_time`, `end_time`, `status`).
   - `trainer_notes`: Private coach observations (`trainer_user_id UUID`, `user_id UUID`, `note_type`, `note_text`, `is_visible_to_user`).

4. **Workouts & Movement Catalog:**
   - `muscle_groups`, `body_regions`, `exercises`, `exercise_media`, `exercise_muscles`, `exercise_equipment`: Global reference tables readable by all authenticated users.
   - `workout_plans`, `plan_days`, `plan_day_exercises`: Created by trainers/admins.
   - `plan_assignments`: Assigns plans to `user_id UUID`.
   - `workout_sessions`, `session_exercises`, `exercise_set_logs`: `user_id UUID NOT NULL REFERENCES public.users(id)`.

5. **Biometrics, Nutrition & Attendance:**
   - `fitness_goals`: `user_id UUID`, `title`, `goal_type`, `target_weight_kg`, `target_date`, `status`.
   - `body_measurements`: `user_id UUID`, `recorded_at TIMESTAMPTZ`, `weight_kg`, `body_fat_pct`, `chest_cm`, `waist_cm`, `hips_cm`, `arms_cm`.
   - `attendance`: `user_id UUID`, `gym_id BIGINT`, `check_in_time TIMESTAMPTZ`, `check_in_method` (`QR_SCAN`), `status`.
   - `foods`, `food_categories`, `meals`, `meal_items`, `water_logs`: `user_id UUID`.

6. **Communication, Reports & Platform Settings:**
   - `conversations`: `participant_one_id UUID`, `participant_two_id UUID`.
   - `messages`: `conversation_id BIGINT`, `sender_id UUID`, `message_text TEXT`, `sent_at TIMESTAMPTZ`.
   - `notifications`: `user_id UUID`, `title`, `message`, `is_read BOOLEAN`.
   - `health_reports`: General fitness assessments and body composition files (all clinical/medical consultation attributes excluded).

---

## 4. Authentication Integration: Supabase Auth

### 4.1 Authentication Architecture Flow

```
┌──────────────┐                  ┌────────────────┐                  ┌───────────────────┐
│ User Browser │                  │ FitSync PHP    │                  │   Supabase Auth   │
└──────┬───────┘                  └───────┬────────┘                  └─────────┬─────────┘
       │                                  │                                     │
       │  1. POST /login.php              │                                     │
       │     (email, password, csrf)      │                                     │
       ├─────────────────────────────────>│                                     │
       │                                  │  2. POST /auth/v1/token             │
       │                                  │     grant_type=password             │
       │                                  │     (email, password)               │
       │                                  ├────────────────────────────────────>│
       │                                  │                                     │
       │                                  │  3. 200 OK                          │
       │                                  │     access_token (JWT, 3600s),      │
       │                                  │     refresh_token, user UUID        │
       │                                  │<────────────────────────────────────┤
       │                                  │                                     │
       │                                  │  4. Query public.users via PostgREST│
       │                                  │     (Bearer access_token)           │
       │                                  │     Fetch trusted role & profile    │
       │                                  │                                     │
       │                                  │  5. Initialize Secure PHP Session:  │
       │                                  │     $_SESSION['user_id'] = UUID     │
       │                                  │     $_SESSION['jwt'] = access_token │
       │                                  │     $_SESSION['refresh'] = token    │
       │                                  │     $_SESSION['role'] = 'trainer'   │
       │                                  │     session_regenerate_id(true)     │
       │                                  │                                     │
       │  6. 302 Redirect to Portal       │                                     │
       │     (Set-Cookie: PHPSESSID)      │                                     │
       │     Location: /trainer/dashboard │                                     │
       │<─────────────────────────────────┤                                     │
       │                                  │                                     │
```

### 4.2 Seamless Token Lifecycle & Auto-Refresh
Supabase JWTs expire after 3600 seconds (1 hour). In `includes/session.php` and `services/SupabaseAuth.php`:
1. Every authenticated request checks `$_SESSION['token_expires_at']`.
2. If remaining lifespan is `< 300 seconds` (5 minutes), PHP automatically issues a background cURL request to Supabase Auth:
   ```http
   POST /auth/v1/token?grant_type=refresh_token
   Content-Type: application/json
   apikey: {SUPABASE_PUBLISHABLE_KEY}

   {"refresh_token": "{STORED_REFRESH_TOKEN}"}
   ```
3. The new `access_token` and rotated `refresh_token` are saved back into the server session transparently. The athlete or coach never experiences a mid-workout session interruption.

---

## 5. Row Level Security (RLS) Policy Design

Every single public table will execute `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`.

### 5.1 Helper Function for Fast Role Checking
```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 5.2 RLS Rules Matrix by Portal Role

#### 1. User (Gym Athlete) RLS Policies
- **`public.users`:**
  - `SELECT`: `id = auth.uid() OR public.get_user_role() IN ('trainer', 'gym_owner', 'admin')`
  - `UPDATE`: `id = auth.uid()`
- **`public.body_measurements`, `public.fitness_goals`, `public.nutrition_logs`, `public.water_logs`:**
  - `SELECT / INSERT / UPDATE / DELETE`: `user_id = auth.uid()`
- **`public.workout_sessions`, `public.session_exercises`, `public.exercise_set_logs`:**
  - `ALL`: `user_id = auth.uid()`
- **`public.attendance`:**
  - `SELECT`: `user_id = auth.uid()`
- **`public.trainer_assignments`:**
  - `SELECT`: `user_id = auth.uid()`

#### 2. Trainer (Coach) RLS Policies
- **`public.trainer_profiles`:**
  - `SELECT`: `true` (public to authenticated users for directory listing)
  - `UPDATE`: `user_id = auth.uid()`
- **`public.trainer_assignments`:**
  - `SELECT`: `trainer_user_id = auth.uid()`
- **`public.trainer_notes`:**
  - `SELECT`: `trainer_user_id = auth.uid() OR (user_id = auth.uid() AND is_visible_to_user = true)`
  - `INSERT / UPDATE`: `trainer_user_id = auth.uid()`
- **Assigned Members Telemetry (`body_measurements`, `workout_sessions`, `fitness_goals`):**
  - `SELECT`:
    ```sql
    EXISTS (
      SELECT 1 FROM public.trainer_assignments
      WHERE trainer_user_id = auth.uid()
        AND user_id = body_measurements.user_id
        AND status = 'active'
    )
    ```
- **Assigned Member Attendance:**
  - `SELECT`:
    ```sql
    EXISTS (
      SELECT 1 FROM public.trainer_assignments
      WHERE trainer_user_id = auth.uid()
        AND user_id = attendance.user_id
        AND status = 'active'
    )
    ```
  - `INSERT / UPDATE / DELETE`: Denied (read-only verification).

#### 3. Gym Owner RLS Policies
- **`public.gyms`:**
  - `ALL`: `owner_user_id = auth.uid()`
- **`public.gym_operating_hours`, `public.gym_facilities`, `public.gym_equipment`:**
  - `ALL`: `EXISTS (SELECT 1 FROM public.gyms WHERE id = gym_id AND owner_user_id = auth.uid())`
- **`public.memberships`:**
  - `SELECT / UPDATE`: `EXISTS (SELECT 1 FROM public.gyms WHERE id = memberships.gym_id AND owner_user_id = auth.uid())`
- **Gym Attendance:**
  - `SELECT`: `EXISTS (SELECT 1 FROM public.gyms WHERE id = attendance.gym_id AND owner_user_id = auth.uid())`

#### 4. Platform Admin Policies
- All tables grant administrative oversight when `public.get_user_role() = 'admin'`.

---

## 6. PHP Service Layer Specification

The service layer encapsulates all HTTP and PostgREST communications with Supabase.

```text
FIT-SYNC/
├── services/
│   ├── SupabaseClient.php     # Base cURL transport, SSL, timeouts, response decoding
│   ├── SupabaseAuth.php       # GoTrue Auth API integration (signup, login, refresh)
│   ├── SupabaseDatabase.php   # PostgREST query builder (from, select, insert, eq, order)
│   ├── SupabaseStorage.php    # Object storage client (upload, getUrl, signedUrl)
│   └── SupabaseRealtime.php   # Realtime events and SSE notification poller
```

### 6.1 `SupabaseClient.php` Interface
- `request(string $method, string $path, array $data = [], ?string $jwt = null, bool $useSecretKey = false): array`
- Adds standard headers:
  - `apikey: {SUPABASE_PUBLISHABLE_KEY}`
  - `Authorization: Bearer {JWT or SECRET_KEY}`
  - `Content-Type: application/json`
  - `Prefer: return=representation` (when mutations return data)
- Comprehensive cURL error capturing (`CURLOPT_SSL_VERIFYPEER => true`, `CURLOPT_TIMEOUT => 15`).

### 6.2 `SupabaseDatabase.php` Query Interface
Allows fluent PostgREST operations that pass the authenticated user's JWT so RLS is automatically enforced:
```php
// Example: Trainer querying assigned members
$db = new SupabaseDatabase($_SESSION['jwt']);
$members = $db->from('trainer_assignments')
              ->select('*, users!inner(full_name, email, user_profiles(*))')
              ->eq('trainer_user_id', $_SESSION['user_id'])
              ->eq('status', 'active')
              ->get();
```

---

## 7. PHP Endpoint Migration Map

| Existing MySQL Endpoint / Script | New Supabase Architecture Replacement | Auth / Security Mode |
|---|---|---|
| `login.php` / `api/auth/login.php` | Invokes `SupabaseAuth::login($email, $password)`. On success, caches user JWT & UUID in `$_SESSION`. | Public with CSRF |
| `register.php` / `api/auth/register.php` | Invokes `SupabaseAuth::signup($email, $password)` + inserts profile in `public.users`. | Public with CSRF |
| `logout.php` / `api/auth/logout.php` | Invokes `SupabaseAuth::logout($jwt)` + executes `session_destroy()`. | Authenticated Session |
| `api/auth/me.php` | Returns sanitized `$_SESSION['user']` and active role. | Authenticated Session |
| `includes/trainer_data.php` | Refactored to query PostgREST tables via `SupabaseDatabase` using trainer's JWT. | Trainer Role + RLS |
| `api/trainer/members.php` | Queries `trainer_assignments` join `users` via PostgREST. | Trainer Role + RLS |
| `api/trainer/member_details.php` | Queries member biometrics, workouts, attendance. RLS returns empty if unassigned (triggers 403). | Trainer Role + RLS |
| `api/trainer/notes.php` | Inserts note into `trainer_notes` with `trainer_user_id = auth.uid()`. | Trainer Role + RLS |
| `api/trainer/schedule.php` | Queries `trainer_sessions` and `trainer_availability_rules`. | Trainer Role + RLS |
| `user/dashboard.php` | Reads athlete telemetry via PostgREST passing user's JWT. | User Role + RLS |
| `user/workouts.php` | Logs sets into `workout_sessions` and `exercise_set_logs`. | User Role + RLS |

---

## 8. Frontend Preservation Strategy

1. **DOM & Asset Integrity:**
   - [`index.html`](file:///c:/FIT-SYNC%20AI%20php/index.html) and [`user/portal_template.php`](file:///c:/FIT-SYNC%20AI%20php/user/portal_template.php) are preserved verbatim.
   - All interactive components (workout logger, anatomy SVG, rest timer, Chart.js instances, modal overlays) remain untouched.
2. **Session Injection Bridge:**
   - PHP will continue injecting `window.__AUTHENTICATED_USER__` and `window.__INITIAL_VIEW__` into the User Portal layout.
   - `window.__AUTHENTICATED_USER__` will simply carry the Supabase `UUID` in place of the old numeric integer.
3. **No Direct Supabase JS SDK in Frontend:**
   - Browser JavaScript will NOT include the Supabase JavaScript library with raw keys.
   - All AJAX calls continue targeting local PHP `/api/...` endpoints, keeping network topology identical and protecting against CORS or credential leaks.

---

## 9. Data Migration & Demo Seed Strategy

### 9.1 User Identity UUID Mapping
Because Supabase Auth generates its own cryptographically random UUIDs (`v4`), existing numeric user IDs (`1` to `8`) must be cleanly mapped:

```sql
CREATE TABLE IF NOT EXISTS migration_user_id_map (
    old_id BIGINT PRIMARY KEY,
    new_uuid UUID NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);
```

### 9.2 Seed Accounts Migration Plan

| Role | Email | Old MySQL ID | Supabase Auth Status | Assigned Gym Branch |
|---|---|---|---|---|
| **Platform Admin** | `admin@fitsync.ai` | `1` | To be created in Supabase Auth | Global Headquarters |
| **Gym Owner** | `owner@fitzone.com` | `2` | To be created in Supabase Auth | FitZone Fitness (Alkapuri) |
| **Trainer (Coach)** | `coach@fitsync.health` | `3` | To be created in Supabase Auth | FitZone Fitness (Alkapuri) |
| **Athlete (User)** | `aarav.patel@fitsync.ai` | `8` | To be created in Supabase Auth | FitZone Fitness (Alkapuri) |
| **Athlete (User)** | `isha.kulkarni@fitsync.ai` | `6` | To be created in Supabase Auth | FitZone Fitness (Alkapuri) |
| **Athlete (User)** | `ritika.sharma@fitsync.ai` | `7` | To be created in Supabase Auth | FitZone Fitness (Alkapuri) |

### 9.3 Catalog Seed Retention
All foundational catalog records from `fitsync_mysql_schema.sql` will be imported directly:
- **38 Certified Exercises** (Bench press, squat, deadlift, overhead press, etc.).
- **Muscle Groups & Body Regions** (Chest, back, legs, deltoids, core).
- **Gym Facilities & Equipment** (Olympic barbells, cable machines, dumbbells).
- **Food Categories & Nutrition Items** (Proteins, complex carbs, healthy fats).

---

## 10. Risk Assessment & Mitigation Matrix

| Risk / Architectural Challenge | Impact | Mitigation Strategy |
|---|---|---|
| **Foreign Key UUID Mismatch** | High | Use the `migration_user_id_map` translation table during data migration. All child tables will reference the Supabase UUID. |
| **Supabase JWT 1-Hour Expiration** | Medium | Background auto-refresh in `includes/session.php` whenever remaining JWT validity is under 5 minutes. |
| **PostgREST Latency over HTTP** | Medium | Use keep-alive cURL handles (`CURLOPT_TCP_KEEPALIVE`) and select only required column projections. |
| **Supabase Auth Email Confirmation Gate** | Medium | In development, email confirmation will be disabled in the Supabase Dashboard, or users will be registered with `email_confirm: true` via admin API. |
| **Accidental Frontend Credential Leakage** | Critical | Browser communicates only with PHP endpoints; `SUPABASE_SECRET_KEY` is never transmitted outside server memory. |
| **MySQL Rollback Protection** | Low | The existing MySQL database and schema file `database/fitsync_mysql_schema.sql` will remain untouched as a rollback fallback until Stage G validation. |

---

## 11. Stage-by-Stage Migration Roadmap

```
[ Stage A: Architecture Audit & Migration Plan ]  <=== (COMPLETED IN THIS TURN)
                      │
                      ▼
[ Stage B: PostgreSQL Schema & Seed Migration ]
  • Convert 81 tables to PostgreSQL DDL with UUID user keys
  • Create migration SQL script (database/migrations/001_initial_schema.sql)
  • Test DDL syntax and foreign key integrity
                      │
                      ▼
[ Stage C: Supabase Configuration & PHP Services ]
  • Create config/supabase.php and .env.example
  • Implement services/SupabaseClient.php
  • Implement services/SupabaseAuth.php (signup, login, refresh, logout)
  • Implement services/SupabaseDatabase.php (PostgREST query builder)
  • Replace login.php, register.php, logout.php backend logic
                      │
                      ▼
[ Stage D: Row Level Security (RLS) Implementation ]
  • Write and apply RLS policies for all 81 tables
  • Verify user isolation and trainer assigned-member gates
                      │
                      ▼
[ Stage E: Portal Integration & Endpoint Migration ]
  • Connect User Portal (/user/) to PostgREST
  • Connect Trainer Portal (/trainer/) to PostgREST
  • Refactor includes/trainer_data.php to use SupabaseDatabase
                      │
                      ▼
[ Stage F: Storage & Realtime Enhancements ]
  • Implement services/SupabaseStorage.php for avatar & progress uploads
  • Configure realtime notification stream
                      │
                      ▼
[ Stage G: Full Verification & Automated Regression Suite ]
  • Run automated test suite: Auth, RBAC, RLS privacy, UI regression
  • Verify 100% preservation of User and Trainer dashboards
                      │
                      ▼
[ Stage H: Cleanup & Final Documentation ]
  • Archive obsolete MySQL-specific files safely
  • Deliver final project report
```

---

## 12. Verification & Next Steps

Stage A is complete. **No runtime files were modified, no existing code was broken, and no remote changes were made.**

The migration blueprint in [`SUPABASE_MIGRATION_PLAN.md`](file:///c:/FIT-SYNC%20AI%20php/SUPABASE_MIGRATION_PLAN.md) establishes the complete roadmap.

### Awaiting User Authorization:
Please confirm approval of this master plan so we may proceed to **Stage B: Database Schema & Migration Script Generation (MySQL to PostgreSQL DDL)**.
