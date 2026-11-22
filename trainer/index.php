<?php
/**
 * FitSync AI — Trainer Portal Entry Point
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role verification
requireRole('trainer');

// Redirect to primary trainer dashboard
header('Location: ' . url('trainer/dashboard.php'));
exit;
