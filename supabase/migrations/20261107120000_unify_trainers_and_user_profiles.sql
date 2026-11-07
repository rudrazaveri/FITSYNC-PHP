-- ============================================================================
-- FITSYNC AI — UNIFY TRAINERS & USER PROFILES (SAFE & RECURSION-FREE)
-- Fixes missing coach metadata across user_profiles and trainers tables
-- Ensures full_name, email, phone, avatar, gym, and specializations appear in both tables
-- ============================================================================

-- 0. DROP ANY PREVIOUS RECURSIVE TRIGGERS SAFELY
DROP TRIGGER IF EXISTS trg_sync_trainers_to_profiles ON public.trainers;
DROP TRIGGER IF EXISTS trg_sync_profiles_to_trainers ON public.user_profiles;
DROP FUNCTION IF EXISTS public.sync_trainer_and_profile();

-- 1. ADD COLUMNS TO TRAINERS TABLE
ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS gym_name TEXT,
  ADD COLUMN IF NOT EXISTS role_title TEXT DEFAULT 'Certified Gym Coach',
  ADD COLUMN IF NOT EXISTS qualifications TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'On Floor';

-- 2. ADD COLUMNS TO USER_PROFILES TABLE
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gym_name TEXT,
  ADD COLUMN IF NOT EXISTS specializations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS certifications TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS qualifications TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. UPDATE COACH RAJ PATEL IN BOTH TABLES
UPDATE public.user_profiles
SET 
  gym_id = '11111111-1111-1111-1111-111111111101',
  gym_name = 'FitZone Fitness',
  specializations = ARRAY['Powerlifting', 'Hypertrophy Mechanics', 'Injury Prevention'],
  certifications = ARRAY['CSCS', 'NSCA-CPT', 'Precision Nutrition L1'],
  qualifications = ARRAY['B.Sc Sports & Exercise Science'],
  experience_years = 9,
  membership_tier = 'Head Strength Coach',
  bio = '9+ years specializing in biomechanically sound strength progressions, compound lifts (Squat, Bench, Deadlift), and muscle hypertrophy.'
WHERE id = '44444444-4444-4444-4444-444444444401' OR email = 'coach.raj@fitsync.health';

UPDATE public.trainers
SET 
  full_name = 'Coach Raj Patel',
  email = 'coach.raj@fitsync.health',
  phone = '+91 98250 88910',
  avatar_url = '/assets/trainer_raj.jpg',
  gym_id = '11111111-1111-1111-1111-111111111101',
  gym_name = 'FitZone Fitness',
  role_title = 'Head Strength Coach',
  specializations = ARRAY['Powerlifting', 'Hypertrophy Mechanics', 'Injury Prevention'],
  certifications = ARRAY['CSCS', 'NSCA-CPT', 'Precision Nutrition L1'],
  qualifications = ARRAY['B.Sc Sports & Exercise Science'],
  experience_years = 9,
  rating = 4.90,
  bio = '9+ years specializing in biomechanically sound strength progressions, compound lifts (Squat, Bench, Deadlift), and muscle hypertrophy.',
  availability_status = 'On Floor'
WHERE id = '44444444-4444-4444-4444-444444444401';

-- 4. UPDATE COACH VIKRAM MEHTA IN BOTH TABLES
UPDATE public.user_profiles
SET 
  gym_id = '11111111-1111-1111-1111-111111111102',
  gym_name = 'PowerHouse Gym',
  specializations = ARRAY['Mobility Restructuring', 'Joint Kinematics', 'Olympic Lifting Technique'],
  certifications = ARRAY['FRCms Mobility Specialist', 'EXOS Performance Specialist'],
  qualifications = ARRAY['M.Sc Kinesiology & Biomechanics'],
  experience_years = 8,
  membership_tier = 'Senior Performance Coach',
  bio = 'Bridging the gap between athletic conditioning and heavy compound weight training with zero joint pain.'
WHERE id = '44444444-4444-4444-4444-444444444402' OR email = 'coach.vikram@fitsync.health';

UPDATE public.trainers
SET 
  full_name = 'Coach Vikram Mehta',
  email = 'coach.vikram@fitsync.health',
  phone = '+91 98255 12093',
  avatar_url = 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=500',
  gym_id = '11111111-1111-1111-1111-111111111102',
  gym_name = 'PowerHouse Gym',
  role_title = 'Senior Performance Coach',
  specializations = ARRAY['Mobility Restructuring', 'Joint Kinematics', 'Olympic Lifting Technique'],
  certifications = ARRAY['FRCms Mobility Specialist', 'EXOS Performance Specialist'],
  qualifications = ARRAY['M.Sc Kinesiology & Biomechanics'],
  experience_years = 8,
  rating = 4.90,
  bio = 'Bridging the gap between athletic conditioning and heavy compound weight training with zero joint pain.',
  availability_status = 'On Floor'
WHERE id = '44444444-4444-4444-4444-444444444402';

-- 5. SET DEFAULT GYM FOR MEMBERS
UPDATE public.user_profiles
SET 
  gym_id = '11111111-1111-1111-1111-111111111101',
  gym_name = 'FitZone Fitness'
WHERE role = 'member' AND (gym_name IS NULL OR gym_id IS NULL);

-- 6. CONVENIENT UNIFIED TRAINERS DIRECTORY VIEW
CREATE OR REPLACE VIEW public.trainers_directory AS
SELECT 
  t.id,
  COALESCE(t.full_name, u.full_name) AS full_name,
  COALESCE(t.email, u.email) AS email,
  COALESCE(t.phone, u.phone, u.mobile) AS phone,
  COALESCE(t.avatar_url, u.avatar_url) AS avatar_url,
  COALESCE(t.gym_name, g.name, u.gym_name) AS gym_name,
  t.gym_id,
  t.specializations,
  t.certifications,
  t.qualifications,
  t.experience_years,
  t.rating,
  t.bio,
  t.availability_status,
  t.weekly_schedule,
  t.created_at
FROM public.trainers t
LEFT JOIN public.user_profiles u ON u.id = t.id
LEFT JOIN public.gyms g ON g.id = t.gym_id;
