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

    return [
        'id'        => (int)$_SESSION['user_id'],
        'role'      => (string)$_SESSION['role'],
        'email'     => (string)($_SESSION['email'] ?? ''),
        'full_name' => (string)($_SESSION['full_name'] ?? ''),
        'name'      => (string)($_SESSION['full_name'] ?? '')
    ];
}

/**
 * Alias for currentUser() for backward compatibility.
 *
 * @return array|null
 */
function getCurrentUser(): ?array {
    return currentUser();
}

/**
 * Check if the authenticated user has a specific role or one of multiple roles.
 *
 * @param string|array $role
 * @return bool
 */
function hasRole($role): bool {
    if (!isLoggedIn()) {
        return false;
    }

    $currentRole = (string)$_SESSION['role'];
    if (is_array($role)) {
        return in_array($currentRole, $role, true);
    }

    return $currentRole === (string)$role;
}

/**
 * Get the destination redirect URL for a specific role.
 *
 * @param string|null $role
 * @return string
 */
function getRedirectUrlForRole(?string $role = null): string {
    $role = $role ?? ($_SESSION['role'] ?? 'user');

    switch ($role) {
        case 'trainer':
            return url('trainer/index.html');
        case 'gym_owner':
            return url('gym_owner/index.html');
        case 'admin':
            return url('gym_owner/index.html');
        case 'user':
        default:
            return url('index.html');
    }
}

/**
 * Redirect user to their respective portal based on role.
 *
 * @param string|null $role
 * @return void
 */
function redirectByRole(?string $role = null): void {
    $dest = getRedirectUrlForRole($role);
    header('Location: ' . $dest);
    exit;
}

/**
 * Enforce login requirement on a page or API endpoint.
 *
 * @param array|string|null $allowedRoles Optional role or list of allowed roles
 * @return void
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
            setFlash('warning', 'Please sign in to access that portal.');
            header('Location: ' . url('index.html'));
            exit;
        }
    }

    if ($allowedRoles !== null) {
        $allowed = is_array($allowedRoles) ? $allowedRoles : [$allowedRoles];
        $currentRole = (string)$_SESSION['role'];

        if (!in_array($currentRole, $allowed, true)) {
            if (isAjaxRequest()) {
                jsonResponse([
                    'success' => false,
                    'message' => 'Forbidden: You do not have permission to access this resource.'
                ], 403);
            } else {
                setFlash('danger', 'Access denied: You do not have permission to access that area.');
                redirectByRole($currentRole);
            }
        }
    }
}

/**
 * Enforce specific role requirement.
 *
 * @param array|string $roles
 * @return void
 */
function requireRole($roles): void {
    requireLogin($roles);
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

        // Regenerate session ID to prevent fixation
        regenerateSessionId();

        // Populate session state
        $_SESSION['user_id']   = (int)$user['id'];
        $_SESSION['role']      = (string)$user['role'];
        $_SESSION['email']     = (string)$user['email'];
        $_SESSION['full_name'] = (string)$user['full_name'];
        $_SESSION['user']      = [
            'id'        => (int)$user['id'],
            'role'      => (string)$user['role'],
            'email'     => (string)$user['email'],
            'full_name' => (string)$user['full_name'],
            'name'      => (string)$user['full_name'],
            'status'    => (string)$user['status']
        ];

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
            'redirect' => getRedirectUrlForRole($user['role'])
        ];
    } catch (PDOException $e) {
        error_log("[FitSync Auth] Login error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'An authentication error occurred. Please try again.'
        ];
    }
}

/**
 * Register a new user in MySQL.
 * Strictly forces role = 'user' for public registration.
 *
 * @param array $data
 * @return array
 */
function registerUser(array $data): array {
    initSecureSession();

    $fullName = trim($data['full_name'] ?? $data['fullName'] ?? '');
    $email = trim($data['email'] ?? '');
    $mobile = trim($data['phone'] ?? $data['mobile'] ?? '');
    $password = (string)($data['password'] ?? '');

    // Server-side validation
    if (empty($fullName) || mb_strlen($fullName) < 2) {
        return ['success' => false, 'message' => 'Please provide your full legal name (at least 2 characters).'];
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'message' => 'Please provide a valid email address.'];
    }

    if (mb_strlen($password) < 6) {
        return ['success' => false, 'message' => 'Password must contain at least 6 characters.'];
    }

    $db = getDbConnection();
    if ($db === null) {
        return ['success' => false, 'message' => 'Database service currently unreachable. Please try again shortly.'];
    }

    try {
        // Check for duplicate email
        $checkStmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $checkStmt->execute([':email' => $email]);
        if ($checkStmt->fetch()) {
            return ['success' => false, 'message' => 'An account with this email address already exists. Please sign in instead.'];
        }

        // Check for duplicate mobile if provided
        if (!empty($mobile)) {
            $mobileStmt = $db->prepare("SELECT id FROM users WHERE mobile = :mobile LIMIT 1");
            $mobileStmt->execute([':mobile' => $mobile]);
            if ($mobileStmt->fetch()) {
                return ['success' => false, 'message' => 'An account with this mobile number already exists.'];
            }
        } else {
            $mobile = null;
        }

        // STRICT SECURITY RULE: Public registration creates only standard 'user' role
        $role = 'user';
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // Begin transaction
        $db->beginTransaction();

        $insertUser = $db->prepare("
            INSERT INTO users (email, mobile, password_hash, role, full_name, status, created_at, updated_at)
            VALUES (:email, :mobile, :phash, :role, :name, 'active', NOW(), NOW())
        ");
        $insertUser->execute([
            ':email' => $email,
            ':mobile' => $mobile,
            ':phash' => $passwordHash,
            ':role'  => $role,
            ':name'  => $fullName
        ]);
        $newUserId = (int)$db->lastInsertId();

        // Biometrics & Profile
        $gender = $data['gender'] ?? 'male';
        if (!in_array($gender, ['male', 'female', 'other', 'prefer_not_to_say'], true)) {
            $gender = 'prefer_not_to_say';
        }
        $heightCm = !empty($data['height']) ? (float)$data['height'] : null;
        $weightKg = !empty($data['weight']) ? (float)$data['weight'] : null;
        $fitnessExp = $data['activityLevel'] ?? 'intermediate';
        if (!in_array($fitnessExp, ['beginner', 'intermediate', 'advanced', 'elite'], true)) {
            $fitnessExp = 'intermediate';
        }

        $insertProfile = $db->prepare("
            INSERT INTO user_profiles (user_id, gender, height_cm, weight_kg, fitness_experience)
            VALUES (:uid, :gender, :h, :w, :exp)
        ");
        $insertProfile->execute([
            ':uid'    => $newUserId,
            ':gender' => $gender,
            ':h'      => $heightCm,
            ':w'      => $weightKg,
            ':exp'    => $fitnessExp
        ]);

        // Default User Settings
        $insertSettings = $db->prepare("
            INSERT INTO user_settings (user_id, theme, language, measurement_system, timezone)
            VALUES (:uid, 'dark', 'en', 'metric', 'Asia/Kolkata')
        ");
        $insertSettings->execute([':uid' => $newUserId]);

        // Default Notification Preferences
        $insertNotif = $db->prepare("
            INSERT INTO notification_preferences (user_id, event_type, in_app, email, sms, push) VALUES
            (:uid1, 'workout_reminder', 1, 1, 0, 1),
            (:uid2, 'trainer_message', 1, 1, 0, 1),
            (:uid3, 'goal_achieved', 1, 1, 0, 1)
        ");
        $insertNotif->execute([
            ':uid1' => $newUserId,
            ':uid2' => $newUserId,
            ':uid3' => $newUserId
        ]);

        $db->commit();

        // Automatically authenticate user after registration
        regenerateSessionId();
        $_SESSION['user_id']   = $newUserId;
        $_SESSION['role']      = 'user';
        $_SESSION['email']     = $email;
        $_SESSION['full_name'] = $fullName;
        $_SESSION['user']      = [
            'id'        => $newUserId,
            'role'      => 'user',
            'email'     => $email,
            'full_name' => $fullName,
            'name'      => $fullName,
            'status'    => 'active'
        ];

        return [
            'success'  => true,
            'message'  => 'Your account has been created successfully! Welcome to FitSync.',
            'user'     => $_SESSION['user'],
            'redirect' => url('user/')
        ];
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("[FitSync Auth] Registration error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'An error occurred during account creation. Please try again.'
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
