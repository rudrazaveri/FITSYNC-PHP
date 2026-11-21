<?php
/**
 * FitSync AI — Member Registration Page
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/supabase.php';

if (isLoggedIn()) {
    header('Location: ' . url('dashboard.php'));
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $role = $_POST['role'] ?? 'member';

    if (empty($fullName) || empty($email) || empty($password)) {
        $error = 'Please fill out all required fields.';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters.';
    } else {
        // Try Supabase Sign Up
        $res = Supabase::auth()->signUp($email, $password, [
            'full_name' => $fullName,
            'role' => $role
        ]);

        // Login session
        setCurrentUser([
            'id' => $res['data']['user']['id'] ?? uniqid(),
            'full_name' => $fullName,
            'email' => $email,
            'role' => $role
        ]);

        setFlash('success', 'Account created successfully! Complete your initial health assessment.');
        header('Location: ' . url('assessment.php'));
        exit;
    }
}

$pageTitle = 'Join FitSync AI';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-5 my-auto">
  <div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
      <div class="fitness-card p-4 p-md-5">
        <div class="text-center mb-4">
          <img src="<?= asset('assets/logo.jpg') ?>" alt="Logo" width="56" height="56" class="rounded-circle border border-success mb-2">
          <h3 class="fw-bold text-white">Create Account</h3>
          <p class="text-secondary small">Begin your intelligent training journey</p>
        </div>

        <?php if ($error): ?>
          <div class="alert alert-danger py-2 small border-0"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="POST" action="<?= url('register.php') ?>">
          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Full Name</label>
            <input type="text" name="full_name" class="form-control form-control-dark" placeholder="Aarav Patel" required>
          </div>

          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Email Address</label>
            <input type="email" name="email" class="form-control form-control-dark" placeholder="aarav@fitsync.ai" required>
          </div>

          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Password</label>
            <input type="password" name="password" class="form-control form-control-dark" placeholder="Minimum 6 characters" required>
          </div>

          <div class="mb-4">
            <label class="form-label text-light small fw-semibold">Account Role</label>
            <select name="role" class="form-select form-select-dark">
              <option value="member" selected>Gym Member / Athlete</option>
              <option value="trainer">Fitness Trainer / Coach</option>
            </select>
          </div>

          <button type="submit" class="btn btn-fitness w-100 py-2 fw-semibold">
            <i class="bi bi-person-check-fill me-1"></i> Register & Continue
          </button>
        </form>

        <div class="text-center mt-4 pt-2">
          <span class="text-secondary small">Already have an account? </span>
          <a href="<?= url('login.php') ?>" class="text-success small fw-semibold text-decoration-none">Sign In</a>
        </div>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
