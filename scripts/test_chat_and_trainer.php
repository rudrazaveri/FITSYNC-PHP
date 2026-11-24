<?php
require_once __DIR__ . '/../config/bootstrap.php';
$db = getDbConnection();
$db->exec("UPDATE trainer_assignments SET status = 'active' WHERE user_id = 2 AND trainer_user_id = 1");
echo "Assignment updated.\n";

$stmt = $db->query("SELECT * FROM trainer_assignments WHERE user_id = 2 AND trainer_user_id = 1");
print_r($stmt->fetch(PDO::FETCH_ASSOC));
