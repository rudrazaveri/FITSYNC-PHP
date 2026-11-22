<?php
/**
 * FitSync AI — Member Registration Page
 *
 * Connects registration to MySQL, validates input, enforces role = 'user',
 * hashes password with Bcrypt, creates initial profile, and logs user in.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

if (isLoggedIn()) {
    redirectByRole();
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();

    $data = [
        'full_name'     => trim($_POST['full_name'] ?? ''),
        'email'         => trim($_POST['email'] ?? ''),
        'phone'         => trim($_POST['phone'] ?? ''),
        'password'      => (string)($_POST['password'] ?? ''),
        'gender'        => $_POST['gender'] ?? 'prefer_not_to_say',
        'height'        => $_POST['height'] ?? null,
        'weight'        => $_POST['weight'] ?? null,
        'activityLevel' => $_POST['fitness_experience'] ?? 'intermediate'
    ];

    $confirmPassword = (string)($_POST['confirm_password'] ?? '');
    if ($data['password'] !== $confirmPassword) {
        $error = 'Passwords do not match. Please verify both password entries.';
    } else {
        $result = registerUser($data);
        if ($result['success']) {
            setFlash('success', 'Your account has been created successfully! Welcome to FitSync.');
            header('Location: ' . $result['redirect']);
            exit;
        } else {
            $error = $result['message'];
        }
    }
}

$pageTitle = 'Join FitSync AI — Member Registration';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-5 my-auto">
  <div class="row justify-content-center">
    <div class="col-md-7 col-lg-6">
      <div class="fitness-card p-4 p-md-5">
        <div class="text-center mb-4">
          <img src="<?= asset('assets/images/logo.jpg') ?>" alt="Logo" width="56" height="56" class="rounded-circle border border-success mb-2" onerror="this.src='<?= asset('assets/logo.jpg') ?>'">
          <h3 class="fw-bold text-white">Create Member Account</h3>
          <p class="text-secondary small">Begin your intelligent training journey</p>
        </div>

        <?php if ($error): ?>
          <div class="alert alert-danger py-2 small border-0 mb-3"><?= e($error) ?></div>
        <?php endif; ?>

        <form method="POST" action="<?= url('register.php') ?>">
          <?= csrfInput() ?>

          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Full Legal Name *</label>
            <input type="text" name="full_name" class="form-control form-control-dark" placeholder="Rohan Sharma" value="<?= e($_POST['full_name'] ?? '') ?>" required>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-md-7">
              <label class="form-label text-light small fw-semibold">Email Address *</label>
              <input type="email" name="email" class="form-control form-control-dark" placeholder="rohan@example.com" value="<?= e($_POST['email'] ?? '') ?>" required>
            </div>
            <div class="col-md-5">
              <label class="form-label text-light small fw-semibold">Mobile Number</label>
              <input type="tel" name="phone" class="form-control form-control-dark" placeholder="+91 98765 43210" value="<?= e($_POST['phone'] ?? '') ?>">
            </div>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-md-6">
              <label class="form-label text-light small fw-semibold">Password *</label>
              <input type="password" name="password" class="form-control form-control-dark" placeholder="Minimum 6 characters" required>
            </div>
            <div class="col-md-6">
              <label class="form-label text-light small fw-semibold">Confirm Password *</label>
              <input type="password" name="confirm_password" class="form-control form-control-dark" placeholder="Repeat password" required>
            </div>
          </div>

          <!-- Member Biometrics -->
          <div class="p-3 rounded mb-4" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);">
            <span class="text-success small fw-semibold d-block mb-2">Optional Initial Biometrics:</span>
            <div class="row g-2">
              <div class="col-4">
                <label class="form-label text-secondary small">Gender</label>
                <select name="gender" class="form-select form-select-dark form-select-sm">
                  <option value="male" selected>Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="col-4">
                <label class="form-label text-secondary small">Height (cm)</label>
                <input type="number" step="0.5" name="height" class="form-control form-control-dark form-control-sm" placeholder="175" value="<?= e($_POST['height'] ?? '') ?>">
              </div>
              <div class="col-4">
                <label class="form-label text-secondary small">Weight (kg)</label>
                <input type="number" step="0.5" name="weight" class="form-control form-control-dark form-control-sm" placeholder="70" value="<?= e($_POST['weight'] ?? '') ?>">
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-fitness w-100 py-2 fw-semibold">
            <i class="bi bi-person-check-fill me-1"></i> Register Athlete Profile & Enter FitSync
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
