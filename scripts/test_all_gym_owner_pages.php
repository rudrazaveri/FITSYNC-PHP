<?php
/**
 * Test all Gym Owner PHP pages
 */

$_SERVER['HTTP_HOST'] = 'localhost';
require_once __DIR__ . '/../config/bootstrap.php';
$_SESSION['user_id'] = 1;
$_SESSION['role'] = 'gym_owner';

$pages = [
    'index.php',
    'dashboard.php',
    'coaches.php',
    'members.php',
    'attendance.php',
    'settings.php'
];

foreach ($pages as $p) {
    $_SERVER['REQUEST_URI'] = '/gym_owner/' . $p;
    $_SERVER['SCRIPT_NAME'] = '/gym_owner/' . $p;
    ob_start();
    require __DIR__ . '/../gym_owner/' . $p;
    $out = ob_get_clean();
    echo "Page gym_owner/{$p} rendered successfully: " . strlen($out) . " bytes\n";
}
