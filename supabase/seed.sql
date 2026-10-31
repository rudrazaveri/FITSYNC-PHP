-- ============================================================================
-- FITSYNC AI SEED DATA
-- Predefined Gyms, Membership Plans, Coaches, Athletes, Exercises, Diets & Sessions
-- ============================================================================

-- 1. GYMS
INSERT INTO public.gyms (id, name, city, address, rating, reviews_count, attendance_rate, amenities)
VALUES
('11111111-1111-1111-1111-111111111101', 'FitZone Fitness', 'Vadodara', 'Alkapuri, Vadodara, Gujarat', 4.90, 380, 86.40, ARRAY['24/7 Access', 'Eleiko Racks', 'Physio Clinic On-Premise', 'Juice Bar']),
('11111111-1111-1111-1111-111111111102', 'PowerHouse Gym', 'Ahmedabad', 'SG Highway, Ahmedabad, Gujarat', 4.80, 520, 88.10, ARRAY['Indoor Turf Track', 'Cryotherapy Chamber', 'Olympic Pool']),
('11111111-1111-1111-1111-111111111103', 'Elite Fitness Studio', 'Surat', 'Vesu, Surat, Gujarat', 4.70, 290, 81.50, ARRAY['Biomechanics Lab', 'Pilates Reformers', 'Sauna'])
ON CONFLICT (id) DO NOTHING;

-- 2. MEMBERSHIP PLANS
INSERT INTO public.membership_plans (gym_id, name, price_inr, access_features)
VALUES
('11111111-1111-1111-1111-111111111101', 'Silver Basic', 2499, ARRAY['Gym floor access', 'Locker access']),
('11111111-1111-1111-1111-111111111101', 'Gold All-Access', 3999, ARRAY['Gym floor access', 'Group classes', 'Locker access', 'Sauna']),
('11111111-1111-1111-1111-111111111101', 'Platinum Elite', 5499, ARRAY['Gym floor access', 'Group classes', 'Sauna', '2 Trainer Sessions/mo', 'Recovery Zone'])
ON CONFLICT DO NOTHING;

-- 3. SEED AUTH USERS (IF PERMITTED IN ENVIRONMENT)
DO $$
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES
  ('44444444-4444-4444-4444-444444444401', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach.raj@fitsync.health', crypt('CoachRaj@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Coach Raj Patel","role":"trainer"}'::jsonb, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444402', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach.vikram@fitsync.health', crypt('CoachVikram@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Coach Vikram Mehta","role":"trainer"}'::jsonb, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555501', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aarav.shah@fitsync.health', crypt('Aarav@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Aarav Shah","role":"member"}'::jsonb, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555502', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rahul.verma@example.com', crypt('Rahul@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Rahul Verma","role":"member"}'::jsonb, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555503', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya.nair@example.com', crypt('Priya@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Priya Nair","role":"member"}'::jsonb, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555504', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev.patel@example.com', crypt('DevPatel@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Dev Patel","role":"member"}'::jsonb, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. USER PROFILES
INSERT INTO public.user_profiles (id, full_name, email, role, phone, avatar_url)
VALUES
('44444444-4444-4444-4444-444444444401', 'Coach Raj Patel', 'coach.raj@fitsync.health', 'trainer', '+91 98250 88910', '/assets/trainer_raj.jpg'),
('44444444-4444-4444-4444-444444444402', 'Coach Vikram Mehta', 'coach.vikram@fitsync.health', 'trainer', '+91 98255 12093', 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=500'),
('55555555-5555-5555-5555-555555555501', 'Aarav Shah', 'aarav.shah@fitsync.health', 'member', '+91 98250 12345', '/assets/aarav.jpg'),
('55555555-5555-5555-5555-555555555502', 'Rahul Verma', 'rahul.verma@example.com', 'member', '+91 98251 67890', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'),
('55555555-5555-5555-5555-555555555503', 'Priya Nair', 'priya.nair@example.com', 'member', '+91 98252 34567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'),
('55555555-5555-5555-5555-555555555504', 'Dev Patel', 'dev.patel@example.com', 'member', '+91 98253 90123', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url;

-- 5. TRAINERS (COACH RAJ PATEL & COACH VIKRAM MEHTA)
INSERT INTO public.trainers (id, gym_id, specializations, certifications, experience_years, rating, bio, weekly_schedule)
VALUES
(
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111101',
  ARRAY['Powerlifting', 'Hypertrophy Mechanics', 'Injury Prevention'],
  ARRAY['CSCS', 'NSCA-CPT', 'Precision Nutrition L1'],
  9,
  4.90,
  '9+ years specializing in biomechanically sound strength progressions, compound lifts (Squat, Bench, Deadlift), and muscle hypertrophy.',
  '{"schedule": "Mon - Sat: 6:00 AM – 1:00 PM | 4:30 PM – 9:00 PM"}'::jsonb
),
(
  '44444444-4444-4444-4444-444444444402',
  '11111111-1111-1111-1111-111111111102',
  ARRAY['Mobility Restructuring', 'Joint Kinematics', 'Olympic Lifting Technique'],
  ARRAY['FRCms Mobility Specialist', 'EXOS Performance Specialist'],
  8,
  4.90,
  'Bridging the gap between athletic conditioning and heavy compound weight training with zero joint pain.',
  '{"schedule": "Mon - Fri: 8:00 AM – 4:00 PM"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  bio = EXCLUDED.bio,
  rating = EXCLUDED.rating;

-- 6. TRAINER MEMBER ASSIGNMENTS
INSERT INTO public.trainer_member_assignments (trainer_id, member_id, status)
VALUES
('44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555501', 'active'),
('44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555502', 'active'),
('44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555503', 'active'),
('44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555504', 'active')
ON CONFLICT (trainer_id, member_id) DO NOTHING;

-- 7. EXERCISES
INSERT INTO public.exercises (id, name, target_muscle, secondary_muscles, equipment, difficulty, type, thumbnail_url, instructions, common_mistakes, trainer_tip)
VALUES
('22222222-2222-2222-2222-222222222201', 'Barbell Bench Press', 'Chest', ARRAY['Front Deltoid', 'Triceps'], 'Barbell & Bench', 'Intermediate', 'Compound Strength', '/assets/bench_press.jpg',
 ARRAY['Lie flat with eyes aligned under the barbell.', 'Grip bar slightly wider than shoulder-width with straight wrists.', 'Unrack, retract shoulder blades, and plant feet flat.', 'Lower bar under control to mid-sternum, tucking elbows at 45 degrees.', 'Drive upward to full lockout without lifting glutes.'],
 'Bouncing bar off ribs, flaring elbows to 90 degrees, lifting hips off bench.', 'Maintain leg drive to stabilize your thoracic spine throughout each rep.'),
('22222222-2222-2222-2222-222222222202', 'Incline Dumbbell Press', 'Upper Chest', ARRAY['Anterior Deltoid', 'Triceps'], 'Dumbbells & 30° Bench', 'Intermediate', 'Hypertrophy', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500',
 ARRAY['Set bench angle to approximately 30 degrees.', 'Bring dumbbells to shoulder level as you recline.', 'Press upward converging weights smoothly without clacking.', 'Lower dumbbells feeling a deep stretch across upper pec fibers.'],
 'Setting bench too steep (>45° shifts load to shoulders), bouncing out of bottom.', 'Pause for a half-second at the stretch to maximize motor unit recruitment.'),
('22222222-2222-2222-2222-222222222203', 'Standing Cable Pec Fly', 'Chest', ARRAY['Anterior Deltoid'], 'Cable Machine', 'Beginner', 'Isolation', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500',
 ARRAY['Set pulleys at chest height, step one foot forward for balance.', 'Maintain slight bend in elbows.', 'Bring hands together in front of sternum, squeezing chest for 1 second.'],
 'Turning the movement into a press, excessive torso momentum.', 'Focus on bringing your inner biceps together rather than just your hands.'),
('22222222-2222-2222-2222-222222222204', 'Rope Cable Tricep Pushdown', 'Triceps', ARRAY['Forearms'], 'Cable & Rope', 'Beginner', 'Isolation', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500',
 ARRAY['Attach rope to high pulley, lean forward slightly at the hips.', 'Keep elbows pinned to ribcage.', 'Push down to full lockout, spreading rope ends outward at the bottom.'],
 'Letting elbows drift forward, swinging torso.', 'Isolate the movement strictly at the elbow joint for maximum triceps activation.'),
('22222222-2222-2222-2222-222222222205', 'Barbell Back Squat', 'Legs', ARRAY['Glutes', 'Core', 'Hamstrings'], 'Barbell & Squat Rack', 'Advanced', 'Compound Strength', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500',
 ARRAY['Position bar on upper traps, grip firmly, unrack with chest upright.', 'Feet shoulder-width apart, toes slightly angled out.', 'Break at hips and knees simultaneously, descending until thighs are parallel.', 'Drive through mid-foot back to standing.'],
 'Knees caving inward (valgus collapse), rounding lower back.', 'Brace your abdominal wall as if taking a punch before initiating descent.')
ON CONFLICT (id) DO NOTHING;

-- 8. PREDEFINED DIET PLANS
INSERT INTO public.predefined_diet_plans (id, title, target_goal, dietary_variant, daily_calories, protein_g, carbs_g, fat_g, description)
VALUES
('33333333-3333-3333-3333-333333333301', 'Muscle-Gain Hypertrophy Plan (Non-Veg)', 'muscle_gain', 'non_vegetarian', 2650, 150, 300, 75, 'Calorie-surplus plan designed for lean muscle gain and strength progression.'),
('33333333-3333-3333-3333-333333333302', 'Muscle-Gain Hypertrophy Plan (Vegetarian)', 'muscle_gain', 'vegetarian', 2650, 145, 305, 75, 'High-protein vegetarian plan featuring paneer, Greek yogurt, lentils, and whey isolate.'),
('33333333-3333-3333-3333-333333333303', 'Calorie-Deficit Fat Loss Plan (Non-Veg)', 'fat_loss', 'non_vegetarian', 1850, 155, 160, 45, 'Targeted caloric deficit plan maximizing satiety and preserving lean tissue.'),
('33333333-3333-3333-3333-333333333304', 'Calorie-Deficit Fat Loss Plan (Vegetarian)', 'fat_loss', 'vegetarian', 1850, 140, 175, 45, 'Vegetarian fat-loss plan focusing on high-fiber legumes, tofu, and casein protein.'),
('33333333-3333-3333-3333-333333333305', 'Strength & Athletic Performance Plan', 'strength', 'non_vegetarian', 2500, 160, 275, 70, 'Nutrient-dense nutrition supporting neuromuscular adaptations and high training volume.')
ON CONFLICT (id) DO NOTHING;

-- 9. DIET PLAN MEALS
INSERT INTO public.diet_plan_meals (diet_plan_id, meal_type, title, calories, protein_g, carbs_g, fat_g, ingredients, allergens, alternatives)
VALUES
('33333333-3333-3333-3333-333333333301', 'Breakfast', 'Oatmeal with Whey Isolate & Berries', 540, 42, 68, 12, 'Rolled oats (80g), 1 scoop whey isolate (30g), unsweetened almond milk (250ml), blueberries (50g), chia seeds (10g)', ARRAY['Dairy (Whey)'], 'Swap whey with plant protein isolate; swap almond milk with soy milk.'),
('33333333-3333-3333-3333-333333333301', 'Lunch', 'Herb Grilled Chicken & Quinoa Fitness Bowl', 680, 48, 64, 22, 'Grilled chicken breast (180g), cooked tri-color quinoa (150g), avocado (50g), sweet potato (100g), spinach and cherry tomatoes', ARRAY[]::TEXT[], 'Substitute chicken breast with grilled bhetki fish or spiced paneer (160g).'),
('33333333-3333-3333-3333-333333333301', 'Evening Snack', 'Low-Fat Greek Yogurt & Banana Crunch', 320, 22, 48, 4, 'Plain Greek yogurt (200g), 1 sliced banana, 1 tsp raw honey', ARRAY['Dairy'], 'Substitute yogurt with soy curd or 3 boiled egg whites + 1 slice whole wheat toast.'),
('33333333-3333-3333-3333-333333333301', 'Dinner', 'Tandoori Fish Skewers with Brown Basmati', 610, 45, 65, 16, 'Marinated fish fillet (200g), steamed brown basmati rice (160g), roasted broccoli & bell peppers with olive oil (1 tsp)', ARRAY['Fish'], 'Substitute fish with chicken breast or grilled firm tofu.')
ON CONFLICT DO NOTHING;

-- 10. TRAINER INTERVENTIONS (RULE-BASED ALERTS & AI INSIGHTS)
INSERT INTO public.trainer_interventions (id, trainer_id, member_id, attention_level, issue_description, ai_recommendation_note, status, source_type, reason, date_detected, attention_status)
VALUES
(
  '66666666-6666-6666-6666-666666666601',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555502',
  'high',
  'Rahul has missed his scheduled back & leg sessions consecutively, breaking his training cadence.',
  'Encourage a modified upper-body push split to re-engage consistency before resuming full deadlift volume.',
  'open',
  'rule_based',
  'Rule: Unattended sessions >= 3 within 10-day rolling window',
  CURRENT_DATE - INTERVAL '2 days',
  'high_attention'
),
(
  '66666666-6666-6666-6666-666666666602',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555501',
  'moderate',
  'Workout volume trend indicates acute fatigue accumulation; bench press RPE climbed from 7.5 to 8.5 at identical load.',
  'Perform elbow tucking technique review and consider a 10% deload on set 3 & 4.',
  'open',
  'ai_insight',
  'AI Insight: Fatigue progression detected across last 4 bench press logs',
  CURRENT_DATE - INTERVAL '1 day',
  'needs_attention'
),
(
  '66666666-6666-6666-6666-666666666603',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555503',
  'moderate',
  'Priya has logged 0 meals over the past 6 days despite maintaining consistent gym attendance.',
  'Send quick macro logging reminder in athlete chat.',
  'open',
  'rule_based',
  'Rule: Inactive nutrition logs >= 5 days',
  CURRENT_DATE,
  'needs_attention'
),
(
  '66666666-6666-6666-6666-666666666604',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555504',
  'low',
  'Attendance consistency is 80%+ and overhead press completed sets were smooth. Recommended to review deadlift bar path in tomorrow session.',
  'Progressive overload recommended on upcoming strength mesocycle.',
  'open',
  'ai_insight',
  'AI Insight: Strength baseline consolidation completed',
  CURRENT_DATE,
  'on_track'
)
ON CONFLICT (id) DO NOTHING;

-- 11. TRAINER SESSIONS (FLOOR 1-ON-1 & ONLINE VIDEO)
INSERT INTO public.trainer_sessions (id, trainer_id, member_id, gym_id, session_date, start_time, duration_minutes, session_type, status, meeting_link, telehealth_room_id, focus_area, notes)
VALUES
(
  '77777777-7777-7777-7777-777777777701',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555501',
  '11111111-1111-1111-1111-111111111101',
  CURRENT_DATE,
  '17:30:00',
  45,
  'floor_1on1',
  'confirmed',
  NULL,
  'room_raj_aarav_floor_01',
  'Bench Press Arch & Elbow Tucking Technique',
  'Check scapular retraction under heavy working sets and review warm-up rotator cuff prep.'
),
(
  '77777777-7777-7777-7777-777777777702',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555504',
  '11111111-1111-1111-1111-111111111101',
  CURRENT_DATE + INTERVAL '1 day',
  '18:30:00',
  45,
  'online_video',
  'scheduled',
  'https://fitsync.health/telehealth/tr_raj_dev_patel',
  'room_raj_dev_strength_check',
  'Periodization Strategy & Weekly Volume Planning',
  'Online video consultation for mesocycle progression and nutrition macro adjustment.'
),
(
  '77777777-7777-7777-7777-777777777703',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555503',
  '11111111-1111-1111-1111-111111111101',
  CURRENT_DATE - INTERVAL '2 days',
  '09:00:00',
  45,
  'floor_1on1',
  'completed',
  NULL,
  'room_raj_priya_mobility',
  'Hip Hinge & Kettlebell Deadlift Assessment',
  'Great hamstring engagement observed; assigned goblet squat mobility drills.'
)
ON CONFLICT (id) DO NOTHING;

-- 12. TRAINER MESSAGES
INSERT INTO public.trainer_messages (id, trainer_id, member_id, gym_id, sender_role, sender_id, sender_name, message_text, category, is_read, created_at)
VALUES
(
  '88888888-8888-8888-8888-888888888801',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555501',
  '11111111-1111-1111-1111-111111111101',
  'trainer',
  '44444444-4444-4444-4444-444444444401',
  'Coach Raj Patel',
  'Hey Aarav! Welcome to FitZone Vadodara. How did your chest & triceps session feel today?',
  'general',
  TRUE,
  NOW() - INTERVAL '3 hours'
),
(
  '88888888-8888-8888-8888-888888888802',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555501',
  '11111111-1111-1111-1111-111111111101',
  'member',
  '55555555-5555-5555-5555-555555555501',
  'Aarav Shah',
  'Hey Coach! The bench press felt solid, hit 82.5 kg on top sets. Just felt a tiny pinch in my front deltoid on the last rep.',
  'form_check',
  TRUE,
  NOW() - INTERVAL '2 hours 45 minutes'
),
(
  '88888888-8888-8888-8888-888888888803',
  '44444444-4444-4444-4444-444444444401',
  '55555555-5555-5555-5555-555555555501',
  '11111111-1111-1111-1111-111111111101',
  'trainer',
  '44444444-4444-4444-4444-444444444401',
  'Coach Raj Patel',
  'Great weight moved! For the pinch, make sure you tuck your elbows 45 degrees rather than flaring them 90 degrees. Catch me on the floor today at 5:30 PM!',
  'form_check',
  FALSE,
  NOW() - INTERVAL '2 hours 30 minutes'
)
ON CONFLICT (id) DO NOTHING;
