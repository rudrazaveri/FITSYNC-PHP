-- ============================================================================
-- FITSYNC AI — COMPLETE PRODUCTION DATABASE SCHEMA & SEED DATA
-- Run this complete script in Supabase: Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ----------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('member', 'trainer', 'doctor', 'physiotherapist', 'gym_admin', 'platform_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

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

-- ----------------------------------------------------------------------------
-- 2. CORE TABLES
-- ----------------------------------------------------------------------------

-- Gym Branches
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  rating NUMERIC(3,2) DEFAULT 4.8,
  reviews_count INT DEFAULT 0,
  attendance_rate NUMERIC(5,2) DEFAULT 85.00,
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role_enum NOT NULL DEFAULT 'member',
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  membership_tier TEXT DEFAULT 'Premium',
  home_gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membership Plans
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_inr INT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  access_features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Member Gym Memberships
CREATE TABLE IF NOT EXISTS public.gym_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trainers
CREATE TABLE IF NOT EXISTS public.trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience_years INT NOT NULL DEFAULT 5,
  rating NUMERIC(3,2) DEFAULT 4.9,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Health Profiles & Biometric Assessments (Mifflin-St Jeor Engine)
CREATE TABLE IF NOT EXISTS public.member_health_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  age INT NOT NULL DEFAULT 24,
  gender gender_enum NOT NULL DEFAULT 'female',
  height_cm NUMERIC(5,2) NOT NULL DEFAULT 168.0,
  weight_kg NUMERIC(5,2) NOT NULL DEFAULT 62.5,
  waist_cm NUMERIC(5,2) DEFAULT 74.0,
  neck_cm NUMERIC(5,2) DEFAULT 32.0,
  hip_cm NUMERIC(5,2) DEFAULT 94.0,
  activity_level activity_level_enum NOT NULL DEFAULT 'moderately_active',
  primary_goal fitness_goal_enum NOT NULL DEFAULT 'muscle_gain',
  bmi NUMERIC(4,2) NOT NULL DEFAULT 21.6,
  bmr_kcal INT NOT NULL DEFAULT 1400,
  tdee_kcal INT NOT NULL DEFAULT 2170,
  target_calories INT NOT NULL DEFAULT 2200,
  target_protein_g INT NOT NULL DEFAULT 110,
  target_carbs_g INT NOT NULL DEFAULT 260,
  target_fat_g INT NOT NULL DEFAULT 70,
  target_water_ml INT NOT NULL DEFAULT 3000,
  body_fat_pct NUMERIC(4,2) DEFAULT 22.0,
  fitness_score INT NOT NULL DEFAULT 85,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercises Library
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  target_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] DEFAULT ARRAY[]::TEXT[],
  equipment TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  type TEXT NOT NULL,
  thumbnail_url TEXT,
  instructions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workouts & Sessions
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  calories_burned INT DEFAULT 320,
  status TEXT NOT NULL DEFAULT 'completed',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nutrition Logs
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL,
  calories INT NOT NULL DEFAULT 0,
  protein_g INT NOT NULL DEFAULT 0,
  carbs_g INT NOT NULL DEFAULT 0,
  fat_g INT NOT NULL DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Water Hydration Logs
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount_ml INT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weight Progression Logs
CREATE TABLE IF NOT EXISTS public.progress_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL DEFAULT 'weight',
  metric_value NUMERIC(6,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Turnstile Attendance Logs
CREATE TABLE IF NOT EXISTS public.turnstile_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  turnstile_id TEXT DEFAULT 'TS-KOTHRUD-01',
  method TEXT NOT NULL DEFAULT 'qr_turnstile',
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consultations / Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  specialist_name TEXT NOT NULL,
  specialist_role TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  consultation_type TEXT NOT NULL DEFAULT 'Online Video',
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- Allows anonymous and authenticated client read/write for web & API integration
-- ----------------------------------------------------------------------------
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnstile_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public Read Gyms" ON public.gyms FOR SELECT USING (true);
  CREATE POLICY "Public Read Trainers" ON public.trainers FOR SELECT USING (true);
  CREATE POLICY "Public Read Exercises" ON public.exercises FOR SELECT USING (true);
  CREATE POLICY "Public Full Profiles" ON public.user_profiles FOR ALL USING (true);
  CREATE POLICY "Public Full Health Profiles" ON public.member_health_profiles FOR ALL USING (true);
  CREATE POLICY "Public Full Workouts" ON public.workouts FOR ALL USING (true);
  CREATE POLICY "Public Full Nutrition" ON public.nutrition_logs FOR ALL USING (true);
  CREATE POLICY "Public Full Water" ON public.water_logs FOR ALL USING (true);
  CREATE POLICY "Public Full Progress" ON public.progress_metrics FOR ALL USING (true);
  CREATE POLICY "Public Full Attendance" ON public.turnstile_attendance FOR ALL USING (true);
  CREATE POLICY "Public Full Appointments" ON public.appointments FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 4. SEED SAMPLE DATA
-- ----------------------------------------------------------------------------

-- Gyms
INSERT INTO public.gyms (id, name, city, address, rating, reviews_count, attendance_rate, amenities, image_url)
VALUES
('11111111-1111-1111-1111-111111111101', 'FitZone Gym', 'Pune', 'Kothrud, Pune, Maharashtra', 4.90, 420, 89.20, ARRAY['Eleiko Racks', 'Sauna', 'Physio On-Premise', 'Cardio Deck'], 'assets/images/gym_fitzone.jpg'),
('11111111-1111-1111-1111-111111111102', 'PowerHouse Gym', 'Mumbai', 'Andheri West, Mumbai, Maharashtra', 4.80, 560, 87.50, ARRAY['Turf Track', 'Cryotherapy', 'Olympic Pool'], 'assets/images/gym_powerhouse.jpg'),
('11111111-1111-1111-1111-111111111103', 'CrossFit Arena', 'Pune', 'Baner, Pune, Maharashtra', 4.85, 310, 84.10, ARRAY['Rings', 'Climbing Ropes', 'Kettlebell Wall'], 'assets/images/gym_crossfit.jpg'),
('11111111-1111-1111-1111-111111111104', 'Elite Fitness Studio', 'Pune', 'Koregaon Park, Pune, Maharashtra', 4.75, 290, 82.00, ARRAY['Pilates Reformers', 'Recovery Lounge'], 'assets/images/gym_elite.jpg')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url;

-- User Profile (Isha Kulkarni)
INSERT INTO public.user_profiles (id, role, full_name, email, phone, avatar_url, membership_tier, home_gym_id)
VALUES
('22222222-2222-2222-2222-222222222201', 'member', 'Isha Kulkarni', 'isha.kulkarni@fitsync.com', '+91 98765 43210', 'assets/images/isha_avatar.jpg', 'Member • Premium', '11111111-1111-1111-1111-111111111101')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Health Profile
INSERT INTO public.member_health_profiles (id, user_id, age, gender, height_cm, weight_kg, waist_cm, neck_cm, hip_cm, activity_level, primary_goal, bmi, bmr_kcal, tdee_kcal, target_calories, target_protein_g, target_carbs_g, target_fat_g, target_water_ml, body_fat_pct, fitness_score)
VALUES
('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 24, 'female', 168.0, 62.5, 74.0, 32.0, 94.0, 'moderately_active', 'muscle_gain', 21.6, 1400, 2170, 2200, 110, 260, 70, 3000, 22.0, 85)
ON CONFLICT (id) DO NOTHING;

-- Trainers
INSERT INTO public.trainers (id, name, specialization, experience_years, rating, gym_id, avatar_url, bio)
VALUES
('44444444-4444-4444-4444-444444444401', 'Coach Simran Grover', 'Strength & Hypertrophy', 6, 4.95, '11111111-1111-1111-1111-111111111101', 'assets/images/trainer_simran.jpg', 'Specialist in progressive overload and scientific muscle development.'),
('44444444-4444-4444-4444-444444444402', 'Coach Vikram Malhotra', 'Functional Mobility & Conditioning', 8, 4.90, '11111111-1111-1111-1111-111111111101', 'assets/images/trainer_vikram.jpg', 'CrossFit Level 2 coach focused on athletic performance and core stability.'),
('44444444-4444-4444-4444-444444444403', 'Coach Raj Patel', 'Olympic Weightlifting & Biomechanics', 10, 4.92, '11111111-1111-1111-1111-111111111102', 'assets/images/trainer_raj.jpg', 'Master coach with a decade of elite athlete conditioning experience.')
ON CONFLICT (id) DO NOTHING;

-- Exercises
INSERT INTO public.exercises (name, target_muscle, secondary_muscles, equipment, difficulty, type, thumbnail_url)
VALUES
('Barbell Bench Press', 'Chest', ARRAY['Triceps', 'Front Delts'], 'Barbell & Bench', 'Intermediate', 'Compound Strength', 'assets/images/ex_bench.jpg'),
('Barbell Back Squat', 'Quadriceps', ARRAY['Glutes', 'Hamstrings', 'Core'], 'Barbell & Squat Rack', 'Intermediate', 'Compound Strength', 'assets/images/ex_squat.jpg'),
('Conventional Deadlift', 'Hamstrings & Glutes', ARRAY['Lats', 'Traps', 'Lower Back'], 'Barbell', 'Advanced', 'Compound Strength', 'assets/images/ex_deadlift.jpg'),
('Lat Pulldown', 'Lats (Upper Back)', ARRAY['Biceps', 'Rear Delts'], 'Cable Machine', 'Beginner', 'Hypertrophy', 'assets/images/ex_lat_pulldown.jpg'),
('Dumbbell Lateral Raise', 'Lateral Deltoids', ARRAY['Traps'], 'Dumbbells', 'Beginner', 'Isolation', 'assets/images/ex_lateral_raise.jpg'),
('Dumbbell Bicep Curl', 'Biceps', ARRAY['Forearms'], 'Dumbbells', 'Beginner', 'Isolation', 'assets/images/ex_bicep.jpg')
ON CONFLICT (name) DO NOTHING;

-- Appointments
INSERT INTO public.appointments (user_id, specialist_name, specialist_role, appointment_date, appointment_time, consultation_type, status)
VALUES
('22222222-2222-2222-2222-222222222201', 'Dr. Meera Nair', 'General Physician & Sports Nutritionist', '2026-11-20', '11:30 AM', 'Online Video', 'confirmed'),
('22222222-2222-2222-2222-222222222201', 'Mr. Arjun Desai', 'Certified Physiotherapist & Rehab Specialist', '2026-11-23', '02:00 PM', 'In-person Consultation', 'scheduled')
ON CONFLICT DO NOTHING;
