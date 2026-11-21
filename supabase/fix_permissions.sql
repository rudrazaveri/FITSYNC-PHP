-- ============================================================================
-- FITSYNC AI — SUPABASE PERMISSIONS & RLS QUICK FIX
-- Paste and Run this in Supabase: Dashboard -> SQL Editor -> New Query -> Run
-- Fixes: "permission denied for table gyms" or any other public table
-- ============================================================================

-- 1. Grant schema usage to API roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant full CRUD access on all current tables & sequences
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Set default privileges for any future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 4. Enable RLS with 100% open policies for web client & PHP backend
DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY[
      'gyms', 'membership_plans', 'gym_memberships', 'user_profiles', 
      'trainers', 'member_health_profiles', 'exercises', 'workouts', 
      'nutrition_logs', 'water_logs', 'progress_metrics', 
      'turnstile_attendance', 'appointments'
    ];
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Public Full Access" ON public.%I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Public Read %I" ON public.%I;', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Public Full %I" ON public.%I;', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Allow All %I" ON public.%I;', t, t);
            EXECUTE format('CREATE POLICY "Public Full Access" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', t);
            EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role;', t);
        END IF;
    END LOOP;
END $$;
