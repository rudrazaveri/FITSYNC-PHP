<?php
/**
 * FitSync AI — Member Portal: Trainer
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role check
requireRole('user');

$initialView = 'trainer';
require __DIR__ . '/portal_template.php';
