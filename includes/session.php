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
function resolvePortalContextFromRequest(): string {
    $raw = strtolower(trim((string)(
        $_SERVER['HTTP_X_FITSYNC_PORTAL']
        ?? $_GET['portal_ctx']
        ?? ''
    )));
    if ($raw === 'member') $raw = 'user';
    if ($raw === 'coach') $raw = 'trainer';
    if ($raw === 'owner') $raw = 'gym_owner';
    if (in_array($raw, ['user', 'trainer', 'gym_owner', 'admin'], true)) {
        return $raw;
    }

    $uriPath = (string)(parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?? '');
    if (preg_match('#/(trainer|gym_owner|admin)/#i', $uriPath, $m)) {
        return strtolower($m[1]);
    }
    return '';
}

function getPortalTabCookieName(string $portal): string {
    return 'FITSYNC_TAB_' . strtoupper(trim($portal));
}

function publishPortalTabCookies(array $roles, int $lifetime = 7200): void {
    if (session_status() !== PHP_SESSION_ACTIVE || headers_sent()) {
        return;
    }
    $sid = session_id();
    if ($sid === '') return;

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? '') == 443;
    $sameSite = $_ENV['SESSION_COOKIE_SAMESITE'] ?? 'Lax';
    $expires = time() + max(300, $lifetime);

    foreach (array_unique($roles) as $r) {
        $r = strtolower(trim((string)$r));
        if (!in_array($r, ['user', 'trainer', 'gym_owner', 'admin'], true)) continue;
        setcookie(getPortalTabCookieName($r), $sid, [
            'expires'  => $expires,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => $sameSite
        ]);
    }
}

/**
 * Initialize PHP session with strict security parameters and per-portal tab isolation.
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

    // Configure security directives and single unified session name across all portals
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_cookies', '1');
    ini_set('session.use_only_cookies', '1');

    session_name('FITSYNC_SESSION');

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => $sameSite
    ]);

    // If this tab targets a specific portal and has a companion tab session cookie, resume that portal's session
    $portalCtx = resolvePortalContextFromRequest();
    $tabCookie = '';
    $tabSid = '';
    if ($portalCtx !== '') {
        $tabCookie = getPortalTabCookieName($portalCtx);
        $tabSid = (string)($_COOKIE[$tabCookie] ?? '');
        if ($tabSid !== '' && preg_match('/^[a-zA-Z0-9,-]{16,128}$/', $tabSid)) {
            session_id($tabSid);
        }
    }

    session_start();

    // If strict_mode rejected an expired/unknown tab cookie, sync the cookie to the newly issued session_id()
    // so GET -> POST on the same tab always uses the exact same PHP session and CSRF token.
    if ($portalCtx !== '' && $tabCookie !== '' && $tabSid !== '' && session_id() !== $tabSid && !headers_sent()) {
        setcookie($tabCookie, session_id(), [
            'expires'  => time() + $lifetime,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => $sameSite
        ]);
    }

    // Inactivity timeout handling (clears expired auth cleanly and keeps a fresh session)
    if (isset($_SESSION['last_activity'])) {
        if ((time() - $_SESSION['last_activity']) > $lifetime) {
            destroyUserSession();
            session_name('FITSYNC_SESSION');
            session_start();
            $_SESSION['last_activity'] = time();
            return;
        }
    }
    $_SESSION['last_activity'] = time();
}

/**
 * Regenerate current session ID securely to prevent session fixation.
 * Preserves companion portal sessions on disk when signing into another portal tab.
 *
 * @param bool $deleteOldSession
 * @return void
 */
function regenerateSessionId(bool $deleteOldSession = true): void {
    if (session_status() === PHP_SESSION_ACTIVE && !headers_sent()) {
        $preserveOtherTabs = !empty($_SESSION['user_id']) ? false : $deleteOldSession;
        session_regenerate_id($preserveOtherTabs);
    }
}

/**
 * Securely destroy the active session, clear matching cookies, and remove DB session record.
 *
 * @return void
 */
function destroyUserSession(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return;
    }

    $destroyedSid = session_id();

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

    // Expire matching tab/session cookies in browser without breaking other open portal tabs
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        $isAll = !empty($_GET['all']);
        if ($isAll || ($_COOKIE[session_name()] ?? '') === $destroyedSid || count(array_filter(array_keys($_COOKIE), fn($k) => str_starts_with($k, 'FITSYNC_TAB_'))) <= 1) {
            setcookie(session_name(), '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
        }
        foreach (['user', 'trainer', 'gym_owner', 'admin'] as $p) {
            $ck = getPortalTabCookieName($p);
            if ($isAll || ($_COOKIE[$ck] ?? '') === $destroyedSid) {
                setcookie($ck, '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
            }
        }
    }

    session_destroy();
}
