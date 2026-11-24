<?php
/**
 * FitSync AI — HTML Header & Meta Partial
 * Redirects legacy requests to the authoritative light-theme Single Page Application
 */
declare(strict_types=1);

if (!headers_sent()) {
    header('Location: /index.html');
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/index.html">
  <script>window.location.href = '/index.html';</script>
</head>
<body></body>
</html>
