<?php
/**
 * FitSync AI — Trainer Data Access & Privacy Service
 *
 * Provides database queries for the Trainer Portal.
 * STRICT SECURITY: All member queries enforce trainer assignment checks.
 * A Trainer can NEVER view or modify members not assigned to them.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth.php';

/**
 * Retrieve trainer profile and gym affiliation.
 *
 * @param int $trainerUserId
 * @param PDO|null $db
 * @return array|null
 */
function getTrainerProfile(int $trainerUserId, ?PDO $db = null): ?array {
    $db = $db ?? getDbConnection();

    if ($db !== null) {
        try {
            $stmt = $db->prepare("
                SELECT 
                    u.id, u.full_name, u.email, u.mobile, u.profile_picture_id, u.status, u.created_at,
                    tp.certification_name, tp.certifying_body, tp.certification_year, tp.experience_years,
                    tp.specializations_summary, tp.bio, tp.hourly_rate, tp.rating, tp.reviews_count, tp.status AS verification_status,
                    g.id AS primary_gym_id, g.name AS primary_gym_name, g.city AS gym_city
                FROM users u
                LEFT JOIN trainer_profiles tp ON u.id = tp.user_id
                LEFT JOIN gym_trainers gt ON u.id = gt.trainer_user_id AND gt.is_active = 1
                LEFT JOIN gyms g ON gt.gym_id = g.id
                WHERE u.id = :id AND u.role = 'trainer'
                LIMIT 1
            ");
            $stmt->execute([':id' => $trainerUserId]);
            $profile = $stmt->fetch();
            if ($profile) {
                return $profile;
            }
        } catch (Throwable $e) {
            error_log("[FitSync TrainerData] Error fetching trainer profile: " . $e->getMessage());
        }
    }

    return null;
}

/**
 * Retrieve statistical aggregates for the Trainer Dashboard.
 *
 * @param int $trainerUserId
 * @param PDO|null $db
 * @return array
 */
function getTrainerDashboardStats(int $trainerUserId, ?PDO $db = null): array {
    $db = $db ?? getDbConnection();

    if ($db !== null) {
        try {
            // Assigned Members Counts
            $memberStmt = $db->prepare("
                SELECT 
                    COUNT(*) AS total_assigned,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_members,
                    SUM(CASE WHEN status != 'active' THEN 1 ELSE 0 END) AS inactive_members
                FROM trainer_assignments
                WHERE trainer_user_id = :tid
            ");
            $memberStmt->execute([':tid' => $trainerUserId]);
            $memberStats = $memberStmt->fetch() ?: [];

            // Workouts Assigned Count
            $plansStmt = $db->prepare("
                SELECT COUNT(*) AS total_assigned_plans
                FROM plan_assignments
                WHERE assigned_by_trainer_id = :tid AND is_active = 1
            ");
            $plansStmt->execute([':tid' => $trainerUserId]);
            $plansStats = $plansStmt->fetch() ?: [];

            // Completed Sessions by Assigned Members
            $sessStmt = $db->prepare("
                SELECT 
                    COUNT(*) AS completed_sessions,
                    COALESCE(SUM(total_volume_kg), 0) AS total_volume_kg
                FROM workout_sessions ws
                JOIN trainer_assignments ta ON ws.user_id = ta.user_id AND ta.trainer_user_id = :tid AND ta.status = 'active'
                WHERE ws.end_time IS NOT NULL
            ");
            $sessStmt->execute([':tid' => $trainerUserId]);
            $sessStats = $sessStmt->fetch() ?: [];

            // Today's Scheduled Sessions
            $schedStmt = $db->prepare("
                SELECT COUNT(*) AS today_sessions
                FROM trainer_sessions
                WHERE trainer_user_id = :tid AND session_date = CURDATE() AND status = 'scheduled'
            ");
            $schedStmt->execute([':tid' => $trainerUserId]);
            $schedStats = $schedStmt->fetch() ?: [];

            return [
                'total_assigned'       => (int)($memberStats['total_assigned'] ?? 0),
                'active_members'       => (int)($memberStats['active_members'] ?? 0),
                'inactive_members'     => (int)($memberStats['inactive_members'] ?? 0),
                'workouts_assigned'    => (int)($plansStats['total_assigned_plans'] ?? 0),
                'completed_sessions'   => (int)($sessStats['completed_sessions'] ?? 0),
                'total_volume_kg'      => (float)($sessStats['total_volume_kg'] ?? 0),
                'today_sessions_count' => (int)($schedStats['today_sessions'] ?? 0)
            ];
        } catch (Throwable $e) {
            error_log("[FitSync TrainerData] Error fetching stats: " . $e->getMessage());
        }
    }

    // Default stats for clean empty system
    return [
        'total_assigned'       => 0,
        'active_members'       => 0,
        'inactive_members'     => 0,
        'workouts_assigned'    => 0,
        'completed_sessions'   => 0,
        'total_volume_kg'      => 0.00,
        'today_sessions_count' => 0
    ];
}

/**
 * Retrieve members assigned to the currently authenticated trainer.
 * STRICT PRIVACY: Restricts results solely to trainer_assignments where trainer_user_id = :tid.
 *
 * @param int $trainerUserId
 * @param array $filters
 * @param PDO|null $db
 * @return array
 */
function getTrainerAssignedMembers(int $trainerUserId, array $filters = [], ?PDO $db = null): array {
    $db = $db ?? getDbConnection();

    if ($db !== null) {
        try {
            $sql = "
                SELECT 
                    u.id, u.full_name, u.email, u.mobile, u.profile_picture_id, u.status AS user_status, u.created_at,
                    up.gender, up.height_cm, up.weight_kg, up.fitness_experience,
                    ta.id AS assignment_id, ta.status AS assignment_status, ta.start_date, ta.notes AS assignment_notes,
                    g.id AS gym_id, g.name AS gym_name,
                    m.status AS membership_status,
                    fg.title AS goal_title, fg.goal_type, fg.target_weight_kg, fg.progress_pct,
                    wp.name AS current_plan_name,
                    (SELECT COUNT(*) FROM attendance a WHERE a.user_id = u.id AND a.check_in_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS attendance_30d,
                    (SELECT MAX(check_in_time) FROM attendance a WHERE a.user_id = u.id) AS last_check_in
                FROM trainer_assignments ta
                JOIN users u ON ta.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN gyms g ON ta.gym_id = g.id
                LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
                LEFT JOIN fitness_goals fg ON u.id = fg.user_id AND fg.status = 'active'
                LEFT JOIN plan_assignments pa ON u.id = pa.user_id AND pa.is_active = 1
                LEFT JOIN workout_plans wp ON pa.plan_id = wp.id
                WHERE ta.trainer_user_id = :tid AND ta.status = 'active' AND u.status = 'active' AND u.role = 'user'
            ";

            $params = [':tid' => $trainerUserId];

            // Search filter by member name or email
            if (!empty($filters['search'])) {
                $sql .= " AND (u.full_name LIKE :search OR u.email LIKE :search)";
                $params[':search'] = '%' . trim($filters['search']) . '%';
            }

            // Filter by status
            if (!empty($filters['status']) && $filters['status'] !== 'all') {
                $sql .= " AND ta.status = :status";
                $params[':status'] = $filters['status'];
            }

            // Filter by goal
            if (!empty($filters['goal']) && $filters['goal'] !== 'all') {
                $sql .= " AND fg.goal_type = :goal";
                $params[':goal'] = $filters['goal'];
            }

            $sql .= " ORDER BY ta.status ASC, u.full_name ASC";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (Throwable $e) {
            error_log("[FitSync TrainerData] Error fetching members: " . $e->getMessage());
        }
    }

    // Default empty when no records in database
    return [];
}

/**
 * Retrieve comprehensive details for a single member.
 * STRICT PRIVACY REQUIREMENT: Validates assignment relationship before returning any data.
 * If the member is NOT assigned to $trainerUserId, returns null (Forbidden).
 *
 * @param int $trainerUserId
 * @param int $memberUserId
 * @param PDO|null $db
 * @return array|null
 */
function getAssignedMemberDetails(int $trainerUserId, int $memberUserId, ?PDO $db = null): ?array {
    $db = $db ?? getDbConnection();
    if ($db === null) {
        return null;
    }
    require_once __DIR__ . '/FitSyncDataService.php';
    try {
        $service = FitSyncDataService::getInstance($db);
        return $service->getAthleteDossier($trainerUserId, $memberUserId, 'trainer');
    } catch (RuntimeException $e) {
        return null;
    } catch (Throwable $e) {
        error_log("[FitSync TrainerData] Error fetching member details: " . $e->getMessage());
        return null;
    }
}


/**
 * Save a trainer note for an assigned member.
 * STRICT PRIVACY: Verifies assignment before inserting.
 *
 * @param int $trainerUserId
 * @param int $memberUserId
 * @param string $noteText
 * @param string $noteType
 * @param bool $isVisible
 * @param PDO|null $db
 * @return array
 */
function saveTrainerNote(int $trainerUserId, int $memberUserId, string $noteText, string $noteType = 'general', bool $isVisible = false, ?PDO $db = null): array {
    $noteText = trim($noteText);
    if (empty($noteText)) {
        return ['success' => false, 'message' => 'Note text cannot be empty.'];
    }

    $db = $db ?? getDbConnection();

    if ($db !== null) {
        try {
            // Verify assignment
            $check = $db->prepare("SELECT id FROM trainer_assignments WHERE trainer_user_id = :tid AND user_id = :uid LIMIT 1");
            $check->execute([':tid' => $trainerUserId, ':uid' => $memberUserId]);
            if (!$check->fetch()) {
                return ['success' => false, 'message' => 'Unauthorized: Member is not assigned to you.'];
            }

            $stmt = $db->prepare("
                INSERT INTO trainer_notes (user_id, trainer_user_id, note_type, note_text, is_visible_to_user, created_at)
                VALUES (:uid, :tid, :ntype, :ntext, :vis, NOW())
            ");
            $stmt->execute([
                ':uid'   => $memberUserId,
                ':tid'   => $trainerUserId,
                ':ntype' => $noteType,
                ':ntext' => $noteText,
                ':vis'   => $isVisible ? 1 : 0
            ]);

            return ['success' => true, 'message' => 'Trainer note saved successfully.'];
        } catch (Throwable $e) {
            error_log("[FitSync TrainerData] Error saving note: " . $e->getMessage());
            return ['success' => false, 'message' => 'Database error saving note.'];
        }
    }

    // Offline simulation
    return ['success' => true, 'message' => 'Note recorded successfully (Local simulation).'];
}

/**
 * Retrieve trainer schedule (sessions and working hours).
 *
 * @param int $trainerUserId
 * @param PDO|null $db
 * @return array
 */
function getTrainerSchedule(int $trainerUserId, ?PDO $db = null): array {
    $db = $db ?? getDbConnection();

    if ($db !== null) {
        try {
            // Availability rules
            $rulesStmt = $db->prepare("
                SELECT day_of_week, start_time, end_time, slot_duration_minutes, is_active
                FROM trainer_availability_rules
                WHERE trainer_user_id = :tid
                ORDER BY day_of_week ASC, start_time ASC
            ");
            $rulesStmt->execute([':tid' => $trainerUserId]);
            $rules = $rulesStmt->fetchAll();

            // Scheduled Sessions
            $sessStmt = $db->prepare("
                SELECT 
                    ts.id, ts.session_date, ts.start_time, ts.end_time, ts.session_type, ts.status, ts.session_notes,
                    u.id AS member_id, u.full_name AS member_name, u.email AS member_email,
                    g.name AS gym_name
                FROM trainer_sessions ts
                JOIN users u ON ts.member_user_id = u.id
                LEFT JOIN gyms g ON ts.gym_id = g.id
                WHERE ts.trainer_user_id = :tid
                ORDER BY ts.session_date ASC, ts.start_time ASC
            ");
            $sessStmt->execute([':tid' => $trainerUserId]);
            $sessions = $sessStmt->fetchAll();

            return [
                'rules'    => $rules,
                'sessions' => $sessions
            ];
        } catch (Throwable $e) {
            error_log("[FitSync TrainerData] Error fetching schedule: " . $e->getMessage());
        }
    }

    // Default empty when no sessions in database
    return [
        'rules'    => [],
        'sessions' => []
    ];
}
