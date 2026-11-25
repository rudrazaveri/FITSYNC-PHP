<?php
/**
 * FitSync AI — API: Trainer Respond to Gym Invitation (Accept / Decline)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['trainer', 'admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method not allowed.', null, 405);
}

requireCsrfToken();

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$gymId    = (int)($input['gym_id'] ?? 0);
$decision = trim((string)($input['decision'] ?? ''));

if ($gymId <= 0 || !in_array($decision, ['accept', 'decline'], true)) {
    apiResponse(false, 'Valid gym_id and decision (accept/decline) required.', null, 400);
}

try {
    $service = FitSyncDataService::getInstance();
    $res = $service->respondTrainerInvitation((int)$authUser['id'], $gymId, $decision);
    apiResponse(true, $decision === 'accept' ? 'Gym invitation accepted! You are now active on this gym roster.' : 'Gym invitation declined.', $res);
} catch (InvalidArgumentException $e) {
    apiResponse(false, $e->getMessage(), null, 400);
} catch (Throwable $e) {
    error_log('[FitSync trainer/affiliation_action.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to update gym invitation.', null, 500);
}
