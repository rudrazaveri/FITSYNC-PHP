<?php
/**
 * FitSync AI — API: Platform Admin Verification Queue (Trainers & Gyms)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['admin']);
$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $trainers = $db->query("
        SELECT u.id AS user_id, u.full_name, u.email, u.mobile, u.created_at,
               tp.certification_name, tp.certifying_body, tp.experience_years, tp.specializations_summary, tp.status
        FROM users u
        INNER JOIN trainer_profiles tp ON tp.user_id = u.id
        WHERE u.role = 'trainer' AND tp.status = 'pending_verification'
        ORDER BY u.id DESC
    ")->fetchAll(PDO::FETCH_ASSOC);

    $gyms = $db->query("
        SELECT g.id AS gym_id, g.name AS gym_name, g.city, g.state, g.email AS gym_email, g.phone AS gym_phone, g.status, g.created_at,
               u.id AS owner_id, u.full_name AS owner_name, u.email AS owner_email
        FROM gyms g
        INNER JOIN users u ON u.id = g.owner_user_id
        WHERE g.status = 'pending_approval'
        ORDER BY g.id DESC
    ")->fetchAll(PDO::FETCH_ASSOC);

    apiResponse(true, 'Pending verifications loaded.', [
        'pending_trainers' => $trainers,
        'pending_gyms'     => $gyms
    ]);
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $entityType = trim((string)($input['entity_type'] ?? ''));
    $entityId   = (int)($input['entity_id'] ?? 0);
    $decision   = trim((string)($input['decision'] ?? ''));

    if ($entityId <= 0 || !in_array($entityType, ['trainer', 'gym'], true) || !in_array($decision, ['approve', 'reject'], true)) {
        apiResponse(false, 'Valid entity_type, entity_id, and decision required.', null, 400);
    }

    try {
        $db->beginTransaction();
        $adminId = (int)$authUser['id'];

        if ($entityType === 'trainer') {
            $newTpStatus = $decision === 'approve' ? 'verified' : 'rejected';
            $newCredStatus = $decision === 'approve' ? 'verified' : 'rejected';
            $newVerifStatus = $decision === 'approve' ? 'approved' : 'rejected';

            $db->prepare("UPDATE trainer_profiles SET status = :st WHERE user_id = :uid")
                ->execute([':st' => $newTpStatus, ':uid' => $entityId]);
            $db->prepare("UPDATE trainer_credentials SET verification_status = :st WHERE trainer_id = :uid")
                ->execute([':st' => $newCredStatus, ':uid' => $entityId]);
            $db->prepare("UPDATE verification_requests SET status = :st, reviewed_by = :aid, reviewed_at = NOW() WHERE user_id = :uid AND status = 'pending'")
                ->execute([':st' => $newVerifStatus, ':aid' => $adminId, ':uid' => $entityId]);

            $service->createNotification(
                $entityId,
                $decision === 'approve' ? 'Trainer Credentials Verified' : 'Trainer Verification Declined',
                $decision === 'approve'
                    ? 'Your trainer account is now verified. Member tools and workout assignments are unlocked.'
                    : 'Your trainer verification request was declined. Please update credentials.',
                'verification',
                $entityId
            );
        } else {
            $gStmt = $db->prepare("SELECT owner_user_id, name FROM gyms WHERE id = :gid LIMIT 1");
            $gStmt->execute([':gid' => $entityId]);
            $gRow = $gStmt->fetch(PDO::FETCH_ASSOC);
            if (!$gRow) {
                throw new InvalidArgumentException('Gym record not found.');
            }

            $newGymStatus = $decision === 'approve' ? 'active' : 'inactive';
            $newVerifStatus = $decision === 'approve' ? 'approved' : 'rejected';

            $db->prepare("UPDATE gyms SET status = :st, updated_at = NOW() WHERE id = :gid")
                ->execute([':st' => $newGymStatus, ':gid' => $entityId]);
            $db->prepare("UPDATE verification_requests SET status = :st, reviewed_by = :aid, reviewed_at = NOW() WHERE user_id = :uid AND status = 'pending'")
                ->execute([':st' => $newVerifStatus, ':aid' => $adminId, ':uid' => (int)$gRow['owner_user_id']]);

            $service->createNotification(
                (int)$gRow['owner_user_id'],
                $decision === 'approve' ? 'Gym Verified & Published' : 'Gym Verification Declined',
                $decision === 'approve'
                    ? "{$gRow['name']} is now verified and visible to FitSync members and trainers."
                    : "{$gRow['name']} verification was declined.",
                'gym',
                $entityId
            );
        }

        $db->commit();
        apiResponse(true, ucfirst($entityType) . ' verification ' . ($decision === 'approve' ? 'approved' : 'rejected') . '.');
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('[FitSync admin/verifications.php] ' . $e->getMessage());
        apiResponse(false, $e->getMessage(), null, 400);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
