<?php
/**
 * FitSync AI — API: User Comprehensive Profile Controller
 * Handles retrieval, body stats update, biometric calculation, milestone tracking, and profile details.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$userId = getActiveMemberUserId();

$db = getDbConnection();
if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection unavailable.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // 1. Fetch User and Profile
        $stmt = $db->prepare("
            SELECT u.id, u.email, u.mobile, u.full_name, u.role, u.status,
                   up.date_of_birth, up.gender, up.height_cm, up.weight_kg AS baseline_weight,
                   up.fitness_experience, up.emergency_contact_name, up.emergency_contact_phone, up.bio
            FROM users u
            LEFT JOIN user_profiles up ON up.user_id = u.id
            WHERE u.id = :uid LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'User not found.']);
            exit;
        }

        // Calculate Age from date_of_birth
        $age = 24; // standard default
        if (!empty($user['date_of_birth'])) {
            $dob = new DateTime($user['date_of_birth']);
            $now = new DateTime();
            $age = $now->diff($dob)->y;
        }

        // 2. Latest Body Measurement & Measurement History
        $stmt = $db->prepare("
            SELECT id, recorded_at, weight_kg, waist_cm, chest_cm, arms_cm, thighs_cm, body_fat_pct, notes
            FROM body_measurements
            WHERE user_id = :uid
            ORDER BY recorded_at DESC, id DESC
            LIMIT 30
        ");
        $stmt->execute([':uid' => $userId]);
        $measurements = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalEntries = count($measurements);
        $latestWeight = null;
        if (!empty($measurements)) {
            $latestWeight = (float)$measurements[0]['weight_kg'];
        } elseif (!empty($user['baseline_weight'])) {
            $latestWeight = (float)$user['baseline_weight'];
        }

        $heightCm = $user['height_cm'] ? (float)$user['height_cm'] : 175.0;
        $gender = strtolower((string)($user['gender'] ?? 'male'));

        // 3. Fitness Goal
        $stmt = $db->prepare("SELECT * FROM fitness_goals WHERE user_id = :uid AND status = 'active' ORDER BY id DESC LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $fitnessGoal = $stmt->fetch(PDO::FETCH_ASSOC);

        $goalType = $fitnessGoal ? $fitnessGoal['goal_type'] : 'hypertrophy';
        $goalTitle = $fitnessGoal ? $fitnessGoal['title'] : 'Build Muscle';

        // 4. Latest Assessment / Biometrics
        $stmt = $db->prepare("SELECT * FROM fitness_assessments WHERE user_id = :uid ORDER BY assessment_date DESC, id DESC LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $assessment = $stmt->fetch(PDO::FETCH_ASSOC);

        $activityLevel = $assessment ? (float)$assessment['activity_level'] : 1.55;

        // Deterministic Calculations
        $weightForCalc = $latestWeight ?? 72.0;
        $heightM = $heightCm / 100.0;
        $bmi = round($weightForCalc / ($heightM * $heightM), 1);

        // BMR (Mifflin-St Jeor)
        $bmr = ($gender === 'female') 
            ? round(10.0 * $weightForCalc + 6.25 * $heightCm - 5.0 * $age - 161.0)
            : round(10.0 * $weightForCalc + 6.25 * $heightCm - 5.0 * $age + 5.0);

        // TDEE
        $tdee = round($bmr * $activityLevel);

        // Estimated Body Fat % (Deurenberg Formula)
        $genderFactor = ($gender === 'female') ? 0 : 1;
        $estimatedBodyFat = round((1.20 * $bmi) + (0.23 * $age) - (10.8 * $genderFactor) - 5.4, 1);
        if ($estimatedBodyFat < 3.0) $estimatedBodyFat = 8.0;
        if ($estimatedBodyFat > 60.0) $estimatedBodyFat = 35.0;

        // Daily Targets
        $targetCalories = $tdee;
        if ($goalType === 'fat_loss') $targetCalories -= 500;
        elseif ($goalType === 'hypertrophy') $targetCalories += 350;
        elseif ($goalType === 'strength') $targetCalories += 200;

        $targetProtein = round($weightForCalc * 2.0); // 2g/kg
        $targetFat = round(($targetCalories * 0.25) / 9.0); // 25% of cals
        $targetCarbs = round(($targetCalories - ($targetProtein * 4.0) - ($targetFat * 9.0)) / 4.0);

        // 5. Home Gym & Membership Tier
        $stmt = $db->prepare("
            SELECT m.*, mp.name AS plan_name, g.name AS gym_name, g.city AS gym_city
            FROM memberships m
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            LEFT JOIN gyms g ON g.id = m.gym_id
            WHERE m.user_id = :uid AND m.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $membership = $stmt->fetch(PDO::FETCH_ASSOC);

        $gymName = $membership ? $membership['gym_name'] : 'FitZone Fitness Hub';
        $membershipTier = $membership ? ($membership['plan_name'] ?? 'FitZone Platinum Elite') : 'FitZone Platinum Elite';

        // 6. Assigned Trainer
        $stmt = $db->prepare("
            SELECT u.id, u.full_name, u.email, u.mobile, tp.certification_name, tp.hourly_rate, tp.rating
            FROM trainer_assignments ta
            INNER JOIN users u ON u.id = ta.trainer_user_id
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            WHERE ta.user_id = :uid AND ta.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $trainer = $stmt->fetch(PDO::FETCH_ASSOC);

        // 7. Workout Streak
        $stmt = $db->prepare("
            SELECT COUNT(DISTINCT DATE(check_in_time)) FROM attendance
            WHERE user_id = :uid AND check_in_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ");
        $stmt->execute([':uid' => $userId]);
        $streak = (int)$stmt->fetchColumn();
        if ($streak === 0) {
            // Count total past checkins
            $stmt = $db->prepare("SELECT COUNT(*) FROM attendance WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $totalCheckins = (int)$stmt->fetchColumn();
            $streak = min(5, $totalCheckins);
        }

        // 8. Notification Preferences
        $notifs = [
            'workout_reminders' => true,
            'nutrition_alerts'  => true,
            'coach_messages'    => true,
            'gym_announcements' => true
        ];
        $stmt = $db->prepare("SELECT event_type, in_app FROM notification_preferences WHERE user_id = :uid");
        $stmt->execute([':uid' => $userId]);
        $prefs = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        if (!empty($prefs)) {
            if (isset($prefs['workout_reminders'])) $notifs['workout_reminders'] = (bool)$prefs['workout_reminders'];
            if (isset($prefs['nutrition_alerts'])) $notifs['nutrition_alerts'] = (bool)$prefs['nutrition_alerts'];
            if (isset($prefs['coach_messages'])) $notifs['coach_messages'] = (bool)$prefs['coach_messages'];
            if (isset($prefs['gym_announcements'])) $notifs['gym_announcements'] = (bool)$prefs['gym_announcements'];
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'user' => [
                    'id'               => (int)$user['id'],
                    'full_name'        => $user['full_name'],
                    'email'            => $user['email'],
                    'mobile'           => $user['mobile'] ?? '+91 98765 43210',
                    'role'             => ucfirst($user['role']),
                    'age'              => $age,
                    'height_cm'        => $heightCm,
                    'weight_kg'        => $latestWeight,
                    'gender'           => $gender,
                    'goal_type'        => $goalType,
                    'goal_title'       => $goalTitle,
                    'activity_level'   => $activityLevel,
                    'home_gym'         => $gymName,
                    'membership_tier'  => $membershipTier,
                    'streak_days'      => $streak,
                    'avatar'           => 'assets/images/isha_avatar.jpg'
                ],
                'biometrics' => [
                    'bmi'             => $bmi,
                    'bmi_category'    => ($bmi < 18.5) ? 'Underweight' : (($bmi < 25.0) ? 'Normal Weight' : (($bmi < 30.0) ? 'Overweight' : 'Obese')),
                    'bmr'             => $bmr,
                    'tdee'            => $tdee,
                    'body_fat_pct'    => $estimatedBodyFat,
                    'target_calories' => $targetCalories,
                    'target_protein'  => $targetProtein,
                    'target_carbs'    => $targetCarbs,
                    'target_fat'      => $targetFat
                ],
                'trainer' => $trainer ? [
                    'id'             => (int)$trainer['id'],
                    'name'           => $trainer['full_name'],
                    'email'          => $trainer['email'],
                    'mobile'         => $trainer['mobile'],
                    'title'          => $trainer['certification_name'] ?? 'Certified Strength Coach',
                    'avatar'         => 'assets/images/trainer_raj.jpg'
                ] : null,
                'measurements' => [
                    'total_entries' => $totalEntries,
                    'history'       => $measurements
                ],
                'notifications' => $notifs
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    if (isset($input['user_id']) && (int)$input['user_id'] > 0) {
        $userId = (int)$input['user_id'];
    }
    $action = $input['action'] ?? 'save_body_stats';

    try {
        if ($action === 'save_body_stats') {
            $weight = isset($input['weight']) ? (float)$input['weight'] : 72.0;
            $height = isset($input['height']) ? (float)$input['height'] : 175.0;
            $age    = isset($input['age']) ? (int)$input['age'] : 24;
            $goal   = $input['goal'] ?? 'Build Muscle';
            $activityStr = $input['activity_level'] ?? 'moderately_active';

            $activityMultipliers = [
                'sedentary'         => 1.2,
                'lightly_active'    => 1.375,
                'moderately_active' => 1.55,
                'very_active'       => 1.725,
                'extremely_active'  => 1.9
            ];
            $mult = $activityMultipliers[$activityStr] ?? 1.55;

            // Map goal title to enum
            $goalTypeMap = [
                'Lose Weight'       => 'fat_loss',
                'Build Muscle'      => 'hypertrophy',
                'Improve Strength'  => 'strength',
                'Improve Endurance' => 'endurance',
                'General Fitness'   => 'maintenance',
                'Maintain Weight'   => 'maintenance'
            ];
            $goalType = $goalTypeMap[$goal] ?? 'hypertrophy';

            // 1. Insert into body_measurements
            $stmt = $db->prepare("
                INSERT INTO body_measurements (user_id, recorded_at, weight_kg, notes, created_at)
                VALUES (:uid, CURDATE(), :w, 'Profile biometric update', NOW())
            ");
            $stmt->execute([':uid' => $userId, ':w' => $weight]);

            // 2. Update user_profiles
            // Compute DOB approximately from age
            $birthYear = (int)date('Y') - $age;
            $approxDob = "$birthYear-01-01";

            $stmt = $db->prepare("
                INSERT INTO user_profiles (user_id, height_cm, weight_kg, date_of_birth, updated_at)
                VALUES (:uid, :h, :w, :dob, NOW())
                ON DUPLICATE KEY UPDATE height_cm = :h2, weight_kg = :w2, date_of_birth = :dob2, updated_at = NOW()
            ");
            $stmt->execute([
                ':uid'  => $userId,
                ':h'    => $height,
                ':w'    => $weight,
                ':dob'  => $approxDob,
                ':h2'   => $height,
                ':w2'   => $weight,
                ':dob2' => $approxDob
            ]);

            // 3. Update fitness_goals
            $stmt = $db->prepare("
                INSERT INTO fitness_goals (user_id, title, goal_type, target_weight_kg, starting_weight_kg, status, progress_pct, created_at, updated_at)
                VALUES (:uid, :title, :gtype, :tw, :sw, 'active', 0, NOW(), NOW())
                ON DUPLICATE KEY UPDATE title = :title2, goal_type = :gtype2, updated_at = NOW()
            ");
            $stmt->execute([
                ':uid'    => $userId,
                ':title'  => $goal,
                ':gtype'  => $goalType,
                ':tw'     => $weight,
                ':sw'     => $weight,
                ':title2' => $goal,
                ':gtype2' => $goalType
            ]);

            // 4. Calculate Biometrics
            $heightM = $height / 100.0;
            $bmi = round($weight / ($heightM * $heightM), 1);
            $bmr = round(10.0 * $weight + 6.25 * $height - 5.0 * $age + 5.0);
            $tdee = round($bmr * $mult);

            $targetCalories = $tdee;
            if ($goalType === 'fat_loss') $targetCalories -= 500;
            elseif ($goalType === 'hypertrophy') $targetCalories += 350;
            elseif ($goalType === 'strength') $targetCalories += 200;

            $targetProtein = round($weight * 2.0);
            $targetFat = round(($targetCalories * 0.25) / 9.0);
            $targetCarbs = round(($targetCalories - ($targetProtein * 4.0) - ($targetFat * 9.0)) / 4.0);
            $estimatedBodyFat = round((1.20 * $bmi) + (0.23 * $age) - 10.8 - 5.4, 1);

            // 5. Update fitness_assessments
            $stmt = $db->prepare("
                INSERT INTO fitness_assessments (user_id, assessment_date, height_cm, weight_kg, age, gender, activity_level, bmr_kcal, tdee_kcal, target_calories_kcal, target_protein_g, target_carbs_g, target_fat_g, bmi, body_fat_us_navy, created_at)
                VALUES (:uid, CURDATE(), :h, :w, :age, 'male', :act, :bmr, :tdee, :cal, :prot, :carb, :fat, :bmi, :bf, NOW())
            ");
            $stmt->execute([
                ':uid'  => $userId,
                ':h'    => $height,
                ':w'    => $weight,
                ':age'  => $age,
                ':act'  => $mult,
                ':bmr'  => $bmr,
                ':tdee' => $tdee,
                ':cal'  => $targetCalories,
                ':prot' => $targetProtein,
                ':carb' => $targetCarbs,
                ':fat'  => $targetFat,
                ':bmi'  => $bmi,
                ':bf'   => $estimatedBodyFat
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Body statistics and daily targets successfully recalculated and saved.',
                'biometrics' => [
                    'bmi'             => $bmi,
                    'bmi_category'    => ($bmi < 18.5) ? 'Underweight' : (($bmi < 25.0) ? 'Normal Weight' : (($bmi < 30.0) ? 'Overweight' : 'Obese')),
                    'bmr'             => $bmr,
                    'tdee'            => $tdee,
                    'body_fat_pct'    => $estimatedBodyFat,
                    'target_calories' => $targetCalories,
                    'target_protein'  => $targetProtein,
                    'target_carbs'    => $targetCarbs,
                    'target_fat'      => $targetFat
                ]
            ]);
            exit;
        }

        if ($action === 'record_milestone') {
            $w = (float)($input['weight_kg'] ?? ($input['weight'] ?? 0));
            $waist = !empty($input['waist_cm']) ? (float)$input['waist_cm'] : (!empty($input['waist']) ? (float)$input['waist'] : null);
            $chest = !empty($input['chest_cm']) ? (float)$input['chest_cm'] : (!empty($input['chest']) ? (float)$input['chest'] : null);
            $arms = !empty($input['arms_cm']) ? (float)$input['arms_cm'] : (!empty($input['arms']) ? (float)$input['arms'] : null);
            $notes = !empty($input['notes']) ? trim((string)$input['notes']) : 'Milestone Entry';

            if ($w <= 20 || $w >= 300) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Please enter a valid weight between 20 kg and 300 kg.']);
                exit;
            }

            $stmt = $db->prepare("
                INSERT INTO body_measurements (user_id, recorded_at, weight_kg, waist_cm, chest_cm, arms_cm, notes, created_at)
                VALUES (:uid, CURDATE(), :w, :waist, :chest, :arms, :notes, NOW())
            ");
            $stmt->execute([
                ':uid'   => $userId,
                ':w'     => $w,
                ':waist' => $waist,
                ':chest' => $chest,
                ':arms'  => $arms,
                ':notes' => $notes
            ]);

            // Update user_profiles current weight
            $stmt = $db->prepare("UPDATE user_profiles SET weight_kg = :w, updated_at = NOW() WHERE user_id = :uid");
            $stmt->execute([':w' => $w, ':uid' => $userId]);

            echo json_encode(['success' => true, 'message' => 'Body milestone entry recorded successfully.']);
            exit;
        }

        if ($action === 'delete_measurement') {
            $measId = (int)($input['measurement_id'] ?? ($input['id'] ?? 0));
            $stmt = $db->prepare("DELETE FROM body_measurements WHERE id = :mid AND user_id = :uid");
            $stmt->execute([':mid' => $measId, ':uid' => $userId]);
            echo json_encode(['success' => true, 'message' => 'Measurement entry deleted.']);
            exit;
        }

        if ($action === 'save_profile_details') {
            $fullName = trim((string)($input['full_name'] ?? ''));
            $mobile   = trim((string)($input['mobile'] ?? ''));
            $bio      = isset($input['bio']) ? trim((string)$input['bio']) : null;

            if (empty($fullName)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Full name cannot be empty.']);
                exit;
            }

            $stmt = $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob, updated_at = NOW() WHERE id = :uid");
            $stmt->execute([':fn' => $fullName, ':mob' => $mobile, ':uid' => $userId]);

            if ($bio !== null) {
                $bStmt = $db->prepare("UPDATE user_profiles SET bio = :bio, updated_at = NOW() WHERE user_id = :uid");
                $bStmt->execute([':bio' => $bio, ':uid' => $userId]);
            }

            // Synchronize active PHP session
            if (isset($_SESSION['user_id']) && (int)$_SESSION['user_id'] === $userId) {
                $_SESSION['full_name'] = $fullName;
                if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
                    $_SESSION['user']['full_name'] = $fullName;
                    $_SESSION['user']['name'] = $fullName;
                    $_SESSION['user']['mobile'] = $mobile;
                }
            }

            echo json_encode(['success' => true, 'message' => 'Profile details successfully updated.']);
            exit;
        }

        if ($action === 'save_notifications') {
            $wkReminders = !empty($input['workout_reminders']) ? 1 : 0;
            $nutAlerts   = !empty($input['nutrition_alerts']) ? 1 : 0;
            $coachMsgs   = !empty($input['coach_messages']) ? 1 : 0;
            $gymAnnounce = !empty($input['gym_announcements']) ? 1 : 0;

            $items = [
                'workout_reminders' => $wkReminders,
                'nutrition_alerts'  => $nutAlerts,
                'coach_messages'    => $coachMsgs,
                'gym_announcements' => $gymAnnounce
            ];

            foreach ($items as $k => $v) {
                $stmt = $db->prepare("
                    INSERT INTO notification_preferences (user_id, event_type, in_app, email, sms, push)
                    VALUES (?, ?, ?, ?, 0, ?)
                    ON DUPLICATE KEY UPDATE in_app = VALUES(in_app), email = VALUES(email), push = VALUES(push)
                ");
                $stmt->execute([$userId, $k, $v, $v, $v]);
            }

            echo json_encode(['success' => true, 'message' => 'Notification preferences saved.']);
            exit;
        }

        if ($action === 'change_password') {
            $currentPwd = (string)($input['current_password'] ?? '');
            $newPwd     = (string)($input['new_password'] ?? '');

            if (mb_strlen($newPwd) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'New password must be at least 6 characters long.']);
                exit;
            }

            $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = :uid LIMIT 1");
            $stmt->execute([':uid' => $userId]);
            $userRow = $stmt->fetch();

            if (!$userRow || !password_verify($currentPwd, $userRow['password_hash'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Current password entered is incorrect.']);
                exit;
            }

            $newHash = password_hash($newPwd, PASSWORD_DEFAULT);
            $upStmt = $db->prepare("UPDATE users SET password_hash = :phash, updated_at = NOW() WHERE id = :uid");
            $upStmt->execute([':phash' => $newHash, ':uid' => $userId]);

            echo json_encode(['success' => true, 'message' => 'Password changed successfully.']);
            exit;
        }

        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown action: ' . $action]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
