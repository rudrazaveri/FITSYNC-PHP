<?php
/**
 * FitSync AI — API: Trainer Profile Management (MySQL Authoritative)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/upload_helper.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['trainer', 'admin']);
$trainerId = (int)$authUser['id'];

$db = getDbConnection();
if (!$db) {
    apiResponse(false, 'Database service unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT u.id, u.email, u.mobile, u.full_name, u.role, u.status,
                   tp.certification_name, tp.certifying_body, tp.certification_year,
                   tp.experience_years, tp.specializations_summary, tp.bio, tp.hourly_rate,
                   tp.rating, tp.reviews_count,
                   f.storage_key AS avatar_storage_key
            FROM users u
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            LEFT JOIN files f ON f.id = u.profile_picture_id
            WHERE u.id = :tid LIMIT 1
        ");
        $stmt->execute([':tid' => $trainerId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$profile) {
            apiResponse(false, 'Trainer not found.', null, 404);
        }

        $avatarUrl = fitSyncResolveFileUrl($profile['avatar_storage_key'] ?? null, 'assets/images/trainer_raj.jpg');

        apiResponse(true, 'Trainer profile loaded.', [
            'id'               => (int)$profile['id'],
            'user_id'          => (int)$profile['id'],
            'name'             => $profile['full_name'],
            'email'            => $profile['email'],
            'phone'            => $profile['mobile'] ?? '',
            'title'            => $profile['certification_name'] ?? 'Certified Strength Coach',
            'certification'    => $profile['certification_name'] ?? 'Certified Strength Coach',
            'certifying_body'  => $profile['certifying_body'] ?? 'FitSync Certified',
            'experience'       => ($profile['experience_years'] ?? 0) . '+ Years',
            'experience_years' => (int)($profile['experience_years'] ?? 0),
            'hourly_rate'      => '₹' . number_format((float)($profile['hourly_rate'] ?? 0), 0) . ' / hr',
            'rate_numeric'     => (float)($profile['hourly_rate'] ?? 0),
            'specialties'      => !empty($profile['specializations_summary']) ? array_map('trim', explode(',', $profile['specializations_summary'])) : [],
            'specializations'  => $profile['specializations_summary'] ?? '',
            'bio'              => $profile['bio'] ?? '',
            'rating'           => (float)($profile['rating'] ?? 5.0),
            'avatar_url'       => $avatarUrl
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync trainer/profile.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load trainer profile.', null, 500);
    }
}

if ($method === 'POST' || $method === 'PUT') {
    requireCsrfToken();

    $rawInput = file_get_contents('php://input');
    $input = (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false)
        ? (json_decode($rawInput, true) ?: [])
        : (!empty($_POST) ? $_POST : (json_decode($rawInput, true) ?: []));

    $action = trim((string)($input['action'] ?? 'save'));
    if ($action === 'remove_avatar') {
        $db->beginTransaction();
        try {
            $oldQ = $db->prepare("SELECT profile_picture_id FROM users WHERE id = :tid LIMIT 1");
            $oldQ->execute([':tid' => $trainerId]);
            $oldPicId = (int)($oldQ->fetchColumn() ?: 0);
            $db->prepare("UPDATE users SET profile_picture_id = NULL, updated_at = NOW() WHERE id = :tid")->execute([':tid' => $trainerId]);
            if ($oldPicId > 0) fitSyncDeleteStoredFile($db, $oldPicId);
            $db->commit();
            apiResponse(true, 'Trainer photo removed.', ['avatar_url' => 'assets/images/trainer_raj.jpg']);
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            apiResponse(false, 'Unable to remove trainer photo.', null, 500);
        }
    }

    $name  = trim((string)($input['name'] ?? $input['full_name'] ?? ''));
    $phone = trim((string)($input['phone'] ?? $input['mobile'] ?? ''));
    $title = trim((string)($input['title'] ?? $input['certification'] ?? 'Certified Strength Coach'));
    $expRaw = trim((string)($input['experience'] ?? $input['experience_years'] ?? '0'));
    preg_match('/\d+/', $expRaw, $mExp);
    $expYears = !empty($mExp[0]) ? (int)$mExp[0] : 0;

    $rateRaw = trim((string)($input['hourly_rate'] ?? $input['rate'] ?? '0'));
    preg_match('/\d+/', str_replace(',', '', $rateRaw), $mRate);
    $hourlyRate = !empty($mRate[0]) ? (float)$mRate[0] : 0.0;

    $specialties = $input['specialties'] ?? $input['specializations'] ?? '';
    $specsStr = is_array($specialties)
        ? implode(', ', array_filter(array_map('trim', $specialties)))
        : trim((string)$specialties);

    $bio = trim((string)($input['bio'] ?? ''));

    if (empty($name)) {
        apiResponse(false, 'Trainer full name is required.', null, 400);
    }

    $oldQ = $db->prepare("SELECT profile_picture_id FROM users WHERE id = :tid LIMIT 1");
    $oldQ->execute([':tid' => $trainerId]);
    $previousPicId = (int)($oldQ->fetchColumn() ?: 0);
    $uploadedStorageKey = null;
    $newAvatarUrl = null;

    $db->beginTransaction();
    try {
        $newPicId = null;
        if (!empty($_FILES['profile_photo']) && (int)($_FILES['profile_photo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            $newPicId = fitSyncStoreUploadedFile($db, $_FILES['profile_photo'], 'profile_picture', $trainerId, false, false);
            if ($newPicId) {
                $skQ = $db->prepare("SELECT storage_key FROM files WHERE id = :fid LIMIT 1");
                $skQ->execute([':fid' => $newPicId]);
                $uploadedStorageKey = (string)$skQ->fetchColumn();
                $newAvatarUrl = fitSyncResolveFileUrl($uploadedStorageKey, 'assets/images/trainer_raj.jpg');
            }
        }

        if ($newPicId !== null) {
            $stmtUser = $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob, profile_picture_id = :ppid, updated_at = NOW() WHERE id = :tid");
            $stmtUser->execute([':fn' => $name, ':mob' => $phone ?: null, ':ppid' => $newPicId, ':tid' => $trainerId]);
            if ($previousPicId > 0 && $previousPicId !== $newPicId) {
                fitSyncDeleteStoredFile($db, $previousPicId);
            }
        } else {
            $stmtUser = $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob, updated_at = NOW() WHERE id = :tid");
            $stmtUser->execute([':fn' => $name, ':mob' => $phone ?: null, ':tid' => $trainerId]);
        }

        $stmtProfile = $db->prepare("
            INSERT INTO trainer_profiles (user_id, certification_name, certifying_body, experience_years, hourly_rate, specializations_summary, bio, status, rating, reviews_count, updated_at)
            VALUES (:tid, :cert, 'FitSync Certified', :exp, :rate, :specs, :bio, 'verified', 5.0, 0, NOW())
            ON DUPLICATE KEY UPDATE
                certification_name = VALUES(certification_name),
                experience_years = VALUES(experience_years),
                hourly_rate = VALUES(hourly_rate),
                specializations_summary = VALUES(specializations_summary),
                bio = VALUES(bio),
                updated_at = NOW()
        ");
        $stmtProfile->execute([
            ':tid' => $trainerId, ':cert' => $title, ':exp' => $expYears,
            ':rate' => $hourlyRate, ':specs' => $specsStr, ':bio' => $bio
        ]);

        $db->commit();

        $_SESSION['full_name'] = $name;
        if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
            $_SESSION['user']['full_name'] = $name;
            $_SESSION['user']['name'] = $name;
        }

        apiResponse(true, 'Trainer profile successfully saved to database.', [
            'id'              => $trainerId,
            'name'            => $name,
            'phone'           => $phone,
            'title'           => $title,
            'experience'      => $expYears . '+ Years',
            'hourly_rate'     => '₹' . number_format($hourlyRate, 0) . ' / hr',
            'specializations' => $specsStr,
            'avatar_url'      => $newAvatarUrl
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ($uploadedStorageKey) fitSyncUnlinkRelativeStorageKey($uploadedStorageKey);
        if ($e instanceof InvalidArgumentException) {
            apiResponse(false, $e->getMessage(), null, 400);
        }
        error_log('[FitSync trainer/profile.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to save trainer profile.', null, 500);
    }
}

apiResponse(false, 'Method not allowed', null, 405);
