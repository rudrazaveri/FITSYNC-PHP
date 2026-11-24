<?php
$_SERVER['HTTP_HOST'] = 'localhost';
require_once __DIR__ . '/../config/bootstrap.php';

// Test login.php render
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/login.php';
$_SERVER['SCRIPT_NAME'] = '/login.php';

ob_start();
require __DIR__ . '/../login.php';
$loginOut = ob_get_clean();
echo "login.php render length: " . strlen($loginOut) . "\n";
echo "login.php has demo logins: " . (strpos($loginOut, 'Demo Logins') !== false ? 'YES' : 'NO') . "\n";

// Test register.php render
$_SERVER['REQUEST_URI'] = '/register.php';
$_SERVER['SCRIPT_NAME'] = '/register.php';

ob_start();
require __DIR__ . '/../register.php';
$regOut = ob_get_clean();
echo "register.php render length: " . strlen($regOut) . "\n";
