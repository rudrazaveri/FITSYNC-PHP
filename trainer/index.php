<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');
$_SESSION['active_portal'] = 'trainer';

header('Location: index.html');
exit;
