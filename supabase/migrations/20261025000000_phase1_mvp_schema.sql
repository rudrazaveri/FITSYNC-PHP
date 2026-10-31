-- ============================================================================
-- FITSYNC AI — PHASE 1 (40% MVP) INITIAL DATABASE SCHEMA
-- Focused on Member Authentication, Gym Onboarding, Telemetry & Workout Sets
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ENUMS FOR INITIAL PHASE
DO $$ BEGIN
  CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE activity_level_enum AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE fitness_goal_enum AS ENUM ('muscle_gain', 'fat_loss', 'strength', 'endurance', 'general_fitness');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE dietary_preference_enum AS ENUM ('vegetarian', 'eggetarian', 'non_vegetarian', 'vegan');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MULTI-GYM NETWORK & BRANCHES
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  rating NUMERIC(3,2) DEFAULT 4.8,
  reviews_count INT DEFAULT 0,
  attendance_rate NUMERIC(5,2) DEFAULT 85.00,
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_inr INT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  access_features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gym_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gym_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  method TEXT NOT NULL DEFAULT 'qr_turnstile'
);

-- 3. HEALTH ASSESSMENT & BIOMETRICS (BMR & TDEE)
CREATE TABLE IF NOT EXISTS public.member_health_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  age INT NOT NULL CHECK (age >= 13 AND age <= 100),
  gender gender_enum NOT NULL,
  height_cm NUMERIC(5,2) NOT NULL CHECK (height_cm >= 100 AND height_cm <= 250),
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg >= 30 AND weight_kg <= 300),
  waist_cm NUMERIC(5,2),
  neck_cm NUMERIC(5,2),
  hip_cm NUMERIC(5,2),
  activity_level activity_level_enum NOT NULL,
  exercise_frequency TEXT NOT NULL,
  primary_goal fitness_goal_enum NOT NULL,
  dietary_preference dietary_preference_enum NOT NULL,
  bmi NUMERIC(4,2) NOT NULL,
  bmi_category TEXT NOT NULL,
  bmr_kcal INT NOT NULL,
  tdee_kcal INT NOT NULL,
  target_calories INT NOT NULL,
  target_protein_g INT NOT NULL,
  target_carbs_g INT NOT NULL,
  target_fat_g INT NOT NULL,
  target_water_ml INT NOT NULL DEFAULT 3300,
  body_fat_pct NUMERIC(4,2),
  fitness_score INT NOT NULL DEFAULT 80,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EXERCISES & WORKOUT ROUTINES
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  target_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] DEFAULT ARRAY[]::TEXT[],
  equipment TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  type TEXT NOT NULL,
  thumbnail_url TEXT,
  instructions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  common_mistakes TEXT,
  trainer_tip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  focus TEXT NOT NULL,
  target_goal fitness_goal_enum NOT NULL,
  difficulty TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  target_sets INT NOT NULL DEFAULT 3,
  target_reps TEXT NOT NULL DEFAULT '8-12',
  rest_seconds INT NOT NULL DEFAULT 90,
  UNIQUE(template_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INT DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.workout_set_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  set_number INT NOT NULL,
  reps_completed INT NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, exercise_id, set_number)
);

-- 5. NUTRITION & DAILY MEALS
CREATE TABLE IF NOT EXISTS public.predefined_diet_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  target_goal fitness_goal_enum NOT NULL,
  dietary_variant dietary_preference_enum NOT NULL,
  daily_calories INT NOT NULL,
  protein_g INT NOT NULL,
  carbs_g INT NOT NULL,
  fat_g INT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(target_goal, dietary_variant)
);

CREATE TABLE IF NOT EXISTS public.logged_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calories INT NOT NULL,
  protein_g INT NOT NULL,
  carbs_g INT NOT NULL,
  fat_g INT NOT NULL,
  food_items TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hydration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount_ml INT NOT NULL DEFAULT 250,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update their own data
DROP POLICY IF EXISTS "Users read own profile" ON public.user_profiles;
CREATE POLICY "Users read own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users read own health profile" ON public.member_health_profiles;
CREATE POLICY "Users read own health profile" ON public.member_health_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert/update own health profile" ON public.member_health_profiles;
CREATE POLICY "Users insert/update own health profile" ON public.member_health_profiles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own attendance" ON public.gym_attendance;
CREATE POLICY "Users read own attendance" ON public.gym_attendance FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own workouts" ON public.workout_sessions;
CREATE POLICY "Users read own workouts" ON public.workout_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own meals" ON public.logged_meals;
CREATE POLICY "Users read own meals" ON public.logged_meals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own hydration" ON public.hydration_logs;
CREATE POLICY "Users read own hydration" ON public.hydration_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Public read access for global catalog
DROP POLICY IF EXISTS "Public read gyms" ON public.gyms;
CREATE POLICY "Public read gyms" ON public.gyms FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Public read plans" ON public.membership_plans;
CREATE POLICY "Public read plans" ON public.membership_plans FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Public read exercises" ON public.exercises;
CREATE POLICY "Public read exercises" ON public.exercises FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Public read diet plans" ON public.predefined_diet_plans;
CREATE POLICY "Public read diet plans" ON public.predefined_diet_plans FOR SELECT TO authenticated, anon USING (true);
