import os

base_href = "../"

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <base href="{base_href}">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trainer Dashboard — FitSync AI</title>
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
</head>
<body>

  <!-- Mobile Top Header -->
  <header class="mobile-top-bar">
    <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="window.location.href='trainer/'">
      <div class="brand-icon-box" style="width: 32px; height: 32px;">
        <i data-lucide="activity" style="width: 18px; height: 18px;"></i>
      </div>
      <div>
        <strong style="font-size: 16px; color: var(--text-main);">FitSync</strong>
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
      <a class="sidebar-brand" href="trainer/">
        <div class="brand-icon-box">
          <i data-lucide="activity" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="brand-info">
          <h1>FitSync</h1>
          <p>Fitness · Gym · Healthcare</p>
        </div>
      </a>

      <!-- User Profile Badge -->
      <div class="sidebar-user" title="Coach Profile">
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0; cursor:pointer;">
          <img src="assets/images/trainer_raj.jpg" class="user-avatar-circle" alt="CR" onerror="this.outerHTML='<div class=\\'user-avatar-circle\\'>CR</div>'">
          <div class="user-meta" style="min-width:0; overflow:hidden;">
            <h4 style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Coach Raj Malhotra</h4>
            <span style="font-size: 11px; color: var(--text-secondary);">Trainer · Certified</span>
          </div>
        </div>
        <a href="./" class="btn-sidebar-user-logout" title="Exit / Switch Portal">
          <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
        </a>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav">
        <a class="sidebar-nav-item active" href="trainer/">
          <i data-lucide="layout-dashboard"></i>
          <span class="nav-label">Dashboard</span>
        </a>
        <a class="sidebar-nav-item" href="javascript:void(0)" onclick="alert('Roster management is active in the PHP/MySQL backend.')">
          <i data-lucide="users"></i>
          <span class="nav-label">My Members</span>
          <span class="nav-badge">3</span>
        </a>
        <a class="sidebar-nav-item" href="javascript:void(0)" onclick="alert('Workout creator is active in the PHP/MySQL backend.')">
          <i data-lucide="dumbbell"></i>
          <span class="nav-label">Workouts</span>
        </a>
        <a class="sidebar-nav-item" href="javascript:void(0)" onclick="alert('Session calendar is active in the PHP/MySQL backend.')">
          <i data-lucide="calendar"></i>
          <span class="nav-label">Schedule</span>
        </a>
        <a class="sidebar-nav-item" href="javascript:void(0)" onclick="alert('Attendance tracker is active in the PHP/MySQL backend.')">
          <i data-lucide="clipboard-check"></i>
          <span class="nav-label">Attendance</span>
        </a>
        <a class="sidebar-nav-item" href="javascript:void(0)" onclick="alert('Exercise library is active in the PHP/MySQL backend.')">
          <i data-lucide="book-open"></i>
          <span class="nav-label">Exercise Library</span>
        </a>
        <a class="sidebar-nav-item" href="javascript:void(0)" onclick="alert('Messaging system is active in the PHP/MySQL backend.')">
          <i data-lucide="message-square"></i>
          <span class="nav-label">Messages</span>
        </a>
        <a class="sidebar-nav-item" href="javascript:void(0)" onclick="alert('Notification feed is active in the PHP/MySQL backend.')">
          <i data-lucide="bell"></i>
          <span class="nav-label">Notifications</span>
        </a>
        <a class="sidebar-nav-item" href="javascript:void(0)" onclick="alert('Settings panel is active in the PHP/MySQL backend.')">
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

        <!-- 1. Welcome Banner -->
        <section class="welcome-banner">
          <div>
            <div class="welcome-date">Sunday, 22 Nov 2026</div>
            <h2 class="welcome-heading">Welcome Back, <span class="highlight-name">Coach Raj Malhotra</span>! 👋</h2>
            <p class="welcome-subtitle">Overview of your assigned athletes, daily training sessions, and member adherence.</p>
          </div>
          <svg class="banner-star-deco" width="46" height="46" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
          </svg>
        </section>

        <!-- 2. Four Statistics Cards -->
        <section class="stats-grid">
          <div class="fs-card stat-card" style="cursor: pointer;">
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

          <div class="fs-card stat-card" style="cursor: pointer;">
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

          <div class="fs-card stat-card" style="cursor: pointer;">
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

          <div class="fs-card stat-card">
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

        <!-- 3. Two-Column Dashboard Widgets -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 22px;">
          
          <!-- Today's Coaching Agenda -->
          <div class="fs-card" style="margin-bottom: 0;">
            <div class="card-header-row">
              <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="clock" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
                Today's Coaching Agenda
              </h3>
              <span class="badge-active">1 Today</span>
            </div>

            <div class="schedule-list">
              <div class="schedule-item">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div class="schedule-time-box">
                    <strong>07:00 AM</strong>
                    <span>Personal Training</span>
                  </div>
                  <div>
                    <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 2px;">
                      Ritika Sharma
                    </h4>
                    <p style="font-size: 11px; color: var(--text-secondary);">
                      FitZone Kothrud • Upper Body Hypertrophy
                    </p>
                  </div>
                </div>
                <button type="button" class="btn-outline-gym" style="margin-top: 0; padding: 5px 10px; font-size: 11px;" onclick="alert('Viewing Dossier for Ritika Sharma')">
                  Dossier
                </button>
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
              <span style="font-size: 11px; color: var(--text-secondary);">3 Assigned</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
                    RS
                  </div>
                  <div>
                    <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">Ritika Sharma</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">Intermediate • Hypertrophy</div>
                  </div>
                </div>
                <div>
                  <span class="badge-active">Active Today</span>
                </div>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
                    IK
                  </div>
                  <div>
                    <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">Isha Kulkarni</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">Advanced • Strength Split</div>
                  </div>
                </div>
                <div>
                  <span class="fs-badge fs-badge-green">1d ago</span>
                </div>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
                    AP
                  </div>
                  <div>
                    <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">Aarav Patel</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">Elite • Powerlifting</div>
                  </div>
                </div>
                <div>
                  <span class="fs-badge fs-badge-green">2d ago</span>
                </div>
              </div>
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
            <span class="fs-badge fs-badge-blue">3 Verified Athletes</span>
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
                      <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
                        RS
                      </div>
                      <div>
                        <strong style="color: var(--text-main); display: block;">Ritika Sharma</strong>
                        <span style="font-size: 11px; color: var(--text-secondary);">ritika@fitsync.health</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="fs-badge fs-badge-blue">Hypertrophy Surplus</span>
                  </td>
                  <td>
                    <strong>58.5 kg</strong>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">Today, 06:45 AM</span>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">FitZone Kothrud</span>
                  </td>
                  <td>
                    <span class="badge-active">Assigned</span>
                  </td>
                  <td style="text-align: right;">
                    <button type="button" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;" onclick="alert('Viewing Ritika Sharma Profile & Telemetry')">
                      View Dossier
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
                        IK
                      </div>
                      <div>
                        <strong style="color: var(--text-main); display: block;">Isha Kulkarni</strong>
                        <span style="font-size: 11px; color: var(--text-secondary);">isha.kulkarni@fitsync.com</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="fs-badge fs-badge-blue">Clean Bulk & Strength</span>
                  </td>
                  <td>
                    <strong>62.5 kg</strong>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">Yesterday</span>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">FitZone Kothrud</span>
                  </td>
                  <td>
                    <span class="badge-active">Assigned</span>
                  </td>
                  <td style="text-align: right;">
                    <button type="button" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;" onclick="alert('Viewing Isha Kulkarni Profile & Telemetry')">
                      View Dossier
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
                        AP
                      </div>
                      <div>
                        <strong style="color: var(--text-main); display: block;">Aarav Patel</strong>
                        <span style="font-size: 11px; color: var(--text-secondary);">aarav.patel@fitsync.ai</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="fs-badge fs-badge-blue">Powerlifting & Deadlift Peak</span>
                  </td>
                  <td>
                    <strong>74.0 kg</strong>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">2 days ago</span>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">FitSync Prime Arena</span>
                  </td>
                  <td>
                    <span class="badge-active">Assigned</span>
                  </td>
                  <td style="text-align: right;">
                    <button type="button" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;" onclick="alert('Viewing Aarav Patel Profile & Telemetry')">
                      View Dossier
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- Interactive Scripts -->
  <script src="js/trainer.js"></script>
  <script>
    if (typeof lucide !== 'undefined') {{
      lucide.createIcons();
    }}
  </script>
</body>
</html>
"""

with open('trainer/index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("trainer/index.html generated successfully!")
