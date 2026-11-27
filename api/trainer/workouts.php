<?php
/**
 * FitSync AI — API: Trainer Workout Templates, Plan Builder, Assignments & Monitoring
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
    try {
        $tpChk = $db->prepare("SELECT status FROM trainer_profiles WHERE user_id = :tid LIMIT 1");
        $tpChk->execute([':tid' => $trainerId]);
        if ((string)$tpChk->fetchColumn() === 'rejected') {
            apiResponse(false, 'Forbidden: Trainer verification was rejected.', null, 403);
        }

        $includeArchived = !empty($_GET['include_archived']) ? 1 : 0;
        $pStmt = $db->prepare("
            SELECT wp.*,
                   (SELECT COUNT(*) FROM plan_assignments pa WHERE pa.plan_id = wp.id AND pa.status = 'active') AS assigned_count
            FROM workout_plans wp
            WHERE (wp.author_trainer_id = :tid OR wp.is_template = 1)
              AND (:inc_arch = 1 OR wp.is_archived = 0)
            ORDER BY wp.is_template DESC, wp.updated_at DESC, wp.id DESC
        ");
        $pStmt->execute([':tid' => $trainerId, ':inc_arch' => $includeArchived]);
        $plans = $pStmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($plans)) {
            $planIds = array_map(fn($p) => (int)$p['id'], $plans);
            $pIn = implode(',', $planIds);

            $allDays = $db->query("SELECT * FROM plan_days WHERE plan_id IN ({$pIn}) ORDER BY sort_order ASC, day_number ASC")->fetchAll(PDO::FETCH_ASSOC);
            $dayIds = array_map(fn($d) => (int)$d['id'], $allDays);

            $exsByDay = [];
            if (!empty($dayIds)) {
                $dIn = implode(',', $dayIds);
                $allExs = $db->query("
                    SELECT pde.*, COALESCE(pde.exercise_name_snapshot, e.name) AS exercise_name,
                           e.equipment_required, e.difficulty, e.category, e.image_path, mg.name AS muscle_group
                    FROM plan_day_exercises pde
                    INNER JOIN exercises e ON e.id = pde.exercise_id
                    LEFT JOIN muscle_groups mg ON mg.id = e.primary_muscle_id
                    WHERE pde.plan_day_id IN ({$dIn})
                    ORDER BY pde.sort_order ASC, pde.id ASC
                ")->fetchAll(PDO::FETCH_ASSOC);

                $pdeIds = array_map(fn($x) => (int)$x['id'], $allExs);
                $setsByPde = [];
                if (!empty($pdeIds)) {
                    $pdeIn = implode(',', $pdeIds);
                    foreach ($db->query("SELECT * FROM plan_day_exercise_sets WHERE plan_day_exercise_id IN ({$pdeIn}) ORDER BY set_number ASC")->fetchAll(PDO::FETCH_ASSOC) as $sRow) {
                        $setsByPde[(int)$sRow['plan_day_exercise_id']][] = $sRow;
                    }
                }
                foreach ($allExs as $exRow) {
                    $exRow['sets'] = $setsByPde[(int)$exRow['id']] ?? [];
                    $exsByDay[(int)$exRow['plan_day_id']][] = $exRow;
                }
            }

            $daysByPlan = [];
            foreach ($allDays as $dRow) {
                $dRow['exercises'] = $exsByDay[(int)$dRow['id']] ?? [];
                $daysByPlan[(int)$dRow['plan_id']][] = $dRow;
            }
            foreach ($plans as &$p) {
                $p['days'] = $daysByPlan[(int)$p['id']] ?? [];
            }
            unset($p);
        }

        $exList = $db->query("
            SELECT e.id, e.name, e.category, e.exercise_type, e.equipment_required, e.difficulty,
                   e.default_target_sets, e.default_target_reps, e.default_rest_seconds, e.image_path,
                   mg.name AS muscle_group
            FROM exercises e
            LEFT JOIN muscle_groups mg ON mg.id = e.primary_muscle_id
            WHERE e.is_active = 1
            ORDER BY e.name ASC
        ")->fetchAll(PDO::FETCH_ASSOC);

        // Active & recent plan assignments for assigned members
        $aStmt = $db->prepare("
            SELECT pa.id AS assignment_id, pa.plan_id, pa.user_id, pa.start_date, pa.end_date, pa.status, pa.assigned_at,
                   pa.trainer_instructions, wp.name AS plan_name, wp.days_per_week, wp.goal, wp.difficulty, wp.split_type,
                   u.full_name AS member_name, u.email AS member_email,
                   (SELECT COUNT(*) FROM workout_sessions ws WHERE ws.user_id = pa.user_id AND ws.assignment_id = pa.id AND ws.status = 'completed') AS completed_sessions_count
            FROM plan_assignments pa
            INNER JOIN trainer_assignments ta ON ta.user_id = pa.user_id AND ta.trainer_user_id = :tid AND ta.status = 'active'
            INNER JOIN workout_plans wp ON wp.id = pa.plan_id
            INNER JOIN users u ON u.id = pa.user_id
            ORDER BY FIELD(pa.status, 'active', 'paused', 'completed', 'superseded'), pa.assigned_at DESC
            LIMIT 50
        ");
        $aStmt->execute([':tid' => $trainerId]);
        $assignments = $aStmt->fetchAll(PDO::FETCH_ASSOC);

        $sStmt = $db->prepare("
            SELECT ws.*, u.full_name AS athlete_name, u.email AS athlete_email, pd.day_name, pd.focus_area,
                   wf.difficulty_rating, wf.feedback_text, wf.trainer_reply
            FROM workout_sessions ws
            INNER JOIN trainer_assignments ta ON ta.user_id = ws.user_id AND ta.trainer_user_id = :tid AND ta.status = 'active'
            INNER JOIN users u ON u.id = ws.user_id
            LEFT JOIN plan_days pd ON pd.id = ws.plan_day_id
            LEFT JOIN workout_feedback wf ON wf.session_id = ws.id
            WHERE ws.status = 'completed'
            ORDER BY ws.session_date DESC, ws.id DESC
            LIMIT 40
        ");
        $sStmt->execute([':tid' => $trainerId]);
        $completedSessions = $sStmt->fetchAll(PDO::FETCH_ASSOC);

        $seStmt = $db->prepare("
            SELECT se.id AS session_ex_id, e.name AS exercise_name, esl.set_number, esl.weight_kg, esl.weight_unit, esl.reps_completed, esl.notes
            FROM session_exercises se
            INNER JOIN exercises e ON e.id = se.exercise_id
            LEFT JOIN exercise_set_logs esl ON esl.session_exercise_id = se.id
            WHERE se.session_id = :sid
            ORDER BY se.sort_order ASC, esl.set_number ASC
        ");
        foreach ($completedSessions as &$cs) {
            $seStmt->execute([':sid' => (int)$cs['id']]);
            $cs['exercises_performed'] = $seStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        unset($cs);

        // Personal Records across assigned members
        $prStmt = $db->prepare("
            SELECT u.id AS user_id, u.full_name AS athlete_name, e.name AS exercise_name,
                   MAX(CASE WHEN esl.weight_kg > 0 AND esl.weight_kg <= 500 THEN esl.weight_kg ELSE 0 END) AS max_weight_kg,
                   MAX(CASE WHEN esl.reps_completed > 0 AND esl.reps_completed <= 200 THEN esl.reps_completed ELSE 0 END) AS max_reps,
                   MAX(esl.logged_at) AS last_logged_at
            FROM exercise_set_logs esl
            INNER JOIN session_exercises se ON se.id = esl.session_exercise_id
            INNER JOIN workout_sessions ws ON ws.id = se.session_id AND ws.status = 'completed'
            INNER JOIN trainer_assignments ta ON ta.user_id = ws.user_id AND ta.trainer_user_id = :tid AND ta.status = 'active'
            INNER JOIN users u ON u.id = ws.user_id
            INNER JOIN exercises e ON e.id = se.exercise_id
            WHERE esl.is_completed = 1
            GROUP BY u.id, u.full_name, e.id, e.name
            HAVING MAX(CASE WHEN esl.weight_kg > 0 AND esl.weight_kg <= 500 THEN esl.weight_kg ELSE 0 END) > 0
                OR MAX(CASE WHEN esl.reps_completed > 0 AND esl.reps_completed <= 200 THEN esl.reps_completed ELSE 0 END) > 0
            ORDER BY max_weight_kg DESC
            LIMIT 40
        ");
        $prStmt->execute([':tid' => $trainerId]);
        $memberPrs = $prStmt->fetchAll(PDO::FETCH_ASSOC);

        apiResponse(true, 'Trainer workouts loaded.', [
            'plans'              => $plans,
            'templates'          => array_values(array_filter($plans, fn($p) => (int)$p['is_template'] === 1)),
            'assignments'        => $assignments,
            'exercises'          => $exList,
            'completed_sessions' => $completedSessions,
            'member_prs'         => $memberPrs
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync trainer/workouts.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load trainer workout plans.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = trim((string)($input['action'] ?? 'save'));

    try {
        if ($action === 'duplicate_template') {
            $res = $service->duplicateWorkoutTemplate($trainerId, (int)($input['plan_id'] ?? 0));
            apiResponse(true, 'Template duplicated.', $res, 201);
        }
        if ($action === 'archive_template') {
            $res = $service->archiveWorkoutTemplate($trainerId, (int)($input['plan_id'] ?? 0), !isset($input['archived']) || (bool)$input['archived']);
            apiResponse(true, 'Template archive status updated.', $res);
        }
        if ($action === 'assignment_status') {
            $res = $service->updatePlanAssignmentStatus($trainerId, (int)($input['assignment_id'] ?? 0), trim((string)($input['decision'] ?? '')));
            apiResponse(true, 'Assignment status updated.', $res);
        }
        if ($action === 'reply_feedback') {
            $res = $service->replyWorkoutFeedback($trainerId, (int)($input['session_id'] ?? 0), trim((string)($input['reply'] ?? '')));
            apiResponse(true, 'Feedback reply saved and member notified.', $res);
        }

        $result = $service->createOrUpdateWorkoutPlan($trainerId, $input);

        $memberIds = [];
        if (!empty($input['assign_to_member_ids']) && is_array($input['assign_to_member_ids'])) {
            $memberIds = array_map('intval', $input['assign_to_member_ids']);
        } elseif (!empty($input['assign_to_member_id'])) {
            $memberIds = [(int)$input['assign_to_member_id']];
        }

        $assignments = [];
        foreach (array_unique(array_filter($memberIds)) as $mid) {
            $assignments[] = $service->assignWorkoutPlan($trainerId, $mid, (int)$result['plan_id'], [
                'start_date'           => $input['start_date'] ?? null,
                'end_date'             => $input['end_date'] ?? null,
                'trainer_instructions' => $input['trainer_instructions'] ?? null
            ]);
        }
        if (!empty($assignments)) {
            $result['assignments'] = $assignments;
            $result['assignment']  = $assignments[0];
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
