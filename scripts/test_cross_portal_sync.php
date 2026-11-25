<?php
/**
 * FitSync Cross-Portal End-to-End Integration & Security Acceptance Test Suite
 * Tests live HTTP endpoints on http://127.0.0.1:8080 across 4 separate cookie-jar sessions.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

$baseUrl = 'http://127.0.0.1:8080';
$ts = time() . '_' . random_int(100, 999);

class HttpSession {
    public string $name;
    public string $baseUrl;
    public string $cookieFile;
    public string $csrfToken = '';
    public ?array $user = null;

    public function __construct(string $name, string $baseUrl) {
        $this->name = $name;
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->cookieFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'fitsync_test_' . $name . '_' . getmypid() . '.cookies';
        if (file_exists($this->cookieFile)) {
            @unlink($this->cookieFile);
        }
    }

    public function __destruct() {
        if (file_exists($this->cookieFile)) {
            @unlink($this->cookieFile);
        }
    }

    public function request(string $method, string $path, $body = null, bool $sendCsrf = true, ?string $overrideCsrf = null): array {
        $ch = curl_init($this->baseUrl . '/' . ltrim($path, '/'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $this->cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->cookieFile);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $headers = ['Accept: application/json'];
        if ($body !== null) {
            $payload = is_string($body) ? $body : json_encode($body);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            $headers[] = 'Content-Type: application/json';
        }
        if ($overrideCsrf !== null) {
            $headers[] = 'X-CSRF-Token: ' . $overrideCsrf;
        } elseif ($sendCsrf && strtoupper($method) !== 'GET' && $this->csrfToken !== '') {
            $headers[] = 'X-CSRF-Token: ' . $this->csrfToken;
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $raw = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        $json = is_string($raw) ? json_decode($raw, true) : null;
        if (is_array($json) && !empty($json['csrf_token'])) {
            $this->csrfToken = $json['csrf_token'];
        }
        return ['status' => $code, 'json' => $json, 'raw' => $raw, 'err' => $err];
    }

    public function refreshMe(): array {
        $res = $this->request('GET', 'api/auth/me.php');
        if (!empty($res['json']['csrf_token'])) {
            $this->csrfToken = $res['json']['csrf_token'];
        }
        $this->user = $res['json']['user'] ?? null;
        return $res;
    }

    public function login(string $email, string $password): array {
        $this->refreshMe();
        $res = $this->request('POST', 'api/auth/login.php', [
            'email' => $email,
            'password' => $password
        ]);
        $this->refreshMe();
        return $res;
    }
}

$passed = 0;
$failed = 0;

function assertTrue(bool $cond, string $label, string $detail = ''): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failed++;
        echo "[FAIL] {$label}" . ($detail !== '' ? " -> {$detail}" : "") . "\n";
    }
}

$pdo = FitSyncDataService::getInstance()->getDb();
if (!$pdo) {
    fwrite(STDERR, "MySQL connection failed.\n");
    exit(1);
}

echo "=== FITSYNC CROSS-PORTAL INTEGRATION & SECURITY TESTS ({$ts}) ===\n\n";

$ownerSess = new HttpSession('owner', $baseUrl);
$trainerSess = new HttpSession('trainer', $baseUrl);
$userSess = new HttpSession('user', $baseUrl);
$otherSess = new HttpSession('other', $baseUrl);
$anonSess = new HttpSession('anon', $baseUrl);

$testUserEmail = "sync_user_{$ts}@fitsync.test";
$testOtherEmail = "sync_other_{$ts}@fitsync.test";
$testCoachEmail = "sync_coach_{$ts}@fitsync.test";
$passWord = 'SyncTest@123';

// Login seeded owner@fitzone.com
$ownerLogin = $ownerSess->login('owner@fitzone.com', 'password123');
assertTrue($ownerLogin['status'] === 200 && !empty($ownerLogin['json']['success']), 'Owner login succeeds', json_encode($ownerLogin));

// -----------------------------------------------------------------------------
// TEST 6 PART 1: User registration isolation + Membership approval + Coach CRUD
// -----------------------------------------------------------------------------
$otherSess->refreshMe();
$regOther = $otherSess->request('POST', 'api/auth/register.php', [
    'full_name' => 'Sync Other Member',
    'email' => $testOtherEmail,
    'password' => $passWord,
    'mobile' => '9990001112',
    'role' => 'user',
    'weight_kg' => 68.0,
    'height_cm' => 172,
    'age' => 26,
    'goal' => 'General Fitness'
]);
assertTrue(in_array($regOther['status'], [200, 201], true) && !empty($regOther['json']['success']), 'Other user registers without gym_id', json_encode($regOther));

$userSess->refreshMe();
$regUser = $userSess->request('POST', 'api/auth/register.php', [
    'full_name' => 'Sync Primary Athlete',
    'email' => $testUserEmail,
    'password' => $passWord,
    'mobile' => '9990001111',
    'role' => 'user',
    'weight_kg' => 72.0,
    'height_cm' => 176,
    'age' => 25,
    'goal' => 'Muscle Gain'
]);
$userSess->refreshMe();
$userId = (int)($userSess->user['id'] ?? 0);
assertTrue($userId > 0, 'Primary test athlete registered & authenticated', "userId={$userId}");

$ownerDashBefore = $ownerSess->request('GET', 'api/gym_owner/dashboard.php');
$ownerMembersBefore = $ownerDashBefore['json']['data']['members'] ?? [];
$foundBefore = array_filter($ownerMembersBefore, fn($m) => ($m['email'] ?? '') === $testUserEmail);
assertTrue(count($foundBefore) === 0, 'TEST 6a: Newly registered user does NOT appear in Gym Owner active roster before gym membership approval');

// Request gym membership as Primary User -> FitZone (gym_id=1, first active plan)
$memGet = $userSess->request('GET', 'api/user/membership.php');
$gyms = $memGet['json']['data']['gyms'] ?? [];
$gymId = (int)($gyms[0]['id'] ?? 1);
$planId = (int)($gyms[0]['plans'][0]['id'] ?? 1);

$reqMem = $userSess->request('POST', 'api/user/membership.php', [
    'action' => 'request',
    'gym_id' => $gymId,
    'plan_id' => $planId
]);
$memReqId = (int)($reqMem['json']['data']['membership_id'] ?? 0);
assertTrue($reqMem['status'] === 200 && $memReqId > 0, 'User submits pending membership request', json_encode($reqMem));

// Unapproved user / pending user check-in blocked (TEST 4a)
$pendingCheckIn = $userSess->request('POST', 'api/attendance.php', ['gym_id' => $gymId, 'action' => 'check_in', 'method' => 'turnstile']);
assertTrue($pendingCheckIn['status'] === 403 || empty($pendingCheckIn['json']['success']), 'TEST 4a: Pending/unapproved member cannot check in at turnstile');

// Gym Owner approves membership -> creates payment & activates membership
$approveRes = $ownerSess->request('POST', 'api/gym_owner/membership_action.php', [
    'membership_id' => $memReqId,
    'decision' => 'approve'
]);
assertTrue($approveRes['status'] === 200 && !empty($approveRes['json']['success']), 'Gym Owner approves membership request', json_encode($approveRes));

$ownerDashAfter = $ownerSess->request('GET', 'api/gym_owner/dashboard.php');
$ownerMembersAfter = $ownerDashAfter['json']['data']['members'] ?? [];
$foundAfter = array_filter($ownerMembersAfter, fn($m) => ($m['email'] ?? '') === $testUserEmail);
assertTrue(count($foundAfter) === 1, 'TEST 6b: Approved user appears in Gym Owner active roster');

// Gym Owner adds Coach + prevents duplicate email (TEST 6c)
$addCoach = $ownerSess->request('POST', 'api/gym_owner/add_coach.php', [
    'name' => 'Sync Test Coach',
    'email' => $testCoachEmail,
    'phone' => '9888877777',
    'title' => 'Strength Specialist',
    'experience' => 5,
    'hourlyRate' => 1500,
    'specialties' => 'Hypertrophy, Strength'
]);
assertTrue($addCoach['status'] === 200 && !empty($addCoach['json']['success']), 'Gym Owner creates Coach in MySQL', json_encode($addCoach));

$dupCoach = $ownerSess->request('POST', 'api/gym_owner/add_coach.php', [
    'name' => 'Duplicate Coach',
    'email' => $testCoachEmail,
    'phone' => '9888877777',
    'title' => 'Coach',
    'experience' => 2,
    'hourlyRate' => 1000
]);
assertTrue(empty($dupCoach['json']['success']), 'TEST 6c: Duplicate coach creation prevented cleanly');

// Set deterministic password for test coach & login Trainer session cleanly
$coachRow = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
$coachRow->execute([$testCoachEmail]);
$coachUserId = (int)$coachRow->fetchColumn();
$pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([password_hash($passWord, PASSWORD_BCRYPT), $coachUserId]);

$trLogin = $trainerSess->login($testCoachEmail, $passWord);
assertTrue($trLogin['status'] === 200 && ($trainerSess->user['role'] ?? '') === 'trainer', 'Trainer logs in with isolated session', json_encode($trLogin));

// Gym Owner assigns Coach to Primary User
$assignRes = $ownerSess->request('POST', 'api/gym_owner/assign_coach.php', [
    'memberEmail' => $testUserEmail,
    'coachId' => 'tr-' . $coachUserId
]);
assertTrue($assignRes['status'] === 200 && !empty($assignRes['json']['success']), 'Gym Owner assigns Coach to Athlete', json_encode($assignRes));

// -----------------------------------------------------------------------------
// TEST 1: User Profile & Weight Sync (72 -> 73 kg, history preserved)
// -----------------------------------------------------------------------------
$m1 = $userSess->request('POST', 'api/user/measurements.php', ['weight' => 72.0, 'notes' => 'Baseline 72kg']);
$m2 = $userSess->request('POST', 'api/user/profile.php', [
    'action' => 'save_body_stats',
    'weight' => 73.0,
    'height' => 176.0,
    'age' => 25,
    'goal' => 'Build Muscle',
    'activity_level' => 'moderately_active'
]);
$m3 = $userSess->request('POST', 'api/user/profile.php', [
    'action' => 'save_profile_details',
    'full_name' => 'Sync Primary Athlete Updated',
    'mobile' => '9876543210'
]);
assertTrue(!empty($m1['json']['success']) && !empty($m2['json']['success']) && !empty($m3['json']['success']), 'User updates profile, phone, and records 72 -> 73 kg');

$dossierT1 = $trainerSess->request('GET', "api/trainer/member_dossier.php?member_id={$userId}");
$dData = $dossierT1['json']['data'] ?? [];
$histWeights = array_map(fn($x) => (float)$x['weight_kg'], $dData['measurement']['history'] ?? []);
assertTrue(
    ($dData['athlete']['full_name'] ?? '') === 'Sync Primary Athlete Updated' &&
    (float)($dData['athlete']['weight_kg'] ?? 0) === 73.0 &&
    in_array(72.0, $histWeights, true) && in_array(73.0, $histWeights, true),
    'TEST 1: Trainer Dossier reflects updated name, latest 73 kg weight, and preserves 72 kg history',
    json_encode($dData['athlete'] ?? []) . ' hist=' . json_encode($histWeights)
);

// -----------------------------------------------------------------------------
// TEST 2: Real-Time Two-Way Chat Synchronization & Persistence
// -----------------------------------------------------------------------------
$sendHi = $userSess->request('POST', 'api/messages.php', [
    'with_user' => $coachUserId,
    'message_text' => 'Hi'
]);
assertTrue(!empty($sendHi['json']['success']), 'User sends "Hi" to assigned Trainer');

$trFetch1 = $trainerSess->request('GET', "api/messages.php?with_user={$userId}");
$trMsgs1 = $trFetch1['json']['messages'] ?? [];
$hasHi = count(array_filter($trMsgs1, fn($m) => ($m['message_text'] ?? '') === 'Hi')) >= 1;
assertTrue($hasHi, 'TEST 2a: Trainer receives "Hi" and marks conversation read');

$sendHello = $trainerSess->request('POST', 'api/messages.php', [
    'with_user' => $userId,
    'message_text' => 'Hello'
]);
assertTrue(!empty($sendHello['json']['success']), 'Trainer replies "Hello" to Athlete');

$uFetch2 = $userSess->request('GET', "api/messages.php?with_user={$coachUserId}");
$uMsgs2 = $uFetch2['json']['messages'] ?? [];
$hiRead = false;
$hasHello = false;
foreach ($uMsgs2 as $m) {
    if (($m['message_text'] ?? '') === 'Hi' && (int)$m['is_read'] === 1) $hiRead = true;
    if (($m['message_text'] ?? '') === 'Hello') $hasHello = true;
}
assertTrue($hasHello && $hiRead, 'TEST 2b: User sees Trainer reply "Hello" and sees "Hi" read receipt', json_encode($uMsgs2));

// Re-login user in fresh session and verify persistence
$freshUser = new HttpSession('user_fresh', $baseUrl);
$freshUser->login($testUserEmail, $passWord);
$uFetchFresh = $freshUser->request('GET', "api/messages.php?with_user={$coachUserId}");
$freshCount = count($uFetchFresh['json']['messages'] ?? []);
assertTrue($freshCount >= 2, 'TEST 2c: Chat messages persist across fresh login/page reload', "count={$freshCount}");

// -----------------------------------------------------------------------------
// TEST 3: Workout Plan Assignment & Session Completion Sync
// -----------------------------------------------------------------------------
$exId = (int)$pdo->query("SELECT id FROM exercises ORDER BY id ASC LIMIT 1")->fetchColumn();
$createWk = $trainerSess->request('POST', 'api/trainer/workouts.php', [
    'name' => 'Sync Strength Block',
    'goal' => 'strength',
    'description' => 'Progressive compound lifts',
    'exercise_ids' => [$exId],
    'target_sets' => 4,
    'target_reps' => '8',
    'assign_to_member_id' => $userId
]);
assertTrue(!empty($createWk['json']['success']), 'Trainer creates & assigns "Sync Strength Block"', json_encode($createWk));

$userWk = $userSess->request('GET', 'api/workouts.php');
$planName = $userWk['json']['data']['plan']['plan_name'] ?? ($userWk['json']['data']['plan']['name'] ?? '');
$firstDayId = (int)($userWk['json']['data']['days'][0]['id'] ?? 0);
assertTrue($planName === 'Sync Strength Block' && $firstDayId > 0, 'TEST 3a: User Workouts API returns newly assigned plan', "planName={$planName}");

$completeWk = $userSess->request('POST', 'api/workouts.php', [
    'action' => 'complete_session',
    'plan_day_id' => $firstDayId,
    'duration_minutes' => 50,
    'exercises' => [[
        'exercise_id' => $exId,
        'sets' => [
            ['set' => 1, 'reps' => 8, 'weight' => 80],
            ['set' => 2, 'reps' => 8, 'weight' => 80]
        ]
    ]]
]);
assertTrue(!empty($completeWk['json']['success']) && (float)($completeWk['json']['data']['total_volume_kg'] ?? 0) === 1280.0, 'User completes workout session (volume 1280 kg)');

$trDashWk = $trainerSess->request('GET', 'api/trainer/dashboard.php');
$recentSessions = $trDashWk['json']['data']['recent_workouts'] ?? [];
$trColVol = (float)($trDashWk['json']['data']['stats']['collective_volume'] ?? 0);
assertTrue(count($recentSessions) >= 1 && $trColVol >= 1280.0, 'TEST 3b: Trainer dashboard reflects real completed workout session & 1280 kg volume', "vol={$trColVol}");

// -----------------------------------------------------------------------------
// TEST 4b: Attendance Sync Across All 3 Portals + Duplicate Prevention
// -----------------------------------------------------------------------------
$checkIn1 = $userSess->request('POST', 'api/attendance.php', ['gym_id' => $gymId, 'action' => 'check_in', 'method' => 'turnstile']);
assertTrue(!empty($checkIn1['json']['success']) && empty($checkIn1['json']['data']['already_checked_in']), 'Active member check-in succeeds');

$checkInDup = $userSess->request('POST', 'api/attendance.php', ['gym_id' => $gymId, 'action' => 'check_in', 'method' => 'turnstile']);
$attCountStmt = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE user_id = ? AND DATE(check_in_time) = CURDATE()");
$attCountStmt->execute([$userId]);
$todayAttRows = (int)$attCountStmt->fetchColumn();
assertTrue(
    (!empty($checkInDup['json']['data']['already_checked_in']) || empty($checkInDup['json']['success'])) && $todayAttRows === 1,
    'TEST 4b: Duplicate same-day check-in prevented (single row retained in MySQL)',
    "rows={$todayAttRows} resp=" . json_encode($checkInDup)
);

$trAttDash = $trainerSess->request('GET', 'api/trainer/dashboard.php');
$ownerAttDash = $ownerSess->request('GET', 'api/gym_owner/dashboard.php');
$trLogs = array_filter($trAttDash['json']['data']['attendance_logs'] ?? [], fn($l) => (int)$l['user_id'] === $userId);
$ownerLogs = array_filter($ownerAttDash['json']['data']['turnstile_logs'] ?? [], fn($l) => (int)$l['user_id'] === $userId);
assertTrue(count($trLogs) >= 1 && count($ownerLogs) >= 1, 'TEST 4c: Check-in synced to Trainer attendance logs and Gym Owner turnstile telemetry');

// -----------------------------------------------------------------------------
// TEST 5: Meal Logging Add/Delete Totals & Trainer Privacy Permission Gate
// -----------------------------------------------------------------------------
$addMeal = $userSess->request('POST', 'api/meals.php', [
    'food_name' => 'Sync Chicken Bowl',
    'meal_type' => 'lunch',
    'calories' => 650,
    'protein_g' => 45,
    'carbs_g' => 60,
    'fat_g' => 18
]);
$mealId = (int)($addMeal['json']['data']['id'] ?? 0);
$mealsGetAfterAdd = $userSess->request('GET', 'api/meals.php');
$addedTotalCal = (int)($mealsGetAfterAdd['json']['data']['totals']['calories'] ?? 0);
assertTrue($mealId > 0 && $addedTotalCal === 650, 'TEST 5a: Meal logged with accurate 650 kcal total', "mealId={$mealId} cal={$addedTotalCal}");

$trSeeNut = $trainerSess->request('GET', "api/trainer/member_dossier.php?member_id={$userId}");
assertTrue((int)($trSeeNut['json']['data']['nutrition']['calories'] ?? 0) === 650, 'TEST 5b: Trainer sees 650 kcal when nutrition permission enabled');

// Revoke nutrition permission
$revokePerm = $userSess->request('POST', 'api/user/profile.php', [
    'action' => 'save_data_permissions',
    'can_view_measurements' => 1,
    'can_view_nutrition' => 0,
    'can_view_assessments' => 1
]);
$trBlockedNut = $trainerSess->request('GET', "api/trainer/member_dossier.php?member_id={$userId}");
assertTrue(
    !empty($revokePerm['json']['success']) && !empty($trBlockedNut['json']['data']['nutrition']['restricted']),
    'TEST 5c: Trainer dossier hides nutrition when member revokes permission'
);

// Delete meal -> totals drop back to 0
$delMeal = $userSess->request('DELETE', 'api/meals.php', ['id' => $mealId]);
$mealsGetAfterDel = $userSess->request('GET', 'api/meals.php');
$afterDelCal = (int)($mealsGetAfterDel['json']['data']['totals']['calories'] ?? -1);
assertTrue(!empty($delMeal['json']['success']) && $afterDelCal === 0, 'TEST 5d: Deleting meal recalculates totals down to 0', "afterDelCal={$afterDelCal}");

// -----------------------------------------------------------------------------
// TEST 6d: Gym Owner Deactivates Coach
// -----------------------------------------------------------------------------
$delCoach = $ownerSess->request('POST', 'api/gym_owner/delete_user.php', ['coach_id' => 'tr-' . $coachUserId]);
$ownerAfterDel = $ownerSess->request('GET', 'api/gym_owner/dashboard.php');
$stillActiveCoach = array_filter($ownerAfterDel['json']['data']['coaches'] ?? [], fn($c) => (int)($c['user_id'] ?? 0) === $coachUserId);
assertTrue(!empty($delCoach['json']['success']) && count($stillActiveCoach) === 0, 'TEST 6d: Deactivated coach removed from active Gym Owner roster');

// -----------------------------------------------------------------------------
// TEST 7: Security & Authorization Bypass Resistance
// -----------------------------------------------------------------------------
$unauthDash = $anonSess->request('GET', 'api/user/dashboard.php');
assertTrue($unauthDash['status'] === 401, 'TEST 7a: Unauthenticated user receives 401');

$badCsrf = $userSess->request('POST', 'api/meals.php', ['food_name' => 'Hack', 'calories' => 100], true, 'INVALID_CSRF_TOKEN');
assertTrue($badCsrf['status'] === 403, 'TEST 7b: Invalid CSRF token rejected with 403');

$memberHitTrainer = $userSess->request('GET', 'api/trainer/dashboard.php');
$memberHitOwner = $userSess->request('GET', 'api/gym_owner/dashboard.php');
assertTrue($memberHitTrainer['status'] === 403 && $memberHitOwner['status'] === 403, 'TEST 7c: Athlete cannot access Trainer or Gym Owner dashboards (403)');

$otherReadMsg = $otherSess->request('GET', "api/messages.php?with_user={$coachUserId}&viewer_id={$userId}");
assertTrue($otherReadMsg['status'] === 403 || empty($otherReadMsg['json']['messages']), 'TEST 7d: Unassigned user cannot read another athlete-trainer conversation or spoof viewer_id');

$otherDossier = $otherSess->request('GET', "api/trainer/member_dossier.php?member_id={$userId}");
assertTrue($otherDossier['status'] === 403, 'TEST 7e: Unauthorized user cannot fetch another user dossier (403)');

// Cleanup test users (cascades cleanly)
$pdo->prepare("DELETE FROM payments WHERE user_id IN (?, ?) OR gym_id = ? AND provider_ref LIKE 'FS-MEM-%' AND user_id = ?")->execute([$userId, $coachUserId, $gymId, $userId]);
$pdo->prepare("DELETE FROM workout_plans WHERE author_trainer_id = ?")->execute([$coachUserId]);
$pdo->prepare("DELETE FROM users WHERE email IN (?, ?, ?)")->execute([$testUserEmail, $testOtherEmail, $testCoachEmail]);

echo "\n=== SUMMARY: {$passed} PASSED, {$failed} FAILED ===\n";
exit($failed === 0 ? 0 : 1);
