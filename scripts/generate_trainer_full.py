import os

trainer_html = """<!DOCTYPE html>
<html lang="en">
<head>
  <base href="../">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trainer Portal — FitSync AI</title>
  <link rel="icon" type="image/jpeg" href="assets/images/logo.jpg">

  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Core FitSync Stylesheets -->
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/responsive.css">
  <link rel="stylesheet" href="css/trainer.css">

  <!-- Lucide Icons & Chart.js -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    /* Portal Switcher Bar */
    .portal-nav-bar {
      background: #0f172a;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      z-index: 100;
    }
    .portal-pills {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .portal-pill {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    .portal-pill-active {
      background: rgba(37, 99, 235, 0.2);
      color: #60a5fa;
      border-color: rgba(96, 165, 250, 0.4);
    }
    .portal-pill-inactive {
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
      border-color: rgba(255, 255, 255, 0.1);
    }
    .portal-pill-inactive:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }
    .coach-switcher-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.06);
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .coach-switcher-box select {
      background: transparent;
      color: #f8fafc;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
    }
    .coach-switcher-box select option {
      background: #1e293b;
      color: #f8fafc;
    }

    .trainer-view-section {
      display: none;
      animation: fadeIn 0.18s ease-in-out;
    }
    .trainer-view-section.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(3px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .fs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .fs-table th {
      text-align: left;
      padding: 10px 14px;
      background: #F8FAFC;
      border-bottom: 2px solid var(--border-color);
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .fs-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-main);
      vertical-align: middle;
    }
    .fs-table tr:hover {
      background: rgba(241, 245, 249, 0.6);
    }

    .badge-tier {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-tier-elite { background: #FEF3C7; color: #D97706; border: 1px solid #FCD34D; }
    .badge-tier-platinum { background: #E0E7FF; color: #4F46E5; border: 1px solid #C7D2FE; }
    .badge-tier-gold { background: #FEF9C3; color: #CA8A04; border: 1px solid #FDE047; }
    .badge-tier-silver { background: #F1F5F9; color: #64748B; border: 1px solid #CBD5E1; }

    .tag-chip {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      background: #F1F5F9;
      color: #475569;
      font-size: 11px;
      font-weight: 600;
    }

    /* Modal Backdrop */
    .fs-modal-backdrop {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(4px);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .fs-modal-content {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 640px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid #E2E8F0;
      animation: modalSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalSlide {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  </style>
</head>
<body class="bg-main text-main font-inter">

  <!-- Top Global Portal Switcher -->
  <div class="portal-nav-bar">
    <div style="display:flex; align-items:center; gap:16px;">
      <a href="index.html" style="display:flex; align-items:center; gap:8px; text-decoration:none;">
        <div style="width:28px; height:28px; border-radius:6px; background:#2563eb; display:flex; align-items:center; justify-content:center; color:#fff;">
          <i data-lucide="activity" style="width:16px; height:16px;"></i>
        </div>
        <span style="font-weight:800; font-size:15px; color:#fff; letter-spacing:-0.3px;">FitSync AI</span>
      </a>
      <div class="portal-pills">
        <a href="gym_owner/index.html" class="portal-pill portal-pill-inactive">
          <i data-lucide="building-2" style="width:14px; height:14px;"></i> Gym Owner Portal
        </a>
        <a href="trainer/index.html" class="portal-pill portal-pill-active">
          <i data-lucide="dumbbell" style="width:14px; height:14px;"></i> Trainer Portal
        </a>
        <a href="index.html" class="portal-pill portal-pill-inactive">
          <i data-lucide="user" style="width:14px; height:14px;"></i> Member Portal
        </a>
      </div>
    </div>

    <!-- Active Coach Selector -->
    <div class="coach-switcher-box">
      <i data-lucide="user-check" style="width:14px; height:14px; color:#60a5fa;"></i>
      <span style="font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase;">Coach:</span>
      <select id="activeCoachSwitcher" onchange="handleCoachSwitch(this.value)">
        <!-- Populated Dynamically -->
      </select>
    </div>
  </div>

  <!-- Mobile Top Bar -->
  <header class="mobile-top-bar">
    <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="switchTrainerView('dashboard')">
      <div class="brand-icon-box" style="width: 32px; height: 32px;">
        <i data-lucide="activity" style="width: 18px; height: 18px;"></i>
      </div>
      <div>
        <strong style="font-size: 16px; color: var(--text-main);">FitSync Coach</strong>
      </div>
    </div>
    <button class="mobile-menu-btn" id="mobileNavToggle" aria-label="Toggle navigation" onclick="document.getElementById('sidebarNav').classList.toggle('open')">
      <i data-lucide="menu" style="width: 24px; height: 24px;"></i>
    </button>
  </header>

  <!-- App Container -->
  <div class="app-layout">
    
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebarNav">
      <!-- Logo Branding -->
      <a class="sidebar-brand" href="trainer/index.html" onclick="switchTrainerView('dashboard'); return false;">
        <div class="brand-icon-box">
          <i data-lucide="activity" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="brand-info">
          <h1>FitSync</h1>
          <p>Fitness · Gym · Coach</p>
        </div>
      </a>

      <!-- Coach Profile Badge in Sidebar -->
      <div class="sidebar-user" title="Active Coach Profile" onclick="switchTrainerView('settings')" style="cursor: pointer;">
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
          <img id="sidebarCoachAvatar" src="assets/images/trainer_raj.jpg" class="user-avatar-circle" alt="Coach Avatar" onerror="this.src='assets/images/trainer_raj.jpg'">
          <div style="min-width:0; flex:1;">
            <div id="sidebarCoachName" style="font-size:13px; font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Coach Raj Malhotra</div>
            <div id="sidebarCoachTitle" style="font-size:11px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Head Strength Coach</div>
          </div>
        </div>
        <span class="user-status-dot" title="Active"></span>
      </div>

      <!-- Sidebar Navigation Links -->
      <nav class="sidebar-nav">
        <a class="sidebar-nav-item active" data-view="dashboard" href="javascript:void(0)" onclick="switchTrainerView('dashboard')">
          <i data-lucide="layout-dashboard"></i>
          <span class="nav-label">Dashboard</span>
        </a>
        <a class="sidebar-nav-item" data-view="members" href="javascript:void(0)" onclick="switchTrainerView('members')">
          <i data-lucide="users"></i>
          <span class="nav-label">Athletes Roster</span>
          <span class="nav-pill" id="sidebarBadgeAthletes">0</span>
        </a>
        <a class="sidebar-nav-item" data-view="workouts" href="javascript:void(0)" onclick="switchTrainerView('workouts')">
          <i data-lucide="dumbbell"></i>
          <span class="nav-label">Workout Plans</span>
        </a>
        <a class="sidebar-nav-item" data-view="schedule" href="javascript:void(0)" onclick="switchTrainerView('schedule')">
          <i data-lucide="calendar"></i>
          <span class="nav-label">Schedule & Sessions</span>
        </a>
        <a class="sidebar-nav-item" data-view="attendance" href="javascript:void(0)" onclick="switchTrainerView('attendance')">
          <i data-lucide="clipboard-check"></i>
          <span class="nav-label">Attendance Logs</span>
        </a>
        <a class="sidebar-nav-item" data-view="exercise_library" href="javascript:void(0)" onclick="switchTrainerView('exercise_library')">
          <i data-lucide="library"></i>
          <span class="nav-label">Exercise Library</span>
        </a>
        <a class="sidebar-nav-item" data-view="messages" href="javascript:void(0)" onclick="switchTrainerView('messages')">
          <i data-lucide="message-square"></i>
          <span class="nav-label">Messages</span>
          <span class="nav-pill" style="background:var(--primary-blue); color:#fff;">Live</span>
        </a>
        <a class="sidebar-nav-item" data-view="notifications" href="javascript:void(0)" onclick="switchTrainerView('notifications')">
          <i data-lucide="bell"></i>
          <span class="nav-label">Notifications</span>
        </a>
        <a class="sidebar-nav-item" data-view="settings" href="javascript:void(0)" onclick="switchTrainerView('settings')">
          <i data-lucide="settings"></i>
          <span class="nav-label">Coach Settings</span>
        </a>
      </nav>

      <!-- Sidebar Branch Footer -->
      <div style="padding: 16px; margin-top: auto; border-top: 1px solid var(--border-color); font-size: 11px; color: var(--text-muted); display:flex; align-items:center; gap:8px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981;"></span>
        <span id="sidebarGymBranch">FitZone Gym, Kothrud</span>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <main class="dashboard-center">

        <!-- ===================================================================== -->
        <!-- VIEW 1: DASHBOARD -->
        <!-- ===================================================================== -->
        <section id="view-dashboard" class="trainer-view-section active">
          <!-- Welcome Banner -->
          <section class="welcome-banner">
            <div>
              <div class="welcome-date" id="trainerLiveDate">Today</div>
              <h2 class="welcome-heading">Welcome Back, <span class="highlight-name" id="dashCoachWelcomeName">Coach</span>! 👋</h2>
              <p class="welcome-subtitle" id="dashCoachSubtitle">Overseeing assigned athletes, training volume, and member compliance.</p>
            </div>
            <svg class="banner-star-deco" width="46" height="46" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
            </svg>
          </section>

          <!-- 4 Telemetry Statistics Cards -->
          <section class="stats-grid">
            <div class="fs-card stat-card" onclick="switchTrainerView('members')" style="cursor: pointer;">
              <div class="stat-card-top">
                <div class="stat-icon-box stat-icon-blue">
                  <i data-lucide="users"></i>
                </div>
                <span class="stat-label">Active Athletes</span>
              </div>
              <div>
                <div class="stat-value" id="trainerStatAthletes">0 Athletes</div>
                <div class="stat-trend-green" id="trainerStatAthletesSub">Assigned roster</div>
              </div>
            </div>

            <div class="fs-card stat-card" onclick="switchTrainerView('schedule')" style="cursor: pointer;">
              <div class="stat-card-top">
                <div class="stat-icon-box stat-icon-pink">
                  <i data-lucide="calendar"></i>
                </div>
                <span class="stat-label">Today's Sessions</span>
              </div>
              <div>
                <div class="stat-value" id="trainerStatSessions">0 Scheduled</div>
                <div class="stat-trend-green">1-on-1 PT Consults</div>
              </div>
            </div>

            <div class="fs-card stat-card" onclick="switchTrainerView('members')" style="cursor: pointer;">
              <div class="stat-card-top">
                <div class="stat-icon-box stat-icon-orange">
                  <i data-lucide="activity"></i>
                </div>
                <span class="stat-label">Adherence Rate</span>
              </div>
              <div>
                <div class="stat-value" id="trainerStatAdherence">92%</div>
                <div class="stat-trend-green">↑ Target achieved</div>
              </div>
            </div>

            <div class="fs-card stat-card" onclick="switchTrainerView('workouts')" style="cursor: pointer;">
              <div class="stat-card-top">
                <div class="stat-icon-box" style="background:#F3E8FF; color:#8B5CF6; border:1px solid #E9D5FF;">
                  <i data-lucide="dumbbell"></i>
                </div>
                <span class="stat-label">Volume Lifted</span>
              </div>
              <div>
                <div class="stat-value" id="trainerStatVolume">38,500 kg</div>
                <div class="stat-trend-green">Collective volume</div>
              </div>
            </div>
          </section>

          <!-- Two-Column Widgets -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 22px;">
            <!-- Today's Coaching Agenda -->
            <div class="fs-card" style="margin-bottom: 0;">
              <div class="card-header-row">
                <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="clock" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
                  Today's Coaching Agenda
                </h3>
                <button type="button" class="btn-outline-gym" style="margin-top:0; padding:4px 10px; font-size:11px;" onclick="switchTrainerView('schedule')">Full Schedule</button>
              </div>
              <div class="schedule-list" id="trainerDashAgendaList">
                <!-- Dynamically rendered -->
              </div>
            </div>

            <!-- Recent Check-ins -->
            <div class="fs-card" style="margin-bottom: 0;">
              <div class="card-header-row">
                <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="qr-code" style="width: 18px; height: 18px; color: #10B981;"></i>
                  Recent Facility Check-ins
                </h3>
                <button type="button" class="btn-outline-gym" style="margin-top:0; padding:4px 10px; font-size:11px;" onclick="switchTrainerView('attendance')">View All</button>
              </div>
              <table class="fs-table">
                <thead>
                  <tr>
                    <th>Athlete</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="trainerDashCheckinsBody">
                  <!-- Dynamically rendered -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Athletes Roster Overview Table -->
          <div class="fs-card">
            <div class="card-header-row">
              <div>
                <h3 class="card-title">Assigned Athletes Roster Overview</h3>
                <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Athletes registered by Gym Owner and assigned to this coach.</p>
              </div>
              <button type="button" class="btn-primary-block" style="width:auto; padding:6px 14px; font-size:12px;" onclick="switchTrainerView('members')">Open Full Roster</button>
            </div>
            <div style="overflow-x: auto;">
              <table class="fs-table">
                <thead>
                  <tr>
                    <th>Athlete</th>
                    <th>Tier</th>
                    <th>Primary Goal</th>
                    <th>Weight</th>
                    <th>Adherence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="trainerDashRosterBody">
                  <!-- Dynamically rendered -->
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 2: ATHLETES ROSTER -->
        <!-- ===================================================================== -->
        <section id="view-members" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Athletes & Members Directory</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Oversee active coaching rosters, inspect complete athlete dossiers, and send instant training instructions.</p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="fs-badge fs-badge-blue" id="membersCountBadge" style="font-size: 13px; padding: 6px 12px;">
                <i data-lucide="users" style="width: 14px; height: 14px;"></i> 0 Athletes
              </span>
            </div>
          </div>

          <!-- Search & Filter Controls -->
          <div class="filter-search-bar" style="margin-bottom: 20px; display:flex; gap:12px; flex-wrap:wrap;">
            <div class="search-input-box" style="flex: 1; min-width: 240px;">
              <i data-lucide="search"></i>
              <input type="text" id="memberFilterInput" onkeyup="filterMemberCards()" placeholder="Search athletes by name, email, or fitness goal...">
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn-outline-gym active" id="btnFilterMyAthletes" onclick="setRosterFilter('my')" style="font-size:12px; padding:8px 14px; border-radius:8px;">My Athletes</button>
              <button type="button" class="btn-outline-gym" id="btnFilterAllAthletes" onclick="setRosterFilter('all')" style="font-size:12px; padding:8px 14px; border-radius:8px;">All Facility Athletes</button>
            </div>
          </div>

          <!-- Dynamic Member Cards Grid -->
          <div class="trainers-grid" id="memberCardsGrid">
            <!-- Dynamically populated from FitSyncStore -->
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 3: WORKOUT PLANS -->
        <!-- ===================================================================== -->
        <section id="view-workouts" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Workout Plan Prescriptions</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Design, review, and assign progressive resistance training splits to your athletes.</p>
            </div>
            <button class="btn-primary-block" style="width: auto; padding: 8px 16px;" onclick="alert('Workout split assignment modal initialized. Select an athlete below.')">
              <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 4px;"></i> Assign Workout
            </button>
          </div>

          <div class="trainers-grid" id="trainerWorkoutsGrid">
            <!-- Template 1: Hypertrophy Surplus -->
            <div class="trainer-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Upper Body Hypertrophy</h3>
                  <span class="fs-badge fs-badge-blue">4-Day Split</span>
                </div>
                <span class="fs-badge fs-badge-green">Active</span>
              </div>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                Incline Barbell Bench Press (4x8-10), DB Lateral Raises (4x15), Tricep Rope Pushdowns (3x12).
              </p>
              <div style="font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 10px; margin-bottom: 12px;">
                <span>Prescribed to: <strong>Assigned Athletes</strong></span>
              </div>
              <button class="btn-outline-gym" style="width: 100%;" onclick="alert('Preset synced to assigned athlete devices.')">Edit Prescription</button>
            </div>

            <!-- Template 2: Powerlifting Peak -->
            <div class="trainer-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Powerlifting Strength Peak</h3>
                  <span class="fs-badge fs-badge-orange">Strength Block</span>
                </div>
                <span class="fs-badge fs-badge-green">Active</span>
              </div>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                Conventional Deadlift (5x3 @ 85% 1RM), Barbell Low-Bar Squat (4x5), Heavy Paused Bench.
              </p>
              <div style="font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 10px; margin-bottom: 12px;">
                <span>Prescribed to: <strong>Powerlifters</strong></span>
              </div>
              <button class="btn-outline-gym" style="width: 100%;" onclick="alert('Preset synced.')">Edit Prescription</button>
            </div>

            <!-- Template 3: Functional Conditioning -->
            <div class="trainer-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Metabolic Athletic Conditioning</h3>
                  <span class="fs-badge" style="background:#F3E8FF; color:#8B5CF6;">Full Body</span>
                </div>
                <span class="fs-badge fs-badge-green">Active</span>
              </div>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                Kettlebell Clean & Press, Sled Pushes, Bulgarian Split Squats, Core Kinetic Bracing.
              </p>
              <div style="font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 10px; margin-bottom: 12px;">
                <span>Prescribed to: <strong>General Fitness</strong></span>
              </div>
              <button class="btn-outline-gym" style="width: 100%;" onclick="alert('Preset synced.')">Edit Prescription</button>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 4: SCHEDULE -->
        <!-- ===================================================================== -->
        <section id="view-schedule" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Training Schedule & Bookings</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Confirmed 1-on-1 personal training sessions and assessment appointments.</p>
            </div>
            <button class="btn-primary-block" style="width: auto; padding: 8px 16px;" onclick="openAddSessionModal()">
              <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 4px;"></i> Schedule New Session
            </button>
          </div>

          <div class="fs-card">
            <h3 class="card-title" style="margin-bottom: 14px;">Upcoming Training Sessions</h3>
            <div id="trainerScheduleList" class="schedule-list">
              <!-- Dynamically populated -->
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 5: ATTENDANCE -->
        <!-- ===================================================================== -->
        <section id="view-attendance" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Facility Attendance & Check-in Logs</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Live turnstile check-in logs for your assigned athletes.</p>
            </div>
          </div>

          <div class="fs-card">
            <div style="overflow-x: auto;">
              <table class="fs-table">
                <thead>
                  <tr>
                    <th>Athlete Name</th>
                    <th>Date & Time</th>
                    <th>Gym Facility</th>
                    <th>Turnstile Pass</th>
                  </tr>
                </thead>
                <tbody id="trainerAttendanceTableBody">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 6: EXERCISE LIBRARY -->
        <!-- ===================================================================== -->
        <section id="view-exercise_library" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Biomechanical Exercise Library</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Over 40 high-definition movement kinematics and coaching cues.</p>
            </div>
          </div>

          <div class="filter-search-bar" style="margin-bottom: 20px;">
            <div class="search-input-box" style="flex: 1;">
              <i data-lucide="search"></i>
              <input type="text" id="exerciseSearchInput" onkeyup="filterExerciseCards()" placeholder="Search exercises by name or muscle group...">
            </div>
          </div>

          <div class="trainers-grid" id="trainerExerciseGrid">
            <!-- Sample Movement Cards -->
            <div class="trainer-card ex-card" data-title="Incline Barbell Bench Press" data-muscle="Chest">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Incline Barbell Bench Press</h4>
              <span class="tag-chip" style="margin: 4px 0 8px 0;">Pectoralis Major (Clavicular)</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                Bench set to 30-degree incline. Grip shoulder-width, lower barbell cleanly to upper chest, drive up through palms.
              </p>
              <div style="font-size: 11px; color: var(--text-muted);">Kinematics: Upper Chest • Anterior Deltoids</div>
            </div>

            <div class="trainer-card ex-card" data-title="Conventional Barbell Deadlift" data-muscle="Back & Posterior Chain">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Conventional Barbell Deadlift</h4>
              <span class="tag-chip" style="margin: 4px 0 8px 0;">Posterior Kinetic Chain</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                Feet hip-width apart, grip bar outside shins, pull slack out of the barbell, pack lats, and drive the floor away.
              </p>
              <div style="font-size: 11px; color: var(--text-muted);">Kinematics: Glutes • Hamstrings • Erector Spinae</div>
            </div>

            <div class="trainer-card ex-card" data-title="Barbell Back Squat" data-muscle="Quads & Glutes">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Barbell Back Squat</h4>
              <span class="tag-chip" style="margin: 4px 0 8px 0;">Quadriceps & Gluteus Maximus</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                Rest bar on upper traps, brace core 360-degrees, descend until hip crease is parallel to knee joints, press up through midfoot.
              </p>
              <div style="font-size: 11px; color: var(--text-muted);">Kinematics: Quadriceps • Adductors • Core</div>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 7: MESSAGES -->
        <!-- ===================================================================== -->
        <section id="view-messages" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Athlete Communication Channels</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Direct messaging with your assigned gym athletes.</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 280px 1fr; gap: 18px; min-height: 480px;">
            <!-- Channels List -->
            <div class="fs-card" style="margin-bottom: 0; padding: 12px;">
              <h4 style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; text-transform: uppercase;">Athletes</h4>
              <div id="trainerChatChannelList" style="display: flex; flex-direction: column; gap: 6px;">
                <!-- Dynamically rendered -->
              </div>
            </div>

            <!-- Active Chat Box -->
            <div class="fs-card" style="margin-bottom: 0; display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 14px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div id="chatRecipientAvatar" style="width: 38px; height: 38px; border-radius: 50%; background: var(--primary-blue); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">AP</div>
                  <div>
                    <h3 id="currentChatRecipient" style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Athlete</h3>
                    <span style="font-size: 11px; color: #10B981; font-weight: 600;">● Online • Assigned Athlete</span>
                  </div>
                </div>
                <button type="button" class="btn-outline-gym" style="padding: 4px 10px; font-size: 11px;" onclick="openDossierModal(currentChatEmail)">View Dossier</button>
              </div>

              <!-- Chat Message Scroll Box -->
              <div id="chatMessagesBox" style="flex: 1; overflow-y: auto; max-height: 340px; display: flex; flex-direction: column; gap: 10px; padding: 10px; background: #F8FAFC; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 14px;">
                <div class="chat-bubble-received">
                  Coach, here is my updated training log for today! Felt strong on my working sets.
                </div>
                <div class="chat-bubble-sent">
                  Great work! Keep the rest intervals under 90 seconds and prioritize sleep recovery tonight.
                </div>
              </div>

              <!-- Message Input Box -->
              <form onsubmit="handleSendTrainerMessage(event)" style="display: flex; gap: 8px;">
                <input type="text" id="trainerChatInput" placeholder="Type coaching instructions or feedback..." style="flex: 1; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 13px; outline: none;">
                <button type="submit" class="btn-primary-block" style="width: auto; padding: 10px 20px;">
                  <i data-lucide="send" style="width: 15px; height: 15px;"></i>
                </button>
              </form>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 8: NOTIFICATIONS -->
        <!-- ===================================================================== -->
        <section id="view-notifications" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Notifications & Activity Center</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Real-time alerts regarding PR milestones and session bookings.</p>
            </div>
          </div>

          <div class="fs-card" id="trainerNotificationsList">
            <!-- Dynamically populated -->
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 9: SETTINGS -->
        <!-- ===================================================================== -->
        <section id="view-settings" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Coach Profile & Account Settings</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Manage your professional coaching bio, certifications, and rates.</p>
            </div>
          </div>

          <div class="fs-card" style="max-width: 640px;">
            <form onsubmit="handleSaveCoachSettings(event)">
              <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Full Name</label>
                <input type="text" id="settingsCoachName" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" required>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Professional Title</label>
                  <input type="text" id="settingsCoachTitle" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" required>
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Experience</label>
                  <input type="text" id="settingsCoachExp" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Hourly Consultation Rate</label>
                  <input type="text" id="settingsCoachRate" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Phone Contact</label>
                  <input type="text" id="settingsCoachPhone" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
                </div>
              </div>

              <div style="margin-bottom: 18px;">
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Specializations (comma separated)</label>
                <input type="text" id="settingsCoachSpecialties" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
              </div>

              <button type="submit" class="btn-primary-block" style="width: 100%;">Save Coach Profile Changes</button>
            </form>
          </div>
        </section>

      </main>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- MODAL 1: ATHLETE DOSSIER MODAL -->
  <!-- ===================================================================== -->
  <div id="dossierModal" class="fs-modal-backdrop" onclick="if(event.target===this) closeDossierModal()">
    <div class="fs-modal-content" style="max-width: 620px;">
      <div style="padding: 20px 24px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div id="dossierAvatar" style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-blue); color: #fff; font-weight: 800; font-size: 18px; display: flex; align-items: center; justify-content: center;">AT</div>
          <div>
            <h3 id="dossierName" style="font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 2px;">Athlete Name</h3>
            <span id="dossierTierBadge" class="badge-tier badge-tier-elite">Elite Member</span>
            <span id="dossierEmail" style="font-size: 12px; color: var(--text-secondary); margin-left: 8px;">athlete@fitsync.health</span>
          </div>
        </div>
        <button type="button" onclick="closeDossierModal()" style="background: transparent; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer;">&times;</button>
      </div>

      <div style="padding: 20px 24px;">
        <!-- Athletic Telemetry -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
          <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Body Weight</div>
            <div id="dossierWeight" style="font-size: 18px; font-weight: 800; color: var(--text-main); margin-top: 4px;">74.0 kg</div>
          </div>
          <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Body Fat Est.</div>
            <div id="dossierFat" style="font-size: 18px; font-weight: 800; color: var(--text-main); margin-top: 4px;">14.5%</div>
          </div>
          <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Plan Adherence</div>
            <div id="dossierAdherence" style="font-size: 18px; font-weight: 800; color: #10B981; margin-top: 4px;">96%</div>
          </div>
        </div>

        <!-- Goal & Assignment -->
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 14px; margin-bottom: 18px;">
          <div style="font-size: 12px; font-weight: 700; color: #1E40AF; text-transform: uppercase; margin-bottom: 4px;">Primary Goal</div>
          <div id="dossierGoal" style="font-size: 14px; font-weight: 700; color: #1E3A8A;">Powerlifting & Deadlift Peak</div>
          <div style="font-size: 12px; color: #3B82F6; margin-top: 4px;">Assigned Coach: <strong id="dossierCoach">Coach Raj Malhotra</strong></div>
        </div>

        <!-- Coaching Notes -->
        <div style="margin-bottom: 18px;">
          <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Coaching Observations & Biomechanics</h4>
          <p id="dossierNotes" style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; background: #F8FAFC; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            Metabolic conditioning and 4-day strength split. Torso bracing strictly controlled.
          </p>
        </div>

        <!-- Recent Lifts -->
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Key Lifts & Benchmarks</h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; text-align: center;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Bench Press</span>
              <strong id="dossierBench" style="font-size: 14px; color: var(--text-main);">115 kg</strong>
            </div>
            <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; text-align: center;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Back Squat</span>
              <strong id="dossierSquat" style="font-size: 14px; color: var(--text-main);">155 kg</strong>
            </div>
            <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; text-align: center;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Deadlift</span>
              <strong id="dossierDeadlift" style="font-size: 14px; color: var(--text-main);">205 kg</strong>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn-secondary" onclick="closeDossierModal()">Close</button>
          <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 18px;" onclick="closeDossierModal(); openChatWithMember(currentDossierEmail)">Open Chat Channel</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="js/data.js"></script>
  <script>
    // --- Application State ---
    let activeTrainerId = null;
    let rosterFilter = 'my'; // 'my' or 'all'
    let currentChatEmail = null;
    let currentDossierEmail = null;

    // View Switching
    function switchTrainerView(viewId) {
      document.querySelectorAll('.trainer-view-section').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));

      const target = document.getElementById('view-' + viewId);
      if (target) {
        target.classList.add('active');
      }

      const activeLink = document.querySelector(`.sidebar-nav-item[data-view="${viewId}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }

      // Close mobile menu if open
      const nav = document.getElementById('sidebarNav');
      if (nav) nav.classList.remove('open');

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    // Initialize Active Coach
    function initActiveCoach() {
      const store = window.fitSyncStore;
      if (!store) return;
      const trainers = store.getTrainers();
      if (!trainers || trainers.length === 0) return;

      if (!activeTrainerId) {
        activeTrainerId = trainers[0].id;
      }

      // Populate coach switcher dropdown
      const switcher = document.getElementById('activeCoachSwitcher');
      if (switcher) {
        switcher.innerHTML = trainers.map(t => `
          <option value="${t.id}" ${t.id === activeTrainerId ? 'selected' : ''}>${t.name} (${t.title})</option>
        `).join('');
      }

      renderTrainerDashboard();
    }

    function handleCoachSwitch(coachId) {
      activeTrainerId = coachId;
      renderTrainerDashboard();
    }

    function getActiveCoach() {
      const store = window.fitSyncStore;
      if (!store) return null;
      const trainers = store.getTrainers();
      return trainers.find(t => t.id === activeTrainerId) || trainers[0];
    }

    // --- Dynamic Rendering of All Sections ---
    function renderTrainerDashboard() {
      const store = window.fitSyncStore;
      if (!store) return;

      const coach = getActiveCoach();
      if (!coach) return;

      const allMembers = store.getMembers();
      // Filter members assigned to this coach
      const myMembers = allMembers.filter(m => m.assignedCoachId === coach.id || (m.assignedCoachName && m.assignedCoachName.toLowerCase() === coach.name.toLowerCase()));

      // Update Sidebar Coach Info
      const sideName = document.getElementById('sidebarCoachName');
      const sideTitle = document.getElementById('sidebarCoachTitle');
      const sideAvatar = document.getElementById('sidebarCoachAvatar');
      const sideBranch = document.getElementById('sidebarGymBranch');
      const sideBadge = document.getElementById('sidebarBadgeAthletes');

      if (sideName) sideName.innerText = coach.name;
      if (sideTitle) sideTitle.innerText = coach.title;
      if (sideAvatar) sideAvatar.src = coach.avatar || 'assets/images/trainer_raj.jpg';
      if (sideBranch) sideBranch.innerText = coach.gym || 'FitZone Gym, Kothrud';
      if (sideBadge) sideBadge.innerText = myMembers.length;

      // Update Welcome Banner
      const bannerName = document.getElementById('dashCoachWelcomeName');
      const bannerSubtitle = document.getElementById('dashCoachSubtitle');
      if (bannerName) bannerName.innerText = coach.name;
      if (bannerSubtitle) bannerSubtitle.innerText = `Overseeing ${myMembers.length} assigned athletes at ${coach.gym || 'FitZone Gym'}.`;

      // Update Telemetry Cards
      const statAthletes = document.getElementById('trainerStatAthletes');
      const statSessions = document.getElementById('trainerStatSessions');
      const statAdherence = document.getElementById('trainerStatAdherence');
      const statVolume = document.getElementById('trainerStatVolume');

      if (statAthletes) statAthletes.innerText = `${myMembers.length} Athletes`;
      if (statSessions) statSessions.innerText = `${Math.min(myMembers.length, 3)} Scheduled`;
      
      // Calculate average adherence
      let avgAdherence = 92;
      if (myMembers.length > 0) {
        const totalAdh = myMembers.reduce((acc, m) => acc + parseInt(m.adherence || '90', 10), 0);
        avgAdherence = Math.round(totalAdh / myMembers.length);
      }
      if (statAdherence) statAdherence.innerText = `${avgAdherence}%`;
      if (statVolume) statVolume.innerText = `${(myMembers.length * 12800 + 4500).toLocaleString()} kg`;

      // Render Dashboard Today's Coaching Agenda
      const agendaEl = document.getElementById('trainerDashAgendaList');
      if (agendaEl) {
        if (myMembers.length === 0) {
          agendaEl.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
              No sessions scheduled today for ${coach.name}.<br>
              <span style="font-size:11px;">Athletes assigned by Gym Owner will appear here automatically.</span>
            </div>
          `;
        } else {
          const times = ['07:00 AM', '09:30 AM', '04:00 PM', '06:00 PM'];
          agendaEl.innerHTML = myMembers.slice(0, 4).map((m, idx) => `
            <div class="schedule-item">
              <div class="schedule-time-box">
                <div class="time-main">${times[idx % times.length]}</div>
                <div class="time-duration">45 Min</div>
              </div>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                  <strong style="color: var(--text-main); font-size: 14px;">${m.name}</strong>
                  <span class="badge-active">1-on-1 PT</span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">${m.goal} • Target Form Check</div>
              </div>
              <button class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;" onclick="openDossierModal('${m.email}')">Dossier</button>
            </div>
          `).join('');
        }
      }

      // Render Dashboard Checkins Table
      const checkinBody = document.getElementById('trainerDashCheckinsBody');
      if (checkinBody) {
        const displayMembers = myMembers.length > 0 ? myMembers : allMembers;
        checkinBody.innerHTML = displayMembers.slice(0, 4).map(m => `
          <tr>
            <td>
              <div style="font-weight: 600; color: var(--text-main);">${m.name}</div>
              <span style="font-size: 11px; color: var(--text-secondary);">${m.membershipTier || 'Gold'} Member</span>
            </td>
            <td style="font-size: 12px; color: var(--text-muted);">${m.checkInTime || 'Today, 07:15 AM'}</td>
            <td><span class="fs-badge fs-badge-green">Pass Verified</span></td>
          </tr>
        `).join('');
      }

      // Render Dashboard Roster Overview Table
      const rosterBody = document.getElementById('trainerDashRosterBody');
      if (rosterBody) {
        if (myMembers.length === 0) {
          rosterBody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
                No athletes currently assigned to ${coach.name}.<br>
                Open the <a href="gym_owner/index.html" style="color:var(--primary-blue); font-weight:600;">Gym Owner Portal</a> to assign athletes to this coach.
              </td>
            </tr>
          `;
        } else {
          rosterBody.innerHTML = myMembers.map(m => `
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:30px; height:30px; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">
                    ${getInitials(m.name)}
                  </div>
                  <div>
                    <strong style="color: var(--text-main); font-size: 13px;">${m.name}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">${m.email}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge-tier badge-tier-${(m.membershipTier || 'gold').toLowerCase()}">${m.membershipTier || 'Gold'}</span></td>
              <td style="font-size: 12px; color: var(--text-secondary);">${m.goal}</td>
              <td style="font-weight: 600; font-size: 12px;">${m.weight || 65} kg</td>
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-weight: 700; font-size: 12px; color: #10B981;">${m.adherence || '92%'}</span>
                  <div style="flex:1; max-width: 60px; height: 5px; background: #E2E8F0; border-radius: 9999px; overflow: hidden;">
                    <div style="width: ${m.adherence || '92%'}; height: 100%; background: #10B981;"></div>
                  </div>
                </div>
              </td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="btn-outline-gym" style="padding: 4px 8px; font-size: 11px;" onclick="openDossierModal('${m.email}')">Dossier</button>
                  <button type="button" class="btn-outline-gym" style="padding: 4px 8px; font-size: 11px;" onclick="openChatWithMember('${m.email}')">Message</button>
                </div>
              </td>
            </tr>
          `).join('');
        }
      }

      // Render Full Athletes Directory (View 2)
      renderMembersDirectoryView();

      // Render Schedule View
      renderScheduleView();

      // Render Attendance View
      renderAttendanceView();

      // Render Chat Channels
      renderChatChannels();

      // Render Notifications
      renderNotificationsView();

      // Populate Settings View with current coach
      populateSettingsForm(coach);

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Helper: Initials
    function getInitials(name) {
      if (!name) return 'AT';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // --- View 2: Athletes Roster Directory ---
    function setRosterFilter(filter) {
      rosterFilter = filter;
      document.getElementById('btnFilterMyAthletes').classList.toggle('active', filter === 'my');
      document.getElementById('btnFilterAllAthletes').classList.toggle('active', filter === 'all');
      renderMembersDirectoryView();
    }

    function renderMembersDirectoryView() {
      const store = window.fitSyncStore;
      if (!store) return;

      const coach = getActiveCoach();
      const allMembers = store.getMembers();
      const myMembers = allMembers.filter(m => m.assignedCoachId === coach.id || (m.assignedCoachName && m.assignedCoachName.toLowerCase() === coach.name.toLowerCase()));

      const targetList = rosterFilter === 'my' ? myMembers : allMembers;

      const countBadge = document.getElementById('membersCountBadge');
      if (countBadge) {
        countBadge.innerHTML = `<i data-lucide="users" style="width:14px; height:14px;"></i> ${targetList.length} ${rosterFilter === 'my' ? 'Assigned' : 'Facility'} Athletes`;
      }

      const grid = document.getElementById('memberCardsGrid');
      if (!grid) return;

      if (targetList.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: #fff; border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #EFF6FF; color: var(--primary-blue); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
              <i data-lucide="users" style="width: 24px; height: 24px;"></i>
            </div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">No Athletes Found</h3>
            <p style="font-size: 13px; color: var(--text-secondary); max-width: 420px; margin: 0 auto 16px;">
              ${rosterFilter === 'my' ? `No athletes are currently assigned to ${coach.name}. Use the Gym Owner portal to register athletes or switch the filter to 'All Facility Athletes'.` : 'No athletes have been registered yet.'}
            </p>
            <a href="gym_owner/index.html" class="btn-primary-block" style="display:inline-block; width:auto; padding:8px 18px; text-decoration:none;">Open Gym Owner Portal</a>
          </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
      }

      grid.innerHTML = targetList.map(m => {
        const isAssignedToMe = m.assignedCoachId === coach.id || (m.assignedCoachName && m.assignedCoachName.toLowerCase() === coach.name.toLowerCase());
        return `
          <div class="trainer-card member-item-card" data-name="${m.name}" data-goal="${m.goal}" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-blue); color: #fff; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center;">
                  ${getInitials(m.name)}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.name}</h3>
                    <span class="badge-tier badge-tier-${(m.membershipTier || 'gold').toLowerCase()}">${m.membershipTier || 'Gold'}</span>
                  </div>
                  <div style="font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.email}</div>
                </div>
              </div>

              <!-- Coach Assignment Chip -->
              <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; font-size: 11px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-muted);">Assigned Coach:</span>
                <strong style="color:${isAssignedToMe ? 'var(--primary-blue)' : 'var(--text-main)'}; font-weight:700;">
                  ${isAssignedToMe ? '✓ Assigned to You' : (m.assignedCoachName || 'Unassigned')}
                </strong>
              </div>

              <div style="margin-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Goal</div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${m.goal}</div>
              </div>

              <!-- Metrics -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #F8FAFC; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 14px; text-align: center;">
                <div>
                  <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Weight</div>
                  <strong style="font-size: 13px; color: var(--text-main);">${m.weight || 65} kg</strong>
                </div>
                <div>
                  <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Body Fat</div>
                  <strong style="font-size: 13px; color: var(--text-main);">${m.bodyFat || '20%'}</strong>
                </div>
                <div>
                  <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Adherence</div>
                  <strong style="font-size: 13px; color: #10B981;">${m.adherence || '92%'}</strong>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn-outline-gym" style="flex: 1; padding: 8px 10px; font-size: 12px;" onclick="openDossierModal('${m.email}')">View Dossier</button>
              <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 14px; font-size: 12px;" onclick="openChatWithMember('${m.email}')">Message</button>
            </div>
          </div>
        `;
      }).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function filterMemberCards() {
      const q = (document.getElementById('memberFilterInput').value || '').toLowerCase();
      document.querySelectorAll('.member-item-card').forEach(card => {
        const name = (card.getAttribute('data-name') || '').toLowerCase();
        const goal = (card.getAttribute('data-goal') || '').toLowerCase();
        card.style.display = (name.includes(q) || goal.includes(q)) ? 'flex' : 'none';
      });
    }

    // --- View 4: Schedule View ---
    function renderScheduleView() {
      const store = window.fitSyncStore;
      if (!store) return;
      const coach = getActiveCoach();
      const allMembers = store.getMembers();
      const myMembers = allMembers.filter(m => m.assignedCoachId === coach.id || (m.assignedCoachName && m.assignedCoachName.toLowerCase() === coach.name.toLowerCase()));

      const listEl = document.getElementById('trainerScheduleList');
      if (!listEl) return;

      const membersToSchedule = myMembers.length > 0 ? myMembers : allMembers;

      if (membersToSchedule.length === 0) {
        listEl.innerHTML = `<div style="padding:24px; text-align:center; color:var(--text-muted);">No sessions scheduled yet.</div>`;
        return;
      }

      const slots = [
        { time: '07:00 AM - 07:45 AM', type: 'Form Check & Deadlift Peak' },
        { time: '09:30 AM - 10:15 AM', type: 'Hypertrophy Biomechanics Check' },
        { time: '04:00 PM - 04:45 PM', type: 'Nutritional Surplus & Caloric Review' },
        { time: '06:00 PM - 06:45 PM', type: 'Mobility & Hip Hinge Mechanics' }
      ];

      listEl.innerHTML = membersToSchedule.map((m, idx) => {
        const slot = slots[idx % slots.length];
        return `
          <div class="schedule-item">
            <div class="schedule-time-box">
              <div class="time-main">${slot.time.split(' - ')[0]}</div>
              <div class="time-duration">45 Min</div>
            </div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                <strong style="color: var(--text-main); font-size: 14px;">${m.name}</strong>
                <span class="badge-active">Confirmed</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary);">${slot.type} • ${m.goal}</div>
            </div>
            <button class="btn-outline-gym" style="margin-top: 0; padding: 6px 12px; font-size: 11px;" onclick="openDossierModal('${m.email}')">Athlete Dossier</button>
          </div>
        `;
      }).join('');
    }

    function openAddSessionModal() {
      alert('PT booking slot generator activated. Select athlete from dossier to confirm slot.');
    }

    // --- View 5: Attendance View ---
    function renderAttendanceView() {
      const store = window.fitSyncStore;
      if (!store) return;
      const allMembers = store.getMembers();
      const body = document.getElementById('trainerAttendanceTableBody');
      if (!body) return;

      body.innerHTML = allMembers.map((m, idx) => `
        <tr>
          <td>
            <strong>${m.name}</strong>
            <div style="font-size:11px; color:var(--text-muted);">${m.email}</div>
          </td>
          <td>${m.checkInTime || 'Today, 07:15 AM'}</td>
          <td>${m.gym || 'FitZone Gym, Kothrud'}</td>
          <td><span class="fs-badge fs-badge-green"><i data-lucide="check" style="width:12px; height:12px;"></i> Turnstile QR Pass Verified</span></td>
        </tr>
      `).join('');
    }

    // --- View 7: Messages & Chat ---
    function renderChatChannels() {
      const store = window.fitSyncStore;
      if (!store) return;
      const coach = getActiveCoach();
      const allMembers = store.getMembers();
      const myMembers = allMembers.filter(m => m.assignedCoachId === coach.id || (m.assignedCoachName && m.assignedCoachName.toLowerCase() === coach.name.toLowerCase()));
      const displayMembers = myMembers.length > 0 ? myMembers : allMembers;

      const channelList = document.getElementById('trainerChatChannelList');
      if (!channelList) return;

      if (!currentChatEmail && displayMembers.length > 0) {
        currentChatEmail = displayMembers[0].email;
      }

      channelList.innerHTML = displayMembers.map(m => {
        const isSelected = m.email === currentChatEmail;
        return `
          <button type="button" class="channel-btn" onclick="selectChatChannel('${m.email}')" style="display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:8px 10px; border-radius:8px; border:1px solid ${isSelected ? 'var(--primary-blue)' : 'var(--border-color)'}; background:${isSelected ? 'var(--light-blue-bg)' : '#F8FAFC'}; cursor:pointer;">
            <div style="width:32px; height:32px; border-radius:50%; background:var(--primary-blue); color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">
              ${getInitials(m.name)}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:13px; font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.name}</div>
              <div style="font-size:11px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.goal}</div>
            </div>
          </button>
        `;
      }).join('');

      updateActiveChatHeader();
    }

    function selectChatChannel(email) {
      currentChatEmail = email;
      renderChatChannels();
    }

    function openChatWithMember(email) {
      currentChatEmail = email;
      switchTrainerView('messages');
      renderChatChannels();
    }

    function updateActiveChatHeader() {
      const store = window.fitSyncStore;
      if (!store || !currentChatEmail) return;
      const member = store.getMemberByEmail(currentChatEmail);
      if (!member) return;

      const nameEl = document.getElementById('currentChatRecipient');
      const avatarEl = document.getElementById('chatRecipientAvatar');
      if (nameEl) nameEl.innerText = member.name;
      if (avatarEl) avatarEl.innerText = getInitials(member.name);
    }

    function handleSendTrainerMessage(e) {
      e.preventDefault();
      const input = document.getElementById('trainerChatInput');
      const text = input.value.trim();
      if (!text) return;

      const box = document.getElementById('chatMessagesBox');
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble-sent';
      bubble.innerText = text;
      box.appendChild(bubble);
      input.value = '';
      box.scrollTop = box.scrollHeight;

      // Simulated auto-reply from the athlete
      setTimeout(() => {
        const reply = document.createElement('div');
        reply.className = 'chat-bubble-received';
        const store = window.fitSyncStore;
        const member = store ? store.getMemberByEmail(currentChatEmail) : null;
        const memberName = member ? member.name.split(' ')[0] : 'Athlete';
        reply.innerText = `Thanks Coach! I'll apply that coaching cue during tomorrow's session.`;
        box.appendChild(reply);
        box.scrollTop = box.scrollHeight;
      }, 1000);
    }

    // --- View 8: Notifications ---
    function renderNotificationsView() {
      const store = window.fitSyncStore;
      if (!store) return;
      const allMembers = store.getMembers();
      const list = document.getElementById('trainerNotificationsList');
      if (!list) return;

      list.innerHTML = allMembers.map((m, idx) => `
        <div style="display:flex; align-items:flex-start; gap:12px; padding:12px; border-bottom:1px solid var(--border-color);">
          <div style="width:36px; height:36px; border-radius:50%; background:#EFF6FF; color:var(--primary-blue); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <i data-lucide="${idx % 2 === 0 ? 'trophy' : 'calendar'}" style="width:18px; height:18px;"></i>
          </div>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:700; color:var(--text-main);">
              ${idx % 2 === 0 ? `${m.name} logged a new PR in Deadlift!` : `${m.name} completed today's assigned training session.`}
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Plan adherence at ${m.adherence || '92%'} • ${m.checkInTime || 'Today, 07:15 AM'}</div>
          </div>
        </div>
      `).join('');
    }

    // --- View 9: Settings ---
    function populateSettingsForm(coach) {
      if (!coach) return;
      const name = document.getElementById('settingsCoachName');
      const title = document.getElementById('settingsCoachTitle');
      const exp = document.getElementById('settingsCoachExp');
      const rate = document.getElementById('settingsCoachRate');
      const phone = document.getElementById('settingsCoachPhone');
      const specs = document.getElementById('settingsCoachSpecialties');

      if (name) name.value = coach.name || '';
      if (title) title.value = coach.title || '';
      if (exp) exp.value = coach.experience || '4+ Years';
      if (rate) rate.value = coach.hourlyRate || '₹1,500 / hr';
      if (phone) phone.value = coach.phone || '+91 98000 00000';
      if (specs) specs.value = (coach.specialties || []).join(', ');
    }

    function handleSaveCoachSettings(e) {
      e.preventDefault();
      const store = window.fitSyncStore;
      if (!store) return;
      const coach = getActiveCoach();
      if (!coach) return;

      coach.name = document.getElementById('settingsCoachName').value.trim();
      coach.title = document.getElementById('settingsCoachTitle').value.trim();
      coach.experience = document.getElementById('settingsCoachExp').value.trim();
      coach.hourlyRate = document.getElementById('settingsCoachRate').value.trim();
      coach.phone = document.getElementById('settingsCoachPhone').value.trim();
      const specsRaw = document.getElementById('settingsCoachSpecialties').value.trim();
      coach.specialties = specsRaw.split(',').map(s => s.trim()).filter(Boolean);

      store.save();
      initActiveCoach();
      alert('Coach profile updated successfully!');
    }

    // --- Dossier Modal ---
    function openDossierModal(email) {
      const store = window.fitSyncStore;
      if (!store) return;
      const member = store.getMemberByEmail(email) || store.getMembers()[0];
      if (!member) return;

      currentDossierEmail = member.email;

      document.getElementById('dossierName').innerText = member.name;
      document.getElementById('dossierAvatar').innerText = getInitials(member.name);
      document.getElementById('dossierEmail').innerText = member.email;
      document.getElementById('dossierTierBadge').innerText = `${member.membershipTier || 'Gold'} Member`;
      document.getElementById('dossierTierBadge').className = `badge-tier badge-tier-${(member.membershipTier || 'gold').toLowerCase()}`;

      document.getElementById('dossierWeight').innerText = `${member.weight || 65} kg`;
      document.getElementById('dossierFat').innerText = member.bodyFat || '20.0%';
      document.getElementById('dossierAdherence').innerText = member.adherence || '92%';
      document.getElementById('dossierGoal').innerText = member.goal;
      document.getElementById('dossierCoach').innerText = member.assignedCoachName || 'Unassigned';
      document.getElementById('dossierNotes').innerText = member.notes || 'Consistent gym attendance with focused execution.';

      const lifts = member.recentLifts || { bench: '65 kg', squat: '95 kg', deadlift: '120 kg' };
      document.getElementById('dossierBench').innerText = lifts.bench || '65 kg';
      document.getElementById('dossierSquat').innerText = lifts.squat || '95 kg';
      document.getElementById('dossierDeadlift').innerText = lifts.deadlift || '120 kg';

      document.getElementById('dossierModal').style.display = 'flex';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function closeDossierModal() {
      document.getElementById('dossierModal').style.display = 'none';
    }

    // Filter Exercise Cards
    function filterExerciseCards() {
      const q = (document.getElementById('exerciseSearchInput').value || '').toLowerCase();
      document.querySelectorAll('.ex-card').forEach(card => {
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        const muscle = (card.getAttribute('data-muscle') || '').toLowerCase();
        card.style.display = (title.includes(q) || muscle.includes(q)) ? 'block' : 'none';
      });
    }

    // Set Live Date
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      document.getElementById('trainerLiveDate').innerText = new Date().toLocaleDateString('en-US', options);
    } catch(e) {}

    // Listen to changes from Gym Owner portal or storage
    window.addEventListener('fitsync_data_changed', () => {
      initActiveCoach();
    });
    window.addEventListener('storage', () => {
      if (window.fitSyncStore) {
        window.fitSyncStore.state = window.fitSyncStore.load();
        initActiveCoach();
      }
    });

    // Initial Load
    window.addEventListener('DOMContentLoaded', () => {
      initActiveCoach();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  </script>
</body>
</html>
"""

with open('trainer/index.html', 'w', encoding='utf-8') as f:
    f.write(trainer_html)

print("trainer/index.html generated successfully!")
