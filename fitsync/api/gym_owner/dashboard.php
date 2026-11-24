<?php
/**
 * FitSync AI — API: Gym Owner Dashboard Telemetry (Part 4)
 *
 * Real-time facility occupancy, coaching staff, registered athletes, and verified monthly revenue.
 * Zero fabricated or hardcoded metrics.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$ownerUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 2; // Default to Priya Sharma (ID 2)
$gymId = isset($_GET['gym_id']) ? (int)$_GET['gym_id'] : 1;

try {
    $service = FitSyncDataService::getInstance();
    $data = $service->getGymOwnerDashboard($ownerUserId, $gymId);

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
