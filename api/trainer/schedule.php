<?php
/**
 * FitSync AI — API: Trainer Schedule & Sessions
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/trainer_data.php';

requireRole('trainer');

$schedule = getTrainerSchedule((int)$_SESSION['user_id']);

jsonResponse([
    'success'  => true,
    'schedule' => $schedule
]);
