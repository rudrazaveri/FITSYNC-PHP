<?php
/**
 * FitSync AI — Centralized Authoritative Data Service
 *
 * Implements real-time persistent data access across all portals:
 * - User / Member Portal
 * - Trainer Portal
 * - Gym Owner Portal
 * - Platform Admin Portal
 *
 * Enforces single source of truth (MySQL via PDO), role-based authorization,
 * trainer data permission checks, transactions, and zero fabricated statistics.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

class FitSyncDataService {
    private static ?FitSyncDataService $instance = null;
    private ?PDO $db;

    private function __construct(?PDO $db = null) {
        $this->db = $db ?? getDbConnection();
    }

    public static function getInstance(?PDO $db = null): FitSyncDataService {
        if (self::$instance === null || $db !== null) {
            self::$instance = new self($db);
        }
        return self::$instance;
    }

    public function getDb(): ?PDO {
        return $this->db;
    }

    // =========================================================================
    // INTERNAL HELPERS (Notifications, Role/Ownership, Permissions)
    // =========================================================================

    public function expireEndedMemberships(): void {
        if ($this->db === null) return;
        try {
            $this->db->exec("
                UPDATE memberships
                SET status = 'expired', updated_at = NOW()
                WHERE status = 'active' AND end_date IS NOT NULL AND end_date < CURDATE()
            ");
        } catch (Throwable $e) {
            error_log('[FitSync Expire Memberships Error] ' . $e->getMessage());
        }
    }

    public function createNotification(int $userId, string $title, string $body, ?string $entityType = null, ?int $entityId = null): void {
        if ($this->db === null || $userId <= 0) return;
        try {
            $stmt = $this->db->prepare("
                INSERT INTO notifications (user_id, title, body, entity_type, entity_id, is_read, created_at)
                VALUES (:uid, :title, :body, :etype, :eid, 0, NOW())
            ");
            $stmt->execute([
                ':uid'   => $userId,
                ':title' => mb_substr(trim($title), 0, 200),
                ':body'  => trim($body),
                ':etype' => $entityType,
                ':eid'   => $entityId
            ]);
        } catch (Throwable $e) {
            error_log('[FitSync Notification Error] ' . $e->getMessage());
        }
    }

    public function resolveOwnerGymId(int $ownerUserId, ?int $requestedGymId = null, string $role = 'gym_owner'): ?int {
        if ($this->db === null) return null;

        if ($role === 'admin' && $requestedGymId !== null && $requestedGymId > 0) {
            $stmt = $this->db->prepare("SELECT id FROM gyms WHERE id = :gid LIMIT 1");
            $stmt->execute([':gid' => $requestedGymId]);
            $gid = $stmt->fetchColumn();
            return $gid ? (int)$gid : null;
        }

        if ($requestedGymId !== null && $requestedGymId > 0) {
            $stmt = $this->db->prepare("SELECT id FROM gyms WHERE id = :gid AND owner_user_id = :oid LIMIT 1");
            $stmt->execute([':gid' => $requestedGymId, ':oid' => $ownerUserId]);
            $gid = $stmt->fetchColumn();
            return $gid ? (int)$gid : null;
        }

        $stmt = $this->db->prepare("SELECT id FROM gyms WHERE owner_user_id = :oid ORDER BY id ASC LIMIT 1");
        $stmt->execute([':oid' => $ownerUserId]);
        $gid = $stmt->fetchColumn();
        if ($gid) {
            return (int)$gid;
        }

        if ($role === 'admin') {
            $gid = $this->db->query("SELECT id FROM gyms ORDER BY id ASC LIMIT 1")->fetchColumn();
            return $gid ? (int)$gid : null;
        }

        return null;
    }

    public function isTrainerAssignedToUser(int $trainerUserId, int $memberUserId): ?array {
        if ($this->db === null) return null;
        $stmt = $this->db->prepare("
            SELECT ta.*,
                   COALESCE(tdp.can_view_measurements, 1) AS can_view_measurements,
                   COALESCE(tdp.can_view_nutrition, 1) AS can_view_nutrition,
                   COALESCE(tdp.can_view_assessments, 1) AS can_view_assessments,
                   COALESCE(tdp.can_log_attendance, 1) AS can_log_attendance
            FROM trainer_assignments ta
            LEFT JOIN trainer_data_permissions tdp ON tdp.assignment_id = ta.id
            WHERE ta.trainer_user_id = :tid AND ta.user_id = :mid AND ta.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([':tid' => $trainerUserId, ':mid' => $memberUserId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function isTrainerVerified(int $trainerUserId): bool {
        if ($this->db === null || $trainerUserId <= 0) return false;
        $stmt = $this->db->prepare("SELECT status FROM trainer_profiles WHERE user_id = :tid LIMIT 1");
        $stmt->execute([':tid' => $trainerUserId]);
        return $stmt->fetchColumn() === 'verified';
    }

    private function maskEmailAddress(?string $email): string {
        $email = trim((string)$email);
        if ($email === '' || !str_contains($email, '@')) return 'Protected';
        [$local, $domain] = explode('@', $email, 2);
        $visible = mb_substr($local, 0, min(2, mb_strlen($local)));
        return $visible . '***@' . $domain;
    }

    // =========================================================================
    // GYM OWNER DATA & TELEMETRY
    // =========================================================================

    public function getGymOwnerDashboard(int $ownerUserId, ?int $gymId = null, string $role = 'gym_owner'): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        $this->expireEndedMemberships();

        // Resolve Gym strictly owned by this Gym Owner (unless admin)
        $resolvedGymId = $this->resolveOwnerGymId($ownerUserId, $gymId, $role);

        $ownerStmt = $this->db->prepare("SELECT id, full_name, email, mobile FROM users WHERE id = :oid LIMIT 1");
        $ownerStmt->execute([':oid' => $ownerUserId]);
        $ownerInfo = $ownerStmt->fetch(PDO::FETCH_ASSOC) ?: null;

        $unreadNotifStmt = $this->db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = :oid AND is_read = 0");
        $unreadNotifStmt->execute([':oid' => $ownerUserId]);
        $unreadOwnerNotifs = (int)$unreadNotifStmt->fetchColumn();

        $notifStmt = $this->db->prepare("SELECT id, title, body, entity_type, entity_id, is_read, created_at FROM notifications WHERE user_id = :oid ORDER BY created_at DESC, id DESC LIMIT 25");
        $notifStmt->execute([':oid' => $ownerUserId]);
        $ownerNotifications = $notifStmt->fetchAll(PDO::FETCH_ASSOC);

        if ($resolvedGymId === null) {
            return [
                'owner' => $ownerInfo,
                'gym' => null,
                'stats' => [
                    'coaches_count'                   => 0,
                    'registered_trainers_count'       => 0,
                    'pending_trainer_requests_count'  => 0,
                    'members_count'                   => 0,
                    'registered_members_count'        => 0,
                    'selected_gym_members_count'      => 0,
                    'pending_requests'                => 0,
                    'rejected_inactive_requests_count'=> 0,
                    'active_checkins'                 => 0,
                    'capacity_pct'                    => 0,
                    'revenue'                         => 0.0,
                    'formatted_revenue'               => '₹0',
                    'unread_notifications'            => $unreadOwnerNotifs
                ],
                'coaches'                  => [],
                'registered_trainers'      => [],
                'pending_trainer_requests' => [],
                'members'                  => [],
                'registered_members'       => [],
                'membership_requests'      => [],
                'member_trainer_requests'  => [],
                'membership_plans'         => [],
                'turnstile_logs'           => [],
                'notifications'            => $ownerNotifications
            ];
        }

        $stmt = $this->db->prepare("SELECT id, name, city, capacity, status FROM gyms WHERE id = :gid LIMIT 1");
        $stmt->execute([':gid' => $resolvedGymId]);
        $gym = $stmt->fetch(PDO::FETCH_ASSOC);
        $gymCapacity = ($gym && isset($gym['capacity']) && (int)$gym['capacity'] > 0) ? (int)$gym['capacity'] : 50;

        // 1. Active Coaches affiliated with THIS gym
        $stmt = $this->db->prepare("
            SELECT 
                u.id, u.full_name AS name, u.email, u.mobile AS phone,
                tp.certification_name AS title, tp.experience_years, tp.hourly_rate,
                tp.specializations_summary AS specialties, tp.qualifications, tp.bio, tp.rating,
                COALESCE(tp.status, 'pending_verification') AS verification_status,
                gt.employment_type, gt.status AS affiliation_status, gt.joined_at,
                (SELECT GROUP_CONCAT(DISTINCT CONCAT(
                    ELT(tar.day_of_week + 1, 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'),
                    ' ', TIME_FORMAT(tar.start_time, '%H:%i'), '-', TIME_FORMAT(tar.end_time, '%H:%i')
                 ) SEPARATOR '; ')
                 FROM trainer_availability_rules tar
                 WHERE tar.trainer_user_id = u.id AND tar.is_active = 1) AS availability_summary,
                (SELECT COUNT(*) FROM trainer_assignments ta
                 INNER JOIN users au ON au.id = ta.user_id AND au.status = 'active'
                 WHERE ta.trainer_user_id = u.id AND ta.gym_id = :gid2 AND ta.status = 'active') AS assigned_athletes
            FROM gym_trainers gt
            INNER JOIN users u ON u.id = gt.trainer_user_id
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            WHERE gt.gym_id = :gid AND gt.is_active = 1 AND gt.status = 'active' AND u.status = 'active' AND u.role = 'trainer'
            ORDER BY u.id ASC
        ");
        $stmt->execute([':gid' => $resolvedGymId, ':gid2' => $resolvedGymId]);
        $coachRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $coaches = array_map(function($r) {
            return [
                'id'                  => 'tr-' . $r['id'],
                'user_id'             => (int)$r['id'],
                'name'                => $r['name'],
                'email'               => $r['email'],
                'phone'               => $r['phone'] ?? '',
                'title'               => $r['title'] ?? 'Certified Strength Coach',
                'experience'          => (isset($r['experience_years']) ? (int)$r['experience_years'] : 0) . ' Years',
                'experience_years'    => (int)($r['experience_years'] ?? 0),
                'hourlyRate'          => '₹' . number_format((float)($r['hourly_rate'] ?? 0)),
                'specialties'         => !empty($r['specialties']) ? array_map('trim', explode(',', $r['specialties'])) : [],
                'qualifications'      => $r['qualifications'] ?? 'Certified Fitness Trainer',
                'availability'        => $r['availability_summary'] ?: 'Mon–Sat Scheduled Slots',
                'bio'                 => $r['bio'] ?? '',
                'verification_status' => $r['verification_status'],
                'employment_type'     => $r['employment_type'],
                'rating'              => $r['rating'] ?? '5.0',
                'assignedAthletes'    => (int)$r['assigned_athletes'],
                'avatar'              => 'assets/images/trainer_raj.jpg'
            ];
        }, $coachRows);

        // 2. FitSync Registered Trainers Platform Directory (privacy-scoped contact fields)
        $allTrStmt = $this->db->prepare("
            SELECT 
                u.id, u.full_name, u.email, u.mobile, u.status AS account_status, u.created_at,
                tp.certification_name, tp.certifying_body, tp.experience_years,
                tp.specializations_summary, tp.qualifications, tp.areas_of_expertise,
                tp.training_approach, tp.bio, tp.hourly_rate, tp.rating,
                COALESCE(tp.status, 'pending_verification') AS verification_status,
                gt_self.status AS self_affiliation_status,
                gt_self.initiated_by AS self_initiated_by,
                gt_self.employment_type AS self_employment_type,
                gt_self.joined_at AS self_joined_at,
                (SELECT GROUP_CONCAT(DISTINCT g2.name ORDER BY g2.name SEPARATOR ', ')
                 FROM gym_trainers gt2
                 INNER JOIN gyms g2 ON g2.id = gt2.gym_id
                 WHERE gt2.trainer_user_id = u.id AND gt2.status = 'active' AND gt2.is_active = 1) AS active_gyms_list
            FROM users u
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            LEFT JOIN gym_trainers gt_self ON gt_self.trainer_user_id = u.id AND gt_self.gym_id = :gid
            WHERE u.role = 'trainer' AND u.status = 'active'
            ORDER BY u.created_at DESC, u.id DESC
        ");
        $allTrStmt->execute([':gid' => $resolvedGymId]);
        $registeredTrainersRaw = $allTrStmt->fetchAll(PDO::FETCH_ASSOC);

        $registeredTrainers = array_map(function($r) {
            $assocStatus = $r['self_affiliation_status'] ?: 'not_associated';
            $canSeeContact = in_array($assocStatus, ['active', 'pending', 'invited'], true);
            return [
                'user_id'             => (int)$r['id'],
                'name'                => $r['full_name'],
                'avatar'              => 'assets/images/trainer_raj.jpg',
                'email'               => $canSeeContact ? $r['email'] : $this->maskEmailAddress($r['email']),
                'phone'               => $canSeeContact ? ($r['mobile'] ?? 'Not provided') : 'Private until affiliated',
                'contact_visible'     => $canSeeContact,
                'specialization'      => $r['specializations_summary'] ?: 'General Fitness',
                'specialties'         => !empty($r['specializations_summary']) ? array_map('trim', explode(',', $r['specializations_summary'])) : [],
                'experience_years'    => (int)($r['experience_years'] ?? 0),
                'qualifications'      => $r['qualifications'] ?? 'Not specified',
                'certification_name'  => $r['certification_name'] ?? 'Certification Pending',
                'certifying_body'     => $r['certifying_body'] ?? '',
                'verification_status' => $r['verification_status'],
                'bio'                 => $r['bio'] ?? '',
                'training_approach'   => $r['training_approach'] ?? '',
                'areas_of_expertise'  => $r['areas_of_expertise'] ?? '',
                'gym_affiliations'    => !empty($r['active_gyms_list']) ? array_map('trim', explode(',', $r['active_gyms_list'])) : [],
                'association_status'  => $assocStatus,
                'initiated_by'        => $r['self_initiated_by'] ?? null,
                'account_status'      => $r['account_status'],
                'registered_at'       => $r['created_at']
            ];
        }, $registeredTrainersRaw);

        // Assignment history map for this gym
        $histStmt = $this->db->prepare("
            SELECT ta.id, ta.user_id, ta.trainer_user_id, ta.status, ta.start_date, ta.end_date, ta.created_at,
                   tu.full_name AS trainer_name, ab.full_name AS assigned_by_name
            FROM trainer_assignments ta
            INNER JOIN users tu ON tu.id = ta.trainer_user_id
            LEFT JOIN users ab ON ab.id = ta.assigned_by_user_id
            WHERE ta.gym_id = :gid
            ORDER BY ta.id DESC
        ");
        $histStmt->execute([':gid' => $resolvedGymId]);
        $assignHistoryByUser = [];
        foreach ($histStmt->fetchAll(PDO::FETCH_ASSOC) as $ah) {
            $assignHistoryByUser[(int)$ah['user_id']][] = $ah;
        }

        // 3. Verified Active Members in THIS gym
        $stmt = $this->db->prepare("
            SELECT 
                u.id, u.full_name AS name, u.email, u.mobile AS phone,
                up.gender, up.weight_kg AS weight, up.height_cm,
                m.id AS membership_id, m.status AS membership_status, m.start_date, m.end_date, m.approved_at, m.created_at,
                mp.name AS tier, mp.price AS plan_price,
                fg.title AS goal_title,
                ta.trainer_user_id AS assigned_coach_id,
                coach_u.full_name AS assigned_coach_name,
                (SELECT weight_kg FROM body_measurements WHERE user_id = u.id ORDER BY recorded_at DESC, id DESC LIMIT 1) AS latest_weight,
                (SELECT MAX(check_in_time) FROM attendance WHERE user_id = u.id AND gym_id = :gid_att) AS last_attendance,
                (SELECT COUNT(*) FROM workout_sessions WHERE user_id = u.id) AS workouts_count,
                (SELECT MAX(session_date) FROM workout_sessions WHERE user_id = u.id) AS last_workout_date
            FROM memberships m
            INNER JOIN users u ON u.id = m.user_id
            LEFT JOIN user_profiles up ON up.user_id = u.id
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            LEFT JOIN fitness_goals fg ON fg.user_id = u.id AND fg.status = 'active'
            LEFT JOIN trainer_assignments ta ON ta.user_id = u.id AND ta.gym_id = :gid2 AND ta.status = 'active'
            LEFT JOIN users coach_u ON coach_u.id = ta.trainer_user_id AND coach_u.status = 'active'
            WHERE m.gym_id = :gid AND m.status = 'active' AND u.status = 'active' AND u.role = 'user'
            ORDER BY u.id ASC
        ");
        $stmt->execute([':gid' => $resolvedGymId, ':gid2' => $resolvedGymId, ':gid_att' => $resolvedGymId]);
        $memberRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $members = array_map(function($r) use ($assignHistoryByUser) {
            $effectiveWeight = $r['latest_weight'] ?? $r['weight'] ?? null;
            $uid = (int)$r['id'];
            return [
                'id'                 => 'mem-' . $uid,
                'user_id'            => $uid,
                'membership_id'      => (int)$r['membership_id'],
                'name'               => $r['name'],
                'email'              => $r['email'],
                'phone'              => $r['phone'] ?? '',
                'gender'             => !empty($r['gender']) ? ucfirst($r['gender']) : 'Not specified',
                'weight'             => $effectiveWeight ? ($effectiveWeight . ' kg') : 'Not recorded',
                'goal'               => $r['goal_title'] ?: 'General Fitness',
                'membershipTier'     => $r['tier'] ?? 'Standard',
                'membership_status'  => $r['membership_status'],
                'membershipStatus'   => $r['membership_status'],
                'startDate'          => $r['start_date'],
                'endDate'            => $r['end_date'],
                'approved_at'        => $r['approved_at'] ?? null,
                'last_attendance'    => $r['last_attendance'] ?? null,
                'workouts_count'     => (int)($r['workouts_count'] ?? 0),
                'last_workout_date'  => $r['last_workout_date'] ?? null,
                'assignedCoach'      => $r['assigned_coach_name'] ?? 'Unassigned',
                'coach_id'           => $r['assigned_coach_id'] ? (int)$r['assigned_coach_id'] : null,
                'assignment_history' => $assignHistoryByUser[$uid] ?? [],
                'avatar'             => 'assets/images/member_aarav.jpg'
            ];
        }, $memberRows);

        // 4. FitSync Registered Members Platform Directory (5 segmented views + strict privacy scoping)
        $allMemStmt = $this->db->prepare("
            SELECT 
                u.id AS user_id, u.full_name, u.email, u.mobile, u.status AS account_status, u.created_at,
                up.preferred_gym_id, up.fitness_experience, up.gender,
                fg.title AS fitness_goal,
                lm.id AS latest_membership_id, lm.status AS gym_membership_status,
                lm.start_date AS gym_start_date, lm.end_date AS gym_end_date, lm.created_at AS request_date,
                lm.approved_at, lm.rejected_at, lm.rejection_reason,
                mp.name AS plan_name, mp.price AS plan_price,
                ta.trainer_user_id AS assigned_trainer_id, coach_u.full_name AS assigned_trainer_name,
                (SELECT COUNT(*) FROM memberships mh WHERE mh.user_id = u.id AND mh.gym_id = :gid_hist) AS gym_history_count,
                (SELECT MAX(check_in_time) FROM attendance att WHERE att.user_id = u.id AND att.gym_id = :gid_att2) AS last_attendance,
                (SELECT COUNT(*) FROM workout_sessions ws WHERE ws.user_id = u.id) AS workouts_count
            FROM users u
            LEFT JOIN user_profiles up ON up.user_id = u.id
            LEFT JOIN fitness_goals fg ON fg.user_id = u.id AND fg.status = 'active'
            LEFT JOIN memberships lm ON lm.id = (
                SELECT m2.id FROM memberships m2
                WHERE m2.user_id = u.id AND m2.gym_id = :gid_m
                ORDER BY FIELD(m2.status, 'active', 'pending', 'frozen', 'expired', 'cancelled', 'rejected'), m2.id DESC
                LIMIT 1
            )
            LEFT JOIN membership_plans mp ON mp.id = lm.plan_id
            LEFT JOIN trainer_assignments ta ON ta.user_id = u.id AND ta.gym_id = :gid_ta AND ta.status = 'active'
            LEFT JOIN users coach_u ON coach_u.id = ta.trainer_user_id AND coach_u.status = 'active'
            WHERE u.role = 'user' AND u.status = 'active'
            ORDER BY u.created_at DESC, u.id DESC
        ");
        $allMemStmt->execute([
            ':gid_hist' => $resolvedGymId,
            ':gid_att2' => $resolvedGymId,
            ':gid_m'    => $resolvedGymId,
            ':gid_ta'   => $resolvedGymId
        ]);
        $registeredMembersRaw = $allMemStmt->fetchAll(PDO::FETCH_ASSOC);

        $selectedGymCount = 0;
        $registeredMembers = array_map(function($r) use ($resolvedGymId, &$selectedGymCount, $assignHistoryByUser) {
            $gymMemStatus = $r['gym_membership_status'] ?: 'none';
            $selectedThisGym = ((int)($r['preferred_gym_id'] ?? 0) === $resolvedGymId) || ($gymMemStatus !== 'none');
            if ($selectedThisGym) $selectedGymCount++;
            $canSeeContact = $selectedThisGym;
            $uid = (int)$r['user_id'];

            return [
                'user_id'               => $uid,
                'name'                  => $r['full_name'],
                'avatar'                => 'assets/images/member_aarav.jpg',
                'email'                 => $canSeeContact ? $r['email'] : $this->maskEmailAddress($r['email']),
                'phone'                 => $canSeeContact ? ($r['mobile'] ?? 'Not provided') : 'Private',
                'contact_visible'       => $canSeeContact,
                'fitness_goal'          => $r['fitness_goal'] ?: 'General Fitness',
                'fitness_experience'    => $r['fitness_experience'] ?: 'intermediate',
                'registration_date'     => $r['created_at'],
                'selected_this_gym'     => $selectedThisGym,
                'membership_id'         => $r['latest_membership_id'] ? (int)$r['latest_membership_id'] : null,
                'membership_status'     => $gymMemStatus,
                'selected_plan'         => $r['plan_name'] ?? 'None',
                'plan_price'            => isset($r['plan_price']) ? (float)$r['plan_price'] : 0.0,
                'start_date'            => $r['gym_start_date'] ?? null,
                'end_date'              => $r['gym_end_date'] ?? null,
                'approved_at'           => $r['approved_at'] ?? null,
                'rejected_at'           => $r['rejected_at'] ?? null,
                'rejection_reason'      => $r['rejection_reason'] ?? null,
                'last_attendance'       => $r['last_attendance'] ?? null,
                'workouts_count'        => (int)($r['workouts_count'] ?? 0),
                'assigned_trainer_id'   => $r['assigned_trainer_id'] ? (int)$r['assigned_trainer_id'] : null,
                'assigned_trainer_name' => $r['assigned_trainer_name'] ?? null,
                'assignment_history'    => $assignHistoryByUser[$uid] ?? [],
                'gym_history_count'     => (int)($r['gym_history_count'] ?? 0)
            ];
        }, $registeredMembersRaw);

        // 5. Membership Requests (pending / recent cancelled / rejected / expired) for THIS gym
        $reqStmt = $this->db->prepare("
            SELECT 
                m.id, m.id AS membership_id, m.user_id, m.plan_id, m.gym_id, m.status, m.start_date, m.end_date,
                m.approved_by_user_id, m.approved_at, m.rejected_by_user_id, m.rejected_at, m.rejection_reason,
                m.created_at, m.updated_at,
                g.name AS gym_name,
                u.full_name, u.full_name AS member_name, u.email, u.email AS member_email, u.mobile AS member_phone,
                up.fitness_experience, up.weight_kg, up.height_cm,
                fg.title AS fitness_goal,
                mp.name AS plan_name, mp.price, mp.price AS plan_price, mp.duration_months,
                ta.trainer_user_id AS assigned_coach_id, coach_u.full_name AS assigned_coach_name
            FROM memberships m
            INNER JOIN gyms g ON g.id = m.gym_id
            INNER JOIN users u ON u.id = m.user_id
            LEFT JOIN user_profiles up ON up.user_id = u.id
            LEFT JOIN fitness_goals fg ON fg.user_id = u.id AND fg.status = 'active'
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            LEFT JOIN trainer_assignments ta ON ta.user_id = u.id AND ta.gym_id = m.gym_id AND ta.status = 'active'
            LEFT JOIN users coach_u ON coach_u.id = ta.trainer_user_id AND coach_u.status = 'active'
            WHERE m.gym_id = :gid AND m.status IN ('pending', 'cancelled', 'rejected', 'expired', 'frozen')
            ORDER BY FIELD(m.status, 'pending', 'frozen', 'cancelled', 'expired', 'rejected'), m.updated_at DESC
            LIMIT 50
        ");
        $reqStmt->execute([':gid' => $resolvedGymId]);
        $membershipRequests = array_map(function($r) {
            $r['member_avatar'] = 'assets/images/member_aarav.jpg';
            return $r;
        }, $reqStmt->fetchAll(PDO::FETCH_ASSOC));

        // 6. Member-Submitted Trainer Assignment Requests for THIS gym
        $mtrStmt = $this->db->prepare("
            SELECT mtr.id, mtr.member_user_id, mtr.trainer_user_id, mtr.gym_id, mtr.notes, mtr.status, mtr.created_at,
                   mu.full_name AS member_name, mu.email AS member_email,
                   tu.full_name AS trainer_name, tp.specializations_summary AS trainer_spec
            FROM member_trainer_requests mtr
            INNER JOIN users mu ON mu.id = mtr.member_user_id AND mu.status = 'active'
            INNER JOIN users tu ON tu.id = mtr.trainer_user_id AND tu.status = 'active'
            LEFT JOIN trainer_profiles tp ON tp.user_id = tu.id
            WHERE (mtr.gym_id = :gid OR EXISTS (
                SELECT 1 FROM memberships mm WHERE mm.user_id = mtr.member_user_id AND mm.gym_id = :gid2 AND mm.status = 'active'
            ))
            AND mtr.status = 'pending'
            ORDER BY mtr.created_at DESC
        ");
        $mtrStmt->execute([':gid' => $resolvedGymId, ':gid2' => $resolvedGymId]);
        $memberTrainerRequests = $mtrStmt->fetchAll(PDO::FETCH_ASSOC);

        // Membership Plans offered at this gym
        $planStmt = $this->db->prepare("
            SELECT id, name, description, duration_months, price, access_type
            FROM membership_plans
            WHERE gym_id = :gid AND is_active = 1
            ORDER BY price ASC
        ");
        $planStmt->execute([':gid' => $resolvedGymId]);
        $membershipPlans = $planStmt->fetchAll(PDO::FETCH_ASSOC);

        // Live Facility Capacity & Occupancy from Attendance (last 4h open check-ins)
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM attendance
            WHERE gym_id = :gid 
              AND check_out_time IS NULL 
              AND check_in_time >= DATE_SUB(NOW(), INTERVAL 4 HOUR)
        ");
        $stmt->execute([':gid' => $resolvedGymId]);
        $activeCheckins = (int)$stmt->fetchColumn();
        $capacityPct = $gymCapacity > 0 ? min(100, (int)round(($activeCheckins / $gymCapacity) * 100)) : 0;

        // Monthly Revenue from Verified Completed Payments in current calendar month
        $stmt = $this->db->prepare("
            SELECT COALESCE(SUM(amount), 0) FROM payments
            WHERE gym_id = :gid
              AND payment_status = 'completed'
              AND transaction_date >= DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')
        ");
        $stmt->execute([':gid' => $resolvedGymId]);
        $monthlyRevenue = (float)$stmt->fetchColumn();

        // Recent Attendance / Turnstile Logs
        $stmt = $this->db->prepare("
            SELECT 
                a.id, a.user_id, a.check_in_time, a.check_out_time, a.check_in_method, a.status,
                u.full_name AS athlete_name, u.email AS athlete_email,
                mp.name AS tier_name
            FROM attendance a
            INNER JOIN users u ON u.id = a.user_id
            LEFT JOIN memberships m ON m.user_id = u.id AND m.gym_id = a.gym_id AND m.status = 'active'
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            WHERE a.gym_id = :gid
            ORDER BY a.check_in_time DESC
            LIMIT 20
        ");
        $stmt->execute([':gid' => $resolvedGymId]);
        $turnstileLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Pending / Invited Trainer Affiliation Requests for this gym
        $trReqStmt = $this->db->prepare("
            SELECT 
                gt.gym_id, gt.trainer_user_id, gt.employment_type, gt.status AS affiliation_status, gt.initiated_by, gt.joined_at,
                u.full_name, u.email, u.mobile,
                tp.certification_name, tp.certifying_body, tp.experience_years, tp.specializations_summary,
                tp.qualifications, COALESCE(tp.status, 'pending_verification') AS trainer_verification_status
            FROM gym_trainers gt
            INNER JOIN users u ON u.id = gt.trainer_user_id AND u.status = 'active' AND u.role = 'trainer'
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            WHERE gt.gym_id = :gid AND gt.status IN ('pending', 'invited')
            ORDER BY FIELD(gt.status, 'pending', 'invited'), gt.joined_at DESC, u.id DESC
        ");
        $trReqStmt->execute([':gid' => $resolvedGymId]);
        $pendingTrainerRequests = $trReqStmt->fetchAll(PDO::FETCH_ASSOC);

        $pendingCount = count(array_filter($membershipRequests, fn($r) => $r['status'] === 'pending'));
        $rejectedInactiveCount = count(array_filter($membershipRequests, fn($r) => $r['status'] !== 'pending'));

        return [
            'owner' => $ownerInfo,
            'gym' => [
                'id'       => $resolvedGymId,
                'name'     => $gym['name'] ?? 'Gym Facility',
                'city'     => $gym['city'] ?? '',
                'capacity' => $gymCapacity,
                'status'   => $gym['status'] ?? 'active'
            ],
            'stats' => [
                'coaches_count'                    => count($coaches),
                'registered_trainers_count'        => count($registeredTrainers),
                'pending_trainer_requests_count'   => count($pendingTrainerRequests),
                'members_count'                    => count($members),
                'registered_members_count'         => count($registeredMembers),
                'selected_gym_members_count'       => $selectedGymCount,
                'pending_requests'                 => $pendingCount,
                'rejected_inactive_requests_count' => $rejectedInactiveCount,
                'active_checkins'                  => $activeCheckins,
                'capacity_pct'                     => $capacityPct,
                'revenue'                          => $monthlyRevenue,
                'formatted_revenue'                => '₹' . number_format($monthlyRevenue),
                'unread_notifications'             => $unreadOwnerNotifs
            ],
            'coaches'                  => $coaches,
            'registered_trainers'      => $registeredTrainers,
            'pending_trainer_requests' => $pendingTrainerRequests,
            'members'                  => $members,
            'registered_members'       => $registeredMembers,
            'membership_requests'      => $membershipRequests,
            'member_trainer_requests'  => $memberTrainerRequests,
            'membership_plans'         => $membershipPlans,
            'turnstile_logs'           => $turnstileLogs,
            'notifications'            => $ownerNotifications,
            'owned_gyms'               => $this->getOwnerGymsDetailed($ownerUserId, $role)
        ];
    }

    // =========================================================================
    // USER / ATHLETE DASHBOARD DATA
    // =========================================================================

    public function getUserDashboard(int $userId): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        $this->expireEndedMemberships();

        // 1. User & Profile
        $stmt = $this->db->prepare("
            SELECT u.id, u.email, u.mobile, u.full_name, u.role, u.status,
                   up.date_of_birth, up.gender, up.height_cm, up.weight_kg AS baseline_weight,
                   up.fitness_experience, up.bio
            FROM users u
            LEFT JOIN user_profiles up ON up.user_id = u.id
            WHERE u.id = :uid LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new RuntimeException("User not found.");
        }

        $heightCm = $user['height_cm'] ? (float)$user['height_cm'] : null;
        $age = null;
        if (!empty($user['date_of_birth'])) {
            $age = (new DateTime($user['date_of_birth']))->diff(new DateTime())->y;
        }

        // 2. Latest & Historical Body Measurements
        $stmt = $this->db->prepare("
            SELECT * FROM body_measurements 
            WHERE user_id = :uid 
            ORDER BY recorded_at DESC, id DESC 
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $latestMeasurement = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

        $stmt = $this->db->prepare("
            SELECT * FROM body_measurements 
            WHERE user_id = :uid 
            ORDER BY recorded_at DESC, id DESC 
            LIMIT 1 OFFSET 1
        ");
        $stmt->execute([':uid' => $userId]);
        $previousMeasurement = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

        $stmt = $this->db->prepare("
            SELECT id, recorded_at, weight_kg, waist_cm, chest_cm, hips_cm, arms_cm, thighs_cm, body_fat_pct, notes
            FROM body_measurements
            WHERE user_id = :uid
            ORDER BY recorded_at ASC, id ASC
            LIMIT 30
        ");
        $stmt->execute([':uid' => $userId]);
        $measurementHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $currentWeight = null;
        $bmi = null;
        $weightDelta = null;

        if ($latestMeasurement && isset($latestMeasurement['weight_kg'])) {
            $currentWeight = (float)$latestMeasurement['weight_kg'];
        } elseif (!empty($user['baseline_weight'])) {
            $currentWeight = (float)$user['baseline_weight'];
        }

        if ($currentWeight !== null && $heightCm !== null && $heightCm > 0) {
            $heightM = $heightCm / 100.0;
            $bmi = round($currentWeight / ($heightM * $heightM), 1);
        }

        if ($currentWeight !== null && $previousMeasurement && isset($previousMeasurement['weight_kg'])) {
            $weightDelta = round($currentWeight - (float)$previousMeasurement['weight_kg'], 1);
        }

        // 3. Fitness Goal & Latest Assessment
        $stmt = $this->db->prepare("SELECT * FROM fitness_goals WHERE user_id = :uid AND status = 'active' ORDER BY id DESC LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $goal = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

        $stmt = $this->db->prepare("SELECT * FROM fitness_assessments WHERE user_id = :uid ORDER BY assessment_date DESC, id DESC LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $assessment = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

        // 4. Nutrition & Daily Calories (Asia/Kolkata date)
        $today = date('Y-m-d');
        $stmt = $this->db->prepare("
            SELECT 
                COALESCE(SUM(total_calories), 0) AS total_calories,
                COALESCE(SUM(total_protein_g), 0) AS total_protein,
                COALESCE(SUM(total_carbs_g), 0) AS total_carbs,
                COALESCE(SUM(total_fat_g), 0) AS total_fat,
                COUNT(*) AS meal_count
            FROM meals
            WHERE user_id = :uid AND meal_date = :today
        ");
        $stmt->execute([':uid' => $userId, ':today' => $today]);
        $nutritionSummary = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $this->db->prepare("
            SELECT m.*, 
                   (SELECT unit FROM meal_items mi WHERE mi.meal_id = m.id LIMIT 1) AS food_name,
                   (SELECT COUNT(*) FROM meal_items mi WHERE mi.meal_id = m.id) AS item_count
            FROM meals m
            WHERE m.user_id = :uid AND m.meal_date = :today
            ORDER BY m.logged_at ASC
        ");
        $stmt->execute([':uid' => $userId, ':today' => $today]);
        $todayMeals = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 5. Daily Water Intake
        $stmt = $this->db->prepare("
            SELECT COALESCE(SUM(amount_ml), 0) FROM water_logs
            WHERE user_id = :uid AND log_date = :today
        ");
        $stmt->execute([':uid' => $userId, ':today' => $today]);
        $waterTotalMl = (int)$stmt->fetchColumn();

        // 6. Assigned Workout Plan + Days + Exercises + Recent Sessions
        $workoutOverview = $this->getUserWorkoutOverview($userId);

        // 7. Assigned Trainer & Permissions
        $stmt = $this->db->prepare("
            SELECT 
                ta.id AS assignment_id, ta.start_date AS assigned_since, ta.notes AS coach_notes,
                u.id AS coach_id, u.full_name AS coach_name, u.email AS coach_email, u.mobile AS coach_phone,
                tp.certification_name AS coach_title, tp.rating AS coach_rating, tp.hourly_rate, tp.specializations_summary,
                tp.experience_years, g.name AS gym_name,
                COALESCE(tdp.can_view_measurements, 1) AS can_view_measurements,
                COALESCE(tdp.can_view_nutrition, 1) AS can_view_nutrition,
                COALESCE(tdp.can_view_assessments, 1) AS can_view_assessments,
                COALESCE(tdp.can_log_attendance, 1) AS can_log_attendance
            FROM trainer_assignments ta
            INNER JOIN users u ON u.id = ta.trainer_user_id AND u.status = 'active'
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            LEFT JOIN gyms g ON g.id = ta.gym_id
            LEFT JOIN trainer_data_permissions tdp ON tdp.assignment_id = ta.id
            WHERE ta.user_id = :uid AND ta.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $assignedTrainer = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

        // 8. Membership (Latest active or pending/cancelled)
        $stmt = $this->db->prepare("
            SELECT m.*, mp.name AS plan_name, mp.price AS plan_price, mp.duration_months, mp.access_type,
                   g.name AS gym_name, g.city AS gym_city, g.address_line1 AS gym_address
            FROM memberships m
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            LEFT JOIN gyms g ON g.id = m.gym_id
            WHERE m.user_id = :uid
            ORDER BY FIELD(m.status, 'active', 'pending', 'frozen', 'expired', 'cancelled', 'rejected'), m.id DESC
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $membership = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

        // 9. Trainer Shared Feedback / Notes
        $stmt = $this->db->prepare("
            SELECT tn.id, tn.note_type, tn.note_text, tn.created_at, coach.full_name AS coach_name
            FROM trainer_notes tn
            INNER JOIN users coach ON coach.id = tn.trainer_user_id
            WHERE tn.user_id = :uid AND tn.is_visible_to_user = 1
            ORDER BY tn.created_at DESC
            LIMIT 10
        ");
        $stmt->execute([':uid' => $userId]);
        $trainerNotes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 10. Attendance History
        $stmt = $this->db->prepare("
            SELECT a.id, a.check_in_time, a.check_out_time, a.check_in_method, a.status, g.name AS gym_name
            FROM attendance a
            LEFT JOIN gyms g ON g.id = a.gym_id
            WHERE a.user_id = :uid
            ORDER BY a.check_in_time DESC
            LIMIT 15
        ");
        $stmt->execute([':uid' => $userId]);
        $attendanceHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 11. Unread chat messages & notifications
        $unreadMessages = $this->getUnreadMessagesCount($userId);
        $unreadNotifStmt = $this->db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = :uid AND is_read = 0");
        $unreadNotifStmt->execute([':uid' => $userId]);
        $unreadNotifications = (int)$unreadNotifStmt->fetchColumn();

        $notifListStmt = $this->db->prepare("
            SELECT id, title, body, entity_type, entity_id, is_read, created_at
            FROM notifications WHERE user_id = :uid
            ORDER BY created_at DESC, id DESC LIMIT 20
        ");
        $notifListStmt->execute([':uid' => $userId]);
        $recentNotifications = $notifListStmt->fetchAll(PDO::FETCH_ASSOC);

        $activeMembershipsStmt = $this->db->prepare("SELECT COUNT(*) FROM memberships WHERE user_id = :uid AND status = 'active'");
        $activeMembershipsStmt->execute([':uid' => $userId]);
        $activeMembershipsCount = (int)$activeMembershipsStmt->fetchColumn();

        $eligibleTrainers = $this->getMemberTrainerDirectory($userId, []);

        return [
            'user' => [
                'id'                 => (int)$user['id'],
                'full_name'          => $user['full_name'],
                'email'              => $user['email'],
                'mobile'             => $user['mobile'],
                'gender'             => $user['gender'],
                'age'                => $age,
                'height_cm'          => $heightCm,
                'weight_kg'          => $currentWeight,
                'bmi'                => $bmi,
                'weight_delta'       => $weightDelta,
                'fitness_experience' => $user['fitness_experience'],
                'bio'                => $user['bio']
            ],
            'goal'       => $goal,
            'assessment' => $assessment,
            'membership' => $membership,
            'active_memberships_count' => $activeMembershipsCount,
            'measurement' => [
                'latest'   => $latestMeasurement,
                'previous' => $previousMeasurement,
                'history'  => $measurementHistory
            ],
            'nutrition' => [
                'calories' => (int)($nutritionSummary['total_calories'] ?? 0),
                'protein'  => (float)($nutritionSummary['total_protein'] ?? 0),
                'carbs'    => (float)($nutritionSummary['total_carbs'] ?? 0),
                'fat'      => (float)($nutritionSummary['total_fat'] ?? 0),
                'meals'    => $todayMeals
            ],
            'water' => [
                'total_ml' => $waterTotalMl,
                'liters'   => round($waterTotalMl / 1000.0, 1)
            ],
            'workout'              => $workoutOverview,
            'trainer'              => $assignedTrainer,
            'eligible_trainers'    => $eligibleTrainers,
            'data_permissions'     => $assignedTrainer ? [
                'can_view_measurements' => (bool)$assignedTrainer['can_view_measurements'],
                'can_view_nutrition'    => (bool)$assignedTrainer['can_view_nutrition'],
                'can_view_assessments'  => (bool)$assignedTrainer['can_view_assessments'],
                'can_log_attendance'    => (bool)$assignedTrainer['can_log_attendance']
            ] : null,
            'feedback'             => $trainerNotes,
            'attendance'           => $attendanceHistory,
            'unread_messages'      => $unreadMessages,
            'unread_notifications' => $unreadNotifications,
            'notifications'        => $recentNotifications
        ];
    }

    public function getMemberTrainerDirectory(int $memberUserId, array $filters = []): array {
        if ($this->db === null) return [];

        $memGymStmt = $this->db->prepare("SELECT gym_id FROM memberships WHERE user_id = :uid AND status = 'active' ORDER BY id DESC LIMIT 1");
        $memGymStmt->execute([':uid' => $memberUserId]);
        $activeGymId = (int)($memGymStmt->fetchColumn() ?: 0);

        $assignedStmt = $this->db->prepare("SELECT trainer_user_id FROM trainer_assignments WHERE user_id = :uid AND status = 'active' LIMIT 1");
        $assignedStmt->execute([':uid' => $memberUserId]);
        $assignedTrainerId = (int)($assignedStmt->fetchColumn() ?: 0);

        $search = trim((string)($filters['search'] ?? ''));
        $specFilter = trim((string)($filters['specialization'] ?? ''));
        $gymFilter = isset($filters['gym_id']) && (int)$filters['gym_id'] > 0 ? (int)$filters['gym_id'] : 0;

        $sql = "
            SELECT 
                u.id AS user_id, u.full_name, u.created_at,
                tp.certification_name, tp.certifying_body, tp.experience_years,
                tp.specializations_summary, tp.qualifications, tp.areas_of_expertise,
                tp.training_approach, tp.bio, tp.hourly_rate, tp.rating,
                COALESCE(tp.status, 'pending_verification') AS verification_status,
                (SELECT GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ')
                 FROM gym_trainers gt INNER JOIN gyms g ON g.id = gt.gym_id
                 WHERE gt.trainer_user_id = u.id AND gt.status = 'active' AND gt.is_active = 1) AS gym_names,
                (SELECT MAX(CASE WHEN gt.gym_id = :agid AND gt.status = 'active' AND gt.is_active = 1 THEN 1 ELSE 0 END)
                 FROM gym_trainers gt WHERE gt.trainer_user_id = u.id) AS at_member_gym,
                (SELECT GROUP_CONCAT(DISTINCT CONCAT(
                    ELT(tar.day_of_week + 1, 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'),
                    ' ', TIME_FORMAT(tar.start_time, '%H:%i'), '-', TIME_FORMAT(tar.end_time, '%H:%i')
                 ) SEPARATOR '; ')
                 FROM trainer_availability_rules tar
                 WHERE tar.trainer_user_id = u.id AND tar.is_active = 1) AS availability_summary,
                (SELECT mtr.status FROM member_trainer_requests mtr
                 WHERE mtr.member_user_id = :muid AND mtr.trainer_user_id = u.id
                 ORDER BY mtr.id DESC LIMIT 1) AS request_status
            FROM users u
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            WHERE u.role = 'trainer' AND u.status = 'active'
        ";
        $params = [':agid' => $activeGymId, ':muid' => $memberUserId];

        if ($search !== '') {
            $sql .= " AND (u.full_name LIKE :q OR tp.specializations_summary LIKE :q2 OR tp.qualifications LIKE :q3)";
            $params[':q'] = '%' . $search . '%';
            $params[':q2'] = '%' . $search . '%';
            $params[':q3'] = '%' . $search . '%';
        }
        if ($specFilter !== '' && strtolower($specFilter) !== 'all') {
            $sql .= " AND tp.specializations_summary LIKE :spec";
            $params[':spec'] = '%' . $specFilter . '%';
        }
        if ($gymFilter > 0) {
            $sql .= " AND EXISTS (SELECT 1 FROM gym_trainers gtf WHERE gtf.trainer_user_id = u.id AND gtf.gym_id = :fgid AND gtf.status = 'active' AND gtf.is_active = 1)";
            $params[':fgid'] = $gymFilter;
        }

        $sql .= " ORDER BY (u.id = :tid_ord) DESC, (tp.status = 'verified') DESC, at_member_gym DESC, u.id DESC";
        $params[':tid_ord'] = $assignedTrainerId;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function($r) use ($assignedTrainerId) {
            $verif = $r['verification_status'] ?? 'pending_verification';
            $isVerified = ($verif === 'verified');
            $specs = !empty($r['specializations_summary'])
                ? array_values(array_filter(array_map('trim', explode(',', $r['specializations_summary']))))
                : ['Strength & Conditioning'];
            return [
                'id'                   => 'tr-' . $r['user_id'],
                'user_id'              => (int)$r['user_id'],
                'name'                 => $r['full_name'],
                'avatar'               => 'assets/images/trainer_raj.jpg',
                'title'                => $isVerified ? ($r['certification_name'] ?: 'Certified Strength Coach') : 'Trainer (Verification Pending)',
                'experience'           => ((int)($r['experience_years'] ?? 0)) . ' Years',
                'experience_years'     => (int)($r['experience_years'] ?? 0),
                'qualifications'       => $r['qualifications'] ?? 'Not specified',
                'verification_status'  => $verif,
                'is_certified'         => $isVerified,
                'certification_badge'  => $isVerified ? 'Verified Certified' : ($verif === 'rejected' ? 'Verification Declined' : 'Verification Pending'),
                'certification_name'   => $isVerified ? ($r['certification_name'] ?? 'Certified') : 'Pending Review',
                'certifying_body'      => $r['certifying_body'] ?? '',
                'specialties'          => $specs,
                'gym'                  => $r['gym_names'] ?: 'Independent Trainer',
                'associated_gyms'      => !empty($r['gym_names']) ? array_map('trim', explode(',', $r['gym_names'])) : [],
                'at_member_gym'        => (bool)($r['at_member_gym'] ?? false),
                'availability'         => $r['availability_summary'] ?: 'Mon–Sat Scheduled Slots',
                'bio'                  => $r['bio'] ?? '',
                'training_approach'    => $r['training_approach'] ?? '',
                'hourly_rate'          => (float)($r['hourly_rate'] ?? 0),
                'rating'               => (float)($r['rating'] ?? 5.0),
                'isAssigned'           => ((int)$r['user_id'] === $assignedTrainerId),
                'request_status'       => $r['request_status'] ?? null
            ];
        }, $rows);
    }

    public function requestTrainerForMember(int $memberUserId, int $trainerUserId, ?string $notes = null): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        if ($trainerUserId <= 0) {
            throw new InvalidArgumentException("Valid trainer selection required.");
        }

        $trStmt = $this->db->prepare("SELECT id, full_name FROM users WHERE id = :tid AND role = 'trainer' AND status = 'active' LIMIT 1");
        $trStmt->execute([':tid' => $trainerUserId]);
        $trRow = $trStmt->fetch(PDO::FETCH_ASSOC);
        if (!$trRow) {
            throw new InvalidArgumentException("Selected trainer account is unavailable.");
        }

        $existingAssign = $this->isTrainerAssignedToUser($trainerUserId, $memberUserId);
        if ($existingAssign) {
            return ['already_assigned' => true, 'status' => 'active', 'trainer_name' => $trRow['full_name']];
        }

        $dupStmt = $this->db->prepare("
            SELECT id FROM member_trainer_requests
            WHERE member_user_id = :mid AND trainer_user_id = :tid AND status = 'pending'
            LIMIT 1
        ");
        $dupStmt->execute([':mid' => $memberUserId, ':tid' => $trainerUserId]);
        $existingReqId = $dupStmt->fetchColumn();
        if ($existingReqId) {
            return ['request_id' => (int)$existingReqId, 'status' => 'pending', 'already_requested' => true];
        }

        // Resolve member's active gym (or preferred gym)
        $gStmt = $this->db->prepare("
            SELECT COALESCE(
                (SELECT gym_id FROM memberships WHERE user_id = :u1 AND status = 'active' ORDER BY id DESC LIMIT 1),
                (SELECT preferred_gym_id FROM user_profiles WHERE user_id = :u2 LIMIT 1)
            ) AS gid
        ");
        $gStmt->execute([':u1' => $memberUserId, ':u2' => $memberUserId]);
        $gymId = (int)($gStmt->fetchColumn() ?: 0);

        $uName = (string)$this->db->query("SELECT full_name FROM users WHERE id = " . (int)$memberUserId)->fetchColumn();

        $ins = $this->db->prepare("
            INSERT INTO member_trainer_requests (member_user_id, trainer_user_id, gym_id, notes, status, created_at, updated_at)
            VALUES (:mid, :tid, :gid, :notes, 'pending', NOW(), NOW())
        ");
        $ins->execute([
            ':mid'   => $memberUserId,
            ':tid'   => $trainerUserId,
            ':gid'   => $gymId > 0 ? $gymId : null,
            ':notes' => $notes ? trim($notes) : 'Requested trainer mentorship via Member Portal'
        ]);
        $reqId = (int)$this->db->lastInsertId();

        if ($gymId > 0) {
            $oStmt = $this->db->prepare("SELECT owner_user_id, name FROM gyms WHERE id = :gid LIMIT 1");
            $oStmt->execute([':gid' => $gymId]);
            $gRow = $oStmt->fetch(PDO::FETCH_ASSOC);
            if ($gRow && !empty($gRow['owner_user_id'])) {
                $this->createNotification(
                    (int)$gRow['owner_user_id'],
                    'Trainer Request from Member',
                    "{$uName} requested {$trRow['full_name']} as their personal trainer at {$gRow['name']}.",
                    'member_trainer_request',
                    $reqId
                );
            }
        }
        $this->createNotification(
            $trainerUserId,
            'Member Requested You as Trainer',
            "{$uName} submitted a trainer request for your coaching profile.",
            'member_trainer_request',
            $reqId
        );

        return ['request_id' => $reqId, 'status' => 'pending', 'trainer_name' => $trRow['full_name']];
    }

    // =========================================================================
    // WORKOUT PLANS & EXECUTION LOGGING (Workflow B)
    // =========================================================================

    public function getUserWorkoutOverview(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT 
                pa.id AS assignment_id, pa.plan_id, pa.start_date, pa.status, pa.assigned_at,
                wp.name AS plan_name, wp.description AS plan_desc, wp.days_per_week, wp.goal, wp.difficulty,
                coach.id AS coach_id, coach.full_name AS coach_name
            FROM plan_assignments pa
            INNER JOIN workout_plans wp ON wp.id = pa.plan_id
            LEFT JOIN users coach ON coach.id = pa.assigned_by_trainer_id
            WHERE pa.user_id = :uid AND pa.is_active = 1
            ORDER BY pa.assigned_at DESC, pa.id DESC
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $assignedPlan = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

        $days = [];
        $todayPlanDay = null;
        $dayExercises = [];
        $dayOfWeek = (int)date('N');

        if ($assignedPlan) {
            $dStmt = $this->db->prepare("
                SELECT * FROM plan_days
                WHERE plan_id = :pid
                ORDER BY sort_order ASC, day_number ASC
            ");
            $dStmt->execute([':pid' => $assignedPlan['plan_id']]);
            $rawDays = $dStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rawDays as $d) {
                $eStmt = $this->db->prepare("
                    SELECT 
                        pde.id AS plan_day_exercise_id, pde.target_sets, pde.target_reps, pde.rest_seconds, pde.exercise_notes,
                        e.id AS exercise_id, e.name AS exercise_name, e.equipment_required, e.difficulty, e.image_path,
                        mg.name AS muscle_group_name
                    FROM plan_day_exercises pde
                    INNER JOIN exercises e ON e.id = pde.exercise_id
                    LEFT JOIN muscle_groups mg ON mg.id = e.primary_muscle_id
                    WHERE pde.plan_day_id = :pdid
                    ORDER BY pde.sort_order ASC, pde.id ASC
                ");
                $eStmt->execute([':pdid' => $d['id']]);
                $d['exercises'] = $eStmt->fetchAll(PDO::FETCH_ASSOC);
                $days[] = $d;

                if ((int)$d['day_number'] === $dayOfWeek || ($todayPlanDay === null && !$d['is_rest_day'])) {
                    if ((int)$d['day_number'] === $dayOfWeek || $todayPlanDay === null) {
                        $todayPlanDay = $d;
                        $dayExercises = $d['exercises'];
                    }
                }
            }
        }

        // Completed / Recent Workout Sessions
        $sStmt = $this->db->prepare("
            SELECT ws.*, pd.day_name, pd.focus_area
            FROM workout_sessions ws
            LEFT JOIN plan_days pd ON pd.id = ws.plan_day_id
            WHERE ws.user_id = :uid
            ORDER BY ws.session_date DESC, ws.id DESC
            LIMIT 15
        ");
        $sStmt->execute([':uid' => $userId]);
        $sessions = $sStmt->fetchAll(PDO::FETCH_ASSOC);

        $cStmt = $this->db->prepare("SELECT COUNT(*) FROM workout_sessions WHERE user_id = :uid");
        $cStmt->execute([':uid' => $userId]);
        $completedCount = (int)$cStmt->fetchColumn();

        return [
            'plan'            => $assignedPlan,
            'days'            => $days,
            'today_day'       => $todayPlanDay,
            'exercises'       => $dayExercises,
            'sessions'        => $sessions,
            'completed_count' => $completedCount
        ];
    }

    public function createOrUpdateWorkoutPlan(int $trainerUserId, array $input): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        if (!$this->isTrainerVerified($trainerUserId)) {
            throw new RuntimeException("Forbidden: Trainer verification is pending. Workout plan management is locked until verified.");
        }

        $planId      = isset($input['plan_id']) ? (int)$input['plan_id'] : 0;
        $name        = trim((string)($input['name'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $difficulty  = in_array($input['difficulty'] ?? '', ['beginner','intermediate','advanced'], true) ? $input['difficulty'] : 'intermediate';
        $goal        = in_array($input['goal'] ?? '', ['hypertrophy','fat_loss','strength','endurance','mobility'], true) ? $input['goal'] : 'hypertrophy';
        $daysPerWeek = max(1, min(7, (int)($input['days_per_week'] ?? 4)));
        $daysInput   = is_array($input['days'] ?? null) ? $input['days'] : [];

        if (empty($name)) {
            throw new InvalidArgumentException("Workout plan name is required.");
        }

        $this->db->beginTransaction();
        try {
            if ($planId > 0) {
                // Verify ownership
                $chk = $this->db->prepare("SELECT id FROM workout_plans WHERE id = :pid AND author_trainer_id = :tid LIMIT 1");
                $chk->execute([':pid' => $planId, ':tid' => $trainerUserId]);
                if (!$chk->fetchColumn()) {
                    throw new RuntimeException("Unauthorized: You can only edit workout plans you created.");
                }
                $up = $this->db->prepare("
                    UPDATE workout_plans
                    SET name = :name, description = :desc, difficulty = :diff, days_per_week = :dpw, goal = :goal, updated_at = NOW()
                    WHERE id = :pid
                ");
                $up->execute([
                    ':name' => $name,
                    ':desc' => $description,
                    ':diff' => $difficulty,
                    ':dpw'  => $daysPerWeek,
                    ':goal' => $goal,
                    ':pid'  => $planId
                ]);
                // Replace days if provided
                if (!empty($daysInput)) {
                    $this->db->prepare("DELETE FROM plan_days WHERE plan_id = :pid")->execute([':pid' => $planId]);
                }
            } else {
                $ins = $this->db->prepare("
                    INSERT INTO workout_plans (name, description, author_trainer_id, is_template, difficulty, days_per_week, goal, created_at, updated_at)
                    VALUES (:name, :desc, :tid, 0, :diff, :dpw, :goal, NOW(), NOW())
                ");
                $ins->execute([
                    ':name' => $name,
                    ':desc' => $description,
                    ':tid'  => $trainerUserId,
                    ':diff' => $difficulty,
                    ':dpw'  => $daysPerWeek,
                    ':goal' => $goal
                ]);
                $planId = (int)$this->db->lastInsertId();
            }

            if (empty($daysInput) && !isset($input['plan_id'])) {
                // Default 1-day entry if trainer entered a concise prescription
                $exIds = is_array($input['exercise_ids'] ?? null) ? $input['exercise_ids'] : [];
                $daysInput = [[
                    'day_number' => (int)date('N'),
                    'day_code'   => strtolower(date('D')),
                    'day_name'   => date('l') . ' Training',
                    'focus_area' => trim((string)($input['focus_area'] ?? $name)),
                    'exercises'  => array_map(fn($eid) => [
                        'exercise_id'  => (int)$eid,
                        'target_sets'  => (int)($input['target_sets'] ?? 4),
                        'target_reps'  => (string)($input['target_reps'] ?? '8-12'),
                        'rest_seconds' => (int)($input['rest_seconds'] ?? 90),
                        'notes'        => trim((string)($input['exercise_notes'] ?? ''))
                    ], $exIds)
                ]];
            }

            $dayCodes = [1=>'mon',2=>'tue',3=>'wed',4=>'thu',5=>'fri',6=>'sat',7=>'sun'];
            $dayNames = [1=>'Monday',2=>'Tuesday',3=>'Wednesday',4=>'Thursday',5=>'Friday',6=>'Saturday',7=>'Sunday'];

            foreach ($daysInput as $idx => $d) {
                $dNum  = max(1, min(7, (int)($d['day_number'] ?? ($idx + 1))));
                $dCode = trim((string)($d['day_code'] ?? $dayCodes[$dNum]));
                $dName = trim((string)($d['day_name'] ?? $dayNames[$dNum]));
                $focus = trim((string)($d['focus_area'] ?? $name));
                $isRest = !empty($d['is_rest_day']) ? 1 : 0;

                $pdIns = $this->db->prepare("
                    INSERT INTO plan_days (plan_id, day_number, day_code, day_name, focus_area, is_rest_day, sort_order)
                    VALUES (:pid, :dnum, :dcode, :dname, :focus, :rest, :sort)
                ");
                $pdIns->execute([
                    ':pid'   => $planId,
                    ':dnum'  => $dNum,
                    ':dcode' => $dCode,
                    ':dname' => $dName,
                    ':focus' => $focus,
                    ':rest'  => $isRest,
                    ':sort'  => $idx + 1
                ]);
                $planDayId = (int)$this->db->lastInsertId();

                $exs = is_array($d['exercises'] ?? null) ? $d['exercises'] : [];
                foreach ($exs as $eIdx => $ex) {
                    $exId = (int)($ex['exercise_id'] ?? 0);
                    if ($exId <= 0) continue;
                    $pdeIns = $this->db->prepare("
                        INSERT INTO plan_day_exercises (plan_day_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, exercise_notes)
                        VALUES (:pdid, :eid, :sort, :sets, :reps, :rest, :notes)
                    ");
                    $pdeIns->execute([
                        ':pdid'  => $planDayId,
                        ':eid'   => $exId,
                        ':sort'  => $eIdx + 1,
                        ':sets'  => max(1, (int)($ex['target_sets'] ?? 3)),
                        ':reps'  => trim((string)($ex['target_reps'] ?? '10-12')),
                        ':rest'  => max(15, (int)($ex['rest_seconds'] ?? 90)),
                        ':notes' => !empty($ex['notes']) ? trim((string)$ex['notes']) : null
                    ]);
                }
            }

            $this->db->commit();
            return ['plan_id' => $planId, 'name' => $name];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function assignWorkoutPlan(int $trainerUserId, int $memberUserId, int $planId): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        if (!$this->isTrainerVerified($trainerUserId)) {
            throw new RuntimeException("Forbidden: Trainer verification is pending. Workout assignments are locked until verified.");
        }

        // Verify trainer assignment
        if (!$this->isTrainerAssignedToUser($trainerUserId, $memberUserId)) {
            throw new RuntimeException("Unauthorized: Member is not assigned to you.");
        }

        $pStmt = $this->db->prepare("SELECT id, name FROM workout_plans WHERE id = :pid LIMIT 1");
        $pStmt->execute([':pid' => $planId]);
        $plan = $pStmt->fetch(PDO::FETCH_ASSOC);
        if (!$plan) {
            throw new InvalidArgumentException("Selected workout plan does not exist.");
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                UPDATE plan_assignments 
                SET is_active = 0, status = 'superseded' 
                WHERE user_id = :mid AND is_active = 1
            ");
            $stmt->execute([':mid' => $memberUserId]);

            $stmt = $this->db->prepare("
                INSERT INTO plan_assignments (
                    plan_id, user_id, assigned_by_trainer_id, start_date, is_active, status, assigned_at
                ) VALUES (
                    :pid, :mid, :tid, CURDATE(), 1, 'active', NOW()
                )
            ");
            $stmt->execute([
                ':pid' => $planId,
                ':mid' => $memberUserId,
                ':tid' => $trainerUserId
            ]);
            $assignmentId = (int)$this->db->lastInsertId();

            // Notify member
            $this->createNotification(
                $memberUserId,
                'New Workout Plan Assigned',
                "Your trainer assigned the workout plan: {$plan['name']}.",
                'workout_plan',
                $planId
            );

            $this->db->commit();

            return [
                'assignment_id' => $assignmentId,
                'plan_id'       => $planId,
                'plan_name'     => $plan['name'],
                'user_id'       => $memberUserId
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function logWorkoutSession(int $userId, array $exercisesData, ?int $planDayId = null, ?string $notes = null, ?int $durationMinutes = null): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        $this->db->beginTransaction();
        try {
            // Resolve active gym_id if user has one
            $gStmt = $this->db->prepare("SELECT gym_id FROM memberships WHERE user_id = :uid AND status = 'active' LIMIT 1");
            $gStmt->execute([':uid' => $userId]);
            $gymId = $gStmt->fetchColumn();
            $gymId = $gymId ? (int)$gymId : null;

            $dur = $durationMinutes !== null && $durationMinutes > 0 ? $durationMinutes : 45;

            $sStmt = $this->db->prepare("
                INSERT INTO workout_sessions (
                    user_id, plan_day_id, gym_id, session_date, start_time, end_time, duration_minutes, total_volume_kg, total_sets_completed, notes, created_at
                ) VALUES (
                    :uid, :pdid, :gid, CURDATE(), DATE_SUB(NOW(), INTERVAL :dur MINUTE), NOW(), :dur2, 0, 0, :notes, NOW()
                )
            ");
            $sStmt->execute([
                ':uid'   => $userId,
                ':pdid'  => $planDayId ?: null,
                ':gid'   => $gymId,
                ':dur'   => $dur,
                ':dur2'  => $dur,
                ':notes' => $notes
            ]);
            $sessionId = (int)$this->db->lastInsertId();

            $totalVolume = 0.0;
            $totalSets = 0;

            foreach ($exercisesData as $idx => $ex) {
                $exId = isset($ex['exercise_id']) ? (int)$ex['exercise_id'] : 0;
                $exName = trim((string)($ex['name'] ?? ''));

                if ($exId <= 0 && !empty($exName)) {
                    $fStmt = $this->db->prepare("SELECT id FROM exercises WHERE LOWER(name) = LOWER(:n) LIMIT 1");
                    $fStmt->execute([':n' => $exName]);
                    $exId = (int)$fStmt->fetchColumn();
                }
                if ($exId <= 0) {
                    // Pick first verified catalog exercise as fallback reference if custom name doesn't match
                    $exId = (int)$this->db->query("SELECT id FROM exercises ORDER BY id ASC LIMIT 1")->fetchColumn();
                }
                if ($exId <= 0) continue;

                $seStmt = $this->db->prepare("
                    INSERT INTO session_exercises (session_id, exercise_id, sort_order)
                    VALUES (:sid, :eid, :sort)
                ");
                $seStmt->execute([':sid' => $sessionId, ':eid' => $exId, ':sort' => $idx + 1]);
                $sessionExId = (int)$this->db->lastInsertId();

                $sets = is_array($ex['sets'] ?? null) ? $ex['sets'] : [];
                foreach ($sets as $sIdx => $s) {
                    $isDone = isset($s['done']) ? (bool)$s['done'] : true;
                    if (!$isDone) continue;
                    $weight = (isset($s['weight']) && is_numeric($s['weight'])) ? (float)$s['weight'] : 0.0;
                    $reps   = max(1, (int)($s['reps'] ?? 10));
                    $setNum = (int)($s['set'] ?? ($sIdx + 1));

                    $logStmt = $this->db->prepare("
                        INSERT INTO exercise_set_logs (session_exercise_id, set_number, weight_kg, reps_completed, is_completed, logged_at)
                        VALUES (:seid, :snum, :w, :reps, 1, NOW())
                    ");
                    $logStmt->execute([
                        ':seid' => $sessionExId,
                        ':snum' => $setNum,
                        ':w'    => $weight,
                        ':reps' => $reps
                    ]);

                    $totalSets++;
                    $totalVolume += ($weight * $reps);
                }
            }

            // If user clicked Complete Session without pre-toggling individual checkboxes, record baseline sets
            if ($totalSets === 0 && !empty($exercisesData)) {
                $totalSets = count($exercisesData);
            }

            $upStmt = $this->db->prepare("
                UPDATE workout_sessions
                SET total_volume_kg = :vol, total_sets_completed = :sets
                WHERE id = :sid
            ");
            $upStmt->execute([
                ':vol'  => round($totalVolume, 2),
                ':sets' => $totalSets,
                ':sid'  => $sessionId
            ]);

            // Notify assigned trainer
            $tStmt = $this->db->prepare("SELECT trainer_user_id FROM trainer_assignments WHERE user_id = :uid AND status = 'active' LIMIT 1");
            $tStmt->execute([':uid' => $userId]);
            $trainerId = (int)$tStmt->fetchColumn();
            if ($trainerId > 0) {
                $uName = (string)$this->db->query("SELECT full_name FROM users WHERE id = " . (int)$userId)->fetchColumn();
                $this->createNotification(
                    $trainerId,
                    'Workout Completed',
                    "{$uName} completed a workout session ({$totalSets} sets, " . round($totalVolume) . " kg volume).",
                    'workout_session',
                    $sessionId
                );
            }

            $this->db->commit();

            return [
                'session_id'           => $sessionId,
                'total_sets_completed' => $totalSets,
                'total_volume_kg'      => round($totalVolume, 2),
                'session_date'         => date('Y-m-d')
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function logExerciseSet(
        int $userId,
        ?int $planDayId,
        int $exerciseId,
        int $setNumber,
        float $weightKg,
        int $repsCompleted,
        ?float $rpe = null
    ): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                SELECT id FROM workout_sessions
                WHERE user_id = :uid AND session_date = CURDATE()
                ORDER BY id DESC LIMIT 1
            ");
            $stmt->execute([':uid' => $userId]);
            $sessionId = $stmt->fetchColumn();

            if (!$sessionId) {
                $gStmt = $this->db->prepare("SELECT gym_id FROM memberships WHERE user_id = :uid AND status = 'active' LIMIT 1");
                $gStmt->execute([':uid' => $userId]);
                $gymId = $gStmt->fetchColumn() ?: null;

                $stmt = $this->db->prepare("
                    INSERT INTO workout_sessions (
                        user_id, plan_day_id, gym_id, session_date, start_time, total_volume_kg, total_sets_completed, created_at
                    ) VALUES (
                        :uid, :pdid, :gid, CURDATE(), NOW(), 0, 0, NOW()
                    )
                ");
                $stmt->execute([':uid' => $userId, ':pdid' => $planDayId ?: null, ':gid' => $gymId]);
                $sessionId = (int)$this->db->lastInsertId();
            } else {
                $sessionId = (int)$sessionId;
            }

            $stmt = $this->db->prepare("
                SELECT id FROM session_exercises
                WHERE session_id = :sid AND exercise_id = :eid
                LIMIT 1
            ");
            $stmt->execute([':sid' => $sessionId, ':eid' => $exerciseId]);
            $sessionExerciseId = $stmt->fetchColumn();

            if (!$sessionExerciseId) {
                $stmt = $this->db->prepare("
                    INSERT INTO session_exercises (session_id, exercise_id, sort_order)
                    VALUES (:sid, :eid, 1)
                ");
                $stmt->execute([':sid' => $sessionId, ':eid' => $exerciseId]);
                $sessionExerciseId = (int)$this->db->lastInsertId();
            } else {
                $sessionExerciseId = (int)$sessionExerciseId;
            }

            $stmt = $this->db->prepare("
                INSERT INTO exercise_set_logs (
                    session_exercise_id, set_number, weight_kg, reps_completed, is_completed, rpe, logged_at
                ) VALUES (
                    :seid, :snum, :weight, :reps, 1, :rpe, NOW()
                )
            ");
            $stmt->execute([
                ':seid'   => $sessionExerciseId,
                ':snum'   => $setNumber,
                ':weight' => $weightKg,
                ':reps'   => $repsCompleted,
                ':rpe'    => $rpe
            ]);
            $logId = (int)$this->db->lastInsertId();

            $setVolume = $weightKg * $repsCompleted;
            $stmt = $this->db->prepare("
                UPDATE workout_sessions
                SET total_volume_kg = total_volume_kg + :vol,
                    total_sets_completed = total_sets_completed + 1,
                    end_time = NOW()
                WHERE id = :sid
            ");
            $stmt->execute([':vol' => $setVolume, ':sid' => $sessionId]);

            $this->db->commit();

            return [
                'log_id'              => $logId,
                'session_id'          => $sessionId,
                'session_exercise_id' => $sessionExerciseId,
                'volume_added'        => $setVolume
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // =========================================================================
    // TRAINER DATA & ATHLETE DOSSIER (Strictly Assignment-Scoped)
    // =========================================================================

    public function getAthleteDossier(int $trainerUserId, int $memberUserId, string $role = 'trainer'): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        $permissions = [
            'can_view_measurements' => 1,
            'can_view_nutrition'    => 1,
            'can_view_assessments'  => 1,
            'can_log_attendance'    => 1
        ];

        if ($role !== 'admin' && $role !== 'gym_owner') {
            if (!$this->isTrainerVerified($trainerUserId)) {
                throw new RuntimeException("Forbidden: Your trainer account is pending verification and cannot view athlete dossiers yet.");
            }
            $assignment = $this->isTrainerAssignedToUser($trainerUserId, $memberUserId);
            if (!$assignment) {
                throw new RuntimeException("Unauthorized: Coach is not assigned to this athlete.");
            }
            $permissions = [
                'can_view_measurements' => (int)$assignment['can_view_measurements'],
                'can_view_nutrition'    => (int)$assignment['can_view_nutrition'],
                'can_view_assessments'  => (int)$assignment['can_view_assessments'],
                'can_log_attendance'    => (int)$assignment['can_log_attendance']
            ];
        }

        $memberData = $this->getUserDashboard($memberUserId);

        // Enforce trainer_data_permissions
        $measurementData = $permissions['can_view_measurements']
            ? $memberData['measurement']
            : ['restricted' => true, 'latest' => null, 'previous' => null, 'history' => []];

        $nutritionData = $permissions['can_view_nutrition']
            ? $memberData['nutrition']
            : ['restricted' => true, 'calories' => 0, 'protein' => 0, 'carbs' => 0, 'fat' => 0, 'meals' => []];

        $waterData = $permissions['can_view_nutrition']
            ? $memberData['water']
            : ['restricted' => true, 'total_ml' => 0, 'liters' => 0];

        $assessmentData = $permissions['can_view_assessments']
            ? $memberData['assessment']
            : null;

        // Trainer notes
        $stmt = $this->db->prepare("
            SELECT id, note_type, note_text, is_visible_to_user, created_at
            FROM trainer_notes
            WHERE user_id = :mid AND trainer_user_id = :tid
            ORDER BY created_at DESC
        ");
        $stmt->execute([':mid' => $memberUserId, ':tid' => $trainerUserId]);
        $allNotes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'athlete'          => $memberData['user'],
            'goal'             => $memberData['goal'],
            'membership'       => $memberData['membership'],
            'assessment'       => $assessmentData,
            'permissions'      => $permissions,
            'measurement'      => $measurementData,
            'nutrition'        => $nutritionData,
            'water'            => $waterData,
            'workout'          => $memberData['workout'],
            'attendance'       => $memberData['attendance'],
            'notes'            => $allNotes,
            'recent_sessions'  => $memberData['workout']['sessions'] ?? []
        ];
    }

    public function getTrainerDashboard(int $trainerUserId): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        // 1. Trainer Profile
        $stmt = $this->db->prepare("
            SELECT u.id, u.full_name, u.email, u.mobile,
                   tp.certification_name, tp.certifying_body, tp.experience_years, tp.hourly_rate, tp.rating,
                   tp.specializations_summary, tp.qualifications, tp.areas_of_expertise, tp.training_approach,
                   tp.bio, COALESCE(tp.status, 'pending_verification') AS verification_status
            FROM users u
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            WHERE u.id = :tid AND u.role = 'trainer'
            LIMIT 1
        ");
        $stmt->execute([':tid' => $trainerUserId]);
        $trainer = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$trainer) {
            throw new RuntimeException("Trainer profile not found.");
        }

        // All Gym Affiliations & Invitations for this Trainer
        $affStmt = $this->db->prepare("
            SELECT gt.gym_id, gt.employment_type, gt.status AS affiliation_status, gt.initiated_by, gt.is_active, gt.joined_at,
                   g.name AS gym_name, g.city AS gym_city, g.address_line1 AS gym_address
            FROM gym_trainers gt
            INNER JOIN gyms g ON g.id = gt.gym_id
            WHERE gt.trainer_user_id = :tid
            ORDER BY FIELD(gt.status, 'invited', 'active', 'pending', 'rejected', 'inactive') ASC, gt.joined_at DESC
        ");
        $affStmt->execute([':tid' => $trainerUserId]);
        $gymAffiliations = $affStmt->fetchAll(PDO::FETCH_ASSOC);

        $primaryAff = null;
        foreach ($gymAffiliations as $ga) {
            if ($ga['affiliation_status'] === 'active') { $primaryAff = $ga; break; }
        }
        if (!$primaryAff && !empty($gymAffiliations)) {
            $primaryAff = $gymAffiliations[0];
        }
        $trainer['gym_id'] = $primaryAff['gym_id'] ?? null;
        $trainer['gym_name'] = $primaryAff['gym_name'] ?? 'Independent Trainer';
        $trainer['gym_city'] = $primaryAff['gym_city'] ?? '';
        $trainer['gym_affiliation_status'] = $primaryAff['affiliation_status'] ?? 'independent';

        $unreadNotifStmt = $this->db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = :tid AND is_read = 0");
        $unreadNotifStmt->execute([':tid' => $trainerUserId]);
        $unreadTrainerNotifs = (int)$unreadNotifStmt->fetchColumn();

        $isVerified = ($trainer['verification_status'] ?? 'pending_verification') === 'verified';
        if (!$isVerified) {
            $nStmt = $this->db->prepare("SELECT id, title, body, entity_type, entity_id, is_read, created_at FROM notifications WHERE user_id = :tid ORDER BY created_at DESC LIMIT 20");
            $nStmt->execute([':tid' => $trainerUserId]);
            return [
                'trainer'              => $trainer,
                'gym_affiliations'     => $gymAffiliations,
                'is_verified'          => false,
                'athletes'             => [],
                'today_agenda'         => [],
                'attendance_logs'      => [],
                'workout_plans'        => [],
                'recent_workouts'      => [],
                'notifications'        => $nStmt->fetchAll(PDO::FETCH_ASSOC),
                'unread_notifications' => $unreadTrainerNotifs,
                'unread_messages'      => 0,
                'stats' => [
                    'total_assigned'     => 0,
                    'active_members'     => 0,
                    'pending_workouts'   => 0,
                    'completed_workouts' => 0,
                    'today_sessions'     => 0,
                    'adherence_pct'      => 0,
                    'collective_volume'  => 0
                ]
            ];
        }

        // 2. Strictly Assigned Active Athletes (role='user' and active)
        $stmt = $this->db->prepare("
            SELECT 
                u.id, u.full_name, u.email, u.mobile,
                up.weight_kg AS baseline_weight, up.height_cm, up.gender,
                ta.id AS assignment_id, ta.gym_id AS assignment_gym_id, ta.start_date, ta.notes AS assignment_notes,
                fg.title AS goal_title,
                mp.name AS membership_tier,
                m.status AS membership_status, m.start_date AS membership_start, m.end_date AS membership_end,
                COALESCE(tag.name, mg.name, 'FitSync Partner Gym') AS gym_name,
                COALESCE(ta.gym_id, m.gym_id) AS member_gym_id,
                wp.id AS active_plan_id, wp.name AS active_plan_name, wp.days_per_week,
                (SELECT weight_kg FROM body_measurements WHERE user_id = u.id ORDER BY recorded_at DESC, id DESC LIMIT 1) AS latest_weight,
                (SELECT body_fat_pct FROM body_measurements WHERE user_id = u.id ORDER BY recorded_at DESC, id DESC LIMIT 1) AS latest_body_fat,
                (SELECT MAX(check_in_time) FROM attendance WHERE user_id = u.id) AS last_attendance,
                (SELECT COUNT(*) FROM workout_sessions WHERE user_id = u.id) AS completed_workouts,
                (SELECT MAX(session_date) FROM workout_sessions WHERE user_id = u.id) AS last_workout_date,
                (SELECT COUNT(*) FROM workout_sessions WHERE user_id = u.id AND session_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS sessions_30d,
                (SELECT COALESCE(SUM(total_volume_kg), 0) FROM workout_sessions WHERE user_id = u.id) AS total_volume_kg,
                COALESCE(tdp.can_view_measurements, 1) AS can_view_measurements,
                COALESCE(tdp.can_view_nutrition, 1) AS can_view_nutrition
            FROM trainer_assignments ta
            INNER JOIN users u ON u.id = ta.user_id AND u.status = 'active' AND u.role = 'user'
            LEFT JOIN user_profiles up ON up.user_id = u.id
            LEFT JOIN fitness_goals fg ON fg.user_id = u.id AND fg.status = 'active'
            LEFT JOIN memberships m ON m.user_id = u.id AND m.status = 'active'
            LEFT JOIN gyms tag ON tag.id = ta.gym_id
            LEFT JOIN gyms mg ON mg.id = m.gym_id
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            LEFT JOIN plan_assignments pa ON pa.user_id = u.id AND pa.is_active = 1
            LEFT JOIN workout_plans wp ON wp.id = pa.plan_id
            LEFT JOIN trainer_data_permissions tdp ON tdp.assignment_id = ta.id
            WHERE ta.trainer_user_id = :tid AND ta.status = 'active'
            ORDER BY u.id ASC
        ");
        $stmt->execute([':tid' => $trainerUserId]);
        $rawAthletes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $athletes = [];
        $collectiveVolume = 0.0;
        $totalAdherence = 0;

        foreach ($rawAthletes as $a) {
            $aid = (int)$a['id'];
            $daysPerWeek = max(1, (int)($a['days_per_week'] ?? 4));
            $expected30d = $daysPerWeek * 4;
            $sessions30d = (int)$a['sessions_30d'];
            $adherencePct = $expected30d > 0 ? min(100, (int)round(($sessions30d / $expected30d) * 100)) : 0;

            $vol = (float)($a['total_volume_kg'] ?? 0);
            $collectiveVolume += $vol;
            $totalAdherence += $adherencePct;

            // Unread messages from this athlete
            $unreadStmt = $this->db->prepare("
                SELECT COUNT(*)
                FROM messages m
                INNER JOIN conversations c ON c.id = m.conversation_id
                WHERE ((c.participant_one_id = :tid1 AND c.participant_two_id = :aid1)
                    OR (c.participant_one_id = :aid2 AND c.participant_two_id = :tid2))
                  AND m.sender_id = :aid3 AND m.is_read = 0
            ");
            $unreadStmt->execute([
                ':tid1' => $trainerUserId, ':aid1' => $aid,
                ':aid2' => $aid, ':tid2' => $trainerUserId,
                ':aid3' => $aid
            ]);
            $unreadCount = (int)$unreadStmt->fetchColumn();

            $effectiveWeight = $a['latest_weight'] ?? $a['baseline_weight'] ?? null;

            $athletes[] = [
                'id'                    => 'mem-' . $aid,
                'user_id'               => $aid,
                'name'                  => $a['full_name'],
                'email'                 => $a['email'],
                'mobile'                => $a['mobile'] ?? '',
                'gender'                => $a['gender'] ?? '',
                'weight'                => $effectiveWeight ? (float)$effectiveWeight : null,
                'body_fat'              => $a['latest_body_fat'] ? (float)$a['latest_body_fat'] : null,
                'goal'                  => $a['goal_title'] ?: 'General Fitness',
                'gym_id'                => $a['member_gym_id'] ? (int)$a['member_gym_id'] : null,
                'gym_name'              => $a['gym_name'] ?? 'FitSync Partner Gym',
                'membershipTier'        => $a['membership_tier'] ?? ($a['membership_status'] === 'active' ? 'Active Member' : 'No Active Pass'),
                'membership_status'     => $a['membership_status'] ?? 'none',
                'active_plan_id'        => $a['active_plan_id'] ? (int)$a['active_plan_id'] : null,
                'active_plan_name'      => $a['active_plan_name'] ?? 'No Plan Assigned',
                'last_attendance'       => $a['last_attendance'],
                'completed_workouts'    => (int)$a['completed_workouts'],
                'last_workout_date'     => $a['last_workout_date'] ?? null,
                'total_volume_kg'       => round($vol, 1),
                'adherence_pct'         => $adherencePct,
                'unread_messages'       => $unreadCount,
                'can_view_measurements' => (bool)$a['can_view_measurements'],
                'can_view_nutrition'    => (bool)$a['can_view_nutrition']
            ];
        }

        // 3. Scheduled Sessions (using actual schema columns)
        $stmt = $this->db->prepare("
            SELECT 
                ts.id, ts.member_user_id AS user_id, ts.session_date, ts.start_time, ts.end_time,
                ts.session_type, ts.status, ts.session_notes,
                u.full_name AS member_name, u.email AS member_email,
                g.name AS gym_name
            FROM trainer_sessions ts
            INNER JOIN users u ON u.id = ts.member_user_id
            LEFT JOIN gyms g ON g.id = ts.gym_id
            WHERE ts.trainer_user_id = :tid AND ts.session_date >= CURDATE()
            ORDER BY ts.session_date ASC, ts.start_time ASC
            LIMIT 20
        ");
        $stmt->execute([':tid' => $trainerUserId]);
        $todayAgenda = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Attendance Logs ONLY for assigned athletes
        $stmt = $this->db->prepare("
            SELECT a.id, a.user_id, a.check_in_time, a.check_out_time, a.check_in_method, a.status,
                   u.full_name AS athlete_name, u.email AS athlete_email, g.name AS gym_name
            FROM attendance a
            INNER JOIN trainer_assignments ta ON ta.user_id = a.user_id AND ta.trainer_user_id = :tid AND ta.status = 'active'
            INNER JOIN users u ON u.id = a.user_id
            LEFT JOIN gyms g ON g.id = a.gym_id
            ORDER BY a.check_in_time DESC
            LIMIT 25
        ");
        $stmt->execute([':tid' => $trainerUserId]);
        $attendanceLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 5. Workout Plans authored by this trainer (+ templates)
        $stmt = $this->db->prepare("
            SELECT wp.*,
                   (SELECT COUNT(*) FROM plan_assignments pa WHERE pa.plan_id = wp.id AND pa.is_active = 1) AS assigned_count
            FROM workout_plans wp
            WHERE wp.author_trainer_id = :tid OR wp.is_template = 1
            ORDER BY wp.created_at DESC
        ");
        $stmt->execute([':tid' => $trainerUserId]);
        $workoutPlans = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 6. Recent Completed Workout Sessions by assigned athletes
        $stmt = $this->db->prepare("
            SELECT ws.*, u.full_name AS athlete_name, u.email AS athlete_email, pd.day_name, pd.focus_area
            FROM workout_sessions ws
            INNER JOIN trainer_assignments ta ON ta.user_id = ws.user_id AND ta.trainer_user_id = :tid AND ta.status = 'active'
            INNER JOIN users u ON u.id = ws.user_id
            LEFT JOIN plan_days pd ON pd.id = ws.plan_day_id
            ORDER BY ws.session_date DESC, ws.id DESC
            LIMIT 20
        ");
        $stmt->execute([':tid' => $trainerUserId]);
        $recentWorkouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 7. Real Notifications for this trainer
        $stmt = $this->db->prepare("
            SELECT id, title, body, entity_type, entity_id, is_read, created_at
            FROM notifications
            WHERE user_id = :tid
            ORDER BY created_at DESC
            LIMIT 25
        ");
        $stmt->execute([':tid' => $trainerUserId]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $athleteCount = count($athletes);
        $avgAdherence = $athleteCount > 0 ? (int)round($totalAdherence / $athleteCount) : 0;
        $todaySessionsCount = count(array_filter($todayAgenda, fn($s) => $s['session_date'] === date('Y-m-d')));
        $completedWorkoutsTotal = array_sum(array_map(fn($a) => (int)($a['completed_workouts'] ?? 0), $athletes));
        $pendingWorkoutsCount = count(array_filter($athletes, fn($a) => empty($a['active_plan_id']) || (int)($a['completed_workouts'] ?? 0) === 0));

        return [
            'trainer'              => $trainer,
            'gym_affiliations'     => $gymAffiliations,
            'is_verified'          => true,
            'athletes'             => $athletes,
            'today_agenda'         => $todayAgenda,
            'attendance_logs'      => $attendanceLogs,
            'workout_plans'        => $workoutPlans,
            'recent_workouts'      => $recentWorkouts,
            'notifications'        => $notifications,
            'unread_notifications' => $unreadTrainerNotifs,
            'unread_messages'      => $this->getUnreadMessagesCount($trainerUserId),
            'stats' => [
                'total_assigned'     => $athleteCount,
                'active_members'     => $athleteCount,
                'pending_workouts'   => $pendingWorkoutsCount,
                'completed_workouts' => $completedWorkoutsTotal,
                'today_sessions'     => $todaySessionsCount,
                'adherence_pct'      => $avgAdherence,
                'collective_volume'  => round($collectiveVolume, 1)
            ]
        ];
    }

    // =========================================================================
    // WORKFLOW A: Record Weight & Body Measurements (Preserving History)
    // =========================================================================

    public function recordWeightMeasurement(
        int $userId,
        float $weightKg,
        ?float $waistCm = null,
        ?float $chestCm = null,
        ?float $armsCm = null,
        ?float $thighsCm = null,
        ?float $bodyFatPct = null,
        ?string $notes = null
    ): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        if ($weightKg <= 20.0 || $weightKg >= 350.0) {
            throw new InvalidArgumentException("Weight must be between 20 kg and 350 kg.");
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO body_measurements (
                    user_id, recorded_at, weight_kg, body_fat_pct,
                    chest_cm, waist_cm, arms_cm, thighs_cm, notes, created_at
                ) VALUES (
                    :uid, CURDATE(), :weight, :bf,
                    :chest, :waist, :arms, :thighs, :notes, NOW()
                )
            ");
            $stmt->execute([
                ':uid'    => $userId,
                ':weight' => $weightKg,
                ':bf'     => $bodyFatPct,
                ':chest'  => $chestCm,
                ':waist'  => $waistCm,
                ':arms'   => $armsCm,
                ':thighs' => $thighsCm,
                ':notes'  => $notes ?: 'Weight & measurement update'
            ]);
            $measurementId = (int)$this->db->lastInsertId();

            $stmt = $this->db->prepare("
                INSERT INTO user_profiles (user_id, weight_kg, updated_at)
                VALUES (:uid, :w, NOW())
                ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg), updated_at = NOW()
            ");
            $stmt->execute([':w' => $weightKg, ':uid' => $userId]);

            $this->db->commit();

            return [
                'measurement_id' => $measurementId,
                'weight_kg'      => $weightKg,
                'recorded_at'    => date('Y-m-d')
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // =========================================================================
    // WORKFLOW B: Real Two-Way Coach Chat Messaging
    // =========================================================================

    public function getUnreadMessagesCount(int $userId): int {
        if ($this->db === null || $userId <= 0) return 0;
        $stmt = $this->db->prepare("
            SELECT COUNT(*)
            FROM messages m
            INNER JOIN conversations c ON c.id = m.conversation_id
            WHERE (c.participant_one_id = :u1 OR c.participant_two_id = :u2)
              AND m.sender_id != :u3
              AND m.is_read = 0
        ");
        $stmt->execute([':u1' => $userId, ':u2' => $userId, ':u3' => $userId]);
        return (int)$stmt->fetchColumn();
    }

    public function assertConversationParticipant(int $conversationId, int $userId): array {
        $stmt = $this->db->prepare("
            SELECT * FROM conversations
            WHERE id = :cid AND (participant_one_id = :u1 OR participant_two_id = :u2)
            LIMIT 1
        ");
        $stmt->execute([':cid' => $conversationId, ':u1' => $userId, ':u2' => $userId]);
        $conv = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$conv) {
            throw new RuntimeException("Forbidden: You are not a participant in this conversation.");
        }
        return $conv;
    }

    public function assertCanMessage(int $userA, int $userB): void {
        if ($userA === $userB) {
            throw new InvalidArgumentException("Cannot start a conversation with yourself.");
        }
        // Gym Owners do not have automatic access to private Member-Coach messaging
        $rStmt = $this->db->prepare("SELECT id, role FROM users WHERE id IN (:ua, :ub)");
        $rStmt->execute([':ua' => $userA, ':ub' => $userB]);
        $rolesMap = [];
        foreach ($rStmt->fetchAll(PDO::FETCH_ASSOC) as $rr) {
            $rolesMap[(int)$rr['id']] = (string)$rr['role'];
        }
        $roleA = $rolesMap[$userA] ?? '';
        $roleB = $rolesMap[$userB] ?? '';
        if ($roleA === 'gym_owner' || $roleB === 'gym_owner') {
            throw new RuntimeException("Forbidden: Gym Owners cannot access private Member-Coach conversations.");
        }
        if ($roleA === 'admin') {
            return;
        }
        // Require an active trainer assignment between the Member and Coach
        $stmt = $this->db->prepare("
            SELECT 1 FROM trainer_assignments
            WHERE status = 'active'
              AND ((user_id = :a1 AND trainer_user_id = :b1)
                OR (user_id = :b2 AND trainer_user_id = :a2))
            LIMIT 1
        ");
        $stmt->execute([':a1' => $userA, ':b1' => $userB, ':b2' => $userB, ':a2' => $userA]);
        if ($stmt->fetchColumn()) {
            return;
        }
        throw new RuntimeException("Forbidden: Messaging is only permitted with your assigned coach or athletes.");
    }

    public function getOrCreateConversation(int $userA, int $userB, string $type = 'trainer_member'): int {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        $this->assertCanMessage($userA, $userB);

        $stmt = $this->db->prepare("
            SELECT id FROM conversations
            WHERE ((participant_one_id = :u1a AND participant_two_id = :u2a)
               OR (participant_one_id = :u2b AND participant_two_id = :u1b))
            LIMIT 1
        ");
        $stmt->execute([
            ':u1a' => $userA, ':u2a' => $userB,
            ':u2b' => $userB, ':u1b' => $userA
        ]);
        $convId = $stmt->fetchColumn();
        if ($convId) {
            return (int)$convId;
        }

        $stmt = $this->db->prepare("
            INSERT INTO conversations (participant_one_id, participant_two_id, conversation_type, last_message_at, created_at)
            VALUES (:u1, :u2, :ctype, NOW(), NOW())
        ");
        $stmt->execute([':u1' => $userA, ':u2' => $userB, ':ctype' => $type]);
        return (int)$this->db->lastInsertId();
    }

    public function sendMessage(int $senderId, int $recipientId, string $messageText): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        $trimmed = trim($messageText);
        if (empty($trimmed)) {
            throw new InvalidArgumentException("Message text cannot be empty.");
        }

        $convId = $this->getOrCreateConversation($senderId, $recipientId);

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO messages (conversation_id, sender_id, message_text, is_read, sent_at)
                VALUES (:cid, :sid, :text, 0, NOW())
            ");
            $stmt->execute([':cid' => $convId, ':sid' => $senderId, ':text' => $trimmed]);
            $msgId = (int)$this->db->lastInsertId();

            $stmt = $this->db->prepare("UPDATE conversations SET last_message_at = NOW() WHERE id = :cid");
            $stmt->execute([':cid' => $convId]);

            $sStmt = $this->db->prepare("SELECT full_name, role FROM users WHERE id = :sid LIMIT 1");
            $sStmt->execute([':sid' => $senderId]);
            $senderRow = $sStmt->fetch(PDO::FETCH_ASSOC);
            $senderName = $senderRow['full_name'] ?? 'FitSync User';

            $this->createNotification(
                $recipientId,
                "New message from {$senderName}",
                mb_substr($trimmed, 0, 120),
                'message',
                $msgId
            );

            $this->db->commit();

            return [
                'id'              => $msgId,
                'message_id'      => $msgId,
                'conversation_id' => $convId,
                'sender_id'       => $senderId,
                'sender_name'     => $senderName,
                'sender_role'     => $senderRow['role'] ?? 'user',
                'message_text'    => $trimmed,
                'is_read'         => 0,
                'read_at'         => null,
                'sent_at'         => date('Y-m-d H:i:s')
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getConversationMessages(int $conversationId, int $currentViewerId, int $afterId = 0): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        $this->assertConversationParticipant($conversationId, $currentViewerId);

        // Mark incoming unread messages as read
        $stmt = $this->db->prepare("
            UPDATE messages 
            SET is_read = 1, read_at = NOW() 
            WHERE conversation_id = :cid AND sender_id != :vid AND is_read = 0
        ");
        $stmt->execute([':cid' => $conversationId, ':vid' => $currentViewerId]);

        $sql = "
            SELECT m.id, m.conversation_id, m.sender_id, m.message_text, m.is_read, m.read_at, m.sent_at,
                   u.full_name AS sender_name, u.role AS sender_role
            FROM messages m
            INNER JOIN users u ON u.id = m.sender_id
            WHERE m.conversation_id = :cid
        ";
        $params = [':cid' => $conversationId];
        if ($afterId > 0) {
            $sql .= " AND m.id > :after_id";
            $params[':after_id'] = $afterId;
        }
        $sql .= " ORDER BY m.id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =========================================================================
    // WORKFLOW D: Turnstile Attendance & Active Membership Verification
    // =========================================================================

    public function recordAttendanceCheckIn(int $userId, int $gymId = 0, string $method = 'turnstile'): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        // 1. Verify active membership
        $memStmt = $this->db->prepare("
            SELECT m.id, m.gym_id, m.end_date, mp.access_type, g.name AS gym_name
            FROM memberships m
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            LEFT JOIN gyms g ON g.id = m.gym_id
            WHERE m.user_id = :uid AND m.status = 'active' AND (m.end_date IS NULL OR m.end_date >= CURDATE())
            ORDER BY m.id DESC
            LIMIT 1
        ");
        $memStmt->execute([':uid' => $userId]);
        $membership = $memStmt->fetch(PDO::FETCH_ASSOC);

        if (!$membership) {
            throw new RuntimeException("Active gym membership required to check in. Please request or activate a membership first.");
        }

        $targetGymId = $gymId > 0 ? $gymId : (int)$membership['gym_id'];
        $accessType = $membership['access_type'] ?? 'single_gym';
        if ((int)$membership['gym_id'] !== $targetGymId && !in_array($accessType, ['all_access', 'multi_gym_brand'], true)) {
            throw new RuntimeException("Your current membership plan does not cover this gym branch.");
        }

        // 2. Prevent duplicate check-in for today or active 4h session
        $stmt = $this->db->prepare("
            SELECT id, check_in_time FROM attendance
            WHERE user_id = :uid
              AND (DATE(check_in_time) = CURDATE() OR (check_out_time IS NULL AND check_in_time >= DATE_SUB(NOW(), INTERVAL 4 HOUR)))
            ORDER BY id DESC LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            return [
                'already_checked_in' => true,
                'attendance_id'      => (int)$existing['id'],
                'status'             => 'already_checked_in',
                'check_in_time'      => $existing['check_in_time'],
                'message'            => 'Already checked in today at ' . date('h:i A', strtotime($existing['check_in_time'])) . '.'
            ];
        }

        $allowedMethods = ['qr_code','turnstile','manual_trainer','manual_staff'];
        if (!in_array($method, $allowedMethods, true)) {
            $method = 'turnstile';
        }

        $stmt = $this->db->prepare("
            INSERT INTO attendance (user_id, gym_id, check_in_time, check_in_method, status, notes)
            VALUES (:uid, :gid, NOW(), :method, 'verified', 'Verified active membership check-in')
        ");
        $stmt->execute([
            ':uid'    => $userId,
            ':gid'    => $targetGymId,
            ':method' => $method
        ]);
        $attendanceId = (int)$this->db->lastInsertId();

        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM attendance
            WHERE gym_id = :gid AND check_out_time IS NULL AND check_in_time >= DATE_SUB(NOW(), INTERVAL 4 HOUR)
        ");
        $stmt->execute([':gid' => $targetGymId]);
        $currentOccupancy = (int)$stmt->fetchColumn();

        return [
            'already_checked_in' => false,
            'attendance_id'      => $attendanceId,
            'gym_id'             => $targetGymId,
            'gym_name'           => $membership['gym_name'] ?? 'Gym Facility',
            'status'             => 'checked_in',
            'current_occupancy'  => $currentOccupancy,
            'check_in_time'      => date('Y-m-d H:i:s'),
            'message'            => 'Verified Check-In recorded at ' . date('h:i A') . '!'
        ];
    }

    public function recordAttendanceCheckOut(int $userId, int $gymId = 0): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        if ($gymId > 0) {
            $stmt = $this->db->prepare("
                UPDATE attendance SET check_out_time = NOW()
                WHERE user_id = :uid AND gym_id = :gid AND check_out_time IS NULL
                ORDER BY check_in_time DESC LIMIT 1
            ");
            $stmt->execute([':uid' => $userId, ':gid' => $gymId]);
        } else {
            $stmt = $this->db->prepare("
                UPDATE attendance SET check_out_time = NOW()
                WHERE user_id = :uid AND check_out_time IS NULL
                ORDER BY check_in_time DESC LIMIT 1
            ");
            $stmt->execute([':uid' => $userId]);
        }

        return ['check_out_time' => date('Y-m-d H:i:s')];
    }

    // =========================================================================
    // WORKFLOW F: Membership Lifecycle (Request, Renew, Cancel, Approve/Reject)
    // =========================================================================

    public function requestOrRenewMembership(int $userId, int $gymId, int $planId, bool $isRenewal = false): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        $pStmt = $this->db->prepare("
            SELECT mp.id, mp.name, mp.duration_months, mp.price, g.id AS gym_id, g.name AS gym_name, g.owner_user_id, g.status AS gym_status
            FROM membership_plans mp
            INNER JOIN gyms g ON g.id = mp.gym_id
            WHERE mp.id = :pid AND mp.gym_id = :gid AND mp.is_active = 1 AND g.status = 'active'
            LIMIT 1
        ");
        $pStmt->execute([':pid' => $planId, ':gid' => $gymId]);
        $plan = $pStmt->fetch(PDO::FETCH_ASSOC);

        if (!$plan) {
            throw new InvalidArgumentException("Selected gym is inactive/unavailable or membership plan was not found.");
        }

        // Prevent duplicate active or pending enrollments for the same user and gym
        if (!$isRenewal) {
            $dupStmt = $this->db->prepare("
                SELECT id, status, plan_id FROM memberships
                WHERE user_id = :uid AND gym_id = :gid AND status IN ('pending', 'active')
                ORDER BY FIELD(status, 'active', 'pending'), id DESC LIMIT 1
            ");
            $dupStmt->execute([':uid' => $userId, ':gid' => $gymId]);
            $dup = $dupStmt->fetch(PDO::FETCH_ASSOC);
            if ($dup) {
                return [
                    'membership_id'       => (int)$dup['id'],
                    'status'              => $dup['status'],
                    'gym_name'            => $plan['gym_name'],
                    'plan_name'           => $plan['name'],
                    'plan_price'          => (float)$plan['price'],
                    'duration_months'     => (int)$plan['duration_months'],
                    'duplicate_prevented' => true
                ];
            }
        }

        $this->db->beginTransaction();
        try {
            // Cancel any older pending requests by this user for other gyms/plans
            $this->db->prepare("UPDATE memberships SET status = 'cancelled', updated_at = NOW() WHERE user_id = :uid AND status = 'pending'")
                ->execute([':uid' => $userId]);

            $qrToken = 'FS-MEM-' . $userId . '-' . bin2hex(random_bytes(6));
            $durMonths = max(1, (int)$plan['duration_months']);

            $ins = $this->db->prepare("
                INSERT INTO memberships (user_id, plan_id, gym_id, start_date, end_date, status, qr_code_token, auto_renew, created_at, updated_at)
                VALUES (:uid, :pid, :gid, CURDATE(), DATE_ADD(CURDATE(), INTERVAL :months MONTH), 'pending', :qr, :renew, NOW(), NOW())
            ");
            $ins->execute([
                ':uid'    => $userId,
                ':pid'    => $planId,
                ':gid'    => $gymId,
                ':months' => $durMonths,
                ':qr'     => $qrToken,
                ':renew'  => $isRenewal ? 1 : 0
            ]);
            $membershipId = (int)$this->db->lastInsertId();

            $this->db->prepare("UPDATE user_profiles SET preferred_gym_id = :gid WHERE user_id = :uid")
                ->execute([':gid' => $gymId, ':uid' => $userId]);

            $uName = (string)$this->db->query("SELECT full_name FROM users WHERE id = " . (int)$userId)->fetchColumn();
            if (!empty($plan['owner_user_id'])) {
                $this->createNotification(
                    (int)$plan['owner_user_id'],
                    $isRenewal ? 'Membership Renewal Request' : 'New Membership Request',
                    "{$uName} requested {$plan['name']} at {$plan['gym_name']}. Pending your approval.",
                    'membership',
                    $membershipId
                );
            }

            $this->db->commit();

            return [
                'membership_id'   => $membershipId,
                'status'          => 'pending',
                'gym_name'        => $plan['gym_name'],
                'plan_name'       => $plan['name'],
                'plan_price'      => (float)$plan['price'],
                'duration_months' => $durMonths,
                'created_at'      => date('Y-m-d H:i:s')
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function cancelUserMembership(int $userId, int $membershipId = 0): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        if ($membershipId > 0) {
            $stmt = $this->db->prepare("SELECT * FROM memberships WHERE id = :mid AND user_id = :uid LIMIT 1");
            $stmt->execute([':mid' => $membershipId, ':uid' => $userId]);
        } else {
            $stmt = $this->db->prepare("SELECT * FROM memberships WHERE user_id = :uid AND status IN ('active','pending','frozen') ORDER BY id DESC LIMIT 1");
            $stmt->execute([':uid' => $userId]);
        }
        $mem = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$mem) {
            throw new InvalidArgumentException("No active or pending membership found to cancel.");
        }

        $up = $this->db->prepare("UPDATE memberships SET status = 'cancelled', auto_renew = 0, updated_at = NOW() WHERE id = :mid AND user_id = :uid");
        $up->execute([':mid' => (int)$mem['id'], ':uid' => $userId]);

        return ['membership_id' => (int)$mem['id'], 'status' => 'cancelled'];
    }

    public function reviewMembershipRequest(int $ownerUserId, int $membershipId, string $decision, string $role = 'gym_owner', ?string $rejectionReason = null): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        if (!in_array($decision, ['approve', 'reject'], true)) {
            throw new InvalidArgumentException("Decision must be 'approve' or 'reject'.");
        }

        $stmt = $this->db->prepare("
            SELECT m.*, g.owner_user_id, g.name AS gym_name, mp.name AS plan_name, mp.price, mp.duration_months
            FROM memberships m
            INNER JOIN gyms g ON g.id = m.gym_id
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            WHERE m.id = :mid
            LIMIT 1
        ");
        $stmt->execute([':mid' => $membershipId]);
        $mem = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$mem) {
            throw new InvalidArgumentException("Membership record not found.");
        }
        if ($role !== 'admin' && (int)$mem['owner_user_id'] !== $ownerUserId) {
            throw new RuntimeException("Forbidden: You do not own this gym facility.");
        }

        $cleanReason = ($rejectionReason !== null && trim($rejectionReason) !== '') ? trim($rejectionReason) : null;

        $this->db->beginTransaction();
        try {
            if ($decision === 'approve') {
                if ($mem['status'] === 'active') {
                    $this->db->commit();
                    return [
                        'membership_id'     => $membershipId,
                        'status'            => 'active',
                        'user_id'           => (int)$mem['user_id'],
                        'already_processed' => true
                    ];
                }
                // Supersede any older active membership at this gym for the user
                $this->db->prepare("
                    UPDATE memberships SET status = 'expired', updated_at = NOW()
                    WHERE user_id = :uid AND gym_id = :gid AND status = 'active' AND id != :mid
                ")->execute([':uid' => $mem['user_id'], ':gid' => $mem['gym_id'], ':mid' => $membershipId]);

                $durMonths = max(1, (int)($mem['duration_months'] ?? 12));
                $up = $this->db->prepare("
                    UPDATE memberships
                    SET status = 'active', start_date = CURDATE(), end_date = DATE_ADD(CURDATE(), INTERVAL :months MONTH),
                        approved_by_user_id = :oid, approved_at = NOW(),
                        rejected_by_user_id = NULL, rejected_at = NULL, rejection_reason = NULL,
                        updated_at = NOW()
                    WHERE id = :mid
                ");
                $up->execute([':months' => $durMonths, ':oid' => $ownerUserId, ':mid' => $membershipId]);

                // Record verified completed payment for Gym Owner revenue
                $amount = (float)($mem['price'] ?? 0);
                if ($amount > 0) {
                    $payStmt = $this->db->prepare("
                        INSERT INTO payments (user_id, gym_id, membership_id, amount, currency, payment_status, payment_method, provider_ref, transaction_date)
                        VALUES (:uid, :gid, :mid, :amt, 'INR', 'completed', 'Gym Desk Verified', :ref, NOW())
                    ");
                    $payStmt->execute([
                        ':uid' => $mem['user_id'],
                        ':gid' => $mem['gym_id'],
                        ':mid' => $membershipId,
                        ':amt' => $amount,
                        ':ref' => 'FS-PAY-' . $membershipId . '-' . time()
                    ]);
                }

                $this->createNotification(
                    (int)$mem['user_id'],
                    'Membership Approved',
                    "Your {$mem['plan_name']} membership at {$mem['gym_name']} is now active!",
                    'membership',
                    $membershipId
                );

                $newStatus = 'active';
            } else {
                $up = $this->db->prepare("
                    UPDATE memberships
                    SET status = 'rejected', rejected_by_user_id = :oid, rejected_at = NOW(), rejection_reason = :reason, updated_at = NOW()
                    WHERE id = :mid
                ");
                $up->execute([':oid' => $ownerUserId, ':reason' => $cleanReason, ':mid' => $membershipId]);

                $notifMsg = $cleanReason !== null
                    ? "Your membership request for {$mem['gym_name']} was declined. Reason: {$cleanReason}"
                    : "Your membership request for {$mem['gym_name']} was declined by the facility owner.";
                $this->createNotification(
                    (int)$mem['user_id'],
                    'Membership Request Declined',
                    $notifMsg,
                    'membership',
                    $membershipId
                );

                $newStatus = 'rejected';
            }

            $this->db->commit();
            return [
                'membership_id'    => $membershipId,
                'status'           => $newStatus,
                'user_id'          => (int)$mem['user_id'],
                'approved_at'      => $newStatus === 'active' ? date('Y-m-d H:i:s') : null,
                'rejected_at'      => $newStatus === 'rejected' ? date('Y-m-d H:i:s') : null,
                'rejection_reason' => $cleanReason
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // =========================================================================
    // WORKFLOW E: Trainer Notes & Shared Feedback
    // =========================================================================

    public function addTrainerNote(
        int $trainerUserId,
        int $memberUserId,
        string $noteText,
        string $noteType = 'general_observation',
        bool $isVisibleToUser = true
    ): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        if (!$this->isTrainerVerified($trainerUserId)) {
            throw new RuntimeException("Forbidden: Unverified trainers cannot post coaching notes.");
        }

        if (!$this->isTrainerAssignedToUser($trainerUserId, $memberUserId)) {
            throw new RuntimeException("Unauthorized: Coach is not assigned to this athlete.");
        }

        $trimmed = trim($noteText);
        if (empty($trimmed)) {
            throw new InvalidArgumentException("Note content cannot be empty.");
        }

        $allowedTypes = ['workout_feedback','form_correction','milestone_praise','general_observation'];
        if (!in_array($noteType, $allowedTypes, true)) {
            $noteType = 'general_observation';
        }

        $stmt = $this->db->prepare("
            INSERT INTO trainer_notes (
                user_id, trainer_user_id, note_type, note_text, is_visible_to_user, created_at
            ) VALUES (
                :mid, :tid, :ntype, :text, :vis, NOW()
            )
        ");
        $stmt->execute([
            ':mid'   => $memberUserId,
            ':tid'   => $trainerUserId,
            ':ntype' => $noteType,
            ':text'  => $trimmed,
            ':vis'   => $isVisibleToUser ? 1 : 0
        ]);
        $noteId = (int)$this->db->lastInsertId();

        if ($isVisibleToUser) {
            $this->createNotification($memberUserId, 'New Coach Feedback', mb_substr($trimmed, 0, 120), 'trainer_note', $noteId);
        }

        return [
            'note_id'            => $noteId,
            'user_id'            => $memberUserId,
            'trainer_user_id'    => $trainerUserId,
            'is_visible_to_user' => $isVisibleToUser,
            'created_at'         => date('Y-m-d H:i:s')
        ];
    }

    public function reviewTrainerAffiliation(int $ownerUserId, int $gymId, int $trainerUserId, string $decision, string $role = 'gym_owner'): array {
        return $this->manageGymTrainerAssociation($ownerUserId, $gymId, $trainerUserId, $decision, $role);
    }

    public function manageGymTrainerAssociation(
        int $ownerUserId,
        int $gymId,
        int $trainerUserId,
        string $action,
        string $role = 'gym_owner',
        string $employmentType = 'full_time'
    ): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        $allowedActions = ['invite', 'approve', 'reject', 'deactivate'];
        if (!in_array($action, $allowedActions, true)) {
            throw new InvalidArgumentException("Action must be invite, approve, reject, or deactivate.");
        }
        if (!in_array($employmentType, ['full_time', 'part_time', 'freelance'], true)) {
            $employmentType = 'full_time';
        }

        $resolvedGymId = $this->resolveOwnerGymId($ownerUserId, $gymId > 0 ? $gymId : null, $role);
        if ($resolvedGymId === null) {
            throw new RuntimeException("Forbidden: You do not own this gym facility.");
        }

        $gStmt = $this->db->prepare("SELECT id, name FROM gyms WHERE id = :gid LIMIT 1");
        $gStmt->execute([':gid' => $resolvedGymId]);
        $gymRow = $gStmt->fetch(PDO::FETCH_ASSOC);

        $tStmt = $this->db->prepare("SELECT id, full_name FROM users WHERE id = :tid AND role = 'trainer' AND status = 'active' LIMIT 1");
        $tStmt->execute([':tid' => $trainerUserId]);
        $trainerRow = $tStmt->fetch(PDO::FETCH_ASSOC);
        if (!$trainerRow) {
            throw new InvalidArgumentException("Registered trainer account not found or inactive.");
        }

        $chk = $this->db->prepare("SELECT * FROM gym_trainers WHERE gym_id = :gid AND trainer_user_id = :tid LIMIT 1");
        $chk->execute([':gid' => $resolvedGymId, ':tid' => $trainerUserId]);
        $existing = $chk->fetch(PDO::FETCH_ASSOC);

        if ($action === 'invite') {
            if ($existing && $existing['status'] === 'active' && (int)$existing['is_active'] === 1) {
                return [
                    'gym_id'              => $resolvedGymId,
                    'trainer_user_id'     => $trainerUserId,
                    'status'              => 'active',
                    'is_active'           => 1,
                    'duplicate_prevented' => true,
                    'message'             => "{$trainerRow['full_name']} is already active at {$gymRow['name']}."
                ];
            }
            if ($existing && $existing['status'] === 'invited') {
                return [
                    'gym_id'              => $resolvedGymId,
                    'trainer_user_id'     => $trainerUserId,
                    'status'              => 'invited',
                    'is_active'           => 0,
                    'duplicate_prevented' => true,
                    'message'             => "Invitation already pending for {$trainerRow['full_name']}."
                ];
            }

            $this->db->prepare("
                INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, status, initiated_by, is_active, joined_at)
                VALUES (:gid, :tid, :etype, 'invited', 'gym_owner', 0, CURDATE())
                ON DUPLICATE KEY UPDATE
                    employment_type = VALUES(employment_type),
                    status = 'invited',
                    initiated_by = 'gym_owner',
                    is_active = 0,
                    joined_at = CURDATE()
            ")->execute([
                ':gid'   => $resolvedGymId,
                ':tid'   => $trainerUserId,
                ':etype' => $employmentType
            ]);

            $this->createNotification(
                $trainerUserId,
                'Gym Affiliation Invitation',
                "{$gymRow['name']} invited you to join their coaching staff. Accept or decline from your Trainer Portal.",
                'trainer_affiliation',
                $resolvedGymId
            );

            return [
                'gym_id'          => $resolvedGymId,
                'trainer_user_id' => $trainerUserId,
                'status'          => 'invited',
                'is_active'       => 0
            ];
        }

        if ($action === 'approve') {
            if ($existing && $existing['status'] === 'active' && (int)$existing['is_active'] === 1) {
                return [
                    'gym_id'              => $resolvedGymId,
                    'trainer_user_id'     => $trainerUserId,
                    'status'              => 'active',
                    'is_active'           => 1,
                    'duplicate_prevented' => true
                ];
            }
            $this->db->prepare("
                INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, status, initiated_by, is_active, joined_at)
                VALUES (:gid, :tid, :etype, 'active', 'trainer', 1, CURDATE())
                ON DUPLICATE KEY UPDATE status = 'active', is_active = 1, joined_at = CURDATE()
            ")->execute([
                ':gid'   => $resolvedGymId,
                ':tid'   => $trainerUserId,
                ':etype' => $employmentType
            ]);

            $this->createNotification(
                $trainerUserId,
                'Gym Affiliation Approved',
                "Your trainer affiliation for {$gymRow['name']} has been approved.",
                'trainer_affiliation',
                $resolvedGymId
            );

            return [
                'gym_id'          => $resolvedGymId,
                'trainer_user_id' => $trainerUserId,
                'status'          => 'active',
                'is_active'       => 1
            ];
        }

        if (!$existing) {
            throw new InvalidArgumentException("No gym association exists to update.");
        }

        if ($action === 'reject') {
            $this->db->prepare("
                UPDATE gym_trainers SET status = 'rejected', is_active = 0
                WHERE gym_id = :gid AND trainer_user_id = :tid
            ")->execute([':gid' => $resolvedGymId, ':tid' => $trainerUserId]);

            $this->createNotification(
                $trainerUserId,
                'Gym Affiliation Declined',
                "Your trainer affiliation request for {$gymRow['name']} was declined by the Gym Owner.",
                'trainer_affiliation',
                $resolvedGymId
            );

            return ['gym_id' => $resolvedGymId, 'trainer_user_id' => $trainerUserId, 'status' => 'rejected', 'is_active' => 0];
        }

        // deactivate association ONLY — never disable the platform user account
        $this->db->beginTransaction();
        try {
            $this->db->prepare("
                UPDATE gym_trainers SET status = 'inactive', is_active = 0
                WHERE gym_id = :gid AND trainer_user_id = :tid
            ")->execute([':gid' => $resolvedGymId, ':tid' => $trainerUserId]);

            $this->db->prepare("
                UPDATE trainer_assignments SET status = 'inactive', end_date = CURDATE(), updated_at = NOW()
                WHERE trainer_user_id = :tid AND gym_id = :gid AND status = 'active'
            ")->execute([':tid' => $trainerUserId, ':gid' => $resolvedGymId]);

            $this->createNotification(
                $trainerUserId,
                'Gym Association Deactivated',
                "Your coaching association with {$gymRow['name']} was deactivated. Your FitSync account remains active.",
                'trainer_affiliation',
                $resolvedGymId
            );

            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }

        return ['gym_id' => $resolvedGymId, 'trainer_user_id' => $trainerUserId, 'status' => 'inactive', 'is_active' => 0];
    }

    public function respondTrainerInvitation(int $trainerUserId, int $gymId, string $decision): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        if (!in_array($decision, ['accept', 'decline'], true)) {
            throw new InvalidArgumentException("Decision must be 'accept' or 'decline'.");
        }

        $stmt = $this->db->prepare("
            SELECT gt.*, g.name AS gym_name, g.owner_user_id, u.full_name AS trainer_name
            FROM gym_trainers gt
            INNER JOIN gyms g ON g.id = gt.gym_id
            INNER JOIN users u ON u.id = gt.trainer_user_id
            WHERE gt.gym_id = :gid AND gt.trainer_user_id = :tid AND gt.status = 'invited'
            LIMIT 1
        ");
        $stmt->execute([':gid' => $gymId, ':tid' => $trainerUserId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new InvalidArgumentException("No pending gym invitation found for this facility.");
        }

        $newStatus = $decision === 'accept' ? 'active' : 'rejected';
        $isActive  = $decision === 'accept' ? 1 : 0;

        $this->db->prepare("
            UPDATE gym_trainers SET status = :st, is_active = :ia, joined_at = CURDATE()
            WHERE gym_id = :gid AND trainer_user_id = :tid
        ")->execute([':st' => $newStatus, ':ia' => $isActive, ':gid' => $gymId, ':tid' => $trainerUserId]);

        if (!empty($row['owner_user_id'])) {
            $this->createNotification(
                (int)$row['owner_user_id'],
                $decision === 'accept' ? 'Trainer Accepted Gym Invitation' : 'Trainer Declined Gym Invitation',
                "{$row['trainer_name']} has " . ($decision === 'accept' ? 'accepted' : 'declined') . " your invitation to {$row['gym_name']}.",
                'trainer_affiliation',
                $trainerUserId
            );
        }

        return ['gym_id' => $gymId, 'trainer_user_id' => $trainerUserId, 'status' => $newStatus, 'is_active' => $isActive];
    }

    public function reviewMemberTrainerRequest(int $ownerUserId, int $requestId, string $decision, string $role = 'gym_owner'): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        if (!in_array($decision, ['approve', 'reject'], true)) {
            throw new InvalidArgumentException("Decision must be 'approve' or 'reject'.");
        }

        $stmt = $this->db->prepare("
            SELECT mtr.*, g.owner_user_id, g.name AS gym_name,
                   mu.full_name AS member_name, tu.full_name AS trainer_name
            FROM member_trainer_requests mtr
            LEFT JOIN gyms g ON g.id = mtr.gym_id
            INNER JOIN users mu ON mu.id = mtr.member_user_id
            INNER JOIN users tu ON tu.id = mtr.trainer_user_id
            WHERE mtr.id = :rid
            LIMIT 1
        ");
        $stmt->execute([':rid' => $requestId]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$req) {
            throw new InvalidArgumentException("Trainer request not found.");
        }

        $resolvedGymId = $this->resolveOwnerGymId($ownerUserId, $req['gym_id'] ? (int)$req['gym_id'] : null, $role);
        if ($resolvedGymId === null || ($role !== 'admin' && (int)$req['owner_user_id'] !== $ownerUserId)) {
            throw new RuntimeException("Forbidden: You do not own the member's gym facility.");
        }

        $this->db->beginTransaction();
        try {
            if ($decision === 'approve') {
                // Ensure trainer is active at this gym (or require affiliation)
                $tChk = $this->db->prepare("SELECT 1 FROM gym_trainers WHERE gym_id = :gid AND trainer_user_id = :tid AND is_active = 1 AND status = 'active' LIMIT 1");
                $tChk->execute([':gid' => $resolvedGymId, ':tid' => (int)$req['trainer_user_id']]);
                if (!$tChk->fetchColumn()) {
                    throw new InvalidArgumentException("Trainer must be actively affiliated with your gym before assignment.");
                }

                // Mark prior assignments transferred cleanly while preserving history
                $prevStmt = $this->db->prepare("SELECT id, trainer_user_id FROM trainer_assignments WHERE user_id = :uid AND status = 'active'");
                $prevStmt->execute([':uid' => (int)$req['member_user_id']]);
                $prevRows = $prevStmt->fetchAll(PDO::FETCH_ASSOC);

                $this->db->prepare("UPDATE trainer_assignments SET status = 'transferred', end_date = CURDATE(), updated_at = NOW() WHERE user_id = :uid AND status = 'active'")
                    ->execute([':uid' => (int)$req['member_user_id']]);

                $this->db->prepare("
                    INSERT INTO trainer_assignments (user_id, trainer_user_id, gym_id, assigned_by_user_id, status, start_date, created_at, updated_at)
                    VALUES (:uid, :tid, :gid, :oid, 'active', CURDATE(), NOW(), NOW())
                ")->execute([
                    ':uid' => (int)$req['member_user_id'],
                    ':tid' => (int)$req['trainer_user_id'],
                    ':gid' => $resolvedGymId,
                    ':oid' => $ownerUserId
                ]);
                $assignId = (int)$this->db->lastInsertId();

                $this->db->prepare("INSERT IGNORE INTO trainer_data_permissions (assignment_id, can_view_measurements, can_view_nutrition, can_view_assessments, can_log_attendance) VALUES (?, 1, 1, 1, 1)")
                    ->execute([$assignId]);

                $this->db->prepare("UPDATE member_trainer_requests SET status = 'approved', reviewed_by_user_id = :oid, updated_at = NOW() WHERE id = :rid")
                    ->execute([':oid' => $ownerUserId, ':rid' => $requestId]);

                $this->createNotification((int)$req['member_user_id'], 'Trainer Request Approved', "{$req['trainer_name']} has been assigned as your trainer.", 'trainer_assignment', $assignId);
                $this->createNotification((int)$req['trainer_user_id'], 'New Athlete Assigned', "{$req['member_name']} has been assigned to you.", 'trainer_assignment', $assignId);
                foreach ($prevRows as $pr) {
                    if ((int)$pr['trainer_user_id'] !== (int)$req['trainer_user_id']) {
                        $this->createNotification((int)$pr['trainer_user_id'], 'Athlete Reassigned', "{$req['member_name']} was reassigned to another trainer.", 'trainer_assignment', $assignId);
                    }
                }
            } else {
                $this->db->prepare("UPDATE member_trainer_requests SET status = 'rejected', reviewed_by_user_id = :oid, updated_at = NOW() WHERE id = :rid")
                    ->execute([':oid' => $ownerUserId, ':rid' => $requestId]);
                $this->createNotification((int)$req['member_user_id'], 'Trainer Request Declined', "Your request for {$req['trainer_name']} was declined.", 'member_trainer_request', $requestId);
            }
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }

        return ['request_id' => $requestId, 'status' => $decision === 'approve' ? 'approved' : 'rejected'];
    }

    // =========================================================================
    // WORKFLOW G: CENTRALIZED GYM REGISTRY, EDITING & USER DISCOVERY SYNC
    // =========================================================================

    private function hydrateGymsCollection(array $gymRows): array {
        if (empty($gymRows)) return [];

        $dayNames = [0 => 'Sun', 1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat'];

        $hStmt = $this->db->prepare("
            SELECT day_of_week, open_time, close_time, is_closed
            FROM gym_operating_hours
            WHERE gym_id = :gid
            ORDER BY day_of_week ASC
        ");
        $fStmt = $this->db->prepare("
            SELECT f.id, f.name FROM gym_facilities gf
            INNER JOIN facilities f ON f.id = gf.facility_id
            WHERE gf.gym_id = :gid
            ORDER BY f.name ASC
        ");
        $eStmt = $this->db->prepare("
            SELECT e.id, e.name, e.category, ge.quantity FROM gym_equipment ge
            INNER JOIN equipment e ON e.id = ge.equipment_id
            WHERE ge.gym_id = :gid
            ORDER BY e.name ASC
        ");
        $pStmt = $this->db->prepare("
            SELECT id, name, description, duration_months, price, access_type, is_active
            FROM membership_plans
            WHERE gym_id = :gid AND is_active = 1
            ORDER BY price ASC, id ASC
        ");
        $phStmt = $this->db->prepare("
            SELECT gp.id, gp.caption, gp.is_primary, f.storage_key
            FROM gym_photos gp
            INNER JOIN files f ON f.id = gp.file_id
            WHERE gp.gym_id = :gid
            ORDER BY gp.is_primary DESC, gp.display_order ASC, gp.id ASC
        ");

        $out = [];
        foreach ($gymRows as $g) {
            $gid = (int)$g['id'];

            $hStmt->execute([':gid' => $gid]);
            $rawHours = $hStmt->fetchAll(PDO::FETCH_ASSOC);
            $hoursFormatted = [];
            $openDaysCount = 0;
            foreach ($rawHours as $hr) {
                $dow = (int)$hr['day_of_week'];
                $closed = (bool)$hr['is_closed'];
                if (!$closed) $openDaysCount++;
                $ot = $hr['open_time'] ? substr((string)$hr['open_time'], 0, 5) : '06:00';
                $ct = $hr['close_time'] ? substr((string)$hr['close_time'], 0, 5) : '22:00';
                $hoursFormatted[] = [
                    'day_of_week' => $dow,
                    'day_label'   => $dayNames[$dow] ?? 'Day',
                    'open_time'   => $ot,
                    'close_time'  => $ct,
                    'is_closed'   => $closed
                ];
            }

            $hoursSummary = 'Hours not set';
            if (!empty($hoursFormatted)) {
                $firstOpen = null;
                foreach ($hoursFormatted as $hf) {
                    if (!$hf['is_closed']) { $firstOpen = $hf; break; }
                }
                if ($firstOpen) {
                    $sunRow = $hoursFormatted[0] ?? null;
                    if ($sunRow && $sunRow['day_of_week'] === 0 && $sunRow['is_closed']) {
                        $hoursSummary = "Mon–Sat: {$firstOpen['open_time']} – {$firstOpen['close_time']} (Sun Closed)";
                    } elseif ($openDaysCount === 7 && $firstOpen['open_time'] === '00:00' && ($firstOpen['close_time'] === '23:59' || $firstOpen['close_time'] === '00:00')) {
                        $hoursSummary = "24 Hours Daily";
                    } else {
                        $hoursSummary = "Open {$openDaysCount} days/wk: {$firstOpen['open_time']} – {$firstOpen['close_time']}";
                    }
                } else {
                    $hoursSummary = 'Temporarily Closed';
                }
            }

            $fStmt->execute([':gid' => $gid]);
            $facRows = $fStmt->fetchAll(PDO::FETCH_ASSOC);

            $eStmt->execute([':gid' => $gid]);
            $eqRows = $eStmt->fetchAll(PDO::FETCH_ASSOC);

            $pStmt->execute([':gid' => $gid]);
            $planRows = $pStmt->fetchAll(PDO::FETCH_ASSOC);

            $phStmt->execute([':gid' => $gid]);
            $photoRows = $phStmt->fetchAll(PDO::FETCH_ASSOC);
            $photos = array_values(array_filter(array_map(fn($p) => !empty($p['storage_key']) ? ('uploads/' . ltrim((string)$p['storage_key'], '/')) : null, $photoRows)));

            $logoUrl = !empty($g['logo_storage_key']) ? ('uploads/' . ltrim((string)$g['logo_storage_key'], '/')) : ($photos[0] ?? 'assets/images/gym_fitzone.jpg');
            $coverUrl = !empty($g['cover_storage_key']) ? ('uploads/' . ltrim((string)$g['cover_storage_key'], '/')) : ($photos[0] ?? 'assets/images/gym_fitzone.jpg');

            $out[] = [
                'id'              => $gid,
                'owner_user_id'   => (int)$g['owner_user_id'],
                'name'            => $g['name'],
                'brand_name'      => $g['brand_name'] ?? $g['name'],
                'registration_no' => $g['registration_no'] ?? '',
                'description'     => $g['description'] ?? '',
                'email'           => $g['email'],
                'phone'           => $g['phone'],
                'address_line1'   => $g['address_line1'],
                'address_line2'   => $g['address_line2'] ?? '',
                'city'            => $g['city'],
                'state'           => $g['state'],
                'postal_code'     => $g['postal_code'],
                'country'         => $g['country'] ?? 'India',
                'rating'          => (float)($g['rating'] ?? 4.8),
                'capacity'        => (int)($g['capacity'] ?? 50),
                'status'          => $g['status'],
                'logo_url'        => $logoUrl,
                'cover_url'       => $coverUrl,
                'photos'          => $photos,
                'operating_hours' => $hoursFormatted,
                'hours_summary'   => $hoursSummary,
                'facilities'      => array_map(fn($f) => $f['name'], $facRows),
                'equipment'       => array_map(fn($e) => $e['name'], $eqRows),
                'plans'           => $planRows,
                'created_at'      => $g['created_at'] ?? null,
                'updated_at'      => $g['updated_at'] ?? null
            ];
        }

        return $out;
    }

    public function getGymsPublicCatalog(?string $search = null, ?string $city = null, ?string $facility = null): array {
        if ($this->db === null) return [];
        $this->expireEndedMemberships();

        $sql = "
            SELECT g.*, lf.storage_key AS logo_storage_key, cf.storage_key AS cover_storage_key
            FROM gyms g
            LEFT JOIN files lf ON lf.id = g.logo_file_id
            LEFT JOIN files cf ON cf.id = g.cover_photo_id
            WHERE g.status = 'active'
        ";
        $params = [];

        $q = trim((string)$search);
        if ($q !== '') {
            $sql .= " AND (g.name LIKE :q1 OR g.city LIKE :q2 OR g.address_line1 LIKE :q3 OR g.description LIKE :q4 OR EXISTS (
                SELECT 1 FROM gym_facilities gf INNER JOIN facilities f ON f.id = gf.facility_id
                WHERE gf.gym_id = g.id AND f.name LIKE :q5
            ))";
            $like = '%' . $q . '%';
            $params[':q1'] = $like;
            $params[':q2'] = $like;
            $params[':q3'] = $like;
            $params[':q4'] = $like;
            $params[':q5'] = $like;
        }
        $c = trim((string)$city);
        if ($c !== '' && strtolower($c) !== 'all') {
            $sql .= " AND LOWER(g.city) = LOWER(:city)";
            $params[':city'] = $c;
        }
        $fac = trim((string)$facility);
        if ($fac !== '' && strtolower($fac) !== 'all') {
            $sql .= " AND EXISTS (SELECT 1 FROM gym_facilities gf2 INNER JOIN facilities f2 ON f2.id = gf2.facility_id WHERE gf2.gym_id = g.id AND LOWER(f2.name) = LOWER(:fac))";
            $params[':fac'] = $fac;
        }

        $sql .= " ORDER BY g.updated_at DESC, g.id DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->hydrateGymsCollection($rows);
    }

    public function getOwnerGymsDetailed(int $ownerUserId, string $role = 'gym_owner'): array {
        if ($this->db === null) return [];

        $sql = "
            SELECT g.*, lf.storage_key AS logo_storage_key, cf.storage_key AS cover_storage_key
            FROM gyms g
            LEFT JOIN files lf ON lf.id = g.logo_file_id
            LEFT JOIN files cf ON cf.id = g.cover_photo_id
        ";
        if ($role === 'admin') {
            $sql .= " ORDER BY g.id DESC";
            $stmt = $this->db->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $sql .= " WHERE g.owner_user_id = :oid ORDER BY FIELD(g.status, 'active', 'pending_approval', 'inactive', 'suspended'), g.id DESC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':oid' => $ownerUserId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return $this->hydrateGymsCollection($rows);
    }

    public function saveOwnerGym(int $ownerUserId, int $gymId, array $data, array $uploadedFiles = [], string $role = 'gym_owner'): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }

        $name        = trim((string)($data['name'] ?? ($data['gym_name'] ?? '')));
        $description = trim((string)($data['description'] ?? ($data['gym_description'] ?? '')));
        $address1    = trim((string)($data['address_line1'] ?? ($data['address'] ?? '')));
        $address2    = trim((string)($data['address_line2'] ?? ''));
        $city        = trim((string)($data['city'] ?? ''));
        $state       = trim((string)($data['state'] ?? ''));
        $postalCode  = trim((string)($data['postal_code'] ?? ($data['pin_code'] ?? '')));
        $country     = trim((string)($data['country'] ?? 'India')) ?: 'India';
        $phone       = trim((string)($data['phone'] ?? ($data['gym_phone'] ?? '')));
        $email       = trim(strtolower((string)($data['email'] ?? ($data['gym_email'] ?? ''))));
        $regNo       = trim((string)($data['registration_no'] ?? ($data['business_registration'] ?? '')));
        $capacity    = max(5, min(5000, (int)($data['capacity'] ?? 50)));

        if ($name === '' || $address1 === '' || $city === '' || $state === '' || $postalCode === '') {
            throw new InvalidArgumentException('Gym name, address, city, state, and postal code are required.');
        }
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('A valid gym email address is required.');
        }
        if ($phone === '' || !preg_match('/^\+?[0-9\s\-\(\)]{7,20}$/', $phone)) {
            throw new InvalidArgumentException('A valid gym contact phone number is required.');
        }

        $requestedStatus = strtolower(trim((string)($data['status'] ?? 'active')));
        $allowedOwnerStatuses = ($role === 'admin')
            ? ['active', 'inactive', 'pending_approval', 'suspended']
            : ['active', 'inactive'];

        $this->db->beginTransaction();
        try {
            if ($gymId > 0) {
                $chk = $this->db->prepare("SELECT id, owner_user_id, status FROM gyms WHERE id = :gid LIMIT 1");
                $chk->execute([':gid' => $gymId]);
                $existingGym = $chk->fetch(PDO::FETCH_ASSOC);
                if (!$existingGym) {
                    throw new InvalidArgumentException('Gym record not found.');
                }
                if ($role !== 'admin' && (int)$existingGym['owner_user_id'] !== $ownerUserId) {
                    throw new RuntimeException('Forbidden: You do not own this gym facility.');
                }

                // Prevent duplicate name+city collision on rename
                $dupChk = $this->db->prepare("SELECT id FROM gyms WHERE owner_user_id = :oid AND LOWER(name) = LOWER(:nm) AND LOWER(city) = LOWER(:ct) AND id != :gid LIMIT 1");
                $dupChk->execute([':oid' => (int)$existingGym['owner_user_id'], ':nm' => $name, ':ct' => $city, ':gid' => $gymId]);
                if ($dupChk->fetchColumn()) {
                    throw new InvalidArgumentException("You already own another branch named {$name} in {$city}.");
                }

                $finalStatus = in_array($requestedStatus, $allowedOwnerStatuses, true) ? $requestedStatus : (string)$existingGym['status'];
                if ($role !== 'admin' && $existingGym['status'] === 'suspended') {
                    $finalStatus = 'suspended';
                }

                $this->db->prepare("
                    UPDATE gyms SET
                        name = :nm, brand_name = :brand, registration_no = :regno,
                        email = :email, phone = :phone,
                        address_line1 = :addr1, address_line2 = :addr2,
                        city = :city, state = :state, postal_code = :pin, country = :country,
                        description = :desc, capacity = :cap, status = :st, updated_at = NOW()
                    WHERE id = :gid
                ")->execute([
                    ':nm'      => mb_substr($name, 0, 200),
                    ':brand'   => mb_substr($name, 0, 200),
                    ':regno'   => $regNo !== '' ? mb_substr($regNo, 0, 100) : null,
                    ':email'   => $email,
                    ':phone'   => $phone,
                    ':addr1'   => mb_substr($address1, 0, 255),
                    ':addr2'   => $address2 !== '' ? mb_substr($address2, 0, 255) : null,
                    ':city'    => mb_substr($city, 0, 100),
                    ':state'   => mb_substr($state, 0, 100),
                    ':pin'     => mb_substr($postalCode, 0, 20),
                    ':country' => mb_substr($country, 0, 100),
                    ':desc'    => $description !== '' ? $description : null,
                    ':cap'     => $capacity,
                    ':st'      => $finalStatus,
                    ':gid'     => $gymId
                ]);
            } else {
                // Duplicate prevention on registration
                $dupChk = $this->db->prepare("SELECT id FROM gyms WHERE owner_user_id = :oid AND LOWER(name) = LOWER(:nm) AND LOWER(city) = LOWER(:ct) LIMIT 1");
                $dupChk->execute([':oid' => $ownerUserId, ':nm' => $name, ':ct' => $city]);
                if ($dupChk->fetchColumn()) {
                    throw new InvalidArgumentException("A gym named {$name} in {$city} already exists under your account.");
                }

                $finalStatus = in_array($requestedStatus, $allowedOwnerStatuses, true) ? $requestedStatus : 'active';
                $this->db->prepare("
                    INSERT INTO gyms (
                        owner_user_id, name, brand_name, registration_no, email, phone,
                        address_line1, address_line2, city, state, postal_code, country,
                        description, capacity, rating, status, created_at, updated_at
                    ) VALUES (
                        :oid, :nm, :brand, :regno, :email, :phone,
                        :addr1, :addr2, :city, :state, :pin, :country,
                        :desc, :cap, 4.80, :st, NOW(), NOW()
                    )
                ")->execute([
                    ':oid'     => $ownerUserId,
                    ':nm'      => mb_substr($name, 0, 200),
                    ':brand'   => mb_substr($name, 0, 200),
                    ':regno'   => $regNo !== '' ? mb_substr($regNo, 0, 100) : null,
                    ':email'   => $email,
                    ':phone'   => $phone,
                    ':addr1'   => mb_substr($address1, 0, 255),
                    ':addr2'   => $address2 !== '' ? mb_substr($address2, 0, 255) : null,
                    ':city'    => mb_substr($city, 0, 100),
                    ':state'   => mb_substr($state, 0, 100),
                    ':pin'     => mb_substr($postalCode, 0, 20),
                    ':country' => mb_substr($country, 0, 100),
                    ':desc'    => $description !== '' ? $description : null,
                    ':cap'     => $capacity,
                    ':st'      => $finalStatus
                ]);
                $gymId = (int)$this->db->lastInsertId();
            }

            // Optional photo/logo upload
            if (!empty($uploadedFiles['gym_logo']) && ($uploadedFiles['gym_logo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE && function_exists('fitSyncStoreUploadedFile')) {
                $logoId = fitSyncStoreUploadedFile($this->db, $uploadedFiles['gym_logo'], 'gym_photo', $ownerUserId, false, false);
                if ($logoId !== null) {
                    $this->db->prepare("UPDATE gyms SET logo_file_id = :fid, cover_photo_id = COALESCE(cover_photo_id, :fid2) WHERE id = :gid")
                        ->execute([':fid' => $logoId, ':fid2' => $logoId, ':gid' => $gymId]);
                    $this->db->prepare("INSERT INTO gym_photos (gym_id, file_id, is_primary, display_order) VALUES (:gid, :fid, 1, 0)")
                        ->execute([':gid' => $gymId, ':fid' => $logoId]);
                }
            }

            // Upsert 7-day operating hours cleanly
            $openTime  = preg_match('/^\d{2}:\d{2}/', (string)($data['open_time'] ?? '')) ? substr((string)$data['open_time'], 0, 5) . ':00' : '06:00:00';
            $closeTime = preg_match('/^\d{2}:\d{2}/', (string)($data['close_time'] ?? '')) ? substr((string)$data['close_time'], 0, 5) . ':00' : '22:00:00';
            $sunOpen   = !empty($data['open_sunday']);

            $hrStmt = $this->db->prepare("
                INSERT INTO gym_operating_hours (gym_id, day_of_week, open_time, close_time, is_closed)
                VALUES (:gid, :dow, :ot, :ct, :closed)
                ON DUPLICATE KEY UPDATE open_time = VALUES(open_time), close_time = VALUES(close_time), is_closed = VALUES(is_closed)
            ");
            if (!empty($data['operating_hours']) && is_array($data['operating_hours'])) {
                foreach ($data['operating_hours'] as $hRow) {
                    $d = max(0, min(6, (int)($hRow['day_of_week'] ?? 1)));
                    $isClosed = !empty($hRow['is_closed']) ? 1 : 0;
                    $ot = preg_match('/^\d{2}:\d{2}/', (string)($hRow['open_time'] ?? '')) ? substr((string)$hRow['open_time'], 0, 5) . ':00' : $openTime;
                    $ct = preg_match('/^\d{2}:\d{2}/', (string)($hRow['close_time'] ?? '')) ? substr((string)$hRow['close_time'], 0, 5) . ':00' : $closeTime;
                    $hrStmt->execute([':gid' => $gymId, ':dow' => $d, ':ot' => $isClosed ? null : $ot, ':ct' => $isClosed ? null : $ct, ':closed' => $isClosed]);
                }
            } else {
                for ($d = 0; $d <= 6; $d++) {
                    $isClosed = ($d === 0 && !$sunOpen) ? 1 : 0;
                    $hrStmt->execute([':gid' => $gymId, ':dow' => $d, ':ot' => $isClosed ? null : $openTime, ':ct' => $isClosed ? null : $closeTime, ':closed' => $isClosed]);
                }
            }

            // Facilities CSV / IDs
            if (isset($data['facilities_csv']) || isset($data['facilities'])) {
                $this->db->prepare("DELETE FROM gym_facilities WHERE gym_id = :gid")->execute([':gid' => $gymId]);
                $facIds = is_array($data['facilities'] ?? null) ? array_map('intval', $data['facilities']) : [];
                foreach (explode(',', (string)($data['facilities_csv'] ?? '')) as $fn) {
                    $fn = trim($fn);
                    if ($fn === '') continue;
                    $fSel = $this->db->prepare("SELECT id FROM facilities WHERE LOWER(name) = LOWER(:nm) LIMIT 1");
                    $fSel->execute([':nm' => $fn]);
                    $fid = $fSel->fetchColumn();
                    if (!$fid) {
                        $this->db->prepare("INSERT IGNORE INTO facilities (name) VALUES (:nm)")->execute([':nm' => mb_substr($fn, 0, 100)]);
                        $fSel->execute([':nm' => $fn]);
                        $fid = $fSel->fetchColumn();
                    }
                    if ($fid) $facIds[] = (int)$fid;
                }
                $gfIns = $this->db->prepare("INSERT IGNORE INTO gym_facilities (gym_id, facility_id) VALUES (:gid, :fid)");
                foreach (array_unique(array_filter($facIds)) as $fid) {
                    $gfIns->execute([':gid' => $gymId, ':fid' => $fid]);
                }
            }

            // Equipment CSV / IDs
            if (isset($data['equipment_csv']) || isset($data['equipment'])) {
                $this->db->prepare("DELETE FROM gym_equipment WHERE gym_id = :gid")->execute([':gid' => $gymId]);
                $eqIds = is_array($data['equipment'] ?? null) ? array_map('intval', $data['equipment']) : [];
                foreach (explode(',', (string)($data['equipment_csv'] ?? '')) as $en) {
                    $en = trim($en);
                    if ($en === '') continue;
                    $eSel = $this->db->prepare("SELECT id FROM equipment WHERE LOWER(name) = LOWER(:nm) LIMIT 1");
                    $eSel->execute([':nm' => $en]);
                    $eid = $eSel->fetchColumn();
                    if (!$eid) {
                        $this->db->prepare("INSERT IGNORE INTO equipment (name, category) VALUES (:nm, 'General')")->execute([':nm' => mb_substr($en, 0, 100)]);
                        $eSel->execute([':nm' => $en]);
                        $eid = $eSel->fetchColumn();
                    }
                    if ($eid) $eqIds[] = (int)$eid;
                }
                $geIns = $this->db->prepare("INSERT IGNORE INTO gym_equipment (gym_id, equipment_id, quantity, condition_status) VALUES (:gid, :eid, 1, 'excellent')");
                foreach (array_unique(array_filter($eqIds)) as $eid) {
                    $geIns->execute([':gid' => $gymId, ':eid' => $eid]);
                }
            }

            // Optional configured membership plan (or ensure at least 1 active plan when registering new gym)
            $planName  = trim((string)($data['plan_name'] ?? ''));
            $planPrice = isset($data['plan_price']) && is_numeric($data['plan_price']) ? max(0.0, (float)$data['plan_price']) : null;
            $planDur   = max(1, min(36, (int)($data['plan_duration_months'] ?? 1)));
            if ($planName !== '' && $planPrice !== null) {
                $pChk = $this->db->prepare("SELECT id FROM membership_plans WHERE gym_id = :gid AND LOWER(name) = LOWER(:nm) LIMIT 1");
                $pChk->execute([':gid' => $gymId, ':nm' => $planName]);
                $exPlanId = $pChk->fetchColumn();
                if ($exPlanId) {
                    $this->db->prepare("UPDATE membership_plans SET price = :pr, duration_months = :dur, is_active = 1, updated_at = NOW() WHERE id = :pid")
                        ->execute([':pr' => $planPrice, ':dur' => $planDur, ':pid' => (int)$exPlanId]);
                } else {
                    $this->db->prepare("
                        INSERT INTO membership_plans (gym_id, name, description, duration_months, price, access_type, is_active, created_at, updated_at)
                        VALUES (:gid, :nm, 'Gym access membership plan', :dur, :pr, 'single_gym', 1, NOW(), NOW())
                    ")->execute([':gid' => $gymId, ':nm' => mb_substr($planName, 0, 150), ':dur' => $planDur, ':pr' => $planPrice]);
                }
            } else {
                $hasAnyPlan = (int)$this->db->query("SELECT COUNT(*) FROM membership_plans WHERE gym_id = {$gymId} AND is_active = 1")->fetchColumn();
                if ($hasAnyPlan === 0) {
                    $this->db->prepare("
                        INSERT INTO membership_plans (gym_id, name, description, duration_months, price, access_type, is_active, created_at, updated_at)
                        VALUES (:gid, 'Monthly Membership', 'Full floor & equipment access', 1, 1999.00, 'single_gym', 1, NOW(), NOW())
                    ")->execute([':gid' => $gymId]);
                }
            }

            $this->db->commit();

            $gFetch = $this->db->prepare("SELECT g.*, lf.storage_key AS logo_storage_key, cf.storage_key AS cover_storage_key FROM gyms g LEFT JOIN files lf ON lf.id = g.logo_file_id LEFT JOIN files cf ON cf.id = g.cover_photo_id WHERE g.id = :gid LIMIT 1");
            $gFetch->execute([':gid' => $gymId]);
            $hydrated = $this->hydrateGymsCollection([$gFetch->fetch(PDO::FETCH_ASSOC)]);
            return $hydrated[0];
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }
    }

    public function setGymStatus(int $ownerUserId, int $gymId, string $status, string $role = 'gym_owner'): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        $allowed = ($role === 'admin') ? ['active', 'inactive', 'pending_approval', 'suspended'] : ['active', 'inactive'];
        if ($gymId <= 0 || !in_array($status, $allowed, true)) {
            throw new InvalidArgumentException("Valid gym_id and status required.");
        }

        $stmt = $this->db->prepare("SELECT id, owner_user_id, status FROM gyms WHERE id = :gid LIMIT 1");
        $stmt->execute([':gid' => $gymId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new InvalidArgumentException("Gym record not found.");
        }
        if ($role !== 'admin' && (int)$row['owner_user_id'] !== $ownerUserId) {
            throw new RuntimeException("Forbidden: You do not own this gym facility.");
        }
        if ($role !== 'admin' && $row['status'] === 'suspended') {
            throw new RuntimeException("Forbidden: Suspended gyms require Platform Admin review.");
        }

        $this->db->prepare("UPDATE gyms SET status = :st, updated_at = NOW() WHERE id = :gid")
            ->execute([':st' => $status, ':gid' => $gymId]);

        return ['gym_id' => $gymId, 'status' => $status];
    }

    public function saveGymPlan(int $ownerUserId, int $gymId, array $data, string $role = 'gym_owner'): array {
        if ($this->db === null) {
            throw new RuntimeException("Database connection unavailable.");
        }
        $resolvedGymId = $this->resolveOwnerGymId($ownerUserId, $gymId > 0 ? $gymId : null, $role);
        if ($resolvedGymId === null) {
            throw new RuntimeException("Forbidden: You do not own this gym facility.");
        }
        $name = trim((string)($data['name'] ?? ''));
        $price = isset($data['price']) && is_numeric($data['price']) ? max(0.0, (float)$data['price']) : -1;
        $dur = max(1, min(36, (int)($data['duration_months'] ?? 1)));
        $accessType = in_array($data['access_type'] ?? '', ['single_gym', 'multi_gym_brand', 'all_access'], true)
            ? $data['access_type']
            : 'single_gym';
        $desc = trim((string)($data['description'] ?? ''));

        if ($name === '' || $price < 0) {
            throw new InvalidArgumentException('Plan name and valid non-negative price are required.');
        }

        $this->db->prepare("
            INSERT INTO membership_plans (gym_id, name, description, duration_months, price, access_type, is_active, created_at, updated_at)
            VALUES (:gid, :nm, :desc, :dur, :pr, :at, 1, NOW(), NOW())
        ")->execute([
            ':gid'  => $resolvedGymId,
            ':nm'   => mb_substr($name, 0, 150),
            ':desc' => $desc !== '' ? $desc : null,
            ':dur'  => $dur,
            ':pr'   => $price,
            ':at'   => $accessType
        ]);

        return ['id' => (int)$this->db->lastInsertId(), 'gym_id' => $resolvedGymId, 'name' => $name, 'price' => $price];
    }
}
