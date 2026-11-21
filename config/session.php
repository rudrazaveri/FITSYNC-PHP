<?php
/**
 * FitSync AI — Session & Authentication Management
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check if a user is currently logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user']) && !empty($_SESSION['user']['id']);
}

/**
 * Get the currently logged-in user array
 */
function getCurrentUser() {
    if (isLoggedIn()) {
        return $_SESSION['user'];
    }
    return null;
}

/**
 * Set the current logged in user
 */
function setCurrentUser($user) {
    $_SESSION['user'] = $user;
}

/**
 * Require user login to view page
 */
function requireLogin($role = null) {
    if (!isLoggedIn()) {
        setFlash('warning', 'Please login to access this section.');
        header('Location: ' . url('login.php'));
        exit;
    }
    
    if ($role !== null) {
        $user = getCurrentUser();
        if (($user['role'] ?? '') !== $role) {
            setFlash('danger', 'You do not have permission to access that area.');
            header('Location: ' . url('dashboard.php'));
            exit;
        }
    }
}

/**
 * Log out user
 */
function logoutUser() {
    unset($_SESSION['user']);
    session_destroy();
}

/**
 * Set a flash notification message
 */
function setFlash($type, $message) {
    $_SESSION['flash'] = [
        'type' => $type, // 'success', 'danger', 'warning', 'info'
        'message' => $message
    ];
}

/**
 * Retrieve and clear the flash message
 */
function getFlash() {
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}
