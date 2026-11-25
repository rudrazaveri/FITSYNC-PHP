<?php
/**
 * FitSync AI — API: Trainer Dashboard & Assigned Roster Telemetry
 * Strictly scoped to the authenticated trainer's assigned athletes and records.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['trainer', 'admin']);
$trainerUserId = (int)$authUser['id'];

try {
    $service = FitSyncDataService::getInstance();
    $data = $service->getTrainerDashboard($trainerUserId);
    apiResponse(true, 'Trainer dashboard loaded.', $data);
} catch (Throwable $e) {
    error_log('[FitSync trainer/dashboard.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to load trainer dashboard.', null, 500);
}
