<?php
/**
 * FitSync AI — API: Gym Owner Review Member's Trainer Request
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
$requestId = (int)($input['request_id'] ?? 0);
$decision  = trim((string)($input['decision'] ?? ''));

if ($requestId <= 0 || !in_array($decision, ['approve', 'reject'], true)) {
    apiResponse(false, 'Valid request_id and decision (approve/reject) required.', null, 400);
}

try {
    $service = FitSyncDataService::getInstance();
    $res = $service->reviewMemberTrainerRequest((int)$authUser['id'], $requestId, $decision, $authUser['role']);
    apiResponse(true, $decision === 'approve' ? 'Trainer assigned to member.' : 'Trainer request rejected.', $res);
} catch (RuntimeException $e) {
    apiResponse(false, $e->getMessage(), null, 403);
} catch (InvalidArgumentException $e) {
    apiResponse(false, $e->getMessage(), null, 400);
} catch (Throwable $e) {
    error_log('[FitSync member_trainer_request_action.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to process trainer request.', null, 500);
}
