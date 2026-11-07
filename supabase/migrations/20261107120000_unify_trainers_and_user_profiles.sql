-- ============================================================================
-- FITSYNC AI — UNIFY TRAINERS & USER PROFILES
-- Fixes missing coach metadata across user_profiles and trainers tables
-- Ensures full_name, email, phone, avatar, gym, and specializations appear in both tables
-- ============================================================================

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

-- 3. BACKFILL AND SYNC EXISTING COACHES
-- Update trainers table with user_profiles name, email, phone, avatar, and gym name
UPDATE public.trainers t
SET 
  full_name = u.full_name,
  email = u.email,
  phone = COALESCE(u.phone, u.mobile, '+91 98250 88910'),
  avatar_url = u.avatar_url,
  gym_name = COALESCE(g.name, 'FitZone Fitness')
FROM public.user_profiles u
LEFT JOIN public.gyms g ON g.id = u.gym_id OR g.id = '11111111-1111-1111-1111-111111111101'
WHERE t.id = u.id;

-- Update user_profiles for Coach Raj Patel
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

-- Update trainers table for Coach Raj Patel
UPDATE public.trainers
SET 
  full_name = 'Coach Raj Patel',
  email = 'coach.raj@fitsync.health',
  phone = '+91 98250 88910',
  avatar_url = '/assets/trainer_raj.jpg',
  gym_name = 'FitZone Fitness',
  role_title = 'Head Strength Coach'
WHERE id = '44444444-4444-4444-4444-444444444401';

-- Update user_profiles for Coach Vikram Mehta
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

-- Update trainers table for Coach Vikram Mehta
UPDATE public.trainers
SET 
  full_name = 'Coach Vikram Mehta',
  email = 'coach.vikram@fitsync.health',
  phone = '+91 98255 12093',
  avatar_url = 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=500',
  gym_name = 'PowerHouse Gym',
  role_title = 'Senior Performance Coach'
WHERE id = '44444444-4444-4444-4444-444444444402';

-- Update members in user_profiles with default gym
UPDATE public.user_profiles
SET 
  gym_id = '11111111-1111-1111-1111-111111111101',
  gym_name = 'FitZone Fitness'
WHERE role = 'member' AND (gym_name IS NULL OR gym_id IS NULL);

-- 4. BIDIRECTIONAL SYNC FUNCTION & TRIGGERS
CREATE OR REPLACE FUNCTION public.sync_trainer_and_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_TABLE_NAME = 'trainers') THEN
    UPDATE public.user_profiles
    SET 
      full_name = COALESCE(NEW.full_name, full_name),
      email = COALESCE(NEW.email, email),
      phone = COALESCE(NEW.phone, phone),
      avatar_url = COALESCE(NEW.avatar_url, avatar_url),
      gym_id = COALESCE(NEW.gym_id, gym_id),
      gym_name = COALESCE(NEW.gym_name, gym_name),
      specializations = CASE WHEN array_length(NEW.specializations, 1) > 0 THEN NEW.specializations ELSE specializations END,
      certifications = CASE WHEN array_length(NEW.certifications, 1) > 0 THEN NEW.certifications ELSE certifications END,
      experience_years = COALESCE(NEW.experience_years, experience_years),
      bio = COALESCE(NEW.bio, bio)
    WHERE id = NEW.id;

  ELSIF (TG_TABLE_NAME = 'user_profiles' AND NEW.role = 'trainer') THEN
    INSERT INTO public.trainers (
      id, full_name, email, phone, avatar_url, gym_id, gym_name,
      specializations, certifications, experience_years, bio
    )
    VALUES (
      NEW.id, NEW.full_name, NEW.email, COALESCE(NEW.phone, NEW.mobile), NEW.avatar_url,
      COALESCE(NEW.gym_id, '11111111-1111-1111-1111-111111111101'::uuid), 
      COALESCE(NEW.gym_name, 'FitZone Fitness'),
      NEW.specializations, NEW.certifications, COALESCE(NEW.experience_years, 1), NEW.bio
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      avatar_url = EXCLUDED.avatar_url,
      gym_id = COALESCE(EXCLUDED.gym_id, public.trainers.gym_id),
      gym_name = COALESCE(EXCLUDED.gym_name, public.trainers.gym_name),
      specializations = CASE WHEN array_length(EXCLUDED.specializations, 1) > 0 THEN EXCLUDED.specializations ELSE public.trainers.specializations END,
      certifications = CASE WHEN array_length(EXCLUDED.certifications, 1) > 0 THEN EXCLUDED.certifications ELSE public.trainers.certifications END,
      experience_years = COALESCE(EXCLUDED.experience_years, public.trainers.experience_years),
      bio = COALESCE(EXCLUDED.bio, public.trainers.bio);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_trainers_to_profiles ON public.trainers;
CREATE TRIGGER trg_sync_trainers_to_profiles
  AFTER INSERT OR UPDATE ON public.trainers
  FOR EACH ROW EXECUTE FUNCTION public.sync_trainer_and_profile();

DROP TRIGGER IF EXISTS trg_sync_profiles_to_trainers ON public.user_profiles;
CREATE TRIGGER trg_sync_profiles_to_trainers
  AFTER INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_trainer_and_profile();

-- 5. CONVENIENT UNIFIED TRAINERS DIRECTORY VIEW
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
