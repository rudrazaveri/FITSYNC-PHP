<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';
initSecureSession();

if (isLoggedIn()) {
    redirectByRole($_SESSION['active_portal'] ?? $_SESSION['role'] ?? 'user');
}

header('Location: index.html');
exit;
