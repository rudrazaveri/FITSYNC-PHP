<?php
/**
 * FitSync AI — Password Reset Form
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

$token = trim($_GET['token'] ?? $_POST['token'] ?? '');
$error = null;
$success = null;

if (empty($token)) {
    setFlash('danger', 'Password reset token is missing.');
    header('Location: ' . url('forgot_password.php'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();
    $newPassword = (string)($_POST['password'] ?? '');
    $confirmPassword = (string)($_POST['confirm_password'] ?? '');

    if ($newPassword !== $confirmPassword) {
        $error = 'Passwords do not match. Please ensure both passwords match.';
    } else {
        $result = resetPasswordWithToken($token, $newPassword);
        if ($result['success']) {
            setFlash('success', $result['message']);
            header('Location: ' . url('login.php'));
            exit;
        } else {
            $error = $result['message'];
        }
    }
}

$pageTitle = 'Choose New Password — FitSync AI';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-5 my-auto">
  <div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
      <div class="fitness-card p-4 p-md-5">
        <div class="text-center mb-4">
          <img src="<?= asset('assets/images/logo.jpg') ?>" alt="Logo" width="56" height="56" class="rounded-circle border border-success mb-2" onerror="this.src='<?= asset('assets/logo.jpg') ?>'">
          <h3 class="fw-bold text-white">Create New Password</h3>
          <p class="text-secondary small">Choose a secure password for your FitSync account</p>
        </div>

        <?php if ($error): ?>
          <div class="alert alert-danger py-2 small border-0 mb-3"><?= e($error) ?></div>
        <?php endif; ?>

        <form method="POST" action="<?= url('reset_password.php') ?>">
          <?= csrfInput() ?>
          <input type="hidden" name="token" value="<?= e($token) ?>">

          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">New Password (min 6 characters)</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary"><i class="bi bi-lock"></i></span>
              <input type="password" name="password" class="form-control form-control-dark" placeholder="••••••••" required autofocus>
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label text-light small fw-semibold">Confirm New Password</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary"><i class="bi bi-lock-fill"></i></span>
              <input type="password" name="confirm_password" class="form-control form-control-dark" placeholder="••••••••" required>
            </div>
          </div>

          <button type="submit" class="btn btn-fitness w-100 py-2 fw-semibold">
            <i class="bi bi-check-circle-fill me-1"></i> Update Password & Sign In
          </button>
        </form>

        <div class="text-center mt-3">
          <a href="<?= url('login.php') ?>" class="text-secondary small text-decoration-none">
            Cancel and Return to Sign In
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
