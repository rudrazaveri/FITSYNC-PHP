<?php
/**
 * FitSync AI — Logout Handler
 *
 * Securely terminates session, deletes database session record, and redirects.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

logoutUser();
setFlash('info', 'You have been securely signed out.');
header('Location: ' . url('login.php'));
exit;
