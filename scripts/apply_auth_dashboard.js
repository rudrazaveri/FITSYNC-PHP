/**
 * FitSync AI — Auth System & Dashboard Builder
 * Injects:
 * 1. FitSyncStore session methods (login, register, logout, resetDatabase) in js/data.js and fitsync/js/data.js
 * 2. Auth Dashboard styles in css/style.css and fitsync/css/style.css
 * 3. Auth Dashboard Overlay & Data Storage Modal in index.html and fitsync/index.html
 * 4. Auth & Session controller methods in js/app.js and fitsync/js/app.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const fitsyncDir = path.join(rootDir, 'fitsync');

console.log('Building FitSync AI Auth System...');

// =========================================================================
// 1. UPDATE DATA.JS (Root and fitsync)
// =========================================================================
function updateDataJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add isLoggedIn and registeredUsers to DEFAULT_FITSYNC_DATA if not present
  if (!content.includes('registeredUsers:')) {
    const defaultDataTarget = 'const DEFAULT_FITSYNC_DATA = {\n  user: {';
    const defaultDataReplacement = `const DEFAULT_FITSYNC_DATA = {
  isLoggedIn: true,
  registeredUsers: [
    {
      name: "Ritika Sharma",
      email: "ritika@fitsync.health",
      role: "Gym Member",
      tag: "Athlete",
      avatar: "assets/images/isha_avatar.jpg",
      phone: "+91 98765 43210",
      gym: "FitZone Fitness",
      branchLocation: "Alkapuri, Vadodara • 1.2 km",
      goal: "Build Muscle (Hypertrophy Surplus)",
      activityLevel: "Moderately Active (1.55x BMR)",
      gender: "Female",
      age: 24,
      height: 168,
      weight: 58.5
    },
    {
      name: "Isha Kulkarni",
      email: "isha.kulkarni@fitsync.com",
      role: "Gym Member",
      tag: "Athlete",
      avatar: "assets/images/isha_avatar.jpg",
      phone: "+91 98765 43210",
      gym: "FitZone Gym",
      branchLocation: "Kothrud, Pune",
      goal: "Build Muscle",
      activityLevel: "Moderately Active (1.55x BMR)",
      gender: "Female",
      age: 24,
      height: 168,
      weight: 62.5
    },
    {
      name: "Coach Raj Malhotra",
      email: "coach@fitsync.health",
      role: "Gym Trainer",
      tag: "Coach",
      avatar: "assets/images/raj.jpg",
      phone: "+91 98111 22334",
      gym: "FitZone Fitness",
      branchLocation: "Alkapuri, Vadodara",
      goal: "Athletic Strength & Conditioning",
      activityLevel: "Very Active (1.725x BMR)",
      gender: "Male",
      age: 32,
      height: 182,
      weight: 84.0
    },
    {
      name: "Aarav Patel",
      email: "aarav@fitsync.health",
      role: "Gym Member",
      tag: "Athlete",
      avatar: "assets/images/aarav.jpg",
      phone: "+91 98234 56789",
      gym: "PowerHouse Gym",
      branchLocation: "SG Highway, Ahmedabad • 84 km",
      goal: "Fat Loss & Lean Definition",
      activityLevel: "Moderately Active (1.55x BMR)",
      gender: "Male",
      age: 26,
      height: 178,
      weight: 74.0
    }
  ],
  user: {`;
    content = content.replace(defaultDataTarget, defaultDataReplacement);
  }

  // Update FitSyncStore class to include session management methods
  if (!content.includes('login(email, password, remember)')) {
    const loadTarget = `      if (saved) {
        const parsed = JSON.parse(saved);`;
    const loadReplacement = `      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isLoggedIn === undefined) {
          parsed.isLoggedIn = true;
        }
        if (!parsed.registeredUsers || parsed.registeredUsers.length === 0) {
          parsed.registeredUsers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.registeredUsers));
        }`;
    content = content.replace(loadTarget, loadReplacement);

    const storeMethodsTarget = `  saveWorkoutPlan(dayKey, plan) {
    if (!this.state.workoutPlans) {
      this.state.workoutPlans = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.workoutPlans));
    }
    this.state.workoutPlans[dayKey] = plan;
    this.save();
  }`;

    const storeMethodsReplacement = `  saveWorkoutPlan(dayKey, plan) {
    if (!this.state.workoutPlans) {
      this.state.workoutPlans = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.workoutPlans));
    }
    this.state.workoutPlans[dayKey] = plan;
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
      // Auto-register guest email cleanly
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

    content = content.replace(storeMethodsTarget, storeMethodsReplacement);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated data store:', filePath);
}

// =========================================================================
// 2. UPDATE STYLE.CSS (Root and fitsync)
// =========================================================================
const authCss = `
/* ==========================================================================
   FitSync AI — Login & Register Dashboard & Session Styles
   ========================================================================== */

.auth-dashboard-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: radial-gradient(circle at 50% 8%, #0e1e36 0%, #070B14 75%);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 40px 16px 80px;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #F8FAFC;
}

.auth-card-container {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: authFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-card-container.auth-container-wide {
  max-width: 580px;
}

@keyframes authFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.auth-brand-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.auth-logo-badge {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: rgba(16, 185, 129, 0.12);
  border: 1.5px solid #10B981;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.35);
  overflow: hidden;
}

.auth-logo-badge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-brand-title {
  font-size: 32px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -0.6px;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.auth-brand-title .text-blue {
  color: #3B82F6;
}

.auth-brand-subtitle {
  font-size: 13.5px;
  color: #94A3B8;
  max-width: 420px;
  line-height: 1.5;
  margin: 0;
}

.auth-card {
  width: 100%;
  background: rgba(13, 22, 40, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.03);
  padding: 26px 28px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-sizing: border-box;
}

.auth-tabs {
  display: flex;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 22px;
}

.auth-tab-btn {
  flex: 1;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: #94A3B8;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.auth-tab-btn:hover {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.04);
}

.auth-tab-btn.active {
  background: #10B981;
  color: #022C22;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.4);
}

.auth-form-group {
  margin-bottom: 16px;
}

.auth-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.auth-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #CBD5E1;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.auth-label i, .auth-label svg {
  color: #10B981;
  width: 15px;
  height: 15px;
}

.auth-forgot-link {
  font-size: 12px;
  color: #10B981;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s;
}

.auth-forgot-link:hover {
  color: #34D399;
  text-decoration: underline;
}

.auth-input, .auth-select {
  width: 100%;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 11px 14px;
  color: #F8FAFC;
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.auth-input::placeholder {
  color: #64748B;
}

.auth-input:focus, .auth-select:focus {
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  background: rgba(15, 23, 42, 0.95);
}

.auth-select option {
  background: #0D1628;
  color: #F8FAFC;
}

.auth-registered-label {
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 8px;
  margin-top: 14px;
}

.auth-registered-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.auth-account-chip {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 12px;
  color: #E2E8F0;
  font-size: 12.5px;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-account-chip:hover, .auth-account-chip.active {
  border-color: #10B981;
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
}

.auth-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  font-size: 12.5px;
  color: #94A3B8;
}

.auth-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #CBD5E1;
  font-size: 12.5px;
}

.auth-checkbox-label input {
  accent-color: #10B981;
  cursor: pointer;
}

.auth-quick-fills {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748B;
}

.auth-quick-btn {
  background: transparent;
  border: none;
  color: #10B981;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: inherit;
  transition: color 0.15s;
}

.auth-quick-btn:hover {
  color: #34D399;
  text-decoration: underline;
}

.auth-submit-btn {
  width: 100%;
  background: #10B981;
  color: #022C22;
  font-size: 14.5px;
  font-weight: 700;
  padding: 13px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transition: all 0.2s ease;
  margin-bottom: 16px;
  font-family: inherit;
}

.auth-submit-btn:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45);
}

.auth-banner {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}

.auth-banner-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.auth-banner-icon {
  color: #10B981;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.auth-banner strong {
  color: #F8FAFC;
  font-size: 13px;
  font-weight: 700;
  display: block;
}

.auth-banner p {
  color: #94A3B8;
  font-size: 12px;
  line-height: 1.4;
  margin: 2px 0 0;
}

.auth-banner-close {
  background: transparent;
  border: none;
  color: #94A3B8;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
}

.auth-banner-close:hover {
  color: #FFFFFF;
}

.auth-card-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-auth-reset-db {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #F87171;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-auth-reset-db:hover {
  background: rgba(239, 68, 68, 0.16);
  color: #FCA5A5;
}

.auth-data-storage-link {
  color: #10B981;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: color 0.15s;
}

.auth-data-storage-link:hover {
  color: #34D399;
  text-decoration: underline;
}

/* Register Specific Roles, Steps, and Gyms */
.auth-step-title {
  color: #CBD5E1;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin: 18px 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.auth-step-title i, .auth-step-title svg {
  color: #10B981;
  width: 14px;
  height: 14px;
}

.auth-role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.auth-role-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.auth-role-card.active {
  border-color: #10B981;
  background: rgba(16, 185, 129, 0.08);
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.2);
}

.auth-role-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.auth-role-info strong {
  display: block;
  font-size: 13.5px;
  color: #F8FAFC;
}

.auth-role-info span {
  display: block;
  font-size: 11.5px;
  color: #94A3B8;
  margin-top: 2px;
}

.auth-gym-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.auth-gym-card.active {
  border-color: #10B981;
  background: rgba(16, 185, 129, 0.08);
}

.auth-gym-info strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: #F8FAFC;
}

.auth-gym-rating {
  color: #10B981;
  font-size: 12px;
  font-weight: 700;
}

.auth-gym-info span {
  display: block;
  font-size: 11.5px;
  color: #94A3B8;
  margin-top: 2px;
}

.auth-gym-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.2s;
}

.auth-gym-card.active .auth-gym-check {
  border-color: #10B981;
  background: #10B981;
  color: #022C22;
}

/* 1-Click Demo Grid */
.auth-demo-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.auth-demo-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-demo-card:hover {
  border-color: #10B981;
  background: rgba(16, 185, 129, 0.08);
  transform: translateY(-1px);
}

.auth-demo-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-demo-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-demo-info strong {
  display: block;
  font-size: 13.5px;
  color: #F8FAFC;
}

.auth-demo-info span {
  display: block;
  font-size: 11.5px;
  color: #94A3B8;
  margin-top: 2px;
}

.auth-demo-arrow {
  color: #10B981;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Sidebar Logout Styles */
.btn-sidebar-logout {
  color: #EF4444 !important;
  transition: all 0.2s ease !important;
}

.btn-sidebar-logout:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #DC2626 !important;
}

.btn-sidebar-user-logout {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-sidebar-user-logout:hover {
  color: #EF4444;
  background: rgba(239, 68, 68, 0.1);
}

.btn-settings-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #EF4444;
  color: #EF4444;
  background: rgba(239, 68, 68, 0.08);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-settings-logout:hover {
  background: #EF4444;
  color: #FFFFFF;
}

.btn-settings-reset {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  background: #FFFFFF;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-settings-reset:hover {
  background: var(--light-blue-bg);
  color: var(--primary-blue);
  border-color: var(--light-blue);
}
`;

function updateStyleCss(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('.auth-dashboard-overlay')) {
    content += '\n' + authCss;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Appended auth CSS to:', filePath);
  } else {
    console.log('Auth CSS already present in:', filePath);
  }
}

// =========================================================================
// 3. HTML OVERLAY MARKUP FOR INDEX.HTML
// =========================================================================
const authOverlayHtml = `
  <!-- ====================================================================
       AUTHENTICATION & ONBOARDING DASHBOARD OVERLAY
       Exact Match to User Reference Designs
       ==================================================================== -->
  <div id="authDashboardOverlay" class="auth-dashboard-overlay" style="display: none;">
    <div class="auth-card-container" id="authCardContainer">
      
      <!-- Glowing Logo & Header Branding -->
      <div class="auth-brand-header">
        <div class="auth-logo-badge">
          <img src="assets/images/logo.jpg" alt="FitSync AI Logo" onerror="this.outerHTML='<i data-lucide=\\'activity\\' style=\\'color:#10B981; width:28px; height:28px;\\'></i>'">
        </div>
        <h1 class="auth-brand-title">FitSync <span class="text-blue">AI</span></h1>
        <p class="auth-brand-subtitle">Personalized fitness intelligence for Gym Athletes and Certified Strength Trainers.</p>
      </div>

      <!-- Main Auth Card -->
      <div class="auth-card">
        
        <!-- Segmented Tab Navigation -->
        <div class="auth-tabs">
          <button type="button" class="auth-tab-btn active" id="authTabBtnSignIn" onclick="switchAuthTab('signin')">
            Sign In
          </button>
          <button type="button" class="auth-tab-btn" id="authTabBtnRegister" onclick="switchAuthTab('register')">
            Register (New)
          </button>
          <button type="button" class="auth-tab-btn" id="authTabBtnDemo" onclick="switchAuthTab('demo')">
            ⚡ 1-Click Demo
          </button>
        </div>

        <!-- -------------------------------------------------------------
             PANE 1: SIGN IN FORM
             ------------------------------------------------------------- -->
        <div id="authSignInPane">
          <form id="authSignInForm" onsubmit="handleSignInSubmit(event)">
            
            <div class="auth-form-group">
              <label class="auth-label">
                <i data-lucide="mail"></i> Email Address
              </label>
              <input type="email" id="authEmailInput" class="auth-input" placeholder="e.g. athlete@fitsync.health or coach@fitsync.health" value="ritika@fitsync.health" required>
            </div>

            <div class="auth-form-group">
              <div class="auth-label-row">
                <label class="auth-label">
                  <i data-lucide="key"></i> Password
                </label>
                <a href="javascript:void(0)" onclick="handleForgotPassword()" class="auth-forgot-link">Forgot Password?</a>
              </div>
              <input type="password" id="authPasswordInput" class="auth-input" placeholder="••••••••" value="password123" required>
            </div>

            <!-- Registered Accounts on this Device -->
            <div class="auth-registered-label">Registered accounts on this device:</div>
            <div class="auth-registered-chips" id="registeredAccountsList">
              <button type="button" class="auth-account-chip active" onclick="quickSelectAccount('ritika@fitsync.health')">
                <i data-lucide="user" style="width:13px; height:13px;"></i> ritika (Athlete)
              </button>
              <button type="button" class="auth-account-chip" onclick="quickSelectAccount('coach@fitsync.health')">
                <i data-lucide="award" style="width:13px; height:13px;"></i> coach (Trainer)
              </button>
              <button type="button" class="auth-account-chip" onclick="quickSelectAccount('isha.kulkarni@fitsync.com')">
                <i data-lucide="user" style="width:13px; height:13px;"></i> isha (Athlete)
              </button>
            </div>

            <!-- Checkbox and Quick Fill Options -->
            <div class="auth-meta-row">
              <label class="auth-checkbox-label">
                <input type="checkbox" id="authStaySignedIn" checked> Stay signed in
              </label>
              <div class="auth-quick-fills">
                <button type="button" class="auth-quick-btn" onclick="quickFillAccount('athlete')">⚡ Athlete Fill</button>
                <span>•</span>
                <button type="button" class="auth-quick-btn" onclick="quickFillAccount('coach')">🏆 Coach Fill</button>
              </div>
            </div>

            <!-- Primary Sign In Button -->
            <button type="submit" class="auth-submit-btn">
              Sign In to FitSync <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
            </button>
          </form>
        </div>

        <!-- -------------------------------------------------------------
             PANE 2: REGISTER (NEW) FORM
             ------------------------------------------------------------- -->
        <div id="authRegisterPane" style="display: none;">
          <form id="authRegisterForm" onsubmit="handleRegisterSubmit(event)">
            
            <!-- SELECT FITSYNC ROLE -->
            <div class="auth-step-title">
              <i data-lucide="shield-check"></i> SELECT YOUR FITSYNC ROLE
            </div>
            <div class="auth-role-grid">
              <div class="auth-role-card active" id="roleCardMember" onclick="selectRegisterRole('member')">
                <div class="auth-role-icon">🏃</div>
                <div class="auth-role-info">
                  <strong>Gym Member</strong>
                  <span>Workout & nutrition athlete</span>
                </div>
              </div>
              <div class="auth-role-card" id="roleCardTrainer" onclick="selectRegisterRole('trainer')">
                <div class="auth-role-icon">🏋️</div>
                <div class="auth-role-info">
                  <strong>Gym Trainer</strong>
                  <span>Coach assigned athletes</span>
                </div>
              </div>
            </div>
            <input type="hidden" id="regRoleInput" value="member">

            <!-- STEP 1: PERSONAL ACCOUNT DETAILS -->
            <div class="auth-step-title">
              <i data-lucide="user"></i> STEP 1: PERSONAL ACCOUNT DETAILS
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label class="auth-label">Full Name *</label>
                <input type="text" id="regFullName" class="auth-input" placeholder="e.g. Rohan Sharma" required>
              </div>
              <div>
                <label class="auth-label">Email Address *</label>
                <input type="email" id="regEmail" class="auth-input" placeholder="rohan@example.com" required>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label class="auth-label">Mobile Number *</label>
                <input type="tel" id="regPhone" class="auth-input" placeholder="+91 98765 43210" value="+91 98765 43210" required>
              </div>
              <div>
                <label class="auth-label">Profile Picture URL (Optional)</label>
                <input type="url" id="regAvatarUrl" class="auth-input" placeholder="https://... (or leave blank)">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
              <div>
                <label class="auth-label">Password *</label>
                <input type="password" id="regPassword" class="auth-input" placeholder="At least 6 characters" required minlength="6">
              </div>
              <div>
                <label class="auth-label">Confirm Password *</label>
                <input type="password" id="regConfirmPassword" class="auth-input" placeholder="Repeat password" required minlength="6">
              </div>
            </div>

            <!-- STEP 2: MEMBER BIOMETRICS & GOAL -->
            <div class="auth-step-title">
              <i data-lucide="scale"></i> STEP 2: MEMBER BIOMETRICS & GOAL
            </div>
            <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
              <div>
                <label class="auth-label">Gender</label>
                <select id="regGender" class="auth-select">
                  <option value="Male" selected>Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label class="auth-label">Age</label>
                <input type="number" id="regAge" class="auth-input" value="24" min="14" max="95">
              </div>
              <div>
                <label class="auth-label">Height (cm)</label>
                <input type="number" id="regHeight" class="auth-input" value="175" min="100" max="240">
              </div>
              <div>
                <label class="auth-label">Weight (kg)</label>
                <input type="number" id="regWeight" class="auth-input" value="70" step="0.5" min="30" max="250">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
              <div>
                <label class="auth-label">Primary Goal</label>
                <select id="regGoal" class="auth-select">
                  <option value="Build Muscle (Hypertrophy Surplus)" selected>Build Muscle (Hypertrophy Surplus)</option>
                  <option value="Fat Loss & Lean Definition">Fat Loss & Lean Definition</option>
                  <option value="Athletic Strength & Conditioning">Athletic Strength & Conditioning</option>
                  <option value="Endurance & Cardiovascular Health">Endurance & Cardiovascular Health</option>
                  <option value="General Health & Functional Mobility">General Health & Functional Mobility</option>
                </select>
              </div>
              <div>
                <label class="auth-label">Activity Level</label>
                <select id="regActivity" class="auth-select">
                  <option value="Moderately Active (1.55x BMR)" selected>Moderately Active (1.55x BMR)</option>
                  <option value="Sedentary (1.2x BMR)">Sedentary (1.2x BMR)</option>
                  <option value="Lightly Active (1.375x BMR)">Lightly Active (1.375x BMR)</option>
                  <option value="Very Active (1.725x BMR)">Very Active (1.725x BMR)</option>
                  <option value="Extremely Active (1.9x BMR)">Extremely Active (1.9x BMR)</option>
                </select>
              </div>
            </div>

            <!-- STEP 3: SELECT HOME GYM BRANCH -->
            <div class="auth-step-title">
              <i data-lucide="building-2"></i> STEP 3: SELECT HOME GYM BRANCH
            </div>
            <div class="auth-gym-card active" id="gymBranch0" onclick="selectHomeGym('FitZone Fitness', 'Alkapuri, Vadodara • 1.2 km', 0)">
              <div class="auth-gym-info">
                <strong>FitZone Fitness <span class="auth-gym-rating">4.9 ★</span></strong>
                <span>Alkapuri, Vadodara • 1.2 km</span>
              </div>
              <div class="auth-gym-check"><i data-lucide="check" style="width:13px; height:13px;"></i></div>
            </div>

            <div class="auth-gym-card" id="gymBranch1" onclick="selectHomeGym('PowerHouse Gym', 'SG Highway, Ahmedabad • 84 km', 1)">
              <div class="auth-gym-info">
                <strong>PowerHouse Gym <span class="auth-gym-rating">4.8 ★</span></strong>
                <span>SG Highway, Ahmedabad • 84 km</span>
              </div>
              <div class="auth-gym-check"><i data-lucide="check" style="width:13px; height:13px;"></i></div>
            </div>

            <div class="auth-gym-card" id="gymBranch2" onclick="selectHomeGym('Elite Fitness Studio', 'Vesu, Surat • 142 km', 2)">
              <div class="auth-gym-info">
                <strong>Elite Fitness Studio <span class="auth-gym-rating">4.7 ★</span></strong>
                <span>Vesu, Surat • 142 km</span>
              </div>
              <div class="auth-gym-check"><i data-lucide="check" style="width:13px; height:13px;"></i></div>
            </div>
            <input type="hidden" id="regGymBranchInput" value="FitZone Fitness">
            <input type="hidden" id="regGymLocationInput" value="Alkapuri, Vadodara • 1.2 km">

            <!-- Primary Register Button -->
            <button type="submit" class="auth-submit-btn" id="regSubmitBtn" style="margin-top: 14px;">
              Create Athlete Profile & Enter FitSync <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
            </button>
          </form>
        </div>

        <!-- -------------------------------------------------------------
             PANE 3: 1-CLICK DEMO ACCOUNTS
             ------------------------------------------------------------- -->
        <div id="authDemoPane" style="display: none;">
          <div class="auth-step-title" style="margin-top: 0;">
            <i data-lucide="zap"></i> INSTANT ACCESS PROFILES
          </div>
          <div class="auth-demo-grid">
            <div class="auth-demo-card" onclick="loginDemoAccount('ritika')">
              <div class="auth-demo-card-left">
                <img src="assets/images/isha_avatar.jpg" class="auth-demo-avatar" alt="Ritika">
                <div class="auth-demo-info">
                  <strong>Ritika Sharma</strong>
                  <span>Gym Member • 24y Female • 58.5 kg • FitZone</span>
                </div>
              </div>
              <div class="auth-demo-arrow">Enter &rarr;</div>
            </div>

            <div class="auth-demo-card" onclick="loginDemoAccount('isha')">
              <div class="auth-demo-card-left">
                <img src="assets/images/aarav.jpg" class="auth-demo-avatar" alt="Isha">
                <div class="auth-demo-info">
                  <strong>Isha Kulkarni</strong>
                  <span>Member · Premium • 24y Female • 62.5 kg</span>
                </div>
              </div>
              <div class="auth-demo-arrow">Enter &rarr;</div>
            </div>

            <div class="auth-demo-card" onclick="loginDemoAccount('coach')">
              <div class="auth-demo-card-left">
                <img src="assets/images/raj.jpg" class="auth-demo-avatar" alt="Coach Raj">
                <div class="auth-demo-info">
                  <strong>Coach Raj Malhotra</strong>
                  <span>Certified Strength Coach & Trainer</span>
                </div>
              </div>
              <div class="auth-demo-arrow">Enter &rarr;</div>
            </div>

            <div class="auth-demo-card" onclick="loginDemoAccount('aarav')">
              <div class="auth-demo-card-left">
                <img src="assets/images/aarav.jpg" class="auth-demo-avatar" alt="Aarav">
                <div class="auth-demo-info">
                  <strong>Aarav Patel</strong>
                  <span>Gym Member • 26y Male • 74.0 kg • PowerHouse</span>
                </div>
              </div>
              <div class="auth-demo-arrow">Enter &rarr;</div>
            </div>
          </div>
        </div>

        <!-- Shared Clean Database Mode Active Banner -->
        <div class="auth-banner" id="cleanDbBanner">
          <div class="auth-banner-left">
            <i data-lucide="check-circle" class="auth-banner-icon"></i>
            <div>
              <strong>Clean Database Mode Active</strong>
              <p>All pre-defined demo data has been wiped. Register a real Athlete or Coach below to start from scratch.</p>
            </div>
          </div>
          <button type="button" class="auth-banner-close" onclick="dismissCleanBanner()" aria-label="Dismiss">&times;</button>
        </div>

        <!-- Shared Card Footer Actions -->
        <div class="auth-card-footer">
          <button type="button" class="btn-auth-reset-db" onclick="handleResetDatabase()">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> 🧹 Reset Database (Start from Scratch)
          </button>
          <a href="javascript:void(0)" onclick="openDataStorageModal()" class="auth-data-storage-link">
            <i data-lucide="database" style="width: 14px; height: 14px;"></i> Where & How is Data Stored?
          </a>
        </div>

      </div>
    </div>
  </div>
`;

const dataStorageModalHtml = `
  <!-- Modal: Where & How is Data Stored -->
  <div class="modal-overlay" id="dataStorageModal">
    <div class="modal-card" style="max-width: 520px; background: #0D1628; border: 1px solid rgba(255,255,255,0.12); color: #F8FAFC;">
      <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="database" style="color: #10B981;"></i>
          <h4 class="modal-title" style="color: #F8FAFC;">Where & How is Data Stored?</h4>
        </div>
        <button class="modal-close-btn" data-close-modal style="color: #94A3B8;">&times;</button>
      </div>
      <div class="modal-body" style="font-size: 13.5px; line-height: 1.6; color: #CBD5E1;">
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 14px; margin-bottom: 16px;">
          <strong style="color: #10B981; display: flex; align-items: center; gap: 6px;">
            <i data-lucide="shield-check" style="width: 16px; height: 16px;"></i> 100% Private, On-Device Browser Storage
          </strong>
          <p style="margin: 6px 0 0; font-size: 12.5px; color: #94A3B8;">
            FitSync stores all user profiles, custom workout logs, sets, hydration logs, and fitness assessments exclusively in your browser's private LocalStorage sandbox.
          </p>
        </div>

        <ul style="padding-left: 20px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;">
          <li><strong>Zero Cloud Tracking:</strong> No remote servers, No Supabase, No Firebase, and zero telemetry sent to third parties.</li>
          <li><strong>Complete Offline Capability:</strong> The entire application operates completely offline without internet once loaded.</li>
          <li><strong>Instant Zero-Latency:</strong> Logging reps, updating sets, or filling water renders in under 1 millisecond.</li>
          <li><strong>Full User Control:</strong> You can wipe or reset the local database anytime by clicking "Reset Database (Start from Scratch)".</li>
        </ul>

        <div style="font-size: 12px; color: #64748B; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
          Storage Key: <code style="background: rgba(15,23,42,0.8); padding: 2px 6px; border-radius: 4px; color: #10B981;">fitsync_master_platform_v2</code>
        </div>
      </div>
      <div class="modal-footer" style="border-top: 1px solid rgba(255,255,255,0.08);">
        <button class="btn-secondary" data-close-modal style="background: rgba(255,255,255,0.06); color: #FFF; border: none;">Got it</button>
      </div>
    </div>
  </div>
`;

function updateIndexHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Insert authDashboardOverlay right before <div class="app-layout">
  if (!content.includes('id="authDashboardOverlay"')) {
    const appLayoutMarker = '<div class="app-layout">';
    content = content.replace(appLayoutMarker, authOverlayHtml + '\n  ' + appLayoutMarker);
    console.log('Inserted #authDashboardOverlay in:', filePath);
  }

  // 2. Insert Log Out button in .sidebar-bottom if not present
  if (!content.includes('btn-sidebar-logout')) {
    const sidebarBottomTarget = `<button class="sidebar-nav-item" data-nav="help">
          <i data-lucide="help-circle"></i>
          <span class="nav-label">Help & Support</span>
        </button>`;
    const sidebarBottomReplacement = `<button class="sidebar-nav-item" data-nav="help">
          <i data-lucide="help-circle"></i>
          <span class="nav-label">Help & Support</span>
        </button>
        <button class="sidebar-nav-item btn-sidebar-logout" onclick="logoutUser()" title="Log out of FitSync">
          <i data-lucide="log-out"></i>
          <span class="nav-label">Log Out</span>
        </button>`;
    content = content.replace(sidebarBottomTarget, sidebarBottomReplacement);
    console.log('Inserted .btn-sidebar-logout in:', filePath);
  }

  // 3. Update sidebar-user to have dynamic IDs and quick logout button
  if (!content.includes('btn-sidebar-user-logout')) {
    const sidebarUserTarget = `<div class="sidebar-user" onclick="switchView('settings')" title="Click to view Settings & Profile">
        <img src="assets/images/isha_avatar.jpg" class="user-avatar-circle" alt="IK" onerror="this.outerHTML='<div class=\\'user-avatar-circle\\'>IK</div>'">
        <div class="user-meta">
          <h4>Isha Kulkarni</h4>
          <span>Member · Premium</span>
        </div>
      </div>`;
    const sidebarUserReplacement = `<div class="sidebar-user" title="View Settings & Profile">
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0; cursor:pointer;" onclick="switchView('settings')">
          <img src="assets/images/isha_avatar.jpg" id="sidebarAvatarImg" class="user-avatar-circle" alt="IK" onerror="this.outerHTML='<div class=\\'user-avatar-circle\\' id=\\'sidebarAvatarFallback\\'>IK</div>'">
          <div class="user-meta" style="min-width:0; overflow:hidden;">
            <h4 id="sidebarUserName" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Isha Kulkarni</h4>
            <span id="sidebarUserRole">Member · Premium</span>
          </div>
        </div>
        <button type="button" class="btn-sidebar-user-logout" onclick="logoutUser()" title="Log Out">
          <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
        </button>
      </div>`;
    content = content.replace(sidebarUserTarget, sidebarUserReplacement);
    console.log('Updated .sidebar-user with dynamic elements in:', filePath);
  }

  // 4. In view-settings, add Session & Account Security card if not present
  if (!content.includes('settingsSessionUser')) {
    const settingsCardTarget = `<!-- ================================================================
             MODULE 16: HELP & SUPPORT`;
    const sessionCardHtml = `          <div class="fs-card" style="margin-top: 20px; border-color: rgba(239, 68, 68, 0.25); background: linear-gradient(180deg, #ffffff 0%, rgba(254, 242, 242, 0.35) 100%);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div>
                <h3 class="card-title" style="color: #dc2626; display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="shield-alert" style="width: 18px; height: 18px;"></i> Session & Account Security
                </h3>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                  Currently active session: <strong id="settingsSessionUser" style="color: var(--text-main);">Isha Kulkarni</strong> (<span id="settingsSessionEmail">isha.kulkarni@fitsync.com</span>). Data is securely persisted in your local browser sandbox.
                </p>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button type="button" onclick="logoutUser()" class="btn-settings-logout">
                  <i data-lucide="log-out" style="width: 15px; height: 15px;"></i> Log Out
                </button>
                <button type="button" onclick="handleResetDatabase()" class="btn-settings-reset">
                  <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Reset Database
                </button>
              </div>
            </div>
          </div>
        </div>

        ${settingsCardTarget}`;
    content = content.replace(settingsCardTarget, sessionCardHtml);
    console.log('Added session card in view-settings in:', filePath);
  }

  // 5. Add dataStorageModal before </body>
  if (!content.includes('id="dataStorageModal"')) {
    content = content.replace('</body>', dataStorageModalHtml + '\n</body>');
    console.log('Inserted dataStorageModal in:', filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

// =========================================================================
// 4. JAVASCRIPT CONTROLLERS IN JS/APP.JS
// =========================================================================
const authAppJsCode = `
// ==========================================================================
// FitSync AI — Authentication & Session Controller
// ==========================================================================

function initAuthSystem() {
  const store = window.fitSyncStore;
  if (!store) return;

  const authOverlay = document.getElementById('authDashboardOverlay');
  const appLayout = document.querySelector('.app-layout');

  if (!authOverlay) return;

  if (store.state.isLoggedIn === false) {
    // Show Auth Dashboard, hide app layout
    authOverlay.style.display = 'flex';
    if (appLayout) appLayout.style.display = 'none';
    renderRegisteredAccountsChips();
    initIcons();
  } else {
    // Show App Layout, hide auth dashboard
    authOverlay.style.display = 'none';
    if (appLayout) appLayout.style.display = 'flex';
    syncUserProfileUI();
  }
}

function syncUserProfileUI() {
  const user = window.fitSyncStore?.state?.user;
  if (!user) return;

  // Sidebar User Badge
  const sbName = document.getElementById('sidebarUserName');
  const sbRole = document.getElementById('sidebarUserRole');
  const sbAvatar = document.getElementById('sidebarAvatarImg');
  if (sbName) sbName.textContent = user.name;
  if (sbRole) sbRole.textContent = user.role || 'Member · Premium';
  if (sbAvatar && user.avatar) sbAvatar.src = user.avatar;

  // Dashboard Welcome Greeting
  const dashGreeting = document.getElementById('dashboardGreetingName');
  if (dashGreeting) {
    const firstName = user.name.split(' ')[0] || user.name;
    dashGreeting.textContent = firstName;
  }

  // Settings View Fields
  const setFullName = document.getElementById('setFullName');
  const setEmail = document.getElementById('setEmail');
  const setPhone = document.getElementById('setPhone');
  const setAvatar = document.getElementById('settingsAvatarImg');
  const setUserName = document.getElementById('settingsUserName');
  const setSessionUser = document.getElementById('settingsSessionUser');
  const setSessionEmail = document.getElementById('settingsSessionEmail');

  if (setFullName) setFullName.value = user.name;
  if (setEmail) setEmail.value = user.email;
  if (setPhone && user.phone) setPhone.value = user.phone;
  if (setAvatar && user.avatar) setAvatar.src = user.avatar;
  if (setUserName) setUserName.textContent = user.name;
  if (setSessionUser) setSessionUser.textContent = user.name;
  if (setSessionEmail) setSessionEmail.textContent = user.email;
}

function switchAuthTab(tab) {
  const signInBtn = document.getElementById('authTabBtnSignIn');
  const registerBtn = document.getElementById('authTabBtnRegister');
  const demoBtn = document.getElementById('authTabBtnDemo');

  const signInPane = document.getElementById('authSignInPane');
  const registerPane = document.getElementById('authRegisterPane');
  const demoPane = document.getElementById('authDemoPane');
  const container = document.getElementById('authCardContainer');

  [signInBtn, registerBtn, demoBtn].forEach(b => b?.classList.remove('active'));
  if (signInPane) signInPane.style.display = 'none';
  if (registerPane) registerPane.style.display = 'none';
  if (demoPane) demoPane.style.display = 'none';

  if (tab === 'signin') {
    signInBtn?.classList.add('active');
    if (signInPane) signInPane.style.display = 'block';
    container?.classList.remove('auth-container-wide');
  } else if (tab === 'register') {
    registerBtn?.classList.add('active');
    if (registerPane) registerPane.style.display = 'block';
    container?.classList.add('auth-container-wide');
  } else if (tab === 'demo') {
    demoBtn?.classList.add('active');
    if (demoPane) demoPane.style.display = 'block';
    container?.classList.remove('auth-container-wide');
  }
  initIcons();
}

function selectRegisterRole(role) {
  const roleInput = document.getElementById('regRoleInput');
  const memberCard = document.getElementById('roleCardMember');
  const trainerCard = document.getElementById('roleCardTrainer');
  const submitBtn = document.getElementById('regSubmitBtn');

  if (roleInput) roleInput.value = role;

  if (role === 'trainer') {
    trainerCard?.classList.add('active');
    memberCard?.classList.remove('active');
    if (submitBtn) {
      submitBtn.innerHTML = 'Create Trainer Profile & Enter FitSync <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>';
    }
  } else {
    memberCard?.classList.add('active');
    trainerCard?.classList.remove('active');
    if (submitBtn) {
      submitBtn.innerHTML = 'Create Athlete Profile & Enter FitSync <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>';
    }
  }
  initIcons();
}

function selectHomeGym(branchName, location, index) {
  document.getElementById('regGymBranchInput').value = branchName;
  document.getElementById('regGymLocationInput').value = location;
  for (let i = 0; i < 3; i++) {
    const card = document.getElementById(\`gymBranch\${i}\`);
    if (card) {
      if (i === index) card.classList.add('active');
      else card.classList.remove('active');
    }
  }
  initIcons();
}

function renderRegisteredAccountsChips() {
  const list = document.getElementById('registeredAccountsList');
  if (!list) return;

  const users = window.fitSyncStore?.state?.registeredUsers || [];
  if (users.length === 0) {
    list.innerHTML = '<span style="font-size:12px; color:#64748B;">No accounts saved yet. Register below.</span>';
    return;
  }

  list.innerHTML = users.map((u, idx) => {
    const icon = u.role === 'Gym Trainer' ? 'award' : 'user';
    const tag = u.tag || (u.role === 'Gym Trainer' ? 'Trainer' : 'Athlete');
    const shortName = u.name.split(' ')[0].toLowerCase();
    const isActive = idx === 0 ? 'active' : '';
    return \`<button type="button" class="auth-account-chip \${isActive}" onclick="quickSelectAccount('\${u.email}')">
      <i data-lucide="\${icon}" style="width:13px; height:13px;"></i> \${shortName} (\${tag})
    </button>\`;
  }).join('');

  initIcons();
}

function quickSelectAccount(email) {
  const emailInput = document.getElementById('authEmailInput');
  const passwordInput = document.getElementById('authPasswordInput');
  if (emailInput) emailInput.value = email;
  if (passwordInput) passwordInput.value = 'password123';

  // Highlight chip
  document.querySelectorAll('.auth-account-chip').forEach(chip => {
    if (chip.textContent.toLowerCase().includes(email.split('@')[0].split('.')[0].toLowerCase())) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function quickFillAccount(type) {
  if (type === 'athlete') {
    quickSelectAccount('ritika@fitsync.health');
  } else if (type === 'coach') {
    quickSelectAccount('coach@fitsync.health');
  }
}

function handleSignInSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('authEmailInput')?.value;
  const password = document.getElementById('authPasswordInput')?.value;
  const remember = document.getElementById('authStaySignedIn')?.checked;

  if (!email) {
    alert('Please enter your email address.');
    return;
  }

  window.fitSyncStore.login(email, password, remember);
  initAuthSystem();
  updateDashboardUI();
  showNotification(\`Welcome back to FitSync AI, \${window.fitSyncStore.state.user.name}!\`);
}

function handleRegisterSubmit(e) {
  if (e) e.preventDefault();
  const fullName = document.getElementById('regFullName')?.value;
  const email = document.getElementById('regEmail')?.value;
  const phone = document.getElementById('regPhone')?.value;
  const avatarUrl = document.getElementById('regAvatarUrl')?.value;
  const password = document.getElementById('regPassword')?.value;
  const confirmPassword = document.getElementById('regConfirmPassword')?.value;
  const role = document.getElementById('regRoleInput')?.value;
  const gender = document.getElementById('regGender')?.value;
  const age = document.getElementById('regAge')?.value;
  const height = document.getElementById('regHeight')?.value;
  const weight = document.getElementById('regWeight')?.value;
  const goal = document.getElementById('regGoal')?.value;
  const activityLevel = document.getElementById('regActivity')?.value;
  const gymBranch = document.getElementById('regGymBranchInput')?.value;
  const gymLocation = document.getElementById('regGymLocationInput')?.value;

  if (password !== confirmPassword) {
    alert('Passwords do not match. Please verify your password.');
    return;
  }

  window.fitSyncStore.register({
    fullName,
    email,
    phone,
    avatarUrl,
    role,
    gender,
    age,
    height,
    weight,
    goal,
    activityLevel,
    gymBranch,
    gymLocation
  });

  initAuthSystem();
  updateDashboardUI();
  showNotification(\`Profile created! Welcome to FitSync AI, \${fullName}.\`);
}

function loginDemoAccount(key) {
  if (key === 'ritika') {
    window.fitSyncStore.login('ritika@fitsync.health', 'password123');
  } else if (key === 'coach') {
    window.fitSyncStore.login('coach@fitsync.health', 'password123');
  } else if (key === 'aarav') {
    window.fitSyncStore.login('aarav@fitsync.health', 'password123');
  } else {
    window.fitSyncStore.login('isha.kulkarni@fitsync.com', 'password123');
  }
  initAuthSystem();
  updateDashboardUI();
  showNotification(\`Signed in as \${window.fitSyncStore.state.user.name}!\`);
}

function logoutUser() {
  if (confirm('Are you sure you want to log out of FitSync?')) {
    window.fitSyncStore.logout();
    initAuthSystem();
    switchAuthTab('signin');
    showNotification('You have logged out safely.');
  }
}

function handleResetDatabase() {
  if (confirm('Wipe local database and start completely fresh? All custom logs will be cleared.')) {
    window.fitSyncStore.resetDatabase();
    initAuthSystem();
    switchAuthTab('signin');
    const banner = document.getElementById('cleanDbBanner');
    if (banner) banner.style.display = 'flex';
    showNotification('Local database has been wiped. Clean Mode active.');
  }
}

function dismissCleanBanner() {
  const banner = document.getElementById('cleanDbBanner');
  if (banner) banner.style.display = 'none';
}

function handleForgotPassword() {
  alert('Demo Password Reset: All accounts use "password123", or you can 1-Click Demo Sign In anytime!');
}

function openDataStorageModal() {
  openModal('dataStorageModal');
}
`;

function updateAppJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add initAuthSystem() to DOMContentLoaded
  if (!content.includes('initAuthSystem()')) {
    const domLoadedTarget = `  // 1. Initial State Render\n  updateDashboardUI();`;
    const domLoadedReplacement = `  // 1. Check Authentication & Session State\n  initAuthSystem();\n\n  // 1b. Initial State Render\n  updateDashboardUI();`;
    content = content.replace(domLoadedTarget, domLoadedReplacement);
  }

  // Update updateDashboardUI() to also call syncUserProfileUI()
  if (!content.includes('syncUserProfileUI()')) {
    const updateUiTarget = `function updateDashboardUI() {\n  const state = window.fitSyncStore.state;`;
    const updateUiReplacement = `function updateDashboardUI() {\n  const state = window.fitSyncStore.state;\n  syncUserProfileUI();`;
    content = content.replace(updateUiTarget, updateUiReplacement);
  }

  // Append session methods if not present
  if (!content.includes('function initAuthSystem()')) {
    content += '\n' + authAppJsCode;

    // Export window globals
    const exportsTarget = `// Attach global modal openers and module functions to window`;
    const exportsCode = `
// Export Auth Functions
window.initAuthSystem = initAuthSystem;
window.syncUserProfileUI = syncUserProfileUI;
window.switchAuthTab = switchAuthTab;
window.selectRegisterRole = selectRegisterRole;
window.selectHomeGym = selectHomeGym;
window.quickSelectAccount = quickSelectAccount;
window.quickFillAccount = quickFillAccount;
window.handleSignInSubmit = handleSignInSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.loginDemoAccount = loginDemoAccount;
window.logoutUser = logoutUser;
window.handleResetDatabase = handleResetDatabase;
window.dismissCleanBanner = dismissCleanBanner;
window.handleForgotPassword = handleForgotPassword;
window.openDataStorageModal = openDataStorageModal;
`;
    content += exportsCode;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Appended auth controller functions to:', filePath);
  }
}

// Execute updates on root and fitsync directories
console.log('Updating root files...');
updateDataJs(path.join(rootDir, 'js', 'data.js'));
updateStyleCss(path.join(rootDir, 'css', 'style.css'));
updateIndexHtml(path.join(rootDir, 'index.html'));
updateAppJs(path.join(rootDir, 'js', 'app.js'));

console.log('Updating fitsync/ mirror files...');
updateDataJs(path.join(fitsyncDir, 'js', 'data.js'));
updateStyleCss(path.join(fitsyncDir, 'css', 'style.css'));
updateIndexHtml(path.join(fitsyncDir, 'index.html'));
updateAppJs(path.join(fitsyncDir, 'js', 'app.js'));

console.log('All auth dashboard components successfully integrated!');
