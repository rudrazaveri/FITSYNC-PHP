<?php
/**
 * FitSync AI — Gym Owner Portal Landing Page
 *
 * Protected: Only users with role 'gym_owner' may access this portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role check
requireRole('gym_owner');

$user = currentUser();
$pageTitle = 'Gym Owner Portal — FitSync AI';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e($pageTitle) ?></title>
  <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <style>
    body {
      background-color: #0b0f17;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .portal-container {
      max-width: 800px;
      margin: 60px auto;
      padding: 0 20px;
      width: 100%;
    }
    .portal-card {
      background: #131b2e;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-logout {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-logout:hover {
      background: #ef4444;
      color: #ffffff;
    }
  </style>
</head>
<body>

  <div class="portal-container">
    <div class="portal-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <div>
          <span class="role-badge">
            <i class="bi bi-buildings-fill"></i> Gym Facility Owner
          </span>
          <h2 style="font-size: 1.8rem; font-weight: 700; margin-top: 14px; color: #ffffff;">
            Welcome, <?= e($user['full_name']) ?>
          </h2>
          <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 0;">
            Owner Email: <strong style="color: #cbd5e1;"><?= e($user['email']) ?></strong> (ID: #<?= (int)$user['id'] ?>)
          </p>
        </div>
        <img src="<?= asset('assets/images/logo.jpg') ?>" alt="Logo" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #3b82f6;" onerror="this.style.display='none'">
      </div>

      <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 18px; margin-bottom: 28px;">
        <h4 style="color: #3b82f6; font-size: 1rem; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <i class="bi bi-shield-check"></i> Authenticated in Gym Owner Portal
        </h4>
        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 0; line-height: 1.5;">
          Your Gym Owner role permissions have been confirmed. Standard gym athletes and unauthenticated visitors cannot access this management portal. Gym management, branch analytics, and trainer roster administration will be activated in later phases.
        </p>
      </div>

      <div style="display: flex; gap: 12px; align-items: center;">
        <span style="color: #64748b; font-size: 0.85rem;">Session Active (Role: Gym Owner)</span>
        <a href="<?= url('logout.php') ?>" class="btn-action btn-logout" style="margin-left: auto;">
          <i class="bi bi-box-arrow-right"></i> Sign Out
        </a>
      </div>
    </div>
  </div>

</body>
</html>
