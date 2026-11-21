# ⚡ Connecting FitSync to Supabase (PostgreSQL)

FitSync includes **dual-layer cloud synchronization**:
1. **Frontend Cloud Sync (Vanilla JS):** Real-time client sync for workouts, water logs, meal logs, assessments, and attendance.
2. **Backend PHP Integration:** PostgREST client in `config/supabase.php` for server-side endpoints.

---

## Step 1: Get Your Supabase Project Credentials

1. Go to **[https://supabase.com/dashboard](https://supabase.com/dashboard)** and log in.
2. Select your project (or click **"New project"** and choose a project name, e.g. `fitsync-db`).
3. In the left sidebar, click the **Gear icon (Project Settings)** $\rightarrow$ **API** (or **Data API** in the new dashboard).
4. Find the following two values:
   - **Project URL:** `https://your-project-id.supabase.co`
   - **Project API Keys $\rightarrow$ `anon` / `public`:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Step 2: Create the Database Tables (1-Click SQL)

1. In your Supabase dashboard, click **SQL Editor** in the left menu.
2. Click **New Query**.
3. Open and copy all code from the file:
   [`supabase/complete_schema.sql`](file:///c:/FIT-SYNC%20AI%20php/supabase/complete_schema.sql)
4. Paste the SQL into the editor and click **Run** (or press `Ctrl + Enter`).

> [!NOTE]
> This creates all **14 relational tables**, sets up Row-Level Security (RLS) policies allowing secure client operations, and populates initial sample data for gyms, coaches, exercises, and consultations.

---

## Step 3: Connect FitSync to Your Supabase Instance

You can connect in either of two ways:

### Option A: Directly from the FitSync Web UI (Zero Code)
1. Open your FitSync dashboard in your browser:
   [http://127.0.0.1:8085/index.html](http://127.0.0.1:8085/index.html)
2. In the left navigation sidebar, click **Settings**.
3. Scroll down to the **"Supabase PostgreSQL Cloud Database"** card.
4. Paste your **Project URL** and **Anon API Key**.
5. Click **Test Connection** (you will see a green confirmation toast).
6. Click **Save & Connect**.

*The dashboard will instantly switch from "LocalStorage Mode" to "● Connected to Supabase" and begin syncing your logs to the cloud!*

---

### Option B: In `.env.local` (For PHP Backend & Persistent Server Config)
Open [`.env.local`](file:///c:/FIT-SYNC%20AI%20php/.env.local) and replace the placeholder values:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:8085
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_real_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_optional_service_role_key
```

Save the file. Both the PHP API (`api/supabase_status.php`) and backend templates will now talk directly to your Supabase PostgreSQL instance.

---

## Step 4: Verification Checklist

- [ ] Run `complete_schema.sql` in Supabase SQL Editor.
- [ ] Save your Project URL and Anon Key in FitSync Settings.
- [ ] Log a glass of water (+250ml) on the dashboard $\rightarrow$ Check `water_logs` in Supabase Table Editor.
- [ ] Log a meal in Quick Actions $\rightarrow$ Check `nutrition_logs` in Supabase Table Editor.
- [ ] Click "Simulate Turnstile Check-In" $\rightarrow$ Check `turnstile_attendance` in Supabase Table Editor.
