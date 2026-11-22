<?php
/**
 * FitSync AI — Centralized Database Connection (PDO)
 *
 * Provides a secure, reusable PDO connection to MySQL 8.0 / MariaDB.
 * Reads configuration from .env variables with fallbacks.
 * Uses strict exception error mode and disables emulated prepared statements.
 */

declare(strict_types=1);

/**
 * Returns the singleton PDO database connection instance.
 *
 * @param bool $throwOnError Whether to throw an exception if connection fails
 * @return PDO|null
 * @throws RuntimeException If connection fails and $throwOnError is true
 */
function getDbConnection(bool $throwOnError = false): ?PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
    $port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';
    $dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'fitsync_db';
    $username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
    $password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    try {
        $pdo = new PDO($dsn, $username, $password, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Log detailed error to system logger without exposing credentials
        error_log("[FitSync DB Error] Connection failed: " . $e->getMessage());

        if ($throwOnError) {
            throw new RuntimeException("Database connection error: Unable to connect to database service. Please ensure MySQL is running.");
        }

        return null;
    }
}

/**
 * Helper to check if database connection is currently active.
 *
 * @return bool
 */
function isDbConnected(): bool {
    try {
        $db = getDbConnection();
        if ($db === null) {
            return false;
        }
        $db->query("SELECT 1");
        return true;
    } catch (Throwable $e) {
        return false;
    }
}
