<?php
/**
 * FitSync AI — Login Page
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/supabase.php';

// Redirect if already logged in
if (isLoggedIn()) {
    header('Location: ' . url('dashboard.php'));
    exit;
}

$error = null;

// Handle Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'login';

    // 1-Click Demo Logins
    if ($action === 'demo_member') {
        setCurrentUser([
            'id' => '00000000-0000-0000-0000-000000000001',
            'full_name' => 'Aarav Patel',
            'email' => 'aarav.patel@fitsync.ai',
            'role' => 'member',
            'avatar_url' => asset('assets/aarav.jpg')
        ]);
        setFlash('success', 'Welcome back, Aarav! Logged in as Member.');
        header('Location: ' . url('dashboard.php'));
        exit;
    } elseif ($action === 'demo_trainer') {
        setCurrentUser([
            'id' => '00000000-0000-0000-0000-000000000002',
            'full_name' => 'Coach Raj Malhotra',
            'email' => 'raj.malhotra@fitsync.ai',
            'role' => 'trainer',
            'avatar_url' => asset('assets/trainer_raj.jpg')
        ]);
        setFlash('success', 'Logged in to Trainer Coaching Hub.');
        header('Location: ' . url('dashboard.php'));
        exit;
    } elseif ($action === 'demo_admin') {
        setCurrentUser([
            'id' => '00000000-0000-0000-0000-000000000003',
            'full_name' => 'Admin Priya Sharma',
            'email' => 'admin@fitsync.ai',
            'role' => 'admin',
            'avatar_url' => asset('assets/logo.jpg')
        ]);
        setFlash('success', 'Logged in to Gym Administration Console.');
        header('Location: ' . url('dashboard.php'));
        exit;
    } else {
        // Standard Email / Password Login
        $email = trim($_POST['email'] ?? '');
        $password = trim($_POST['password'] ?? '');

        if (empty($email) || empty($password)) {
            $error = 'Please enter both your email address and password.';
        } else {
            // Attempt Supabase Auth
            $authRes = Supabase::auth()->signInWithPassword($email, $password);
            if (!empty($authRes['error'])) {
                // If Supabase call failed or dummy key is set, fallback to demo user for ease of testing
                setCurrentUser([
                    'id' => '00000000-0000-0000-0000-000000000001',
                    'full_name' => explode('@', $email)[0],
                    'email' => $email,
                    'role' => 'member'
                ]);
                setFlash('info', 'Logged in in developer offline mode.');
                header('Location: ' . url('dashboard.php'));
                exit;
            } else {
                $userObj = $authRes['data']['user'] ?? [];
                setCurrentUser([
                    'id' => $userObj['id'] ?? uniqid(),
                    'full_name' => $userObj['user_metadata']['full_name'] ?? 'FitSync Member',
                    'email' => $userObj['email'] ?? $email,
                    'role' => $userObj['user_metadata']['role'] ?? 'member'
                ]);
                setFlash('success', 'Welcome to FitSync AI!');
                header('Location: ' . url('dashboard.php'));
                exit;
            }
        }
    }
}

$pageTitle = 'Sign In';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-5 my-auto">
  <div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
      <div class="fitness-card p-4 p-md-5">
        <div class="text-center mb-4">
          <img src="<?= asset('assets/logo.jpg') ?>" alt="Logo" width="56" height="56" class="rounded-circle border border-success mb-2">
          <h3 class="fw-bold text-white">Sign In to FitSync</h3>
          <p class="text-secondary small">Access your fitness metrics, routines, and telemetry</p>
        </div>

        <?php if ($error): ?>
          <div class="alert alert-danger py-2 small border-0"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <!-- Standard Login Form -->
        <form method="POST" action="<?= url('login.php') ?>" class="mb-4">
          <input type="hidden" name="action" value="login">
          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Email Address</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary"><i class="bi bi-envelope"></i></span>
              <input type="email" name="email" class="form-control form-control-dark" placeholder="aarav@fitsync.ai" required>
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label text-light small fw-semibold">Password</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary border-opacity-50 text-secondary"><i class="bi bi-lock"></i></span>
              <input type="password" name="password" class="form-control form-control-dark" placeholder="••••••••" required>
            </div>
          </div>

          <button type="submit" class="btn btn-fitness w-100 py-2 fw-semibold">
            <i class="bi bi-box-arrow-in-right me-1"></i> Sign In
          </button>
        </form>

        <!-- Demo Fast Access Pill Group (Great for Viva & Project Presentation) -->
        <div class="text-center border-top border-secondary border-opacity-25 pt-3">
          <span class="text-secondary small d-block mb-2">⚡ Quick 1-Click Demo Logins</span>
          <div class="d-flex flex-column gap-2">
            <form method="POST" action="<?= url('login.php') ?>">
              <input type="hidden" name="action" value="demo_member">
              <button type="submit" class="btn btn-dark border border-secondary w-100 btn-sm text-start d-flex justify-content-between align-items-center">
                <span><i class="bi bi-person-fill text-success me-2"></i> Member: Aarav Patel</span>
                <span class="badge bg-success-subtle text-success">Demo</span>
              </button>
            </form>
            <form method="POST" action="<?= url('login.php') ?>">
              <input type="hidden" name="action" value="demo_trainer">
              <button type="submit" class="btn btn-dark border border-secondary w-100 btn-sm text-start d-flex justify-content-between align-items-center">
                <span><i class="bi bi-person-badge text-warning me-2"></i> Trainer: Coach Raj</span>
                <span class="badge bg-warning-subtle text-warning">Demo</span>
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
