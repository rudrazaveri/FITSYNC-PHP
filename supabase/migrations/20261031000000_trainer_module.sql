-- ============================================================================
-- FITSYNC AI — TRAINER MODULE DATABASE MIGRATION
-- Production-Ready Schema Extensions & Row Level Security Policies
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS FOR TRAINER MODULE
DO $$ BEGIN
  CREATE TYPE trainer_session_type_enum AS ENUM ('floor_1on1', 'online_video');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE trainer_session_status_enum AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE insight_source_enum AS ENUM ('rule_based', 'ai_insight');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE member_attention_status_enum AS ENUM ('on_track', 'needs_attention', 'high_attention');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ENSURE TRAINERS TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.trainers (
  id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  specializations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  certifications TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  experience_years INT NOT NULL DEFAULT 1,
  rating NUMERIC(3,2) DEFAULT 4.9,
  bio TEXT,
  weekly_schedule JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ENSURE TRAINER MEMBER ASSIGNMENTS TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.trainer_member_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE(trainer_id, member_id)
);

-- 4. ENSURE TRAINER INTERVENTIONS TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.trainer_interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  attention_level TEXT NOT NULL DEFAULT 'moderate',
  issue_description TEXT NOT NULL,
  ai_recommendation_note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  source_type insight_source_enum NOT NULL DEFAULT 'rule_based',
  reason TEXT,
  date_detected DATE NOT NULL DEFAULT CURRENT_DATE,
  attention_status member_attention_status_enum NOT NULL DEFAULT 'needs_attention',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend trainer interventions columns if already existing from prior schema
DO $$ BEGIN
  ALTER TABLE public.trainer_interventions 
    ADD COLUMN IF NOT EXISTS source_type insight_source_enum NOT NULL DEFAULT 'rule_based',
    ADD COLUMN IF NOT EXISTS reason TEXT,
    ADD COLUMN IF NOT EXISTS date_detected DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS attention_status member_attention_status_enum NOT NULL DEFAULT 'needs_attention';
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- 5. TRAINER SESSIONS (FLOOR 1-ON-1 & ONLINE VIDEO CONSULTATIONS)
CREATE TABLE IF NOT EXISTS public.trainer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  session_type trainer_session_type_enum NOT NULL DEFAULT 'floor_1on1',
  status trainer_session_status_enum NOT NULL DEFAULT 'confirmed',
  meeting_link TEXT,
  telehealth_room_id TEXT NOT NULL DEFAULT uuid_generate_v4()::TEXT,
  focus_area TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PERSISTENT TRAINER-MEMBER MESSAGES
CREATE TABLE IF NOT EXISTS public.trainer_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('trainer', 'member')),
  sender_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'form_check', 'nutrition', 'schedule')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_member_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_messages ENABLE ROW LEVEL SECURITY;

-- Trainers Table Policies
DROP POLICY IF EXISTS "Public read trainers" ON public.trainers;
CREATE POLICY "Public read trainers" 
  ON public.trainers FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Trainers manage own trainer record" ON public.trainers;
CREATE POLICY "Trainers manage own trainer record" 
  ON public.trainers FOR ALL USING (auth.uid() = id);

-- Trainer Interventions Policies
DROP POLICY IF EXISTS "Trainers manage own interventions" ON public.trainer_interventions;
CREATE POLICY "Trainers manage own interventions" 
  ON public.trainer_interventions FOR ALL USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Members view own interventions" ON public.trainer_interventions;
CREATE POLICY "Members view own interventions" 
  ON public.trainer_interventions FOR SELECT USING (auth.uid() = member_id);

-- Trainer Sessions RLS
DROP POLICY IF EXISTS "Trainers can manage their own gym sessions" ON public.trainer_sessions;
CREATE POLICY "Trainers can manage their own gym sessions"
  ON public.trainer_sessions FOR ALL
  USING (auth.uid() = trainer_id OR auth.uid() = member_id)
  WITH CHECK (auth.uid() = trainer_id OR auth.uid() = member_id);

-- Trainer Messages RLS
DROP POLICY IF EXISTS "Participants can view and post messages" ON public.trainer_messages;
CREATE POLICY "Participants can view and post messages"
  ON public.trainer_messages FOR ALL
  USING (auth.uid() = trainer_id OR auth.uid() = member_id)
  WITH CHECK (auth.uid() = sender_id);

-- Trainer Member Assignments RLS
DROP POLICY IF EXISTS "Trainers can view their assigned members" ON public.trainer_member_assignments;
CREATE POLICY "Trainers can view their assigned members"
  ON public.trainer_member_assignments FOR SELECT
  USING (auth.uid() = trainer_id OR auth.uid() = member_id);

-- Gym Attendance RLS: Trainers can view attendance records of assigned members
DROP POLICY IF EXISTS "Trainers can view gym attendance" ON public.gym_attendance;
CREATE POLICY "Trainers can view gym attendance"
  ON public.gym_attendance FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.trainers t
      JOIN public.trainer_member_assignments tma ON tma.trainer_id = t.id
      WHERE t.id = auth.uid() AND tma.member_id = public.gym_attendance.user_id
    )
  );

-- Workout Sessions & Set Logs RLS: Trainers can view workouts of assigned members
DROP POLICY IF EXISTS "Trainers can view assigned member workout sessions" ON public.workout_sessions;
CREATE POLICY "Trainers can view assigned member workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.trainer_member_assignments tma
      WHERE tma.trainer_id = auth.uid() AND tma.member_id = public.workout_sessions.user_id
    )
  );

-- 8. TRIGGER TO SYNC AUTH.USERS TO PUBLIC.USER_PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::user_role_enum, 'member'::user_role_enum),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. PERMISSIONS GRANT
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
