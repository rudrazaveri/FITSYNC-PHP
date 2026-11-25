<?php
/**
 * FitSync AI — API: Gym Owner Assign / Re-assign Coach
 * Enforces gym_owner session, CSRF, and gym facility boundaries.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['gym_owner', 'admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method not allowed', null, 405);
}

requireCsrfToken();

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$memberEmail = trim((string)($input['memberEmail'] ?? ''));
$coachId     = trim((string)($input['coachId'] ?? ''));
$reqGymId    = isset($input['gym_id']) && (int)$input['gym_id'] > 0 ? (int)$input['gym_id'] : null;

if (empty($memberEmail)) {
    apiResponse(false, 'Member email is required.', null, 400);
}

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
    $userStmt = $db->prepare("
        SELECT u.id, u.full_name
        FROM users u
        INNER JOIN memberships m ON m.user_id = u.id AND m.gym_id = :gid AND m.status = 'active'
        WHERE u.email = :email AND u.role = 'user'
        LIMIT 1
    ");
    $userStmt->execute([':gid' => $gymId, ':email' => $memberEmail]);
    $member = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$member) {
        apiResponse(false, 'Forbidden: Member does not belong to your active gym roster.', null, 403);
    }

    $memberId = (int)$member['id'];
    $coachUserId = (int)str_replace('tr-', '', $coachId);

    // Prevent redundant reassignment to same active coach
    $prevStmt = $db->prepare("SELECT id, trainer_user_id FROM trainer_assignments WHERE user_id = :uid AND status = 'active'");
    $prevStmt->execute([':uid' => $memberId]);
    $prevRows = $prevStmt->fetchAll(PDO::FETCH_ASSOC);
    if ($coachUserId > 0 && count($prevRows) === 1 && (int)$prevRows[0]['trainer_user_id'] === $coachUserId) {
        apiResponse(true, 'Coach assignment is already active.', ['assignment_id' => (int)$prevRows[0]['id'], 'duplicate_prevented' => true]);
    }

    $db->beginTransaction();

    // Transfer previous active assignment cleanly while preserving assignment history
    $db->prepare("UPDATE trainer_assignments SET status = 'transferred', end_date = CURDATE(), updated_at = NOW() WHERE user_id = :uid AND status = 'active'")
        ->execute([':uid' => $memberId]);

    if ($coachUserId > 0) {
        $cChk = $db->prepare("
            SELECT u.id, u.full_name FROM gym_trainers gt
            INNER JOIN users u ON u.id = gt.trainer_user_id AND u.status = 'active'
            WHERE gt.gym_id = :gid AND gt.trainer_user_id = :tid AND gt.is_active = 1 AND gt.status = 'active'
            LIMIT 1
        ");
        $cChk->execute([':gid' => $gymId, ':tid' => $coachUserId]);
        $coach = $cChk->fetch(PDO::FETCH_ASSOC);
        if (!$coach) {
            $db->rollBack();
            apiResponse(false, 'Forbidden: Selected coach is not actively affiliated with your gym.', null, 403);
        }

        $db->prepare("
            INSERT INTO trainer_assignments (user_id, trainer_user_id, gym_id, assigned_by_user_id, status, start_date, created_at, updated_at)
            VALUES (:uid, :tid, :gid, :oid, 'active', CURDATE(), NOW(), NOW())
        ")->execute([':uid' => $memberId, ':tid' => $coachUserId, ':gid' => $gymId, ':oid' => $authUser['id']]);
        $assignId = (int)$db->lastInsertId();

        $db->prepare("
            INSERT IGNORE INTO trainer_data_permissions (assignment_id, can_view_measurements, can_view_nutrition, can_view_assessments, can_log_attendance)
            VALUES (:aid, 1, 1, 1, 1)
        ")->execute([':aid' => $assignId]);

        $db->prepare("
            UPDATE member_trainer_requests
            SET status = 'approved', reviewed_by_user_id = :oid, updated_at = NOW()
            WHERE member_user_id = :mid AND trainer_user_id = :tid AND status = 'pending'
        ")->execute([':oid' => $authUser['id'], ':mid' => $memberId, ':tid' => $coachUserId]);

        $isReassign = !empty($prevRows);
        $service->createNotification($memberId, $isReassign ? 'Trainer Reassigned' : 'Trainer Assigned', "{$coach['full_name']} has been assigned as your personal trainer.", 'trainer_assignment', $assignId);
        $service->createNotification($coachUserId, 'New Athlete Assigned', "{$member['full_name']} was added to your coaching roster.", 'trainer_assignment', $assignId);
        foreach ($prevRows as $pr) {
            if ((int)$pr['trainer_user_id'] !== $coachUserId) {
                $service->createNotification((int)$pr['trainer_user_id'], 'Athlete Reassigned', "{$member['full_name']} was reassigned to another coach.", 'trainer_assignment', $assignId);
            }
        }
    }

    $db->commit();
    apiResponse(true, 'Coach assignment updated successfully.');
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('[FitSync assign_coach.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to update coach assignment.', null, 500);
}
