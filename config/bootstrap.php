<?php
/**
 * FitSync AI — Central Application Bootstrap
 *
 * Initializes environment, constants, database connection, secure sessions,
 * CSRF protection, and core authentication functions.
 */

declare(strict_types=1);

// Load base configuration and environment variables
require_once __DIR__ . '/config.php';

// Load centralized database connection
require_once __DIR__ . '/db.php';

// Load helper functions
require_once __DIR__ . '/../includes/functions.php';

// Load and initialize secure session handler
require_once __DIR__ . '/../includes/session.php';
initSecureSession();

// Load CSRF protection
require_once __DIR__ . '/../includes/csrf.php';

// Load authentication and role-based access control
require_once __DIR__ . '/../includes/auth.php';
