<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

$cols = $pdo->query("SHOW COLUMNS FROM trainer_sessions")->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('trainer_user_id', $cols)) {
    $pdo->exec("ALTER TABLE trainer_sessions ADD COLUMN trainer_user_id BIGINT UNSIGNED NULL AFTER trainer_id");
}
if (!in_array('member_user_id', $cols)) {
    $pdo->exec("ALTER TABLE trainer_sessions ADD COLUMN member_user_id BIGINT UNSIGNED NULL AFTER user_id");
}
if (!in_array('session_date', $cols)) {
    $pdo->exec("ALTER TABLE trainer_sessions ADD COLUMN session_date DATE NULL AFTER scheduled_start");
}
if (!in_array('start_time', $cols)) {
    $pdo->exec("ALTER TABLE trainer_sessions ADD COLUMN start_time TIME NULL AFTER session_date");
}
if (!in_array('end_time', $cols)) {
    $pdo->exec("ALTER TABLE trainer_sessions ADD COLUMN end_time TIME NULL AFTER start_time");
}
if (!in_array('session_notes', $cols)) {
    $pdo->exec("ALTER TABLE trainer_sessions ADD COLUMN session_notes TEXT NULL AFTER notes");
}

echo "Columns in trainer_sessions now:\n";
print_r($pdo->query("SHOW COLUMNS FROM trainer_sessions")->fetchAll(PDO::FETCH_COLUMN));
