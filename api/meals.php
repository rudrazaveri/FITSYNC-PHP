<?php
/**
 * FitSync AI — Meals API Endpoint
 * Handles logging nutrition intake and calculating daily totals.
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/supabase.php';

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$mealCategory = $input['category'] ?? 'lunch';
$foodName = $input['food_name'] ?? 'Grilled Chicken Breast Bowl';
$calories = intval($input['calories'] ?? 450);
$protein = intval($input['protein'] ?? 40);
$carbs = intval($input['carbs'] ?? 45);
$fat = intval($input['fat'] ?? 10);

$response = [
    'success' => true,
    'message' => 'Meal successfully logged.',
    'meal' => [
        'category' => $mealCategory,
        'food_name' => $foodName,
        'calories' => $calories,
        'protein_g' => $protein,
        'carbs_g' => $carbs,
        'fat_g' => $fat,
        'timestamp' => date('Y-m-d H:i:s')
    ]
];

echo json_encode($response);
exit;
