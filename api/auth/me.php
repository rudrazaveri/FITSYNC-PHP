<?php
/**
 * FitSync AI — API: Current Authenticated User Session Profile
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

if (!isLoggedIn()) {
    jsonResponse([
        'isLoggedIn' => false,
        'user'       => null
    ]);
}

jsonResponse([
    'isLoggedIn' => true,
    'user'       => currentUser(),
    'csrf_token' => getCsrfToken()
]);
