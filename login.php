<?php
/**
 * FitSync AI — Database-Backed Login Page
 *
 * Authenticates users against MySQL using prepared statements,
 * validates CSRF tokens, verifies bcrypt password hashes, and routes by role.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

// Redirect if already authenticated
if (isLoggedIn()) {
    redirectByRole();
}

$error = null;
$flash = getFlash();

// Handle Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();
    $action = $_POST['action'] ?? 'login';

    if ($action === 'demo_member') {
        $result = authenticateUser('aarav.patel@fitsync.ai', 'password123');
    } elseif ($action === 'demo_trainer') {
        $result = authenticateUser('coach@fitsync.health', 'password123');
    } elseif ($action === 'demo_owner') {
        $result = authenticateUser('owner@fitzone.com', 'password123');
    } elseif ($action === 'demo_admin') {
        $result = authenticateUser('admin@fitsync.com', 'password123');
    } else {
        $email    = trim($_POST['email'] ?? '');
        $password = (string)($_POST['password'] ?? '');
        $remember = !empty($_POST['remember']);

        $result = authenticateUser($email, $password, $remember);
    }

    if ($result['success']) {
        setFlash('success', 'Welcome back, ' . htmlspecialchars($result['user']['full_name']) . '!');
        header('Location: ' . $result['redirect']);
        exit;
    } else {
        $error = $result['message'];
    }
}

$pageTitle = 'Sign In — FitSync AI';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-5 my-auto">
  <div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
      <div class="fitness-card p-4 p-md-5">
        <div class="text-center mb-4">
          <img src="<?= asset('assets/images/logo.jpg') ?>" alt="Logo" width="56" height="56" class="rounded-circle border border-success mb-2" onerror="this.src='<?= asset('assets/logo.jpg') ?>'">
          <h3 class="fw-bold text-white">Sign In to FitSync</h3>
          <p class="text-secondary small">Access your fitness metrics, routines, and telemetry</p>
        </div>

        <?php if ($flash): ?>
          <div class="alert alert-<?= e($flash['type']) ?> py-2 small border-0 mb-3"><?= e($flash['message']) ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
          <div class="alert alert-danger py-2 small border-0 mb-3"><?= e($error) ?></div>
        <?php endif; ?>

        <!-- Standard Login Form -->
        <form method="POST" action="<?= url('login.php') ?>" class="mb-4">
          <?= csrfInput() ?>
          <input type="hidden" name="action" value="login">

          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Email Address</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary"><i class="bi bi-envelope"></i></span>
              <input type="email" name="email" class="form-control form-control-dark" placeholder="athlete@fitsync.health or coach@fitsync.health" value="<?= e($_POST['email'] ?? '') ?>" required autofocus>
            </div>
          </div>

          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="form-label text-light small fw-semibold mb-0">Password</label>
              <a href="<?= url('forgot_password.php') ?>" class="text-success small text-decoration-none">Forgot Password?</a>
            </div>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary"><i class="bi bi-lock"></i></span>
              <input type="password" name="password" class="form-control form-control-dark" placeholder="••••••••" required>
            </div>
          </div>

          <div class="form-check mb-4">
            <input class="form-check-input" type="checkbox" name="remember" id="rememberMe" checked>
            <label class="form-check-label text-secondary small" for="rememberMe">
              Stay signed in
            </label>
          </div>

          <button type="submit" class="btn btn-fitness w-100 py-2 fw-semibold">
            <i class="bi bi-box-arrow-in-right me-1"></i> Sign In to FitSync
          </button>
        </form>

        <!-- Demo Fast Access Pill Group (All Seeded Database Accounts) -->
        <div class="text-center border-top border-secondary border-opacity-25 pt-3">
          <span class="text-secondary small d-block mb-2">⚡ Quick 1-Click Database Demo Logins</span>
          <div class="d-flex flex-column gap-2">
            <form method="POST" action="<?= url('login.php') ?>">
              <?= csrfInput() ?>
              <input type="hidden" name="action" value="demo_member">
              <button type="submit" class="btn btn-dark border border-secondary w-100 btn-sm text-start d-flex justify-content-between align-items-center">
                <span><i class="bi bi-person-fill text-success me-2"></i> Member: Aarav Patel</span>
                <span class="badge bg-success-subtle text-success">Athlete</span>
              </button>
            </form>

            <form method="POST" action="<?= url('login.php') ?>">
              <?= csrfInput() ?>
              <input type="hidden" name="action" value="demo_trainer">
              <button type="submit" class="btn btn-dark border border-secondary w-100 btn-sm text-start d-flex justify-content-between align-items-center">
                <span><i class="bi bi-award-fill text-warning me-2"></i> Trainer: Coach Raj Malhotra</span>
                <span class="badge bg-warning-subtle text-warning">Coach</span>
              </button>
            </form>

            <form method="POST" action="<?= url('login.php') ?>">
              <?= csrfInput() ?>
              <input type="hidden" name="action" value="demo_owner">
              <button type="submit" class="btn btn-dark border border-secondary w-100 btn-sm text-start d-flex justify-content-between align-items-center">
                <span><i class="bi bi-buildings-fill text-info me-2"></i> Gym Owner: Priya Sharma</span>
                <span class="badge bg-info-subtle text-info">Owner</span>
              </button>
            </form>

            <form method="POST" action="<?= url('login.php') ?>">
              <?= csrfInput() ?>
              <input type="hidden" name="action" value="demo_admin">
              <button type="submit" class="btn btn-dark border border-secondary w-100 btn-sm text-start d-flex justify-content-between align-items-center">
                <span><i class="bi bi-shield-lock-fill text-danger me-2"></i> Admin: System Administrator</span>
                <span class="badge bg-danger-subtle text-danger">Admin</span>
              </button>
            </form>
          </div>
        </div>

        <div class="text-center mt-4 pt-2">
          <span class="text-secondary small">Don't have an account? </span>
          <a href="<?= url('register.php') ?>" class="text-success small fw-semibold text-decoration-none">Create Account</a>
        </div>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
