<?php
/**
 * Test Gym Owner PHP rendering
 */

$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_URI'] = '/gym_owner/dashboard.php';
$_SERVER['SCRIPT_NAME'] = '/gym_owner/dashboard.php';

require_once __DIR__ . '/../config/bootstrap.php';

$_SESSION['user_id'] = 1;
$_SESSION['role'] = 'gym_owner';

ob_start();
require __DIR__ . '/../gym_owner/dashboard.php';
$output = ob_get_clean();

echo "Rendered dashboard length: " . strlen($output) . "\n";
echo "Has 'Command Center': " . (strpos($output, 'Command Center') !== false ? 'YES' : 'NO') . "\n";
echo "Has 'Registered Athletes': " . (strpos($output, 'Registered Athletes') !== false ? 'YES' : 'NO') . "\n";
echo "Has 'Certified Coaches': " . (strpos($output, 'Certified Coaches') !== false ? 'YES' : 'NO') . "\n";
echo "Has 'modalAddCoach': " . (strpos($output, 'modalAddCoach') !== false ? 'YES' : 'NO') . "\n";
echo "Has 'modalAddMember': " . (strpos($output, 'modalAddMember') !== false ? 'YES' : 'NO') . "\n";
