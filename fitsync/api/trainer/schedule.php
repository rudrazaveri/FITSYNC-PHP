<?php
/**
 * FitSync AI — API: Trainer Schedule & Sessions
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/trainer_data.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['trainer', 'admin']);
$trainerId = (int)$authUser['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $schedule = getTrainerSchedule($trainerId);
    jsonResponse([
        'success'  => true,
        'message'  => 'Trainer schedule retrieved.',
        'data'     => $schedule,
        'schedule' => $schedule
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $memberId    = (int)($input['member_user_id'] ?? $input['member_id'] ?? 0);
    $sessionDate = trim((string)($input['session_date'] ?? date('Y-m-d')));
    $startTime   = trim((string)($input['start_time'] ?? '09:00:00'));
    $endTime     = trim((string)($input['end_time'] ?? '09:45:00'));
    $sessionType = trim((string)($input['session_type'] ?? 'personal_training'));
    $notes       = trim((string)($input['notes'] ?? ''));

    $service = FitSyncDataService::getInstance();
    if (!$service->isTrainerAssignedToUser($trainerId, $memberId)) {
        apiResponse(false, 'Forbidden: Athlete is not assigned to you.', null, 403);
    }

    $allowedTypes = ['personal_training','fitness_assessment','form_check','nutrition_review','workout_intro'];
    if (!in_array($sessionType, $allowedTypes, true)) {
        $sessionType = 'personal_training';
    }

    $db = $service->getDb();
    try {
        $gStmt = $db->prepare("SELECT gym_id FROM gym_trainers WHERE trainer_user_id = :tid AND is_active = 1 LIMIT 1");
        $gStmt->execute([':tid' => $trainerId]);
        $gymId = $gStmt->fetchColumn() ?: null;

        $ins = $db->prepare("
            INSERT INTO trainer_sessions (trainer_user_id, member_user_id, gym_id, session_date, start_time, end_time, session_type, status, session_notes)
            VALUES (:tid, :mid, :gid, :sdate, :stime, :etime, :stype, 'scheduled', :notes)
        ");
        $ins->execute([
            ':tid' => $trainerId, ':mid' => $memberId, ':gid' => $gymId,
            ':sdate' => $sessionDate, ':stime' => $startTime, ':etime' => $endTime,
            ':stype' => $sessionType, ':notes' => $notes ?: null
        ]);
        $sessionId = (int)$db->lastInsertId();
        $service->createNotification($memberId, 'Training Session Scheduled', "Your trainer scheduled a session on {$sessionDate} at {$startTime}.", 'trainer_session', $sessionId);

        apiResponse(true, 'Training session scheduled.', ['session_id' => $sessionId]);
    } catch (Throwable $e) {
        error_log('[FitSync trainer/schedule.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to schedule session.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
