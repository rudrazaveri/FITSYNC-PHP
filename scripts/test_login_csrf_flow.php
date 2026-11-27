<?php
/**
 * FitSync AI — Login & CSRF Security Verification Suite (11 Scenarios)
 * Tests login.php (HTML form), api/auth/login.php (AJAX), logout.php, multi-tab portal_ctx,
 * and strict 403 rejection of missing/invalid CSRF tokens against http://127.0.0.1:8080.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

$BASE = 'http://127.0.0.1:8080';
$db = getDbConnection(true);

$passed = 0;
$failed = 0;

function assertTrue(bool $cond, string $label, string $detail = ''): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failed++;
        echo "[FAIL] {$label}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    }
}

function httpReq(string $method, string $url, string $cookieFile, $body = null, array $headers = []): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER         => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_COOKIEJAR      => $cookieFile,
        CURLOPT_COOKIEFILE     => $cookieFile,
        CURLOPT_TIMEOUT        => 25,
    ]);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    $raw = (string)curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $hdrSize = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    return [
        'code'    => $code,
        'headers' => substr($raw, 0, $hdrSize),
        'body'    => substr($raw, $hdrSize)
    ];
}

function extractFormCsrf(string $html): string {
    if (preg_match('/name="csrf_token"\s+value="([a-f0-9]{64})"/i', $html, $m)) {
        return $m[1];
    }
    return '';
}

$ts = date('His') . random_int(10, 99);
$pass = 'TestPass@123';
$hash = password_hash($pass, PASSWORD_DEFAULT);

// Create 3 real accounts (User, Trainer, Gym Owner) directly in DB for login test
$accounts = [];
foreach (['user', 'trainer', 'gym_owner'] as $role) {
    $em = "csrf_{$role}_{$ts}@fitsync.test";
    $fn = "CSRF " . ucfirst($role);
    $st = $db->prepare("INSERT INTO users (email, password_hash, role, full_name, status, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', NOW(), NOW(), NOW())");
    $st->execute([$em, $hash, $role, $fn]);
    $uid = (int)$db->lastInsertId();
    $db->prepare("INSERT INTO user_roles (user_id, role) VALUES (?, ?) ON CONFLICT DO NOTHING")->execute([$uid, $role]);
    $accounts[$role] = ['id' => $uid, 'email' => $em];
}

$cf = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fs_csrf_test_" . getmypid() . ".txt";
@unlink($cf);

// 1. Opening login.php
$r1 = httpReq('GET', "{$BASE}/login.php", $cf);
$tok1 = extractFormCsrf($r1['body']);
assertTrue($r1['code'] === 200 && strlen($tok1) === 64, '1. Opening login.php generates 64-char hex CSRF token');

// 2. Refreshing login.php reuses same session token
$r2 = httpReq('GET', "{$BASE}/login.php", $cf);
$tok2 = extractFormCsrf($r2['body']);
assertTrue($r2['code'] === 200 && hash_equals($tok1, $tok2), '2. Refreshing login.php reuses the same session CSRF token');

// 3a. Missing / invalid CSRF token rejected with HTTP 403 on login.php
$rBadCsrfForm = httpReq('POST', "{$BASE}/login.php", $cf, http_build_query([
    'csrf_token' => 'invalid_token_123',
    'email'      => $accounts['user']['email'],
    'password'   => $pass
]));
assertTrue($rBadCsrfForm['code'] === 403 && str_contains($rBadCsrfForm['body'], 'CSRF'), '3a. Invalid CSRF token on login.php rejected with HTTP 403');

// 3b. Missing CSRF token rejected with HTTP 403 on api/auth/login.php
$rBadCsrfApi = httpReq('POST', "{$BASE}/api/auth/login.php", $cf, json_encode([
    'email'    => $accounts['user']['email'],
    'password' => $pass
]), ['Content-Type: application/json']);
assertTrue($rBadCsrfApi['code'] === 403, '3b. Missing CSRF token on api/auth/login.php rejected with HTTP 403');

// 4. Submitting incorrect credentials with valid CSRF fails auth (not CSRF)
$rWrongPwd = httpReq('POST', "{$BASE}/login.php", $cf, http_build_query([
    'csrf_token' => $tok2,
    'email'      => $accounts['user']['email'],
    'password'   => 'WrongPassword999!'
]));
assertTrue($rWrongPwd['code'] === 200 && str_contains($rWrongPwd['body'], 'Invalid email address or password'), '4. Incorrect credentials with valid CSRF return auth error (not CSRF error)');

// 5. Logging in as User via login.php + subsequent request works
$rLoginUser = httpReq('POST', "{$BASE}/login.php", $cf, http_build_query([
    'csrf_token' => $tok2,
    'email'      => $accounts['user']['email'],
    'password'   => $pass
]));
$isUserRedirect = $rLoginUser['code'] === 302 && preg_match('/Location:\s*.*index\.html/i', $rLoginUser['headers']);
$rMeUser = httpReq('GET', "{$BASE}/api/auth/me.php", $cf);
$meUserJson = json_decode($rMeUser['body'], true);
assertTrue($isUserRedirect && !empty($meUserJson['isLoggedIn']) && ($meUserJson['user']['role'] ?? '') === 'user', '5. Login as User redirects to User Portal and preserves authenticated session');

// 8. Logging out via logout.php
$rLogout1 = httpReq('GET', "{$BASE}/logout.php", $cf);
$rMeAfterOut = httpReq('GET', "{$BASE}/api/auth/me.php", $cf);
$meAfterOut = json_decode($rMeAfterOut['body'], true);
assertTrue($rLogout1['code'] === 302 && empty($meAfterOut['isLoggedIn']), '8. Logout destroys session cleanly');

// 9 & 6. Logging in again after logout as Trainer
$rGetTr = httpReq('GET', "{$BASE}/login.php", $cf);
$tokTr = extractFormCsrf($rGetTr['body']);
$rLoginTr = httpReq('POST', "{$BASE}/login.php", $cf, http_build_query([
    'csrf_token' => $tokTr,
    'email'      => $accounts['trainer']['email'],
    'password'   => $pass
]));
assertTrue($rLoginTr['code'] === 302 && preg_match('/Location:\s*.*trainer\/index\.html/i', $rLoginTr['headers']), '6 & 9. Re-login after logout as Trainer redirects to Trainer Portal');

httpReq('GET', "{$BASE}/logout.php", $cf);

// 7. Logging in as Gym Owner
$rGetGo = httpReq('GET', "{$BASE}/login.php", $cf);
$tokGo = extractFormCsrf($rGetGo['body']);
$rLoginGo = httpReq('POST', "{$BASE}/login.php", $cf, http_build_query([
    'csrf_token' => $tokGo,
    'email'      => $accounts['gym_owner']['email'],
    'password'   => $pass
]));
assertTrue($rLoginGo['code'] === 302 && preg_match('/Location:\s*.*gym_owner\/index\.html/i', $rLoginGo['headers']), '7. Login as Gym Owner redirects to Gym Owner Portal');

// 10. Multi-tab portal_ctx login with stale FITSYNC_TAB_USER cookie
$cfTab = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fs_csrf_tab_" . getmypid() . ".txt";
@unlink($cfTab);
$rTabGet = httpReq('GET', "{$BASE}/login.php?switch_account=1&portal_ctx=user", $cfTab, null, ['Cookie: FITSYNC_TAB_USER=stale_expired_sid_1234567890abcdef']);
$tokTab = extractFormCsrf($rTabGet['body']);
$rTabPost = httpReq('POST', "{$BASE}/login.php?switch_account=1&portal_ctx=user", $cfTab, http_build_query([
    'csrf_token' => $tokTab,
    'email'      => $accounts['user']['email'],
    'password'   => $pass
]));
assertTrue($rTabPost['code'] === 302 && preg_match('/Location:\s*.*index\.html/i', $rTabPost['headers']), '10. Multi-tab portal_ctx login with stale tab cookie succeeds');
@unlink($cfTab);

// 11. Logging in via JavaScript/AJAX (api/auth/login.php) with X-CSRF-Token
$cfAjax = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fs_csrf_ajax_" . getmypid() . ".txt";
@unlink($cfAjax);
$rCsrfApi = httpReq('GET', "{$BASE}/api/auth/csrf.php", $cfAjax);
$csrfJson = json_decode($rCsrfApi['body'], true);
$ajaxTok = (string)($csrfJson['csrf_token'] ?? '');
$rAjaxLogin = httpReq('POST', "{$BASE}/api/auth/login.php", $cfAjax, json_encode([
    'email'    => $accounts['user']['email'],
    'password' => $pass
]), ['Content-Type: application/json', 'X-CSRF-Token: ' . $ajaxTok]);
$ajaxJson = json_decode($rAjaxLogin['body'], true);
assertTrue($rAjaxLogin['code'] === 200 && !empty($ajaxJson['success']), '11. AJAX login via api/auth/login.php with X-CSRF-Token succeeds');
@unlink($cfAjax);
@unlink($cf);

// Cleanup test accounts
$ids = array_column($accounts, 'id');
$db->exec("DELETE FROM users WHERE id IN (" . implode(',', $ids) . ")");

echo "\nSUMMARY: PASSED={$passed}, FAILED={$failed}\n";
exit($failed > 0 ? 1 : 0);
