-- ============================================================================
-- FITSYNC AI SEED DATA
-- Predefined Gyms, Exercises, Predefined Diet Plans, Providers, and Demonstrations
-- ============================================================================

-- Gyms
INSERT INTO public.gyms (id, name, city, address, rating, reviews_count, attendance_rate, amenities)
VALUES
('11111111-1111-1111-1111-111111111101', 'FitZone Fitness', 'Vadodara', 'Alkapuri, Vadodara, Gujarat', 4.90, 380, 86.40, ARRAY['24/7 Access', 'Eleiko Racks', 'Physio Clinic On-Premise', 'Juice Bar']),
('11111111-1111-1111-1111-111111111102', 'PowerHouse Gym', 'Ahmedabad', 'SG Highway, Ahmedabad, Gujarat', 4.80, 520, 88.10, ARRAY['Indoor Turf Track', 'Cryotherapy Chamber', 'Olympic Pool']),
('11111111-1111-1111-1111-111111111103', 'Elite Fitness Studio', 'Surat', 'Vesu, Surat, Gujarat', 4.70, 290, 81.50, ARRAY['Biomechanics Lab', 'Pilates Reformers', 'Sauna'])
ON CONFLICT (id) DO NOTHING;

-- Membership Plans
INSERT INTO public.membership_plans (gym_id, name, price_inr, access_features)
VALUES
('11111111-1111-1111-1111-111111111101', 'Silver Basic', 2499, ARRAY['Gym floor access', 'Locker access']),
('11111111-1111-1111-1111-111111111101', 'Gold All-Access', 3999, ARRAY['Gym floor access', 'Group classes', 'Locker access', 'Sauna']),
('11111111-1111-1111-1111-111111111101', 'Platinum Elite', 5499, ARRAY['Gym floor access', 'Group classes', 'Sauna', '2 Trainer Sessions/mo', 'Recovery Zone'])
ON CONFLICT DO NOTHING;

-- Exercises
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

-- Predefined Goal-Mapped Diet Plans
INSERT INTO public.predefined_diet_plans (id, title, target_goal, dietary_variant, daily_calories, protein_g, carbs_g, fat_g, description)
VALUES
('33333333-3333-3333-3333-333333333301', 'Muscle-Gain Hypertrophy Plan (Non-Veg)', 'muscle_gain', 'non_vegetarian', 2650, 150, 300, 75, 'Calorie-surplus plan designed for lean muscle gain and strength progression.'),
('33333333-3333-3333-3333-333333333302', 'Muscle-Gain Hypertrophy Plan (Vegetarian)', 'muscle_gain', 'vegetarian', 2650, 145, 305, 75, 'High-protein vegetarian plan featuring paneer, Greek yogurt, lentils, and whey isolate.'),
('33333333-3333-3333-3333-333333333303', 'Calorie-Deficit Fat Loss Plan (Non-Veg)', 'fat_loss', 'non_vegetarian', 1850, 155, 160, 45, 'Targeted caloric deficit plan maximizing satiety and preserving lean tissue.'),
('33333333-3333-3333-3333-333333333304', 'Calorie-Deficit Fat Loss Plan (Vegetarian)', 'fat_loss', 'vegetarian', 1850, 140, 175, 45, 'Vegetarian fat-loss plan focusing on high-fiber legumes, tofu, and casein protein.'),
('33333333-3333-3333-3333-333333333305', 'Strength & Athletic Performance Plan', 'strength', 'non_vegetarian', 2500, 160, 275, 70, 'Nutrient-dense nutrition supporting neuromuscular adaptations and high training volume.')
ON CONFLICT (id) DO NOTHING;

-- Diet Plan Meals
INSERT INTO public.diet_plan_meals (diet_plan_id, meal_type, title, calories, protein_g, carbs_g, fat_g, ingredients, allergens, alternatives)
VALUES
('33333333-3333-3333-3333-333333333301', 'Breakfast', 'Oatmeal with Whey Isolate & Berries', 540, 42, 68, 12, 'Rolled oats (80g), 1 scoop whey isolate (30g), unsweetened almond milk (250ml), blueberries (50g), chia seeds (10g)', ARRAY['Dairy (Whey)'], 'Swap whey with plant protein isolate; swap almond milk with soy milk.'),
('33333333-3333-3333-3333-333333333301', 'Lunch', 'Herb Grilled Chicken & Quinoa Fitness Bowl', 680, 48, 64, 22, 'Grilled chicken breast (180g), cooked tri-color quinoa (150g), avocado (50g), sweet potato (100g), spinach and cherry tomatoes', ARRAY[]::TEXT[], 'Substitute chicken breast with grilled bhetki fish or spiced paneer (160g).'),
('33333333-3333-3333-3333-333333333301', 'Evening Snack', 'Low-Fat Greek Yogurt & Banana Crunch', 320, 22, 48, 4, 'Plain Greek yogurt (200g), 1 sliced banana, 1 tsp raw honey', ARRAY['Dairy'], 'Substitute yogurt with soy curd or 3 boiled egg whites + 1 slice whole wheat toast.'),
('33333333-3333-3333-3333-333333333301', 'Dinner', 'Tandoori Fish Skewers with Brown Basmati', 610, 45, 65, 16, 'Marinated fish fillet (200g), steamed brown basmati rice (160g), roasted broccoli & bell peppers with olive oil (1 tsp)', ARRAY['Fish'], 'Substitute fish with chicken breast or grilled firm tofu.')
ON CONFLICT DO NOTHING;
