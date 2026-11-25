<?php
/**
 * FitSync AI — Logout Handler
 *
 * Securely terminates session, deletes database session record, and redirects.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

$portalCtx = trim((string)($_GET['portal_ctx'] ?? ''));
logoutUser();
setFlash('info', 'You have been securely signed out.');
$redirectUrl = ($portalCtx !== '' && empty($_GET['all']))
    ? url('login.php?logged_out=1&switch_account=1&portal_ctx=' . urlencode($portalCtx))
    : url('login.php');
header('Location: ' . $redirectUrl);
exit;
