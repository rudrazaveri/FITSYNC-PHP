<?php
/**
 * FitSync AI — Multi-Gym QR Turnstile Attendance
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/session.php';

$pageTitle = 'Gym Attendance & QR Turnstile';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-4">
  <!-- Top Banner -->
  <div class="fitness-card p-4 mb-4">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div>
        <span class="badge bg-warning-subtle text-warning small mb-1">MULTI-GYM NETWORK PASS</span>
        <h3 class="text-white fw-bold mb-1">Cryptographic QR Turnstile Access</h3>
        <p class="text-secondary small mb-0">Scan your mobile pass at any affiliated FitSync branch turnstile for automated check-in.</p>
      </div>
      <div>
        <a href="<?= url('dashboard.php') ?>" class="btn btn-outline-light btn-sm">
          <i class="bi bi-chevron-left"></i> Dashboard
        </a>
      </div>
    </div>
  </div>

  <div class="row g-4 justify-content-center">
    <!-- QR Pass Card -->
    <div class="col-md-6 col-lg-5">
      <div class="fitness-card p-4 text-center">
        <div class="d-inline-block p-1 rounded-circle border border-success mb-2">
          <img src="<?= asset('assets/logo.jpg') ?>" width="40" height="40" class="rounded-circle" alt="Logo">
        </div>
        <h5 class="text-white fw-bold mb-0">FitSync Multi-Gym All-Access</h5>
        <span class="badge bg-success-subtle text-success small mb-3">ACTIVE MEMBERSHIP</span>

        <!-- Simulated Turnstile QR Code Box -->
        <div class="bg-white p-3 rounded-4 d-inline-block shadow-sm my-2">
          <!-- SVG QR Code pattern -->
          <svg width="180" height="180" viewBox="0 0 100 100" fill="#0f172a">
            <!-- Simplified modern QR matrix illustration -->
            <rect x="0" y="0" width="30" height="30" rx="4" />
            <rect x="5" y="5" width="20" height="20" fill="#fff" rx="2" />
            <rect x="9" y="9" width="12" height="12" fill="#0f172a" />

            <rect x="70" y="0" width="30" height="30" rx="4" />
            <rect x="75" y="5" width="20" height="20" fill="#fff" rx="2" />
            <rect x="79" y="9" width="12" height="12" fill="#0f172a" />

            <rect x="0" y="70" width="30" height="30" rx="4" />
            <rect x="5" y="75" width="20" height="20" fill="#fff" rx="2" />
            <rect x="9" y="79" width="12" height="12" fill="#0f172a" />

            <!-- Random data dots -->
            <rect x="36" y="8" width="6" height="6" />
            <rect x="48" y="14" width="8" height="6" />
            <rect x="36" y="24" width="8" height="8" />
            <rect x="10" y="38" width="8" height="8" />
            <rect x="24" y="42" width="6" height="6" />
            <rect x="38" y="38" width="14" height="14" rx="2" />
            <rect x="60" y="38" width="8" height="6" />
            <rect x="76" y="44" width="12" height="6" />
            <rect x="42" y="60" width="8" height="8" />
            <rect x="56" y="56" width="12" height="6" />
            <rect x="76" y="60" width="8" height="14" />
            <rect x="38" y="78" width="8" height="12" />
            <rect x="52" y="76" width="14" height="8" />
            <rect x="74" y="82" width="14" height="8" />
          </svg>
        </div>

        <div class="mt-2 text-secondary small">
          Token: <code class="text-success fw-bold">FS-<?= strtoupper(substr(md5(time()), 0, 8)) ?></code>
        </div>
        <div class="text-secondary" style="font-size: 11px;">Refreshes automatically every 60 seconds</div>

        <button class="btn btn-fitness w-100 mt-4 py-2" onclick="alert('✅ Turnstile Unlocked! Welcome to FitSync Prime Arena.');">
          <i class="bi bi-qr-code-scan me-2"></i> Simulate Scan Turnstile
        </button>
      </div>
    </div>

    <!-- Attendance History Log -->
    <div class="col-md-6 col-lg-7">
      <div class="fitness-card p-4">
        <h5 class="text-white fw-bold mb-3 d-flex align-items-center gap-2">
          <i class="bi bi-clock-history text-success"></i> Recent Gym Check-Ins
        </h5>

        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle small mb-0">
            <thead>
              <tr class="text-secondary border-secondary">
                <th>DATE</th>
                <th>GYM BRANCH</th>
                <th>CHECK-IN</th>
                <th>METHOD</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-white fw-semibold">Today</td>
                <td>Prime Arena, Sector 4</td>
                <td>06:45 AM</td>
                <td><span class="badge bg-dark border border-secondary text-secondary">Turnstile QR</span></td>
                <td><span class="badge bg-success-subtle text-success">Verified</span></td>
              </tr>
              <tr>
                <td class="text-white fw-semibold">Yesterday</td>
                <td>Prime Arena, Sector 4</td>
                <td>07:10 AM</td>
                <td><span class="badge bg-dark border border-secondary text-secondary">Turnstile QR</span></td>
                <td><span class="badge bg-success-subtle text-success">Verified</span></td>
              </tr>
              <tr>
                <td class="text-white fw-semibold">3 Days Ago</td>
                <td>Metro Crossfit Studio</td>
                <td>06:30 PM</td>
                <td><span class="badge bg-dark border border-secondary text-secondary">Turnstile QR</span></td>
                <td><span class="badge bg-success-subtle text-success">Verified</span></td>
              </tr>
              <tr>
                <td class="text-white fw-semibold">4 Days Ago</td>
                <td>Prime Arena, Sector 4</td>
                <td>07:00 AM</td>
                <td><span class="badge bg-dark border border-secondary text-secondary">Turnstile QR</span></td>
                <td><span class="badge bg-success-subtle text-success">Verified</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
