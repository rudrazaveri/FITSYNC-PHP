<?php
/**
 * FitSync AI — API: User Comprehensive Profile Controller
 * Strictly enforces authenticated session identity and CSRF protection.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];

$db = getDbConnection();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT u.id, u.email, u.mobile, u.full_name, u.role, u.status,
                   up.date_of_birth, up.gender, up.height_cm, up.weight_kg AS baseline_weight,
                   up.fitness_experience, up.emergency_contact_name, up.emergency_contact_phone, up.bio,
                   f.storage_key AS avatar_storage_key
            FROM users u
            LEFT JOIN user_profiles up ON up.user_id = u.id
            LEFT JOIN files f ON f.id = u.profile_picture_id
            WHERE u.id = :uid LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            apiResponse(false, 'User not found.', null, 404);
        }

        $age = null;
        if (!empty($user['date_of_birth'])) {
            $dob = new DateTime($user['date_of_birth']);
            $age = (new DateTime())->diff($dob)->y;
        }

        $stmt = $db->prepare("
            SELECT id, recorded_at, weight_kg, waist_cm, chest_cm, hips_cm, arms_cm, thighs_cm, body_fat_pct, notes
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

        $heightCm = !empty($user['height_cm']) ? (float)$user['height_cm'] : null;
        $gender = strtolower((string)($user['gender'] ?? 'male'));

        $stmt = $db->prepare("SELECT * FROM fitness_goals WHERE user_id = :uid AND status = 'active' ORDER BY id DESC LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $fitnessGoal = $stmt->fetch(PDO::FETCH_ASSOC);

        $goalType = $fitnessGoal ? $fitnessGoal['goal_type'] : 'hypertrophy';
        $goalTitle = $fitnessGoal ? $fitnessGoal['title'] : 'General Fitness';

        $stmt = $db->prepare("SELECT * FROM fitness_assessments WHERE user_id = :uid ORDER BY assessment_date DESC, id DESC LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $assessment = $stmt->fetch(PDO::FETCH_ASSOC);

        $activityLevel = $assessment ? (float)$assessment['activity_level'] : 1.55;

        // Deterministic biometric calculations (null-safe if height/weight/age not yet provided)
        $bmi = null; $bmr = null; $tdee = null; $estimatedBodyFat = null;
        $targetCalories = null; $targetProtein = null; $targetCarbs = null; $targetFat = null;
        $bmiCategory = 'Not calculated';

        if ($latestWeight !== null && $heightCm !== null && $heightCm > 0) {
            $calcAge = $age ?? 24;
            $heightM = $heightCm / 100.0;
            $bmi = round($latestWeight / ($heightM * $heightM), 1);
            $bmiCategory = ($bmi < 18.5) ? 'Underweight' : (($bmi < 25.0) ? 'Normal Weight' : (($bmi < 30.0) ? 'Overweight' : 'Obese'));

            $bmr = ($gender === 'female')
                ? round(10.0 * $latestWeight + 6.25 * $heightCm - 5.0 * $calcAge - 161.0)
                : round(10.0 * $latestWeight + 6.25 * $heightCm - 5.0 * $calcAge + 5.0);

            $tdee = round($bmr * $activityLevel);

            $genderFactor = ($gender === 'female') ? 0 : 1;
            $estimatedBodyFat = round((1.20 * $bmi) + (0.23 * $calcAge) - (10.8 * $genderFactor) - 5.4, 1);
            $estimatedBodyFat = max(4.0, min(55.0, $estimatedBodyFat));

            $targetCalories = $tdee;
            if ($goalType === 'fat_loss') $targetCalories -= 500;
            elseif ($goalType === 'hypertrophy') $targetCalories += 350;
            elseif ($goalType === 'strength') $targetCalories += 200;

            $targetProtein = round($latestWeight * 2.0);
            $targetFat = round(($targetCalories * 0.25) / 9.0);
            $targetCarbs = round(($targetCalories - ($targetProtein * 4.0) - ($targetFat * 9.0)) / 4.0);
        }

        // Home Gym & Membership Tier
        $stmt = $db->prepare("
            SELECT m.*, mp.name AS plan_name, g.name AS gym_name, g.city AS gym_city
            FROM memberships m
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            LEFT JOIN gyms g ON g.id = m.gym_id
            WHERE m.user_id = :uid
            ORDER BY FIELD(m.status, 'active', 'pending', 'frozen', 'expired', 'cancelled', 'rejected'), m.id DESC
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $membership = $stmt->fetch(PDO::FETCH_ASSOC);

        $gymName = $membership && $membership['gym_name'] ? $membership['gym_name'] : 'No Active Gym';
        $membershipTier = $membership ? (($membership['plan_name'] ?? 'Standard') . ' (' . ucfirst($membership['status']) . ')') : 'Free Tier (No Gym Pass)';

        // Assigned Trainer & Permissions
        $stmt = $db->prepare("
            SELECT ta.id AS assignment_id, u.id, u.full_name, u.email, u.mobile, tp.certification_name, tp.hourly_rate, tp.rating,
                   COALESCE(tdp.can_view_measurements, 1) AS can_view_measurements,
                   COALESCE(tdp.can_view_nutrition, 1) AS can_view_nutrition,
                   COALESCE(tdp.can_view_assessments, 1) AS can_view_assessments,
                   COALESCE(tdp.can_log_attendance, 1) AS can_log_attendance,
                   COALESCE(tdp.can_view_progress_photos, 0) AS can_view_progress_photos,
                   COALESCE(tdp.can_view_workouts, 1) AS can_view_workouts
            FROM trainer_assignments ta
            INNER JOIN users u ON u.id = ta.trainer_user_id AND u.status = 'active'
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            LEFT JOIN trainer_data_permissions tdp ON tdp.assignment_id = ta.id
            WHERE ta.user_id = :uid AND ta.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $trainer = $stmt->fetch(PDO::FETCH_ASSOC);

        // Actual Streak from attendance in last 7 days
        $stmt = $db->prepare("
            SELECT COUNT(DISTINCT DATE(check_in_time)) FROM attendance
            WHERE user_id = :uid AND check_in_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ");
        $stmt->execute([':uid' => $userId]);
        $streak = (int)$stmt->fetchColumn();

        // Notification Preferences
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

        $avatarUrl = !empty($user['avatar_storage_key']) ? $user['avatar_storage_key'] : 'assets/images/member_aarav.jpg';

        apiResponse(true, 'Profile loaded.', [
            'user' => [
                'id'                 => (int)$user['id'],
                'full_name'          => $user['full_name'],
                'email'              => $user['email'],
                'mobile'             => $user['mobile'] ?? '',
                'role'               => ucfirst($user['role']),
                'age'                => $age,
                'height_cm'          => $heightCm,
                'weight_kg'          => $latestWeight,
                'gender'             => $gender,
                'fitness_experience' => $user['fitness_experience'],
                'goal_type'          => $goalType,
                'goal_title'         => $goalTitle,
                'activity_level'     => $activityLevel,
                'home_gym'           => $gymName,
                'membership_tier'    => $membershipTier,
                'streak_days'        => $streak,
                'avatar'             => $avatarUrl,
                'bio'                => $user['bio'] ?? ''
            ],
            'biometrics' => [
                'bmi'             => $bmi,
                'bmi_category'    => $bmiCategory,
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
                'assignment_id'  => (int)$trainer['assignment_id'],
                'name'           => $trainer['full_name'],
                'email'          => $trainer['email'],
                'mobile'         => $trainer['mobile'],
                'title'          => $trainer['certification_name'] ?? 'Certified Strength Coach',
                'avatar'         => 'assets/images/trainer_raj.jpg'
            ] : null,
            'data_permissions' => $trainer ? [
                'can_view_measurements'    => (bool)$trainer['can_view_measurements'],
                'can_view_nutrition'       => (bool)$trainer['can_view_nutrition'],
                'can_view_assessments'     => (bool)$trainer['can_view_assessments'],
                'can_log_attendance'       => (bool)$trainer['can_log_attendance'],
                'can_view_progress_photos' => (bool)$trainer['can_view_progress_photos'],
                'can_view_workouts'        => (bool)$trainer['can_view_workouts']
            ] : null,
            'measurements' => [
                'total_entries' => $totalEntries,
                'history'       => $measurements
            ],
            'notifications' => $notifs
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync profile.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load user profile.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = (string)($input['action'] ?? 'save_body_stats');

    try {
        if ($action === 'save_body_stats') {
            $weight = isset($input['weight']) ? (float)$input['weight'] : 0.0;
            $height = isset($input['height']) ? (float)$input['height'] : 0.0;
            $age    = isset($input['age']) ? (int)$input['age'] : 0;
            $goal   = trim((string)($input['goal'] ?? 'Build Muscle'));
            $activityStr = (string)($input['activity_level'] ?? 'moderately_active');

            if ($weight <= 20.0 || $weight >= 350.0) {
                apiResponse(false, 'Weight must be between 20 kg and 350 kg.', null, 400);
            }
            if ($height < 100.0 || $height > 250.0) {
                apiResponse(false, 'Height must be between 100 cm and 250 cm.', null, 400);
            }
            if ($age < 13 || $age > 100) {
                apiResponse(false, 'Age must be between 13 and 100.', null, 400);
            }

            $activityMultipliers = [
                'sedentary'         => 1.2,
                'lightly_active'    => 1.375,
                'moderately_active' => 1.55,
                'very_active'       => 1.725,
                'extremely_active'  => 1.9
            ];
            $mult = is_numeric($activityStr) ? (float)$activityStr : ($activityMultipliers[$activityStr] ?? 1.55);

            $goalTypeMap = [
                'Lose Weight'       => 'fat_loss',
                'Build Muscle'      => 'hypertrophy',
                'Improve Strength'  => 'strength',
                'Improve Endurance' => 'endurance',
                'General Fitness'   => 'maintenance',
                'Maintain Weight'   => 'maintenance'
            ];
            $goalType = $goalTypeMap[$goal] ?? 'hypertrophy';

            $db->beginTransaction();

            // 1. Preserve measurement history by inserting new row
            $stmt = $db->prepare("
                INSERT INTO body_measurements (user_id, recorded_at, weight_kg, notes, created_at)
                VALUES (:uid, CURDATE(), :w, 'Profile biometric update', NOW())
            ");
            $stmt->execute([':uid' => $userId, ':w' => $weight]);

            // 2. Update user_profiles
            $birthYear = (int)date('Y') - $age;
            $approxDob = "$birthYear-01-01";

            $stmt = $db->prepare("
                INSERT INTO user_profiles (user_id, height_cm, weight_kg, date_of_birth, updated_at)
                VALUES (:uid, :h, :w, :dob, NOW())
                ON DUPLICATE KEY UPDATE height_cm = VALUES(height_cm), weight_kg = VALUES(weight_kg), date_of_birth = VALUES(date_of_birth), updated_at = NOW()
            ");
            $stmt->execute([':uid' => $userId, ':h' => $height, ':w' => $weight, ':dob' => $approxDob]);

            // 3. Update active fitness_goals
            $gCheck = $db->prepare("SELECT id FROM fitness_goals WHERE user_id = :uid AND status = 'active' LIMIT 1");
            $gCheck->execute([':uid' => $userId]);
            $gid = $gCheck->fetchColumn();
            if ($gid) {
                $db->prepare("UPDATE fitness_goals SET title = :title, goal_type = :gtype, updated_at = NOW() WHERE id = :gid")
                    ->execute([':title' => $goal, ':gtype' => $goalType, ':gid' => $gid]);
            } else {
                $db->prepare("
                    INSERT INTO fitness_goals (user_id, title, goal_type, target_weight_kg, starting_weight_kg, status, progress_pct, created_at, updated_at)
                    VALUES (:uid, :title, :gtype, :tw, :sw, 'active', 0, NOW(), NOW())
                ")->execute([':uid' => $userId, ':title' => $goal, ':gtype' => $goalType, ':tw' => $weight, ':sw' => $weight]);
            }

            // 4. Deterministic Biometrics
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
            $estimatedBodyFat = max(4.0, min(55.0, round((1.20 * $bmi) + (0.23 * $age) - 10.8 - 5.4, 1)));

            $stmt = $db->prepare("
                INSERT INTO fitness_assessments (user_id, assessment_date, height_cm, weight_kg, age, gender, activity_level, bmr_kcal, tdee_kcal, target_calories_kcal, target_protein_g, target_carbs_g, target_fat_g, bmi, body_fat_us_navy, created_at)
                VALUES (:uid, CURDATE(), :h, :w, :age, 'male', :act, :bmr, :tdee, :cal, :prot, :carb, :fat, :bmi, :bf, NOW())
            ");
            $stmt->execute([
                ':uid'  => $userId, ':h' => $height, ':w' => $weight, ':age' => $age,
                ':act'  => $mult, ':bmr' => $bmr, ':tdee' => $tdee, ':cal' => $targetCalories,
                ':prot' => $targetProtein, ':carb' => $targetCarbs, ':fat' => $targetFat,
                ':bmi'  => $bmi, ':bf' => $estimatedBodyFat
            ]);

            $db->commit();

            jsonResponse([
                'success' => true,
                'message' => 'Body statistics and daily targets successfully saved.',
                'data' => [
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
                ]
            ]);
        }

        if ($action === 'record_milestone') {
            $w      = (float)($input['weight_kg'] ?? ($input['weight'] ?? 0));
            $waist  = !empty($input['waist_cm']) ? (float)$input['waist_cm'] : (!empty($input['waist']) ? (float)$input['waist'] : null);
            $chest  = !empty($input['chest_cm']) ? (float)$input['chest_cm'] : (!empty($input['chest']) ? (float)$input['chest'] : null);
            $hips   = !empty($input['hips_cm']) ? (float)$input['hips_cm'] : null;
            $arms   = !empty($input['arms_cm']) ? (float)$input['arms_cm'] : (!empty($input['arms']) ? (float)$input['arms'] : null);
            $thighs = !empty($input['thighs_cm']) ? (float)$input['thighs_cm'] : null;
            $notes  = !empty($input['notes']) ? trim((string)$input['notes']) : 'Milestone Entry';

            if ($w <= 20 || $w >= 350) {
                apiResponse(false, 'Please enter a valid weight between 20 kg and 350 kg.', null, 400);
            }

            $service = FitSyncDataService::getInstance($db);
            $res = $service->recordWeightMeasurement($userId, $w, $waist, $chest, $arms, $thighs, null, $notes);
            apiResponse(true, 'Body milestone entry recorded successfully.', $res);
        }

        if ($action === 'delete_measurement') {
            $measId = (int)($input['measurement_id'] ?? ($input['id'] ?? 0));
            $stmt = $db->prepare("DELETE FROM body_measurements WHERE id = :mid AND user_id = :uid");
            $stmt->execute([':mid' => $measId, ':uid' => $userId]);
            apiResponse(true, 'Measurement entry deleted.');
        }

        if ($action === 'save_profile_details') {
            $fullName = trim((string)($input['full_name'] ?? ''));
            $mobile   = trim((string)($input['mobile'] ?? ''));
            $bio      = isset($input['bio']) ? trim((string)$input['bio']) : null;
            $avatar   = isset($input['avatar_url']) ? trim((string)$input['avatar_url']) : null;

            if (empty($fullName)) {
                apiResponse(false, 'Full name cannot be empty.', null, 400);
            }

            $db->beginTransaction();

            $profilePicId = null;
            if (!empty($avatar) && preg_match('#^(assets/|https?://)#i', $avatar)) {
                $fStmt = $db->prepare("SELECT id FROM files WHERE owner_user_id = :uid AND purpose = 'profile_picture' LIMIT 1");
                $fStmt->execute([':uid' => $userId]);
                $existingFileId = $fStmt->fetchColumn();
                if ($existingFileId) {
                    $db->prepare("UPDATE files SET storage_key = :sk WHERE id = :fid")->execute([':sk' => $avatar, ':fid' => $existingFileId]);
                    $profilePicId = (int)$existingFileId;
                } else {
                    $db->prepare("
                        INSERT INTO files (owner_user_id, storage_key, original_name, mime_type, size_bytes, purpose, is_private)
                        VALUES (:uid, :sk, 'avatar.jpg', 'image/jpeg', 0, 'profile_picture', 0)
                    ")->execute([':uid' => $userId, ':sk' => $avatar]);
                    $profilePicId = (int)$db->lastInsertId();
                }
            }

            if ($profilePicId !== null) {
                $stmt = $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob, profile_picture_id = :ppid, updated_at = NOW() WHERE id = :uid");
                $stmt->execute([':fn' => $fullName, ':mob' => $mobile ?: null, ':ppid' => $profilePicId, ':uid' => $userId]);
            } else {
                $stmt = $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob, updated_at = NOW() WHERE id = :uid");
                $stmt->execute([':fn' => $fullName, ':mob' => $mobile ?: null, ':uid' => $userId]);
            }

            if ($bio !== null) {
                $db->prepare("
                    INSERT INTO user_profiles (user_id, bio, updated_at)
                    VALUES (:uid, :bio, NOW())
                    ON DUPLICATE KEY UPDATE bio = VALUES(bio), updated_at = NOW()
                ")->execute([':bio' => $bio, ':uid' => $userId]);
            }

            $db->commit();

            $_SESSION['full_name'] = $fullName;
            if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
                $_SESSION['user']['full_name'] = $fullName;
                $_SESSION['user']['name'] = $fullName;
                $_SESSION['user']['mobile'] = $mobile;
            }

            apiResponse(true, 'Profile details successfully updated.');
        }

        if ($action === 'save_data_permissions') {
            $aStmt = $db->prepare("SELECT id FROM trainer_assignments WHERE user_id = :uid AND status = 'active' LIMIT 1");
            $aStmt->execute([':uid' => $userId]);
            $assignmentId = (int)$aStmt->fetchColumn();
            if ($assignmentId <= 0) {
                apiResponse(false, 'No active trainer assignment found.', null, 404);
            }

            $cMeas = !empty($input['can_view_measurements']) ? 1 : 0;
            $cNut  = !empty($input['can_view_nutrition']) ? 1 : 0;
            $cAss  = !empty($input['can_view_assessments']) ? 1 : 0;
            $cAtt  = array_key_exists('can_log_attendance', $input) ? (!empty($input['can_log_attendance']) ? 1 : 0) : 1;
            $cPho  = !empty($input['can_view_progress_photos']) ? 1 : 0;
            $cWork = array_key_exists('can_view_workouts', $input) ? (!empty($input['can_view_workouts']) ? 1 : 0) : 1;

            $stmt = $db->prepare("
                INSERT INTO trainer_data_permissions (assignment_id, can_view_measurements, can_view_nutrition, can_view_assessments, can_log_attendance, can_view_progress_photos, can_view_workouts)
                VALUES (:aid, :m, :n, :a, :att, :pho, :wk)
                ON DUPLICATE KEY UPDATE
                    can_view_measurements = VALUES(can_view_measurements),
                    can_view_nutrition = VALUES(can_view_nutrition),
                    can_view_assessments = VALUES(can_view_assessments),
                    can_log_attendance = VALUES(can_log_attendance),
                    can_view_progress_photos = VALUES(can_view_progress_photos),
                    can_view_workouts = VALUES(can_view_workouts)
            ");
            $stmt->execute([':aid' => $assignmentId, ':m' => $cMeas, ':n' => $cNut, ':a' => $cAss, ':att' => $cAtt, ':pho' => $cPho, ':wk' => $cWork]);
            apiResponse(true, 'Trainer data sharing permissions updated.');
        }

        if ($action === 'save_notifications') {
            $items = [
                'workout_reminders' => !empty($input['workout_reminders']) ? 1 : 0,
                'nutrition_alerts'  => !empty($input['nutrition_alerts']) ? 1 : 0,
                'coach_messages'    => !empty($input['coach_messages']) ? 1 : 0,
                'gym_announcements' => !empty($input['gym_announcements']) ? 1 : 0
            ];

            foreach ($items as $k => $v) {
                $stmt = $db->prepare("
                    INSERT INTO notification_preferences (user_id, event_type, in_app, email, sms, push)
                    VALUES (?, ?, ?, ?, 0, ?)
                    ON DUPLICATE KEY UPDATE in_app = VALUES(in_app), email = VALUES(email), push = VALUES(push)
                ");
                $stmt->execute([$userId, $k, $v, $v, $v]);
            }

            apiResponse(true, 'Notification preferences saved.');
        }

        if ($action === 'change_password') {
            $currentPwd = (string)($input['current_password'] ?? '');
            $newPwd     = (string)($input['new_password'] ?? '');

            if (mb_strlen($newPwd) < 6) {
                apiResponse(false, 'New password must be at least 6 characters long.', null, 400);
            }

            $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = :uid LIMIT 1");
            $stmt->execute([':uid' => $userId]);
            $userRow = $stmt->fetch();

            if (!$userRow || !password_verify($currentPwd, $userRow['password_hash'])) {
                apiResponse(false, 'Current password entered is incorrect.', null, 400);
            }

            $newHash = password_hash($newPwd, PASSWORD_DEFAULT);
            $upStmt = $db->prepare("UPDATE users SET password_hash = :phash, updated_at = NOW() WHERE id = :uid");
            $upStmt->execute([':phash' => $newHash, ':uid' => $userId]);

            apiResponse(true, 'Password changed successfully.');
        }

        apiResponse(false, 'Unknown action: ' . $action, null, 400);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('[FitSync profile.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to save profile update.', null, 500);
    }
}

apiResponse(false, 'Method not allowed', null, 405);
