<?php
/**
 * FitSync AI — API: Trainer Assign Workout Plan (Single or Multi-Member Snapshot)
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
$memberIds = [];
if (!empty($input['member_ids']) && is_array($input['member_ids'])) {
    $memberIds = array_values(array_unique(array_filter(array_map('intval', $input['member_ids']))));
} else {
    $singleId = isset($input['member_id']) ? (int)$input['member_id'] : (isset($input['user_id']) ? (int)$input['user_id'] : 0);
    if ($singleId > 0) $memberIds[] = $singleId;
}
$planId = isset($input['plan_id']) ? (int)$input['plan_id'] : 0;

if (empty($memberIds)) {
    apiResponse(false, 'Valid member user ID(s) required.', null, 400);
}

try {
    $service = FitSyncDataService::getInstance();

    if ($planId <= 0 && !empty($input['plan_name'])) {
        $created = $service->createOrUpdateWorkoutPlan($trainerUserId, [
            'name'                 => $input['plan_name'],
            'description'          => $input['description'] ?? '',
            'difficulty'           => $input['difficulty'] ?? 'intermediate',
            'goal'                 => $input['goal'] ?? 'hypertrophy',
            'split_type'           => $input['split_type'] ?? 'Custom Split',
            'duration_weeks'       => $input['duration_weeks'] ?? 4,
            'trainer_instructions' => $input['trainer_instructions'] ?? '',
            'days_per_week'        => $input['days_per_week'] ?? 4,
            'exercise_ids'         => $input['exercise_ids'] ?? [],
            'days'                 => $input['days'] ?? [],
            'target_sets'          => $input['target_sets'] ?? 3,
            'target_reps'          => $input['target_reps'] ?? '8-12',
            'rest_seconds'         => $input['rest_seconds'] ?? 90
        ]);
        $planId = (int)$created['plan_id'];
    }

    if ($planId <= 0) {
        apiResponse(false, 'Valid workout plan ID or plan details required.', null, 400);
    }

    $opts = [
        'start_date'           => $input['start_date'] ?? null,
        'end_date'             => $input['end_date'] ?? null,
        'trainer_instructions' => $input['trainer_instructions'] ?? null
    ];

    $results = [];
    foreach ($memberIds as $mid) {
        $results[] = $service->assignWorkoutPlan($trainerUserId, $mid, $planId, $opts);
    }

    apiResponse(true, count($results) > 1 ? 'Workout plan assigned to ' . count($results) . ' members.' : 'Workout plan assigned and member notified.', count($results) === 1 ? $results[0] : ['assignments' => $results]);
} catch (RuntimeException $e) {
    apiResponse(false, $e->getMessage(), null, 403);
} catch (InvalidArgumentException $e) {
    apiResponse(false, $e->getMessage(), null, 400);
} catch (Throwable $e) {
    error_log('[FitSync assign_workout.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to assign workout plan.', null, 500);
}
