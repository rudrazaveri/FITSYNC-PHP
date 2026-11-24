<?php
/**
 * FitSync AI — API: Attendance Calendar & Member Check-in
 * Manages monthly attendance records, consistency telemetry, and live turnstile check-ins.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

$userId = getActiveMemberUserId();

$db = getDbConnection();
if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection unavailable.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $year  = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
        $month = isset($_GET['month']) ? (int)$_GET['month'] : (int)date('n');

        // Fetch gym name
        $stmt = $db->prepare("
            SELECT g.name AS gym_name, g.id AS gym_id
            FROM memberships m
            INNER JOIN gyms g ON g.id = m.gym_id
            WHERE m.user_id = :uid AND m.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $gymInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        $gymName = $gymInfo ? $gymInfo['gym_name'] : 'FitZone Fitness Hub';
        $gymId   = $gymInfo ? (int)$gymInfo['gym_id'] : 1;

        // Fetch check-ins for specified year and month
        $stmt = $db->prepare("
            SELECT id, check_in_time, check_out_time, check_in_method, status
            FROM attendance
            WHERE user_id = :uid 
              AND YEAR(check_in_time) = :yr 
              AND MONTH(check_in_time) = :mo
            ORDER BY check_in_time ASC
        ");
        $stmt->execute([':uid' => $userId, ':yr' => $year, ':mo' => $month]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $attendedDays = [];
        foreach ($records as $r) {
            $dayNum = (int)date('j', strtotime($r['check_in_time']));
            if (!in_array($dayNum, $attendedDays, true)) {
                $attendedDays[] = $dayNum;
            }
        }

        // Check if checked in today
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM attendance 
            WHERE user_id = :uid AND DATE(check_in_time) = CURDATE()
        ");
        $stmt->execute([':uid' => $userId]);
        $isCheckedInToday = ((int)$stmt->fetchColumn()) > 0;

        $totalCheckins = count($attendedDays);
        $daysInMonth = (int)date('t', mktime(0, 0, 0, $month, 1, $year));
        $firstDayWeekday = (int)date('w', mktime(0, 0, 0, $month, 1, $year)); // 0=Sunday, 1=Monday...

        // Consistency % based on target of 20 gym days per month (or elapsed days)
        $targetDays = min(20, $daysInMonth);
        $consistencyPct = min(100, (int)round(($totalCheckins / $targetDays) * 100));

        echo json_encode([
            'success' => true,
            'data' => [
                'year'                 => $year,
                'month'                => $month,
                'gym_name'             => $gymName,
                'gym_id'               => $gymId,
                'total_checkins'       => $totalCheckins,
                'days_in_month'        => $daysInMonth,
                'first_day_weekday'    => $firstDayWeekday,
                'consistency_pct'      => $consistencyPct,
                'attended_days'        => $attendedDays,
                'is_checked_in_today'  => $isCheckedInToday,
                'records'              => $records
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $input['action'] ?? 'checkin';
    $gymId  = isset($input['gym_id']) ? (int)$input['gym_id'] : 1;

    try {
        if ($action === 'checkin') {
            // Check for duplicate today
            $stmt = $db->prepare("
                SELECT id, check_in_time FROM attendance 
                WHERE user_id = :uid AND DATE(check_in_time) = CURDATE()
                LIMIT 1
            ");
            $stmt->execute([':uid' => $userId]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                echo json_encode([
                    'success' => true,
                    'already_checked_in' => true,
                    'message' => 'You are already checked in for today at ' . date('h:i A', strtotime($existing['check_in_time'])) . '.'
                ]);
                exit;
            }

            // Insert new check-in
            $stmt = $db->prepare("
                INSERT INTO attendance (user_id, gym_id, check_in_time, check_in_method, status, notes)
                VALUES (:uid, :gid, NOW(), 'turnstile', 'verified', 'Verified member daily check-in')
            ");
            $stmt->execute([':uid' => $userId, ':gid' => $gymId]);

            echo json_encode([
                'success' => true,
                'already_checked_in' => false,
                'message' => '✅ Gate Unlocked! Verified Turnstile Check-In at ' . date('h:i A') . '. Have a great workout!'
            ]);
            exit;
        }

        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown action.']);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
