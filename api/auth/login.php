<?php
/**
 * FitSync AI — API: User Authentication (Login)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method Not Allowed. Use POST.'], 405);
}

// Read input from JSON body or standard form POST
$input = [];
if (!empty($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
} else {
    $input = $_POST;
}

// Validate CSRF if token is provided
if (isset($input['csrf_token']) || isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
    requireCsrfToken();
}

$email    = (string)($input['email'] ?? '');
$password = (string)($input['password'] ?? '');
$remember = !empty($input['remember']);

$result = authenticateUser($email, $password, $remember);

$statusCode = $result['success'] ? 200 : 401;
jsonResponse($result, $statusCode);
