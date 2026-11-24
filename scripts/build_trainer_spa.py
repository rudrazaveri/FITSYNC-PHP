import os

html = """<!DOCTYPE html>
<html lang="en">
<head>
  <base href="../">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coach Workspace — FitSync AI</title>
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
    .trainer-view-section {
      display: none;
      animation: fadeIn 0.18s ease-in-out;
    }
    .trainer-view-section.active {
      display: block;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .chat-bubble-received {
      background: #F1F5F9;
      color: var(--text-main);
      padding: 10px 14px;
      border-radius: 12px 12px 12px 2px;
      max-width: 75%;
      font-size: 13px;
      line-height: 1.45;
      margin-bottom: 8px;
    }
    .chat-bubble-sent {
      background: var(--primary-blue);
      color: #FFFFFF;
      padding: 10px 14px;
      border-radius: 12px 12px 2px 12px;
      max-width: 75%;
      font-size: 13px;
      line-height: 1.45;
      margin-bottom: 8px;
      margin-left: auto;
    }
  </style>
</head>
<body>

  <!-- Mobile Top Header -->
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

  <!-- Sidebar Overlay for Mobile -->
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="document.getElementById('sidebarNav').classList.remove('open')"></div>

  <!-- Main Application Layout -->
  <div class="app-layout">

    <!-- 1. Left Fixed Navigation Sidebar (245px) -->
    <aside class="sidebar" id="sidebarNav">
      <!-- Logo Branding -->
      <a class="sidebar-brand" href="trainer/" onclick="switchTrainerView('dashboard'); return false;">
        <div class="brand-icon-box">
          <i data-lucide="activity" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="brand-info">
          <h1>FitSync</h1>
          <p>Fitness · Gym · Coach</p>
        </div>
      </a>

      <!-- User Profile Badge -->
      <div class="sidebar-user" title="Coach Profile" onclick="switchTrainerView('settings')" style="cursor: pointer;">
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
          <img src="assets/images/trainer_raj.jpg" class="user-avatar-circle" alt="CR" onerror="this.outerHTML='<div class=\\'user-avatar-circle\\'>CR</div>'">
          <div class="user-meta" style="min-width:0; overflow:hidden;">
            <h4 style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Coach Raj Malhotra</h4>
            <span style="font-size: 11px; color: var(--text-secondary);">Trainer · Certified</span>
          </div>
        </div>
        <a href="./" class="btn-sidebar-user-logout" title="Exit / Switch Portal" onclick="window.location.href='./'; return false;">
          <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
        </a>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav">
        <a class="sidebar-nav-item active" data-view="dashboard" href="javascript:void(0)" onclick="switchTrainerView('dashboard')">
          <i data-lucide="layout-dashboard"></i>
          <span class="nav-label">Dashboard</span>
        </a>
        <a class="sidebar-nav-item" data-view="members" href="javascript:void(0)" onclick="switchTrainerView('members')">
          <i data-lucide="users"></i>
          <span class="nav-label">My Members</span>
          <span class="nav-badge">3</span>
        </a>
        <a class="sidebar-nav-item" data-view="workouts" href="javascript:void(0)" onclick="switchTrainerView('workouts')">
          <i data-lucide="dumbbell"></i>
          <span class="nav-label">Workouts</span>
        </a>
        <a class="sidebar-nav-item" data-view="schedule" href="javascript:void(0)" onclick="switchTrainerView('schedule')">
          <i data-lucide="calendar"></i>
          <span class="nav-label">Schedule</span>
          <span class="nav-badge" style="background:#10B981; color:#fff;">1</span>
        </a>
        <a class="sidebar-nav-item" data-view="attendance" href="javascript:void(0)" onclick="switchTrainerView('attendance')">
          <i data-lucide="clipboard-check"></i>
          <span class="nav-label">Attendance</span>
        </a>
        <a class="sidebar-nav-item" data-view="exercise_library" href="javascript:void(0)" onclick="switchTrainerView('exercise_library')">
          <i data-lucide="book-open"></i>
          <span class="nav-label">Exercise Library</span>
        </a>
        <a class="sidebar-nav-item" data-view="messages" href="javascript:void(0)" onclick="switchTrainerView('messages')">
          <i data-lucide="message-square"></i>
          <span class="nav-label">Messages</span>
        </a>
        <a class="sidebar-nav-item" data-view="notifications" href="javascript:void(0)" onclick="switchTrainerView('notifications')">
          <i data-lucide="bell"></i>
          <span class="nav-label">Notifications</span>
        </a>
        <a class="sidebar-nav-item" data-view="settings" href="javascript:void(0)" onclick="switchTrainerView('settings')">
          <i data-lucide="settings"></i>
          <span class="nav-label">Settings</span>
        </a>
      </nav>

      <!-- Sidebar Footer Badge -->
      <div style="padding: 16px; margin-top: auto; border-top: 1px solid var(--border-color); font-size: 11px; color: var(--text-muted); display:flex; align-items:center; gap:8px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981;"></span>
        <span>FitZone Kothrud Branch</span>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="main-wrapper">
      <main class="dashboard-center">

        <!-- ===================================================================== -->
        <!-- VIEW 1: DASHBOARD -->
        <!-- ===================================================================== -->
        <section id="view-dashboard" class="trainer-view-section active">
          <!-- Welcome Banner -->
          <section class="welcome-banner">
            <div>
              <div class="welcome-date" id="trainerLiveDate">Sunday, 22 Nov 2026</div>
              <h2 class="welcome-heading">Welcome Back, <span class="highlight-name">Coach Raj Malhotra</span>! 👋</h2>
              <p class="welcome-subtitle">Overview of your assigned athletes, daily training sessions, and member adherence.</p>
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
                <div class="stat-value">3 Athletes</div>
                <div class="stat-trend-green">↑ 100% Active Roster</div>
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
                <div class="stat-value">1 Scheduled</div>
                <div class="stat-trend-green">1-on-1 PT Sessions</div>
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
                <div class="stat-value">88%</div>
                <div class="stat-trend-green">↑ +4% vs last week</div>
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
                <div class="stat-value">42,500 kg</div>
                <div class="stat-trend-green">Collective volume</div>
              </div>
            </div>
          </section>

          <!-- Two-Column Dashboard Widgets -->
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

              <div class="schedule-list">
                <div class="schedule-item">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="schedule-time-box">
                      <strong>07:00 AM</strong>
                      <span>Personal Training</span>
                    </div>
                    <div>
                      <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 2px;">Ritika Sharma</h4>
                      <p style="font-size: 11px; color: var(--text-secondary);">FitZone Kothrud • Hypertrophy Surplus Review</p>
                    </div>
                  </div>
                  <button type="button" class="btn-outline-gym" style="margin-top:0; padding:5px 10px; font-size:11px;" onclick="openDossierModal('ritika')">Dossier</button>
                </div>
              </div>
            </div>

            <!-- Member Adherence Feed -->
            <div class="fs-card" style="margin-bottom: 0;">
              <div class="card-header-row">
                <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="alert-circle" style="width: 18px; height: 18px; color: var(--orange);"></i>
                  Roster Adherence Feed
                </h3>
                <button type="button" class="btn-outline-gym" style="margin-top:0; padding:4px 10px; font-size:11px;" onclick="switchTrainerView('members')">Roster</button>
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">RS</div>
                    <div>
                      <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">Ritika Sharma</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">Intermediate • Hypertrophy</div>
                    </div>
                  </div>
                  <span class="badge-active">Active Today</span>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">IK</div>
                    <div>
                      <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">Isha Kulkarni</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">Advanced • Strength Split</div>
                    </div>
                  </div>
                  <span class="fs-badge fs-badge-green">1d ago</span>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">AP</div>
                    <div>
                      <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">Aarav Patel</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">Elite • Powerlifting</div>
                    </div>
                  </div>
                  <span class="fs-badge fs-badge-green">2d ago</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Assigned Athletes Primary Roster Table -->
          <div class="fs-card">
            <div class="card-header-row">
              <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="users" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
                Assigned Athletes Roster
              </h3>
              <button type="button" class="btn-outline-gym" style="margin-top:0; padding:5px 12px; font-size:12px;" onclick="switchTrainerView('members')">Full Directory (3)</button>
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
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">RS</div>
                        <div>
                          <strong style="color: var(--text-main); display: block;">Ritika Sharma</strong>
                          <span style="font-size: 11px; color: var(--text-secondary);">ritika@fitsync.health</span>
                        </div>
                      </div>
                    </td>
                    <td><span class="fs-badge fs-badge-blue">Hypertrophy Surplus</span></td>
                    <td><strong>58.5 kg</strong></td>
                    <td><span style="font-size: 12px; color: var(--text-secondary);">Today, 06:45 AM</span></td>
                    <td><span style="font-size: 12px; color: var(--text-secondary);">FitZone Kothrud</span></td>
                    <td><span class="badge-active">Assigned</span></td>
                    <td style="text-align: right;">
                      <button type="button" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;" onclick="openDossierModal('ritika')">View Dossier</button>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">IK</div>
                        <div>
                          <strong style="color: var(--text-main); display: block;">Isha Kulkarni</strong>
                          <span style="font-size: 11px; color: var(--text-secondary);">isha.kulkarni@fitsync.com</span>
                        </div>
                      </div>
                    </td>
                    <td><span class="fs-badge fs-badge-blue">Clean Bulk & Strength</span></td>
                    <td><strong>62.5 kg</strong></td>
                    <td><span style="font-size: 12px; color: var(--text-secondary);">Yesterday</span></td>
                    <td><span style="font-size: 12px; color: var(--text-secondary);">FitZone Kothrud</span></td>
                    <td><span class="badge-active">Assigned</span></td>
                    <td style="text-align: right;">
                      <button type="button" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;" onclick="openDossierModal('isha')">View Dossier</button>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">AP</div>
                        <div>
                          <strong style="color: var(--text-main); display: block;">Aarav Patel</strong>
                          <span style="font-size: 11px; color: var(--text-secondary);">aarav.patel@fitsync.ai</span>
                        </div>
                      </div>
                    </td>
                    <td><span class="fs-badge fs-badge-blue">Deadlift Peak Split</span></td>
                    <td><strong>74.0 kg</strong></td>
                    <td><span style="font-size: 12px; color: var(--text-secondary);">2 days ago</span></td>
                    <td><span style="font-size: 12px; color: var(--text-secondary);">FitSync Prime Arena</span></td>
                    <td><span class="badge-active">Assigned</span></td>
                    <td style="text-align: right;">
                      <button type="button" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;" onclick="openDossierModal('aarav')">View Dossier</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 2: MY MEMBERS -->
        <!-- ===================================================================== -->
        <section id="view-members" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">My Assigned Members</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Oversee active coaching rosters, monitor compliance, and inspect complete athlete dossiers.</p>
            </div>
            <div>
              <span class="fs-badge fs-badge-blue" style="font-size: 13px; padding: 6px 12px;">
                <i data-lucide="users" style="width: 14px; height: 14px;"></i> 3 Active Athletes
              </span>
            </div>
          </div>

          <!-- Search & Filter Controls -->
          <div class="filter-search-bar" style="margin-bottom: 20px;">
            <div class="search-input-box" style="flex: 1; min-width: 260px;">
              <i data-lucide="search"></i>
              <input type="text" id="memberFilterInput" onkeyup="filterMemberCards()" placeholder="Search athletes by name or goal...">
            </div>
          </div>

          <!-- Member Grid -->
          <div class="trainers-grid" id="memberCardsGrid">
            <!-- Member 1: Ritika Sharma -->
            <div class="trainer-card member-item-card" data-name="Ritika Sharma" data-goal="Hypertrophy">
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
                <div class="user-avatar-circle" style="width: 52px; height: 52px; font-size: 16px; background: var(--light-blue-bg); color: var(--primary-blue);">RS</div>
                <div>
                  <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Ritika Sharma</h3>
                  <span class="badge-active">Assigned Athlete</span>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; font-size: 12px; background: #F8FAFC; padding: 10px; border-radius: var(--radius-sm);">
                <div><span style="color:var(--text-secondary);">Weight:</span> <strong>58.5 kg</strong></div>
                <div><span style="color:var(--text-secondary);">Body Fat:</span> <strong>21.2%</strong></div>
                <div><span style="color:var(--text-secondary);">Goal:</span> <strong>Hypertrophy</strong></div>
                <div><span style="color:var(--text-secondary);">Branch:</span> <strong>FitZone Kothrud</strong></div>
              </div>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-outline-gym" style="flex: 1; padding: 8px;" onclick="openDossierModal('ritika')">Open Dossier</button>
                <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 14px;" onclick="openChatWithMember('Ritika Sharma')">Message</button>
              </div>
            </div>

            <!-- Member 2: Isha Kulkarni -->
            <div class="trainer-card member-item-card" data-name="Isha Kulkarni" data-goal="Clean Bulk">
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
                <div class="user-avatar-circle" style="width: 52px; height: 52px; font-size: 16px; background: var(--light-blue-bg); color: var(--primary-blue);">IK</div>
                <div>
                  <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Isha Kulkarni</h3>
                  <span class="badge-active">Assigned Athlete</span>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; font-size: 12px; background: #F8FAFC; padding: 10px; border-radius: var(--radius-sm);">
                <div><span style="color:var(--text-secondary);">Weight:</span> <strong>62.5 kg</strong></div>
                <div><span style="color:var(--text-secondary);">Body Fat:</span> <strong>22.0%</strong></div>
                <div><span style="color:var(--text-secondary);">Goal:</span> <strong>Clean Bulk</strong></div>
                <div><span style="color:var(--text-secondary);">Branch:</span> <strong>FitZone Kothrud</strong></div>
              </div>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-outline-gym" style="flex: 1; padding: 8px;" onclick="openDossierModal('isha')">Open Dossier</button>
                <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 14px;" onclick="openChatWithMember('Isha Kulkarni')">Message</button>
              </div>
            </div>

            <!-- Member 3: Aarav Patel -->
            <div class="trainer-card member-item-card" data-name="Aarav Patel" data-goal="Powerlifting">
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
                <div class="user-avatar-circle" style="width: 52px; height: 52px; font-size: 16px; background: var(--light-blue-bg); color: var(--primary-blue);">AP</div>
                <div>
                  <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Aarav Patel</h3>
                  <span class="badge-active">Assigned Athlete</span>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; font-size: 12px; background: #F8FAFC; padding: 10px; border-radius: var(--radius-sm);">
                <div><span style="color:var(--text-secondary);">Weight:</span> <strong>74.0 kg</strong></div>
                <div><span style="color:var(--text-secondary);">Body Fat:</span> <strong>14.5%</strong></div>
                <div><span style="color:var(--text-secondary);">Goal:</span> <strong>Powerlifting</strong></div>
                <div><span style="color:var(--text-secondary);">Branch:</span> <strong>FitSync Arena</strong></div>
              </div>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-outline-gym" style="flex: 1; padding: 8px;" onclick="openDossierModal('aarav')">Open Dossier</button>
                <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 14px;" onclick="openChatWithMember('Aarav Patel')">Message</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 3: WORKOUT PLANS & PRESCRIPTIONS -->
        <!-- ===================================================================== -->
        <section id="view-workouts" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Workout Plans & Prescriptions</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Design progressive overload splits, assign routines, and review member training logs.</p>
            </div>
            <div>
              <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 16px;" onclick="document.getElementById('newPlanModal').style.display='flex'">
                <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 6px;"></i> Create New Split
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <!-- Plan 1 -->
            <div class="fs-card" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main);">Hypertrophy 4-Day Split</h4>
                <span class="fs-badge fs-badge-blue">Active</span>
              </div>
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">Upper/Lower body split focused on mechanical tension and clean surplus recovery.</p>
              <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; margin-bottom: 14px;">
                <div><strong>Day 1:</strong> Upper Body Push (Bench Press, Incline DB, Shoulder Press)</div>
                <div><strong>Day 2:</strong> Lower Body Quad Focus (Back Squat, Leg Press, Extensions)</div>
                <div><strong>Day 3:</strong> Upper Body Pull (Lat Pulldowns, Barbell Rows, Face Pulls)</div>
                <div><strong>Day 4:</strong> Lower Body Hamstring & Glutes (RDLs, Leg Curls, Calves)</div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-color); font-size: 11px; color: var(--text-muted);">
                <span>Assigned to: Ritika Sharma, Isha Kulkarni</span>
                <span class="badge-active">4 Days/Wk</span>
              </div>
            </div>

            <!-- Plan 2 -->
            <div class="fs-card" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main);">Powerlifting 3-Day Peak</h4>
                <span class="fs-badge fs-badge-green">Heavy Strength</span>
              </div>
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">Linear periodization protocol focusing on Squat, Bench, and Deadlift 1RM strength.</p>
              <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; margin-bottom: 14px;">
                <div><strong>Day 1:</strong> Heavy Squat (5x3 @ 85% 1RM) + Pause Squats</div>
                <div><strong>Day 2:</strong> Heavy Bench Press (5x3 @ 87.5% 1RM) + Close Grip</div>
                <div><strong>Day 3:</strong> Conventional Deadlift (4x2 @ 90% 1RM) + Barbell Rows</div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-color); font-size: 11px; color: var(--text-muted);">
                <span>Assigned to: Aarav Patel</span>
                <span class="badge-active">3 Days/Wk</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 4: SCHEDULE & CALENDAR -->
        <!-- ===================================================================== -->
        <section id="view-schedule" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Training Schedule & Shifts</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Manage weekly booking availability slots and athlete PT sessions.</p>
            </div>
            <div>
              <span class="fs-badge fs-badge-green" style="font-size: 13px; padding: 6px 12px;">
                <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Available for Bookings
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
            <!-- Scheduled Sessions -->
            <div class="fs-card" style="margin-bottom: 0;">
              <h3 class="card-title" style="margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="calendar" style="width: 18px; height: 18px; color: var(--primary-blue);"></i> Upcoming Appointments
              </h3>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="padding: 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: var(--text-main); font-size: 14px;">Ritika Sharma</strong>
                    <div style="font-size: 12px; color: var(--text-secondary);">Personal Training • Hypertrophy Form Review</div>
                    <div style="font-size: 11px; color: var(--primary-blue); margin-top: 4px;"><i data-lucide="clock" style="width: 12px; height: 12px; vertical-align: middle;"></i> Today, 07:00 AM - 08:00 AM</div>
                  </div>
                  <span class="badge-active">Confirmed</span>
                </div>

                <div style="padding: 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: var(--text-main); font-size: 14px;">Isha Kulkarni</strong>
                    <div style="font-size: 12px; color: var(--text-secondary);">Barbell Squat & Hip Mobility Check</div>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;"><i data-lucide="clock" style="width: 12px; height: 12px; vertical-align: middle;"></i> Tomorrow, 08:00 AM - 09:00 AM</div>
                  </div>
                  <span class="badge-active">Confirmed</span>
                </div>

                <div style="padding: 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: var(--text-main); font-size: 14px;">Aarav Patel</strong>
                    <div style="font-size: 12px; color: var(--text-secondary);">Deadlift Setup & Torso Bracing Analysis</div>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;"><i data-lucide="clock" style="width: 12px; height: 12px; vertical-align: middle;"></i> Tue, 06:30 AM - 07:30 AM</div>
                  </div>
                  <span class="fs-badge fs-badge-blue">Scheduled</span>
                </div>
              </div>
            </div>

            <!-- Weekly Working Hours -->
            <div class="fs-card" style="margin-bottom: 0;">
              <h3 class="card-title" style="margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="clock" style="width: 18px; height: 18px; color: var(--orange);"></i> Working Hours & Shift Rules
              </h3>

              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #F8FAFC; border-radius: var(--radius-sm);">
                  <span>Monday – Friday</span>
                  <strong>06:00 AM – 12:00 PM</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #F8FAFC; border-radius: var(--radius-sm);">
                  <span>Saturday</span>
                  <strong>07:00 AM – 01:00 PM</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #FFF5F5; border: 1px solid #FED7D7; border-radius: var(--radius-sm); color: #C53030;">
                  <span>Sunday</span>
                  <strong>Rest Day (Offline)</strong>
                </div>
                <div style="margin-top: 14px; padding: 12px; background: var(--light-blue-bg); border-radius: var(--radius-sm); font-size: 12px; color: var(--primary-blue);">
                  <i data-lucide="info" style="width: 14px; height: 14px; vertical-align: middle;"></i> Shifts synchronize with the turnstile gym gate at FitZone Kothrud.
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 5: ATTENDANCE & TURNSTILE -->
        <!-- ===================================================================== -->
        <section id="view-attendance" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Athlete Turnstile Attendance Log</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Real-time facility check-ins and session timestamps.</p>
            </div>
            <div>
              <span class="fs-badge fs-badge-green" style="font-size: 13px; padding: 6px 12px;">
                <i data-lucide="shield-check" style="width: 14px; height: 14px;"></i> Turnstile Live Sync
              </span>
            </div>
          </div>

          <div class="fs-card">
            <div style="overflow-x: auto;">
              <table class="fs-table">
                <thead>
                  <tr>
                    <th>ATHLETE</th>
                    <th>TIMESTAMP</th>
                    <th>FACILITY BRANCH</th>
                    <th>METHOD</th>
                    <th>VERIFICATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Ritika Sharma</strong></td>
                    <td>Today, 06:42 AM</td>
                    <td>FitZone Kothrud</td>
                    <td>Digital QR Pass</td>
                    <td><span class="badge-active">Verified Check-in</span></td>
                  </tr>
                  <tr>
                    <td><strong>Isha Kulkarni</strong></td>
                    <td>Yesterday, 07:15 AM</td>
                    <td>FitZone Kothrud</td>
                    <td>NFC Gate Reader</td>
                    <td><span class="badge-active">Verified Check-in</span></td>
                  </tr>
                  <tr>
                    <td><strong>Aarav Patel</strong></td>
                    <td>20 Nov 2026, 06:30 AM</td>
                    <td>FitSync Prime Arena</td>
                    <td>Digital QR Pass</td>
                    <td><span class="badge-active">Verified Check-in</span></td>
                  </tr>
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
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Exercise Biomechanics Library</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Anatomically verified movements, kinetic chains, and coaching cues.</p>
            </div>
            <div>
              <span class="fs-badge fs-badge-blue" style="font-size: 13px; padding: 6px 12px;">
                <i data-lucide="book-open" style="width: 14px; height: 14px;"></i> 38 Verified Movements
              </span>
            </div>
          </div>

          <div class="filter-search-bar" style="margin-bottom: 20px;">
            <div class="search-input-box" style="flex: 1;">
              <i data-lucide="search"></i>
              <input type="text" id="exerciseSearchInput" onkeyup="filterExerciseCards()" placeholder="Search exercises by name or muscle group (e.g. Chest, Squat, Deltoids)...">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;" id="exerciseCardsGrid">
            <div class="fs-card ex-card" data-title="Barbell Bench Press" data-muscle="Chest Pectoralis">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Barbell Bench Press</h4>
              <span class="fs-badge fs-badge-blue" style="margin-bottom: 8px;">Chest (Pectoralis Major)</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Retract scapulae, maintain 45° elbow tuck, and drive through the floor.</p>
              <span style="font-size: 11px; color: var(--text-muted);">Compound • Flat Bench</span>
            </div>

            <div class="fs-card ex-card" data-title="Barbell Back Squat" data-muscle="Quadriceps Glutes">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Barbell Back Squat</h4>
              <span class="fs-badge fs-badge-blue" style="margin-bottom: 8px;">Quadriceps & Glutes</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Create intra-abdominal pressure, break at hips and knees simultaneously, depth below parallel.</p>
              <span style="font-size: 11px; color: var(--text-muted);">Compound • Squat Rack</span>
            </div>

            <div class="fs-card ex-card" data-title="Conventional Deadlift" data-muscle="Hamstrings Posterior Chain">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Conventional Deadlift</h4>
              <span class="fs-badge fs-badge-blue" style="margin-bottom: 8px;">Posterior Chain & Lats</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Engage lats to pull slack out of barbell, push floor away through midfoot.</p>
              <span style="font-size: 11px; color: var(--text-muted);">Compound • Olympic Bar</span>
            </div>

            <div class="fs-card ex-card" data-title="Overhead Barbell Press" data-muscle="Shoulders Deltoids">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Overhead Barbell Press</h4>
              <span class="fs-badge fs-badge-blue" style="margin-bottom: 8px;">Anterior Deltoids & Triceps</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Brace core and glutes, press bar vertically close to chin, lock out overhead.</p>
              <span style="font-size: 11px; color: var(--text-muted);">Compound • Standing Barbell</span>
            </div>

            <div class="fs-card ex-card" data-title="Wide-Grip Lat Pulldown" data-muscle="Back Latissimus Dorsi">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Wide-Grip Lat Pulldown</h4>
              <span class="fs-badge fs-badge-blue" style="margin-bottom: 8px;">Latissimus Dorsi</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Drive elbows down and back into front pockets, pause at clavicle height.</p>
              <span style="font-size: 11px; color: var(--text-muted);">Compound • Cable Machine</span>
            </div>

            <div class="fs-card ex-card" data-title="Romanian Deadlift" data-muscle="Hamstrings Glutes">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Romanian Deadlift (RDL)</h4>
              <span class="fs-badge fs-badge-blue" style="margin-bottom: 8px;">Hamstrings & Gluteus Maximus</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Hinge back at the hips with soft knees, feel deep stretch in hamstrings before reversing.</p>
              <span style="font-size: 11px; color: var(--text-muted);">Compound • Dumbbells / Barbell</span>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 7: MESSAGES & ATHLETE QUERIES -->
        <!-- ===================================================================== -->
        <section id="view-messages" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Coach & Athlete Communication</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Direct messaging channel with your assigned athletes.</p>
            </div>
            <div>
              <span class="fs-badge fs-badge-green" style="font-size: 13px; padding: 6px 12px;">
                <i data-lucide="message-square" style="width: 14px; height: 14px;"></i> Direct Messaging Active
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 260px 1fr; gap: 18px;">
            <!-- Channels List -->
            <div class="fs-card" style="margin-bottom: 0; padding: 14px;">
              <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Athletes (3)</h4>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <button type="button" class="channel-btn active" id="btnChatRitika" onclick="selectChatUser('Ritika Sharma', 'RS')" style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--primary-blue); background: var(--light-blue-bg); width: 100%; text-align: left; cursor: pointer;">
                  <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: var(--primary-blue); color: #fff;">RS</div>
                  <div>
                    <strong style="display: block; font-size: 13px; color: var(--text-main);">Ritika Sharma</strong>
                    <span style="font-size: 11px; color: var(--text-secondary);">Active just now</span>
                  </div>
                </button>

                <button type="button" class="channel-btn" id="btnChatIsha" onclick="selectChatUser('Isha Kulkarni', 'IK')" style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: #F8FAFC; width: 100%; text-align: left; cursor: pointer;">
                  <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: #E2E8F0; color: #334155;">IK</div>
                  <div>
                    <strong style="display: block; font-size: 13px; color: var(--text-main);">Isha Kulkarni</strong>
                    <span style="font-size: 11px; color: var(--text-secondary);">Yesterday</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Chat Window -->
            <div class="fs-card" style="margin-bottom: 0; display: flex; flex-direction: column; height: 480px;">
              <div style="padding-bottom: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 15px; color: var(--text-main);" id="currentChatRecipient">Ritika Sharma</strong>
                  <span style="display: block; font-size: 11px; color: #10B981;">Online • FitZone Kothrud</span>
                </div>
                <button type="button" class="btn-outline-gym" style="padding: 4px 10px; font-size: 11px;" onclick="openDossierModal('ritika')">View Dossier</button>
              </div>

              <!-- Messages Stream -->
              <div id="chatMessagesBox" style="flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column;">
                <div class="chat-bubble-received">
                  Hi Coach Raj! I completed today's upper body push workout. My bench press felt very solid with the 45° elbow tuck cue. Should I add 2.5 kg next session?
                </div>
                <div class="chat-bubble-sent">
                  Great work Ritika! Your video analysis showed excellent bar path stability. Yes, progress with +2.5 kg on your first 2 sets next Monday. Keep the surplus clean!
                </div>
              </div>

              <!-- Input Bar -->
              <form onsubmit="handleSendTrainerMessage(event)" style="display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                <input type="text" id="trainerChatInput" placeholder="Type coaching cue or query response..." class="auth-input" style="flex: 1; padding: 10px 14px;" required>
                <button type="submit" class="btn-primary-block" style="width: auto; padding: 10px 18px;">Send</button>
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
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Roster Activity & System Alerts</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Real-time notifications about member workout completions and schedules.</p>
            </div>
          </div>

          <div class="fs-card" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div class="stat-icon-box stat-icon-blue" style="width: 36px; height: 36px;">
                <i data-lucide="check" style="width: 18px; height: 18px;"></i>
              </div>
              <div style="flex: 1;">
                <strong style="color: var(--text-main); font-size: 14px;">Ritika Sharma logged a workout</strong>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 2px 0 0 0;">Upper Body Hypertrophy • 4 exercises, 14 sets, 4,850 kg volume logged.</p>
                <span style="font-size: 11px; color: var(--text-muted);">Today, 06:45 AM</span>
              </div>
            </div>

            <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div class="stat-icon-box stat-icon-pink" style="width: 36px; height: 36px;">
                <i data-lucide="calendar" style="width: 18px; height: 18px;"></i>
              </div>
              <div style="flex: 1;">
                <strong style="color: var(--text-main); font-size: 14px;">Upcoming Session in 15 Minutes</strong>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 2px 0 0 0;">1-on-1 Personal Training with Ritika Sharma at FitZone Kothrud.</p>
                <span style="font-size: 11px; color: var(--text-muted);">Today, 07:00 AM</span>
              </div>
            </div>

            <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div class="stat-icon-box stat-icon-orange" style="width: 36px; height: 36px;">
                <i data-lucide="award" style="width: 18px; height: 18px;"></i>
              </div>
              <div style="flex: 1;">
                <strong style="color: var(--text-main); font-size: 14px;">Aarav Patel achieved a Deadlift PR!</strong>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 2px 0 0 0;">Hit 205 kg x 2 reps on Conventional Deadlift (RPE 9).</p>
                <span style="font-size: 11px; color: var(--text-muted);">2 days ago</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- VIEW 9: SETTINGS & COACH PROFILE -->
        <!-- ===================================================================== -->
        <section id="view-settings" class="trainer-view-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Coach Profile & Credentials</h2>
              <p style="font-size: 13px; color: var(--text-secondary);">Manage professional bio, certifications, and coaching rates.</p>
            </div>
          </div>

          <div class="fs-card">
            <div style="display: flex; align-items: center; gap: 18px; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid var(--border-color);">
              <img src="assets/images/trainer_raj.jpg" class="user-avatar-circle" style="width: 72px; height: 72px;" alt="Coach Raj">
              <div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main);">Coach Raj Malhotra</h3>
                <p style="font-size: 13px; color: var(--text-secondary); margin: 2px 0 6px 0;">CSCS (Certified Strength & Conditioning Specialist) • NSCA Verified</p>
                <div style="display: flex; gap: 8px;">
                  <span class="fs-badge fs-badge-blue">Hypertrophy</span>
                  <span class="fs-badge fs-badge-blue">Powerlifting</span>
                  <span class="badge-active">Verified Coach</span>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Coaching Experience</label>
                <input type="text" class="auth-input" value="8+ Years Professional Coaching" readonly>
              </div>
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Hourly Personal Training Rate</label>
                <input type="text" class="auth-input" value="₹1,500 / hr" readonly>
              </div>
              <div style="grid-column: 1 / -1;">
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Professional Bio</label>
                <textarea class="auth-input" rows="3" readonly style="resize: none;">8+ years coaching national athletes, powerlifters, and gym members toward peak functional strength, biomechanical alignment, and injury-free progressive overload.</textarea>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  </div>

  <!-- ATHLETE DOSSIER MODAL -->
  <div id="dossierModal" class="auth-dashboard-overlay" style="display: none; z-index: 9999;" onclick="if(event.target === this) closeDossierModal()">
    <div class="auth-card-container" style="max-width: 640px; padding: 28px; width: 90%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="user-avatar-circle" id="dossierAvatar" style="width: 44px; height: 44px; font-size: 14px; background: var(--light-blue-bg); color: var(--primary-blue);">RS</div>
          <div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;" id="dossierName">Ritika Sharma</h3>
            <span class="fs-badge fs-badge-blue" id="dossierGoal">Hypertrophy Surplus</span>
          </div>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeDossierModal()" style="font-size: 24px; background: none; border: none; cursor: pointer; color: var(--text-secondary);">&times;</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; background: #F8FAFC; padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 13px;">
        <div><span style="color:var(--text-secondary); display:block; font-size:11px;">Current Weight</span><strong id="dossierWeight">58.5 kg</strong></div>
        <div><span style="color:var(--text-secondary); display:block; font-size:11px;">Body Fat</span><strong id="dossierFat">21.2%</strong></div>
        <div><span style="color:var(--text-secondary); display:block; font-size:11px;">Adherence</span><strong style="color:#10B981;" id="dossierAdherence">94%</strong></div>
      </div>

      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Coaching Notes & Biomechanical Focus</h4>
        <p style="font-size: 13px; color: var(--text-secondary); background: #FFFFFF; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); line-height: 1.5;" id="dossierNotes">
          Focusing on upper body push mechanics, shoulder stability, and clean hypertrophy surplus. Progressing bench press with controlled tempo.
        </p>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button type="button" class="btn-outline-gym" onclick="closeDossierModal()">Close</button>
        <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 18px;" onclick="closeDossierModal(); switchTrainerView('messages')">Send Coach Query</button>
      </div>
    </div>
  </div>

  <!-- INTERACTIVE SCRIPTS -->
  <script>
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

    // Member Dossier Modal
    const dossierData = {
      ritika: {
        name: 'Ritika Sharma',
        avatar: 'RS',
        goal: 'Hypertrophy Surplus',
        weight: '58.5 kg',
        fat: '21.2%',
        adherence: '94%',
        notes: 'Focusing on upper body push mechanics, shoulder stability, and clean hypertrophy surplus. Increased pull-up volume by 2 reps per set.'
      },
      isha: {
        name: 'Isha Kulkarni',
        avatar: 'IK',
        goal: 'Clean Bulk & Strength',
        weight: '62.5 kg',
        fat: '22.0%',
        adherence: '89%',
        notes: 'Hit 62.5 kg bodyweight target with healthy body composition. Checked barbell squat depth and hip hinge mobility.'
      },
      aarav: {
        name: 'Aarav Patel',
        avatar: 'AP',
        goal: 'Powerlifting & Deadlift Peak',
        weight: '74.0 kg',
        fat: '14.5%',
        adherence: '96%',
        notes: 'Metabolic conditioning and 4-day strength split. Torso bracing strictly controlled. Hit 205 kg deadlift PR.'
      }
    };

    function openDossierModal(key) {
      const data = dossierData[key] || dossierData.ritika;
      document.getElementById('dossierName').innerText = data.name;
      document.getElementById('dossierAvatar').innerText = data.avatar;
      document.getElementById('dossierGoal').innerText = data.goal;
      document.getElementById('dossierWeight').innerText = data.weight;
      document.getElementById('dossierFat').innerText = data.fat;
      document.getElementById('dossierAdherence').innerText = data.adherence;
      document.getElementById('dossierNotes').innerText = data.notes;
      document.getElementById('dossierModal').style.display = 'flex';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function closeDossierModal() {
      document.getElementById('dossierModal').style.display = 'none';
    }

    function openChatWithMember(name) {
      switchTrainerView('messages');
      selectChatUser(name, name === 'Ritika Sharma' ? 'RS' : 'IK');
    }

    function selectChatUser(name, avatar) {
      document.getElementById('currentChatRecipient').innerText = name;
      document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.style.background = '#F8FAFC';
        btn.style.borderColor = 'var(--border-color)';
      });
      if (name === 'Ritika Sharma') {
        document.getElementById('btnChatRitika').style.background = 'var(--light-blue-bg)';
        document.getElementById('btnChatRitika').style.borderColor = 'var(--primary-blue)';
      } else {
        document.getElementById('btnChatIsha').style.background = 'var(--light-blue-bg)';
        document.getElementById('btnChatIsha').style.borderColor = 'var(--primary-blue)';
      }
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

      // Simulated coach auto-reply
      setTimeout(() => {
        const reply = document.createElement('div');
        reply.className = 'chat-bubble-received';
        reply.innerText = "Understood Coach! I'll apply that right away.";
        box.appendChild(reply);
        box.scrollTop = box.scrollHeight;
      }, 1000);
    }

    function filterExerciseCards() {
      const q = document.getElementById('exerciseSearchInput').value.toLowerCase();
      document.querySelectorAll('.ex-card').forEach(card => {
        const title = card.getAttribute('data-title').toLowerCase();
        const muscle = card.getAttribute('data-muscle').toLowerCase();
        card.style.display = (title.includes(q) || muscle.includes(q)) ? 'block' : 'none';
      });
    }

    function filterMemberCards() {
      const q = document.getElementById('memberFilterInput').value.toLowerCase();
      document.querySelectorAll('.member-item-card').forEach(card => {
        const name = card.getAttribute('data-name').toLowerCase();
        const goal = card.getAttribute('data-goal').toLowerCase();
        card.style.display = (name.includes(q) || goal.includes(q)) ? 'flex' : 'none';
      });
    }

    // Set Live Date
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      document.getElementById('trainerLiveDate').innerText = new Date().toLocaleDateString('en-US', options);
    } catch(e) {}

    // Init icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  </script>
</body>
</html>
"""

with open('trainer/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated trainer/index.html successfully with full tabbed interactive SPA!")
