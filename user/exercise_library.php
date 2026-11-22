<?php
/**
 * FitSync AI — Member Portal: Exercise Library
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role check
requireRole('user');

$initialView = 'exercise-library';
require __DIR__ . '/portal_template.php';
