<?php
/**
 * FitSync AI — API: User Logout
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

logoutUser();

jsonResponse([
    'success'  => true,
    'message'  => 'You have been securely signed out.',
    'redirect' => url('login.php')
]);
