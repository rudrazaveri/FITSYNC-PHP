<?php
/**
 * FitSync AI — Assessment API Endpoint
 * Accepts JSON or POST form data, calculates Mifflin-St Jeor BMR & TDEE, returns JSON.
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/supabase.php';

// Accept JSON payload or standard POST
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$age = intval($input['age'] ?? 25);
$gender = strtolower(trim($input['gender'] ?? 'male'));
$height = floatval($input['height'] ?? 175);
$weight = floatval($input['weight'] ?? 72);
$activity = floatval($input['activity'] ?? 1.55);
$goal = trim($input['goal'] ?? 'muscle_gain');

// 1. BMI Calculation
$heightM = $height / 100;
$bmi = round($weight / ($heightM * $heightM), 1);

// 2. Mifflin-St Jeor BMR:
// Men: 10 * W + 6.25 * H - 5 * A + 5
// Women: 10 * W + 6.25 * H - 5 * A - 161
$bmr = (10 * $weight) + (6.25 * $height) - (5 * $age);
if ($gender === 'female') {
    $bmr -= 161;
} else {
    $bmr += 5;
}
$bmr = intval(round($bmr));

// 3. TDEE
$tdee = intval(round($bmr * $activity));

// 4. Calorie target based on goal
$targetCalories = $tdee;
if ($goal === 'muscle_gain') {
    $targetCalories = $tdee + 300;
} elseif ($goal === 'fat_loss') {
    $targetCalories = max(1200, $tdee - 450);
}

// 5. Target Macros (approx 2.0g protein/kg)
$proteinG = intval(round($weight * 2.0));
$fatG = intval(round(($targetCalories * 0.25) / 9));
$carbsG = intval(round(($targetCalories - ($proteinG * 4) - ($fatG * 9)) / 4));

$result = [
    'success' => true,
    'metrics' => [
        'age' => $age,
        'gender' => $gender,
        'height_cm' => $height,
        'weight_kg' => $weight,
        'bmi' => $bmi,
        'bmr_kcal' => $bmr,
        'tdee_kcal' => $tdee,
        'target_calories' => $targetCalories,
        'macros' => [
            'protein_g' => $proteinG,
            'carbs_g' => $carbsG,
            'fat_g' => $fatG
        ]
    ]
];

echo json_encode($result);
exit;
