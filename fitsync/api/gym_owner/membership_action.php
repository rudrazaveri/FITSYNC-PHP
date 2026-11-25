<?php
/**
 * FitSync AI — API: Gym Owner Membership Request Approval / Rejection
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['gym_owner', 'admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method not allowed.', null, 405);
}

requireCsrfToken();

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$membershipId    = (int)($input['membership_id'] ?? 0);
$decision        = trim((string)($input['decision'] ?? ''));
$rejectionReason = isset($input['rejection_reason'])
    ? trim((string)$input['rejection_reason'])
    : (isset($input['reason']) ? trim((string)$input['reason']) : null);

if ($membershipId <= 0 || !in_array($decision, ['approve', 'reject'], true)) {
    apiResponse(false, 'Valid membership_id and decision (approve/reject) required.', null, 400);
}

try {
    $service = FitSyncDataService::getInstance();
    $res = $service->reviewMembershipRequest((int)$authUser['id'], $membershipId, $decision, $authUser['role'], $rejectionReason);
    apiResponse(true, $decision === 'approve' ? 'Membership approved and activated.' : 'Membership request rejected.', $res);
} catch (RuntimeException $e) {
    apiResponse(false, $e->getMessage(), null, 403);
} catch (InvalidArgumentException $e) {
    apiResponse(false, $e->getMessage(), null, 400);
} catch (Throwable $e) {
    error_log('[FitSync membership_action.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to process membership decision.', null, 500);
}
