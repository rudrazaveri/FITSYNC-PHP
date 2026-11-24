<?php
/**
 * FitSync AI — API: Gym Owner Add Member / Athlete
 * Transactionally creates user, user profile, active gym membership, and optional coach assignment.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$fullName          = trim((string)($input['name'] ?? ($input['full_name'] ?? '')));
$email             = trim(strtolower((string)($input['email'] ?? '')));
$phone             = trim((string)($input['phone'] ?? ($input['mobile'] ?? '')));
$gender            = trim((string)($input['gender'] ?? 'male'));
$weight            = (float)($input['weight'] ?? ($input['weight_kg'] ?? 70.0));
$goal              = trim((string)($input['goal'] ?? 'Hypertrophy Surplus'));
$tier              = trim((string)($input['membershipTier'] ?? ($input['plan_tier'] ?? 'Gold')));
$assignedCoachId   = trim((string)($input['assignedCoachId'] ?? ($input['coach_id'] ?? '')));
$assignedCoachName = trim((string)($input['assignedCoachName'] ?? ''));
$gymId             = isset($input['gym_id']) ? (int)$input['gym_id'] : 0;

if (empty($fullName) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Full name and email are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address format.']);
    exit;
}

$db = getDbConnection();
if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection unavailable.']);
    exit;
}

try {
    // Resolve Gym ID
    if ($gymId <= 0) {
        $ownerUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 2;
        $stmt = $db->prepare("SELECT id FROM gyms WHERE owner_user_id = :oid LIMIT 1");
        $stmt->execute([':oid' => $ownerUserId]);
        $gymId = (int)$stmt->fetchColumn();
        if ($gymId <= 0) {
            $gymId = 1;
        }
    }

    // Resolve Plan ID from tier name
    $stmt = $db->prepare("SELECT id FROM membership_plans WHERE gym_id = :gid AND LOWER(name) LIKE :tier LIMIT 1");
    $stmt->execute([':gid' => $gymId, ':tier' => '%' . strtolower($tier) . '%']);
    $planId = (int)$stmt->fetchColumn();
    if ($planId <= 0) {
        // Fallback to first plan in gym
        $stmt = $db->prepare("SELECT id FROM membership_plans WHERE gym_id = :gid LIMIT 1");
        $stmt->execute([':gid' => $gymId]);
        $planId = (int)$stmt->fetchColumn();
        if ($planId <= 0) {
            $planId = 1;
        }
    }

    // Check if user already exists
    $stmt = $db->prepare("SELECT id, status FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['status'] === 'active') {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'An active member with this email address already exists.']);
            exit;
        }
        $userId = (int)$existing['id'];
        $db->beginTransaction();
        $up = $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob, status = 'active', updated_at = NOW() WHERE id = :uid");
        $up->execute([':fn' => $fullName, ':mob' => $phone ?: null, ':uid' => $userId]);
    } else {
        $db->beginTransaction();
        $defaultHash = password_hash('Member@123', PASSWORD_BCRYPT);
        $userStmt = $db->prepare("
            INSERT INTO users (email, mobile, password_hash, role, full_name, status, created_at, updated_at)
            VALUES (:email, :mob, :phash, 'user', :fn, 'active', NOW(), NOW())
        ");
        $userStmt->execute([
            ':email' => $email,
            ':mob'   => $phone ?: null,
            ':phash' => $defaultHash,
            ':fn'    => $fullName
        ]);
        $userId = (int)$db->lastInsertId();
    }

    // Insert or update user_profiles
    $cleanGender = in_array(strtolower($gender), ['male', 'female', 'other'], true) ? strtolower($gender) : 'other';
    $profStmt = $db->prepare("
        INSERT INTO user_profiles (user_id, gender, weight_kg, fitness_experience, updated_at)
        VALUES (:uid, :gender, :w, 'intermediate', NOW())
        ON DUPLICATE KEY UPDATE gender = VALUES(gender), weight_kg = VALUES(weight_kg), fitness_experience = 'intermediate', updated_at = NOW()
    ");
    $profStmt->execute([
        ':uid'    => $userId,
        ':gender' => $cleanGender,
        ':w'      => $weight
    ]);

    // Insert or update fitness_goals
    $goalStmt = $db->prepare("
        INSERT INTO fitness_goals (user_id, title, goal_type, target_weight_kg, starting_weight_kg, status, progress_pct, created_at, updated_at)
        VALUES (:uid, :goal, 'hypertrophy', :tw, :sw, 'active', 0, NOW(), NOW())
        ON DUPLICATE KEY UPDATE title = VALUES(title), updated_at = NOW()
    ");
    $goalStmt->execute([
        ':uid'  => $userId,
        ':goal' => $goal,
        ':tw'   => $weight,
        ':sw'   => $weight
    ]);

    // Insert active membership
    $qrToken = 'FS-MEM-' . $userId . '-' . bin2hex(random_bytes(6));
    $memStmt = $db->prepare("
        INSERT INTO memberships (user_id, plan_id, gym_id, start_date, end_date, status, qr_code_token, auto_renew, created_at)
        VALUES (:uid, :pid, :gid, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active', :qr, 1, NOW())
        ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), status = 'active', updated_at = NOW()
    ");
    $memStmt->execute([
        ':uid' => $userId,
        ':pid' => $planId,
        ':gid' => $gymId,
        ':qr'  => $qrToken
    ]);

    // Insert initial body measurement for tracking
    if ($weight > 0) {
        $measStmt = $db->prepare("
            INSERT INTO body_measurements (user_id, recorded_at, weight_kg, notes, created_at)
            VALUES (:uid, CURDATE(), :w, 'Initial gym onboarding measurement', NOW())
        ");
        $measStmt->execute([':uid' => $userId, ':w' => $weight]);
    }

    // Insert trainer assignment if coach ID provided
    $coachUserId = (int)str_replace('tr-', '', $assignedCoachId);
    if ($coachUserId > 0) {
        $assignStmt = $db->prepare("
            INSERT INTO trainer_assignments (user_id, trainer_user_id, status, start_date, created_at, updated_at)
            VALUES (:uid, :tid, 'active', CURDATE(), NOW(), NOW())
            ON DUPLICATE KEY UPDATE trainer_user_id = VALUES(trainer_user_id), status = 'active', updated_at = NOW()
        ");
        $assignStmt->execute([':uid' => $userId, ':tid' => $coachUserId]);
    }

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Athlete successfully registered and onboarded into gym roster.',
        'member'  => [
            'id'                => 'mem-' . $userId,
            'user_id'           => $userId,
            'name'              => $fullName,
            'email'             => $email,
            'phone'             => $phone ?: '+91 97000 00000',
            'gender'            => $cleanGender,
            'weight'            => $weight . ' kg',
            'goal'              => $goal,
            'membershipTier'    => $tier,
            'assignedCoachId'   => $assignedCoachId,
            'assignedCoachName' => $assignedCoachName ?: 'Unassigned'
        ]
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
