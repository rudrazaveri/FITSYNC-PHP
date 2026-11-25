<?php
/**
 * FitSync AI — API: Member Portal Trainer Directory & Trainer Requests
 * Returns actual FitSync registered trainers and lets members submit non-auto-assigning trainer requests.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];
$service = FitSyncDataService::getInstance();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $filters = [
            'search'         => trim((string)($_GET['search'] ?? '')),
            'specialization' => trim((string)($_GET['specialization'] ?? '')),
            'gym_id'         => isset($_GET['gym_id']) ? (int)$_GET['gym_id'] : 0
        ];
        $trainers = $service->getMemberTrainerDirectory($userId, $filters);
        apiResponse(true, 'Trainer directory loaded.', [
            'trainers' => $trainers,
            'count'    => count($trainers)
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync user/trainers.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load trainer directory.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = trim((string)($input['action'] ?? 'request_trainer'));
    $trainerId = (int)str_replace('tr-', '', (string)($input['trainer_user_id'] ?? ($input['trainer_id'] ?? '0')));
    $notes = isset($input['notes']) ? trim((string)$input['notes']) : null;

    if ($action !== 'request_trainer' || $trainerId <= 0) {
        apiResponse(false, 'Valid trainer_user_id required.', null, 400);
    }

    try {
        $res = $service->requestTrainerForMember($userId, $trainerId, $notes);
        apiResponse(true, !empty($res['already_assigned'])
            ? 'This trainer is already assigned to you.'
            : (!empty($res['already_requested'])
                ? 'Your trainer request is already pending approval.'
                : 'Trainer request sent! Your Gym Owner will review and assign.'),
            $res
        );
    } catch (InvalidArgumentException $e) {
        apiResponse(false, $e->getMessage(), null, 400);
    } catch (Throwable $e) {
        error_log('[FitSync user/trainers.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to submit trainer request.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
