<?php
/**
 * FitSync AI — Core Helper Functions
 */

declare(strict_types=1);

/**
 * Escape HTML output to prevent XSS.
 *
 * @param mixed $value
 * @return string
 */
function e($value): string {
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Output a standardized JSON response and terminate script execution.
 *
 * @param array $data
 * @param int $statusCode
 * @return void
 */
function jsonResponse(array $data, int $statusCode = 200): void {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($statusCode);
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Check if current HTTP request is an AJAX or API fetch request.
 *
 * @return bool
 */
function isAjaxRequest(): bool {
    $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    $acceptHeader = $_SERVER['HTTP_ACCEPT'] ?? '';
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    return strtolower($requestedWith) === 'xmlhttprequest'
        || strpos($acceptHeader, 'application/json') !== false
        || strpos($contentType, 'application/json') !== false;
}

/**
 * Set a session flash notification.
 *
 * @param string $type ('success', 'danger', 'warning', 'info')
 * @param string $message
 * @return void
 */
function setFlash(string $type, string $message): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        $_SESSION['flash'] = [
            'type'    => $type,
            'message' => $message
        ];
    }
}

/**
 * Retrieve and clear the session flash notification.
 *
 * @return array|null
 */
function getFlash(): ?array {
    if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

/**
 * Generate fully qualified application URL.
 *
 * @param string $path
 * @return string
 */
if (!function_exists('url')) {
    function url(string $path = ''): string {
        $baseUrl = defined('BASE_URL') ? BASE_URL : '';
        return rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
    }
}

/**
 * Generate asset URL.
 *
 * @param string $path
 * @return string
 */
if (!function_exists('asset')) {
    function asset(string $path): string {
        $baseUrl = defined('BASE_URL') ? BASE_URL : '';
        return rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
    }
}

/**
 * Sanitize plain string input.
 *
 * @param string $str
 * @return string
 */
function sanitizeString(string $str): string {
    return trim(strip_tags($str));
}
