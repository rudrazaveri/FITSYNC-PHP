<?php
/**
 * FitSync AI — End-to-End Tests for Athlete Enrollment Fix & Gym Discovery Sync (Tests A-D)
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

$baseUrl = 'http://127.0.0.1:8080';
$db = getDbConnection();
if (!$db) {
    fwrite(STDERR, "DB connection failed.\n");
    exit(1);
}

$passed = 0;
$failed = 0;
$createdUserIds = [];
$createdGymIds = [];

function checkTest(bool $cond, string $label): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failed++;
        echo "[FAIL] {$label}\n";
    }
}

function httpJson(string $method, string $url, array &$cookies, ?array $body = null, string $csrf = ''): array {
    $headers = [];
    if (!empty($cookies)) {
        $pairs = [];
        foreach ($cookies as $k => $v) $pairs[] = $k . '=' . $v;
        $headers[] = 'Cookie: ' . implode('; ', $pairs);
    }
    if ($csrf !== '') $headers[] = 'X-CSRF-Token: ' . $csrf;

    $opts = ['http' => ['method' => $method, 'follow_location' => 0, 'ignore_errors' => true, 'timeout' => 12]];
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        $opts['http']['content'] = json_encode($body);
    }
    if (!empty($headers)) $opts['http']['header'] = implode("\r\n", $headers);

    $raw = @file_get_contents($url, false, stream_context_create($opts));
    $status = 0;
    foreach (($http_response_header ?? []) as $h) {
        if (preg_match('#^HTTP/\S+\s+(\d+)#i', $h, $m)) $status = (int)$m[1];
        elseif (stripos($h, 'Set-Cookie:') === 0) {
            $spec = trim(substr($h, 11));
            $parts = explode(';', $spec);
            $kv = explode('=', trim($parts[0]), 2);
            if (count($kv) === 2) $cookies[trim($kv[0])] = trim($kv[1]);
        }
    }
    return ['status' => $status, 'raw' => $raw ?: '', 'json' => is_string($raw) ? json_decode($raw, true) : null];
}

function csrfFor(string $baseUrl, array &$cookies): string {
    return (string)(httpJson('GET', "{$baseUrl}/api/auth/csrf.php", $cookies)['json']['csrf_token'] ?? '');
}

$exitCode = 1;
try {
    echo "=== FitSync Athlete Enrollment & Gym Discovery Sync Tests (Tests A-D) ===\n";
    $tag = bin2hex(random_bytes(4));

    // Create Owner + Gym with ZERO membership_plans initially (reproducing the exact enrollment failure scenario)
    $ownerEmail = "gym_sync_owner_{$tag}@fitsync.test";
    $ownerPass  = 'OwnerPass@123';
    $db->prepare("INSERT INTO users (email, mobile, password_hash, role, full_name, status) VALUES (?, ?, ?, 'gym_owner', ?, 'active')")
       ->execute([$ownerEmail, '+919901' . rand(100000, 999999), password_hash($ownerPass, PASSWORD_DEFAULT), "Owner {$tag}"]);
    $ownerId = (int)$db->lastInsertId();
    $createdUserIds[] = $ownerId;
    $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, 'gym_owner')")->execute([$ownerId]);

    $db->prepare("INSERT INTO gyms (owner_user_id, name, email, phone, address_line1, city, state, postal_code, status) VALUES (?, ?, ?, '+912011122233', 'Road 1', 'Pune', 'Maharashtra', '411001', 'active')")
       ->execute([$ownerId, "ZeroPlan Gym {$tag}", "zero_{$tag}@gym.test"]);
    $gym1Id = (int)$db->lastInsertId();
    $createdGymIds[] = $gym1Id;

    // Create Verified Coach linked to Gym 1
    $trEmail = "gym_sync_tr_{$tag}@fitsync.test";
    $trPass  = 'TrainerPass@123';
    $db->prepare("INSERT INTO users (email, mobile, password_hash, role, full_name, status) VALUES (?, ?, ?, 'trainer', ?, 'active')")
       ->execute([$trEmail, '+919902' . rand(100000, 999999), password_hash($trPass, PASSWORD_DEFAULT), "Coach {$tag}"]);
    $trainerId = (int)$db->lastInsertId();
    $createdUserIds[] = $trainerId;
    $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, 'trainer')")->execute([$trainerId]);
    $db->prepare("INSERT INTO trainer_profiles (user_id, certification_name, certifying_body, experience_years, specializations_summary, status) VALUES (?, 'CSCS', 'NSCA', 5, 'Strength', 'verified')")
       ->execute([$trainerId]);
    $db->prepare("INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, status, initiated_by, is_active, joined_at) VALUES (?, ?, 'full_time', 'active', 'gym_owner', 1, CURDATE())")
       ->execute([$gym1Id, $trainerId]);

    $cOwner = [];
    $csrfOwner = csrfFor($baseUrl, $cOwner);
    httpJson('POST', "{$baseUrl}/api/auth/login.php", $cOwner, ['email' => $ownerEmail, 'password' => $ownerPass], $csrfOwner);
    $csrfOwner = csrfFor($baseUrl, $cOwner);

    $cTrainer = [];
    $csrfTrainer = csrfFor($baseUrl, $cTrainer);
    httpJson('POST', "{$baseUrl}/api/auth/login.php", $cTrainer, ['email' => $trEmail, 'password' => $trPass], $csrfTrainer);

    // -------------------------------------------------------------------------
    // TEST A: Athlete Registration & Enrollment
    // -------------------------------------------------------------------------
    echo "\n--- Test A: Athlete Enrollment Fix (Empty Plans + Empty Phones + Full Sync) ---\n";
    $ath1Email = "athlete1_{$tag}@fitsync.test";
    $ath1Pass  = 'AthletePass@2026';
    $enr1 = httpJson('POST', "{$baseUrl}/api/gym_owner/add_member.php", $cOwner, [
        'name'            => "Athlete One {$tag}",
        'email'           => $ath1Email,
        'phone'           => '',
        'gender'          => 'Male',
        'weight'          => 74.0,
        'goal'            => 'Strength',
        'membershipTier'  => 'Gold Monthly',
        'password'        => $ath1Pass,
        'gym_id'          => $gym1Id,
        'assignedCoachId' => 'tr-' . $trainerId
    ], $csrfOwner);
    checkTest($enr1['status'] === 201 && ($enr1['json']['success'] ?? false), "Athlete 1 enrolled on gym with zero prior plans (status={$enr1['status']}, raw=" . substr($enr1['raw'], 0, 120) . ")");
    $ath1Id = (int)($enr1['json']['data']['user_id'] ?? 0);
    if ($ath1Id > 0) $createdUserIds[] = $ath1Id;

    // Second athlete with empty phone too (ensures NULL mobile never triggers unique collision!)
    $ath2Email = "athlete2_{$tag}@fitsync.test";
    $enr2 = httpJson('POST', "{$baseUrl}/api/gym_owner/add_member.php", $cOwner, [
        'name'   => "Athlete Two {$tag}",
        'email'  => $ath2Email,
        'phone'  => '',
        'weight' => 65.0,
        'gym_id' => $gym1Id
    ], $csrfOwner);
    checkTest($enr2['status'] === 201 && ($enr2['json']['success'] ?? false), "Athlete 2 enrolled with blank mobile (zero UNIQUE collision)");
    $ath2Id = (int)($enr2['json']['data']['user_id'] ?? 0);
    if ($ath2Id > 0) $createdUserIds[] = $ath2Id;

    $uCnt1 = (int)$db->query("SELECT COUNT(*) FROM users WHERE email = " . $db->quote($ath1Email))->fetchColumn();
    checkTest($uCnt1 === 1, "Exactly one user record created for Athlete 1");

    $ownerDash = httpJson('GET', "{$baseUrl}/api/gym_owner/dashboard.php?gym_id={$gym1Id}", $cOwner);
    $inOwnerRoster = count(array_filter($ownerDash['json']['data']['members'] ?? [], fn($m) => (int)$m['user_id'] === $ath1Id)) === 1;
    $trDash = httpJson('GET', "{$baseUrl}/api/trainer/dashboard.php", $cTrainer);
    $inTrainerRoster = count(array_filter($trDash['json']['data']['athletes'] ?? [], fn($a) => (int)$a['user_id'] === $ath1Id)) === 1;
    checkTest($inOwnerRoster && $inTrainerRoster, "Athlete 1 synced in Owner Member Roster AND assigned Trainer roster");

    $cAth = [];
    $csrfAth = csrfFor($baseUrl, $cAth);
    $athLogin = httpJson('POST', "{$baseUrl}/api/auth/login.php", $cAth, ['email' => $ath1Email, 'password' => $ath1Pass], $csrfAth);
    $athDash = httpJson('GET', "{$baseUrl}/api/user/dashboard.php", $cAth);
    checkTest(($athLogin['json']['success'] ?? false)
        && (int)($athDash['json']['data']['membership']['gym_id'] ?? 0) === $gym1Id
        && (int)($athDash['json']['data']['trainer']['coach_id'] ?? 0) === $trainerId,
        "Athlete 1 logs into User Portal and sees correct gym, active membership, and assigned Trainer");

    // -------------------------------------------------------------------------
    // TEST B: Gym Registration & User Portal Discovery Sync
    // -------------------------------------------------------------------------
    echo "\n--- Test B: Gym Registration & User Portal Gym Discovery Sync ---\n";
    $newGymName = "Apex Sync Hub {$tag}";
    $regGym = httpJson('POST', "{$baseUrl}/api/gym_owner/gyms.php", $cOwner, [
        'action'               => 'save',
        'name'                 => $newGymName,
        'description'          => 'Strength & turf performance club',
        'address_line1'        => '88FC Tower, Baner',
        'city'                 => 'Pune',
        'state'                => 'Maharashtra',
        'postal_code'          => '411045',
        'phone'                => '+91 20 8899 7766',
        'email'                => "apex_{$tag}@gym.test",
        'capacity'             => 120,
        'open_time'            => '06:00',
        'close_time'           => '22:00',
        'open_sunday'          => 1,
        'facilities_csv'       => 'Olympic Platforms, Steam & Sauna',
        'equipment_csv'        => 'Calibrated Plates, Assault Bikes',
        'plan_name'            => 'Pro Unlimited Pass',
        'plan_price'           => 2999,
        'plan_duration_months' => 1,
        'status'               => 'active'
    ], $csrfOwner);
    $gym2Id = (int)($regGym['json']['data']['id'] ?? 0);
    if ($gym2Id > 0) $createdGymIds[] = $gym2Id;
    $gymRowCount = (int)$db->query("SELECT COUNT(*) FROM gyms WHERE owner_user_id = {$ownerId} AND name = " . $db->quote($newGymName))->fetchColumn();
    checkTest($regGym['status'] === 201 && $gym2Id > 0 && $gymRowCount === 1, "Gym Owner registered Gym 2 cleanly (id={$gym2Id}, count={$gymRowCount})");

    // Check User Portal Gym Discovery (via Ath2 session who has no active membership at Gym 2)
    $cAth2 = [];
    $csrfAth2 = csrfFor($baseUrl, $cAth2);
    httpJson('POST', "{$baseUrl}/api/auth/login.php", $cAth2, ['email' => $ath2Email, 'password' => 'Member@123'], $csrfAth2);
    $csrfAth2 = csrfFor($baseUrl, $cAth2);

    $userDisc = httpJson('GET', "{$baseUrl}/api/user/membership.php?search=" . urlencode("Apex Sync Hub {$tag}"), $cAth2);
    $foundGyms = array_values(array_filter($userDisc['json']['data']['gyms'] ?? [], fn($g) => (int)$g['id'] === $gym2Id));
    $g2 = $foundGyms[0] ?? [];
    checkTest(count($foundGyms) === 1
        && ($g2['phone'] ?? '') === '+91 20 8899 7766'
        && in_array('Steam & Sauna', $g2['facilities'] ?? [], true)
        && count($g2['operating_hours'] ?? []) === 7
        && count($g2['plans'] ?? []) >= 1,
        "User Portal Gym Discovery finds Gym 2 with address, contact, hours, facilities, equipment, and plans");

    $plan2Id = (int)($g2['plans'][0]['id'] ?? 0);
    $memReq = httpJson('POST', "{$baseUrl}/api/user/membership.php", $cAth2, ['action' => 'request', 'gym_id' => $gym2Id, 'plan_id' => $plan2Id], $csrfAth2);
    $ownerG2Dash = httpJson('GET', "{$baseUrl}/api/gym_owner/dashboard.php?gym_id={$gym2Id}", $cOwner);
    $g2Pending = array_filter($ownerG2Dash['json']['data']['membership_requests'] ?? [], fn($r) => (int)$r['user_id'] === $ath2Id && $r['status'] === 'pending');
    checkTest($memReq['status'] === 200 && count($g2Pending) === 1, "Member submitted request for Gym 2 and Owner sees it immediately");

    // -------------------------------------------------------------------------
    // TEST C: Operating Hours Update & Status Visibility Sync
    // -------------------------------------------------------------------------
    echo "\n--- Test C: Operating Hours Update & Active/Inactive Status Sync ---\n";
    $updGym = httpJson('POST', "{$baseUrl}/api/gym_owner/gyms.php", $cOwner, [
        'action'        => 'save',
        'gym_id'        => $gym2Id,
        'name'          => $newGymName,
        'description'   => 'Updated hours schedule',
        'address_line1' => '88FC Tower, Baner',
        'city'          => 'Pune',
        'state'         => 'Maharashtra',
        'postal_code'   => '411045',
        'phone'         => '+91 20 8899 7766',
        'email'         => "apex_{$tag}@gym.test",
        'open_time'     => '05:00',
        'close_time'    => '23:30',
        'open_sunday'   => 0,
        'status'        => 'active'
    ], $csrfOwner);
    $userDiscAfterHr = httpJson('GET', "{$baseUrl}/api/user/membership.php", $cAth2);
    $g2Upd = array_values(array_filter($userDiscAfterHr['json']['data']['gyms'] ?? [], fn($g) => (int)$g['id'] === $gym2Id))[0] ?? [];
    checkTest($updGym['status'] === 200 && str_contains((string)($g2Upd['hours_summary'] ?? ''), '05:00') && str_contains((string)($g2Upd['hours_summary'] ?? ''), '23:30'),
        "Updated operating hours (05:00 - 23:30, Sun Closed) appeared immediately in User Portal");

    // Set Inactive -> hidden from public discovery & blocks new join requests
    httpJson('POST', "{$baseUrl}/api/gym_owner/gyms.php", $cOwner, ['action' => 'set_status', 'gym_id' => $gym2Id, 'status' => 'inactive'], $csrfOwner);
    $userDiscInactive = httpJson('GET', "{$baseUrl}/api/user/membership.php", $cAth2);
    $stillListed = count(array_filter($userDiscInactive['json']['data']['gyms'] ?? [], fn($g) => (int)$g['id'] === $gym2Id));
    $blockedReq = httpJson('POST', "{$baseUrl}/api/user/membership.php", $cAth2, ['action' => 'request', 'gym_id' => $gym2Id, 'plan_id' => $plan2Id], $csrfAth2);
    checkTest($stillListed === 0 && $blockedReq['status'] === 400, "Inactive gym hidden from User Portal discovery and blocks new membership requests (400)");

    // Reactivate -> visible again
    httpJson('POST', "{$baseUrl}/api/gym_owner/gyms.php", $cOwner, ['action' => 'set_status', 'gym_id' => $gym2Id, 'status' => 'active'], $csrfOwner);
    $userDiscReact = httpJson('GET', "{$baseUrl}/api/user/membership.php", $cAth2);
    $relisted = count(array_filter($userDiscReact['json']['data']['gyms'] ?? [], fn($g) => (int)$g['id'] === $gym2Id));
    checkTest($relisted === 1, "Reactivated gym appears again in User Portal Gym Discovery");

    // -------------------------------------------------------------------------
    // TEST D: Duplicate Prevention (Email & Gym)
    // -------------------------------------------------------------------------
    echo "\n--- Test D: Duplicate Athlete & Duplicate Gym Prevention ---\n";
    $dupAth = httpJson('POST', "{$baseUrl}/api/gym_owner/add_member.php", $cOwner, [
        'name' => "Duplicate {$tag}", 'email' => $ath1Email, 'weight' => 70, 'gym_id' => $gym1Id
    ], $csrfOwner);
    $dupGym = httpJson('POST', "{$baseUrl}/api/gym_owner/gyms.php", $cOwner, [
        'action' => 'save', 'name' => $newGymName, 'address_line1' => '88FC Tower',
        'city' => 'Pune', 'state' => 'Maharashtra', 'postal_code' => '411045',
        'phone' => '+91 20 8899 7766', 'email' => "apex_{$tag}@gym.test"
    ], $csrfOwner);
    $athCountAfter = (int)$db->query("SELECT COUNT(*) FROM users WHERE email = " . $db->quote($ath1Email))->fetchColumn();
    $gymCountAfter = (int)$db->query("SELECT COUNT(*) FROM gyms WHERE owner_user_id = {$ownerId} AND name = " . $db->quote($newGymName))->fetchColumn();
    checkTest($dupAth['status'] === 409 && $dupGym['status'] === 409 && $athCountAfter === 1 && $gymCountAfter === 1,
        "Duplicate athlete ({$dupAth['status']}) and duplicate gym ({$dupGym['status']}) rejected with zero extra DB rows");

    echo "\nSUMMARY: PASSED={$passed}, FAILED={$failed}\n";
    $exitCode = $failed > 0 ? 1 : 0;
} finally {
    if (!empty($createdGymIds)) {
        $ph = implode(',', array_fill(0, count($createdGymIds), '?'));
        $db->prepare("DELETE FROM payments WHERE gym_id IN ({$ph})")->execute($createdGymIds);
        $db->prepare("DELETE FROM memberships WHERE gym_id IN ({$ph})")->execute($createdGymIds);
        $db->prepare("DELETE FROM membership_plans WHERE gym_id IN ({$ph})")->execute($createdGymIds);
        $db->prepare("DELETE FROM gyms WHERE id IN ({$ph})")->execute($createdGymIds);
    }
    if (!empty($createdUserIds)) {
        $ph = implode(',', array_fill(0, count($createdUserIds), '?'));
        $db->prepare("DELETE FROM users WHERE id IN ({$ph})")->execute($createdUserIds);
    }
}
exit($exitCode);
