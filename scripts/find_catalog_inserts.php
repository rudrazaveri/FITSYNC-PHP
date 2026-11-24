<?php
$sql = file_get_contents(__DIR__ . '/../fitsync_mysql_schema.sql');
$lines = explode("\n", $sql);
$muscleLines = [];
$capture = false;
foreach ($lines as $i => $line) {
    if (strpos($line, 'INSERT INTO `muscle_groups`') !== false || strpos($line, 'INSERT INTO `exercises`') !== false || strpos($line, 'INSERT INTO `body_regions`') !== false) {
        echo "Found insert at line $i: " . substr($line, 0, 100) . "\n";
    }
}
