<?php
/**
 * FitSync AI — API: Attendance & Turnstile Check-In (Workflow D)
 * Enforces session identity, active membership verification, and role boundaries.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'trainer', 'gym_owner', 'admin']);
$service = FitSyncDataService::getInstance();
$db = $service->getDb();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        if ($authUser['role'] === 'user') {
            $userId = (int)$authUser['id'];
            if (isset($_GET['user_id']) && (int)$_GET['user_id'] !== $userId) {
                apiResponse(false, 'Forbidden: Cannot view another member\'s attendance.', null, 403);
            }

            $stmt = $db->prepare("
                SELECT a.*, g.name AS gym_name
                FROM attendance a
                LEFT JOIN gyms g ON g.id = a.gym_id
                WHERE a.user_id = :uid
                ORDER BY a.check_in_time DESC
                LIMIT 25
            ");
            $stmt->execute([':uid' => $userId]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            jsonResponse([
                'success' => true,
                'message' => 'Attendance history retrieved.',
                'data'    => $history,
                'history' => $history
            ]);
        }

        if ($authUser['role'] === 'trainer') {
            $trainerId = (int)$authUser['id'];
            $stmt = $db->prepare("
                SELECT a.*, u.full_name AS athlete_name, u.email AS athlete_email, g.name AS gym_name
                FROM attendance a
                INNER JOIN trainer_assignments ta ON ta.user_id = a.user_id AND ta.trainer_user_id = :tid AND ta.status = 'active'
                INNER JOIN users u ON u.id = a.user_id
                LEFT JOIN gyms g ON g.id = a.gym_id
                ORDER BY a.check_in_time DESC
                LIMIT 30
            ");
            $stmt->execute([':tid' => $trainerId]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            jsonResponse([
                'success' => true,
                'message' => 'Assigned athlete attendance retrieved.',
                'data'    => $history,
                'history' => $history
            ]);
        }

        // Gym Owner or Admin
        $gymId = $service->resolveOwnerGymId((int)$authUser['id'], isset($_GET['gym_id']) ? (int)$_GET['gym_id'] : null, $authUser['role']);
        if ($gymId === null) {
            jsonResponse(['success' => true, 'message' => 'No facility found.', 'data' => [], 'history' => [], 'occupancy' => 0]);
        }

        $stmt = $db->prepare("
            SELECT a.*, u.full_name AS athlete_name, u.email AS athlete_email
            FROM attendance a
            INNER JOIN users u ON u.id = a.user_id
            WHERE a.gym_id = :gid
            ORDER BY a.check_in_time DESC
            LIMIT 30
        ");
        $stmt->execute([':gid' => $gymId]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $occStmt = $db->prepare("
            SELECT COUNT(*) FROM attendance
            WHERE gym_id = :gid AND check_out_time IS NULL AND check_in_time >= DATE_SUB(NOW(), INTERVAL 4 HOUR)
        ");
        $occStmt->execute([':gid' => $gymId]);
        $liveOccupancy = (int)$occStmt->fetchColumn();

        jsonResponse([
            'success'   => true,
            'message'   => 'Facility attendance retrieved.',
            'data'      => $history,
            'history'   => $history,
            'occupancy' => $liveOccupancy
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync attendance.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load attendance logs.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    if ($authUser['role'] !== 'user' && $authUser['role'] !== 'admin') {
        apiResponse(false, 'Forbidden: Only members check in with their pass.', null, 403);
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    if (isset($input['user_id']) && (int)$input['user_id'] > 0 && (int)$input['user_id'] !== (int)$authUser['id'] && $authUser['role'] !== 'admin') {
        apiResponse(false, 'Forbidden: Cannot check in on behalf of another user.', null, 403);
    }

    $userId      = (int)$authUser['id'];
    $gymId       = isset($input['gym_id']) ? (int)$input['gym_id'] : 0;
    $action      = isset($input['action']) ? trim((string)$input['action']) : 'check_in';
    $checkMethod = isset($input['method']) ? trim((string)$input['method']) : 'turnstile';

    try {
        if ($action === 'check_out') {
            $result = $service->recordAttendanceCheckOut($userId, $gymId);
            apiResponse(true, 'Checked out successfully.', $result);
        } else {
            $result = $service->recordAttendanceCheckIn($userId, $gymId, $checkMethod);
            apiResponse(true, $result['message'] ?? 'Check-in processed.', $result);
        }
    } catch (RuntimeException $e) {
        apiResponse(false, $e->getMessage(), null, 400);
    } catch (Throwable $e) {
        error_log('[FitSync attendance.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to record attendance.', null, 500);
    }
}

apiResponse(false, 'Method not allowed', null, 405);
