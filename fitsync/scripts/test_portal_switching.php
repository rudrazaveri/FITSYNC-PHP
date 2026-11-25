<?php
/**
 * FitSync AI — End-to-End Portal Switching, Auth & Redirect Persistence Acceptance Tests (Tests A–F)
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

function assertTrue(bool $cond, string $label): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failed++;
        echo "[FAIL] {$label}\n";
    }
}

function httpReq(string $method, string $url, array &$cookies, ?array $formBody = null, ?string $jsonBody = null, array $extraHeaders = []): array {
    $headers = [];
    if (!empty($cookies)) {
        $pairs = [];
        foreach ($cookies as $k => $v) {
            $pairs[] = $k . '=' . $v;
        }
        $headers[] = 'Cookie: ' . implode('; ', $pairs);
    }
    foreach ($extraHeaders as $h) {
        $headers[] = $h;
    }

    $opts = [
        'http' => [
            'method' => $method,
            'follow_location' => 0,
            'ignore_errors' => true,
            'timeout' => 10,
        ]
    ];

    if ($jsonBody !== null) {
        $headers[] = 'Content-Type: application/json';
        $opts['http']['content'] = $jsonBody;
    } elseif ($formBody !== null) {
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        $opts['http']['content'] = http_build_query($formBody);
    }

    if (!empty($headers)) {
        $opts['http']['header'] = implode("\r\n", $headers);
    }

    $ctx = stream_context_create($opts);
    $body = @file_get_contents($url, false, $ctx);
    $rawHeaders = $http_response_header ?? [];

    $status = 0;
    $location = '';
    $setCookies = [];
    foreach ($rawHeaders as $hLine) {
        if (preg_match('#^HTTP/\S+\s+(\d+)#i', $hLine, $m)) {
            $status = (int)$m[1];
        } elseif (stripos($hLine, 'Location:') === 0) {
            $location = trim(substr($hLine, 9));
        } elseif (stripos($hLine, 'Set-Cookie:') === 0) {
            $cookieSpec = trim(substr($hLine, 11));
            $setCookies[] = $cookieSpec;
            $parts = explode(';', $cookieSpec);
            $kv = explode('=', trim($parts[0]), 2);
            if (count($kv) === 2) {
                $name = trim($kv[0]);
                $val = trim($kv[1]);
                if ($val === '' || stripos($cookieSpec, 'expires=Thu, 01-Jan-1970') !== false || stripos($cookieSpec, 'Max-Age=0') !== false) {
                    unset($cookies[$name]);
                } else {
                    $cookies[$name] = $val;
                }
            }
        }
    }

    return [
        'status' => $status,
        'location' => $location,
        'set_cookies' => $setCookies,
        'body' => $body !== false ? $body : '',
        'json' => is_string($body) ? json_decode($body, true) : null,
    ];
}

function createTempAccount(PDO $db, string $prefix, string $primaryRole, array $allRoles, array &$createdUserIds): array {
    $email = $prefix . '.' . bin2hex(random_bytes(4)) . '@fitsync.test';
    $pass = 'FitSync@2026!';
    $hash = password_hash($pass, PASSWORD_DEFAULT);

    $stmt = $db->prepare("
        INSERT INTO users (email, password_hash, role, full_name, status)
        VALUES (:email, :hash, :role, :name, 'active')
    ");
    $stmt->execute([
        ':email' => $email,
        ':hash' => $hash,
        ':role' => $primaryRole,
        ':name' => 'Test ' . strtoupper($prefix),
    ]);
    $uid = (int)$db->lastInsertId();
    $createdUserIds[] = $uid;

    $rStmt = $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (:uid, :role)");
    foreach (array_unique(array_merge([$primaryRole], $allRoles)) as $r) {
        $rStmt->execute([':uid' => $uid, ':role' => $r]);
    }

    if ($primaryRole === 'user' || in_array('user', $allRoles, true)) {
        $db->prepare("INSERT INTO user_profiles (user_id, fitness_experience) VALUES (:uid, 'intermediate')")->execute([':uid' => $uid]);
    }
    if ($primaryRole === 'trainer' || in_array('trainer', $allRoles, true)) {
        $db->prepare("INSERT INTO trainer_profiles (user_id, specializations_summary, experience_years) VALUES (:uid, 'Strength & Conditioning', 3)")->execute([':uid' => $uid]);
    }

    return ['id' => $uid, 'email' => $email, 'password' => $pass, 'role' => $primaryRole];
}

try {
    echo "=== FitSync Portal Switching & Auth Acceptance Tests ===\n";

    $memberAcc = createTempAccount($db, 'member_single', 'user', ['user'], $createdUserIds);
    $trainerAcc = createTempAccount($db, 'trainer_single', 'trainer', ['trainer'], $createdUserIds);
    $ownerAcc = createTempAccount($db, 'owner_single', 'gym_owner', ['gym_owner'], $createdUserIds);
    $multiAcc = createTempAccount($db, 'trainer_member_multi', 'trainer', ['trainer', 'user'], $createdUserIds);

    // -------------------------------------------------------------------------
    // TEST A: Normal Login by Role
    // -------------------------------------------------------------------------
    echo "\n--- Test A: Normal Login by Role ---\n";
    $cMember = [];
    $res = httpReq('POST', "$baseUrl/login.php", $cMember, ['email' => $memberAcc['email'], 'password' => $memberAcc['password']]);
    assertTrue($res['status'] === 302 && str_ends_with($res['location'], 'index.html'), "Member login redirects to index.html (got: {$res['location']})");
    $meMember = httpReq('GET', "$baseUrl/api/auth/me.php", $cMember);
    assertTrue(($meMember['json']['user']['role'] ?? '') === 'user' && ($meMember['json']['isLoggedIn'] ?? false) === true, "Member session /api/auth/me.php active as user");

    $cTrainer = [];
    $res = httpReq('POST', "$baseUrl/login.php", $cTrainer, ['email' => $trainerAcc['email'], 'password' => $trainerAcc['password']]);
    assertTrue($res['status'] === 302 && str_contains($res['location'], 'trainer/index.html'), "Trainer login redirects to trainer/index.html (got: {$res['location']})");
    $meTrainer = httpReq('GET', "$baseUrl/api/auth/me.php", $cTrainer);
    assertTrue(($meTrainer['json']['user']['role'] ?? '') === 'trainer', "Trainer session active as trainer");

    $cOwner = [];
    $res = httpReq('POST', "$baseUrl/login.php", $cOwner, ['email' => $ownerAcc['email'], 'password' => $ownerAcc['password']]);
    assertTrue($res['status'] === 302 && str_contains($res['location'], 'gym_owner/index.html'), "Gym Owner login redirects to gym_owner/index.html (got: {$res['location']})");
    $meOwner = httpReq('GET', "$baseUrl/api/auth/me.php", $cOwner);
    assertTrue(($meOwner['json']['user']['role'] ?? '') === 'gym_owner', "Gym Owner session active as gym_owner");

    // -------------------------------------------------------------------------
    // TEST B: Multi-role Portal Switching Without Re-Login
    // -------------------------------------------------------------------------
    echo "\n--- Test B: Multi-role Portal Switching Without Re-Login ---\n";
    $cMulti = [];
    $res = httpReq('POST', "$baseUrl/login.php", $cMulti, ['email' => $multiAcc['email'], 'password' => $multiAcc['password']]);
    $initialSessId = $cMulti['FITSYNC_SESSION'] ?? '';
    assertTrue($res['status'] === 302 && str_contains($res['location'], 'trainer/index.html') && $initialSessId !== '', "Multi-role user lands in trainer/index.html with FITSYNC_SESSION cookie");

    $swUser = httpReq('GET', "$baseUrl/switch_portal.php?to=user", $cMulti);
    assertTrue($swUser['status'] === 302 && str_contains($swUser['location'], 'index.html') && !str_contains($swUser['location'], 'login.php') && !str_contains($swUser['location'], 'register.php'),
        "Multi-role switch to Member opens index.html without login/register redirect (got: {$swUser['location']})");
    assertTrue(($cMulti['FITSYNC_SESSION'] ?? '') === $initialSessId, "Existing session preserved across portal switch");

    $meMulti = httpReq('GET', "$baseUrl/api/auth/me.php", $cMulti);
    assertTrue(($meMulti['json']['user']['role'] ?? '') === 'trainer' && ($meMulti['json']['user']['active_portal'] ?? '') === 'user',
        "Multi-role user retains permanent role='trainer' with active_portal='user'");

    $swTrainer = httpReq('GET', "$baseUrl/switch_portal.php?to=trainer", $cMulti);
    assertTrue($swTrainer['status'] === 302 && str_contains($swTrainer['location'], 'trainer/index.html'),
        "Multi-role user switches back to trainer/index.html seamlessly");

    $apiT = httpReq('GET', "$baseUrl/api/trainer/dashboard.php", $cMulti);
    $apiU = httpReq('GET', "$baseUrl/api/user/profile.php", $cMulti);
    assertTrue($apiT['status'] === 200 && $apiU['status'] === 200, "Multi-role user authorized for both trainer API ({$apiT['status']}) and user API ({$apiU['status']})");

    $dbRoleCheck = $db->prepare("SELECT role FROM users WHERE id = ?");
    $dbRoleCheck->execute([$multiAcc['id']]);
    assertTrue($dbRoleCheck->fetchColumn() === 'trainer', "Database users.role remains 'trainer' untouched");

    // -------------------------------------------------------------------------
    // TEST C: Unauthorized Portal Access Denied Without Login Redirect
    // -------------------------------------------------------------------------
    echo "\n--- Test C: Unauthorized Portal Access Denied ---\n";
    $memberSessBefore = $cMember['FITSYNC_SESSION'] ?? '';
    $deniedSwitch = httpReq('GET', "$baseUrl/switch_portal.php?to=trainer", $cMember);
    assertTrue($deniedSwitch['status'] === 403 && !str_contains($deniedSwitch['location'], 'login.php') && !str_contains($deniedSwitch['location'], 'register.php') && stripos($deniedSwitch['body'], 'Access Denied') !== false,
        "Single-role Member clicking Trainer switcher gets 403 Access Denied without login/register redirect (status={$deniedSwitch['status']})");

    $deniedTrainerPage = httpReq('GET', "$baseUrl/trainer/index.php", $cMember);
    $deniedOwnerPage = httpReq('GET', "$baseUrl/gym_owner/index.php", $cMember);
    assertTrue($deniedTrainerPage['status'] === 403 && $deniedOwnerPage['status'] === 403,
        "Single-role Member hitting trainer/index.php & gym_owner/index.php gets 403 ({$deniedTrainerPage['status']}, {$deniedOwnerPage['status']})");

    $meStillMember = httpReq('GET', "$baseUrl/api/auth/me.php", $cMember);
    assertTrue(($meStillMember['json']['isLoggedIn'] ?? false) === true && ($meStillMember['json']['user']['role'] ?? '') === 'user' && ($cMember['FITSYNC_SESSION'] ?? '') === $memberSessBefore,
        "Member session and role preserved intact after 403 Access Denied");

    // -------------------------------------------------------------------------
    // TEST D: Intended URL Persistence & Safety Across Roles
    // -------------------------------------------------------------------------
    echo "\n--- Test D: Intended URL Persistence & Role Isolation ---\n";
    $cAnon = [];
    $anonVisit = httpReq('GET', "$baseUrl/trainer/members.php", $cAnon);
    assertTrue($anonVisit['status'] === 302 && str_contains($anonVisit['location'], 'login.php'),
        "Logged-out visitor requesting /trainer/members.php redirected to login.php (status={$anonVisit['status']})");

    $trainerIntendedLogin = httpReq('POST', "$baseUrl/login.php", $cAnon, ['email' => $trainerAcc['email'], 'password' => $trainerAcc['password']]);
    assertTrue($trainerIntendedLogin['status'] === 302 && str_contains($trainerIntendedLogin['location'], '/trainer/members.php'),
        "Authorized Trainer redirected to intended /trainer/members.php (got: {$trainerIntendedLogin['location']})");

    $followedTrainer = httpReq('GET', "$baseUrl" . $trainerIntendedLogin['location'], $cAnon);
    assertTrue($followedTrainer['status'] === 302 && str_contains($followedTrainer['location'], 'index.html#members'),
        "Following /trainer/members.php forwards authenticated Trainer to index.html#members");

    // Logout & try as Member with stale intended URL attempt
    httpReq('GET', "$baseUrl/logout.php", $cAnon);
    $cAnon2 = [];
    httpReq('GET', "$baseUrl/trainer/members.php", $cAnon2);
    $memberIntendedLogin = httpReq('POST', "$baseUrl/login.php", $cAnon2, ['email' => $memberAcc['email'], 'password' => $memberAcc['password']]);
    assertTrue($memberIntendedLogin['status'] === 302 && !str_contains($memberIntendedLogin['location'], 'trainer/') && str_ends_with($memberIntendedLogin['location'], 'index.html'),
        "Member logging in after visiting /trainer/members.php is NOT sent to trainer/members.php, goes to Member Portal (got: {$memberIntendedLogin['location']})");

    $memberAfterDenied = httpReq('GET', "$baseUrl/trainer/members.php", $cAnon2);
    assertTrue($memberAfterDenied['status'] === 403, "Authenticated Member manually hitting /trainer/members.php receives 403 Forbidden");

    // ?next= query tampering check
    $cTamper = [];
    $tamperLogin = httpReq('POST', "$baseUrl/login.php?next=" . urlencode('/gym_owner/members.php'), $cTamper, ['email' => $trainerAcc['email'], 'password' => $trainerAcc['password']]);
    assertTrue($tamperLogin['status'] === 302 && str_contains($tamperLogin['location'], 'trainer/index.html'),
        "Forged ?next=/gym_owner/members.php ignored for Trainer login (got: {$tamperLogin['location']})");

    // -------------------------------------------------------------------------
    // TEST E: Session Consistency & Logout Across Portals
    // -------------------------------------------------------------------------
    echo "\n--- Test E: Session Consistency & Logout ---\n";
    $hasUnifiedCookie = false;
    foreach ($swUser['set_cookies'] ?? [] as $sc) { /* set on login */ }
    $cFresh = [];
    $loginHeaders = httpReq('POST', "$baseUrl/login.php", $cFresh, ['email' => $trainerAcc['email'], 'password' => $trainerAcc['password']]);
    foreach ($loginHeaders['set_cookies'] as $sc) {
        if (str_starts_with($sc, 'FITSYNC_SESSION=') && stripos($sc, 'path=/') !== false && stripos($sc, 'HttpOnly') !== false) {
            $hasUnifiedCookie = true;
        }
    }
    assertTrue($hasUnifiedCookie, "Unified FITSYNC_SESSION cookie emitted with path=/ and HttpOnly");

    httpReq('GET', "$baseUrl/logout.php", $cFresh);
    $afterLogoutMe = httpReq('GET', "$baseUrl/api/auth/me.php", $cFresh);
    $afterLogoutProtected = httpReq('GET', "$baseUrl/trainer/members.php", $cFresh);
    assertTrue(($afterLogoutMe['json']['isLoggedIn'] ?? true) === false && $afterLogoutProtected['status'] === 302 && str_contains($afterLogoutProtected['location'], 'login.php'),
        "Logout terminates session across all portals cleanly");

    // -------------------------------------------------------------------------
    // TEST F: Manual URL & API Tampering Checks
    // -------------------------------------------------------------------------
    echo "\n--- Test F: Manual URL & API Forging Prevention ---\n";
    $tApi1 = httpReq('GET', "$baseUrl/api/trainer/dashboard.php", $cMember);
    $tApi2 = httpReq('GET', "$baseUrl/api/gym_owner/dashboard.php", $cMember);
    $tApi3 = httpReq('GET', "$baseUrl/api/user/profile.php", $cTrainer);
    $tApi4 = httpReq('GET', "$baseUrl/api/gym_owner/dashboard.php", $cTrainer);
    $tApi5 = httpReq('GET', "$baseUrl/switch_portal.php?to=gym_owner", $cMulti);
    $tWrap1 = httpReq('GET', "$baseUrl/dashboard.php", $cTrainer);
    $tWrap2 = httpReq('GET', "$baseUrl/gym_owner/members.php", $cTrainer);
    assertTrue($tApi1['status'] === 403 && $tApi2['status'] === 403 && $tApi3['status'] === 403 && $tApi4['status'] === 403 && $tApi5['status'] === 403 && $tWrap1['status'] === 403 && $tWrap2['status'] === 403,
        "Cross-role API & wrapper route tampering rejected with 403 ({$tApi1['status']},{$tApi2['status']},{$tApi3['status']},{$tApi4['status']},{$tApi5['status']},{$tWrap1['status']},{$tWrap2['status']})");

    // -------------------------------------------------------------------------
    // TEST G: Multi-Tab Concurrent Portal Sessions in Single Shared Browser Cookie Jar
    // -------------------------------------------------------------------------
    echo "\n--- Test G: Multi-Tab Concurrent Portal Sessions ---\n";
    $sharedJar = [];

    // 1. Tab 1 signs in as Member
    $gMemLogin = httpReq('POST', "$baseUrl/login.php", $sharedJar, [
        'email' => $memberAcc['email'],
        'password' => $memberAcc['password'],
    ]);
    assertTrue($gMemLogin['status'] === 302 && str_ends_with($gMemLogin['location'], 'index.html'),
        "Tab 1 Member login succeeded cleanly");

    // 2. Tab 2 signs in as Gym Owner via switch_account=1&portal_ctx=gym_owner using the SAME cookie jar
    $gOwnerLogin = httpReq('POST', "$baseUrl/login.php?switch_account=1&portal_ctx=gym_owner", $sharedJar, [
        'email' => $ownerAcc['email'],
        'password' => $ownerAcc['password'],
    ]);
    assertTrue($gOwnerLogin['status'] === 302 && str_contains($gOwnerLogin['location'], 'gym_owner/index.html'),
        "Tab 2 Gym Owner login kept shared jar intact and redirected to gym_owner/index.html (got: {$gOwnerLogin['location']})");

    // 3. Tab 3 signs in as Trainer via switch_account=1&portal_ctx=trainer using the SAME cookie jar
    $gTrainerLogin = httpReq('POST', "$baseUrl/login.php?switch_account=1&portal_ctx=trainer", $sharedJar, [
        'email' => $trainerAcc['email'],
        'password' => $trainerAcc['password'],
    ]);
    assertTrue($gTrainerLogin['status'] === 302 && str_contains($gTrainerLogin['location'], 'trainer/index.html'),
        "Tab 3 Trainer login kept shared jar intact and redirected to trainer/index.html (got: {$gTrainerLogin['location']})");

    // 4. Verify all 3 tabs remain authenticated concurrently in the SAME browser cookie jar
    $meUserTab = httpReq('GET', "$baseUrl/api/auth/me.php", $sharedJar, null, null, ['X-FitSync-Portal: user']);
    $meOwnerTab = httpReq('GET', "$baseUrl/api/auth/me.php", $sharedJar, null, null, ['X-FitSync-Portal: gym_owner']);
    $meTrainerTab = httpReq('GET', "$baseUrl/api/auth/me.php", $sharedJar, null, null, ['X-FitSync-Portal: trainer']);
    assertTrue(
        ($meUserTab['json']['user']['email'] ?? '') === $memberAcc['email']
        && ($meOwnerTab['json']['user']['email'] ?? '') === $ownerAcc['email']
        && ($meTrainerTab['json']['user']['email'] ?? '') === $trainerAcc['email'],
        "All 3 tabs stay concurrently signed in to Member, Gym Owner & Trainer in one shared cookie jar"
    );

    // 5. Verify scoped portal API endpoints & guarded pages respect each tab context
    $apiMem = httpReq('GET', "$baseUrl/api/user/profile.php", $sharedJar, null, null, ['X-FitSync-Portal: user']);
    $apiOwn = httpReq('GET', "$baseUrl/api/gym_owner/dashboard.php", $sharedJar, null, null, ['X-FitSync-Portal: gym_owner']);
    $apiTrn = httpReq('GET', "$baseUrl/api/trainer/dashboard.php", $sharedJar, null, null, ['X-FitSync-Portal: trainer']);
    assertTrue($apiMem['status'] === 200 && $apiOwn['status'] === 200 && $apiTrn['status'] === 200,
        "Portal-scoped API endpoints return 200 concurrently ({$apiMem['status']},{$apiOwn['status']},{$apiTrn['status']})");

    // 6. Verify single-tab logout logs out ONLY Gym Owner while keeping Member & Trainer tabs signed in
    $gOwnerLogout = httpReq('GET', "$baseUrl/logout.php?portal_ctx=gym_owner", $sharedJar);
    $meOwnerAfter = httpReq('GET', "$baseUrl/api/auth/me.php", $sharedJar, null, null, ['X-FitSync-Portal: gym_owner']);
    $meUserAfter = httpReq('GET', "$baseUrl/api/auth/me.php", $sharedJar, null, null, ['X-FitSync-Portal: user']);
    $meTrainerAfter = httpReq('GET', "$baseUrl/api/auth/me.php", $sharedJar, null, null, ['X-FitSync-Portal: trainer']);
    assertTrue(
        $gOwnerLogout['status'] === 302
        && str_contains($gOwnerLogout['location'], 'switch_account=1')
        && ($meOwnerAfter['json']['isLoggedIn'] ?? true) === false
        && ($meUserAfter['json']['user']['email'] ?? '') === $memberAcc['email']
        && ($meTrainerAfter['json']['user']['email'] ?? '') === $trainerAcc['email'],
        "Scoped logout signs out ONLY Gym Owner tab while Member & Trainer remain authenticated"
    );

    echo "\nSUMMARY: PASSED={$passed}, FAILED={$failed}\n";
    $exitCode = $failed > 0 ? 1 : 0;
} finally {
    if (!empty($createdUserIds)) {
        $placeholders = implode(',', array_fill(0, count($createdUserIds), '?'));
        $db->prepare("DELETE FROM users WHERE id IN ({$placeholders})")->execute($createdUserIds);
    }
}
exit($exitCode ?? 1);
