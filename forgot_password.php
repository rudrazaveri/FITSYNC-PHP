<?php
/**
 * FitSync AI — Forgot Password Page
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

$message = null;
$error = null;
$devResetUrl = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();
    $email = trim($_POST['email'] ?? '');

    $result = requestPasswordReset($email);
    if ($result['success']) {
        $message = $result['message'];
        if (!empty($result['dev_reset_url'])) {
            $devResetUrl = $result['dev_reset_url'];
        }
    } else {
        $error = $result['message'];
    }
}

$pageTitle = 'Forgot Password — FitSync AI';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-5 my-auto">
  <div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
      <div class="fitness-card p-4 p-md-5">
        <div class="text-center mb-4">
          <img src="<?= asset('assets/images/logo.jpg') ?>" alt="Logo" width="56" height="56" class="rounded-circle border border-success mb-2" onerror="this.src='<?= asset('assets/logo.jpg') ?>'">
          <h3 class="fw-bold text-white">Reset Password</h3>
          <p class="text-secondary small">Enter your email address to receive reset instructions</p>
        </div>

        <?php if ($message): ?>
          <div class="alert alert-success py-2 small border-0 mb-3"><?= e($message) ?></div>
          <?php if ($devResetUrl): ?>
            <div class="alert alert-warning py-2 small border-0 mb-3">
              <strong>Local Dev Shortcut:</strong><br>
              <a href="<?= e($devResetUrl) ?>" class="text-dark fw-bold text-decoration-underline">Click here to open Password Reset Form</a>
            </div>
          <?php endif; ?>
        <?php endif; ?>

        <?php if ($error): ?>
          <div class="alert alert-danger py-2 small border-0 mb-3"><?= e($error) ?></div>
        <?php endif; ?>

        <form method="POST" action="<?= url('forgot_password.php') ?>" class="mb-4">
          <?= csrfInput() ?>

          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Email Address</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary"><i class="bi bi-envelope"></i></span>
              <input type="email" name="email" class="form-control form-control-dark" placeholder="athlete@fitsync.health" value="<?= e($_POST['email'] ?? '') ?>" required autofocus>
            </div>
          </div>

          <button type="submit" class="btn btn-fitness w-100 py-2 fw-semibold">
            <i class="bi bi-send-fill me-1"></i> Send Password Reset Link
          </button>
        </form>

        <div class="text-center">
          <a href="<?= url('login.php') ?>" class="text-success small fw-semibold text-decoration-none">
            <i class="bi bi-arrow-left me-1"></i> Back to Sign In
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
