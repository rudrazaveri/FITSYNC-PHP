<?php
/**
 * FitSync AI — API: Trainer Assign Workout Plan (Workflow C)
 *
 * Stores plan assignment in plan_assignments table.
 * Live syncs to member workout dashboard.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$trainerUserId = isset($input['trainer_id']) ? (int)$input['trainer_id'] : (isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 3);
$memberUserId  = isset($input['member_id']) ? (int)$input['member_id'] : (isset($input['user_id']) ? (int)$input['user_id'] : 0);
$planId        = isset($input['plan_id']) ? (int)$input['plan_id'] : 1;

if ($memberUserId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Valid member user ID required.']);
    exit;
}

try {
    $service = FitSyncDataService::getInstance();
    $result = $service->assignWorkoutPlan($trainerUserId, $memberUserId, $planId);

    echo json_encode([
        'success' => true,
        'message' => 'Workout plan assigned successfully in database.',
        'data'    => $result
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
