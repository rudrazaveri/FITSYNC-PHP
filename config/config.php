<?php
/**
 * FitSync AI — Core Application Configuration
 * Loads environment variables, configures base constants, and sets up path helpers.
 */

// Error reporting settings (can be toggled in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Base application constants
define('APP_NAME', 'FitSync AI');
define('APP_TAGLINE', 'Your Fitness. Your Health. Your Intelligence.');
define('APP_VERSION', '2.5 (PHP)');

// Automatically parse .env.local or .env if present in root
function loadEnv($filePath) {
    if (!file_exists($filePath)) return;
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value, " \t\n\r\0\x0B\"'");
            if (!isset($_ENV[$key])) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
}

// Load env files
$rootDir = dirname(__DIR__);
loadEnv($rootDir . '/.env.local');
loadEnv($rootDir . '/.env');

// Detect Base URL
function getBaseUrl() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
    $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    
    // Normalize path
    $base = rtrim($scriptDir, '/\\');
    
    // If running in subfolder like /FIT-SYNC AI php/
    return $protocol . $host . ($base ? $base : '');
}

define('BASE_URL', getBaseUrl());

// Helper for asset URLs
function asset($path) {
    return rtrim(BASE_URL, '/') . '/' . ltrim($path, '/');
}

// Helper for page URLs
function url($path = '') {
    return rtrim(BASE_URL, '/') . '/' . ltrim($path, '/');
}
