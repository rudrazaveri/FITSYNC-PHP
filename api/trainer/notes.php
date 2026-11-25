<?php
/**
 * FitSync AI — API: Add Trainer Note for Assigned Member
 * Strictly validates authenticated trainer session, CSRF, and active assignment.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['trainer', 'admin']);
$trainerUserId = (int)$authUser['id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method Not Allowed.', null, 405);
}

requireCsrfToken();

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$memberUserId = (int)($input['member_id'] ?? 0);
$noteText     = (string)($input['note_text'] ?? '');
$noteType     = (string)($input['note_type'] ?? 'workout_feedback');
$isVisible    = isset($input['is_visible']) ? (bool)$input['is_visible'] : true;

if ($memberUserId <= 0 || empty(trim($noteText))) {
    apiResponse(false, 'Invalid member ID or empty note content.', null, 400);
}

try {
    $service = FitSyncDataService::getInstance();
    $res = $service->addTrainerNote($trainerUserId, $memberUserId, $noteText, $noteType, $isVisible);
    apiResponse(true, 'Trainer note saved and synced.', $res);
} catch (RuntimeException $e) {
    apiResponse(false, $e->getMessage(), null, 403);
} catch (Throwable $e) {
    error_log('[FitSync trainer/notes.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to save trainer note.', null, 500);
}
