<?php
/**
 * FitSync AI — API: Trainer Workout Plans CRUD & Monitoring
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['trainer', 'admin']);
$trainerId = (int)$authUser['id'];
$service = FitSyncDataService::getInstance();
$db = $service->getDb();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if ($authUser['role'] === 'trainer' && !$service->isTrainerVerified($trainerId)) {
        apiResponse(false, 'Forbidden: Trainer verification is pending. Workout tools unlock once verified.', null, 403);
    }
    try {
        $pStmt = $db->prepare("
            SELECT wp.*,
                   (SELECT COUNT(*) FROM plan_assignments pa WHERE pa.plan_id = wp.id AND pa.is_active = 1) AS assigned_count
            FROM workout_plans wp
            WHERE wp.author_trainer_id = :tid OR wp.is_template = 1
            ORDER BY wp.created_at DESC
        ");
        $pStmt->execute([':tid' => $trainerId]);
        $plans = $pStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($plans as &$p) {
            $dStmt = $db->prepare("SELECT * FROM plan_days WHERE plan_id = :pid ORDER BY sort_order ASC, day_number ASC");
            $dStmt->execute([':pid' => $p['id']]);
            $days = $dStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($days as &$d) {
                $eStmt = $db->prepare("
                    SELECT pde.*, e.name AS exercise_name
                    FROM plan_day_exercises pde
                    INNER JOIN exercises e ON e.id = pde.exercise_id
                    WHERE pde.plan_day_id = :pdid
                    ORDER BY pde.sort_order ASC
                ");
                $eStmt->execute([':pdid' => $d['id']]);
                $d['exercises'] = $eStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            unset($d);
            $p['days'] = $days;
        }
        unset($p);

        $exList = $db->query("
            SELECT e.id, e.name, e.equipment_required, e.difficulty, mg.name AS muscle_group
            FROM exercises e
            LEFT JOIN muscle_groups mg ON mg.id = e.primary_muscle_id
            ORDER BY e.name ASC
        ")->fetchAll(PDO::FETCH_ASSOC);

        $sStmt = $db->prepare("
            SELECT ws.*, u.full_name AS athlete_name, u.email AS athlete_email, pd.day_name, pd.focus_area
            FROM workout_sessions ws
            INNER JOIN trainer_assignments ta ON ta.user_id = ws.user_id AND ta.trainer_user_id = :tid AND ta.status = 'active'
            INNER JOIN users u ON u.id = ws.user_id
            LEFT JOIN plan_days pd ON pd.id = ws.plan_day_id
            ORDER BY ws.session_date DESC, ws.id DESC
            LIMIT 25
        ");
        $sStmt->execute([':tid' => $trainerId]);
        $completedSessions = $sStmt->fetchAll(PDO::FETCH_ASSOC);

        apiResponse(true, 'Trainer workouts loaded.', [
            'plans'              => $plans,
            'exercises'          => $exList,
            'completed_sessions' => $completedSessions
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync trainer/workouts.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load trainer workout plans.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    try {
        $result = $service->createOrUpdateWorkoutPlan($trainerId, $input);

        if (!empty($input['assign_to_member_id'])) {
            $memberId = (int)$input['assign_to_member_id'];
            $assignRes = $service->assignWorkoutPlan($trainerId, $memberId, (int)$result['plan_id']);
            $result['assignment'] = $assignRes;
        }

        apiResponse(true, 'Workout plan saved in database.', $result);
    } catch (RuntimeException $e) {
        apiResponse(false, $e->getMessage(), null, 403);
    } catch (InvalidArgumentException $e) {
        apiResponse(false, $e->getMessage(), null, 400);
    } catch (Throwable $e) {
        error_log('[FitSync trainer/workouts.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to save workout plan.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
