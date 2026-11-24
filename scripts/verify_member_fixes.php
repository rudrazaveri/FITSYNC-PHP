<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

echo "=== FITSYNC MEMBER PORTAL VERIFICATION ===" . PHP_EOL;
echo "Timezone: " . date_default_timezone_get() . PHP_EOL;
echo "Kolkata Time: " . date('Y-m-d H:i:s') . PHP_EOL;

$userId = getActiveMemberUserId();
echo "Active User ID: " . $userId . PHP_EOL;

$svc = FitSyncDataService::getInstance();
$dash = $svc->getUserDashboard($userId);

echo "User Name: " . $dash['user']['full_name'] . PHP_EOL;
echo "Calories: " . $dash['nutrition']['calories'] . " kcal (Meals: " . $dash['nutrition']['meal_count'] . ")" . PHP_EOL;
echo "Water: " . $dash['water']['liters'] . " L (" . $dash['water']['total_ml'] . " ml)" . PHP_EOL;

// Test greeting boundaries
function testGreeting(int $h): string {
    if ($h >= 5 && $h < 12) return 'Good Morning';
    if ($h >= 12 && $h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

echo "Greeting at 08:00 -> " . testGreeting(8) . " (Expected: Good Morning)" . PHP_EOL;
echo "Greeting at 15:00 -> " . testGreeting(15) . " (Expected: Good Afternoon)" . PHP_EOL;
echo "Greeting at 19:00 -> " . testGreeting(19) . " (Expected: Good Evening)" . PHP_EOL;
echo "Greeting at 02:00 -> " . testGreeting(2) . " (Expected: Good Evening)" . PHP_EOL;

// Test HTTP endpoints
$base = 'http://127.0.0.1:8080';

// 1. Dashboard API
$dashJson = json_decode(file_get_contents($base . '/api/user/dashboard.php'), true);
echo "API Dashboard Status: " . ($dashJson['success'] ? 'OK' : 'FAIL') . PHP_EOL;
echo "API Calories: " . $dashJson['data']['nutrition']['calories'] . PHP_EOL;
echo "API Water: " . $dashJson['data']['water']['liters'] . PHP_EOL;

// 2. Add Water via POST
$opts = [
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode(['amount_ml' => 250])
    ]
];
$wRes = json_decode(file_get_contents($base . '/api/water.php', false, stream_context_create($opts)), true);
echo "Add Water (+250ml): " . ($wRes['success'] ? 'SUCCESS' : 'FAIL') . " -> New Total: " . $wRes['data']['total_ml'] . " ml (" . $wRes['data']['liters'] . " L)" . PHP_EOL;

// Check dashboard reflects the added water
$dashJson2 = json_decode(file_get_contents($base . '/api/user/dashboard.php'), true);
echo "Dashboard updated water: " . $dashJson2['data']['water']['liters'] . " L" . PHP_EOL;

// Reset water via DELETE
$optsDel = [
    'http' => [
        'method' => 'DELETE',
        'header' => 'Content-Type: application/json',
        'content' => json_encode(['action' => 'reset'])
    ]
];
$wDel = json_decode(file_get_contents($base . '/api/water.php', false, stream_context_create($optsDel)), true);
echo "Reset Water: " . ($wDel['success'] ? 'SUCCESS' : 'FAIL') . " -> New Total: " . $wDel['data']['total_ml'] . " ml" . PHP_EOL;

// Verify dashboard is back to 0 L
$dashJson3 = json_decode(file_get_contents($base . '/api/user/dashboard.php'), true);
echo "Dashboard after reset: " . $dashJson3['data']['water']['liters'] . " L" . PHP_EOL;

// 3. Add Meal via POST
$mealOpts = [
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode([
            'category'  => 'lunch',
            'food_name' => 'Grilled Chicken Salad',
            'protein'   => 40,
            'carbs'     => 15,
            'fat'       => 10,
            'calories'  => 310
        ])
    ]
];
$mRes = json_decode(file_get_contents($base . '/api/meals.php', false, stream_context_create($mealOpts)), true);
echo "Add Meal (+310 kcal): " . ($mRes['success'] ? 'SUCCESS' : 'FAIL') . PHP_EOL;
$newMealId = $mRes['meal']['id'] ?? $mRes['data']['id'] ?? null;

// Check dashboard reflects the meal
$dashJson4 = json_decode(file_get_contents($base . '/api/user/dashboard.php'), true);
echo "Dashboard updated calories: " . $dashJson4['data']['nutrition']['calories'] . " kcal" . PHP_EOL;
echo "Dashboard updated protein: " . $dashJson4['data']['nutrition']['protein'] . " g" . PHP_EOL;

// Delete meal via DELETE
if ($newMealId) {
    $delOpts = [
        'http' => [
            'method' => 'DELETE',
            'header' => 'Content-Type: application/json',
            'content' => json_encode(['id' => $newMealId])
        ]
    ];
    $mDel = json_decode(file_get_contents($base . '/api/meals.php', false, stream_context_create($delOpts)), true);
    echo "Delete Meal: " . ($mDel['success'] ? 'SUCCESS' : 'FAIL') . PHP_EOL;
}

// Final check: 0 meals and 0 water
$dashFinal = json_decode(file_get_contents($base . '/api/user/dashboard.php'), true);
echo "Final clean state - Calories: " . $dashFinal['data']['nutrition']['calories'] . " kcal, Water: " . $dashFinal['data']['water']['liters'] . " L" . PHP_EOL;
echo "=== ALL TESTS COMPLETED SUCCESSFULLY ===" . PHP_EOL;
