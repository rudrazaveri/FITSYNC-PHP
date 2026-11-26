<?php
/**
 * FitSync AI — API: Email Verification (Verify Code / Resend Code)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method not allowed.', null, 405);
}

initSecureSession();
$authUser = isLoggedIn() ? currentUser() : null;
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
requireCsrfToken();

$action = trim((string)($input['action'] ?? 'verify'));
$db = getDbConnection();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$userId = $authUser ? (int)$authUser['id'] : 0;
if ($userId <= 0 && !empty($input['email'])) {
    $uStmt = $db->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(:em) LIMIT 1");
    $uStmt->execute([':em' => trim((string)$input['email'])]);
    $userId = (int)$uStmt->fetchColumn();
}

if ($userId <= 0) {
    apiResponse(false, 'Authentication or valid email required.', null, 401);
}

try {
    if ($action === 'resend') {
        $uStmt = $db->prepare("SELECT id, email, email_verified_at FROM users WHERE id = :uid LIMIT 1");
        $uStmt->execute([':uid' => $userId]);
        $u = $uStmt->fetch(PDO::FETCH_ASSOC);
        if (!$u) {
            apiResponse(false, 'User not found.', null, 404);
        }
        if (!empty($u['email_verified_at'])) {
            apiResponse(true, 'Email is already verified.', ['email_verified_at' => $u['email_verified_at']]);
        }
        $code = (string)random_int(100000, 999999);
        $hash = hash('sha256', $code);
        $db->prepare("INSERT INTO auth_tokens (user_id, purpose, token_hash, new_email, expires_at, created_at) VALUES (:uid, 'email_verify', :th, :em, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW())")
            ->execute([':uid' => $userId, ':th' => $hash, ':em' => $u['email']]);
        @mail((string)$u['email'], 'FitSync Email Verification Code', "Your FitSync verification code is: {$code}");
        apiResponse(true, 'Verification code generated.', ['verification_code' => $code]);
    }

    $code = trim((string)($input['code'] ?? ($input['token'] ?? '')));
    if ($code === '') {
        apiResponse(false, 'Verification code is required.', null, 400);
    }
    $hash = hash('sha256', $code);

    $db->beginTransaction();
    $tStmt = $db->prepare("
        SELECT id FROM auth_tokens
        WHERE user_id = :uid AND purpose = 'email_verify' AND token_hash = :th AND used_at IS NULL AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    ");
    $tStmt->execute([':uid' => $userId, ':th' => $hash]);
    $tokenId = $tStmt->fetchColumn();
    if (!$tokenId) {
        $db->rollBack();
        apiResponse(false, 'Invalid or expired verification code.', null, 400);
    }

    $db->prepare("UPDATE auth_tokens SET used_at = NOW() WHERE id = :id")->execute([':id' => $tokenId]);
    $db->prepare("UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = :uid")->execute([':uid' => $userId]);
    $db->commit();

    apiResponse(true, 'Email address verified successfully!', ['email_verified' => true]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('[FitSync verify_email.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to verify email.', null, 500);
}
