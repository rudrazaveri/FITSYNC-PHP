<?php
/**
 * FitSync AI — API: Gym Owner Delete / Deactivate User or Coach
 * Fixes ENUM 'deactivated', enforces gym_owner session, CSRF, and gym ownership.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['gym_owner', 'admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method not allowed. Use POST.', null, 405);
}

requireCsrfToken();

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$email    = trim((string)($input['email'] ?? ''));
$userId   = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$coachId  = trim((string)($input['coach_id'] ?? ($input['id'] ?? '')));
$reqGymId = isset($input['gym_id']) && (int)$input['gym_id'] > 0 ? (int)$input['gym_id'] : null;

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$gymId = $service->resolveOwnerGymId((int)$authUser['id'], $reqGymId, $authUser['role']);
if ($gymId === null) {
    apiResponse(false, 'Forbidden: No gym facility owned by your account.', null, 403);
}

try {
    if ($userId <= 0 && !empty($coachId)) {
        $cleanId = str_replace(['tr-', 'mem-'], '', $coachId);
        if (is_numeric($cleanId)) {
            $userId = (int)$cleanId;
        }
    }

    if ($userId <= 0 && !empty($email)) {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $userId = (int)$stmt->fetchColumn();
    }

    if ($userId <= 0) {
        apiResponse(false, 'Valid user_id, coach_id, or email is required.', null, 400);
    }

    $stmt = $db->prepare("SELECT id, role, full_name, status FROM users WHERE id = :uid LIMIT 1");
    $stmt->execute([':uid' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        apiResponse(false, 'User record not found.', null, 404);
    }

    $db->beginTransaction();

    if ($user['role'] === 'trainer') {
        $chk = $db->prepare("SELECT 1 FROM gym_trainers WHERE gym_id = :gid AND trainer_user_id = :uid LIMIT 1");
        $chk->execute([':gid' => $gymId, ':uid' => $userId]);
        if (!$chk->fetchColumn()) {
            $db->rollBack();
            apiResponse(false, 'Unauthorized: Coach does not belong to your gym facility.', null, 403);
        }

        // Deactivate gym association only — preserve the centralized platform user account
        $db->prepare("UPDATE gym_trainers SET status = 'inactive', is_active = 0 WHERE gym_id = :gid AND trainer_user_id = :uid")
            ->execute([':gid' => $gymId, ':uid' => $userId]);

        $db->prepare("UPDATE trainer_assignments SET status = 'inactive', end_date = CURDATE(), updated_at = NOW() WHERE trainer_user_id = :uid AND gym_id = :gid AND status = 'active'")
            ->execute([':uid' => $userId, ':gid' => $gymId]);
    } else {
        $chk = $db->prepare("SELECT 1 FROM memberships WHERE gym_id = :gid AND user_id = :uid LIMIT 1");
        $chk->execute([':gid' => $gymId, ':uid' => $userId]);
        if (!$chk->fetchColumn()) {
            $db->rollBack();
            apiResponse(false, 'Unauthorized: Member does not belong to your gym facility.', null, 403);
        }

        // Deactivate gym membership and gym-scoped trainer assignments only — preserve platform account
        $db->prepare("UPDATE memberships SET status = 'cancelled', auto_renew = 0, updated_at = NOW() WHERE gym_id = :gid AND user_id = :uid")
            ->execute([':gid' => $gymId, ':uid' => $userId]);

        $db->prepare("UPDATE trainer_assignments SET status = 'inactive', end_date = CURDATE(), updated_at = NOW() WHERE user_id = :uid AND gym_id = :gid AND status = 'active'")
            ->execute([':uid' => $userId, ':gid' => $gymId]);
    }

    $db->commit();

    apiResponse(true, "Successfully deactivated {$user['full_name']} from active facility roster.", ['user_id' => $userId]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('[FitSync delete_user.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to remove user from roster.', null, 500);
}
