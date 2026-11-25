<?php
/**
 * FitSync AI — Workouts API Endpoint (Authoritative MySQL CRUD)
 * Fetches assigned workout plans & logs real exercise sets and completed sessions.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];
$service = FitSyncDataService::getInstance();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $workout = $service->getUserWorkoutOverview($userId);
        apiResponse(true, 'Workout plan and history retrieved.', $workout);
    } catch (Throwable $e) {
        error_log('[FitSync workouts.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load workouts.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $action = (string)($input['action'] ?? 'complete_session');

    try {
        if ($action === 'log_set') {
            $planDayId     = !empty($input['plan_day_id']) ? (int)$input['plan_day_id'] : null;
            $exerciseId    = (int)($input['exercise_id'] ?? 0);
            $setNumber     = max(1, (int)($input['set_number'] ?? 1));
            $weightKg      = max(0.0, (float)($input['weight_kg'] ?? 0));
            $repsCompleted = max(1, (int)($input['reps'] ?? 10));
            $rpe           = isset($input['rpe']) && is_numeric($input['rpe']) ? (float)$input['rpe'] : null;

            if ($exerciseId <= 0) {
                $db = $service->getDb();
                $exName = trim((string)($input['exercise'] ?? ''));
                if ($db && !empty($exName)) {
                    $st = $db->prepare("SELECT id FROM exercises WHERE LOWER(name) = LOWER(?) LIMIT 1");
                    $st->execute([$exName]);
                    $exerciseId = (int)$st->fetchColumn();
                }
                if ($db && $exerciseId <= 0) {
                    $exerciseId = (int)$db->query("SELECT id FROM exercises ORDER BY id ASC LIMIT 1")->fetchColumn();
                }
            }

            $res = $service->logExerciseSet($userId, $planDayId, $exerciseId, $setNumber, $weightKg, $repsCompleted, $rpe);
            apiResponse(true, 'Exercise set recorded in database.', $res);
        }

        // Complete Workout Session
        $exercises = is_array($input['exercises'] ?? null) ? $input['exercises'] : [];
        $planDayId = !empty($input['plan_day_id']) ? (int)$input['plan_day_id'] : null;
        $notes     = !empty($input['notes']) ? trim((string)$input['notes']) : null;
        $duration  = !empty($input['duration_minutes']) ? (int)$input['duration_minutes'] : 45;

        $res = $service->logWorkoutSession($userId, $exercises, $planDayId, $notes, $duration);
        apiResponse(true, 'Workout session completed and saved to database!', $res);
    } catch (Throwable $e) {
        error_log('[FitSync workouts.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to save workout session.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
