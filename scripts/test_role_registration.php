<?php
/**
 * FitSync AI — Role-Specific Registration Acceptance Tests (Tests A–E)
 * Exercises real HTTP multipart & JSON requests against http://127.0.0.1:8080 and MySQL.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

$baseUrl = 'http://127.0.0.1:8080';
$ts = time() . '_' . random_int(100, 999);
$db = getDbConnection(true);

// Ensure PHP server is listening on 8080; otherwise error clearly
$probe = @fsockopen('127.0.0.1', 8080, $errno, $errstr, 2);
if (!$probe) {
    fwrite(STDERR, "Port 8080 not listening ({$errstr}).\n");
    exit(1);
}
fclose($probe);

class RegHttpClient {
    public string $cookieFile;
    public string $csrf = '';
    public string $baseUrl;

    public function __construct(string $tag, string $baseUrl) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->cookieFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fs_reg_{$tag}_" . getmypid() . '.cookie';
        if (file_exists($this->cookieFile)) @unlink($this->cookieFile);
    }

    public function __destruct() {
        if (file_exists($this->cookieFile)) @unlink($this->cookieFile);
    }

    public function req(string $method, string $path, $body = null, bool $isMultipart = false, ?string $csrfOverride = null): array {
        $ch = curl_init($this->baseUrl . '/' . ltrim($path, '/'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $this->cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->cookieFile);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $headers = ['Accept: application/json'];
        if ($body !== null) {
            if ($isMultipart) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            } else {
                curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($body) ? $body : json_encode($body));
                $headers[] = 'Content-Type: application/json';
            }
        }
        $tok = $csrfOverride ?? $this->csrf;
        if (strtoupper($method) !== 'GET' && $tok !== '') {
            $headers[] = 'X-CSRF-Token: ' . $tok;
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $raw = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = is_string($raw) ? json_decode($raw, true) : null;
        if (is_array($json) && !empty($json['csrf_token'])) {
            $this->csrf = $json['csrf_token'];
        }
        return ['status' => $status, 'json' => $json, 'raw' => $raw];
    }

    public function refreshCsrf(): void {
        $r = $this->req('GET', 'api/auth/me.php');
        if (!empty($r['json']['csrf_token'])) {
            $this->csrf = $r['json']['csrf_token'];
        }
    }
}

$passed = 0;
$failed = 0;
function checkAssert(bool $cond, string $label, string $detail = ''): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failed++;
        echo "[FAIL] {$label}" . ($detail !== '' ? " -> {$detail}" : '') . "\n";
    }
}

// Create a valid 1x1 PNG file for real upload tests
$tmpImg = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fs_test_{$ts}.png";
$pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
file_put_contents($tmpImg, base64_decode($pngB64));

$memberEmail   = "member_{$ts}@regtest.local";
$trainer1Email = "trainer1_{$ts}@regtest.local";
$trainer2Email = "trainer2_{$ts}@regtest.local";
$ownerEmail    = "owner_{$ts}@regtest.local";
$badEmail      = "bad_{$ts}@regtest.local";
$pwd           = 'RegTest@2026';

$createdUserIds = [];
$createdGymIds = [];

try {
    // 0. Check register.php renders & register_options returns catalog
    $pubClient = new RegHttpClient('pub', $baseUrl);
    $pageRes = $pubClient->req('GET', 'register.php');
    checkAssert($pageRes['status'] === 200 && str_contains((string)$pageRes['raw'], 'Gym Owner') && str_contains((string)$pageRes['raw'], 'Fitness Trainer'), 'register.php loads with Member, Trainer & Gym Owner cards');

    $optRes = $pubClient->req('GET', 'api/auth/register_options.php');
    checkAssert(
        $optRes['status'] === 200 && !empty($optRes['json']['success']) && count($optRes['json']['data']['facilities'] ?? []) >= 5,
        'register_options.php returns catalog facilities, equipment & specializations'
    );

    // -------------------------------------------------------------------------
    // TEST C FIRST (creates a real Gym Owner + Gym via multipart registration)
    // -------------------------------------------------------------------------
    $ownerCli = new RegHttpClient('owner', $baseUrl);
    $ownerCli->refreshCsrf();
    $ownerPayload = [
        'role'                  => 'gym_owner',
        'full_name'             => 'Test Gym Owner',
        'email'                 => $ownerEmail,
        'mobile'                => '+91 9811100001',
        'password'              => $pwd,
        'confirm_password'      => $pwd,
        'gym_name'              => "Apex Arena {$ts}",
        'gym_email'             => "desk_{$ts}@apex.regtest.local",
        'gym_phone'             => '+91 20 25009999',
        'address_line1'         => '42 FC Road',
        'city'                  => 'Pune',
        'state'                 => 'Maharashtra',
        'postal_code'           => '411004',
        'country'               => 'India',
        'gym_description'       => 'Strength & conditioning training facility',
        'business_registration' => 'REG-TEST-2026',
        'facilities[0]'         => '1',
        'equipment[0]'          => '1',
        'gym_logo'              => new CURLFile($tmpImg, 'image/png', 'logo.png'),
        'ownership_doc'         => new CURLFile($tmpImg, 'image/png', 'ownership.png')
    ];
    $regOwner = $ownerCli->req('POST', 'api/auth/register.php', $ownerPayload, true);
    $ownerUserId = (int)($regOwner['json']['user']['id'] ?? 0);
    $ownerGymId = (int)($regOwner['json']['gym_id'] ?? 0);
    if ($ownerUserId) $createdUserIds[] = $ownerUserId;
    if ($ownerGymId) $createdGymIds[] = $ownerGymId;

    checkAssert(
        $regOwner['status'] === 201 && !empty($regOwner['json']['success']) && $ownerGymId > 0 && ($regOwner['json']['gym_status'] ?? '') === 'pending_approval',
        'TEST C1: Gym Owner registers with Gym + Logo + Ownership Doc (status=pending_approval)',
        json_encode($regOwner['json'] ?? $regOwner['raw'])
    );

    $ownerDash = $ownerCli->req('GET', 'api/gym_owner/dashboard.php');
    checkAssert(
        $ownerDash['status'] === 200 &&
        (int)($ownerDash['json']['data']['gym']['id'] ?? 0) === $ownerGymId &&
        count($ownerDash['json']['data']['members'] ?? []) === 0 &&
        count($ownerDash['json']['data']['coaches'] ?? []) === 0 &&
        (float)($ownerDash['json']['data']['stats']['revenue'] ?? -1) === 0.0,
        'TEST C2: Gym Owner portal shows linked gym with zero fake members/coaches/revenue'
    );

    // Verify Owner login redirects cleanly to gym_owner/index.html
    $ownerLoginCli = new RegHttpClient('owner_login', $baseUrl);
    $ownerLoginCli->refreshCsrf();
    $ownerLogin = $ownerLoginCli->req('POST', 'api/auth/login.php', ['email' => $ownerEmail, 'password' => $pwd]);
    checkAssert(
        $ownerLogin['status'] === 200 && str_contains((string)($ownerLogin['json']['redirect'] ?? ''), 'gym_owner/index.html'),
        'TEST C3: Gym Owner login redirects to Gym Owner Portal'
    );

    // Owner adds a Coach -> creates 1 trainer & 1 gym_trainers association
    $ownerCoachRes = $ownerCli->req('POST', 'api/gym_owner/add_coach.php', [
        'name' => 'Owner Added Coach',
        'email' => "added_coach_{$ts}@regtest.local",
        'phone' => '+91 9811100099',
        'title' => 'Strength Coach',
        'experience' => 4,
        'hourlyRate' => 1400
    ]);
    $addedCoachUid = (int)($ownerCoachRes['json']['data']['user_id'] ?? 0);
    if ($addedCoachUid) $createdUserIds[] = $addedCoachUid;
    checkAssert($ownerCoachRes['status'] === 200 && $addedCoachUid > 0, 'TEST C4: Gym Owner adds Trainer via Gym Owner Portal');

    // Mark ownerGym active for Member & Trainer gym association tests (simulating Admin verification)
    $db->prepare("UPDATE gyms SET status = 'active' WHERE id = ?")->execute([$ownerGymId]);
    $db->prepare("INSERT INTO membership_plans (gym_id, name, description, duration_months, price, access_type, is_active) VALUES (?, 'Test Annual', 'All Access', 12, 12000.00, 'single_gym', 1)")
        ->execute([$ownerGymId]);
    $planId = (int)$db->lastInsertId();

    // -------------------------------------------------------------------------
    // TEST A: Gym Member Registration
    // -------------------------------------------------------------------------
    $memCli = new RegHttpClient('member', $baseUrl);
    $memCli->refreshCsrf();
    $memPayload = [
        'role'               => 'user',
        'full_name'          => 'Test Member Athlete',
        'email'              => $memberEmail,
        'mobile'             => '+91 9822200001',
        'password'           => $pwd,
        'confirm_password'   => $pwd,
        'date_of_birth'      => '1999-05-12',
        'gender'             => 'male',
        'height_cm'          => '178',
        'weight_kg'          => '75.5',
        'fitness_experience' => 'intermediate',
        'primary_goal'       => 'Muscle Gain',
        'activity_level'     => '1.55',
        'gym_id'             => (string)$ownerGymId,
        'request_membership' => '1',
        'plan_id'            => (string)$planId,
        'profile_photo'      => new CURLFile($tmpImg, 'image/png', 'avatar.png')
    ];
    $regMem = $memCli->req('POST', 'api/auth/register.php', $memPayload, true);
    $memUserId = (int)($regMem['json']['user']['id'] ?? 0);
    if ($memUserId) $createdUserIds[] = $memUserId;

    $cntUser = (int)$db->query("SELECT COUNT(*) FROM users WHERE email = " . $db->quote($memberEmail))->fetchColumn();
    $memStatus = $db->query("SELECT status FROM memberships WHERE user_id = {$memUserId} LIMIT 1")->fetchColumn();
    $hasProf = (int)$db->query("SELECT COUNT(*) FROM user_profiles WHERE user_id = {$memUserId}")->fetchColumn();
    $hasGoal = (int)$db->query("SELECT COUNT(*) FROM fitness_goals WHERE user_id = {$memUserId}")->fetchColumn();
    $hasAss  = (int)$db->query("SELECT COUNT(*) FROM fitness_assessments WHERE user_id = {$memUserId}")->fetchColumn();

    checkAssert(
        $regMem['status'] === 201 && $cntUser === 1 && $hasProf === 1 && $hasGoal === 1 && $hasAss === 1 && $memStatus === 'pending',
        'TEST A1: Member account, profile, goal, assessment & pending membership request created accurately',
        "status={$regMem['status']} cnt={$cntUser} memStatus={$memStatus}"
    );

    $memLoginCli = new RegHttpClient('mem_login', $baseUrl);
    $memLoginCli->refreshCsrf();
    $memLogin = $memLoginCli->req('POST', 'api/auth/login.php', ['email' => $memberEmail, 'password' => $pwd]);
    checkAssert(
        $memLogin['status'] === 200 && ($memLogin['json']['user']['role'] ?? '') === 'user' && str_contains((string)($memLogin['json']['redirect'] ?? ''), 'index.html'),
        'TEST A2: Member can log in and redirects to Member Portal'
    );

    // -------------------------------------------------------------------------
    // TEST B: Fitness Trainer Registration (Independent + Affiliated + Pending Restrictions)
    // -------------------------------------------------------------------------
    $trCli = new RegHttpClient('trainer1', $baseUrl);
    $trCli->refreshCsrf();
    $trPayload = [
        'role'                   => 'trainer',
        'full_name'              => 'Test Fitness Trainer',
        'email'                  => $trainer1Email,
        'mobile'                 => '+91 9833300001',
        'password'               => $pwd,
        'confirm_password'       => $pwd,
        'gender'                 => 'female',
        'trainer_specialization' => 'Strength Training',
        'experience_years'       => '6',
        'qualifications'         => 'B.P.Ed.',
        'certification_name'     => 'NSCA CSCS',
        'certifying_body'        => 'NSCA',
        'areas_of_expertise'     => 'Powerlifting, Mobility',
        'training_approach'      => 'Evidence-based periodization',
        'bio'                    => 'Certified strength coach specializing in compound barbell movements.',
        'gym_id'                 => (string)$ownerGymId,
        'employment_type'        => 'full_time',
        'profile_photo'          => new CURLFile($tmpImg, 'image/png', 'tavatar.png'),
        'certification_doc'      => new CURLFile($tmpImg, 'image/png', 'cert.png')
    ];
    $regTr = $trCli->req('POST', 'api/auth/register.php', $trPayload, true);
    $tr1Id = (int)($regTr['json']['user']['id'] ?? 0);
    if ($tr1Id) $createdUserIds[] = $tr1Id;

    $tpStatus = $db->query("SELECT status FROM trainer_profiles WHERE user_id = {$tr1Id} LIMIT 1")->fetchColumn();
    $gtRow = $db->query("SELECT status, is_active FROM gym_trainers WHERE trainer_user_id = {$tr1Id} AND gym_id = {$ownerGymId} LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $hasCred = (int)$db->query("SELECT COUNT(*) FROM trainer_credentials WHERE trainer_id = {$tr1Id} AND credential_file_id IS NOT NULL")->fetchColumn();
    $hasVerif = (int)$db->query("SELECT COUNT(*) FROM verification_requests WHERE user_id = {$tr1Id} AND status = 'pending'")->fetchColumn();

    checkAssert(
        $regTr['status'] === 201 && $tpStatus === 'pending_verification' && ($gtRow['status'] ?? '') === 'pending' && (int)($gtRow['is_active'] ?? 1) === 0 && $hasCred === 1 && $hasVerif === 1,
        'TEST B1: Trainer profile, credentials doc, verification_request & pending gym affiliation saved cleanly',
        "tp={$tpStatus} gt=" . json_encode($gtRow)
    );

    // Unverified Trainer logs in -> redirected to Trainer Portal -> restricted on workouts/dossier
    $trLoginCli = new RegHttpClient('tr_login', $baseUrl);
    $trLoginCli->refreshCsrf();
    $trLogin = $trLoginCli->req('POST', 'api/auth/login.php', ['email' => $trainer1Email, 'password' => $pwd]);
    checkAssert(
        $trLogin['status'] === 200 && ($trLogin['json']['user']['role'] ?? '') === 'trainer' && str_contains((string)($trLogin['json']['redirect'] ?? ''), 'trainer/index.html'),
        'TEST B2: Unverified Trainer can log in and redirects to Trainer Portal'
    );

    $trDashUnver = $trLoginCli->req('GET', 'api/trainer/dashboard.php');
    $trWkUnver = $trLoginCli->req('GET', 'api/trainer/workouts.php');
    checkAssert(
        $trDashUnver['status'] === 200 && ($trDashUnver['json']['data']['is_verified'] ?? true) === false && $trWkUnver['status'] === 403,
        'TEST B3: Unverified Trainer sees pending status and is blocked (403) from athlete/workout endpoints'
    );

    // Gym Owner approves Trainer's affiliation request -> updates existing gym_trainers without creating duplicate user
    $ownerCheckReq = $ownerCli->req('GET', 'api/gym_owner/dashboard.php');
    $pendingAffs = $ownerCheckReq['json']['data']['pending_trainer_requests'] ?? [];
    $foundAff = count(array_filter($pendingAffs, fn($x) => (int)$x['trainer_user_id'] === $tr1Id)) === 1;
    $approveAff = $ownerCli->req('POST', 'api/gym_owner/trainer_affiliation_action.php', [
        'gym_id' => $ownerGymId,
        'trainer_user_id' => $tr1Id,
        'decision' => 'approve'
    ]);
    $cntTrainerRows = (int)$db->query("SELECT COUNT(*) FROM users WHERE email = " . $db->quote($trainer1Email))->fetchColumn();
    $gtAfter = $db->query("SELECT status, is_active FROM gym_trainers WHERE trainer_user_id = {$tr1Id} AND gym_id = {$ownerGymId}")->fetch(PDO::FETCH_ASSOC);
    checkAssert(
        $foundAff && $approveAff['status'] === 200 && $cntTrainerRows === 1 && ($gtAfter['status'] ?? '') === 'active' && (int)($gtAfter['is_active'] ?? 0) === 1,
        'TEST B4: Gym Owner approves pending trainer affiliation without duplicating trainer records'
    );

    // Independent trainer (not associated with a gym)
    $tr2Cli = new RegHttpClient('trainer2', $baseUrl);
    $tr2Cli->refreshCsrf();
    $regTr2 = $tr2Cli->req('POST', 'api/auth/register.php', [
        'role'                   => 'trainer',
        'full_name'              => 'Independent Trainer',
        'email'                  => $trainer2Email,
        'mobile'                 => '+91 9833300002',
        'password'               => $pwd,
        'confirm_password'       => $pwd,
        'trainer_specialization' => 'Yoga',
        'experience_years'       => 3,
        'certification_name'     => 'RYT-500',
        'certifying_body'        => 'Yoga Alliance',
        'bio'                    => 'Independent yoga & mobility specialist.',
        'gym_id'                 => 'none'
    ]);
    $tr2Id = (int)($regTr2['json']['user']['id'] ?? 0);
    if ($tr2Id) $createdUserIds[] = $tr2Id;
    $gt2Cnt = (int)$db->query("SELECT COUNT(*) FROM gym_trainers WHERE trainer_user_id = {$tr2Id}")->fetchColumn();
    checkAssert($regTr2['status'] === 201 && $gt2Cnt === 0, 'TEST B5: Independent trainer creates zero gym_trainers associations');

    // -------------------------------------------------------------------------
    // TEST D: Security & Tampering Rejection Tests
    // -------------------------------------------------------------------------
    $secCli = new RegHttpClient('sec', $baseUrl);
    $secCli->refreshCsrf();

    // D1: Submit Trainer fields under role='user'
    $d1 = $secCli->req('POST', 'api/auth/register.php', [
        'role'               => 'user',
        'full_name'          => 'Tamper User',
        'email'              => $badEmail,
        'password'           => $pwd,
        'confirm_password'   => $pwd,
        'certification_name' => 'Fake Cert',
        'certifying_body'    => 'Fake Org'
    ]);
    checkAssert($d1['status'] === 400 && empty($d1['json']['success']), 'TEST D1: Trainer fields submitted with User role rejected (400)');

    // D2: Attempt Admin registration publicly
    $d2 = $secCli->req('POST', 'api/auth/register.php', [
        'role'             => 'admin',
        'full_name'        => 'Rogue Admin',
        'email'            => $badEmail,
        'password'         => $pwd,
        'confirm_password' => $pwd
    ]);
    checkAssert($d2['status'] === 403 && empty($d2['json']['success']), 'TEST D2: Public admin registration blocked (403)');

    // D3: Duplicate email rejection
    $d3 = $secCli->req('POST', 'api/auth/register.php', [
        'role'             => 'user',
        'full_name'        => 'Dup User',
        'email'            => $memberEmail,
        'password'         => $pwd,
        'confirm_password' => $pwd
    ]);
    checkAssert($d3['status'] === 409 && empty($d3['json']['success']), 'TEST D3: Duplicate email registration rejected (409)');

    // D4: Unauthorized / unverified / nonexistent gym association rollback
    $db->prepare("UPDATE gyms SET status = 'pending_approval' WHERE id = ?")->execute([$ownerGymId]);
    $d4 = $secCli->req('POST', 'api/auth/register.php', [
        'role'             => 'trainer',
        'full_name'        => 'Bad Gym Trainer',
        'email'            => $badEmail,
        'mobile'           => '+91 9833300099',
        'password'         => $pwd,
        'confirm_password' => $pwd,
        'trainer_specialization' => 'Yoga',
        'certification_name' => 'ACE',
        'certifying_body'  => 'ACE',
        'bio'              => 'Valid bio for unverified gym test.',
        'gym_id'           => (string)$ownerGymId
    ]);
    $orphanBad = (int)$db->query("SELECT COUNT(*) FROM users WHERE email = " . $db->quote($badEmail))->fetchColumn();
    checkAssert($d4['status'] === 400 && empty($d4['json']['success']) && $orphanBad === 0, 'TEST D4: Association with pending/unverified gym rejected with complete transaction rollback');

    // D5: Missing/bad CSRF rejected
    $d5 = $secCli->req('POST', 'api/auth/register.php', ['role' => 'user', 'full_name' => 'No Csrf', 'email' => $badEmail, 'password' => $pwd], false, 'BAD_CSRF');
    checkAssert($d5['status'] === 403 && empty($d5['json']['success']), 'TEST D5: Invalid CSRF token rejected (403)');
} finally {
    @unlink($tmpImg);
    // Cleanup synthetic test records and uploaded files created during test
    if (!empty($createdUserIds)) {
        $inIds = implode(',', array_map('intval', $createdUserIds));
        $fileKeys = $db->query("SELECT storage_key FROM files WHERE owner_user_id IN ({$inIds})")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($fileKeys as $rel) {
            $abs = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel);
            if (is_file($abs)) @unlink($abs);
        }
        $db->exec("DELETE FROM files WHERE owner_user_id IN ({$inIds})");
        if (!empty($createdGymIds)) {
            $gIn = implode(',', array_map('intval', $createdGymIds));
            $db->exec("DELETE FROM gyms WHERE id IN ({$gIn})");
        }
        $db->exec("DELETE FROM users WHERE id IN ({$inIds})");
    }
}

echo "\n=== ROLE REGISTRATION TEST SUMMARY: {$passed} PASSED, {$failed} FAILED ===\n";
exit($failed === 0 ? 0 : 1);
