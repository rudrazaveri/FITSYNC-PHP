<?php
/**
 * FitSync AI — Assessment API Endpoint (Authoritative MySQL Persistence)
 * Calculates Mifflin-St Jeor BMR & TDEE and persists into fitness_assessments.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];

$db = getDbConnection();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method not allowed.', null, 405);
}

requireCsrfToken();

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$age      = max(13, min(100, (int)($input['age'] ?? 25)));
$gender   = strtolower(trim((string)($input['gender'] ?? 'male')));
if (!in_array($gender, ['male', 'female', 'other'], true)) {
    $gender = 'male';
}
$height   = max(100.0, min(250.0, (float)($input['height'] ?? 175)));
$weight   = max(20.0, min(350.0, (float)($input['weight'] ?? 72)));
$activity = max(1.1, min(2.4, (float)($input['activity'] ?? 1.55)));
$goalRaw  = trim((string)($input['goal'] ?? 'muscle_gain'));

$heightM = $height / 100.0;
$bmi = round($weight / ($heightM * $heightM), 1);

$bmr = (10.0 * $weight) + (6.25 * $height) - (5.0 * $age);
$bmr += ($gender === 'female') ? -161.0 : 5.0;
$bmr = (int)round($bmr);

$tdee = (int)round($bmr * $activity);

$goalType = 'hypertrophy';
$goalTitle = 'Build Muscle';
$targetCalories = $tdee;
if ($goalRaw === 'muscle_gain' || $goalRaw === 'hypertrophy') {
    $targetCalories = $tdee + 250;
    $goalType = 'hypertrophy';
    $goalTitle = 'Build Muscle';
} elseif ($goalRaw === 'fat_loss' || $goalRaw === 'lose_weight') {
    $targetCalories = max(1200, $tdee - 450);
    $goalType = 'fat_loss';
    $goalTitle = 'Lose Weight';
} elseif ($goalRaw === 'maintenance' || $goalRaw === 'maintain') {
    $goalType = 'maintenance';
    $goalTitle = 'Maintain Weight';
} elseif ($goalRaw === 'strength') {
    $targetCalories = $tdee + 200;
    $goalType = 'strength';
    $goalTitle = 'Improve Strength';
}

$proteinG = (int)round($weight * 2.0);
$fatG     = (int)round(($targetCalories * 0.25) / 9.0);
$carbsG   = max(20, (int)round(($targetCalories - ($proteinG * 4) - ($fatG * 9)) / 4.0));

$waist  = isset($input['waist']) && is_numeric($input['waist']) ? (float)$input['waist'] : 0.0;
$neck   = isset($input['neck']) && is_numeric($input['neck']) ? (float)$input['neck'] : 0.0;
$hip    = isset($input['hip']) && is_numeric($input['hip']) ? (float)$input['hip'] : 0.0;

$bodyFatPct = round((1.20 * $bmi) + (0.23 * $age) - (10.8 * ($gender === 'female' ? 0 : 1)) - 5.4, 1);
if ($gender === 'female' && ($waist + $hip - $neck) > 10 && $height > 0) {
    $bodyFatPct = round(495 / (1.29579 - 0.35004 * log10($waist + $hip - $neck) + 0.22100 * log10($height)) - 450, 1);
} elseif ($gender !== 'female' && ($waist - $neck) > 5 && $height > 0) {
    $bodyFatPct = round(495 / (1.0324 - 0.19077 * log10($waist - $neck) + 0.15456 * log10($height)) - 450, 1);
}
$bodyFatPct = max(5.0, min(55.0, $bodyFatPct));

try {
    $db->beginTransaction();

    $stmt = $db->prepare("
        INSERT INTO fitness_assessments (
            user_id, assessment_date, height_cm, weight_kg, age, gender, activity_level,
            bmr_kcal, tdee_kcal, target_calories_kcal, target_protein_g, target_carbs_g, target_fat_g,
            bmi, body_fat_us_navy, created_at
        ) VALUES (
            :uid, CURDATE(), :h, :w, :age, :gender, :act,
            :bmr, :tdee, :cal, :prot, :carb, :fat,
            :bmi, :bf, NOW()
        )
    ");
    $stmt->execute([
        ':uid' => $userId, ':h' => $height, ':w' => $weight, ':age' => $age,
        ':gender' => $gender, ':act' => $activity, ':bmr' => $bmr, ':tdee' => $tdee,
        ':cal' => $targetCalories, ':prot' => $proteinG, ':carb' => $carbsG,
        ':fat' => $fatG, ':bmi' => $bmi, ':bf' => $bodyFatPct
    ]);

    $birthYear = (int)date('Y') - $age;
    $db->prepare("
        INSERT INTO user_profiles (user_id, date_of_birth, gender, height_cm, weight_kg, updated_at)
        VALUES (:uid, :dob, :g, :h, :w, NOW())
        ON DUPLICATE KEY UPDATE date_of_birth = VALUES(date_of_birth), gender = VALUES(gender), height_cm = VALUES(height_cm), weight_kg = VALUES(weight_kg), updated_at = NOW()
    ")->execute([
        ':uid' => $userId, ':dob' => "$birthYear-01-01", ':g' => $gender, ':h' => $height, ':w' => $weight
    ]);

    $db->prepare("
        INSERT INTO body_measurements (user_id, recorded_at, weight_kg, body_fat_pct, waist_cm, hips_cm, notes, created_at)
        VALUES (:uid, CURDATE(), :w, :bf, :waist, :hip, 'Biometric assessment update', NOW())
    ")->execute([
        ':uid'   => $userId,
        ':w'     => $weight,
        ':bf'    => $bodyFatPct,
        ':waist' => $waist > 0 ? $waist : null,
        ':hip'   => $hip > 0 ? $hip : null
    ]);

    $gChk = $db->prepare("SELECT id FROM fitness_goals WHERE user_id = :uid AND status = 'active' LIMIT 1");
    $gChk->execute([':uid' => $userId]);
    $gid = $gChk->fetchColumn();
    if ($gid) {
        $db->prepare("UPDATE fitness_goals SET title = :t, goal_type = :gt, updated_at = NOW() WHERE id = :gid")
            ->execute([':t' => $goalTitle, ':gt' => $goalType, ':gid' => $gid]);
    } else {
        $db->prepare("INSERT INTO fitness_goals (user_id, title, goal_type, target_weight_kg, starting_weight_kg, status, progress_pct, created_at, updated_at) VALUES (:uid, :t, :gt, :w, :w2, 'active', 0, NOW(), NOW())")
            ->execute([':uid' => $userId, ':t' => $goalTitle, ':gt' => $goalType, ':w' => $weight, ':w2' => $weight]);
    }

    $db->commit();

    $metrics = [
        'age'             => $age,
        'gender'          => $gender,
        'height_cm'       => $height,
        'weight_kg'       => $weight,
        'bmi'             => $bmi,
        'bmr_kcal'        => $bmr,
        'tdee_kcal'       => $tdee,
        'body_fat_pct'    => $bodyFatPct,
        'target_calories' => $targetCalories,
        'macros' => [
            'protein_g' => $proteinG,
            'carbs_g'   => $carbsG,
            'fat_g'     => $fatG
        ]
    ];

    jsonResponse([
        'success' => true,
        'message' => 'Biometric assessment saved to your FitSync profile.',
        'data'    => $metrics,
        'metrics' => $metrics
    ]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('[FitSync assessment.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to save biometric assessment.', null, 500);
}
