<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

$users = $pdo->query("SELECT id, email, full_name, role, status FROM users")->fetchAll(PDO::FETCH_ASSOC);
echo "TOTAL USERS IN DB: " . count($users) . "\n";
foreach ($users as $u) {
    echo "ID {$u['id']} | {$u['role']} | {$u['full_name']} | {$u['email']} | {$u['status']}\n";
}

echo "\n--- GYMS ---\n";
$gyms = $pdo->query("SELECT id, name, owner_user_id, capacity FROM gyms")->fetchAll(PDO::FETCH_ASSOC);
foreach ($gyms as $g) {
    echo "Gym {$g['id']}: {$g['name']} (Owner: {$g['owner_user_id']}, Capacity: {$g['capacity']})\n";
}

echo "\n--- GYM TRAINERS ---\n";
$gt = $pdo->query("SELECT * FROM gym_trainers")->fetchAll(PDO::FETCH_ASSOC);
echo "Count: " . count($gt) . "\n";
foreach ($gt as $row) {
    echo "Gym {$row['gym_id']} -> Trainer {$row['trainer_profile_id']} (Status: {$row['status']})\n";
}

echo "\n--- MEMBERSHIPS ---\n";
$mems = $pdo->query("SELECT * FROM memberships")->fetchAll(PDO::FETCH_ASSOC);
echo "Count: " . count($mems) . "\n";
foreach ($mems as $row) {
    echo "Gym {$row['gym_id']} -> User {$row['user_id']} (Status: {$row['status']})\n";
}

echo "\n--- TRAINER ASSIGNMENTS ---\n";
$ta = $pdo->query("SELECT * FROM trainer_assignments")->fetchAll(PDO::FETCH_ASSOC);
echo "Count: " . count($ta) . "\n";
foreach ($ta as $row) {
    echo "Trainer {$row['trainer_profile_id']} -> Member {$row['user_id']} (Status: {$row['status']})\n";
}
