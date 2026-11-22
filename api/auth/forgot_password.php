<?php
/**
 * FitSync AI — API: Forgot Password Token Request
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method Not Allowed. Use POST.'], 405);
}

$input = [];
if (!empty($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
} else {
    $input = $_POST;
}

if (isset($input['csrf_token']) || isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
    requireCsrfToken();
}

$email = (string)($input['email'] ?? '');
$result = requestPasswordReset($email);

$statusCode = $result['success'] ? 200 : 400;
jsonResponse($result, $statusCode);
