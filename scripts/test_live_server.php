<?php
$endpoints = [
    'http://127.0.0.1:8080/index.html',
    'http://127.0.0.1:8080/login.php',
    'http://127.0.0.1:8080/register.php',
    'http://127.0.0.1:8080/trainer/index.html',
    'http://127.0.0.1:8080/gym_owner/index.html',
    'http://127.0.0.1:8080/api/water.php',
    'http://127.0.0.1:8080/api/meals.php',
    'http://127.0.0.1:8080/api/user/profile.php',
    'http://127.0.0.1:8080/api/trainer/profile.php',
    'http://127.0.0.1:8080/api/messages.php'
];

foreach ($endpoints as $url) {
    $context = stream_context_create([
        'http' => ['timeout' => 3, 'ignore_errors' => true]
    ]);
    $fp = @fopen($url, 'r', false, $context);
    if ($fp) {
        $meta = stream_get_meta_data($fp);
        $statusLine = $meta['wrapper_data'][0] ?? 'Unknown';
        fclose($fp);
        echo "[OK] {$statusLine} - {$url}\n";
    } else {
        echo "[ERR] Failed to connect - {$url}\n";
    }
}
