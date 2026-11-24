<?php
/**
 * FitSync AI — Member & Portal Sign In
 * Authenticates against authoritative MySQL users directory.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

// If already logged in, redirect directly to portal
if (isLoggedIn()) {
    redirectByRole($_SESSION['role'] ?? 'user');
}

$errorMessage = '';
$successMessage = '';
$infoMessage = '';

if (isset($_GET['registered'])) {
    $successMessage = 'Account created successfully! You can now sign in with your credentials.';
} elseif (isset($_GET['logged_out'])) {
    $infoMessage = 'You have been signed out successfully.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim((string)($_POST['email'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    $remember = !empty($_POST['remember']);

    $result = authenticateUser($email, $password, $remember);
    if ($result['success']) {
        $role = $_SESSION['role'] ?? 'user';
        redirectByRole($role);
    } else {
        $errorMessage = $result['message'] ?? 'Invalid email address or password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In — FitSync AI Fitness Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  <style>
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F1F5F9;
      padding: 24px 16px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      background: #FFFFFF;
      border: 1px solid var(--border-color, #E2E8F0);
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      padding: 36px 32px;
    }
    .auth-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 24px;
      text-decoration: none;
    }
    .auth-logo-icon {
      width: 40px;
      height: 40px;
      background: var(--primary-blue, #155DFC);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
    }
    .auth-logo-text {
      font-size: 20px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .auth-logo-text span {
      color: var(--primary-blue, #155DFC);
    }
    .auth-title {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      text-align: center;
      margin: 0 0 6px;
      letter-spacing: -0.4px;
    }
    .auth-subtitle {
      font-size: 13px;
      color: #64748B;
      text-align: center;
      margin: 0 0 24px;
    }
    .auth-alert {
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .auth-alert-danger {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #B91C1C;
    }
    .auth-alert-success {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #047857;
    }
    .auth-alert-info {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1D4ED8;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      height: 42px;
      padding: 0 12px;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      font-size: 14px;
      color: #0F172A;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--primary-blue, #155DFC);
      box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.15);
    }
    .form-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 22px;
      font-size: 12px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #475569;
      cursor: pointer;
      user-select: none;
    }
    .btn-submit {
      width: 100%;
      height: 44px;
      background: var(--primary-blue, #155DFC);
      color: #FFFFFF;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-submit:hover {
      background: var(--primary-blue-hover, #0E48D4);
      box-shadow: 0 4px 12px rgba(21, 93, 252, 0.25);
    }
    .auth-footer {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid #E2E8F0;
      text-align: center;
      font-size: 13px;
      color: #64748B;
    }
    .auth-footer a {
      color: var(--primary-blue, #155DFC);
      font-weight: 600;
      text-decoration: none;
    }
    .auth-footer a:hover {
      text-decoration: underline;
    }
    .quick-roles {
      margin-top: 18px;
      background: #F8FAFC;
      border: 1px dashed #CBD5E1;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 11px;
      color: #64748B;
    }
    .quick-roles strong {
      color: #0F172A;
    }
  </style>
</head>
<body>

  <div class="auth-card">
    <a href="index.html" class="auth-logo">
      <div class="auth-logo-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 5v14"></path>
          <path d="M18 5v14"></path>
          <path d="M2 9v6"></path>
          <path d="M22 9v6"></path>
          <path d="M6 12h12"></path>
        </svg>
      </div>
      <div class="auth-logo-text">FitSync<span>AI</span></div>
    </a>

    <h1 class="auth-title">Welcome Back</h1>
    <p class="auth-subtitle">Sign in to access your fitness dashboard</p>

    <?php if (!empty($errorMessage)): ?>
      <div class="auth-alert auth-alert-danger">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span><?= htmlspecialchars($errorMessage) ?></span>
      </div>
    <?php endif; ?>

    <?php if (!empty($successMessage)): ?>
      <div class="auth-alert auth-alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span><?= htmlspecialchars($successMessage) ?></span>
      </div>
    <?php endif; ?>

    <?php if (!empty($infoMessage)): ?>
      <div class="auth-alert auth-alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span><?= htmlspecialchars($infoMessage) ?></span>
      </div>
    <?php endif; ?>

    <form method="POST" action="login.php">
      <input type="hidden" name="csrf_token" value="<?= htmlspecialchars(getCsrfToken()) ?>">

      <div class="form-group">
        <label class="form-label" for="loginEmail">Email Address</label>
        <input type="email" id="loginEmail" name="email" class="form-input" placeholder="e.g. sneha.reddy@fitsync.health" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required autofocus>
      </div>

      <div class="form-group">
        <label class="form-label" for="loginPassword">Password</label>
        <input type="password" id="loginPassword" name="password" class="form-input" placeholder="••••••••" required>
      </div>

      <div class="form-actions">
        <label class="checkbox-label">
          <input type="checkbox" name="remember" value="1"> Remember me
        </label>
        <a href="forgot_password.php" style="color: var(--primary-blue, #155DFC); text-decoration: none;">Forgot password?</a>
      </div>

      <button type="submit" class="btn-submit">
        <span>Sign In to FitSync</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </form>

    <div class="quick-roles">
      <strong>Active Accounts (Authoritative DB):</strong><br>
      • Member: <code>sneha.reddy@fitsync.health</code><br>
      • Trainer: <code>kabir.khan@fitsync.health</code>
    </div>

    <div class="auth-footer">
      Don't have an account yet? <a href="register.php">Create Member Account</a>
    </div>
  </div>

</body>
</html>
