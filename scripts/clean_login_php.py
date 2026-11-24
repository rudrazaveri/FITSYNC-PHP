with open('login.php', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Clean up POST handler in login.php
old_post = """// Handle Form Submission
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
}"""

new_post = """// Handle Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();
    $email    = trim($_POST['email'] ?? '');
    $password = (string)($_POST['password'] ?? '');
    $remember = !empty($_POST['remember']);

    $result = authenticateUser($email, $password, $remember);

    if ($result['success']) {
        setFlash('success', 'Welcome back, ' . htmlspecialchars($result['user']['full_name']) . '!');
        header('Location: ' . $result['redirect']);
        exit;
    } else {
        $error = $result['message'];
    }
}"""

if old_post in c:
    c = c.replace(old_post, new_post)
    print("Cleaned login.php POST handler")
else:
    print("WARNING: old_post not found")

# 2. Remove demo buttons block from login.php
old_demo_block = """        <!-- Demo Fast Access Pill Group (All Seeded Database Accounts) -->
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
        </div>"""

if old_demo_block in c:
    c = c.replace(old_demo_block, "")
    print("Removed demo block from login.php")
else:
    print("WARNING: old_demo_block not found")

# 3. Clean placeholder
c = c.replace('placeholder="athlete@fitsync.health or coach@fitsync.health"', 'placeholder="name@example.com"')

with open('login.php', 'w', encoding='utf-8') as f:
    f.write(c)

print("login.php write complete")
