<?php
/**
 * FitSync AI — API: User Weight & Biometric Measurements (Workflow A)
 *
 * Saves verified records to body_measurements.
 * Enables live synchronization between User Dashboard and Trainer Athlete Dossier.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$userId = getActiveMemberUserId();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $targetUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $userId;
        $service = FitSyncDataService::getInstance();
        $dashboard = $service->getUserDashboard($targetUserId);
        echo json_encode([
            'success'      => true,
            'measurements' => $dashboard['measurement']
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $targetUserId = isset($input['user_id']) ? (int)$input['user_id'] : $userId;

    $weightKg   = isset($input['weight_kg']) ? (float)$input['weight_kg'] : (isset($input['weight']) ? (float)$input['weight'] : 0.0);
    $waistCm    = isset($input['waist_cm']) ? (float)$input['waist_cm'] : null;
    $chestCm    = isset($input['chest_cm']) ? (float)$input['chest_cm'] : null;
    $armsCm     = isset($input['arms_cm']) ? (float)$input['arms_cm'] : null;
    $thighsCm   = isset($input['thighs_cm']) ? (float)$input['thighs_cm'] : null;
    $bodyFatPct = isset($input['body_fat_pct']) ? (float)$input['body_fat_pct'] : null;
    $notes      = isset($input['notes']) ? trim((string)$input['notes']) : null;

    if ($weightKg <= 20.0 || $weightKg >= 350.0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Please provide a valid weight between 20 kg and 350 kg.']);
        exit;
    }

    try {
        $service = FitSyncDataService::getInstance();
        $result = $service->recordWeightMeasurement(
            $targetUserId,
            $weightKg,
            $waistCm,
            $chestCm,
            $armsCm,
            $thighsCm,
            $bodyFatPct,
            $notes
        );

        echo json_encode([
            'success' => true,
            'message' => 'Measurement recorded successfully in database.',
            'data'    => $result
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
