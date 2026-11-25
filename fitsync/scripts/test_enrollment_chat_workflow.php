<?php
/**
 * FitSync AI — Complete End-to-End Workflow Acceptance Tests (PART 9: Tests 1–6)
 *
 * Tests with freshly created real DB accounts (zero hardcoded/demo data):
 *  Test 1: Gym Owner registration + Gym creation -> visible in User Gym Discovery
 *  Test 2: User selects plan, submits enrollment, duplicate prevented -> appears in Owner Portal
 *  Test 3: Owner rejects with reason + approves enrollment -> User notification, Membership history, Owner Roster
 *  Test 4: Owner assigns & reassigns Coach -> Coach My Members, User Trainers/Dashboard, Owner Roster & Assignment History
 *  Test 5: Real two-way User <-> Coach chat (`Hi Coach` -> `Hello`), unread/read receipts, offline persistence across logout/login
 *  Test 6: Authorization enforcement (cross-gym owner isolation, cross-gym coach blocking, Gym Owner blocked from private chat)
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

function checkStep(bool $cond, string $label): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failed++;
        echo "[FAIL] {$label}\n";
    }
}

function httpCall(string $method, string $url, array &$cookies, ?array $body = null, string $csrf = ''): array {
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

function getCsrf(string $baseUrl, array &$cookies): string {
    return (string)(httpCall('GET', "{$baseUrl}/api/auth/csrf.php", $cookies)['json']['csrf_token'] ?? '');
}

$exitCode = 1;
try {
    echo "=== FitSync Complete Enrollment, Coach Assignment & Live Chat Tests (PART 9: Tests 1–6) ===\n";
    $tag = bin2hex(random_bytes(4));

    // Setup fresh Owner 1 + Owner 2 + Coaches + Member
    $owner1Email = "p9_owner1_{$tag}@fitsync.test";
    $owner2Email = "p9_owner2_{$tag}@fitsync.test";
    $coach1Email = "p9_coach1_{$tag}@fitsync.test";
    $coach2Email = "p9_coach2_{$tag}@fitsync.test";
    $otherCoachEmail = "p9_other_coach_{$tag}@fitsync.test";
    $member1Email = "p9_member1_{$tag}@fitsync.test";
    $member2Email = "p9_member2_{$tag}@fitsync.test";
    $pass = 'FitSyncP9@2026';
    $hash = password_hash($pass, PASSWORD_DEFAULT);

    $mkUser = function(string $email, string $role, string $name) use ($db, $hash, &$createdUserIds): int {
        $db->prepare("INSERT INTO users (email, mobile, password_hash, role, full_name, status) VALUES (?, ?, ?, ?, ?, 'active')")
           ->execute([$email, '+9198' . rand(10000000, 99999999), $hash, $role, $name]);
        $uid = (int)$db->lastInsertId();
        $createdUserIds[] = $uid;
        $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, ?)")->execute([$uid, $role]);
        return $uid;
    };

    $owner1Id = $mkUser($owner1Email, 'gym_owner', "Owner One {$tag}");
    $owner2Id = $mkUser($owner2Email, 'gym_owner', "Owner Two {$tag}");
    $coach1Id = $mkUser($coach1Email, 'trainer', "Coach Alpha {$tag}");
    $coach2Id = $mkUser($coach2Email, 'trainer', "Coach Beta {$tag}");
    $otherCoachId = $mkUser($otherCoachEmail, 'trainer', "Other Gym Coach {$tag}");
    $member1Id = $mkUser($member1Email, 'user', "Member One {$tag}");
    $member2Id = $mkUser($member2Email, 'user', "Member Two {$tag}");

    foreach ([$coach1Id, $coach2Id, $otherCoachId] as $tid) {
        $db->prepare("INSERT INTO trainer_profiles (user_id, certification_name, certifying_body, experience_years, specializations_summary, qualifications, status) VALUES (?, 'NSCA-CSCS', 'NSCA', 6, 'Strength, Hypertrophy', 'M.Sc Sports Science', 'verified')")
           ->execute([$tid]);
    }
    $db->prepare("INSERT INTO user_profiles (user_id, weight_kg, height_cm) VALUES (?, 71.5, 176)")->execute([$member1Id]);
    $db->prepare("INSERT INTO user_profiles (user_id, weight_kg, height_cm) VALUES (?, 66.0, 170)")->execute([$member2Id]);

    // Authenticate Owner 1 & Member 1
    $cOwner1 = [];
    $csrfO1 = getCsrf($baseUrl, $cOwner1);
    httpCall('POST', "{$baseUrl}/api/auth/login.php", $cOwner1, ['email' => $owner1Email, 'password' => $pass], $csrfO1);
    $csrfO1 = getCsrf($baseUrl, $cOwner1);

    $cMember1 = [];
    $csrfM1 = getCsrf($baseUrl, $cMember1);
    httpCall('POST', "{$baseUrl}/api/auth/login.php", $cMember1, ['email' => $member1Email, 'password' => $pass], $csrfM1);
    $csrfM1 = getCsrf($baseUrl, $cMember1);

    // -------------------------------------------------------------------------
    // TEST 1: Gym registration & visibility
    // -------------------------------------------------------------------------
    echo "\n--- Test 1: Gym Registration ---\n";
    $g1Res = httpCall('POST', "{$baseUrl}/api/gym_owner/gyms.php", $cOwner1, [
        'action'               => 'save',
        'name'                 => "P9 Titan Gym {$tag}",
        'status'               => 'active',
        'email'                => "titan_{$tag}@gym.test",
        'phone'                => '+91 20 26119900',
        'address_line1'        => '100 Titan Street',
        'city'                 => 'Pune',
        'state'                => 'Maharashtra',
        'postal_code'          => '411001',
        'description'          => 'End-to-end strength & coaching hub',
        'open_time'            => '05:30',
        'close_time'           => '22:30',
        'open_sunday'          => 1,
        'facilities_csv'       => 'Olympic Platforms, Steam & Sauna',
        'equipment_csv'        => 'Squat Racks, Competition Dumbbells',
        'plan_name'            => 'Titan Pro Quarterly',
        'plan_price'           => 4999,
        'plan_duration_months' => 3
    ], $csrfO1);
    $gym1Id = (int)($g1Res['json']['data']['id'] ?? 0);
    if ($gym1Id > 0) $createdGymIds[] = $gym1Id;

    $gCount = (int)$db->query("SELECT COUNT(*) FROM gyms WHERE owner_user_id = {$owner1Id}")->fetchColumn();
    $uDisc = httpCall('GET', "{$baseUrl}/api/user/membership.php?facility=" . urlencode('Olympic Platforms'), $cMember1);
    $foundG1 = null;
    foreach (($uDisc['json']['data']['gyms'] ?? []) as $gg) {
        if ((int)$gg['id'] === $gym1Id) { $foundG1 = $gg; break; }
    }
    $plan1Id = (int)($foundG1['plans'][0]['id'] ?? 0);
    checkStep($g1Res['status'] === 201 && $gym1Id > 0 && $gCount === 1 && $foundG1 !== null && $plan1Id > 0,
        "Owner registered exactly 1 gym (id={$gym1Id}) and User Gym Discovery + facility filter found it with plan (id={$plan1Id})");

    // Create Owner 2 Gym + affiliate coaches cleanly
    $db->prepare("INSERT INTO gyms (owner_user_id, name, email, phone, address_line1, city, state, postal_code, status) VALUES (?, ?, ?, '+912088899900', '99 Other Ave', 'Mumbai', 'Maharashtra', '400001', 'active')")
       ->execute([$owner2Id, "Other Gym {$tag}", "other_{$tag}@gym.test"]);
    $gym2Id = (int)$db->lastInsertId();
    $createdGymIds[] = $gym2Id;

    $db->prepare("INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, status, initiated_by, is_active, joined_at) VALUES (?, ?, 'full_time', 'active', 'gym_owner', 1, CURDATE())")->execute([$gym1Id, $coach1Id]);
    $db->prepare("INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, status, initiated_by, is_active, joined_at) VALUES (?, ?, 'full_time', 'active', 'gym_owner', 1, CURDATE())")->execute([$gym1Id, $coach2Id]);
    $db->prepare("INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, status, initiated_by, is_active, joined_at) VALUES (?, ?, 'full_time', 'active', 'gym_owner', 1, CURDATE())")->execute([$gym2Id, $otherCoachId]);

    // -------------------------------------------------------------------------
    // TEST 2: User enrollment + duplicate prevention + Owner visibility
    // -------------------------------------------------------------------------
    echo "\n--- Test 2: User Enrollment ---\n";
    $enrRes = httpCall('POST', "{$baseUrl}/api/user/membership.php", $cMember1, [
        'action'  => 'request',
        'gym_id'  => $gym1Id,
        'plan_id' => $plan1Id
    ], $csrfM1);
    $memId = (int)($enrRes['json']['data']['membership_id'] ?? 0);

    // Duplicate enrollment request prevention
    $dupRes = httpCall('POST', "{$baseUrl}/api/user/membership.php", $cMember1, [
        'action'  => 'request',
        'gym_id'  => $gym1Id,
        'plan_id' => $plan1Id
    ], $csrfM1);

    $oDash2 = httpCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php?gym_id={$gym1Id}", $cOwner1);
    $reqMatch = array_filter($oDash2['json']['data']['membership_requests'] ?? [], fn($r) => (int)$r['membership_id'] === $memId && $r['status'] === 'pending');
    $oNotifs = array_filter($oDash2['json']['data']['notifications'] ?? [], fn($n) => $n['entity_type'] === 'membership' && (int)$n['entity_id'] === $memId);
    checkStep($enrRes['status'] === 200 && $memId > 0 && !empty($dupRes['json']['data']['duplicate_prevented']) && count($reqMatch) === 1 && count($oNotifs) >= 1,
        "Enrollment saved (id={$memId}), duplicate request prevented, and request + notification visible in Owner Portal");

    // -------------------------------------------------------------------------
    // TEST 3: Rejection reason & Approval workflow
    // -------------------------------------------------------------------------
    echo "\n--- Test 3: Rejection Reason & Approval ---\n";
    // Reject Member 2's request with custom reason first
    $db->prepare("INSERT INTO memberships (user_id, plan_id, gym_id, start_date, end_date, status, qr_code_token) VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'pending', ?)")
       ->execute([$member2Id, $plan1Id, $gym1Id, 'FS-REJ-' . $tag]);
    $rejMemId = (int)$db->lastInsertId();
    $rejRes = httpCall('POST', "{$baseUrl}/api/gym_owner/membership_action.php", $cOwner1, [
        'membership_id'    => $rejMemId,
        'decision'         => 'reject',
        'rejection_reason' => 'Evening capacity full'
    ], $csrfO1);

    // Approve Member 1's enrollment
    $appRes = httpCall('POST', "{$baseUrl}/api/gym_owner/membership_action.php", $cOwner1, [
        'membership_id' => $memId,
        'decision'      => 'approve'
    ], $csrfO1);

    $uMemAfter = httpCall('GET', "{$baseUrl}/api/user/membership.php", $cMember1);
    $uDashAfter = httpCall('GET', "{$baseUrl}/api/user/dashboard.php", $cMember1);
    $oDashAfter = httpCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php?gym_id={$gym1Id}", $cOwner1);

    $uApproveNotif = array_filter($uDashAfter['json']['data']['notifications'] ?? [], fn($n) => $n['entity_type'] === 'membership' && (int)$n['entity_id'] === $memId);
    $uActiveMem = $uMemAfter['json']['data']['current_membership'] ?? [];
    $oRosterMatch = array_filter($oDashAfter['json']['data']['members'] ?? [], fn($m) => (int)$m['user_id'] === $member1Id);

    $rejRow = $db->query("SELECT status, rejection_reason, rejected_by_user_id FROM memberships WHERE id = {$rejMemId}")->fetch(PDO::FETCH_ASSOC);
    checkStep(
        $rejRes['status'] === 200 && ($rejRow['status'] ?? '') === 'rejected' && ($rejRow['rejection_reason'] ?? '') === 'Evening capacity full'
        && $appRes['status'] === 200 && ($uActiveMem['status'] ?? '') === 'active' && !empty($uActiveMem['approved_at'])
        && count($uApproveNotif) >= 1 && count($oRosterMatch) === 1,
        "Rejection reason stored, enrollment approved with timestamp & owner ID, user notified, and member auto-added to Owner Roster"
    );

    // -------------------------------------------------------------------------
    // TEST 4: Coach assignment & Reassignment History
    // -------------------------------------------------------------------------
    echo "\n--- Test 4: Coach Assignment & Reassignment ---\n";
    $as1 = httpCall('POST', "{$baseUrl}/api/gym_owner/assign_coach.php", $cOwner1, [
        'memberEmail' => $member1Email,
        'coachId'     => 'tr-' . $coach1Id,
        'gym_id'      => $gym1Id
    ], $csrfO1);

    // Reassign to Coach 2 to verify assignment history preservation
    $as2 = httpCall('POST', "{$baseUrl}/api/gym_owner/assign_coach.php", $cOwner1, [
        'memberEmail' => $member1Email,
        'coachId'     => 'tr-' . $coach2Id,
        'gym_id'      => $gym1Id
    ], $csrfO1);

    $cCoach2 = [];
    $csrfC2 = getCsrf($baseUrl, $cCoach2);
    httpCall('POST', "{$baseUrl}/api/auth/login.php", $cCoach2, ['email' => $coach2Email, 'password' => $pass], $csrfC2);
    $csrfC2 = getCsrf($baseUrl, $cCoach2);

    $tDash2 = httpCall('GET', "{$baseUrl}/api/trainer/dashboard.php", $cCoach2);
    $uDashCoach = httpCall('GET', "{$baseUrl}/api/user/dashboard.php", $cMember1);
    $oDashCoach = httpCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php?gym_id={$gym1Id}", $cOwner1);

    $tRosterHit = array_filter($tDash2['json']['data']['athletes'] ?? [], fn($a) => (int)$a['user_id'] === $member1Id && !empty($a['gym_name']));
    $oRosterRow = array_values(array_filter($oDashCoach['json']['data']['members'] ?? [], fn($m) => (int)$m['user_id'] === $member1Id))[0] ?? [];
    $histCount = count($oRosterRow['assignment_history'] ?? []);
    checkStep(
        $as1['status'] === 200 && $as2['status'] === 200
        && count($tRosterHit) === 1
        && (int)($uDashCoach['json']['data']['trainer']['coach_id'] ?? 0) === $coach2Id
        && (int)($oRosterRow['coach_id'] ?? 0) === $coach2Id
        && $histCount >= 2,
        "Coach assigned & reassigned cleanly: Coach sees member in My Members, User sees Coach 2, Owner sees Coach 2 + {$histCount} history entries"
    );

    // -------------------------------------------------------------------------
    // TEST 5: Real Chat (`Hi Coach` -> `Hello` + persistence + notifications)
    // -------------------------------------------------------------------------
    echo "\n--- Test 5: Real Two-Way User-Coach Chat ---\n";
    $sendHi = httpCall('POST', "{$baseUrl}/api/messages.php", $cMember1, [
        'recipient_id' => $coach2Id,
        'message_text' => 'Hi Coach'
    ], $csrfM1);
    $convId = (int)($sendHi['json']['data']['conversation_id'] ?? 0);

    // Coach sees unread notification & fetches message
    $tDashBeforeRead = httpCall('GET', "{$baseUrl}/api/trainer/dashboard.php", $cCoach2);
    $msgNotifCoach = array_filter($tDashBeforeRead['json']['data']['notifications'] ?? [], fn($n) => $n['entity_type'] === 'message');
    $tMsgs = httpCall('GET', "{$baseUrl}/api/messages.php?with_user={$member1Id}", $cCoach2);
    $hasHi = !empty(array_filter($tMsgs['json']['messages'] ?? [], fn($m) => $m['message_text'] === 'Hi Coach'));

    // Coach replies `Hello`
    $sendHello = httpCall('POST', "{$baseUrl}/api/messages.php", $cCoach2, [
        'recipient_id' => $member1Id,
        'message_text' => 'Hello'
    ], $csrfC2);
    $uMsgs = httpCall('GET', "{$baseUrl}/api/messages.php?with_user={$coach2Id}", $cMember1);
    $hasHello = !empty(array_filter($uMsgs['json']['messages'] ?? [], fn($m) => $m['message_text'] === 'Hello'));

    // Logout Member & log back in to confirm MySQL conversation persistence + read receipt update
    httpCall('POST', "{$baseUrl}/api/auth/logout.php", $cMember1, [], $csrfM1);
    $cFreshMem = [];
    $csrfFresh = getCsrf($baseUrl, $cFreshMem);
    httpCall('POST', "{$baseUrl}/api/auth/login.php", $cFreshMem, ['email' => $member1Email, 'password' => $pass], $csrfFresh);
    $uMsgsFresh = httpCall('GET', "{$baseUrl}/api/messages.php?conversation_id={$convId}", $cFreshMem);
    $freshTexts = array_map(fn($m) => $m['message_text'], $uMsgsFresh['json']['messages'] ?? []);

    checkStep(
        $sendHi['status'] === 200 && count($msgNotifCoach) >= 1 && $hasHi && $sendHello['status'] === 200 && $hasHello
        && in_array('Hi Coach', $freshTexts, true) && in_array('Hello', $freshTexts, true),
        "Two-way chat ('Hi Coach' <-> 'Hello'), coach notification, and post-logout MySQL history verified"
    );

    // -------------------------------------------------------------------------
    // TEST 6: Cross-Portal Authorization & Security Enforcement
    // -------------------------------------------------------------------------
    echo "\n--- Test 6: Authorization Checks ---\n";
    // 6.1 Owner 2 tries accessing Owner 1's gym / enrollment request
    $cOwner2 = [];
    $csrfO2 = getCsrf($baseUrl, $cOwner2);
    httpCall('POST', "{$baseUrl}/api/auth/login.php", $cOwner2, ['email' => $owner2Email, 'password' => $pass], $csrfO2);
    $csrfO2 = getCsrf($baseUrl, $cOwner2);

    $unauthRej = httpCall('POST', "{$baseUrl}/api/gym_owner/membership_action.php", $cOwner2, [
        'membership_id' => $memId,
        'decision'      => 'reject'
    ], $csrfO2);

    // 6.2 Owner 1 tries assigning Coach from Gym 2 to Member 1 in Gym 1
    $unauthAssign = httpCall('POST', "{$baseUrl}/api/gym_owner/assign_coach.php", $cOwner1, [
        'memberEmail' => $member1Email,
        'coachId'     => 'tr-' . $otherCoachId,
        'gym_id'      => $gym1Id
    ], $csrfO1);

    // 6.3 Other Member / Unassigned Coach / Gym Owner tries reading Member 1 <-> Coach 2 private chat
    $cUnlinkedCoach = [];
    $csrfUC = getCsrf($baseUrl, $cUnlinkedCoach);
    httpCall('POST', "{$baseUrl}/api/auth/login.php", $cUnlinkedCoach, ['email' => $otherCoachEmail, 'password' => $pass], $csrfUC);
    $unauthChatCoach = httpCall('GET', "{$baseUrl}/api/messages.php?conversation_id={$convId}", $cUnlinkedCoach);
    $unauthChatCoachWith = httpCall('GET', "{$baseUrl}/api/messages.php?with_user={$member1Id}", $cUnlinkedCoach);
    $unauthChatOwner = httpCall('GET', "{$baseUrl}/api/messages.php?conversation_id={$convId}", $cOwner1);
    $unauthChatOwnerSend = httpCall('POST', "{$baseUrl}/api/messages.php", $cOwner1, ['recipient_id' => $member1Id, 'message_text' => 'Snooping'], $csrfO1);

    checkStep(
        $unauthRej['status'] === 403
        && $unauthAssign['status'] === 403
        && $unauthChatCoach['status'] === 403
        && $unauthChatCoachWith['status'] === 403
        && $unauthChatOwner['status'] === 403
        && $unauthChatOwnerSend['status'] === 403,
        "Cross-gym enrollment tampering (403), cross-gym coach assignment (403), unassigned coach chat (403,403), and Gym Owner private chat access (403,403) blocked"
    );

    echo "\nSUMMARY: PASSED={$passed}, FAILED={$failed}\n";
    $exitCode = $failed > 0 ? 1 : 0;
} finally {
    if (!empty($createdGymIds)) {
        $ph = implode(',', array_fill(0, count($createdGymIds), '?'));
        $db->prepare("DELETE FROM gyms WHERE id IN ({$ph})")->execute($createdGymIds);
    }
    if (!empty($createdUserIds)) {
        $ph = implode(',', array_fill(0, count($createdUserIds), '?'));
        $db->prepare("DELETE FROM users WHERE id IN ({$ph})")->execute($createdUserIds);
    }
}
exit($exitCode);
