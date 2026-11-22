<?php
/**
 * FitSync AI — API: CSRF Token Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

jsonResponse([
    'success'    => true,
    'csrf_token' => getCsrfToken()
]);
