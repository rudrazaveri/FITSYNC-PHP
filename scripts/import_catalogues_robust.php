<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

$sql = file_get_contents(__DIR__ . '/../fitsync_mysql_schema.sql');

function splitSqlStatements($sql) {
    $statements = [];
    $current = '';
    $inString = false;
    $stringChar = '';
    $escaped = false;
    $len = strlen($sql);

    for ($i = 0; $i < $len; $i++) {
        $ch = $sql[$i];

        if ($escaped) {
            $current .= $ch;
            $escaped = false;
            continue;
        }

        if ($ch === '\\') {
            $escaped = true;
            $current .= $ch;
            continue;
        }

        if ($inString) {
            $current .= $ch;
            if ($ch === $stringChar) {
                // Check if next char is also quote (SQL escape '')
                if ($i + 1 < $len && $sql[$i + 1] === $stringChar) {
                    $current .= $sql[$i + 1];
                    $i++;
                } else {
                    $inString = false;
                }
            }
            continue;
        }

        // Check for comments
        if ($ch === '-' && $i + 1 < $len && $sql[$i + 1] === '-') {
            // single line comment until newline
            $pos = strpos($sql, "\n", $i);
            if ($pos === false) break;
            $i = $pos;
            continue;
        }

        if ($ch === "'" || $ch === '"') {
            $inString = true;
            $stringChar = $ch;
            $current .= $ch;
            continue;
        }

        if ($ch === ';') {
            $trimmed = trim($current);
            if (!empty($trimmed)) {
                $statements[] = $trimmed;
            }
            $current = '';
            continue;
        }

        $current .= $ch;
    }

    $trimmed = trim($current);
    if (!empty($trimmed)) {
        $statements[] = $trimmed;
    }

    return $statements;
}

$stmts = splitSqlStatements($sql);
echo "Properly extracted statements: " . count($stmts) . "\n";

$inserted = 0;
$skipped = 0;
$errors = [];

foreach ($stmts as $stmt) {
    if (stripos($stmt, 'INSERT INTO') !== false) {
        try {
            $pdo->exec($stmt);
            $inserted++;
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                // Duplicate entry, skip
                $skipped++;
            } else {
                $errors[] = substr($stmt, 0, 70) . " => " . $e->getMessage();
            }
        }
    }
}

echo "Inserted: $inserted, Skipped duplicate: $skipped, Errors: " . count($errors) . "\n";
if (!empty($errors)) {
    echo "First 5 errors:\n" . implode("\n", array_slice($errors, 0, 5)) . "\n";
}

$catalogueTables = ['muscle_groups', 'exercises', 'plan_days', 'plan_day_exercises', 'foods', 'recipes'];
foreach ($catalogueTables as $tbl) {
    try {
        $count = $pdo->query("SELECT COUNT(*) FROM `$tbl`")->fetchColumn();
        echo "$tbl count: $count\n";
    } catch (Exception $e) {
        echo "$tbl: error\n";
    }
}
