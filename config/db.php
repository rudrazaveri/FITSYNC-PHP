<?php
/**
 * FitSync AI — Centralized Database Connection (PDO: Supabase PostgreSQL / MySQL)
 *
 * Reads configuration from .env variables.
 * When DB_DRIVER=pgsql (or SUPABASE_DATABASE_URL is configured with DB_DRIVER=pgsql),
 * connects to Supabase PostgreSQL via PDO and provides transparent SQL compatibility
 * for FitSync's prepared statements.
 */

declare(strict_types=1);

class FitSyncPgCompatPdo extends PDO {
    private static array $conflictTargets = [
        'user_profiles'            => 'user_id',
        'user_settings'            => 'user_id',
        'trainer_profiles'         => 'user_id',
        'gym_trainers'             => 'gym_id, trainer_user_id',
        'trainer_data_permissions' => 'assignment_id',
        'exercise_set_logs'        => 'session_exercise_id, set_number',
        'workout_feedback'         => 'session_id',
        'gym_operating_hours'      => 'gym_id, day_of_week',
        'gym_equipment'            => 'gym_id, equipment_id',
        'gym_facilities'           => 'gym_id, facility_id',
        'user_roles'               => 'user_id, role',
        'notification_preferences' => 'user_id, event_type',
    ];

    public static function translateSql(string $sql): string {
        // 1. Backticks -> double quotes
        $sql = str_replace('`', '"', $sql);

        // 2. CURDATE() -> CURRENT_DATE
        $sql = preg_replace('/\bCURDATE\s*\(\s*\)/i', 'CURRENT_DATE', $sql);

        // 3. DATE_ADD / DATE_SUB -> PostgreSQL interval arithmetic
        $sql = preg_replace_callback(
            '/\b(DATE_ADD|DATE_SUB)\s*\(\s*([^,]+?)\s*,\s*INTERVAL\s+([^\s]+)\s+(SECOND|MINUTE|HOUR|DAY|WEEK|MONTH|YEAR)S?\s*\)/i',
            function ($m) {
                $op = strtoupper($m[1]) === 'DATE_ADD' ? '+' : '-';
                $base = trim($m[2]);
                $qty = trim($m[3]);
                $unit = strtolower($m[4]) . 's';
                if (is_numeric($qty)) {
                    return "({$base} {$op} INTERVAL '{$qty} {$unit}')";
                }
                return "({$base} {$op} (CAST({$qty} AS TEXT) || ' {$unit}')::interval)";
            },
            $sql
        );

        // 4. FIELD(col, 'a', 'b', ...) -> CASE col WHEN 'a' THEN 1 ... ELSE 99 END
        $sql = preg_replace_callback(
            '/\bFIELD\s*\(\s*([^,]+?)\s*,\s*((?:\'[^\']*\'(?:\s*,\s*)?)+)\)/i',
            function ($m) {
                $col = trim($m[1]);
                preg_match_all('/\'([^\']*)\'/', $m[2], $vals);
                $cases = [];
                foreach ($vals[1] as $i => $v) {
                    $cases[] = "WHEN '{$v}' THEN " . ($i + 1);
                }
                return '(CASE ' . $col . ' ' . implode(' ', $cases) . ' ELSE 99 END)';
            },
            $sql
        );

        // 5. IF(cond, trueVal, falseVal) -> CASE WHEN cond THEN trueVal ELSE falseVal END
        $sql = preg_replace_callback(
            '/\bIF\s*\(\s*([^,()]+(?:\([^()]*\)[^,()]*)*)\s*,\s*([^,()]+(?:\([^()]*\)[^,()]*)*)\s*,\s*([^()]+(?:\([^()]*\)[^()]*)*)\)/i',
            function ($m) {
                return "(CASE WHEN {$m[1]} THEN {$m[2]} ELSE {$m[3]} END)";
            },
            $sql
        );

        // 6. INSERT IGNORE INTO -> INSERT INTO ... ON CONFLICT DO NOTHING
        if (preg_match('/^\s*INSERT\s+IGNORE\s+INTO\s+/i', $sql)) {
            $sql = preg_replace('/^\s*INSERT\s+IGNORE\s+INTO\s+/i', 'INSERT INTO ', $sql);
            $sql = rtrim($sql, "; \t\n\r") . ' ON CONFLICT DO NOTHING';
        }

        // 7. ON DUPLICATE KEY UPDATE -> ON CONFLICT (target) DO UPDATE SET (with EXCLUDED.col)
        if (preg_match('/\bON\s+DUPLICATE\s+KEY\s+UPDATE\b/i', $sql)) {
            $table = '';
            if (preg_match('/\bINSERT\s+INTO\s+"?([a-zA-Z0-9_]+)"?/i', $sql, $tm)) {
                $table = strtolower($tm[1]);
            }
            $target = self::$conflictTargets[$table] ?? 'id';
            $sql = preg_replace_callback(
                '/\bON\s+DUPLICATE\s+KEY\s+UPDATE\s+(.+)$/is',
                function ($m) use ($target) {
                    $upd = preg_replace('/\bVALUES\s*\(\s*"?([a-zA-Z0-9_]+)"?\s*\)/i', 'EXCLUDED.$1', $m[1]);
                    return "ON CONFLICT ({$target}) DO UPDATE SET " . $upd;
                },
                $sql
            );
        }

        // 8. GROUP_CONCAT([DISTINCT] expr [ORDER BY ...] SEPARATOR sep) -> STRING_AGG([DISTINCT] (expr)::text, sep [ORDER BY ...])
        $sql = preg_replace_callback(
            '/\bGROUP_CONCAT\s*\(\s*(DISTINCT\s+)?(.+?)(?:\s+ORDER\s+BY\s+(.+?))?\s+SEPARATOR\s+(\'[^\']*\')\s*\)/is',
            function ($m) {
                $distinct = !empty($m[1]) ? 'DISTINCT ' : '';
                $expr = trim($m[2]);
                $order = !empty($m[3]) ? ' ORDER BY ' . trim($m[3]) : '';
                $sep = $m[4];
                if ($distinct !== '' && $order !== '') {
                    // PostgreSQL requires ORDER BY expressions to match DISTINCT expression
                    return "STRING_AGG(DISTINCT ({$expr})::text, {$sep})";
                }
                return "STRING_AGG({$distinct}({$expr})::text, {$sep}{$order})";
            },
            $sql
        );

        // 9. ELT(idx, 'a', 'b', ...) -> (ARRAY['a','b',...])[idx]
        $sql = preg_replace_callback(
            '/\bELT\s*\(\s*([^,]+?)\s*,\s*((?:\'[^\']*\'(?:\s*,\s*)?)+)\)/i',
            function ($m) {
                return '(ARRAY[' . trim($m[2]) . '])[' . trim($m[1]) . ']';
            },
            $sql
        );

        // 10. TIME_FORMAT(expr, '%H:%i') -> TO_CHAR(expr, 'HH24:MI'), DATE_FORMAT, YEAR/MONTH/DATE()
        $sql = preg_replace('/\bTIME_FORMAT\s*\(\s*([^,]+?)\s*,\s*\'%H:%i\'\s*\)/i', "TO_CHAR($1, 'HH24:MI')", $sql);
        $sql = preg_replace('/\bDATE_FORMAT\s*\(\s*([^,]+?)\s*,\s*\'%Y-%m-01(?:\s+00:00:00)?\'\s*\)/i', "DATE_TRUNC('month', $1)", $sql);
        $sql = preg_replace('/\bDATE_FORMAT\s*\(\s*([^,]+?)\s*,\s*\'%Y-%m-%d\'\s*\)/i', "TO_CHAR($1, 'YYYY-MM-DD')", $sql);
        $sql = preg_replace('/\bYEAR\s*\(\s*([^()]+?)\s*\)/i', 'EXTRACT(YEAR FROM ($1)::timestamp)::int', $sql);
        $sql = preg_replace('/\bMONTH\s*\(\s*([^()]+?)\s*\)/i', 'EXTRACT(MONTH FROM ($1)::timestamp)::int', $sql);
        $sql = preg_replace('/\bDATE\s*\(\s*([a-zA-Z0-9_.`"]+|\'[^\']*\')\s*\)/i', '($1)::date', $sql);

        // 11. CAST / UNSIGNED -> BIGINT
        $sql = preg_replace('/\bAS\s+UNSIGNED\b/i', 'AS BIGINT', $sql);

        return $sql;
    }

    public function prepare(string $query, array $options = []): PDOStatement|false {
        return parent::prepare(self::translateSql($query), $options);
    }

    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false {
        $translated = self::translateSql($query);
        if ($fetchMode === null) {
            return parent::query($translated);
        }
        return parent::query($translated, $fetchMode, ...$fetchModeArgs);
    }

    public function exec(string $statement): int|false {
        return parent::exec(self::translateSql($statement));
    }

    public function lastInsertId(?string $name = null): string|false {
        if ($name !== null) {
            return parent::lastInsertId($name);
        }
        try {
            $val = parent::query('SELECT LASTVAL()')->fetchColumn();
            return $val !== false ? (string)$val : false;
        } catch (Throwable $e) {
            return false;
        }
    }
}

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

    $driver = strtolower(trim((string)($_ENV['DB_DRIVER'] ?? getenv('DB_DRIVER') ?: 'mysql')));
    $supabaseDbUrl = trim((string)($_ENV['SUPABASE_DATABASE_URL'] ?? getenv('SUPABASE_DATABASE_URL') ?: ''));

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        if ($driver === 'pgsql' && $supabaseDbUrl !== '') {
            $p = parse_url($supabaseDbUrl);
            $host = $p['host'] ?? '127.0.0.1';
            $port = $p['port'] ?? 6543;
            $dbname = ltrim($p['path'] ?? '/postgres', '/');
            $username = urldecode($p['user'] ?? 'postgres');
            $password = urldecode($p['pass'] ?? '');
            $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require";
            // Supabase Transaction Pooler (port 6543) requires emulated prepares; persistent connection avoids 1.2s TLS handshake per request
            $pgOptions = $options;
            $pgOptions[PDO::ATTR_EMULATE_PREPARES] = true;
            $pgOptions[PDO::ATTR_PERSISTENT] = true;
            $pdo = new FitSyncPgCompatPdo($dsn, $username, $password, $pgOptions);
            return $pdo;
        }

        $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
        $port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';
        $dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'fitsync_db';
        $username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
        $password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '';
        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci";

        $pdo = new PDO($dsn, $username, $password, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("[FitSync DB Error] Connection failed: " . $e->getMessage());

        if ($throwOnError) {
            throw new RuntimeException("Database connection error: Unable to connect to database service.");
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
