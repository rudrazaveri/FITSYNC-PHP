<?php
/**
 * FitSync AI — API: Trainer Assign Workout Plan (Workflow B)
 * Enforces trainer session, CSRF, and active athlete assignment.
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
$memberUserId = isset($input['member_id']) ? (int)$input['member_id'] : (isset($input['user_id']) ? (int)$input['user_id'] : 0);
$planId       = isset($input['plan_id']) ? (int)$input['plan_id'] : 0;

if ($memberUserId <= 0) {
    apiResponse(false, 'Valid member user ID required.', null, 400);
}

try {
    $service = FitSyncDataService::getInstance();

    // If trainer passed inline plan details instead of an existing plan_id, create it first
    if ($planId <= 0 && !empty($input['plan_name'])) {
        $created = $service->createOrUpdateWorkoutPlan($trainerUserId, [
            'name'           => $input['plan_name'],
            'description'    => $input['description'] ?? '',
            'difficulty'     => $input['difficulty'] ?? 'intermediate',
            'goal'           => $input['goal'] ?? 'hypertrophy',
            'days_per_week'  => $input['days_per_week'] ?? 4,
            'exercise_ids'   => $input['exercise_ids'] ?? [],
            'days'           => $input['days'] ?? [],
            'target_sets'    => $input['target_sets'] ?? 4,
            'target_reps'    => $input['target_reps'] ?? '8-12',
            'rest_seconds'   => $input['rest_seconds'] ?? 90
        ]);
        $planId = (int)$created['plan_id'];
    }

    if ($planId <= 0) {
        apiResponse(false, 'Valid workout plan ID or plan details required.', null, 400);
    }

    $result = $service->assignWorkoutPlan($trainerUserId, $memberUserId, $planId);
    apiResponse(true, 'Workout plan assigned and member notified.', $result);
} catch (RuntimeException $e) {
    apiResponse(false, $e->getMessage(), null, 403);
} catch (InvalidArgumentException $e) {
    apiResponse(false, $e->getMessage(), null, 400);
} catch (Throwable $e) {
    error_log('[FitSync assign_workout.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to assign workout plan.', null, 500);
}
