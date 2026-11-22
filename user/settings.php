<?php
/**
 * FitSync AI — Member Portal: Settings
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role check
requireRole('user');

$initialView = 'settings';
require __DIR__ . '/portal_template.php';
