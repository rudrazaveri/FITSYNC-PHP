<?php
/**
 * FitSync AI — API: Gym Owner Manage Trainer Gym Association
 * Supports: invite, approve, reject, deactivate — without duplicating user accounts.
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
$trainerUserId  = (int)($input['trainer_user_id'] ?? 0);
$gymId          = (int)($input['gym_id'] ?? 0);
$action         = trim((string)($input['action'] ?? ($input['decision'] ?? '')));
$employmentType = trim((string)($input['employment_type'] ?? 'full_time'));

if ($trainerUserId <= 0 || !in_array($action, ['invite', 'approve', 'reject', 'deactivate'], true)) {
    apiResponse(false, 'Valid trainer_user_id and action (invite/approve/reject/deactivate) required.', null, 400);
}

try {
    $service = FitSyncDataService::getInstance();
    $res = $service->manageGymTrainerAssociation((int)$authUser['id'], $gymId, $trainerUserId, $action, $authUser['role'], $employmentType);
    $defaultMessages = [
        'invite'     => 'Invitation sent to registered trainer.',
        'approve'    => 'Trainer affiliation approved.',
        'reject'     => 'Trainer affiliation rejected.',
        'deactivate' => 'Gym trainer association deactivated (platform account remains active).'
    ];
    apiResponse(true, $res['message'] ?? $defaultMessages[$action], $res);
} catch (RuntimeException $e) {
    apiResponse(false, $e->getMessage(), null, 403);
} catch (InvalidArgumentException $e) {
    apiResponse(false, $e->getMessage(), null, 400);
} catch (Throwable $e) {
    error_log('[FitSync trainer_affiliation_action.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to update trainer association.', null, 500);
}
