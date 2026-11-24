<?php
/**
 * FitSync AI — API: Attendance & Turnstile Check-In (Workflow D)
 *
 * Saves verified records to attendance table.
 * Updates user attendance pass, trainer attendance view, and gym owner live capacity.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$service = FitSyncDataService::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

// GET: Retrieve attendance history or gym occupancy
if ($method === 'GET') {
    $gymId = isset($_GET['gym_id']) ? (int)$_GET['gym_id'] : 1;
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : getActiveMemberUserId();

    try {
        $db = $service->getDb();
        if ($userId !== null) {
            $stmt = $db->prepare("
                SELECT a.*, g.name AS gym_name
                FROM attendance a
                LEFT JOIN gyms g ON g.id = a.gym_id
                WHERE a.user_id = :uid
                ORDER BY a.check_in_time DESC
                LIMIT 20
            ");
            $stmt->execute([':uid' => $userId]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmt = $db->prepare("
                SELECT a.*, u.full_name AS athlete_name, u.email
                FROM attendance a
                INNER JOIN users u ON u.id = a.user_id
                WHERE a.gym_id = :gid
                ORDER BY a.check_in_time DESC
                LIMIT 20
            ");
            $stmt->execute([':gid' => $gymId]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        // Live Occupancy
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM attendance
            WHERE gym_id = :gid AND check_out_time IS NULL AND check_in_time >= DATE_SUB(NOW(), INTERVAL 4 HOUR)
        ");
        $stmt->execute([':gid' => $gymId]);
        $liveOccupancy = (int)$stmt->fetchColumn();

        echo json_encode([
            'success'        => true,
            'occupancy'      => $liveOccupancy,
            'history'        => $history
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// POST: Check In or Check Out
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $userId = isset($input['user_id']) ? (int)$input['user_id'] : (isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 8);
    $gymId  = isset($input['gym_id']) ? (int)$input['gym_id'] : 1;
    $action = isset($input['action']) ? trim((string)$input['action']) : 'check_in';
    $checkMethod = isset($input['method']) ? trim((string)$input['method']) : 'turnstile';

    try {
        if ($action === 'check_out') {
            $result = $service->recordAttendanceCheckOut($userId, $gymId);
        } else {
            $result = $service->recordAttendanceCheckIn($userId, $gymId, $checkMethod);
        }

        echo json_encode([
            'success' => true,
            'data'    => $result
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
