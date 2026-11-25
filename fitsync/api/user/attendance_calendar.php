<?php
/**
 * FitSync AI — API: Attendance Calendar & Member Check-in
 * Enforces session identity, active membership verification, and CSRF.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['user_id']) && (int)$_GET['user_id'] > 0 && (int)$_GET['user_id'] !== $userId && $authUser['role'] !== 'admin') {
        apiResponse(false, 'Forbidden: Cannot access another user\'s attendance calendar.', null, 403);
    }

    try {
        $year  = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
        $month = isset($_GET['month']) ? (int)$_GET['month'] : (int)date('n');

        $stmt = $db->prepare("
            SELECT g.name AS gym_name, g.id AS gym_id
            FROM memberships m
            INNER JOIN gyms g ON g.id = m.gym_id
            WHERE m.user_id = :uid AND m.status = 'active'
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $gymInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        $gymName = $gymInfo ? $gymInfo['gym_name'] : 'No Active Gym Membership';
        $gymId   = $gymInfo ? (int)$gymInfo['gym_id'] : 0;

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

        $stmt = $db->prepare("SELECT COUNT(*) FROM attendance WHERE user_id = :uid AND DATE(check_in_time) = CURDATE()");
        $stmt->execute([':uid' => $userId]);
        $isCheckedInToday = ((int)$stmt->fetchColumn()) > 0;

        $totalCheckins = count($attendedDays);
        $daysInMonth = (int)date('t', mktime(0, 0, 0, $month, 1, $year));
        $firstDayWeekday = (int)date('w', mktime(0, 0, 0, $month, 1, $year));
        $targetDays = min(20, $daysInMonth);
        $consistencyPct = min(100, (int)round(($totalCheckins / $targetDays) * 100));

        apiResponse(true, 'Attendance calendar retrieved.', [
            'year'                => $year,
            'month'               => $month,
            'gym_name'            => $gymName,
            'gym_id'              => $gymId,
            'total_checkins'      => $totalCheckins,
            'days_in_month'       => $daysInMonth,
            'first_day_weekday'   => $firstDayWeekday,
            'consistency_pct'     => $consistencyPct,
            'attended_days'       => $attendedDays,
            'is_checked_in_today' => $isCheckedInToday,
            'records'             => $records
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync attendance_calendar.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load attendance calendar.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = (string)($input['action'] ?? 'checkin');
    $gymId  = isset($input['gym_id']) ? (int)$input['gym_id'] : 0;

    try {
        if ($action === 'checkin') {
            $res = $service->recordAttendanceCheckIn($userId, $gymId, 'turnstile');
            jsonResponse([
                'success'            => true,
                'already_checked_in' => $res['already_checked_in'],
                'message'            => $res['message'],
                'data'               => $res
            ]);
        }

        apiResponse(false, 'Unknown action.', null, 400);
    } catch (RuntimeException $e) {
        apiResponse(false, $e->getMessage(), null, 400);
    } catch (Throwable $e) {
        error_log('[FitSync attendance_calendar.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to record check-in.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
