<?php
/**
 * FitSync AI — API: Gym Owner Dashboard Telemetry
 * Strictly scoped to the authenticated Gym Owner's owned facility.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['gym_owner', 'admin']);
$ownerUserId = (int)$authUser['id'];
$gymId = isset($_GET['gym_id']) && (int)$_GET['gym_id'] > 0 ? (int)$_GET['gym_id'] : null;

try {
    $service = FitSyncDataService::getInstance();
    $data = $service->getGymOwnerDashboard($ownerUserId, $gymId, $authUser['role']);
    apiResponse(true, 'Gym owner dashboard synchronized.', $data);
} catch (Throwable $e) {
    error_log('[FitSync gym_owner/dashboard.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to load gym owner dashboard.', null, 500);
}
