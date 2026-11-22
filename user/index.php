<?php
/**
 * FitSync AI — Member Portal: Dashboard
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role check
requireRole('user');

$initialView = 'dashboard';
require __DIR__ . '/portal_template.php';
