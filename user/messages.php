<?php
/**
 * FitSync AI — Member Portal: Messages
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role check
requireRole('user');

$initialView = 'messages';
require __DIR__ . '/portal_template.php';
