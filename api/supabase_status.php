<?php
/**
 * FitSync AI — Supabase Backend Connection Status API
 * Checks whether PHP cURL can authenticate with the configured Supabase instance.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/supabase.php';

$url = SUPABASE_URL;
$key = SUPABASE_ANON_KEY;

if (!$url || strpos($key, 'dummy') !== false || empty($key)) {
    echo json_encode([
        'connected' => false,
        'status' => 'unconfigured',
        'message' => 'Supabase credentials are not configured in .env.local yet.',
        'url' => $url
    ]);
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, rtrim($url, '/') . '/rest/v1/gyms?select=id,name&limit=1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $key,
    'Authorization: Bearer ' . $key,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 6);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode([
        'connected' => true,
        'status' => 'online',
        'http_code' => $httpCode,
        'message' => 'PHP backend successfully connected to Supabase PostgreSQL!',
        'url' => $url
    ]);
} else {
    echo json_encode([
        'connected' => false,
        'status' => 'error',
        'http_code' => $httpCode,
        'message' => $error ?: 'Supabase API returned HTTP code ' . $httpCode,
        'url' => $url,
        'details' => json_decode($response, true)
    ]);
}
