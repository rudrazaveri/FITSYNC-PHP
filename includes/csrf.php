<?php
/**
 * FitSync AI — Cross-Site Request Forgery (CSRF) Protection
 */

declare(strict_types=1);

/**
 * Generate or retrieve the current session's CSRF token.
 *
 * @return string
 */
function generateCsrfToken(): string {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        if (!headers_sent()) {
            session_start();
        }
    }

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

/**
 * Retrieve the active CSRF token.
 *
 * @return string
 */
function getCsrfToken(): string {
    return generateCsrfToken();
}

/**
 * Render a hidden HTML form input containing the CSRF token.
 *
 * @return string
 */
function csrfInput(): string {
    $token = e(getCsrfToken());
    return '<input type="hidden" name="csrf_token" value="' . $token . '">';
}

/**
 * Validate a submitted CSRF token against the active session token.
 *
 * @param string|null $token
 * @return bool
 */
function validateCsrfToken(?string $token): bool {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return false;
    }

    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }

    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Enforce valid CSRF token for state-changing HTTP requests.
 * Checks $_POST['csrf_token'] and HTTP_X_CSRF_TOKEN header.
 *
 * @return void
 */
function requireCsrfToken(): void {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

    // Also check JSON body if content-type is application/json
    if (empty($token) && !empty($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        if (is_array($json) && !empty($json['csrf_token'])) {
            $token = $json['csrf_token'];
        }
    }

    if (!validateCsrfToken($token)) {
        if (isAjaxRequest()) {
            jsonResponse([
                'success' => false,
                'message' => 'CSRF security token validation failed. Please refresh the page.'
            ], 403);
        } else {
            http_response_code(403);
            die('CSRF security validation failed. Please go back, refresh the page, and try again.');
        }
    }
}
