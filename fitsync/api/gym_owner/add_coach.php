<?php
/**
 * FitSync AI — API: Gym Owner Add Coach
 * Strictly enforces gym_owner session, CSRF, and gym ownership.
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

$fullName    = trim((string)($input['name'] ?? ($input['full_name'] ?? '')));
$email       = trim(strtolower((string)($input['email'] ?? '')));
$phone       = trim((string)($input['phone'] ?? ($input['mobile'] ?? '')));
$title       = trim((string)($input['title'] ?? 'Certified Strength Coach'));
$experience  = max(0, (int)($input['experience'] ?? 3));
$hourlyRate  = max(0.0, (float)($input['hourlyRate'] ?? 1500.00));
$specialties = trim((string)($input['specialties'] ?? 'Hypertrophy, Strength'));
$reqGymId    = isset($input['gym_id']) && (int)$input['gym_id'] > 0 ? (int)$input['gym_id'] : null;

if (empty($fullName) || empty($email)) {
    apiResponse(false, 'Full name and email are required.', null, 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    apiResponse(false, 'Invalid email address format.', null, 400);
}

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$gymId = $service->resolveOwnerGymId((int)$authUser['id'], $reqGymId, $authUser['role']);
if ($gymId === null) {
    apiResponse(false, 'Forbidden: No gym facility owned by your account.', null, 403);
}

try {
    $stmt = $db->prepare("SELECT id, role, status FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['status'] === 'active') {
            if ($existing['role'] !== 'trainer') {
                apiResponse(false, 'An active non-trainer account with this email already exists.', null, 409);
            }
            $assocChk = $db->prepare("SELECT status, is_active FROM gym_trainers WHERE gym_id = :gid AND trainer_user_id = :uid LIMIT 1");
            $assocChk->execute([':gid' => $gymId, ':uid' => (int)$existing['id']]);
            $assocRow = $assocChk->fetch(PDO::FETCH_ASSOC);
            if ($assocRow && $assocRow['status'] === 'active' && (int)$assocRow['is_active'] === 1) {
                apiResponse(false, 'This trainer is already actively associated with your gym.', null, 409);
            }
            // Associate existing registered platform Trainer with this gym (zero duplicate user accounts)
            $res = $service->manageGymTrainerAssociation((int)$authUser['id'], $gymId, (int)$existing['id'], 'approve', $authUser['role']);
            $coachPayload = [
                'id'          => 'tr-' . (int)$existing['id'],
                'user_id'     => (int)$existing['id'],
                'name'        => $fullName,
                'email'       => $email,
                'phone'       => $phone,
                'title'       => $title,
                'experience'  => $experience . ' Years',
                'hourlyRate'  => '₹' . number_format($hourlyRate),
                'specialties' => array_filter(array_map('trim', explode(',', $specialties)))
            ];
            jsonResponse(['success' => true, 'message' => 'Existing FitSync trainer linked to your gym staff roster.', 'data' => $coachPayload, 'coach' => $coachPayload]);
        }
        $userId = (int)$existing['id'];
        $db->beginTransaction();

        $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob, role = 'trainer', status = 'active', updated_at = NOW() WHERE id = :uid")
            ->execute([':fn' => $fullName, ':mob' => $phone ?: null, ':uid' => $userId]);
        $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (:uid, 'trainer')")->execute([':uid' => $userId]);

        $db->prepare("
            INSERT INTO trainer_profiles (user_id, certification_name, certifying_body, experience_years, specializations_summary, hourly_rate, rating, status, updated_at)
            VALUES (:uid, :title, 'FitSync Certified', :exp, :spec, :rate, 5.00, 'verified', NOW())
            ON DUPLICATE KEY UPDATE certification_name = VALUES(certification_name), experience_years = VALUES(experience_years), specializations_summary = VALUES(specializations_summary), hourly_rate = VALUES(hourly_rate), status = 'verified', updated_at = NOW()
        ")->execute([':uid' => $userId, ':title' => $title, ':exp' => $experience, ':spec' => $specialties, ':rate' => $hourlyRate]);

        $db->prepare("
            INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, status, is_active, joined_at)
            VALUES (:gid, :uid, 'full_time', 'active', 1, CURDATE())
            ON DUPLICATE KEY UPDATE status = 'active', is_active = 1
        ")->execute([':gid' => $gymId, ':uid' => $userId]);

        $db->commit();

        $coachPayload = [
            'id'          => 'tr-' . $userId,
            'user_id'     => $userId,
            'name'        => $fullName,
            'email'       => $email,
            'phone'       => $phone,
            'title'       => $title,
            'experience'  => $experience . ' Years',
            'hourlyRate'  => '₹' . number_format($hourlyRate),
            'specialties' => array_filter(array_map('trim', explode(',', $specialties)))
        ];
        jsonResponse(['success' => true, 'message' => 'Coach reactivated into staff roster.', 'data' => $coachPayload, 'coach' => $coachPayload]);
    }

    $db->beginTransaction();

    $defaultHash = password_hash('Trainer@123', PASSWORD_BCRYPT);
    $userStmt = $db->prepare("
        INSERT INTO users (email, mobile, password_hash, role, full_name, status, created_at, updated_at)
        VALUES (:email, :mob, :phash, 'trainer', :fn, 'active', NOW(), NOW())
    ");
    $userStmt->execute([':email' => $email, ':mob' => $phone ?: null, ':phash' => $defaultHash, ':fn' => $fullName]);
    $userId = (int)$db->lastInsertId();

    $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (:uid, 'trainer')")->execute([':uid' => $userId]);

    $db->prepare("
        INSERT INTO trainer_profiles (user_id, certification_name, certifying_body, experience_years, specializations_summary, hourly_rate, rating, status, updated_at)
        VALUES (:uid, :title, 'FitSync Certified', :exp, :spec, :rate, 5.00, 'verified', NOW())
    ")->execute([':uid' => $userId, ':title' => $title, ':exp' => $experience, ':spec' => $specialties, ':rate' => $hourlyRate]);

    $db->prepare("
        INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, status, initiated_by, is_active, joined_at)
        VALUES (:gid, :uid, 'full_time', 'active', 'gym_owner', 1, CURDATE())
        ON DUPLICATE KEY UPDATE status = 'active', is_active = 1
    ")->execute([':gid' => $gymId, ':uid' => $userId]);

    $db->commit();

    $coachPayload = [
        'id'          => 'tr-' . $userId,
        'user_id'     => $userId,
        'name'        => $fullName,
        'email'       => $email,
        'phone'       => $phone,
        'title'       => $title,
        'experience'  => $experience . ' Years',
        'hourlyRate'  => '₹' . number_format($hourlyRate),
        'specialties' => array_filter(array_map('trim', explode(',', $specialties)))
    ];
    jsonResponse(['success' => true, 'message' => 'Coach successfully added to facility coaching staff.', 'data' => $coachPayload, 'coach' => $coachPayload]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('[FitSync add_coach.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to add coach.', null, 500);
}
