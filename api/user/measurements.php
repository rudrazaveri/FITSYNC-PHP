<?php
/**
 * FitSync AI — API: User Weight & Biometric Measurements (Workflow A)
 * Enforces session identity, trainer assignment permission checks, and CSRF.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'trainer', 'gym_owner', 'admin']);
$service = FitSyncDataService::getInstance();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $targetUserId = (int)$authUser['id'];
        if ($authUser['role'] !== 'user' && isset($_GET['user_id']) && (int)$_GET['user_id'] > 0) {
            $targetUserId = (int)$_GET['user_id'];
            if ($authUser['role'] === 'trainer') {
                $assign = $service->isTrainerAssignedToUser((int)$authUser['id'], $targetUserId);
                if (!$assign) {
                    apiResponse(false, 'Forbidden: Athlete is not assigned to you.', null, 403);
                }
                if (!(int)$assign['can_view_measurements']) {
                    apiResponse(false, 'Forbidden: Athlete has disabled measurement sharing.', null, 403);
                }
            }
        } elseif ($authUser['role'] === 'user' && isset($_GET['user_id']) && (int)$_GET['user_id'] !== (int)$authUser['id']) {
            apiResponse(false, 'Forbidden: You can only view your own measurements.', null, 403);
        }

        $dashboard = $service->getUserDashboard($targetUserId);
        jsonResponse([
            'success'      => true,
            'message'      => 'Measurements retrieved.',
            'data'         => $dashboard['measurement'],
            'measurements' => $dashboard['measurement']
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync measurements.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load measurements.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    if ($authUser['role'] !== 'user' && $authUser['role'] !== 'admin') {
        apiResponse(false, 'Forbidden: Only the athlete can log personal weight measurements.', null, 403);
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    if (isset($input['user_id']) && (int)$input['user_id'] !== (int)$authUser['id'] && $authUser['role'] !== 'admin') {
        apiResponse(false, 'Forbidden: Cannot modify another user\'s measurements.', null, 403);
    }
    $targetUserId = (int)$authUser['id'];

    $weightKg   = isset($input['weight_kg']) ? (float)$input['weight_kg'] : (isset($input['weight']) ? (float)$input['weight'] : 0.0);
    $waistCm    = isset($input['waist_cm']) && $input['waist_cm'] !== '' ? (float)$input['waist_cm'] : null;
    $chestCm    = isset($input['chest_cm']) && $input['chest_cm'] !== '' ? (float)$input['chest_cm'] : null;
    $armsCm     = isset($input['arms_cm']) && $input['arms_cm'] !== '' ? (float)$input['arms_cm'] : null;
    $thighsCm   = isset($input['thighs_cm']) && $input['thighs_cm'] !== '' ? (float)$input['thighs_cm'] : null;
    $bodyFatPct = isset($input['body_fat_pct']) && $input['body_fat_pct'] !== '' ? (float)$input['body_fat_pct'] : null;
    $notes      = isset($input['notes']) ? trim((string)$input['notes']) : null;

    if ($weightKg <= 20.0 || $weightKg >= 350.0) {
        apiResponse(false, 'Please provide a valid weight between 20 kg and 350 kg.', null, 400);
    }

    try {
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

        apiResponse(true, 'Measurement recorded successfully in database.', $result);
    } catch (Throwable $e) {
        error_log('[FitSync measurements.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to record measurement.', null, 500);
    }
}

apiResponse(false, 'Method not allowed', null, 405);
