import os

gym_owner_html = """<!DOCTYPE html>
<html lang="en">
<head>
  <base href="../">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gym Owner Portal — FitSync AI</title>
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
    .owner-section-tab {
      display: none;
      animation: fadeIn 0.18s ease-in-out;
    }
    .owner-section-tab.active {
      display: block;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    .owner-tab-btn {
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: #FFFFFF;
      color: var(--text-secondary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .owner-tab-btn.active {
      background: var(--primary-blue);
      color: #FFFFFF;
      border-color: var(--primary-blue);
    }
    .btn-delete-item {
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .btn-delete-item:hover {
      background: #EF4444;
      color: #FFFFFF;
    }
    .coach-assign-select {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: #F8FAFC;
      color: var(--text-main);
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>

  <!-- Mobile Top Header -->
  <header class="mobile-top-bar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div class="brand-icon-box" style="width: 32px; height: 32px;">
        <i data-lucide="buildings" style="width: 18px; height: 18px;"></i>
      </div>
      <div>
        <strong style="font-size: 16px; color: var(--text-main);">FitSync Owner</strong>
      </div>
    </div>
    <button class="mobile-menu-btn" id="mobileNavToggle" onclick="document.getElementById('sidebarNav').classList.toggle('open')">
      <i data-lucide="menu" style="width: 24px; height: 24px;"></i>
    </button>
  </header>

  <div class="sidebar-overlay" id="sidebarOverlay" onclick="document.getElementById('sidebarNav').classList.remove('open')"></div>

  <!-- Application Layout -->
  <div class="app-layout">

    <!-- Left Navigation Sidebar -->
    <aside class="sidebar" id="sidebarNav">
      <!-- Logo Branding -->
      <a class="sidebar-brand" href="gym_owner/">
        <div class="brand-icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3);">
          <i data-lucide="building-2" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="brand-info">
          <h1>FitSync Hub</h1>
          <p>Facility Management</p>
        </div>
      </a>

      <!-- Gym Owner Profile Badge -->
      <div class="sidebar-user" title="Gym Owner Profile">
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
          <div class="user-avatar-circle" style="background:#10B981; color:#fff; font-size:13px; font-weight:700;">VS</div>
          <div class="user-meta" style="min-width:0; overflow:hidden;">
            <h4 style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Vikram Singhania</h4>
            <span style="font-size: 11px; color: #10B981; font-weight: 600;">Facility Owner</span>
          </div>
        </div>
        <a href="./" class="btn-sidebar-user-logout" title="Exit to Member Portal">
          <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
        </a>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav">
        <a class="sidebar-nav-item active" data-tab="coaches" href="javascript:void(0)" onclick="switchOwnerTab('coaches')">
          <i data-lucide="award"></i>
          <span class="nav-label">Coaching Staff</span>
          <span class="nav-badge" id="sidebarBadgeCoaches">3</span>
        </a>
        <a class="sidebar-nav-item" data-tab="members" href="javascript:void(0)" onclick="switchOwnerTab('members')">
          <i data-lucide="users"></i>
          <span class="nav-label">Member Roster</span>
          <span class="nav-badge" id="sidebarBadgeMembers">3</span>
        </a>
        <a class="sidebar-nav-item" data-tab="telemetry" href="javascript:void(0)" onclick="switchOwnerTab('telemetry')">
          <i data-lucide="activity"></i>
          <span class="nav-label">Facility Telemetry</span>
        </a>
      </nav>

      <!-- Portal Switcher Links -->
      <div style="margin-top: auto; padding: 16px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700;">Cross-Portal Switcher</span>
        <a href="trainer/" style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); text-decoration: none; padding: 6px 10px; background: #F8FAFC; border-radius: 6px;">
          <i data-lucide="dumbbell" style="width: 14px; height: 14px; color: var(--primary-blue);"></i> View as Trainer
        </a>
        <a href="./" style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); text-decoration: none; padding: 6px 10px; background: #F8FAFC; border-radius: 6px;">
          <i data-lucide="user" style="width: 14px; height: 14px; color: #10B981;"></i> View as Athlete
        </a>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="main-wrapper">
      <main class="dashboard-center">

        <!-- Welcome Banner -->
        <section class="welcome-banner" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);">
          <div>
            <div class="welcome-date"><i data-lucide="map-pin" style="width:12px; height:12px; vertical-align:middle;"></i> FitZone Fitness Hub • Main Sector Branch</div>
            <h2 class="welcome-heading">Welcome, <span class="highlight-name" style="color: #10B981;">Vikram Singhania</span>! 🏢</h2>
            <p class="welcome-subtitle">Authoritative Facility Administration: Register new coaches, onboard athletes, and assign training rosters.</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn-primary-block" style="width: auto; padding: 10px 18px; background: #10B981; border: none;" onclick="openAddCoachModal()">
              <i data-lucide="user-plus" style="width: 15px; height: 15px; margin-right: 6px;"></i> + Add New Coach
            </button>
            <button type="button" class="btn-primary-block" style="width: auto; padding: 10px 18px;" onclick="openAddMemberModal()">
              <i data-lucide="plus-circle" style="width: 15px; height: 15px; margin-right: 6px;"></i> + Add New Athlete
            </button>
          </div>
        </section>

        <!-- 4 Live Facility Telemetry Stat Cards -->
        <section class="stats-grid">
          <div class="fs-card stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-box stat-icon-blue">
                <i data-lucide="users"></i>
              </div>
              <span class="stat-label">Registered Athletes</span>
            </div>
            <div>
              <div class="stat-value" id="statTotalMembers">3 Athletes</div>
              <div class="stat-trend-green">Active facility accounts</div>
            </div>
          </div>

          <div class="fs-card stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3);">
                <i data-lucide="award"></i>
              </div>
              <span class="stat-label">Certified Coaches</span>
            </div>
            <div>
              <div class="stat-value" id="statTotalCoaches">3 Coaches</div>
              <div class="stat-trend-green">100% Verified Credentials</div>
            </div>
          </div>

          <div class="fs-card stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-box stat-icon-orange">
                <i data-lucide="activity"></i>
              </div>
              <span class="stat-label">Facility Capacity</span>
            </div>
            <div>
              <div class="stat-value" id="statFacilityLoad">72% Load</div>
              <div class="stat-trend-green">Optimal turnstile flow</div>
            </div>
          </div>

          <div class="fs-card stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-box stat-icon-pink">
                <i data-lucide="credit-card"></i>
              </div>
              <span class="stat-label">Monthly Active MRR</span>
            </div>
            <div>
              <div class="stat-value" id="statRevenue">₹1,48,500</div>
              <div class="stat-trend-green">Active memberships</div>
            </div>
          </div>
        </section>

        <!-- Secondary Navigation Tabs -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <button type="button" class="owner-tab-btn active" id="btnTabCoaches" onclick="switchOwnerTab('coaches')">
            <i data-lucide="award" style="width: 14px; height: 14px;"></i> Coaches & Trainers Staff
          </button>
          <button type="button" class="owner-tab-btn" id="btnTabMembers" onclick="switchOwnerTab('members')">
            <i data-lucide="users" style="width: 14px; height: 14px;"></i> Registered Athletes & Assignments
          </button>
          <button type="button" class="owner-tab-btn" id="btnTabTelemetry" onclick="switchOwnerTab('telemetry')">
            <i data-lucide="bar-chart-2" style="width: 14px; height: 14px;"></i> Facility Analytics & QR Check-ins
          </button>
        </div>

        <!-- ================================================================
             TAB 1: COACHES STAFF MANAGEMENT
             ================================================================ -->
        <section id="owner-tab-coaches" class="owner-section-tab active">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main);">Certified Coaching Staff</h3>
              <p style="font-size: 12px; color: var(--text-secondary);">Manage trainer profiles, hourly rates, specialties, and assigned member quotas.</p>
            </div>
            <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 16px; background: #10B981; border: none;" onclick="openAddCoachModal()">
              <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 4px;"></i> Add New Coach
            </button>
          </div>

          <!-- Dynamic Coaches Grid -->
          <div class="trainers-grid" id="ownerCoachesGrid">
            <!-- Dynamically populated by renderOwnerCoaches() -->
          </div>
        </section>

        <!-- ================================================================
             TAB 2: REGISTERED MEMBERS & ATHLETES
             ================================================================ -->
        <section id="owner-tab-members" class="owner-section-tab">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main);">Registered Athletes & Coach Assignments</h3>
              <p style="font-size: 12px; color: var(--text-secondary);">Assign, reassign, or register athletes to personal coaches.</p>
            </div>
            <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 16px;" onclick="openAddMemberModal()">
              <i data-lucide="user-plus" style="width: 14px; height: 14px; margin-right: 4px;"></i> Add New Athlete
            </button>
          </div>

          <div class="fs-card">
            <div style="overflow-x: auto;">
              <table class="fs-table">
                <thead>
                  <tr>
                    <th>ATHLETE NAME</th>
                    <th>EMAIL & PHONE</th>
                    <th>GOAL & TIER</th>
                    <th>CURRENT WEIGHT</th>
                    <th>ASSIGNED COACH</th>
                    <th>STATUS</th>
                    <th style="text-align: right;">ACTION</th>
                  </tr>
                </thead>
                <tbody id="ownerMembersTableBody">
                  <!-- Dynamically populated by renderOwnerMembers() -->
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ================================================================
             TAB 3: FACILITY TELEMETRY & TURNSTILE
             ================================================================ -->
        <section id="owner-tab-telemetry" class="owner-section-tab">
          <div class="fs-card" style="margin-bottom: 20px;">
            <div class="card-header-row">
              <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="shield-check" style="width: 18px; height: 18px; color: #10B981;"></i> Turnstile Check-in Pass Logs
              </h3>
              <span class="badge-active">Live Sync</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;" id="ownerCheckinLogs">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <div>
                  <strong style="color: var(--text-main); font-size: 14px;">Ritika Sharma</strong>
                  <span style="display: block; font-size: 12px; color: var(--text-secondary);">Turnstile QR Scanner • Gate A</span>
                </div>
                <div style="text-align: right;">
                  <span class="badge-active">Verified Check-in</span>
                  <span style="display: block; font-size: 11px; color: var(--text-muted); margin-top: 2px;">Today, 06:42 AM</span>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <div>
                  <strong style="color: var(--text-main); font-size: 14px;">Isha Kulkarni</strong>
                  <span style="display: block; font-size: 12px; color: var(--text-secondary);">NFC Facility Card • Gate B</span>
                </div>
                <div style="text-align: right;">
                  <span class="badge-active">Verified Check-in</span>
                  <span style="display: block; font-size: 11px; color: var(--text-muted); margin-top: 2px;">Yesterday, 07:15 AM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  </div>

  <!-- ================================================================
       MODAL 1: ADD NEW COACH / TRAINER
       ================================================================ -->
  <div class="modal-backdrop" id="modalAddCoach" onclick="if(event.target === this) closeAddCoachModal()">
    <div class="auth-card-container" style="max-width: 580px; width: 90%; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="stat-icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10B981; width: 38px; height: 38px;">
            <i data-lucide="award"></i>
          </div>
          <div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Register New Coach</h3>
            <span style="font-size: 12px; color: var(--text-secondary);">Adds coach to FitZone facility roster and enables their portal login</span>
          </div>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeAddCoachModal()" style="font-size: 24px; background: none; border: none; cursor: pointer; color: var(--text-secondary);">&times;</button>
      </div>

      <form onsubmit="handleCreateCoachSubmit(event)">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="auth-form-group">
            <label class="auth-label">Coach Full Name</label>
            <input type="text" id="newCoachName" class="auth-input" placeholder="e.g. Coach David Miller" required>
          </div>
          <div class="auth-form-group">
            <label class="auth-label">Coach Email Address</label>
            <input type="email" id="newCoachEmail" class="auth-input" placeholder="e.g. david@fitsync.health" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="auth-form-group">
            <label class="auth-label">Phone Number</label>
            <input type="text" id="newCoachPhone" class="auth-input" placeholder="+91 98123 45678" value="+91 98">
          </div>
          <div class="auth-form-group">
            <label class="auth-label">Professional Title</label>
            <input type="text" id="newCoachTitle" class="auth-input" placeholder="e.g. Senior Hypertrophy Specialist" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="auth-form-group">
            <label class="auth-label">Coaching Experience</label>
            <input type="text" id="newCoachExperience" class="auth-input" placeholder="e.g. 5+ Years" value="4+ Years">
          </div>
          <div class="auth-form-group">
            <label class="auth-label">Hourly PT Rate</label>
            <input type="text" id="newCoachRate" class="auth-input" placeholder="e.g. ₹1,500 / hr" value="₹1,500 / hr">
          </div>
        </div>

        <div class="auth-form-group" style="margin-bottom: 18px;">
          <label class="auth-label">Specializations (Comma Separated)</label>
          <input type="text" id="newCoachSpecialties" class="auth-input" placeholder="e.g. Hypertrophy, Powerlifting, Functional Mobility" value="Hypertrophy, Strength Conditioning">
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn-secondary" onclick="closeAddCoachModal()">Cancel</button>
          <button type="submit" class="btn-primary-block" style="width: auto; padding: 10px 22px; background: #10B981; border: none;">Save & Activate Coach</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ================================================================
       MODAL 2: ADD NEW ATHLETE / MEMBER
       ================================================================ -->
  <div class="modal-backdrop" id="modalAddMember" onclick="if(event.target === this) closeAddMemberModal()">
    <div class="auth-card-container" style="max-width: 580px; width: 90%; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="stat-icon-box stat-icon-blue" style="width: 38px; height: 38px;">
            <i data-lucide="user-plus"></i>
          </div>
          <div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Register New Athlete</h3>
            <span style="font-size: 12px; color: var(--text-secondary);">Enrolls member into gym branch and assigns dedicated trainer</span>
          </div>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeAddMemberModal()" style="font-size: 24px; background: none; border: none; cursor: pointer; color: var(--text-secondary);">&times;</button>
      </div>

      <form onsubmit="handleCreateMemberSubmit(event)">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="auth-form-group">
            <label class="auth-label">Athlete Full Name</label>
            <input type="text" id="newMemberName" class="auth-input" placeholder="e.g. Rohan Mehta" required>
          </div>
          <div class="auth-form-group">
            <label class="auth-label">Email Address</label>
            <input type="email" id="newMemberEmail" class="auth-input" placeholder="e.g. rohan@fitsync.health" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="auth-form-group">
            <label class="auth-label">Phone Number</label>
            <input type="text" id="newMemberPhone" class="auth-input" placeholder="+91 98765 11000" value="+91 98">
          </div>
          <div class="auth-form-group">
            <label class="auth-label">Gender & Bodyweight (kg)</label>
            <div style="display: flex; gap: 8px;">
              <select id="newMemberGender" class="auth-input" style="flex: 1;">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input type="number" id="newMemberWeight" class="auth-input" placeholder="65" value="68" style="width: 80px;" required>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="auth-form-group">
            <label class="auth-label">Primary Fitness Goal</label>
            <select id="newMemberGoal" class="auth-input">
              <option value="Build Muscle (Hypertrophy Surplus)">Build Muscle (Hypertrophy)</option>
              <option value="Fat Loss & Caloric Deficit">Fat Loss & Leaning</option>
              <option value="Strength & Powerlifting Peak">Strength & Powerlifting</option>
              <option value="Functional Conditioning">Functional Conditioning</option>
            </select>
          </div>
          <div class="auth-form-group">
            <label class="auth-label">Membership Tier</label>
            <select id="newMemberTier" class="auth-input">
              <option value="Gold Pass (Multi-Gym)">Gold Pass (Multi-Gym)</option>
              <option value="VIP Athlete (Unlimited PT)">VIP Athlete (Unlimited PT)</option>
              <option value="Standard Single-Branch">Standard Single-Branch</option>
            </select>
          </div>
        </div>

        <!-- DYNAMIC COACH ASSIGNMENT SELECTOR -->
        <div class="auth-form-group" style="margin-bottom: 20px;">
          <label class="auth-label">Assign Personal Coach</label>
          <select id="newMemberCoachSelect" class="auth-input" required>
            <!-- Populated dynamically with all active coaches -->
          </select>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn-secondary" onclick="closeAddMemberModal()">Cancel</button>
          <button type="submit" class="btn-primary-block" style="width: auto; padding: 10px 22px;">Enroll Athlete</button>
        </div>
      </form>
    </div>
  </div>

  <!-- JAVASCRIPT LOGIC & STORE INTEGRATION -->
  <script src="js/data.js"></script>
  <script>
    function switchOwnerTab(tabId) {
      document.querySelectorAll('.owner-section-tab').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.owner-tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.sidebar-nav-item').forEach(link => link.classList.remove('active'));

      const target = document.getElementById('owner-tab-' + tabId);
      if (target) target.classList.add('active');

      const btn = document.getElementById('btnTab' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
      if (btn) btn.classList.add('active');

      const navLink = document.querySelector(`.sidebar-nav-item[data-tab="${tabId}"]`);
      if (navLink) navLink.classList.add('active');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Render Coaches Grid
    function renderOwnerCoaches() {
      const store = window.fitSyncStore;
      if (!store) return;
      const coaches = store.getTrainers();
      const members = store.getMembers();

      const grid = document.getElementById('ownerCoachesGrid');
      if (!grid) return;

      if (coaches.length === 0) {
        grid.innerHTML = `
          <div class="fs-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <p style="color: var(--text-secondary);">No coaches currently on roster. Click "+ Add New Coach" above.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = coaches.map(c => {
        // Count assigned athletes
        const assignedCount = members.filter(m => m.assignedCoachId === c.id || (m.assignedCoachName && m.assignedCoachName.includes(c.name))).length;

        return `
          <div class="trainer-card" style="text-align: left; position: relative;">
            <button type="button" class="btn-delete-item" style="position: absolute; top: 14px; right: 14px;" onclick="handleDeleteCoach('${c.id}')" title="Delete Coach">
              <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Delete
            </button>
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
              <img src="${c.avatar || 'assets/images/trainer_raj.jpg'}" class="trainer-avatar-img" style="margin: 0; width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" alt="${c.name}">
              <div>
                <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${c.name}</h4>
                <span class="fs-badge fs-badge-blue">${c.experience} Experience</span>
              </div>
            </div>
            <p style="font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">${c.title}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
              <i data-lucide="mail" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${c.email || 'coach@fitsync.health'}<br>
              <i data-lucide="phone" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${c.phone || '+91 98111 22334'}
            </p>
            <div style="display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap;">
              ${(c.specialties || []).map(s => `<span class="tag-badge">${s}</span>`).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-color); font-size: 12px;">
              <span style="color: var(--text-secondary);">Assigned Athletes: <strong style="color:var(--primary-blue);">${assignedCount}</strong></span>
              <strong style="color: #10B981;">${c.hourlyRate || '₹1,500 / hr'}</strong>
            </div>
          </div>
        `;
      }).join('');

      updateOwnerStats();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Render Members Table
    function renderOwnerMembers() {
      const store = window.fitSyncStore;
      if (!store) return;
      const members = store.getMembers();
      const coaches = store.getTrainers();

      const tbody = document.getElementById('ownerMembersTableBody');
      if (!tbody) return;

      if (members.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-secondary);">
              No members enrolled yet. Click "+ Add New Athlete" to add one.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = members.map(m => {
        // Coach options dropdown
        const coachOptions = coaches.map(c => `
          <option value="${c.id}" ${(m.assignedCoachId === c.id || (m.assignedCoachName && m.assignedCoachName.includes(c.name))) ? 'selected' : ''}>${c.name}</option>
        `).join('');

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
                  ${m.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <strong style="color: var(--text-main);">${m.name}</strong>
                  <span style="display: block; font-size: 11px; color: var(--text-secondary);">${m.gender || 'Athlete'} • ${m.age || 24}y</span>
                </div>
              </div>
            </td>
            <td>
              <span style="font-size: 12px; color: var(--text-main); display: block;">${m.email}</span>
              <span style="font-size: 11px; color: var(--text-muted);">${m.phone || '+91 98765 00000'}</span>
            </td>
            <td>
              <span class="fs-badge fs-badge-blue" style="margin-bottom: 2px;">${m.goal || 'Hypertrophy'}</span>
              <span style="display: block; font-size: 11px; color: var(--text-secondary);">${m.membershipTier || 'Gold Pass'}</span>
            </td>
            <td>
              <strong>${m.weight || 60} kg</strong>
            </td>
            <td>
              <select class="coach-assign-select" onchange="handleReassignCoach('${m.email}', this.value)">
                ${coachOptions}
              </select>
            </td>
            <td>
              <span class="badge-active">Active</span>
            </td>
            <td style="text-align: right;">
              <button type="button" class="btn-delete-item" onclick="handleDeleteMember('${m.email}')" title="Remove Member">
                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      updateOwnerStats();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Populate Coach dropdown in Add Member modal
    function populateCoachSelector() {
      const store = window.fitSyncStore;
      if (!store) return;
      const coaches = store.getTrainers();
      const select = document.getElementById('newMemberCoachSelect');
      if (select) {
        select.innerHTML = coaches.map(c => `
          <option value="${c.id}">${c.name} (${c.title} • ${c.experience})</option>
        `).join('');
      }
    }

    function updateOwnerStats() {
      const store = window.fitSyncStore;
      if (!store) return;
      const coaches = store.getTrainers();
      const members = store.getMembers();

      document.getElementById('statTotalMembers').innerText = `${members.length} Athletes`;
      document.getElementById('statTotalCoaches').innerText = `${coaches.length} Coaches`;
      document.getElementById('sidebarBadgeCoaches').innerText = coaches.length;
      document.getElementById('sidebarBadgeMembers').innerText = members.length;
      document.getElementById('statRevenue').innerText = `₹${(members.length * 49500).toLocaleString('en-IN')}`;
    }

    // Handlers: Add Coach
    function openAddCoachModal() {
      document.getElementById('modalAddCoach').style.display = 'flex';
    }
    function closeAddCoachModal() {
      document.getElementById('modalAddCoach').style.display = 'none';
    }

    function handleCreateCoachSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('newCoachName').value.trim();
      const email = document.getElementById('newCoachEmail').value.trim();
      const phone = document.getElementById('newCoachPhone').value.trim();
      const title = document.getElementById('newCoachTitle').value.trim();
      const experience = document.getElementById('newCoachExperience').value.trim();
      const hourlyRate = document.getElementById('newCoachRate').value.trim();
      const specialties = document.getElementById('newCoachSpecialties').value.trim();

      const store = window.fitSyncStore;
      if (!store) return;

      store.addTrainer({
        name,
        email,
        phone,
        title,
        experience,
        hourlyRate,
        specialties
      });

      closeAddCoachModal();
      renderOwnerCoaches();
      populateCoachSelector();
      alert(`Coach ${name} successfully registered into FitZone staff!`);
    }

    // Handlers: Add Member
    function openAddMemberModal() {
      populateCoachSelector();
      document.getElementById('modalAddMember').style.display = 'flex';
    }
    function closeAddMemberModal() {
      document.getElementById('modalAddMember').style.display = 'none';
    }

    function handleCreateMemberSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('newMemberName').value.trim();
      const email = document.getElementById('newMemberEmail').value.trim();
      const phone = document.getElementById('newMemberPhone').value.trim();
      const gender = document.getElementById('newMemberGender').value;
      const weight = document.getElementById('newMemberWeight').value;
      const goal = document.getElementById('newMemberGoal').value;
      const membershipTier = document.getElementById('newMemberTier').value;
      const coachSelect = document.getElementById('newMemberCoachSelect');
      const assignedCoachId = coachSelect.value;
      const assignedCoachName = coachSelect.options[coachSelect.selectedIndex].text.split('(')[0].trim();

      const store = window.fitSyncStore;
      if (!store) return;

      store.addMember({
        name,
        email,
        phone,
        gender,
        weight,
        goal,
        membershipTier,
        assignedCoachId,
        assignedCoachName
      });

      closeAddMemberModal();
      renderOwnerMembers();
      renderOwnerCoaches();
      alert(`Athlete ${name} successfully registered and assigned to ${assignedCoachName}!`);
    }

    function handleReassignCoach(memberEmail, coachId) {
      const store = window.fitSyncStore;
      if (!store) return;
      store.assignCoach(memberEmail, coachId);
      renderOwnerCoaches();
    }

    function handleDeleteCoach(coachId) {
      if (!confirm('Are you sure you want to remove this coach?')) return;
      window.fitSyncStore.deleteTrainer(coachId);
      renderOwnerCoaches();
      renderOwnerMembers();
    }

    function handleDeleteMember(email) {
      if (!confirm(`Are you sure you want to remove athlete (${email})?`)) return;
      window.fitSyncStore.deleteMember(email);
      renderOwnerMembers();
      renderOwnerCoaches();
    }

    // Initial Load
    window.addEventListener('DOMContentLoaded', () => {
      renderOwnerCoaches();
      renderOwnerMembers();
      populateCoachSelector();
    });
  </script>
</body>
</html>
"""

with open('gym_owner/index.html', 'w', encoding='utf-8') as f:
    f.write(gym_owner_html)

print("gym_owner/index.html generated successfully!")
