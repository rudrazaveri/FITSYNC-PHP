<?php
/**
 * FitSync AI — API: User Dashboard Real Data
 *
 * Returns real database statistics for the authenticated member.
 * Zero fabricated or hardcoded metrics.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$userId = getActiveMemberUserId();

try {
    $service = FitSyncDataService::getInstance();
    $data = $service->getUserDashboard($userId);
    echo json_encode([
        'success' => true,
        'data'    => $data
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
