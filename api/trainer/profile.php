<?php
/**
 * FitSync AI — API: Trainer Profile Management (MySQL Authoritative)
 * Allows trainers to retrieve and update their professional profile,
 * contact details, certifications, experience, and hourly rate.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

$db = getDbConnection();
if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database service unavailable.']);
    exit;
}

// Determine active trainer user ID
$trainerId = 0;
if (isset($_SESSION['user_id']) && (($_SESSION['role'] ?? '') === 'trainer' || ($_SESSION['role'] ?? '') === 'admin')) {
    $trainerId = (int)$_SESSION['user_id'];
} else {
    // Default to primary trainer in DB
    $stmt = $db->query("SELECT id FROM users WHERE role = 'trainer' ORDER BY id ASC LIMIT 1");
    $trainerId = (int)$stmt->fetchColumn();
}

if ($trainerId <= 0) {
    $trainerId = 1;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET: Retrieve trainer profile
if ($method === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT u.id, u.email, u.mobile, u.full_name, u.role, u.status,
                   tp.certification_name, tp.certifying_body, tp.certification_year,
                   tp.experience_years, tp.specializations_summary, tp.bio, tp.hourly_rate,
                   tp.rating, tp.reviews_count
            FROM users u
            LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
            WHERE u.id = :tid LIMIT 1
        ");
        $stmt->execute([':tid' => $trainerId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$profile) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Trainer not found.']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'id'              => (int)$profile['id'],
                'user_id'         => (int)$profile['id'],
                'name'            => $profile['full_name'],
                'email'           => $profile['email'],
                'phone'           => $profile['mobile'] ?? '',
                'title'           => $profile['certification_name'] ?? 'Certified Strength Coach',
                'certification'   => $profile['certification_name'] ?? 'Certified Strength Coach',
                'certifying_body' => $profile['certifying_body'] ?? 'FitSync Certified',
                'experience'      => ($profile['experience_years'] ?? 3) . '+ Years',
                'experience_years'=> (int)($profile['experience_years'] ?? 3),
                'hourly_rate'     => '₹' . number_format((float)($profile['hourly_rate'] ?? 1500), 0) . ' / hr',
                'rate_numeric'    => (float)($profile['hourly_rate'] ?? 1500),
                'specialties'     => !empty($profile['specializations_summary']) ? array_map('trim', explode(',', $profile['specializations_summary'])) : ['Strength', 'Hypertrophy', 'Biomechanics'],
                'specializations' => $profile['specializations_summary'] ?? 'Strength, Hypertrophy, Biomechanics',
                'bio'             => $profile['bio'] ?? '',
                'rating'          => (float)($profile['rating'] ?? 5.0)
            ]
        ]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// POST or PUT: Update trainer profile
if ($method === 'POST' || $method === 'PUT') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    $name = trim((string)($input['name'] ?? $input['full_name'] ?? ''));
    $phone = trim((string)($input['phone'] ?? $input['mobile'] ?? ''));
    $title = trim((string)($input['title'] ?? $input['certification'] ?? 'Certified Strength Coach'));
    $expRaw = trim((string)($input['experience'] ?? $input['experience_years'] ?? '3'));
    preg_match('/\d+/', $expRaw, $mExp);
    $expYears = !empty($mExp[0]) ? (int)$mExp[0] : 3;

    $rateRaw = trim((string)($input['hourly_rate'] ?? $input['rate'] ?? '1500'));
    preg_match('/\d+/', str_replace(',', '', $rateRaw), $mRate);
    $hourlyRate = !empty($mRate[0]) ? (float)$mRate[0] : 1500.0;

    $specialties = $input['specialties'] ?? $input['specializations'] ?? '';
    if (is_array($specialties)) {
        $specsStr = implode(', ', array_filter(array_map('trim', $specialties)));
    } else {
        $specsStr = trim((string)$specialties);
    }

    $bio = trim((string)($input['bio'] ?? ''));

    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainer full name is required.']);
        exit;
    }

    $db->beginTransaction();
    try {
        // 1. Update users table
        $stmtUser = $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob, updated_at = NOW() WHERE id = :tid");
        $stmtUser->execute([
            ':fn'  => $name,
            ':mob' => $phone ?: null,
            ':tid' => $trainerId
        ]);

        // 2. Check if trainer_profiles record exists
        $chkStmt = $db->prepare("SELECT id FROM trainer_profiles WHERE user_id = :tid LIMIT 1");
        $chkStmt->execute([':tid' => $trainerId]);
        $existingProfileId = $chkStmt->fetchColumn();

        if ($existingProfileId) {
            $stmtProfile = $db->prepare("
                UPDATE trainer_profiles
                SET certification_name = :cert,
                    experience_years = :exp,
                    hourly_rate = :rate,
                    specializations_summary = :specs,
                    bio = :bio,
                    updated_at = NOW()
                WHERE user_id = :tid
            ");
            $stmtProfile->execute([
                ':cert'  => $title,
                ':exp'   => $expYears,
                ':rate'  => $hourlyRate,
                ':specs' => $specsStr,
                ':bio'   => $bio,
                ':tid'   => $trainerId
            ]);
        } else {
            $stmtProfile = $db->prepare("
                INSERT INTO trainer_profiles (user_id, certification_name, certifying_body, experience_years, hourly_rate, specializations_summary, bio, status, rating, reviews_count, updated_at)
                VALUES (:tid, :cert, 'FitSync Certified', :exp, :rate, :specs, :bio, 'verified', 5.0, 0, NOW())
            ");
            $stmtProfile->execute([
                ':tid'   => $trainerId,
                ':cert'  => $title,
                ':exp'   => $expYears,
                ':rate'  => $hourlyRate,
                ':specs' => $specsStr,
                ':bio'   => $bio
            ]);
        }

        $db->commit();

        // Update session if authenticated
        if (isset($_SESSION['user_id']) && (int)$_SESSION['user_id'] === $trainerId) {
            $_SESSION['full_name'] = $name;
            if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
                $_SESSION['user']['full_name'] = $name;
                $_SESSION['user']['name'] = $name;
                $_SESSION['user']['mobile'] = $phone;
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Trainer profile successfully saved to database.',
            'data' => [
                'id'              => $trainerId,
                'name'            => $name,
                'phone'           => $phone,
                'title'           => $title,
                'experience'      => $expYears . '+ Years',
                'hourly_rate'     => '₹' . number_format($hourlyRate, 0) . ' / hr',
                'specializations' => $specsStr
            ]
        ]);
        exit;
    } catch (Throwable $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
