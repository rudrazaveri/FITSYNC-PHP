<?php
/**
 * FitSync AI — API: Trainer Send Workout Reminder to Assigned Member
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['trainer', 'admin']);
$trainerUserId = (int)$authUser['id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method not allowed.', null, 405);
}

requireCsrfToken();

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$memberUserId = (int)($input['member_id'] ?? ($input['user_id'] ?? 0));
$message = trim((string)($input['message'] ?? ''));

if ($memberUserId <= 0) {
    apiResponse(false, 'Valid member_id is required.', null, 400);
}

try {
    $service = FitSyncDataService::getInstance();
    $res = $service->sendWorkoutReminder($trainerUserId, $memberUserId, $message);
    apiResponse(true, 'Workout reminder sent to athlete.', $res);
} catch (RuntimeException $e) {
    apiResponse(false, $e->getMessage(), null, 403);
} catch (InvalidArgumentException $e) {
    apiResponse(false, $e->getMessage(), null, 400);
} catch (Throwable $e) {
    error_log('[FitSync remind_member.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to send workout reminder.', null, 500);
}
