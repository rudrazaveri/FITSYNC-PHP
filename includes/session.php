<?php
/**
 * FitSync AI — Centralized Secure Session Handler
 *
 * Enforces secure cookie attributes (HttpOnly, SameSite, Secure),
 * session inactivity timeouts, fixation protection, and session destruction.
 */

declare(strict_types=1);

/**
 * Initialize PHP session with strict security parameters.
 *
 * @return void
 */
function initSecureSession(): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $lifetime = (int)($_ENV['SESSION_LIFETIME'] ?? 7200); // 2 hours default
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? '') == 443;
    $sameSite = $_ENV['SESSION_COOKIE_SAMESITE'] ?? 'Lax';

    // Configure security directives before session starts
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_cookies', '1');
    ini_set('session.use_only_cookies', '1');

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => $sameSite
    ]);

    session_start();

    // Inactivity timeout handling
    if (isset($_SESSION['last_activity'])) {
        if ((time() - $_SESSION['last_activity']) > $lifetime) {
            // Session has expired
            destroyUserSession();
            return;
        }
    }
    $_SESSION['last_activity'] = time();
}

/**
 * Regenerate current session ID securely to prevent session fixation.
 *
 * @return void
 */
function regenerateSessionId(): void {
    if (session_status() === PHP_SESSION_ACTIVE && !headers_sent()) {
        session_regenerate_id(true);
    }
}

/**
 * Securely destroy the active session, clear cookies, and remove DB session record.
 *
 * @return void
 */
function destroyUserSession(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return;
    }

    // Attempt to remove database session tracking record if present
    try {
        $db = getDbConnection();
        if ($db !== null && !empty($_SESSION['session_token_hash'])) {
            $stmt = $db->prepare("DELETE FROM user_sessions WHERE session_token_hash = :hash");
            $stmt->execute([':hash' => $_SESSION['session_token_hash']]);
        }
    } catch (Throwable $e) {
        error_log("[FitSync Session] Error deleting session record: " . $e->getMessage());
    }

    // Reset session variables
    $_SESSION = [];

    // Expire the session cookie in browser
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();
}
