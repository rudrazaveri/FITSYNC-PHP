<?php
/**
 * FitSync AI — Core Authentication & Role-Based Access Control (RBAC)
 *
 * Implements database-backed authentication, registration, session management,
 * password hashing/verification, password reset, and role verification.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/upload_helper.php';

/**
 * Check if the user is currently logged in.
 *
 * @return bool
 */
function isLoggedIn(): bool {
    return !empty($_SESSION['user_id']) && !empty($_SESSION['role']);
}

/**
 * Get the currently authenticated user's session data.
 *
 * @return array|null
 */
function currentUser(): ?array {
    if (!isLoggedIn()) {
        return null;
    }

    $primaryRole = (string)$_SESSION['role'];
    $authRoles = $_SESSION['authorized_roles'] ?? [$primaryRole];
    if (!is_array($authRoles) || empty($authRoles)) {
        $authRoles = [$primaryRole];
    }

    return [
        'id'               => (int)$_SESSION['user_id'],
        'role'             => $primaryRole,
        'authorized_roles' => array_values(array_unique($authRoles)),
        'active_portal'    => (string)($_SESSION['active_portal'] ?? $primaryRole),
        'email'            => (string)($_SESSION['email'] ?? ''),
        'full_name'        => (string)($_SESSION['full_name'] ?? ''),
        'name'             => (string)($_SESSION['full_name'] ?? '')
    ];
}

function getCurrentUser(): ?array {
    return currentUser();
}

function getUserAuthorizedRoles(int $userId, string $primaryRole): array {
    $roles = [$primaryRole];
    $db = getDbConnection();
    if ($db !== null && $userId > 0) {
        try {
            $st = $db->prepare("SELECT role FROM user_roles WHERE user_id = :uid");
            $st->execute([':uid' => $userId]);
            foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $r) {
                $r = trim((string)$r);
                if ($r !== '' && !in_array($r, $roles, true)) {
                    $roles[] = $r;
                }
            }
        } catch (Throwable $e) {
            // Table may not exist on un-migrated instances; fallback cleanly to primaryRole
        }
    }
    return $roles;
}

function normalizePortalKey(string $portal): string {
    $p = strtolower(trim($portal));
    if ($p === 'member' || $p === 'user' || $p === 'athlete') return 'user';
    if ($p === 'coach' || $p === 'trainer') return 'trainer';
    if ($p === 'owner' || $p === 'gym_owner') return 'gym_owner';
    if ($p === 'admin' || $p === 'platform_admin') return 'admin';
    return '';
}

function getPortalDisplayName(string $role): string {
    return match (normalizePortalKey($role)) {
        'user'      => 'Member Portal',
        'trainer'   => 'Trainer Portal',
        'gym_owner' => 'Gym Owner Portal',
        'admin'     => 'Admin Portal',
        default     => 'FitSync Portal',
    };
}

/**
 * Check if the authenticated user holds any of the required roles (or admin privilege).
 *
 * @param string|array $role
 * @return bool
 */
function hasRole($role): bool {
    if (!isLoggedIn()) {
        return false;
    }

    $userRoles = $_SESSION['authorized_roles'] ?? [(string)$_SESSION['role']];
    if (!is_array($userRoles)) {
        $userRoles = [(string)$_SESSION['role']];
    }
    if (in_array('admin', $userRoles, true)) {
        return true;
    }

    $required = is_array($role) ? $role : [$role];
    foreach ($required as $req) {
        if (in_array((string)$req, $userRoles, true)) {
            return true;
        }
    }
    return false;
}

/**
 * Centralized portal dashboard destination routes.
 */
function getRedirectUrlForRole(?string $role = null): string {
    $role = normalizePortalKey((string)($role ?? ($_SESSION['active_portal'] ?? $_SESSION['role'] ?? 'user')));

    switch ($role) {
        case 'trainer':
            return url('trainer/index.html');
        case 'gym_owner':
            return url('gym_owner/index.html');
        case 'admin':
            return url('admin/index.php');
        case 'user':
        default:
            return url('index.html');
    }
}

function isValidInternalRedirectForRoles(string $rawUrl, array $authorizedRoles): bool {
    $rawUrl = trim($rawUrl);
    if ($rawUrl === '' || preg_match('/[\r\n]/', $rawUrl) || str_contains($rawUrl, '://') || str_starts_with($rawUrl, '//')) {
        return false;
    }

    $parts = parse_url($rawUrl);
    if ($parts === false || !empty($parts['scheme']) || !empty($parts['host'])) {
        return false;
    }

    $path = '/' . ltrim((string)($parts['path'] ?? ''), '/');
    $basePath = parse_url((string)BASE_URL, PHP_URL_PATH) ?: '';
    $basePath = rtrim($basePath, '/');
    if ($basePath !== '' && str_starts_with($path, $basePath . '/')) {
        $path = substr($path, strlen($basePath));
    }

    // Never redirect back into auth endpoints, logout, switchers, or APIs
    if (preg_match('#^/(login|register|logout|forgot_password|reset_password|switch_portal)\.php#i', $path) || str_starts_with($path, '/api/')) {
        return false;
    }

    $isAdmin = in_array('admin', $authorizedRoles, true);

    if (str_starts_with($path, '/trainer/')) {
        return $isAdmin || in_array('trainer', $authorizedRoles, true);
    }
    if (str_starts_with($path, '/gym_owner/')) {
        return $isAdmin || in_array('gym_owner', $authorizedRoles, true);
    }
    if (str_starts_with($path, '/admin/')) {
        return $isAdmin;
    }
    if (str_starts_with($path, '/user/') || preg_match('#^/(index\.html|index\.php|dashboard\.php|workouts\.php|nutrition\.php|attendance\.php|assessment\.php)$#i', $path)) {
        return $isAdmin || in_array('user', $authorizedRoles, true);
    }

    return false;
}

function setIntendedRedirectUrl(?string $requestUri): void {
    initSecureSession();
    $uri = trim((string)$requestUri);
    if ($uri === '' || preg_match('/[\r\n]/', $uri) || str_contains($uri, '://') || str_starts_with($uri, '//')) {
        return;
    }
    if (preg_match('#/(login|register|logout|switch_portal)\.php#i', $uri) || str_contains($uri, '/api/')) {
        return;
    }
    $_SESSION['intended_url'] = $uri;
}

function consumeAuthorizedIntendedUrl(array $authorizedRoles, string $defaultRole): string {
    $intended = (string)($_SESSION['intended_url'] ?? '');
    unset($_SESSION['intended_url']);

    if ($intended !== '' && isValidInternalRedirectForRoles($intended, $authorizedRoles)) {
        return $intended;
    }
    return getRedirectUrlForRole($defaultRole);
}

function renderPortalAccessDeniedPage(string $requiredPortal, ?array $user = null): void {
    http_response_code(403);
    $u = $user ?? currentUser() ?? [];
    $name = htmlspecialchars((string)($u['full_name'] ?? 'Authenticated User'), ENT_QUOTES, 'UTF-8');
    $roleLabel = htmlspecialchars(getPortalDisplayName((string)($u['role'] ?? 'user')), ENT_QUOTES, 'UTF-8');
    $targetLabel = htmlspecialchars(getPortalDisplayName($requiredPortal), ENT_QUOTES, 'UTF-8');
    $homeUrl = htmlspecialchars(getRedirectUrlForRole((string)($u['role'] ?? 'user')), ENT_QUOTES, 'UTF-8');
    $portalKey = normalizePortalKey($requiredPortal);
    $switchLoginUrl = htmlspecialchars(url('login.php?switch_account=1&portal_ctx=' . urlencode($portalKey)), ENT_QUOTES, 'UTF-8');
    $logoutUrl = htmlspecialchars(url('logout.php?portal_ctx=' . urlencode((string)($u['role'] ?? 'user'))), ENT_QUOTES, 'UTF-8');

    echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 Access Denied — FitSync AI</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#F1F5F9; font-family:'Inter',sans-serif; color:#0F172A; padding:24px; }
    .card { max-width:500px; width:100%; background:#fff; border:1px solid #E2E8F0; border-radius:14px; padding:32px; box-shadow:0 10px 25px rgba(15,23,42,0.08); text-align:center; }
    .badge { display:inline-block; background:#FEF2F2; color:#B91C1C; border:1px solid #FECACA; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; margin-bottom:14px; }
    h1 { font-size:21px; font-weight:800; margin:0 0 10px; }
    p { font-size:14px; color:#475569; line-height:1.55; margin:0 0 22px; }
    .actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
    .btn-primary { background:#155DFC; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:700; }
    .btn-green { background:#10B981; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:700; }
    .btn-secondary { background:#F8FAFC; color:#334155; border:1px solid #CBD5E1; text-decoration:none; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">403 Forbidden — Portal Access Denied</span>
    <h1>You don't have access to {$targetLabel}</h1>
    <p>You are currently signed in as <strong>{$name}</strong> ({$roleLabel}). Your account does not have permission to open <strong>{$targetLabel}</strong>. Your current session has been preserved.</p>
    <div class="actions">
      <a href="{$homeUrl}" class="btn-primary">Return to My Portal</a>
      <a href="{$switchLoginUrl}" class="btn-green">Sign In to {$targetLabel} (Keep Other Tab Active)</a>
      <a href="{$logoutUrl}" class="btn-secondary">Sign Out</a>
    </div>
  </div>
</body>
</html>
HTML;
    exit;
}

/**
 * Redirect user to their respective portal based on role.
 */
function redirectByRole(?string $role = null): void {
    $dest = getRedirectUrlForRole($role);
    header('Location: ' . $dest);
    exit;
}

/**
 * Enforce login requirement on a page or API endpoint.
 */
function requireLogin($allowedRoles = null): void {
    initSecureSession();

    if (!isLoggedIn()) {
        if (isAjaxRequest()) {
            jsonResponse([
                'success' => false,
                'message' => 'Authentication required. Please sign in.'
            ], 401);
        } else {
            setIntendedRedirectUrl($_SERVER['REQUEST_URI'] ?? '');
            setFlash('warning', 'Please sign in to access that portal.');
            header('Location: ' . url('login.php'));
            exit;
        }
    }

    if ($allowedRoles !== null) {
        if (!hasRole($allowedRoles)) {
            if (isAjaxRequest()) {
                jsonResponse([
                    'success' => false,
                    'message' => 'Forbidden: You do not have permission to access this resource.'
                ], 403);
            } else {
                $targetRole = is_array($allowedRoles) ? (string)$allowedRoles[0] : (string)$allowedRoles;
                renderPortalAccessDeniedPage($targetRole, currentUser());
            }
        }
    }
}

function requireRole($roles): void {
    requireLogin($roles);
}

/**
 * Enforce authentication and optional role check strictly for JSON API endpoints.
 */
function requireApiAuth($allowedRoles = null): array {
    initSecureSession();

    if (!isLoggedIn()) {
        apiResponse(false, 'Authentication required. Please sign in.', null, 401);
    }

    $user = currentUser();
    if ($allowedRoles !== null && !hasRole($allowedRoles)) {
        apiResponse(false, 'Forbidden: Your account lacks the required portal permission.', null, 403);
    }

    return $user;
}

/**
 * Authenticate a user with email and password using prepared statements.
 *
 * @param string $email
 * @param string $password
 * @param bool $remember
 * @return array
 */
function authenticateUser(string $email, string $password, bool $remember = false): array {
    initSecureSession();

    $email = trim($email);
    if (empty($email) || empty($password)) {
        return [
            'success' => false,
            'message' => 'Please provide both your email address and password.'
        ];
    }

    $db = getDbConnection();
    if ($db === null) {
        return [
            'success' => false,
            'message' => 'Database service currently unreachable. Please try again shortly.'
        ];
    }

    try {
        $stmt = $db->prepare("
            SELECT id, email, password_hash, role, full_name, status
            FROM users
            WHERE email = :email
            LIMIT 1
        ");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Invalid email address or password.'
            ];
        }

        // Account status verification
        if ($user['status'] === 'suspended') {
            return [
                'success' => false,
                'message' => 'Your account has been suspended. Please contact platform administration.'
            ];
        }
        if ($user['status'] === 'deactivated') {
            return [
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact support.'
            ];
        }
        if ($user['status'] !== 'active') {
            return [
                'success' => false,
                'message' => 'Your account is currently inactive.'
            ];
        }

        // Bcrypt password verification
        if (!password_verify($password, $user['password_hash'])) {
            return [
                'success' => false,
                'message' => 'Invalid email address or password.'
            ];
        }

        // Regenerate session ID safely (preserves separate tab sessions on disk if switching accounts)
        regenerateSessionId(false);

        $primaryRole = (string)$user['role'];
        $authorizedRoles = getUserAuthorizedRoles((int)$user['id'], $primaryRole);

        // Populate session state cleanly (separate active_portal from permanent role)
        $_SESSION['user_id']          = (int)$user['id'];
        $_SESSION['role']             = $primaryRole;
        $_SESSION['authorized_roles'] = $authorizedRoles;
        $_SESSION['active_portal']    = $primaryRole;
        $_SESSION['email']            = (string)$user['email'];
        $_SESSION['full_name']        = (string)$user['full_name'];
        $_SESSION['user']             = [
            'id'               => (int)$user['id'],
            'role'             => $primaryRole,
            'authorized_roles' => $authorizedRoles,
            'active_portal'    => $primaryRole,
            'email'            => (string)$user['email'],
            'full_name'        => (string)$user['full_name'],
            'name'             => (string)$user['full_name'],
            'status'           => (string)$user['status']
        ];

        $lifetime = $remember ? 86400 * 30 : (int)($_ENV['SESSION_LIFETIME'] ?? 7200);
        publishPortalTabCookies($authorizedRoles, $lifetime);

        $redirectTarget = consumeAuthorizedIntendedUrl($authorizedRoles, $primaryRole);

        // Update last login timestamp
        $updateStmt = $db->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id");
        $updateStmt->execute([':id' => $user['id']]);

        // Register session in user_sessions table
        try {
            $sessionToken = bin2hex(random_bytes(32));
            $sessionHash = hash('sha256', $sessionToken);
            $_SESSION['session_token_hash'] = $sessionHash;

            $ip = $_SERVER['REMOTE_ADDR'] ?? null;
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $lifetime = $remember ? 86400 * 30 : 7200; // 30 days if remember, else 2 hours

            $sessStmt = $db->prepare("
                INSERT INTO user_sessions (user_id, session_token_hash, ip_address, user_agent, expires_at, created_at, last_active_at)
                VALUES (:uid, :hash, :ip, :ua, DATE_ADD(NOW(), INTERVAL :sec SECOND), NOW(), NOW())
            ");
            $sessStmt->execute([
                ':uid'  => $user['id'],
                ':hash' => $sessionHash,
                ':ip'   => $ip,
                ':ua'   => $ua ? substr($ua, 0, 500) : null,
                ':sec'  => $lifetime
            ]);
        } catch (Throwable $sessErr) {
            error_log("[FitSync Auth] Session table insert error: " . $sessErr->getMessage());
        }

        return [
            'success'  => true,
            'message'  => 'Sign in successful.',
            'user'     => $_SESSION['user'],
            'redirect' => $redirectTarget
        ];
    } catch (PDOException $e) {
        error_log("[FitSync Auth] Login error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'An authentication error occurred. Please try again.'
        ];
    }
}

function mapRegistrationGoalType(string $goalText): string {
    $g = strtolower(trim($goalText));
    if (str_contains($g, 'loss') || str_contains($g, 'fat') || str_contains($g, 'lean')) return 'fat_loss';
    if (str_contains($g, 'muscle') || str_contains($g, 'hypertrophy') || str_contains($g, 'build')) return 'hypertrophy';
    if (str_contains($g, 'strength') || str_contains($g, 'power')) return 'strength';
    if (str_contains($g, 'endurance') || str_contains($g, 'cardio')) return 'endurance';
    return 'maintenance';
}

function mapRegistrationActivityMultiplier(string $activityText): float {
    $a = strtolower(trim($activityText));
    if (is_numeric($a) && (float)$a >= 1.1 && (float)$a <= 2.2) return (float)$a;
    if (str_contains($a, 'sedentary') || str_contains($a, '1.2')) return 1.200;
    if (str_contains($a, 'light') || str_contains($a, '1.375')) return 1.375;
    if (str_contains($a, 'very') || str_contains($a, '1.725')) return 1.725;
    if (str_contains($a, 'extra') || str_contains($a, 'extreme') || str_contains($a, '1.9')) return 1.900;
    return 1.550;
}

function recordAuthSessionRecord(PDO $db, int $userId, string $role, string $email, string $fullName): void {
    try {
        $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (:uid, :role)")
            ->execute([':uid' => $userId, ':role' => $role]);
    } catch (Throwable $e) {
        // Ignore if table not yet migrated
    }

    regenerateSessionId(false);
    $_SESSION['user_id']          = $userId;
    $_SESSION['role']             = $role;
    $_SESSION['authorized_roles'] = [$role];
    $_SESSION['active_portal']    = $role;
    $_SESSION['email']            = $email;
    $_SESSION['full_name']        = $fullName;
    $_SESSION['user']             = [
        'id'               => $userId,
        'role'             => $role,
        'authorized_roles' => [$role],
        'active_portal'    => $role,
        'email'            => $email,
        'full_name'        => $fullName,
        'name'             => $fullName,
        'status'           => 'active'
    ];
    publishPortalTabCookies([$role], (int)($_ENV['SESSION_LIFETIME'] ?? 7200));

    try {
        $sessionToken = bin2hex(random_bytes(32));
        $sessionHash = hash('sha256', $sessionToken);
        $_SESSION['session_token_hash'] = $sessionHash;
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;

        $sessStmt = $db->prepare("
            INSERT INTO user_sessions (user_id, session_token_hash, ip_address, user_agent, expires_at, created_at, last_active_at)
            VALUES (:uid, :hash, :ip, :ua, DATE_ADD(NOW(), INTERVAL 7200 SECOND), NOW(), NOW())
        ");
        $sessStmt->execute([
            ':uid'  => $userId,
            ':hash' => $sessionHash,
            ':ip'   => $ip,
            ':ua'   => $ua ? substr($ua, 0, 500) : null
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync Auth] Session table insert error: ' . $e->getMessage());
    }
}

/**
 * Unified, transactional, role-specific registration handler for:
 * - 'user' (Gym Member)
 * - 'trainer' (Fitness Trainer)
 * - 'gym_owner' (Gym Owner)
 *
 * Strictly rejects 'admin' or disallowed roles, rejects role-payload mismatches,
 * validates phone numbers, stores secure file uploads, and rolls back on failure.
 */
function registerUser(array $data, array $uploadedFiles = []): array {
    initSecureSession();

    // 1. Validate & normalize requested role strictly on server
    $rawRole = strtolower(trim((string)($data['role'] ?? 'user')));
    if ($rawRole === '' || $rawRole === 'member') {
        $rawRole = 'user';
    }
    $allowedPublicRoles = ['user', 'trainer', 'gym_owner'];
    if (!in_array($rawRole, $allowedPublicRoles, true)) {
        return [
            'success'     => false,
            'status_code' => 403,
            'message'     => 'Forbidden: Selected account role cannot be created through public registration.'
        ];
    }
    $role = $rawRole;

    // 2. Reject mismatched role-specific field tampering (e.g., Trainer/Owner payload submitted with role='user')
    $trainerOnlyKeys = ['certification_name', 'certifying_body', 'qualifications', 'trainer_specialization', 'training_approach', 'areas_of_expertise'];
    $ownerOnlyKeys   = ['gym_name', 'gym_email', 'gym_phone', 'address_line1', 'gym_address', 'business_registration'];
    if ($role === 'user') {
        foreach (array_merge($trainerOnlyKeys, $ownerOnlyKeys) as $k) {
            if (!empty(trim((string)($data[$k] ?? '')))) {
                return [
                    'success'     => false,
                    'status_code' => 400,
                    'message'     => 'Invalid registration payload: submitted role fields do not match Gym Member registration.'
                ];
            }
        }
        if (isset($uploadedFiles['certification_doc']) && ($uploadedFiles['certification_doc']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            return ['success' => false, 'status_code' => 400, 'message' => 'Certification upload is only permitted for Trainer registration.'];
        }
    } elseif ($role === 'trainer') {
        foreach ($ownerOnlyKeys as $k) {
            if (!empty(trim((string)($data[$k] ?? '')))) {
                return [
                    'success'     => false,
                    'status_code' => 400,
                    'message'     => 'Invalid registration payload: Gym Owner fields are not permitted for Trainer registration.'
                ];
            }
        }
    }

    // 3. Common Personal Validation
    $fullName = trim((string)($data['full_name'] ?? $data['fullName'] ?? ''));
    $email    = trim(strtolower((string)($data['email'] ?? '')));
    $mobile   = trim((string)($data['mobile'] ?? $data['phone'] ?? ''));
    $password = (string)($data['password'] ?? '');
    $hasConfirm = array_key_exists('confirm_password', $data) || array_key_exists('confirmPassword', $data);
    $confirmPassword = (string)($data['confirm_password'] ?? $data['confirmPassword'] ?? '');

    if ($fullName === '' || mb_strlen($fullName) < 2) {
        return ['success' => false, 'status_code' => 400, 'message' => 'Please provide your full legal name (at least 2 characters).'];
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'status_code' => 400, 'message' => 'Please provide a valid email address.'];
    }
    if ($mobile !== '' && !preg_match('/^\+?[0-9\s\-\(\)]{7,20}$/', $mobile)) {
        return ['success' => false, 'status_code' => 400, 'message' => 'Please provide a valid mobile number (7 to 20 digits).'];
    }
    if (($role === 'trainer' || $role === 'gym_owner') && $mobile === '') {
        return ['success' => false, 'status_code' => 400, 'message' => 'Mobile number is required for ' . ($role === 'trainer' ? 'Trainer' : 'Gym Owner') . ' registration.'];
    }
    if (mb_strlen($password) < 6) {
        return ['success' => false, 'status_code' => 400, 'message' => 'Password must contain at least 6 characters.'];
    }
    if ($hasConfirm && $password !== $confirmPassword) {
        return ['success' => false, 'status_code' => 400, 'message' => 'Password and confirm password do not match.'];
    }

    // Role-specific pre-validation before touching DB
    if ($role === 'trainer') {
        $specInput = trim((string)($data['specialization'] ?? $data['trainer_specialization'] ?? ''));
        $certName  = trim((string)($data['certification_name'] ?? $data['certifications'] ?? ''));
        $certBody  = trim((string)($data['certifying_body'] ?? $data['certification_issuer'] ?? ''));
        $bioText   = trim((string)($data['bio'] ?? ''));
        if ($specInput === '') {
            return ['success' => false, 'status_code' => 400, 'message' => 'Please select your primary trainer specialization.'];
        }
        if ($certName === '' || $certBody === '') {
            return ['success' => false, 'status_code' => 400, 'message' => 'Certification name and issuing organization are required for Trainer registration.'];
        }
        if (mb_strlen($bioText) < 10) {
            return ['success' => false, 'status_code' => 400, 'message' => 'Please provide a brief professional biography (at least 10 characters).'];
        }
    } elseif ($role === 'gym_owner') {
        $gymName    = trim((string)($data['gym_name'] ?? ''));
        $gymEmail   = trim(strtolower((string)($data['gym_email'] ?? '')));
        $gymPhone   = trim((string)($data['gym_phone'] ?? ''));
        $gymAddress = trim((string)($data['address_line1'] ?? $data['gym_address'] ?? ''));
        $gymCity    = trim((string)($data['city'] ?? ''));
        $gymState   = trim((string)($data['state'] ?? ''));
        $gymPin     = trim((string)($data['postal_code'] ?? $data['pin_code'] ?? ''));

        if ($gymName === '' || $gymAddress === '' || $gymCity === '' || $gymState === '' || $gymPin === '') {
            return ['success' => false, 'status_code' => 400, 'message' => 'Official gym name, address, city, state, and PIN code are required.'];
        }
        if (!filter_var($gymEmail, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'status_code' => 400, 'message' => 'Please provide a valid official gym email address.'];
        }
        if ($gymPhone === '' || !preg_match('/^\+?[0-9\s\-\(\)]{7,20}$/', $gymPhone)) {
            return ['success' => false, 'status_code' => 400, 'message' => 'Please provide a valid gym contact number.'];
        }
    }

    $db = getDbConnection();
    if ($db === null) {
        return ['success' => false, 'status_code' => 500, 'message' => 'Database service currently unreachable. Please try again shortly.'];
    }

    try {
        $checkStmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $checkStmt->execute([':email' => $email]);
        if ($checkStmt->fetch()) {
            return ['success' => false, 'status_code' => 409, 'message' => 'An account with this email address already exists. Please sign in instead.'];
        }

        if ($mobile !== '') {
            $mobileStmt = $db->prepare("SELECT id FROM users WHERE mobile = :mobile LIMIT 1");
            $mobileStmt->execute([':mobile' => $mobile]);
            if ($mobileStmt->fetch()) {
                return ['success' => false, 'status_code' => 409, 'message' => 'An account with this mobile number already exists.'];
            }
        } else {
            $mobile = null;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $db->beginTransaction();

        $insertUser = $db->prepare("
            INSERT INTO users (email, mobile, password_hash, role, full_name, status, created_at, updated_at)
            VALUES (:email, :mobile, :phash, :role, :name, 'active', NOW(), NOW())
        ");
        $insertUser->execute([
            ':email'  => $email,
            ':mobile' => $mobile,
            ':phash'  => $passwordHash,
            ':role'   => $role,
            ':name'   => $fullName
        ]);
        $newUserId = (int)$db->lastInsertId();

        // Optional Profile Photo upload
        $profilePicId = null;
        if (!empty($uploadedFiles['profile_photo']) && ($uploadedFiles['profile_photo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            $profilePicId = fitSyncStoreUploadedFile($db, $uploadedFiles['profile_photo'], 'profile_picture', $newUserId, false, false);
            if ($profilePicId !== null) {
                $db->prepare("UPDATE users SET profile_picture_id = :fid WHERE id = :uid")->execute([':fid' => $profilePicId, ':uid' => $newUserId]);
            }
        }

        // Gender & Date of Birth parsing
        $rawGender = strtolower(trim((string)($data['gender'] ?? 'prefer_not_to_say')));
        $gender = in_array($rawGender, ['male', 'female', 'other', 'prefer_not_to_say'], true) ? $rawGender : 'prefer_not_to_say';
        $dob = null;
        if (!empty($data['date_of_birth'])) {
            $dobCandidate = trim((string)$data['date_of_birth']);
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dobCandidate)) {
                $dob = $dobCandidate;
            }
        } elseif (!empty($data['age']) && is_numeric($data['age'])) {
            $ageInt = max(14, min(95, (int)$data['age']));
            $dob = ((int)date('Y') - $ageInt) . '-01-01';
        }

        // Default settings & notification prefs for all roles
        $db->prepare("
            INSERT INTO user_settings (user_id, theme, language, measurement_system, timezone)
            VALUES (:uid, 'light', 'en', 'metric', 'Asia/Kolkata')
        ")->execute([':uid' => $newUserId]);

        $db->prepare("
            INSERT INTO notification_preferences (user_id, event_type, in_app, email, sms, push) VALUES
            (:uid1, 'workout_reminder', 1, 1, 0, 1),
            (:uid2, 'trainer_message', 1, 1, 0, 1),
            (:uid3, 'goal_achieved', 1, 1, 0, 1)
        ")->execute([':uid1' => $newUserId, ':uid2' => $newUserId, ':uid3' => $newUserId]);

        $extraResponse = [];

        // =====================================================================
        // ROLE-SPECIFIC REGISTRATION FLOWS
        // =====================================================================
        if ($role === 'user') {
            $heightCm = (!empty($data['height']) || !empty($data['height_cm'])) ? (float)($data['height_cm'] ?? $data['height']) : null;
            $weightKg = (!empty($data['weight']) || !empty($data['weight_kg'])) ? (float)($data['weight_kg'] ?? $data['weight']) : null;
            if ($heightCm !== null && ($heightCm < 80 || $heightCm > 260)) {
                throw new InvalidArgumentException('Height must be between 80 cm and 260 cm.');
            }
            if ($weightKg !== null && ($weightKg < 20 || $weightKg > 350)) {
                throw new InvalidArgumentException('Weight must be between 20 kg and 350 kg.');
            }

            $rawExp = strtolower(trim((string)($data['fitness_experience'] ?? $data['activityLevel'] ?? 'intermediate')));
            $fitnessExp = in_array($rawExp, ['beginner', 'intermediate', 'advanced', 'elite'], true) ? $rawExp : 'intermediate';

            $requestedGymId = !empty($data['gym_id']) ? (int)$data['gym_id'] : 0;
            $preferredGymId = null;
            $gymRow = null;
            if ($requestedGymId > 0) {
                $gChk = $db->prepare("SELECT id, name, owner_user_id FROM gyms WHERE id = :gid AND status = 'active' LIMIT 1");
                $gChk->execute([':gid' => $requestedGymId]);
                $gymRow = $gChk->fetch(PDO::FETCH_ASSOC);
                if (!$gymRow) {
                    throw new InvalidArgumentException('Selected gym is not verified or unavailable.');
                }
                $preferredGymId = (int)$gymRow['id'];
            }

            $db->prepare("
                INSERT INTO user_profiles (user_id, date_of_birth, gender, height_cm, weight_kg, fitness_experience, preferred_gym_id)
                VALUES (:uid, :dob, :gender, :h, :w, :exp, :pgid)
            ")->execute([
                ':uid'    => $newUserId,
                ':dob'    => $dob,
                ':gender' => $gender,
                ':h'      => $heightCm,
                ':w'      => $weightKg,
                ':exp'    => $fitnessExp,
                ':pgid'   => $preferredGymId
            ]);

            if ($weightKg !== null) {
                $db->prepare("
                    INSERT INTO body_measurements (user_id, recorded_at, weight_kg, notes, created_at)
                    VALUES (:uid, CURDATE(), :w, 'Initial registration measurement', NOW())
                ")->execute([':uid' => $newUserId, ':w' => $weightKg]);
            }

            $goalTitle = trim((string)($data['primary_goal'] ?? $data['goal'] ?? 'General Fitness'));
            $goalType  = mapRegistrationGoalType($goalTitle);
            $db->prepare("
                INSERT INTO fitness_goals (user_id, title, goal_type, starting_weight_kg, status, progress_pct, created_at)
                VALUES (:uid, :title, :gtype, :sw, 'active', 0, NOW())
            ")->execute([
                ':uid'   => $newUserId,
                ':title' => mb_substr($goalTitle !== '' ? $goalTitle : 'General Fitness', 0, 200),
                ':gtype' => $goalType,
                ':sw'    => $weightKg
            ]);

            if ($heightCm !== null && $weightKg !== null) {
                $ageVal = $dob ? max(14, (int)date('Y') - (int)substr($dob, 0, 4)) : 25;
                $mult = mapRegistrationActivityMultiplier((string)($data['activity_level'] ?? $data['activityLevel'] ?? '1.55'));
                $sexOffset = ($gender === 'female') ? -161 : 5;
                $bmr = (int)round((10 * $weightKg) + (6.25 * $heightCm) - (5 * $ageVal) + $sexOffset);
                $tdee = (int)round($bmr * $mult);
                $targetCal = $goalType === 'fat_loss' ? max(1400, $tdee - 400) : ($goalType === 'hypertrophy' ? $tdee + 300 : $tdee);
                $protG = (int)round($weightKg * 1.8);
                $fatG  = (int)round(($targetCal * 0.25) / 9);
                $carbG = max(50, (int)round(($targetCal - ($protG * 4) - ($fatG * 9)) / 4));
                $bmi = round($weightKg / pow($heightCm / 100, 2), 1);
                $assessGender = in_array($gender, ['male', 'female', 'other'], true) ? $gender : 'male';

                $db->prepare("
                    INSERT INTO fitness_assessments (user_id, assessment_date, height_cm, weight_kg, age, gender, activity_level, bmr_kcal, tdee_kcal, target_calories_kcal, target_protein_g, target_carbs_g, target_fat_g, bmi, notes, created_at)
                    VALUES (:uid, CURDATE(), :h, :w, :age, :g, :act, :bmr, :tdee, :tcal, :tp, :tc, :tf, :bmi, 'Initial biometric baseline on registration', NOW())
                ")->execute([
                    ':uid' => $newUserId, ':h' => $heightCm, ':w' => $weightKg, ':age' => $ageVal, ':g' => $assessGender,
                    ':act' => $mult, ':bmr' => $bmr, ':tdee' => $tdee, ':tcal' => $targetCal,
                    ':tp' => $protG, ':tc' => $carbG, ':tf' => $fatG, ':bmi' => $bmi
                ]);
            }

            // Optional Gym Membership Request (strictly verified active gym, pending owner approval)
            $wantsMembership = !empty($data['request_membership']) || !empty($data['plan_id']);
            if ($preferredGymId !== null && $gymRow) {
                if ($wantsMembership) {
                    $reqPlanId = !empty($data['plan_id']) ? (int)$data['plan_id'] : 0;
                    if ($reqPlanId > 0) {
                        $pStmt = $db->prepare("SELECT id, name, duration_months FROM membership_plans WHERE id = :pid AND gym_id = :gid AND is_active = 1 LIMIT 1");
                        $pStmt->execute([':pid' => $reqPlanId, ':gid' => $preferredGymId]);
                    } else {
                        $pStmt = $db->prepare("SELECT id, name, duration_months FROM membership_plans WHERE gym_id = :gid AND is_active = 1 ORDER BY id ASC LIMIT 1");
                        $pStmt->execute([':gid' => $preferredGymId]);
                    }
                    $planRow = $pStmt->fetch(PDO::FETCH_ASSOC);
                    if (!$planRow) {
                        throw new InvalidArgumentException('Selected membership plan is invalid for the chosen gym.');
                    }
                    $qrToken = 'FS-REQ-' . $newUserId . '-' . bin2hex(random_bytes(6));
                    $months = max(1, (int)$planRow['duration_months']);
                    $db->prepare("
                        INSERT INTO memberships (user_id, plan_id, gym_id, start_date, end_date, status, qr_code_token, auto_renew, created_at)
                        VALUES (:uid, :pid, :gid, CURDATE(), DATE_ADD(CURDATE(), INTERVAL :m MONTH), 'pending', :qr, 0, NOW())
                    ")->execute([
                        ':uid' => $newUserId,
                        ':pid' => (int)$planRow['id'],
                        ':gid' => $preferredGymId,
                        ':m'   => $months,
                        ':qr'  => $qrToken
                    ]);
                    $memReqId = (int)$db->lastInsertId();
                    if (!empty($gymRow['owner_user_id'])) {
                        $db->prepare("
                            INSERT INTO notifications (user_id, title, body, entity_type, entity_id, is_read, created_at)
                            VALUES (:oid, 'New Membership Request', :body, 'membership', :eid, 0, NOW())
                        ")->execute([
                            ':oid'  => (int)$gymRow['owner_user_id'],
                            ':body' => "{$fullName} requested {$planRow['name']} at {$gymRow['name']}. Pending your approval.",
                            ':eid'  => $memReqId
                        ]);
                    }
                    $extraResponse['membership_status'] = 'pending';
                } elseif (!empty($gymRow['owner_user_id'])) {
                    $db->prepare("
                        INSERT INTO notifications (user_id, title, body, entity_type, entity_id, is_read, created_at)
                        VALUES (:oid, 'New Registered Member', :body, 'member_registration', :eid, 0, NOW())
                    ")->execute([
                        ':oid'  => (int)$gymRow['owner_user_id'],
                        ':body' => "{$fullName} registered on FitSync and selected {$gymRow['name']}.",
                        ':eid'  => $newUserId
                    ]);
                }
            }

            // Notify active Platform Admins of New Member registration
            $db->prepare("
                INSERT INTO notifications (user_id, title, body, entity_type, entity_id, is_read, created_at)
                SELECT id, 'New Member Registration', :body, 'user_registration', :eid, 0, NOW()
                FROM users WHERE role = 'admin' AND status = 'active'
            ")->execute([
                ':body' => "{$fullName} ({$email}) registered as a FitSync Member.",
                ':eid'  => $newUserId
            ]);
        } elseif ($role === 'trainer') {
            $bioText          = trim((string)($data['bio'] ?? ''));
            $certName         = trim((string)($data['certification_name'] ?? $data['certifications'] ?? ''));
            $certBody         = trim((string)($data['certifying_body'] ?? $data['certification_issuer'] ?? ''));
            $certYear         = !empty($data['certification_year']) ? (int)$data['certification_year'] : (int)date('Y');
            $expYears         = max(0, min(60, (int)($data['experience_years'] ?? 0)));
            $primarySpec      = trim((string)($data['specialization'] ?? $data['trainer_specialization'] ?? ''));
            $otherSpec        = trim((string)($data['specialization_other'] ?? ''));
            $effectiveSpec    = ($primarySpec === 'Other' && $otherSpec !== '') ? $otherSpec : $primarySpec;
            $qualifications   = trim((string)($data['qualifications'] ?? ''));
            $areasExpertise   = trim((string)($data['areas_of_expertise'] ?? ''));
            $trainingApproach = trim((string)($data['training_approach'] ?? ''));

            $specSummary = implode(', ', array_filter([$effectiveSpec, $areasExpertise]));

            $db->prepare("
                INSERT INTO user_profiles (user_id, date_of_birth, gender, fitness_experience, bio)
                VALUES (:uid, :dob, :gender, 'elite', :bio)
            ")->execute([
                ':uid'    => $newUserId,
                ':dob'    => $dob,
                ':gender' => $gender,
                ':bio'    => $bioText
            ]);

            $db->prepare("
                INSERT INTO trainer_profiles (
                    user_id, certification_name, certifying_body, certification_year,
                    experience_years, specializations_summary, qualifications, areas_of_expertise,
                    training_approach, bio, hourly_rate, rating, reviews_count, status, updated_at
                ) VALUES (
                    :uid, :cname, :cbody, :cyear,
                    :exp, :spec, :qual, :areas,
                    :approach, :bio, 1200.00, 5.00, 0, 'pending_verification', NOW()
                )
            ")->execute([
                ':uid'      => $newUserId,
                ':cname'    => mb_substr($certName, 0, 255),
                ':cbody'    => mb_substr($certBody, 0, 255),
                ':cyear'    => $certYear,
                ':exp'      => $expYears,
                ':spec'     => mb_substr($specSummary, 0, 255),
                ':qual'     => $qualifications !== '' ? mb_substr($qualifications, 0, 255) : null,
                ':areas'    => $areasExpertise !== '' ? mb_substr($areasExpertise, 0, 255) : null,
                ':approach' => $trainingApproach !== '' ? $trainingApproach : null,
                ':bio'      => $bioText
            ]);

            // Normalized specializations link
            $specIds = [];
            if (!empty($data['specialization_ids']) && is_array($data['specialization_ids'])) {
                $specIds = array_map('intval', $data['specialization_ids']);
            }
            if ($effectiveSpec !== '') {
                $spFind = $db->prepare("SELECT id FROM specializations WHERE LOWER(name) = LOWER(:nm) LIMIT 1");
                $spFind->execute([':nm' => $effectiveSpec]);
                $spId = $spFind->fetchColumn();
                if (!$spId) {
                    $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($effectiveSpec));
                    $slug = trim((string)$slug, '-') ?: ('spec-' . $newUserId);
                    $db->prepare("INSERT IGNORE INTO specializations (name, slug, description) VALUES (:nm, :slug, :desc)")
                        ->execute([':nm' => mb_substr($effectiveSpec, 0, 100), ':slug' => mb_substr($slug, 0, 100), ':desc' => $effectiveSpec]);
                    $spFind->execute([':nm' => $effectiveSpec]);
                    $spId = $spFind->fetchColumn();
                }
                if ($spId) {
                    $specIds[] = (int)$spId;
                }
            }
            $tsIns = $db->prepare("INSERT IGNORE INTO trainer_specializations (trainer_id, specialization_id) VALUES (:tid, :sid)");
            foreach (array_unique(array_filter($specIds)) as $sid) {
                $tsIns->execute([':tid' => $newUserId, ':sid' => $sid]);
            }

            // Optional certification document upload
            $credFileId = null;
            if (!empty($uploadedFiles['certification_doc']) && ($uploadedFiles['certification_doc']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
                $credFileId = fitSyncStoreUploadedFile($db, $uploadedFiles['certification_doc'], 'verification_doc', $newUserId, true, true);
            }

            $db->prepare("
                INSERT INTO trainer_credentials (trainer_id, title, issuer, year_obtained, credential_file_id, verification_status)
                VALUES (:tid, :title, :issuer, :yr, :fid, 'pending')
            ")->execute([
                ':tid'    => $newUserId,
                ':title'  => mb_substr($certName, 0, 255),
                ':issuer' => mb_substr($certBody, 0, 255),
                ':yr'     => $certYear,
                ':fid'    => $credFileId
            ]);

            $db->prepare("INSERT INTO verification_requests (user_id, status, submitted_at) VALUES (:uid, 'pending', NOW())")
                ->execute([':uid' => $newUserId]);
            $verifReqId = (int)$db->lastInsertId();

            if ($credFileId !== null) {
                $db->prepare("
                    INSERT INTO verification_documents (request_id, file_id, document_type, status)
                    VALUES (:rid, :fid, 'trainer_certification', 'pending')
                ")->execute([':rid' => $verifReqId, ':fid' => $credFileId]);
            }

            // Optional Gym Affiliation Request
            $assocGymId = !empty($data['gym_id']) && $data['gym_id'] !== 'none' ? (int)$data['gym_id'] : 0;
            $empTypeRaw = trim((string)($data['employment_type'] ?? 'full_time'));
            $empType = in_array($empTypeRaw, ['full_time', 'part_time', 'freelance'], true) ? $empTypeRaw : 'full_time';

            $gymStatus = 'independent';
            if ($assocGymId > 0) {
                $gStmt = $db->prepare("SELECT id, name, owner_user_id FROM gyms WHERE id = :gid AND status = 'active' LIMIT 1");
                $gStmt->execute([':gid' => $assocGymId]);
                $gymRow = $gStmt->fetch(PDO::FETCH_ASSOC);
                if (!$gymRow) {
                    throw new InvalidArgumentException('Selected gym is not verified or cannot accept trainer affiliation requests.');
                }

                $db->prepare("
                    INSERT INTO gym_trainers (gym_id, trainer_user_id, employment_type, status, initiated_by, is_active, joined_at)
                    VALUES (:gid, :tid, :etype, 'pending', 'trainer', 0, CURDATE())
                ")->execute([
                    ':gid'   => $assocGymId,
                    ':tid'   => $newUserId,
                    ':etype' => $empType
                ]);

                if (!empty($gymRow['owner_user_id'])) {
                    $db->prepare("
                        INSERT INTO notifications (user_id, title, body, entity_type, entity_id, is_read, created_at)
                        VALUES (:oid, 'Trainer Affiliation Request', :body, 'trainer_affiliation', :tid, 0, NOW())
                    ")->execute([
                        ':oid'  => (int)$gymRow['owner_user_id'],
                        ':body' => "{$fullName} ({$effectiveSpec}) requested trainer affiliation at {$gymRow['name']}.",
                        ':tid'  => $newUserId
                    ]);
                }
                $gymStatus = 'pending';
            }

            // Notify active Platform Admins of New Trainer registration
            $db->prepare("
                INSERT INTO notifications (user_id, title, body, entity_type, entity_id, is_read, created_at)
                SELECT id, 'New Trainer Registration', :body, 'trainer_registration', :eid, 0, NOW()
                FROM users WHERE role = 'admin' AND status = 'active'
            ")->execute([
                ':body' => "{$fullName} ({$effectiveSpec}) registered as a Trainer and is awaiting verification.",
                ':eid'  => $newUserId
            ]);

            $extraResponse['verification_status'] = 'pending_verification';
            $extraResponse['gym_association_status'] = $gymStatus;
        } elseif ($role === 'gym_owner') {
            $db->prepare("
                INSERT INTO user_profiles (user_id, date_of_birth, gender, fitness_experience)
                VALUES (:uid, :dob, :gender, 'intermediate')
            ")->execute([':uid' => $newUserId, ':dob' => $dob, ':gender' => $gender]);

            $gymName    = trim((string)$data['gym_name']);
            $gymEmail   = trim(strtolower((string)$data['gym_email']));
            $gymPhone   = trim((string)$data['gym_phone']);
            $gymAddress = trim((string)($data['address_line1'] ?? $data['gym_address']));
            $gymAddr2   = trim((string)($data['address_line2'] ?? ''));
            $gymCity    = trim((string)$data['city']);
            $gymState   = trim((string)$data['state']);
            $gymPin     = trim((string)($data['postal_code'] ?? $data['pin_code']));
            $gymCountry = trim((string)($data['country'] ?? 'India')) ?: 'India';
            $gymDesc    = trim((string)($data['gym_description'] ?? ''));
            $regNo      = trim((string)($data['business_registration'] ?? $data['registration_no'] ?? ''));

            $logoFileId = null;
            if (!empty($uploadedFiles['gym_logo']) && ($uploadedFiles['gym_logo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
                $logoFileId = fitSyncStoreUploadedFile($db, $uploadedFiles['gym_logo'], 'gym_photo', $newUserId, false, false);
            }

            $db->prepare("
                INSERT INTO gyms (
                    owner_user_id, name, brand_name, registration_no, email, phone,
                    address_line1, address_line2, city, state, postal_code, country, description,
                    logo_file_id, rating, capacity, status, is_published, verification_status, created_at, updated_at
                ) VALUES (
                    :oid, :name, :brand, :regno, :email, :phone,
                    :addr1, :addr2, :city, :state, :pin, :country, :desc,
                    :logo, 4.80, 50, 'active', 1, 'pending', NOW(), NOW()
                )
            ")->execute([
                ':oid'     => $newUserId,
                ':name'    => mb_substr($gymName, 0, 200),
                ':brand'   => mb_substr($gymName, 0, 200),
                ':regno'   => $regNo !== '' ? mb_substr($regNo, 0, 100) : null,
                ':email'   => $gymEmail,
                ':phone'   => $gymPhone,
                ':addr1'   => mb_substr($gymAddress, 0, 255),
                ':addr2'   => $gymAddr2 !== '' ? mb_substr($gymAddr2, 0, 255) : null,
                ':city'    => mb_substr($gymCity, 0, 100),
                ':state'   => mb_substr($gymState, 0, 100),
                ':pin'     => mb_substr($gymPin, 0, 20),
                ':country' => mb_substr($gymCountry, 0, 100),
                ':desc'    => $gymDesc !== '' ? $gymDesc : null,
                ':logo'    => $logoFileId
            ]);
            $newGymId = (int)$db->lastInsertId();

            // Optional multiple gym photos
            if (!empty($uploadedFiles['gym_photos']) && is_array($uploadedFiles['gym_photos']['name'] ?? null)) {
                $countPhotos = count($uploadedFiles['gym_photos']['name']);
                $coverSet = false;
                for ($i = 0; $i < min(5, $countPhotos); $i++) {
                    if ((int)($uploadedFiles['gym_photos']['error'][$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                        continue;
                    }
                    $singleFile = [
                        'name'     => $uploadedFiles['gym_photos']['name'][$i],
                        'type'     => $uploadedFiles['gym_photos']['type'][$i],
                        'tmp_name' => $uploadedFiles['gym_photos']['tmp_name'][$i],
                        'error'    => $uploadedFiles['gym_photos']['error'][$i],
                        'size'     => $uploadedFiles['gym_photos']['size'][$i]
                    ];
                    $photoFileId = fitSyncStoreUploadedFile($db, $singleFile, 'gym_photo', $newUserId, false, false);
                    if ($photoFileId !== null) {
                        $isPrimary = !$coverSet ? 1 : 0;
                        $db->prepare("
                            INSERT INTO gym_photos (gym_id, file_id, is_primary, display_order)
                            VALUES (:gid, :fid, :prim, :ord)
                        ")->execute([':gid' => $newGymId, ':fid' => $photoFileId, ':prim' => $isPrimary, ':ord' => $i]);
                        if (!$coverSet) {
                            $db->prepare("UPDATE gyms SET cover_photo_id = :fid WHERE id = :gid")->execute([':fid' => $photoFileId, ':gid' => $newGymId]);
                            $coverSet = true;
                        }
                    }
                }
            }

            // Operating Hours (default Mon-Sat 06:00-22:00 unless specified)
            $openTime  = preg_match('/^\d{2}:\d{2}/', (string)($data['open_time'] ?? '')) ? substr((string)$data['open_time'], 0, 5) . ':00' : '06:00:00';
            $closeTime = preg_match('/^\d{2}:\d{2}/', (string)($data['close_time'] ?? '')) ? substr((string)$data['close_time'], 0, 5) . ':00' : '22:00:00';
            $sunOpen   = !empty($data['open_sunday']);
            $hrStmt = $db->prepare("
                INSERT INTO gym_operating_hours (gym_id, day_of_week, open_time, close_time, is_closed)
                VALUES (:gid, :dow, :ot, :ct, :closed)
            ");
            for ($d = 0; $d <= 6; $d++) {
                $isClosed = ($d === 0 && !$sunOpen) ? 1 : 0;
                $hrStmt->execute([
                    ':gid'    => $newGymId,
                    ':dow'    => $d,
                    ':ot'     => $isClosed ? null : $openTime,
                    ':ct'     => $isClosed ? null : $closeTime,
                    ':closed' => $isClosed
                ]);
            }

            // Facilities
            $facIds = is_array($data['facilities'] ?? null) ? array_map('intval', $data['facilities']) : [];
            if (!empty($data['facilities_csv'])) {
                foreach (explode(',', (string)$data['facilities_csv']) as $fName) {
                    $fName = trim($fName);
                    if ($fName === '') continue;
                    $fStmt = $db->prepare("SELECT id FROM facilities WHERE LOWER(name) = LOWER(:nm) LIMIT 1");
                    $fStmt->execute([':nm' => $fName]);
                    $fid = $fStmt->fetchColumn();
                    if (!$fid) {
                        $db->prepare("INSERT IGNORE INTO facilities (name) VALUES (:nm)")->execute([':nm' => mb_substr($fName, 0, 100)]);
                        $fStmt->execute([':nm' => $fName]);
                        $fid = $fStmt->fetchColumn();
                    }
                    if ($fid) $facIds[] = (int)$fid;
                }
            }
            $gfStmt = $db->prepare("INSERT IGNORE INTO gym_facilities (gym_id, facility_id) VALUES (:gid, :fid)");
            foreach (array_unique(array_filter($facIds)) as $fid) {
                $gfStmt->execute([':gid' => $newGymId, ':fid' => $fid]);
            }

            // Equipment
            $eqIds = is_array($data['equipment'] ?? null) ? array_map('intval', $data['equipment']) : [];
            if (!empty($data['equipment_csv'])) {
                foreach (explode(',', (string)$data['equipment_csv']) as $eName) {
                    $eName = trim($eName);
                    if ($eName === '') continue;
                    $eStmt = $db->prepare("SELECT id FROM equipment WHERE LOWER(name) = LOWER(:nm) LIMIT 1");
                    $eStmt->execute([':nm' => $eName]);
                    $eid = $eStmt->fetchColumn();
                    if (!$eid) {
                        $db->prepare("INSERT IGNORE INTO equipment (name, category) VALUES (:nm, 'General')")->execute([':nm' => mb_substr($eName, 0, 100)]);
                        $eStmt->execute([':nm' => $eName]);
                        $eid = $eStmt->fetchColumn();
                    }
                    if ($eid) $eqIds[] = (int)$eid;
                }
            }
            $geStmt = $db->prepare("INSERT IGNORE INTO gym_equipment (gym_id, equipment_id, quantity, condition_status) VALUES (:gid, :eid, 1, 'excellent')");
            foreach (array_unique(array_filter($eqIds)) as $eid) {
                $geStmt->execute([':gid' => $newGymId, ':eid' => $eid]);
            }

            // Ownership Verification Request + optional doc
            $db->prepare("INSERT INTO verification_requests (user_id, status, submitted_at) VALUES (:uid, 'pending', NOW())")
                ->execute([':uid' => $newUserId]);
            $ownerVerifId = (int)$db->lastInsertId();

            if (!empty($uploadedFiles['ownership_doc']) && ($uploadedFiles['ownership_doc']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
                $docFileId = fitSyncStoreUploadedFile($db, $uploadedFiles['ownership_doc'], 'verification_doc', $newUserId, true, true);
                if ($docFileId !== null) {
                    $db->prepare("
                        INSERT INTO verification_documents (request_id, file_id, document_type, status)
                        VALUES (:rid, :fid, 'gym_ownership', 'pending')
                    ")->execute([':rid' => $ownerVerifId, ':fid' => $docFileId]);
                }
            }

            // Default Membership Plan so members can discover & request enrollment immediately
            $planName  = trim((string)($data['default_plan_name'] ?? 'Standard Membership'));
            $planPrice = isset($data['default_plan_price']) && is_numeric($data['default_plan_price']) ? max(0.0, (float)$data['default_plan_price']) : 1500.00;
            $db->prepare("
                INSERT INTO membership_plans (gym_id, name, description, duration_months, price, access_type, is_active, created_at, updated_at)
                VALUES (:gid, :pname, 'Full gym floor & standard equipment access', 1, :pprice, 'single_gym', 1, NOW(), NOW())
            ")->execute([
                ':gid'    => $newGymId,
                ':pname'  => mb_substr($planName !== '' ? $planName : 'Standard Membership', 0, 150),
                ':pprice' => $planPrice
            ]);

            $extraResponse['gym_id'] = $newGymId;
            $extraResponse['gym_status'] = 'active';
            $extraResponse['is_published'] = 1;

            $db->prepare("
                INSERT INTO notifications (user_id, title, body, entity_type, entity_id, is_read, created_at)
                SELECT id, 'New Gym Registration', :body, 'gym_registration', :eid, 0, NOW()
                FROM users WHERE role = 'admin' AND status = 'active'
            ")->execute([
                ':body' => "{$fullName} registered {$gymName} ({$gymCity}, {$gymState}) awaiting approval.",
                ':eid'  => $newGymId
            ]);
        }

        // Generate email verification code in auth_tokens
        $verifyCode = (string)random_int(100000, 999999);
        $verifyHash = hash('sha256', $verifyCode);
        $db->prepare("
            INSERT INTO auth_tokens (user_id, purpose, token_hash, new_email, expires_at, created_at)
            VALUES (:uid, 'email_verify', :th, :em, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW())
        ")->execute([':uid' => $newUserId, ':th' => $verifyHash, ':em' => $email]);
        @mail($email, 'Verify your FitSync email', "Your FitSync verification code is: {$verifyCode}");
        $extraResponse['email_verification_required'] = true;
        $extraResponse['verification_code'] = $verifyCode;

        // Link pending gym invitation if registered via invite token (Phase 4)
        $inviteToken = trim((string)($data['invite_token'] ?? ''));
        if ($inviteToken !== '') {
            $invHash = hash('sha256', $inviteToken);
            $invStmt = $db->prepare("
                SELECT id, gym_id, invited_email, status, expires_at
                FROM gym_invitations
                WHERE token_hash = :th AND status = 'pending' AND expires_at > NOW()
                LIMIT 1
            ");
            $invStmt->execute([':th' => $invHash]);
            $invRow = $invStmt->fetch(PDO::FETCH_ASSOC);
            if ($invRow) {
                if (strtolower(trim((string)$invRow['invited_email'])) !== $email) {
                    throw new InvalidArgumentException('Registration email must match the invited email address (' . $invRow['invited_email'] . ').');
                }
                $db->prepare("UPDATE gym_invitations SET invited_user_id = :uid, updated_at = NOW() WHERE id = :iid")
                    ->execute([':uid' => $newUserId, ':iid' => (int)$invRow['id']]);
                $extraResponse['pending_invitation_id'] = (int)$invRow['id'];
            }
        }

        $db->commit();

        // Authenticate newly created user session
        recordAuthSessionRecord($db, $newUserId, $role, $email, $fullName);

        return array_merge([
            'success'     => true,
            'status_code' => 201,
            'message'     => 'Your FitSync account has been created successfully!',
            'user'        => $_SESSION['user'],
            'redirect'    => getRedirectUrlForRole($role)
        ], $extraResponse);
    } catch (InvalidArgumentException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        return [
            'success'     => false,
            'status_code' => 400,
            'message'     => $e->getMessage()
        ];
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('[FitSync Auth] Registration error: ' . $e->getMessage());
        return [
            'success'     => false,
            'status_code' => 500,
            'message'     => 'An error occurred during account creation. Please verify your details and try again.'
        ];
    }
}

/**
 * Generate a cryptographically secure password reset token.
 *
 * @param string $email
 * @return array
 */
function requestPasswordReset(string $email): array {
    $email = trim($email);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Please enter a valid email address.'
        ];
    }

    $db = getDbConnection();
    if ($db === null) {
        return [
            'success' => false,
            'message' => 'Database service currently unreachable.'
        ];
    }

    try {
        $stmt = $db->prepare("SELECT id, status FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        $plainToken = null;

        if ($user && $user['status'] === 'active') {
            $plainToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $plainToken);

            // Invalidate prior unused tokens
            $invStmt = $db->prepare("
                UPDATE auth_tokens
                SET used_at = NOW()
                WHERE user_id = :uid AND purpose = 'password_reset' AND used_at IS NULL
            ");
            $invStmt->execute([':uid' => $user['id']]);

            // Insert new token valid for 1 hour
            $insertStmt = $db->prepare("
                INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at, created_at)
                VALUES (:uid, 'password_reset', :thash, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW())
            ");
            $insertStmt->execute([
                ':uid'   => $user['id'],
                ':thash' => $tokenHash
            ]);
        }

        // Generic response for security (do not disclose whether email exists)
        $response = [
            'success' => true,
            'message' => 'If this email is registered with FitSync, instructions have been dispatched.'
        ];

        // In local development, expose the token so developer can test without an active SMTP server
        if (defined('APP_ENV') && APP_ENV === 'development' && $plainToken !== null) {
            $response['dev_reset_token'] = $plainToken;
            $response['dev_reset_url'] = url('reset_password.php?token=' . $plainToken);
        }

        return $response;
    } catch (Throwable $e) {
        error_log("[FitSync Auth] Password reset request error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'An error occurred processing your request.'
        ];
    }
}

/**
 * Reset password using a valid, unexpired reset token.
 *
 * @param string $token
 * @param string $newPassword
 * @return array
 */
function resetPasswordWithToken(string $token, string $newPassword): array {
    $token = trim($token);
    if (empty($token)) {
        return ['success' => false, 'message' => 'Invalid or missing password reset token.'];
    }

    if (mb_strlen($newPassword) < 6) {
        return ['success' => false, 'message' => 'New password must be at least 6 characters.'];
    }

    $db = getDbConnection();
    if ($db === null) {
        return ['success' => false, 'message' => 'Database service currently unreachable.'];
    }

    try {
        $tokenHash = hash('sha256', $token);

        $stmt = $db->prepare("
            SELECT id, user_id, expires_at, used_at
            FROM auth_tokens
            WHERE token_hash = :thash AND purpose = 'password_reset'
            LIMIT 1
        ");
        $stmt->execute([':thash' => $tokenHash]);
        $record = $stmt->fetch();

        if (!$record) {
            return ['success' => false, 'message' => 'This password reset link is invalid.'];
        }

        if ($record['used_at'] !== null) {
            return ['success' => false, 'message' => 'This password reset link has already been used.'];
        }

        if (strtotime($record['expires_at']) < time()) {
            return ['success' => false, 'message' => 'This password reset link has expired. Please request a new one.'];
        }

        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

        $db->beginTransaction();

        $updateUser = $db->prepare("UPDATE users SET password_hash = :phash, updated_at = NOW() WHERE id = :uid");
        $updateUser->execute([
            ':phash' => $passwordHash,
            ':uid'   => $record['user_id']
        ]);

        $updateToken = $db->prepare("UPDATE auth_tokens SET used_at = NOW() WHERE id = :id");
        $updateToken->execute([':id' => $record['id']]);

        $db->commit();

        return [
            'success' => true,
            'message' => 'Your password has been successfully updated. You may now sign in with your new password.'
        ];
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("[FitSync Auth] Reset password error: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while resetting your password.'];
    }
}

/**
 * Change password for an authenticated user.
 *
 * @param int $userId
 * @param string $currentPassword
 * @param string $newPassword
 * @return array
 */
function changePassword(int $userId, string $currentPassword, string $newPassword): array {
    if (mb_strlen($newPassword) < 6) {
        return ['success' => false, 'message' => 'New password must be at least 6 characters long.'];
    }

    $db = getDbConnection();
    if ($db === null) {
        return ['success' => false, 'message' => 'Database service currently unreachable.'];
    }

    try {
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = :uid LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
            return ['success' => false, 'message' => 'Current password entered is incorrect.'];
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateStmt = $db->prepare("UPDATE users SET password_hash = :phash, updated_at = NOW() WHERE id = :uid");
        $updateStmt->execute([
            ':phash' => $newHash,
            ':uid'   => $userId
        ]);

        return ['success' => true, 'message' => 'Your password has been changed successfully.'];
    } catch (Throwable $e) {
        error_log("[FitSync Auth] Change password error: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while updating your password.'];
    }
}

/**
 * Log out user by destroying session and removing active database session token.
 *
 * @return void
 */
function logoutUser(): void {
    destroyUserSession();
}
