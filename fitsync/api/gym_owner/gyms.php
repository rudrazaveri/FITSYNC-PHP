<?php
/**
 * FitSync AI — API: Gym Owner Register, List, Edit & Toggle Gyms/Branches
 * Single source of truth in MySQL `gyms`, `gym_operating_hours`, `gym_facilities`,
 * `gym_equipment`, `membership_plans`, and `gym_photos`.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['gym_owner', 'admin']);
$ownerId = (int)$authUser['id'];
$role = (string)$authUser['role'];

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $gyms = $service->getOwnerGymsDetailed($ownerId, $role);
        apiResponse(true, 'Owner gyms loaded.', ['gyms' => $gyms]);
    } catch (Throwable $e) {
        error_log('[FitSync gym_owner/gyms.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load gym details.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $input = $_POST;
    }

    $action = trim((string)($input['action'] ?? 'save'));
    $gymId  = isset($input['gym_id']) && (int)$input['gym_id'] > 0 ? (int)$input['gym_id'] : 0;

    try {
        if ($action === 'toggle_status' || $action === 'set_status') {
            $newStatus = trim((string)($input['status'] ?? ''));
            $res = $service->setGymStatus($ownerId, $gymId, $newStatus, $role);
            apiResponse(true, "Gym status updated to {$res['status']}.", $res);
        }

        if ($action === 'save_plan') {
            $res = $service->saveGymPlan($ownerId, $gymId, $input, $role);
            apiResponse(true, 'Membership plan saved.', $res);
        }

        $res = $service->saveOwnerGym($ownerId, $gymId, $input, $_FILES ?? [], $role);
        apiResponse(true, $gymId > 0 ? 'Gym details updated and synced across FitSync.' : 'New gym registered and published cleanly!', $res, $gymId > 0 ? 200 : 201);
    } catch (RuntimeException $e) {
        apiResponse(false, $e->getMessage(), null, 403);
    } catch (InvalidArgumentException $e) {
        $code = str_contains(strtolower($e->getMessage()), 'already exists') ? 409 : 400;
        apiResponse(false, $e->getMessage(), null, $code);
    } catch (Throwable $e) {
        error_log('[FitSync gym_owner/gyms.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to save gym record.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
