<?php
/**
 * FitSync AI — API: User Registration
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

$result = registerUser($input);

$statusCode = $result['success'] ? 201 : 400;
jsonResponse($result, $statusCode);
