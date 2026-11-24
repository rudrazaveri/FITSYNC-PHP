<?php
/**
 * FitSync AI — API: Water Intake Tracking
 *
 * Real MySQL-backed water logging and telemetry.
 * Strictly uses Asia/Kolkata date handling.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $db = getDbConnection(true);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection unavailable']);
    exit;
}

$userId = getActiveMemberUserId();
if ($userId <= 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'User not identified']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Helper to get water summary for today (Asia/Kolkata authoritative)
function getTodayWaterSummary(PDO $db, int $userId): array {
    $today = date('Y-m-d');
    $stmt = $db->prepare("
        SELECT COALESCE(SUM(amount_ml), 0) AS total_ml, COUNT(*) AS log_count
        FROM water_logs
        WHERE user_id = :uid AND log_date = :today
    ");
    $stmt->execute([':uid' => $userId, ':today' => $today]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalMl = (int)($summary['total_ml'] ?? 0);

    // Fetch individual logs today
    $stmt = $db->prepare("
        SELECT id, amount_ml, logged_at
        FROM water_logs
        WHERE user_id = :uid AND log_date = :today
        ORDER BY logged_at DESC
    ");
    $stmt->execute([':uid' => $userId, ':today' => $today]);
    $rawLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $logs = array_map(function ($l) {
        $amount = (int)$l['amount_ml'];
        return [
            'id'        => (int)$l['id'],
            'amount_ml' => $amount,
            'liters'    => round($amount / 1000.0, 2),
            'logged_at' => $l['logged_at'],
            'time'      => date('h:i A', strtotime($l['logged_at']))
        ];
    }, $rawLogs);

    return [
        'total_ml'      => $totalMl,
        'liters'        => round($totalMl / 1000.0, 1),
        'target_ml'     => 3000,
        'target_liters' => 3.0,
        'log_count'     => (int)($summary['log_count'] ?? 0),
        'logs'          => $logs
    ];
}

// -----------------------------------------------------------------------------
// GET: Fetch today's water intake
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    try {
        $data = getTodayWaterSummary($db, $userId);
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// -----------------------------------------------------------------------------
// POST: Log a water intake entry
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    $amountMl = 0;
    if (isset($input['amount_ml'])) {
        $amountMl = (int)$input['amount_ml'];
    } elseif (isset($input['liters'])) {
        $amountMl = (int)round(((float)$input['liters']) * 1000);
    }

    if ($amountMl <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid water amount. Must be greater than 0 ml.']);
        exit;
    }

    $today = date('Y-m-d');
    $now = date('Y-m-d H:i:s');

    try {
        $stmt = $db->prepare("
            INSERT INTO water_logs (user_id, log_date, amount_ml, logged_at)
            VALUES (:uid, :log_date, :amount, :logged_at)
        ");
        $stmt->execute([
            ':uid'       => $userId,
            ':log_date'  => $today,
            ':amount'    => $amountMl,
            ':logged_at' => $now
        ]);

        $data = getTodayWaterSummary($db, $userId);
        echo json_encode([
            'success' => true,
            'message' => "Logged {$amountMl} ml of water successfully.",
            'data'    => $data
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// -----------------------------------------------------------------------------
// DELETE: Remove water entry or reset today's water
// -----------------------------------------------------------------------------
if ($method === 'DELETE') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_GET;

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $action = $input['action'] ?? '';
    $today = date('Y-m-d');

    try {
        if ($id > 0) {
            $stmt = $db->prepare("DELETE FROM water_logs WHERE id = :id AND user_id = :uid");
            $stmt->execute([':id' => $id, ':uid' => $userId]);
        } elseif ($action === 'reset' || $id === 0) {
            // Reset today's water logs
            $stmt = $db->prepare("DELETE FROM water_logs WHERE user_id = :uid AND log_date = :today");
            $stmt->execute([':uid' => $userId, ':today' => $today]);
        }

        $data = getTodayWaterSummary($db, $userId);
        echo json_encode([
            'success' => true,
            'message' => 'Water intake updated.',
            'data'    => $data
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
