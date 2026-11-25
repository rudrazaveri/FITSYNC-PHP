<?php
/**
 * FitSync AI — API: User Dashboard Real Data
 * Enforces session authentication & strict user isolation.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];

try {
    $service = FitSyncDataService::getInstance();
    $data = $service->getUserDashboard($userId);
    apiResponse(true, 'Dashboard synchronized.', $data);
} catch (Throwable $e) {
    error_log('[FitSync user/dashboard.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to load dashboard data.', null, 500);
}
