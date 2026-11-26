<?php
/**
 * FitSync AI — API: User Gym Invitations (List, Accept, Reject)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $uStmt = $db->prepare("SELECT id, email, email_verified_at FROM users WHERE id = :uid LIMIT 1");
        $uStmt->execute([':uid' => $userId]);
        $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);

        $invitations = $service->getUserGymInvitations($userId);
        apiResponse(true, 'Invitations loaded.', [
            'invitations'    => $invitations,
            'email_verified' => !empty($uRow['email_verified_at'])
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync user/invitations.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load gym invitations.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $invitationId = (int)($input['invitation_id'] ?? 0);
    $inviteToken  = trim((string)($input['invite_token'] ?? ''));
    $decision     = trim((string)($input['decision'] ?? ''));

    if (!in_array($decision, ['accept', 'reject'], true)) {
        apiResponse(false, 'Decision must be accept or reject.', null, 400);
    }

    try {
        if ($invitationId <= 0 && $inviteToken !== '') {
            $tHash = hash('sha256', $inviteToken);
            $fStmt = $db->prepare("SELECT id FROM gym_invitations WHERE token_hash = :th AND status = 'pending' LIMIT 1");
            $fStmt->execute([':th' => $tHash]);
            $invitationId = (int)$fStmt->fetchColumn();
        }
        if ($invitationId <= 0) {
            apiResponse(false, 'Valid invitation_id or invite_token is required.', null, 400);
        }

        $res = $service->respondToGymInvitation($userId, $invitationId, $decision);
        $msg = $decision === 'accept'
            ? "Invitation accepted! Your membership at {$res['gym_name']} is now active."
            : 'Gym invitation declined.';
        apiResponse(true, $msg, $res);
    } catch (RuntimeException $e) {
        apiResponse(false, $e->getMessage(), null, 403);
    } catch (InvalidArgumentException $e) {
        apiResponse(false, $e->getMessage(), null, 400);
    } catch (Throwable $e) {
        error_log('[FitSync user/invitations.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to process invitation.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
