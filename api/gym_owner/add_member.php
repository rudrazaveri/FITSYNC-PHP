<?php
/**
 * FitSync AI — API: Gym Owner Invite / Add Athlete
 * Phase 3 & 4:
 * - Never creates duplicate user accounts.
 * - Never creates fake active user accounts for unregistered people.
 * - Creates a pending gym_invitations record (with secure expiring single-use token).
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
$reqGymId = isset($input['gym_id']) && (int)$input['gym_id'] > 0 ? (int)$input['gym_id'] : 0;

try {
    $service = FitSyncDataService::getInstance();
    $res = $service->inviteOrEnrollAthlete((int)$authUser['id'], $reqGymId, $input, (string)$authUser['role']);
    $status = !empty($res['duplicate_prevented']) ? 200 : 201;
    jsonResponse([
        'success' => true,
        'message' => $res['message'] ?? 'Gym invitation created.',
        'data'    => $res
    ], $status);
} catch (RuntimeException $e) {
    apiResponse(false, $e->getMessage(), null, 403);
} catch (InvalidArgumentException $e) {
    $code = str_contains(strtolower($e->getMessage()), 'already an active member') ? 409 : 400;
    apiResponse(false, $e->getMessage(), null, $code);
} catch (Throwable $e) {
    error_log('[FitSync add_member.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to send gym invitation.', null, 500);
}
