<?php
/**
 * FitSync AI — Member Registration
 * Creates authenticated member records in MySQL with role='user'.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

// If already logged in, redirect directly to portal
if (isLoggedIn()) {
    redirectByRole($_SESSION['role'] ?? 'user');
}

$errorMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim((string)($_POST['full_name'] ?? ''));
    $email = trim((string)($_POST['email'] ?? ''));
    $mobile = trim((string)($_POST['mobile'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    $confirmPassword = (string)($_POST['confirm_password'] ?? '');
    $gender = (string)($_POST['gender'] ?? 'male');
    $activityLevel = (string)($_POST['fitness_experience'] ?? 'intermediate');

    // Validation
    if (empty($fullName) || mb_strlen($fullName) < 2) {
        $errorMessage = 'Please provide your full legal name (minimum 2 characters).';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errorMessage = 'Please provide a valid email address.';
    } elseif (mb_strlen($password) < 6) {
        $errorMessage = 'Password must be at least 6 characters long.';
    } elseif ($password !== $confirmPassword) {
        $errorMessage = 'Password and confirmation password do not match.';
    } else {
        $registerData = [
            'full_name'          => $fullName,
            'email'              => $email,
            'mobile'             => $mobile,
            'password'           => $password,
            'gender'             => $gender,
            'activityLevel'      => $activityLevel,
            'role'               => 'user' // STRICT REQUIREMENT: Only 'user' role
        ];

        $result = registerUser($registerData);
        if ($result['success']) {
            header('Location: login.php?registered=1');
            exit;
        } else {
            $errorMessage = $result['message'] ?? 'Registration failed. Please check your details.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join FitSync — Member Registration</title>
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
      padding: 32px 16px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .auth-card {
      width: 100%;
      max-width: 500px;
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
      margin-bottom: 20px;
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
      margin: 0 0 20px;
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
    .form-group {
      margin-bottom: 14px;
    }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 5px;
    }
    .form-input, .form-select {
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
    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--primary-blue, #155DFC);
      box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.15);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
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
      margin-top: 10px;
    }
    .btn-submit:hover {
      background: var(--primary-blue-hover, #0E48D4);
      box-shadow: 0 4px 12px rgba(21, 93, 252, 0.25);
    }
    .auth-footer {
      margin-top: 22px;
      padding-top: 16px;
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
    .role-badge-note {
      display: inline-block;
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #BFDBFE;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 16px;
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

    <h1 class="auth-title">Create Account</h1>
    <p class="auth-subtitle">Join the FitSync athletic fitness community</p>

    <div style="text-align: center;">
      <span class="role-badge-note">Public Registration — Standard Member Account</span>
    </div>

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

    <form method="POST" action="register.php">
      <input type="hidden" name="csrf_token" value="<?= htmlspecialchars(getCsrfToken()) ?>">

      <div class="form-group">
        <label class="form-label" for="regFullName">Full Legal Name *</label>
        <input type="text" id="regFullName" name="full_name" class="form-input" placeholder="e.g. Rahul Sharma" value="<?= htmlspecialchars($_POST['full_name'] ?? '') ?>" required autofocus>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="regEmail">Email Address *</label>
          <input type="email" id="regEmail" name="email" class="form-input" placeholder="you@example.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="regMobile">Mobile Phone</label>
          <input type="tel" id="regMobile" name="mobile" class="form-input" placeholder="+91 98000 00000" value="<?= htmlspecialchars($_POST['mobile'] ?? '') ?>">
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="regPassword">Password (min 6 chars) *</label>
          <input type="password" id="regPassword" name="password" class="form-input" placeholder="••••••••" minlength="6" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="regConfirmPassword">Confirm Password *</label>
          <input type="password" id="regConfirmPassword" name="confirm_password" class="form-input" placeholder="••••••••" minlength="6" required>
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="regGender">Gender</label>
          <select id="regGender" name="gender" class="form-select">
            <option value="male" selected>Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="regExp">Fitness Experience</label>
          <select id="regExp" name="fitness_experience" class="form-select">
            <option value="beginner">Beginner (0-1 yr)</option>
            <option value="intermediate" selected>Intermediate (1-3 yrs)</option>
            <option value="advanced">Advanced (3-5 yrs)</option>
            <option value="elite">Elite (5+ yrs)</option>
          </select>
        </div>
      </div>

      <button type="submit" class="btn-submit">
        <span>Create Member Account</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </form>

    <div class="auth-footer">
      Already have a FitSync account? <a href="login.php">Sign In</a>
    </div>
  </div>

</body>
</html>
