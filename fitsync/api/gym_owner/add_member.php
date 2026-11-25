<?php
/**
 * FitSync AI — API: Gym Owner Add / Enroll Athlete
 * Enforces gym_owner session, CSRF, gym ownership, auto-creates default plan when missing,
 * preserves unique accounts safely, and returns clear validation/domain errors.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['gym_owner', 'admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method not allowed. Use POST.', null, 405);
}

requireCsrfToken();

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$fullName          = trim((string)($input['name'] ?? ($input['full_name'] ?? '')));
$email             = trim(strtolower((string)($input['email'] ?? '')));
$phone             = trim((string)($input['phone'] ?? ($input['mobile'] ?? '')));
$genderRaw         = strtolower(trim((string)($input['gender'] ?? 'male')));
$weightRaw         = $input['weight'] ?? ($input['weight_kg'] ?? 70.0);
$weight            = is_numeric($weightRaw) ? (float)$weightRaw : 0.0;
$goal              = trim((string)($input['goal'] ?? 'General Fitness'));
$tier              = trim((string)($input['membershipTier'] ?? ($input['plan_tier'] ?? 'Standard Membership')));
$reqPlanId         = isset($input['plan_id']) && (int)$input['plan_id'] > 0 ? (int)$input['plan_id'] : 0;
$rawPassword       = (string)($input['password'] ?? '');
$assignedCoachId   = trim((string)($input['assignedCoachId'] ?? ($input['coach_id'] ?? '')));
$reqGymId          = isset($input['gym_id']) && (int)$input['gym_id'] > 0 ? (int)$input['gym_id'] : null;

if ($fullName === '' || mb_strlen($fullName) < 2) {
    apiResponse(false, 'Athlete full name is required (minimum 2 characters).', null, 400);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    apiResponse(false, 'Please provide a valid email address.', null, 400);
}
if ($phone !== '' && !preg_match('/^\+?[0-9\s\-\(\)]{7,20}$/', $phone)) {
    apiResponse(false, 'Please provide a valid phone number or leave it blank.', null, 400);
}
if ($weight < 20.0 || $weight > 350.0) {
    apiResponse(false, 'Bodyweight must be between 20 kg and 350 kg.', null, 400);
}
if ($rawPassword !== '' && strlen($rawPassword) < 6) {
    apiResponse(false, 'Initial password must be at least 6 characters when specified.', null, 400);
}

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$gymId = $service->resolveOwnerGymId((int)$authUser['id'], $reqGymId, $authUser['role']);
if ($gymId === null) {
    apiResponse(false, 'Forbidden: No gym facility owned by your account. Register a gym first.', null, 403);
}

try {
    $gymStmt = $db->prepare("SELECT id, name FROM gyms WHERE id = :gid LIMIT 1");
    $gymStmt->execute([':gid' => $gymId]);
    $gymRow = $gymStmt->fetch(PDO::FETCH_ASSOC);
    $gymName = $gymRow ? (string)$gymRow['name'] : 'FitSync Facility';

    // Check existing account by email (never create duplicate users)
    $stmt = $db->prepare("SELECT id, role, full_name, status FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingUser) {
        $existingUid = (int)$existingUser['id'];
        // Reject if already an active member of this exact gym
        $mChk = $db->prepare("SELECT id FROM memberships WHERE user_id = :uid AND gym_id = :gid AND status = 'active' LIMIT 1");
        $mChk->execute([':uid' => $existingUid, ':gid' => $gymId]);
        if ($mChk->fetchColumn()) {
            apiResponse(false, "An athlete with email {$email} is already an active member of {$gymName}.", null, 409);
        }
    }

    // Check phone uniqueness before starting write transaction
    $cleanPhone = $phone !== '' ? $phone : null;
    if ($cleanPhone !== null) {
        $pChkSql = $existingUser
            ? "SELECT id FROM users WHERE mobile = :mob AND id != :uid LIMIT 1"
            : "SELECT id FROM users WHERE mobile = :mob LIMIT 1";
        $pChk = $db->prepare($pChkSql);
        $pParams = [':mob' => $cleanPhone];
        if ($existingUser) $pParams[':uid'] = (int)$existingUser['id'];
        $pChk->execute($pParams);
        if ($pChk->fetchColumn()) {
            apiResponse(false, "Mobile number {$cleanPhone} is already registered to another FitSync account.", null, 409);
        }
    }

    // Validate selected coach belongs to this gym BEFORE mutating
    $coachUserId = (int)str_replace('tr-', '', $assignedCoachId);
    $coachName = 'Unassigned';
    if ($coachUserId > 0) {
        $cChk = $db->prepare("
            SELECT u.id, u.full_name
            FROM gym_trainers gt
            INNER JOIN users u ON u.id = gt.trainer_user_id AND u.status = 'active'
            WHERE gt.gym_id = :gid AND gt.trainer_user_id = :tid AND gt.is_active = 1 AND gt.status = 'active'
            LIMIT 1
        ");
        $cChk->execute([':gid' => $gymId, ':tid' => $coachUserId]);
        $coachRow = $cChk->fetch(PDO::FETCH_ASSOC);
        if (!$coachRow) {
            apiResponse(false, 'Selected personal trainer is not an active coach at your gym.', null, 400);
        }
        $coachName = (string)$coachRow['full_name'];
    }

    $db->beginTransaction();

    // 1. Resolve or safely create a real membership_plan for THIS gym (never fallback to hardcoded plan_id=1!)
    $planRow = null;
    if ($reqPlanId > 0) {
        $pStmt = $db->prepare("SELECT id, name, price, duration_months FROM membership_plans WHERE id = :pid AND gym_id = :gid AND is_active = 1 LIMIT 1");
        $pStmt->execute([':pid' => $reqPlanId, ':gid' => $gymId]);
        $planRow = $pStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    if (!$planRow && $tier !== '') {
        $pStmt = $db->prepare("SELECT id, name, price, duration_months FROM membership_plans WHERE gym_id = :gid AND LOWER(name) LIKE :tier AND is_active = 1 LIMIT 1");
        $pStmt->execute([':gid' => $gymId, ':tier' => '%' . strtolower($tier) . '%']);
        $planRow = $pStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    if (!$planRow) {
        $pStmt = $db->prepare("SELECT id, name, price, duration_months FROM membership_plans WHERE gym_id = :gid AND is_active = 1 ORDER BY id ASC LIMIT 1");
        $pStmt->execute([':gid' => $gymId]);
        $planRow = $pStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    if (!$planRow) {
        $planTitle = mb_substr($tier !== '' ? $tier : 'Standard Gym Membership', 0, 150);
        $insPlan = $db->prepare("
            INSERT INTO membership_plans (gym_id, name, description, duration_months, price, access_type, is_active, created_at, updated_at)
            VALUES (:gid, :nm, 'Gym desk enrollment membership plan', 1, 0.00, 'single_gym', 1, NOW(), NOW())
        ");
        $insPlan->execute([':gid' => $gymId, ':nm' => $planTitle]);
        $planRow = [
            'id'              => (int)$db->lastInsertId(),
            'name'            => $planTitle,
            'price'           => 0.00,
            'duration_months' => 1
        ];
    }

    $planId    = (int)$planRow['id'];
    $planName  = (string)$planRow['name'];
    $planPrice = (float)$planRow['price'];
    $durMonths = max(1, (int)$planRow['duration_months']);

    // 2. Create or reuse single central user record
    $isExistingAccount = false;
    if ($existingUser) {
        $isExistingAccount = true;
        $userId = (int)$existingUser['id'];
        // Reactivate only if previously deactivated/cancelled, preserve primary role for non-user accounts and grant 'user' via user_roles
        $db->prepare("UPDATE users SET status = 'active', mobile = COALESCE(mobile, :mob), updated_at = NOW() WHERE id = :uid")
            ->execute([':mob' => $cleanPhone, ':uid' => $userId]);
        $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (:uid, 'user')")->execute([':uid' => $userId]);
        $fullName = (string)$existingUser['full_name'] ?: $fullName;
    } else {
        $passToHash = $rawPassword !== '' ? $rawPassword : 'Member@123';
        $passwordHash = password_hash($passToHash, PASSWORD_DEFAULT);
        $userStmt = $db->prepare("
            INSERT INTO users (email, mobile, password_hash, role, full_name, status, created_at, updated_at)
            VALUES (:email, :mob, :phash, 'user', :fn, 'active', NOW(), NOW())
        ");
        $userStmt->execute([':email' => $email, ':mob' => $cleanPhone, ':phash' => $passwordHash, ':fn' => $fullName]);
        $userId = (int)$db->lastInsertId();

        $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (:uid, 'user')")->execute([':uid' => $userId]);
        $db->prepare("
            INSERT IGNORE INTO user_settings (user_id, theme, language, measurement_system, timezone)
            VALUES (:uid, 'light', 'en', 'metric', 'Asia/Kolkata')
        ")->execute([':uid' => $userId]);
        $db->prepare("
            INSERT IGNORE INTO notification_preferences (user_id, event_type, in_app, email, sms, push) VALUES
            (:u1, 'workout_reminder', 1, 1, 0, 1),
            (:u2, 'trainer_message', 1, 1, 0, 1),
            (:u3, 'goal_achieved', 1, 1, 0, 1)
        ")->execute([':u1' => $userId, ':u2' => $userId, ':u3' => $userId]);
    }

    // 3. Profile, goal, and initial biometric record
    $cleanGender = in_array($genderRaw, ['male', 'female', 'other', 'prefer_not_to_say'], true) ? $genderRaw : 'other';
    $db->prepare("
        INSERT INTO user_profiles (user_id, gender, weight_kg, fitness_experience, preferred_gym_id, updated_at)
        VALUES (:uid, :gender, :w, 'intermediate', :pgid, NOW())
        ON DUPLICATE KEY UPDATE
            gender = COALESCE(NULLIF(gender, ''), VALUES(gender)),
            weight_kg = VALUES(weight_kg),
            preferred_gym_id = COALESCE(preferred_gym_id, VALUES(preferred_gym_id)),
            updated_at = NOW()
    ")->execute([':uid' => $userId, ':gender' => $cleanGender, ':w' => $weight, ':pgid' => $gymId]);

    $gChk = $db->prepare("SELECT id FROM fitness_goals WHERE user_id = :uid AND status = 'active' LIMIT 1");
    $gChk->execute([':uid' => $userId]);
    if (!$gChk->fetchColumn()) {
        $db->prepare("
            INSERT INTO fitness_goals (user_id, title, goal_type, target_weight_kg, starting_weight_kg, status, progress_pct, created_at, updated_at)
            VALUES (:uid, :goal, 'hypertrophy', :tw, :sw, 'active', 0, NOW(), NOW())
        ")->execute([':uid' => $userId, ':goal' => mb_substr($goal, 0, 200), ':tw' => $weight, ':sw' => $weight]);
    }

    $db->prepare("
        INSERT INTO body_measurements (user_id, recorded_at, weight_kg, notes, created_at)
        VALUES (:uid, CURDATE(), :w, 'Gym desk enrollment baseline measurement', NOW())
    ")->execute([':uid' => $userId, ':w' => $weight]);

    // 4. Cancel any stale pending request at this gym and activate membership
    $db->prepare("UPDATE memberships SET status = 'cancelled', updated_at = NOW() WHERE user_id = :uid AND gym_id = :gid AND status = 'pending'")
        ->execute([':uid' => $userId, ':gid' => $gymId]);

    $qrToken = 'FS-MEM-' . $userId . '-' . bin2hex(random_bytes(6));
    $db->prepare("
        INSERT INTO memberships (user_id, plan_id, gym_id, start_date, end_date, status, qr_code_token, auto_renew, approved_by_user_id, approved_at, created_at, updated_at)
        VALUES (:uid, :pid, :gid, CURDATE(), DATE_ADD(CURDATE(), INTERVAL :months MONTH), 'active', :qr, 1, :oid, NOW(), NOW(), NOW())
    ")->execute([':uid' => $userId, ':pid' => $planId, ':gid' => $gymId, ':months' => $durMonths, ':qr' => $qrToken, ':oid' => $authUser['id']]);
    $membershipId = (int)$db->lastInsertId();

    if ($planPrice > 0) {
        $db->prepare("
            INSERT INTO payments (user_id, gym_id, membership_id, amount, currency, payment_status, payment_method, provider_ref, transaction_date)
            VALUES (:uid, :gid, :mid, :amt, 'INR', 'completed', 'Gym Desk Enrollment', :ref, NOW())
        ")->execute([':uid' => $userId, ':gid' => $gymId, ':mid' => $membershipId, ':amt' => $planPrice, ':ref' => 'FS-ENR-' . $membershipId . '-' . time()]);
    }

    $service->createNotification(
        $userId,
        'Gym Membership Activated',
        "You have been enrolled in {$gymName} ({$planName}).",
        'membership',
        $membershipId
    );

    // 5. Optional Trainer Assignment
    if ($coachUserId > 0) {
        $db->prepare("UPDATE trainer_assignments SET status = 'transferred', end_date = CURDATE(), updated_at = NOW() WHERE user_id = :uid AND status = 'active'")
            ->execute([':uid' => $userId]);
        $db->prepare("
            INSERT INTO trainer_assignments (user_id, trainer_user_id, gym_id, assigned_by_user_id, status, start_date, created_at, updated_at)
            VALUES (:uid, :tid, :gid, :oid, 'active', CURDATE(), NOW(), NOW())
        ")->execute([':uid' => $userId, ':tid' => $coachUserId, ':gid' => $gymId, ':oid' => $authUser['id']]);
        $assignId = (int)$db->lastInsertId();

        $db->prepare("
            INSERT IGNORE INTO trainer_data_permissions (assignment_id, can_view_measurements, can_view_nutrition, can_view_assessments, can_log_attendance)
            VALUES (:aid, 1, 1, 1, 1)
        ")->execute([':aid' => $assignId]);

        $service->createNotification($userId, 'Trainer Assigned', "{$coachName} has been assigned as your personal trainer at {$gymName}.", 'trainer_assignment', $assignId);
        $service->createNotification($coachUserId, 'New Athlete Assigned', "{$fullName} was enrolled at {$gymName} and assigned to you.", 'trainer_assignment', $assignId);
    }

    $db->commit();

    $memberPayload = [
        'id'                => 'mem-' . $userId,
        'user_id'           => $userId,
        'membership_id'     => $membershipId,
        'gym_id'            => $gymId,
        'plan_id'           => $planId,
        'name'              => $fullName,
        'email'             => $email,
        'phone'             => $cleanPhone ?? '',
        'gender'            => $cleanGender,
        'weight'            => $weight . ' kg',
        'goal'              => $goal,
        'membershipTier'    => $planName,
        'assignedCoachId'   => $coachUserId > 0 ? 'tr-' . $coachUserId : '',
        'assignedCoachName' => $coachName,
        'existing_account'  => $isExistingAccount
    ];

    $msg = $isExistingAccount
        ? "Existing FitSync account ({$email}) was enrolled into {$gymName} without creating a duplicate user."
        : "Athlete {$fullName} enrolled into {$gymName} and account created successfully.";

    jsonResponse(['success' => true, 'message' => $msg, 'data' => $memberPayload, 'member' => $memberPayload], 201);
} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('[FitSync add_member.php PDOException] ' . $e->getMessage());
    $msg = ((string)$e->getCode() === '23000')
        ? 'An account or record with conflicting details already exists.'
        : 'A database error prevented athlete enrollment. Please check the server error log.';
    apiResponse(false, $msg, null, 409);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('[FitSync add_member.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to enroll member: unexpected error occurred.', null, 500);
}
