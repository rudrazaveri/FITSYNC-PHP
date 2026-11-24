<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

echo "--- gym_trainers columns ---\n";
print_r($pdo->query("DESCRIBE gym_trainers")->fetchAll(PDO::FETCH_COLUMN));

echo "\n--- trainer_assignments columns ---\n";
print_r($pdo->query("DESCRIBE trainer_assignments")->fetchAll(PDO::FETCH_COLUMN));

echo "\n--- gym_trainers rows ---\n";
print_r($pdo->query("SELECT * FROM gym_trainers")->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- trainer_assignments rows ---\n";
print_r($pdo->query("SELECT * FROM trainer_assignments")->fetchAll(PDO::FETCH_ASSOC));
