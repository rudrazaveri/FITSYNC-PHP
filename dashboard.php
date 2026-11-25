<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';
requireRole('user');
$_SESSION['active_portal'] = 'user';

header('Location: index.html#dashboard');
exit;
