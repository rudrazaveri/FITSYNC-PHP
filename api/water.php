<?php
/**
 * FitSync AI — API: Water Intake Tracking
 * Real MySQL-backed water logging with strict session identity and CSRF protection.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];

try {
    $db = getDbConnection(true);
} catch (Exception $e) {
    apiResponse(false, 'Database connection unavailable', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

function resolveWaterDate(?string $candidate): string {
    $c = trim((string)$candidate);
    if ($c !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $c)) {
        return $c;
    }
    return date('Y-m-d');
}

function getTodayWaterSummary(PDO $db, int $userId, ?string $dateStr = null): array {
    $today = resolveWaterDate($dateStr);
    $stmt = $db->prepare("
        SELECT COALESCE(SUM(amount_ml), 0) AS total_ml, COUNT(*) AS log_count
        FROM water_logs
        WHERE user_id = :uid AND log_date = :today
    ");
    $stmt->execute([':uid' => $userId, ':today' => $today]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalMl = (int)($summary['total_ml'] ?? 0);

    $stmt = $db->prepare("
        SELECT id, amount_ml, logged_at
        FROM water_logs
        WHERE user_id = :uid AND log_date = :today
        ORDER BY logged_at DESC, id DESC
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
        'date'          => $today,
        'total_ml'      => $totalMl,
        'liters'        => round($totalMl / 1000.0, 2),
        'target_ml'     => 3000,
        'target_liters' => 3.0,
        'log_count'     => (int)($summary['log_count'] ?? 0),
        'logs'          => $logs
    ];
}

if ($method === 'GET') {
    try {
        $data = getTodayWaterSummary($db, $userId, $_GET['local_date'] ?? null);
        apiResponse(true, 'Water intake retrieved.', $data);
    } catch (Throwable $e) {
        error_log('[FitSync water.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load water logs.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    $amountMl = 0;
    if (isset($input['amount_ml'])) {
        $amountMl = (int)$input['amount_ml'];
    } elseif (isset($input['liters'])) {
        $amountMl = (int)round(((float)$input['liters']) * 1000);
    }

    if ($amountMl <= 0 || $amountMl > 10000) {
        apiResponse(false, 'Invalid water amount. Must be between 1 and 10000 ml.', null, 400);
    }

    $today = resolveWaterDate($input['local_date'] ?? null);
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

        $data = getTodayWaterSummary($db, $userId, $today);
        $data['added_ml'] = $amountMl;
        apiResponse(true, "Logged {$amountMl} ml of water successfully.", $data);
    } catch (Throwable $e) {
        error_log('[FitSync water.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to log water.', null, 500);
    }
}

if ($method === 'DELETE') {
    requireCsrfToken();

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_GET;

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $action = $input['action'] ?? '';
    $today = resolveWaterDate($input['local_date'] ?? null);

    try {
        if ($id > 0) {
            $stmt = $db->prepare("DELETE FROM water_logs WHERE id = :id AND user_id = :uid");
            $stmt->execute([':id' => $id, ':uid' => $userId]);
        } elseif ($action === 'reset' || $id === 0) {
            $stmt = $db->prepare("DELETE FROM water_logs WHERE user_id = :uid AND log_date = :today");
            $stmt->execute([':uid' => $userId, ':today' => $today]);
        }

        $data = getTodayWaterSummary($db, $userId, $today);
        apiResponse(true, 'Water intake updated.', $data);
    } catch (Throwable $e) {
        error_log('[FitSync water.php DELETE] ' . $e->getMessage());
        apiResponse(false, 'Unable to update water logs.', null, 500);
    }
}

apiResponse(false, 'Method Not Allowed', null, 405);
