/**
 * FitSync AI — Comprehensive Logout & Auth Store Fix
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const fitsyncDir = path.join(rootDir, 'fitsync');

console.log('Fixing FitSync logout across JS, HTML, and PHP files...');

// =========================================================================
// 1. FIX JS/DATA.JS (Root & fitsync)
// =========================================================================
function fixDataJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if logout() is inside FitSyncStore
  if (!content.includes('logout() {')) {
    console.log('Injecting auth methods into FitSyncStore in:', filePath);
    
    // Find updateUserProfile inside FitSyncStore
    const target = `  updateUserProfile(profile) {
    this.state.user = { ...this.state.user, ...profile };
    this.save();
  }`;

    const replacement = `  updateUserProfile(profile) {
    this.state.user = { ...this.state.user, ...profile };
    this.save();
  }

  login(email, password, remember = true) {
    if (!this.state.registeredUsers || this.state.registeredUsers.length === 0) {
      this.state.registeredUsers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.registeredUsers));
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = this.state.registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      this.state.user = {
        ...this.state.user,
        name: existing.name,
        email: existing.email,
        phone: existing.phone || this.state.user.phone,
        role: existing.role === 'Gym Trainer' ? 'Trainer · Certified' : 'Member · Premium',
        avatar: existing.avatar || 'assets/images/isha_avatar.jpg',
        gender: existing.gender || 'Female',
        age: existing.age || 24,
        height: \`\${existing.height || 170} cm\`,
        weight: \`\${existing.weight || 65} kg\`,
        fitnessGoal: existing.goal || 'Build Muscle',
        gymBranch: existing.gym ? \`\${existing.gym}\${existing.branchLocation ? ' - ' + existing.branchLocation : ''}\` : this.state.user.gymBranch
      };
      if (existing.weight) {
        this.state.stats.weight.current = parseFloat(existing.weight);
      }
      if (existing.goal) {
        this.state.goal.title = existing.goal;
      }
    } else if (cleanEmail) {
      const namePart = cleanEmail.split('@')[0];
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const newGuest = {
        name: formattedName,
        email: cleanEmail,
        role: "Gym Member",
        tag: "Athlete",
        avatar: "assets/images/isha_avatar.jpg",
        phone: "+91 98765 43210",
        gym: "FitZone Fitness",
        branchLocation: "Alkapuri, Vadodara • 1.2 km",
        goal: "Build Muscle (Hypertrophy Surplus)",
        gender: "Other",
        age: 24,
        height: 172,
        weight: 68.0
      };
      this.state.registeredUsers.push(newGuest);
      this.state.user = {
        ...this.state.user,
        name: newGuest.name,
        email: newGuest.email,
        role: 'Member · Premium',
        gymBranch: \`\${newGuest.gym} - \${newGuest.branchLocation}\`
      };
    }
    this.state.isLoggedIn = true;
    this.save();
    return true;
  }

  register(userData) {
    if (!this.state.registeredUsers) {
      this.state.registeredUsers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.registeredUsers));
    }
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const existingIndex = this.state.registeredUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    const newProfile = {
      name: userData.fullName || "FitSync Athlete",
      email: cleanEmail,
      role: userData.role === 'trainer' ? 'Gym Trainer' : 'Gym Member',
      tag: userData.role === 'trainer' ? 'Coach' : 'Athlete',
      avatar: userData.avatarUrl || (userData.gender === 'Female' ? 'assets/images/isha_avatar.jpg' : 'assets/images/aarav.jpg'),
      phone: userData.phone || '+91 98765 43210',
      gym: userData.gymBranch || 'FitZone Fitness',
      branchLocation: userData.gymLocation || 'Alkapuri, Vadodara • 1.2 km',
      goal: userData.goal || 'Build Muscle (Hypertrophy Surplus)',
      activityLevel: userData.activityLevel || 'Moderately Active (1.55x BMR)',
      gender: userData.gender || 'Male',
      age: parseInt(userData.age, 10) || 24,
      height: parseInt(userData.height, 10) || 175,
      weight: parseFloat(userData.weight) || 70.0
    };

    if (existingIndex >= 0) {
      this.state.registeredUsers[existingIndex] = newProfile;
    } else {
      this.state.registeredUsers.push(newProfile);
    }

    this.state.user = {
      ...this.state.user,
      name: newProfile.name,
      email: newProfile.email,
      phone: newProfile.phone,
      role: newProfile.role === 'Gym Trainer' ? 'Trainer · Certified' : 'Member · Premium',
      avatar: newProfile.avatar,
      gender: newProfile.gender,
      age: newProfile.age,
      height: \`\${newProfile.height} cm\`,
      weight: \`\${newProfile.weight} kg\`,
      fitnessGoal: newProfile.goal,
      gymBranch: \`\${newProfile.gym} - \${newProfile.branchLocation}\`
    };

    if (newProfile.weight) {
      this.state.stats.weight.current = newProfile.weight;
    }
    if (newProfile.goal) {
      this.state.goal.title = newProfile.goal;
    }
    if (this.state.membership) {
      this.state.membership.gymName = newProfile.gym;
    }

    this.state.isLoggedIn = true;
    this.save();
    return true;
  }

  logout() {
    this.state.isLoggedIn = false;
    this.save();
  }

  resetDatabase() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch(e) {}
    this.state = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA));
    this.state.isLoggedIn = false;
    this.save();
  }`;

    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Successfully injected logout() into:', filePath);
    } else {
      console.error('Target not found in:', filePath);
    }
  } else {
    console.log('logout() already present in:', filePath);
  }
}

// =========================================================================
// 2. FIX JS/APP.JS (Root & fitsync)
// =========================================================================
function fixAppJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix logoutUser function to be completely instant, no blocking confirm()
  const oldLogoutRegex = /function logoutUser\(\)\s*\{[\s\S]*?showNotification\('You have logged out safely\.'\);[\s\S]*?\}/;
  const newLogoutCode = `function logoutUser() {
  console.log('Logging out user from FitSync...');
  try {
    if (window.fitSyncStore) {
      if (typeof window.fitSyncStore.logout === 'function') {
        window.fitSyncStore.logout();
      } else if (window.fitSyncStore.state) {
        window.fitSyncStore.state.isLoggedIn = false;
        if (typeof window.fitSyncStore.save === 'function') {
          window.fitSyncStore.save();
        }
      }
    }
  } catch(e) {
    console.warn('Error during logout:', e);
  }

  initAuthSystem();
  switchAuthTab('signin');

  if (typeof showNotification === 'function') {
    showNotification('You have logged out safely. Enter your credentials or use 1-Click Demo.');
  }
}`;

  if (oldLogoutRegex.test(content)) {
    content = content.replace(oldLogoutRegex, newLogoutCode);
    console.log('Replaced logoutUser implementation in:', filePath);
  }

  // Update setupNavigation() to not intercept logout button
  const oldNavLoop = `  // Sidebar navigation items
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-nav');
      if (view) {
        switchView(view);
      }
    });
  });`;

  const newNavLoop = `  // Sidebar navigation items
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    if (item.classList.contains('btn-sidebar-logout') || item.id === 'sidebarLogoutBtn') {
      // Do not bind view routing to logout button
      return;
    }
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-nav');
      if (view) {
        switchView(view);
      }
    });
  });

  // Dedicated direct listeners for logout buttons
  document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoutUser();
  });
  document.getElementById('sidebarUserLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoutUser();
  });
  document.getElementById('settingsLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoutUser();
  });`;

  if (content.includes(oldNavLoop)) {
    content = content.replace(oldNavLoop, newNavLoop);
    console.log('Updated setupNavigation in:', filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

// =========================================================================
// 3. FIX INDEX.HTML (Root & fitsync)
// =========================================================================
function fixIndexHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure sidebar logout has id="sidebarLogoutBtn"
  content = content.replace(
    'class="sidebar-nav-item btn-sidebar-logout"',
    'class="sidebar-nav-item btn-sidebar-logout" id="sidebarLogoutBtn"'
  );

  // Ensure sidebar user logout has id="sidebarUserLogoutBtn"
  content = content.replace(
    'class="btn-sidebar-user-logout"',
    'class="btn-sidebar-user-logout" id="sidebarUserLogoutBtn"'
  );

  // Ensure settings logout has id="settingsLogoutBtn"
  content = content.replace(
    'class="btn-settings-logout"',
    'class="btn-settings-logout" id="settingsLogoutBtn"'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated index.html button IDs in:', filePath);
}

// =========================================================================
// 4. FIX PHP FILES (dashboard.php and includes/navbar.php)
// =========================================================================
function fixPhpFiles() {
  const dashPath = path.join(rootDir, 'dashboard.php');
  if (fs.existsSync(dashPath)) {
    let dash = fs.readFileSync(dashPath, 'utf8');
    // Change auto demo-login to proper redirect if logged out
    const oldAutoLogin = `// Auto demo-login for developer ease if visiting dashboard directly
if (!isLoggedIn()) {
    setCurrentUser([
        'id' => '00000000-0000-0000-0000-000000000001',
        'full_name' => 'Aarav Patel',
        'email' => 'aarav.patel@fitsync.ai',
        'role' => 'member',
        'avatar_url' => asset('assets/aarav.jpg')
    ]);
}`;
    const newAuthCheck = `if (!isLoggedIn()) {
    header('Location: ' . url('login.php'));
    exit;
}`;
    if (dash.includes(oldAutoLogin)) {
      dash = dash.replace(oldAutoLogin, newAuthCheck);
    }

    // Add direct Log Out button in header banner
    const oldBannerBtns = `<a href="<?= url('attendance.php') ?>" class="btn btn-outline-light btn-sm px-3">
          <i class="bi bi-qr-code"></i> Check-in Pass
        </a>`;
    const newBannerBtns = `<a href="<?= url('attendance.php') ?>" class="btn btn-outline-light btn-sm px-3">
          <i class="bi bi-qr-code"></i> Check-in Pass
        </a>
        <a href="<?= url('logout.php') ?>" class="btn btn-outline-danger btn-sm px-3">
          <i class="bi bi-box-arrow-right"></i> Log Out
        </a>`;
    if (dash.includes(oldBannerBtns) && !dash.includes('btn-outline-danger btn-sm px-3')) {
      dash = dash.replace(oldBannerBtns, newBannerBtns);
    }

    fs.writeFileSync(dashPath, dash, 'utf8');
    console.log('Updated dashboard.php with direct logout and auth protection.');
  }

  // Update includes/navbar.php to add a direct Sign Out link next to user dropdown
  const navPath = path.join(rootDir, 'includes', 'navbar.php');
  if (fs.existsSync(navPath)) {
    let nav = fs.readFileSync(navPath, 'utf8');
    const oldDropdownEnd = `            </ul>
          </div>`;
    const newDropdownEnd = `            </ul>
          </div>
          <a href="<?= url('logout.php') ?>" class="btn btn-outline-danger btn-sm d-none d-md-inline-flex align-items-center gap-1" title="Sign Out">
            <i class="bi bi-box-arrow-right"></i> Sign Out
          </a>`;
    if (nav.includes(oldDropdownEnd) && !nav.includes('title="Sign Out"')) {
      nav = nav.replace(oldDropdownEnd, newDropdownEnd);
      fs.writeFileSync(navPath, nav, 'utf8');
      console.log('Updated includes/navbar.php with direct Sign Out button.');
    }
  }
}

// Run all
fixDataJs(path.join(rootDir, 'js', 'data.js'));
fixDataJs(path.join(fitsyncDir, 'js', 'data.js'));

fixAppJs(path.join(rootDir, 'js', 'app.js'));
fixAppJs(path.join(fitsyncDir, 'js', 'app.js'));

fixIndexHtml(path.join(rootDir, 'index.html'));
fixIndexHtml(path.join(fitsyncDir, 'index.html'));

fixPhpFiles();

console.log('All fixes applied successfully!');
