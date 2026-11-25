<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('gym_owner');
$_SESSION['active_portal'] = 'gym_owner';

header('Location: index.html#coaches');
exit;
