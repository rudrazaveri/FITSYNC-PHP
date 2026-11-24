<?php
/**
 * FitSync AI — API: Gym Owner Add Coach
 * Transactionally creates user, trainer profile, and gym-trainer association.
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

$fullName    = trim((string)($input['name'] ?? ($input['full_name'] ?? '')));
$email       = trim(strtolower((string)($input['email'] ?? '')));
$phone       = trim((string)($input['phone'] ?? ($input['mobile'] ?? '')));
$title       = trim((string)($input['title'] ?? 'Certified Strength Coach'));
$experience  = (int)($input['experience'] ?? 3);
$hourlyRate  = (float)($input['hourlyRate'] ?? 1500.00);
$specialties = trim((string)($input['specialties'] ?? 'Hypertrophy, Strength'));
$gymId       = isset($input['gym_id']) ? (int)$input['gym_id'] : 0;

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

    // Check if user already exists
    $stmt = $db->prepare("SELECT id, role, status FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['status'] === 'active') {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'An active account with this email address already exists.']);
            exit;
        }
        // If inactive, reactivate
        $userId = (int)$existing['id'];
        $db->beginTransaction();
        $up = $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob, status = 'active', updated_at = NOW() WHERE id = :uid");
        $up->execute([':fn' => $fullName, ':mob' => $phone ?: null, ':uid' => $userId]);

        $profUp = $db->prepare("
            INSERT INTO trainer_profiles (user_id, certification_name, certifying_body, experience_years, specializations_summary, hourly_rate, rating, status, updated_at)
            VALUES (:uid, :title, 'FitSync Certified', :exp, :spec, :rate, 5.00, 'verified', NOW())
            ON DUPLICATE KEY UPDATE certification_name = VALUES(certification_name), experience_years = VALUES(experience_years), specializations_summary = VALUES(specializations_summary), hourly_rate = VALUES(hourly_rate), status = 'verified', updated_at = NOW()
        ");
        $profUp->execute([':uid' => $userId, ':title' => $title, ':exp' => $experience, ':spec' => $specialties, ':rate' => $hourlyRate]);

        $gtUp = $db->prepare("
            INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, is_active, joined_at)
            VALUES (:gid, :uid, 'full_time', 1, CURDATE())
            ON DUPLICATE KEY UPDATE is_active = 1
        ");
        $gtUp->execute([':gid' => $gymId, ':uid' => $userId]);
        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Coach account successfully reactivated into staff roster.',
            'coach' => [
                'id'          => 'tr-' . $userId,
                'user_id'     => $userId,
                'name'        => $fullName,
                'email'       => $email,
                'phone'       => $phone ?: '+91 98000 00000',
                'title'       => $title,
                'experience'  => $experience . ' Years',
                'hourlyRate'  => '₹' . number_format($hourlyRate),
                'specialties' => array_map('trim', explode(',', $specialties))
            ]
        ]);
        exit;
    }

    // New Coach Registration
    $db->beginTransaction();

    $defaultHash = password_hash('Trainer@123', PASSWORD_BCRYPT);
    $userStmt = $db->prepare("
        INSERT INTO users (email, mobile, password_hash, role, full_name, status, created_at, updated_at)
        VALUES (:email, :mob, :phash, 'trainer', :fn, 'active', NOW(), NOW())
    ");
    $userStmt->execute([
        ':email' => $email,
        ':mob'   => $phone ?: null,
        ':phash' => $defaultHash,
        ':fn'    => $fullName
    ]);
    $userId = (int)$db->lastInsertId();

    $profileStmt = $db->prepare("
        INSERT INTO trainer_profiles (user_id, certification_name, certifying_body, experience_years, specializations_summary, hourly_rate, rating, status, updated_at)
        VALUES (:uid, :title, 'FitSync Certified', :exp, :spec, :rate, 5.00, 'verified', NOW())
    ");
    $profileStmt->execute([
        ':uid'   => $userId,
        ':title' => $title,
        ':exp'   => $experience,
        ':spec'  => $specialties,
        ':rate'  => $hourlyRate
    ]);

    // Authoritative Gym-Trainer Association
    $gtStmt = $db->prepare("
        INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, is_active, joined_at)
        VALUES (:gid, :uid, 'full_time', 1, CURDATE())
        ON DUPLICATE KEY UPDATE is_active = 1
    ");
    $gtStmt->execute([
        ':gid' => $gymId,
        ':uid' => $userId
    ]);

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Coach successfully added to facility coaching staff.',
        'coach' => [
            'id'          => 'tr-' . $userId,
            'user_id'     => $userId,
            'name'        => $fullName,
            'email'       => $email,
            'phone'       => $phone ?: '+91 98000 00000',
            'title'       => $title,
            'experience'  => $experience . ' Years',
            'hourlyRate'  => '₹' . number_format($hourlyRate),
            'specialties' => array_map('trim', explode(',', $specialties))
        ]
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
