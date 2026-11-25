<?php
/**
 * FitSync AI — API: Role-Specific Registration (Member, Trainer, Gym Owner)
 * Supports application/json and multipart/form-data (with secure file uploads).
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method Not Allowed. Use POST.'], 405);
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
} else {
    $input = $_POST;
}

// Enforce CSRF token strictly (accepted via X-CSRF-Token header or form field)
if (isset($input['csrf_token'])) {
    $_POST['csrf_token'] = $input['csrf_token'];
}
requireCsrfToken();

$result = registerUser($input, $_FILES ?? []);
$statusCode = (int)($result['status_code'] ?? ($result['success'] ? 201 : 400));
unset($result['status_code']);

jsonResponse($result, $statusCode);
