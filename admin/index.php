<?php
/**
 * FitSync AI — Platform Administrator Portal Landing Page
 *
 * Protected: Only users with role 'admin' may access this portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role check
requireRole('admin');

$user = currentUser();
$pageTitle = 'Platform Admin — FitSync AI';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e($pageTitle) ?></title>
  <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
  <script src="<?= asset('js/lucide.min.js') ?>"></script>
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
      background: rgba(168, 85, 247, 0.15);
      color: #a855f7;
      border: 1px solid rgba(168, 85, 247, 0.3);
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
            <i data-lucide="shield-check" style="width: 14px; height: 14px;"></i> System Administrator
          </span>
          <h2 style="font-size: 1.8rem; font-weight: 700; margin-top: 14px; color: #ffffff;">
            Welcome, <?= e($user['full_name']) ?>
          </h2>
          <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 0;">
            Admin Email: <strong style="color: #cbd5e1;"><?= e($user['email']) ?></strong> (ID: #<?= (int)$user['id'] ?>)
          </p>
        </div>
        <img src="<?= asset('assets/images/logo.jpg') ?>" alt="Logo" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #a855f7;" onerror="this.style.display='none'">
      </div>

      <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <h4 style="color: #a855f7; font-size: 1rem; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="shield" style="width: 16px; height: 16px;"></i> Authenticated in Platform Administration
        </h4>
        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 0; line-height: 1.5;">
          Review and verify newly registered Gyms and Trainers before granting unrestricted platform access.
        </p>
      </div>

      <div id="adminVerificationsPanel" style="margin-bottom: 24px;">
        <h4 style="color: #ffffff; font-size: 1rem; margin-bottom: 10px;">Pending Platform Verifications</h4>
        <div id="adminPendingLists" style="font-size: 0.88rem; color: #94a3b8;">Loading pending verifications...</div>
      </div>

      <div style="display: flex; gap: 12px; align-items: center;">
        <span style="color: #64748b; font-size: 0.85rem;">Session Active (Role: Platform Admin)</span>
        <a href="<?= url('logout.php?portal_ctx=admin') ?>" class="btn-action btn-logout" style="margin-left: auto;">
          <i data-lucide="log-out" style="width: 15px; height: 15px;"></i> Sign Out
        </a>
      </div>
    </div>
  </div>

  <script src="<?= asset('js/api_client.js') ?>"></script>
  <script>
    async function loadAdminVerifications() {
      const box = document.getElementById('adminPendingLists');
      if (!box) return;
      try {
        if (typeof window.fitSyncRefreshSession === 'function') {
          await window.fitSyncRefreshSession('admin', '../login.php');
        }
        const res = await fetch('../api/admin/verifications.php');
        const json = await res.json();
        if (!json.success || !json.data) {
          box.innerText = json.message || 'Unable to load verification queue.';
          return;
        }
        const gyms = json.data.pending_gyms || [];
        const trainers = json.data.pending_trainers || [];
        if (gyms.length === 0 && trainers.length === 0) {
          box.innerHTML = '<div style="padding:12px;border:1px dashed rgba(255,255,255,0.12);border-radius:8px;">No pending gym or trainer verifications.</div>';
          return;
        }
        let html = '';
        gyms.forEach(g => {
          html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:8px;">
            <div><strong style="color:#fff;">Gym: ${g.gym_name}</strong> (${g.city}, ${g.state})<div style="font-size:12px;color:#94a3b8;">Owner: ${g.owner_name} (${g.owner_email})</div></div>
            <div style="display:flex;gap:6px;">
              <button type="button" onclick="reviewEntity('gym', ${g.gym_id}, 'approve')" style="background:#10b981;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;">Approve</button>
              <button type="button" onclick="reviewEntity('gym', ${g.gym_id}, 'reject')" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;">Reject</button>
            </div>
          </div>`;
        });
        trainers.forEach(t => {
          html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:8px;">
            <div><strong style="color:#fff;">Trainer: ${t.full_name}</strong> (${t.email})<div style="font-size:12px;color:#94a3b8;">${t.certification_name || ''} • ${t.certifying_body || ''} • ${t.experience_years} yrs</div></div>
            <div style="display:flex;gap:6px;">
              <button type="button" onclick="reviewEntity('trainer', ${t.user_id}, 'approve')" style="background:#10b981;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;">Verify</button>
              <button type="button" onclick="reviewEntity('trainer', ${t.user_id}, 'reject')" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;">Reject</button>
            </div>
          </div>`;
        });
        box.innerHTML = html;
      } catch (e) {
        box.innerText = 'Error loading verification queue.';
      }
    }
    async function reviewEntity(entityType, entityId, decision) {
      const res = await fetch('../api/admin/verifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, decision: decision })
      });
      const json = await res.json();
      alert(json.message || 'Updated.');
      loadAdminVerifications();
    }
    window.addEventListener('DOMContentLoaded', () => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
      loadAdminVerifications();
    });
  </script>
</body>
</html>
