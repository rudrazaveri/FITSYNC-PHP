-- ============================================================================
-- FITSYNC AI — MEMBER & TRAINER FEATURE EXTENSIONS
-- Tables: custom_workout_plans, membership_requests, trainer_connection_requests,
--         member_progress_logs, and profile column extensions.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EXTEND USER_PROFILES
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS membership_status TEXT NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS membership_tier TEXT NOT NULL DEFAULT 'Platinum Elite Pass',
  ADD COLUMN IF NOT EXISTS assigned_trainer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{
    "workoutReminders": true,
    "nutritionAlerts": true,
    "coachMessages": true,
    "gymAnnouncements": true
  }'::JSONB;

-- 2. EXTEND TRAINERS TABLE
ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS qualifications TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'On Floor';

-- 3. CUSTOM WORKOUT PLANS (SECTION 5.3 & 5.4)
CREATE TABLE IF NOT EXISTS public.custom_workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  trainer_name TEXT NOT NULL,
  assigned_member_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assigned_member_name TEXT NOT NULL,
  assigned_member_avatar TEXT,
  name TEXT NOT NULL,
  description TEXT,
  workout_days TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Draft', 'Completed', 'Paused')),
  trainer_notes TEXT,
  exercises JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GYM MEMBERSHIP REQUESTS (SECTION 3.2)
CREATE TABLE IF NOT EXISTS public.membership_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  gym_name TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  price TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Approval' CHECK (status IN ('Pending Approval', 'Approved', 'Active', 'Rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRAINER CONNECTION REQUESTS (SECTION 3.3)
CREATE TABLE IF NOT EXISTS public.trainer_connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_avatar TEXT,
  trainer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  trainer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Approval' CHECK (status IN ('Pending Approval', 'Connected', 'Rejected')),
  message TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MEMBER PROGRESS LOGS & BODY MEASUREMENTS (SECTION 3.11)
CREATE TABLE IF NOT EXISTS public.member_progress_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2) NOT NULL,
  waist_cm NUMERIC(5,2),
  chest_cm NUMERIC(5,2),
  biceps_cm NUMERIC(5,2),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.custom_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_progress_logs ENABLE ROW LEVEL SECURITY;

-- Custom Workout Plans RLS
DROP POLICY IF EXISTS "Trainers manage own created workout plans" ON public.custom_workout_plans;
CREATE POLICY "Trainers manage own created workout plans"
  ON public.custom_workout_plans FOR ALL
  USING (auth.uid() = trainer_id)
  WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Members view assigned workout plans" ON public.custom_workout_plans;
CREATE POLICY "Members view assigned workout plans"
  ON public.custom_workout_plans FOR SELECT
  USING (auth.uid() = assigned_member_id);

-- Membership Requests RLS
DROP POLICY IF EXISTS "Users can view and create their own membership requests" ON public.membership_requests;
CREATE POLICY "Users can view and create their own membership requests"
  ON public.membership_requests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trainer Connection Requests RLS
DROP POLICY IF EXISTS "Members can manage their own connection requests" ON public.trainer_connection_requests;
CREATE POLICY "Members can manage their own connection requests"
  ON public.trainer_connection_requests FOR ALL
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Trainers can view and update connection requests assigned to them" ON public.trainer_connection_requests;
CREATE POLICY "Trainers can view and update connection requests assigned to them"
  ON public.trainer_connection_requests FOR ALL
  USING (auth.uid() = trainer_id);

-- Member Progress Logs RLS
DROP POLICY IF EXISTS "Members manage their own progress logs" ON public.member_progress_logs;
CREATE POLICY "Members manage their own progress logs"
  ON public.member_progress_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Trainers view progress logs of assigned members" ON public.member_progress_logs;
CREATE POLICY "Trainers view progress logs of assigned members"
  ON public.member_progress_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_member_assignments tma
      WHERE tma.trainer_id = auth.uid() AND tma.member_id = public.member_progress_logs.user_id
    )
  );

-- 8. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

