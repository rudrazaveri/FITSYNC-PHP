<?php
/**
 * FitSync AI — Authenticated Cross-Portal Switcher
 * Validates the existing PHP session and RBAC permissions before switching active_portal.
 * Never destroys sessions, modifies users.role, or redirects authenticated users to login/register.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

$rawTarget = (string)($_GET['to'] ?? '');
$portal = normalizePortalKey($rawTarget);
// If user has an active independent tab session for the target portal, resume it seamlessly
if ($portal !== '' && empty($_GET['portal_ctx'])) {
    $_GET['portal_ctx'] = $portal;
}

initSecureSession();

if (!isLoggedIn()) {
    if ($portal !== '') {
        setIntendedRedirectUrl(getRedirectUrlForRole($portal));
    }
    setFlash('warning', 'Please sign in to access that portal.');
    header('Location: ' . url('login.php'));
    exit;
}

$user = currentUser();
if (!$user) {
    destroyUserSession();
    header('Location: ' . url('login.php'));
    exit;
}

if ($portal === '') {
    $portal = normalizePortalKey((string)($_SESSION['active_portal'] ?? $user['role'] ?? 'user'));
}

if (!hasRole($portal)) {
    renderPortalAccessDeniedPage($portal, $user);
}

// Keep users.role and $_SESSION['role'] unchanged; track only the active portal view
$_SESSION['active_portal'] = $portal;

$dest = getRedirectUrlForRole($portal);
if ($portal === 'user') {
    $sep = str_contains($dest, '?') ? '&' : '?';
    $dest .= $sep . 'portal=user';
}

header('Location: ' . $dest);
exit;
