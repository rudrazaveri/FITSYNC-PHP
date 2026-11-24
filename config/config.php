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

// Detect Base URL robustly across all entry points, subfolders, and environments
function getBaseUrl() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';

    $projectRoot = dirname(__DIR__); // Absolute project root on disk
    $scriptFilename = $_SERVER['SCRIPT_FILENAME'] ?? '';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

    // Normalize forward slashes
    $pr = str_replace('\\', '/', $projectRoot);
    $sf = str_replace('\\', '/', $scriptFilename);
    $sn = str_replace('\\', '/', $scriptName);

    // Primary resolution: compare filesystem script path against project root
    if (!empty($sf) && !empty($pr) && strncmp($sf, $pr, strlen($pr)) === 0) {
        $relScript = ltrim(substr($sf, strlen($pr)), '/');
        if (!empty($relScript) && substr($sn, -strlen($relScript)) === $relScript) {
            $basePath = rtrim(substr($sn, 0, strlen($sn) - strlen($relScript)), '/');
            return $protocol . $host . $basePath;
        }
    }

    // Secondary resolution: strip known project subdirectories from dirname(SCRIPT_NAME)
    $scriptDir = str_replace('\\', '/', dirname($scriptName));
    $basePath = preg_replace('#/(api(/auth|/trainer)?|trainer|user|gym_owner|admin|config)$#i', '', $scriptDir);
    $basePath = rtrim($basePath, '/\\');

    return $protocol . $host . ($basePath ? $basePath : '');
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
