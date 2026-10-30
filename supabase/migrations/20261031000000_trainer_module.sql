-- ============================================================================
-- FITSYNC AI — TRAINER MODULE DATABASE MIGRATION
-- Production-Ready Schema Extensions & Row Level Security Policies
-- ============================================================================

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

-- 2. TRAINER SESSIONS (FLOOR 1-ON-1 & ONLINE VIDEO CONSULTATIONS)
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

-- 3. PERSISTENT TRAINER-MEMBER MESSAGES
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

-- 4. EXTEND TRAINER INTERVENTIONS IF NOT PRESENT
DO $$ BEGIN
  ALTER TABLE public.trainer_interventions 
    ADD COLUMN IF NOT EXISTS source_type insight_source_enum NOT NULL DEFAULT 'rule_based',
    ADD COLUMN IF NOT EXISTS reason TEXT,
    ADD COLUMN IF NOT EXISTS date_detected DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS attention_status member_attention_status_enum NOT NULL DEFAULT 'needs_attention';
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.trainer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_messages ENABLE ROW LEVEL SECURITY;

-- Trainer Sessions RLS:
-- Trainers can view and update sessions within their assigned gym where they are the trainer.
-- Members can view their own scheduled sessions.
DO $$ BEGIN
  DROP POLICY IF EXISTS "Trainers can manage their own gym sessions" ON public.trainer_sessions;
  CREATE POLICY "Trainers can manage their own gym sessions"
    ON public.trainer_sessions
    FOR ALL
    USING (
      auth.uid() = trainer_id OR
      auth.uid() = member_id
    )
    WITH CHECK (
      auth.uid() = trainer_id OR
      auth.uid() = member_id
    );
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Trainer Messages RLS:
-- Only participants (trainer or member) can read and post messages in their thread.
DO $$ BEGIN
  DROP POLICY IF EXISTS "Participants can view and post messages" ON public.trainer_messages;
  CREATE POLICY "Participants can view and post messages"
    ON public.trainer_messages
    FOR ALL
    USING (
      auth.uid() = trainer_id OR
      auth.uid() = member_id
    )
    WITH CHECK (
      auth.uid() = sender_id
    );
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Trainer Member Assignments RLS:
-- Trainers can only view members assigned to them in their gym.
DO $$ BEGIN
  DROP POLICY IF EXISTS "Trainers can view their assigned members" ON public.trainer_member_assignments;
  CREATE POLICY "Trainers can view their assigned members"
    ON public.trainer_member_assignments
    FOR SELECT
    USING (
      auth.uid() = trainer_id OR
      auth.uid() = member_id
    );
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Gym Attendance RLS:
-- Trainers can view attendance records of members in their gym.
DO $$ BEGIN
  DROP POLICY IF EXISTS "Trainers can view gym attendance" ON public.gym_attendance;
  CREATE POLICY "Trainers can view gym attendance"
    ON public.gym_attendance
    FOR SELECT
    USING (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM public.trainers t
        JOIN public.trainer_member_assignments tma ON tma.trainer_id = t.id
        WHERE t.id = auth.uid() AND tma.member_id = public.gym_attendance.user_id
      )
    );
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Workout Sessions & Set Logs RLS:
-- Trainers can view workouts of their assigned members.
DO $$ BEGIN
  DROP POLICY IF EXISTS "Trainers can view assigned member workout sessions" ON public.workout_sessions;
  CREATE POLICY "Trainers can view assigned member workout sessions"
    ON public.workout_sessions
    FOR SELECT
    USING (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM public.trainer_member_assignments tma
        WHERE tma.trainer_id = auth.uid() AND tma.member_id = public.workout_sessions.user_id
      )
    );
EXCEPTION WHEN undefined_object THEN null; END $$;

