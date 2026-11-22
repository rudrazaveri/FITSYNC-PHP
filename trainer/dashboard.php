<?php
/**
 * FitSync AI — Coach & Trainer Primary Workspace Dashboard
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 * Uses identical fonts, CSS variables, welcome banner, stat cards, tables, and Lucide icons.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Trainer Dashboard — FitSync AI';
$activeNav = 'dashboard';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

$stats = getTrainerDashboardStats((int)$_SESSION['user_id']);
$members = getTrainerAssignedMembers((int)$_SESSION['user_id']);
$schedule = getTrainerSchedule((int)$_SESSION['user_id']);
$todaySessions = array_filter($schedule['sessions'] ?? [], function($s) {
    return $s['session_date'] === date('Y-m-d');
});
?>

<!-- 1. Welcome Banner (Identical to User Portal) -->
<section class="welcome-banner">
  <div>
    <div class="welcome-date"><?= date('D, d M Y') ?></div>
    <h2 class="welcome-heading">Welcome Back, <span class="highlight-name"><?= e($coach['full_name'] ?? 'Coach') ?></span>! 👋</h2>
    <p class="welcome-subtitle">Overview of your assigned athletes, daily training sessions, and member adherence.</p>
  </div>
  <!-- Subtle 4-Point Decorative Star SVG -->
  <svg class="banner-star-deco" width="46" height="46" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
  </svg>
</section>

<!-- 2. Four Fitness Statistics Cards (Clicking jumps to respective views) -->
<section class="stats-grid">
  <!-- Card 1: Active Athletes -->
  <div class="fs-card stat-card" onclick="window.location.href='<?= url('trainer/members.php') ?>'" title="View All Members">
    <div class="stat-card-top">
      <div class="stat-icon-box stat-icon-blue">
        <i data-lucide="users"></i>
      </div>
      <span class="stat-label">Active Athletes</span>
    </div>
    <div>
      <div class="stat-value"><?= count($members) ?> Athletes</div>
      <div class="stat-trend-green">↑ 100% Active Roster</div>
    </div>
  </div>

  <!-- Card 2: Today's Sessions -->
  <div class="fs-card stat-card" onclick="window.location.href='<?= url('trainer/schedule.php') ?>'" title="View Schedule">
    <div class="stat-card-top">
      <div class="stat-icon-box stat-icon-pink">
        <i data-lucide="calendar"></i>
      </div>
      <span class="stat-label">Today's Sessions</span>
    </div>
    <div>
      <div class="stat-value"><?= count($todaySessions) ?> Scheduled</div>
      <div class="stat-trend-green">1-on-1 PT Sessions</div>
    </div>
  </div>

  <!-- Card 3: 7-Day Adherence -->
  <div class="fs-card stat-card" onclick="window.location.href='<?= url('trainer/members.php?tab=activity') ?>'" title="View Adherence">
    <div class="stat-card-top">
      <div class="stat-icon-box stat-icon-orange">
        <i data-lucide="activity"></i>
      </div>
      <span class="stat-label">Adherence Rate</span>
    </div>
    <div>
      <div class="stat-value"><?= (int)($stats['adherence_rate_pct'] ?? 88) ?>%</div>
      <div class="stat-trend-green">↑ +4% vs last week</div>
    </div>
  </div>

  <!-- Card 4: Volume Lifted -->
  <div class="fs-card stat-card" title="Total Collective Volume">
    <div class="stat-card-top">
      <div class="stat-icon-box" style="background:#F3E8FF; color:#8B5CF6; border:1px solid #E9D5FF;">
        <i data-lucide="dumbbell"></i>
      </div>
      <span class="stat-label">Volume Lifted</span>
    </div>
    <div>
      <div class="stat-value"><?= number_format((float)($stats['total_volume_kg'] ?? 42500)) ?> kg</div>
      <div class="stat-trend-green">Collective volume</div>
    </div>
  </div>
</section>

<!-- 3. Two-Column Dashboard Widgets -->
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 22px;">
  
  <!-- Today's Schedule Agenda -->
  <div class="fs-card" style="margin-bottom: 0;">
    <div class="card-header-row">
      <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="clock" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
        Today's Coaching Agenda
      </h3>
      <a href="<?= url('trainer/schedule.php') ?>" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;">View All</a>
    </div>

    <?php if (empty($todaySessions)): ?>
      <div style="text-align: center; padding: 28px 12px; color: var(--text-secondary);">
        <i data-lucide="coffee" style="width: 32px; height: 32px; color: var(--text-muted); margin-bottom: 8px;"></i>
        <p style="font-size: 13px; font-weight: 500;">No more sessions scheduled for today.</p>
        <p style="font-size: 11px; color: var(--text-muted);">Use this time to review athlete workout logs.</p>
      </div>
    <?php else: ?>
      <div class="schedule-list">
        <?php foreach ($todaySessions as $sess): ?>
          <div class="schedule-item">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="schedule-time-box">
                <strong><?= date('h:i A', strtotime($sess['start_time'])) ?></strong>
                <span><?= e($sess['session_type'] ?? 'PT') ?></span>
              </div>
              <div>
                <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 2px;">
                  <?= e($sess['member_name'] ?? 'Assigned Athlete') ?>
                </h4>
                <p style="font-size: 11px; color: var(--text-secondary);">
                  <?= e($sess['gym_name'] ?? 'Home Gym') ?>
                </p>
              </div>
            </div>
            <a href="<?= url('trainer/member_details.php?id=' . (int)$sess['member_user_id']) ?>" class="btn-outline-gym" style="margin-top: 0; padding: 5px 10px; font-size: 11px;">
              Dossier
            </a>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>

  <!-- Member Adherence & Inactivity Alerts -->
  <div class="fs-card" style="margin-bottom: 0;">
    <div class="card-header-row">
      <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="alert-circle" style="width: 18px; height: 18px; color: var(--orange);"></i>
        Roster Adherence Feed
      </h3>
      <a href="<?= url('trainer/members.php') ?>" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;">Roster</a>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px;">
      <?php foreach ($members as $m): 
        $days = (int)($m['days_since_workout'] ?? 0);
        $isInactive = $days >= 3;
      ?>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
              <?= strtoupper(substr($m['full_name'], 0, 2)) ?>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-main);"><?= e($m['full_name']) ?></div>
              <div style="font-size: 11px; color: var(--text-secondary);"><?= e($m['fitness_experience'] ?? 'Intermediate') ?></div>
            </div>
          </div>
          <div style="text-align: right;">
            <?php if ($days === 0): ?>
              <span class="badge-active">Active Today</span>
            <?php elseif ($isInactive): ?>
              <span class="fs-badge fs-badge-orange"><?= $days ?>d Inactive</span>
            <?php else: ?>
              <span class="fs-badge fs-badge-green"><?= $days ?>d ago</span>
            <?php endif; ?>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>

</div>

<!-- 4. Assigned Athletes Primary Roster Table -->
<div class="fs-card">
  <div class="card-header-row">
    <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
      <i data-lucide="users" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
      Assigned Athletes Roster
    </h3>
    <a href="<?= url('trainer/members.php') ?>" class="btn-outline-gym" style="margin-top: 0; padding: 5px 12px; font-size: 12px;">
      Full Directory (<?= count($members) ?>)
    </a>
  </div>

  <div style="overflow-x: auto;">
    <table class="fs-table">
      <thead>
        <tr>
          <th>ATHLETE</th>
          <th>PRIMARY GOAL</th>
          <th>CURRENT WEIGHT</th>
          <th>LAST WORKOUT</th>
          <th>HOME GYM</th>
          <th>STATUS</th>
          <th style="text-align: right;">ACTION</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($members)): ?>
          <tr>
            <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-secondary);">
              No athletes currently assigned to your coaching roster.
            </td>
          </tr>
        <?php else: ?>
          <?php foreach ($members as $mbr): ?>
            <tr>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
                    <?= strtoupper(substr($mbr['full_name'], 0, 2)) ?>
                  </div>
                  <div>
                    <strong style="color: var(--text-main); display: block;"><?= e($mbr['full_name']) ?></strong>
                    <span style="font-size: 11px; color: var(--text-secondary);"><?= e($mbr['email']) ?></span>
                  </div>
                </div>
              </td>
              <td>
                <span class="fs-badge fs-badge-blue">
                  <?= e(ucwords(str_replace('_', ' ', $mbr['primary_goal'] ?? 'General Fitness'))) ?>
                </span>
              </td>
              <td>
                <strong><?= $mbr['weight_kg'] ? number_format((float)$mbr['weight_kg'], 1) . ' kg' : '—' ?></strong>
              </td>
              <td>
                <span style="font-size: 12px; color: var(--text-secondary);">
                  <?= $mbr['last_workout_date'] ? date('M d, Y', strtotime($mbr['last_workout_date'])) : 'No sessions' ?>
                </span>
              </td>
              <td>
                <span style="font-size: 12px; color: var(--text-secondary);"><?= e($mbr['home_gym_name'] ?? 'FitZone Fitness') ?></span>
              </td>
              <td>
                <span class="badge-active">Assigned</span>
              </td>
              <td style="text-align: right;">
                <a href="<?= url('trainer/member_details.php?id=' . (int)$mbr['id']) ?>" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;">
                  View Dossier
                </a>
              </td>
            </tr>
          <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
