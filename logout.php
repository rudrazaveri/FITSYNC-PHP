<?php
/**
 * FitSync AI — Logout Handler
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/session.php';

logoutUser();
setFlash('info', 'You have been securely signed out.');
header('Location: ' . url('login.php'));
exit;
