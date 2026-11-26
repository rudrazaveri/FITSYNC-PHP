/**
 * FitSync — Master Application Router & Controller (Vanilla JS)
 * Drives 16 Integrated Modules, Modals, LocalStorage State, and UI Events
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check Server Authentication & Session State
  if (typeof window.fitSyncRefreshSession === 'function') {
    await window.fitSyncRefreshSession();
  }
  const authAllowed = initAuthSystem();
  if (authAllowed === false) return;

  // 1a. Instant Welcome Greeting & Date calculation
  updateWelcomeGreeting(window.fitSyncStore?.state?.user?.name);

  // 1b. Initial State Render
  updateDashboardUI();

  // 1c. Sync Real Database Telemetry when authenticated with Member access
  const hasMemberAccess = window.__AUTHENTICATED_USER__ && (
    typeof window.fitSyncHasPortalAccess === 'function'
      ? window.fitSyncHasPortalAccess(window.__AUTHENTICATED_USER__, 'user')
      : window.__AUTHENTICATED_USER__.role === 'user'
  );
  if (hasMemberAccess) {
    await syncUserDashboardFromDb();
    loadUserProfileData();
    loadMembershipPortalData();
    loadWorkoutPlanFromDb();
    loadAttendanceCalendar();
    renderMealsTimeline();
    renderWaterLogs();
  }

  // 2. Setup Routing & Cross-page navigation
  setupNavigation();

  // 3. Render Charts
  if (window.renderAllCharts) {
    window.renderAllCharts();
  }

  // 4. Initialize Lucide Icons & SVG fallbacks
  initIcons();

  // 5. Setup Event Listeners & Timers
  setupEventListeners();
  setupRestTimer();
  setupAssessmentLiveCalculator();
  initWorkoutPlannerModule();
  setupHeaderRestTimer();
  initExerciseLibraryModule();
  setupMacroAutoCalculation();

  // Initial routing from URL hash if provided
  const initialHash = window.location.hash.replace(/^#/, '');
  if (initialHash && document.getElementById(`view-${initialHash}`)) {
    switchView(initialHash, false);
  }

  // Periodic real-time background synchronization (every 5 seconds + on tab focus/visibility)
  const runLiveMemberSync = () => {
    const canMemberSync = window.__AUTHENTICATED_USER__ && (
      typeof window.fitSyncHasPortalAccess === 'function'
        ? window.fitSyncHasPortalAccess(window.__AUTHENTICATED_USER__, 'user')
        : window.__AUTHENTICATED_USER__.role === 'user'
    );
    if (canMemberSync) {
      syncUserDashboardFromDb();
      loadMembershipPortalData();
    }
  };
  setInterval(runLiveMemberSync, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') runLiveMemberSync();
  });
  window.addEventListener('focus', runLiveMemberSync);
  setInterval(() => updateWelcomeGreeting(window.fitSyncStore?.state?.user?.name), 30000);
});

function getKolkataTime() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(new Date());

  let hour = 0, minute = 0, second = 0;
  for (const p of parts) {
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'minute') minute = parseInt(p.value, 10);
    if (p.type === 'second') second = parseInt(p.value, 10);
  }
  return { hour, minute, second };
}

function getGreetingPrefix() {
  const { hour } = getKolkataTime();
  // 05:00–11:59: Good Morning
  if (hour >= 5 && hour < 12) return 'Good Morning';
  // 12:00–16:59: Good Afternoon
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  // 17:00–04:59: Good Evening
  return 'Good Evening';
}

function updateWelcomeGreeting(userName) {
  const prefix = getGreetingPrefix();
  const prefixEl = document.getElementById('dashboardGreetingPrefix');
  if (prefixEl && prefixEl.textContent !== prefix) {
    prefixEl.textContent = prefix;
  }

  const nameEl = document.getElementById('dashboardGreetingName');
  if (nameEl) {
    let firstName = '';
    const stateUser = window.fitSyncStore?.state?.user;
    const raw = userName || stateUser?.name || stateUser?.full_name;
    if (raw && typeof raw === 'string' && raw.trim() && raw.trim() !== 'Athlete' && raw.trim() !== 'Athlete Profile') {
      firstName = raw.trim().split(' ')[0];
    } else {
      firstName = 'Member';
    }
    nameEl.textContent = firstName;
  }

  const dateEl = document.getElementById('dashboardWelcomeDate');
  if (dateEl) {
    const kolkataDateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
    dateEl.textContent = kolkataDateStr;
  }
}

// Central Database Sync Function
async function syncUserDashboardFromDb() {
  try {
    const res = await fetch('api/user/dashboard.php');
    if (res.status === 401) {
      window.__AUTHENTICATED_USER__ = null;
      return;
    }
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const state = window.fitSyncStore.state;
        window._latestDashboardData = d;

        // 1. User & Identity
        if (d.user) {
          if (!state.user) state.user = {};
          if (d.user.id) state.user.id = d.user.id;
          if (d.user.full_name) {
            state.user.name = d.user.full_name;
            state.user.full_name = d.user.full_name;
          }
          if (d.user.email) state.user.email = d.user.email;
          if (d.user.mobile !== undefined) state.user.phone = d.user.mobile;
        }

        // 2. Weight & BMI
        if (d.user && d.user.weight_kg !== null && d.user.weight_kg !== undefined && d.user.weight_kg > 0) {
          state.stats.weight.current = d.user.weight_kg;
          state.stats.weight.changeText = d.user.weight_delta ? (d.user.weight_delta > 0 ? `+${d.user.weight_delta} kg this period` : `${d.user.weight_delta} kg this period`) : 'Current baseline';
        } else {
          state.stats.weight.current = null;
          state.stats.weight.changeText = 'No record yet';
        }

        if (d.user && d.user.bmi !== null && d.user.bmi !== undefined) {
          state.stats.bmi.value = d.user.bmi;
          state.stats.bmi.status = d.user.bmi < 18.5 ? 'Underweight' : (d.user.bmi < 25 ? 'Normal range' : 'Overweight');
        } else {
          state.stats.bmi.value = '--';
          state.stats.bmi.status = 'No data yet';
        }

        // 2b. Assessment Targets & Goal
        if (d.assessment) {
          state.stats.calories.target = d.assessment.target_calories_kcal || 2000;
          state.nutrition.targetCalories = d.assessment.target_calories_kcal || 2000;
          state.nutrition.macros.protein.target = d.assessment.target_protein_g || 120;
          state.nutrition.macros.carbs.target = d.assessment.target_carbs_g || 200;
          state.nutrition.macros.fat.target = d.assessment.target_fat_g || 60;
        }
        if (d.goal) {
          state.goal.title = d.goal.title || 'General Fitness';
          state.goal.targetWeight = d.goal.target_weight_kg ? `${d.goal.target_weight_kg} kg` : '--';
          state.goal.progressPercent = d.goal.progress_pct || 0;
        }

        // 2c. Membership Summary
        if (d.membership) {
          state.membership.gymName = d.membership.gym_name || 'No Gym Connected';
          state.membership.location = d.membership.gym_city || '--';
          state.membership.plan = d.membership.plan_name || 'Standard';
          state.membership.status = d.membership.status || 'inactive';
          state.membership.validTill = d.membership.end_date || '--';
          state.membership.turnstileCode = d.membership.qr_code_token || '--';
        } else {
          state.membership.gymName = 'No Gym Connected';
          state.membership.location = 'Select a gym branch';
          state.membership.plan = 'None';
          state.membership.status = 'None';
          state.membership.validTill = '--';
        }

        // 2d. Assigned Trainer + Platform Trainer Directory sync
        const dirTrainers = Array.isArray(d.eligible_trainers) ? d.eligible_trainers : [];
        state.eligibleTrainers = dirTrainers;

        if (d.trainer) {
          const tObj = {
            id: 'tr-' + d.trainer.coach_id,
            user_id: d.trainer.coach_id,
            name: d.trainer.coach_name,
            email: d.trainer.coach_email,
            phone: d.trainer.coach_phone || '',
            title: d.trainer.coach_title || 'Certified Strength Coach',
            experience: (d.trainer.experience_years || 0) + ' Years',
            gym: d.trainer.gym_name || 'FitSync Partner Gym',
            specialties: d.trainer.specializations_summary ? d.trainer.specializations_summary.split(',').map(s => s.trim()) : ['Strength & Conditioning'],
            avatar: 'assets/images/trainer_raj.jpg',
            isAssigned: true
          };
          state.user.assignedCoachId = tObj.id;
          state.assignedTrainerObj = tObj;
          state.trainers = dirTrainers.length ? dirTrainers : [tObj];
        } else {
          state.user.assignedCoachId = null;
          state.assignedTrainerObj = null;
          state.trainers = dirTrainers;
        }

        // 2f. Real-time Notifications Dropdown Sync
        renderMemberNotifications(Array.isArray(d.notifications) ? d.notifications : [], parseInt(d.unread_notifications || 0, 10));

        // 2e. Data permissions sync
        if (d.data_permissions) {
          const pm = document.getElementById('permViewMeasurements');
          const pn = document.getElementById('permViewNutrition');
          const pa = document.getElementById('permViewAssessments');
          const pp = document.getElementById('permViewPhotos');
          const pw = document.getElementById('permViewWorkouts');
          if (pm) pm.checked = !!d.data_permissions.can_view_measurements;
          if (pn) pn.checked = !!d.data_permissions.can_view_nutrition;
          if (pa) pa.checked = !!d.data_permissions.can_view_assessments;
          if (pp) pp.checked = !!d.data_permissions.can_view_progress_photos;
          if (pw) pw.checked = d.data_permissions.can_view_workouts !== false;
        }

        // 2g. Shared Coach Feedback sync
        const fbCard = document.getElementById('memberSharedFeedbackCard');
        const fbList = document.getElementById('memberSharedFeedbackList');
        const fbItems = Array.isArray(d.feedback) ? d.feedback : [];
        if (fbCard && fbList) {
          if (fbItems.length === 0) {
            fbCard.style.display = 'none';
          } else {
            fbCard.style.display = 'block';
            fbList.innerHTML = fbItems.map(n => `
              <div style="padding:10px 12px;border:1px solid #E2E8F0;border-radius:8px;background:#F8FAFC;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <strong style="font-size:12px;color:#0F172A;">${escapeHtml(n.coach_name || 'Your Coach')} • ${escapeHtml(String(n.note_type || 'feedback').replace('_', ' '))}</strong>
                  <span style="font-size:11px;color:#64748B;">${escapeHtml((n.created_at || '').slice(0, 16))}</span>
                </div>
                <div style="font-size:13px;color:#334155;">${escapeHtml(n.note_text)}</div>
              </div>
            `).join('');
          }
        }

        // 3. Nutrition (100% Database-Driven)
        if (d.nutrition) {
          state.stats.calories.current = d.nutrition.calories || 0;
          state.nutrition.calories = d.nutrition.calories || 0;
          state.nutrition.macros.protein.current = d.nutrition.protein !== undefined ? Math.round(d.nutrition.protein) : 0;
          state.nutrition.macros.carbs.current = d.nutrition.carbs !== undefined ? Math.round(d.nutrition.carbs) : 0;
          state.nutrition.macros.fat.current = d.nutrition.fat !== undefined ? Math.round(d.nutrition.fat) : 0;
          state.nutrition.meals = Array.isArray(d.nutrition.meals) ? d.nutrition.meals : [];
        }

        // 4. Water (100% Database-Driven)
        if (d.water) {
          state.stats.water.current = d.water.liters !== undefined ? d.water.liters : 0.0;
          if (state.waterStation) state.waterStation.current = state.stats.water.current;
        }

        // 5. Unread Chat Messages Badge
        const chatBadge = document.getElementById('sidebarChatUnreadBadge');
        if (chatBadge) {
          const unread = parseInt(d.unread_messages || 0, 10);
          if (unread > 0) {
            chatBadge.textContent = `${unread} New`;
            chatBadge.style.background = '#EF4444';
          } else {
            chatBadge.textContent = 'Live';
            chatBadge.style.background = '#22C55E';
          }
        }

        // 6. Workout & Attendance updates
        if (d.workout) {
          applyServerWorkoutData(d.workout);
        }
        if (d.attendance) {
          state.attendance.monthlyVisits = d.attendance.length;
        }

        // 7. Update UI
        updateDashboardUI();
        updateWelcomeGreeting(state.user?.name);
        if (document.getElementById('view-trainers')?.classList.contains('active')) {
          renderTrainersUI();
        }
      }
    }
  } catch (err) {
    console.warn('Database dashboard sync warning:', err);
  }
}

// Robust Icon Initializer (Lucide + Instant Inline SVG Fallback)
function initIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// View Navigation Router (SPA with Hash & Popstate Support)
function switchView(viewName, pushHistory = true) {
  if (!viewName) return;

  // Deactivate all view containers
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.remove('active');
  });

  // Activate target view
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
  } else {
    console.warn(`View "view-${viewName}" not found, falling back to dashboard.`);
    document.getElementById('view-dashboard')?.classList.add('active');
    viewName = 'dashboard';
  }

  // Update sidebar active link state
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    if (item.getAttribute('data-nav') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Show/Hide Right Dashboard Panel (only show on dashboard view for clean focus on other pages)
  const rightPanel = document.querySelector('.dashboard-right');
  if (rightPanel) {
    if (viewName === 'dashboard') {
      rightPanel.style.display = 'flex';
    } else {
      rightPanel.style.display = 'none';
    }
  }

  // Update Browser URL Hash & History
  if (pushHistory && window.history && window.history.pushState) {
    const currentHash = window.location.hash.replace(/^#/, '');
    if (currentHash !== viewName) {
      window.history.pushState({ view: viewName }, '', `#${viewName}`);
    }
  }

  // Re-render icons safely
  try {
    initIcons();
  } catch (e) {
    console.warn('initIcons error:', e);
  }

  if (coachChatPollInterval) {
    clearInterval(coachChatPollInterval);
    coachChatPollInterval = null;
  }

  // Execute view-specific renderers inside isolated try-catch blocks
  try {
    if (viewName === 'exercises' && typeof renderExerciseLibrary === 'function') {
      renderExerciseLibrary(window.currentSelectedMuscle || 'all', window.currentExerciseSearch || '');
    }
  } catch (e) {
    console.warn('Error rendering exercises view:', e);
  }

  try {
    if (viewName === 'nutrition' && typeof renderMealsTimeline === 'function') {
      renderMealsTimeline();
    }
  } catch (e) {
    console.warn('Error rendering nutrition view:', e);
  }

  try {
    if (viewName === 'trainers' && typeof renderTrainersUI === 'function') {
      renderTrainersUI();
    }
  } catch (e) {
    console.warn('Error rendering trainers view:', e);
  }

  try {
    if (viewName === 'coach_chat') {
      window._lastChatMsgId = 0;
      if (typeof renderCoachChatUI === 'function') renderCoachChatUI(true);
      coachChatPollInterval = setInterval(() => {
        if (typeof pollCoachChatMessages === 'function') pollCoachChatMessages();
      }, 2000);
    }
  } catch (e) {
    console.warn('Error rendering coach chat view:', e);
  }

  try {
    if (viewName === 'gyms' && typeof loadMembershipPortalData === 'function') {
      loadMembershipPortalData();
    }
  } catch (e) {
    console.warn('Error loading gyms membership view:', e);
  }

  try {
    if (viewName === 'workouts' && typeof loadWorkoutPlanFromDb === 'function') {
      loadWorkoutPlanFromDb();
    }
  } catch (e) {
    console.warn('Error loading workouts view:', e);
  }

  try {
    if (viewName === 'attendance' && typeof renderAttendanceView === 'function') {
      renderAttendanceView();
    }
  } catch (e) {
    console.warn('Error rendering attendance view:', e);
  }

  try {
    if (viewName === 'water') {
      if (typeof renderWaterLogs === 'function') renderWaterLogs();
    }
  } catch (e) {
    console.warn('Error rendering water view:', e);
  }

  try {
    if (viewName === 'settings') {
      if (typeof loadUserProfileData === 'function') loadUserProfileData();
      if (typeof loadAttendanceCalendar === 'function') loadAttendanceCalendar();
    }
  } catch (e) {
    console.warn('Error rendering settings view:', e);
  }

  setTimeout(() => {
    try {
      if (window.renderAllCharts) window.renderAllCharts();
    } catch (e) {
      console.warn('Chart render error:', e);
    }
  }, 60);

  // Close mobile drawer if open
  document.getElementById('sidebarNav')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.switchView = switchView;

function setupNavigation() {
  // Centralized delegated click event listener on document
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn && !navBtn.classList.contains('btn-sidebar-logout') && navBtn.id !== 'sidebarLogoutBtn' && navBtn.id !== 'sidebarUserLogoutBtn') {
      e.preventDefault();
      const view = navBtn.getAttribute('data-nav');
      if (view) switchView(view);
      return;
    }

    const switchBtn = e.target.closest('[data-switch-view]');
    if (switchBtn) {
      e.preventDefault();
      const view = switchBtn.getAttribute('data-switch-view');
      if (view) switchView(view);
      return;
    }
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
  });

  // Browser back & forward navigation
  window.addEventListener('popstate', (e) => {
    const view = (e.state && e.state.view) || window.location.hash.replace(/^#/, '') || 'dashboard';
    switchView(view, false);
  });
}

// Update UI from Store State
function updateDashboardUI() {
  const state = window.fitSyncStore.state;
  syncUserProfileUI();
  updateWelcomeGreeting(state.user?.name);

  // 1. Stats Cards
  const weightVal = document.getElementById('statWeightValue');
  const weightChange = document.getElementById('statWeightChange');
  if (weightVal) weightVal.textContent = `${state.stats.weight.current !== null && state.stats.weight.current !== undefined ? state.stats.weight.current : '--'} ${state.stats.weight.unit || 'kg'}`;
  if (weightChange) weightChange.textContent = state.stats.weight.changeText;

  const bmiVal = document.getElementById('statBmiValue');
  const bmiBadge = document.getElementById('statBmiStatus');
  if (bmiVal) bmiVal.textContent = state.stats.bmi.value;
  if (bmiBadge) bmiBadge.textContent = state.stats.bmi.status;

  const calVal = document.getElementById('statCalValue');
  const calBar = document.getElementById('statCalBar');
  const calCurrent = state.stats.calories.current || 0;
  const calTarget = state.stats.calories.target || 2000;
  if (calVal) calVal.textContent = `${calCurrent.toLocaleString()} / ${calTarget.toLocaleString()} kcal`;
  if (calBar) {
    const calPct = calTarget > 0 ? Math.min(100, Math.round((calCurrent / calTarget) * 100)) : 0;
    calBar.style.width = `${calPct}%`;
  }

  const waterVal = document.getElementById('statWaterValue');
  const waterBar = document.getElementById('statWaterBar');
  const waterCurrent = state.stats.water.current !== undefined ? state.stats.water.current : 0.0;
  const waterTarget = state.stats.water.target || 3.0;
  if (waterVal) waterVal.textContent = `${Number(waterCurrent).toFixed(1)} / ${Number(waterTarget).toFixed(1)} L`;
  if (waterBar) {
    const waterPct = waterTarget > 0 ? Math.min(100, Math.round((waterCurrent / waterTarget) * 100)) : 0;
    waterBar.style.width = `${waterPct}%`;
  }

  // 2. Nutrition Summary Card & Donut Chart
  const nutCalorieCenter = document.getElementById('nutCalorieCenter');
  if (nutCalorieCenter) {
    nutCalorieCenter.textContent = (state.nutrition.calories || 0).toLocaleString();
  }

  const nutDonutCircle = document.getElementById('nutDonutCircle');
  if (nutDonutCircle) {
    const nutCalTarget = state.stats.calories.target || 2000;
    const nutPct = nutCalTarget > 0 ? Math.min(1, (state.nutrition.calories || 0) / nutCalTarget) : 0;
    // Circumference of r=40 is ~251.3
    const offset = Math.round(251 * (1 - nutPct));
    nutDonutCircle.setAttribute('stroke-dashoffset', String(offset));
  }

  const nutProteinVal = document.getElementById('nutProteinVal');
  const nutProteinBar = document.getElementById('nutProteinBar');
  const protCur = state.nutrition.macros.protein.current || 0;
  const protTarget = state.nutrition.macros.protein.target || 120;
  if (nutProteinVal) nutProteinVal.textContent = `${protCur} / ${protTarget} g`;
  if (nutProteinBar) {
    const pPct = protTarget > 0 ? Math.min(100, Math.round((protCur / protTarget) * 100)) : 0;
    nutProteinBar.style.width = `${pPct}%`;
  }

  const nutCarbsVal = document.getElementById('nutCarbsVal');
  const nutCarbsBar = document.getElementById('nutCarbsBar');
  const carbsCur = state.nutrition.macros.carbs.current || 0;
  const carbsTarget = state.nutrition.macros.carbs.target || 200;
  if (nutCarbsVal) nutCarbsVal.textContent = `${carbsCur} / ${carbsTarget} g`;
  if (nutCarbsBar) {
    const cPct = carbsTarget > 0 ? Math.min(100, Math.round((carbsCur / carbsTarget) * 100)) : 0;
    nutCarbsBar.style.width = `${cPct}%`;
  }

  const nutFatVal = document.getElementById('nutFatVal');
  const nutFatBar = document.getElementById('nutFatBar');
  const fatCur = state.nutrition.macros.fat.current || 0;
  const fatTarget = state.nutrition.macros.fat.target || 60;
  if (nutFatVal) nutFatVal.textContent = `${fatCur} / ${fatTarget} g`;
  if (nutFatBar) {
    const fPct = fatTarget > 0 ? Math.min(100, Math.round((fatCur / fatTarget) * 100)) : 0;
    nutFatBar.style.width = `${fPct}%`;
  }

  // 3. Right Water Widget & Water Station Module
  const rightWaterVal = document.getElementById('rightWaterValue');
  const rightWaterBar = document.getElementById('rightWaterBar');
  if (rightWaterVal) rightWaterVal.textContent = `${Number(waterCurrent).toFixed(1)} / ${Number(waterTarget).toFixed(1)} L`;
  if (rightWaterBar) {
    const wPct = waterTarget > 0 ? Math.min(100, Math.round((waterCurrent / waterTarget) * 100)) : 0;
    rightWaterBar.style.width = `${wPct}%`;
  }

  const stationWaterCurrent = document.getElementById('stationWaterCurrent');
  const stationWaterFill = document.getElementById('stationWaterFill');
  const stationWaterRem = document.getElementById('stationWaterRem');
  if (stationWaterCurrent) stationWaterCurrent.textContent = `${Number(waterCurrent).toFixed(1)} L`;
  if (stationWaterFill) {
    const sPct = waterTarget > 0 ? Math.min(100, Math.round((waterCurrent / waterTarget) * 100)) : 0;
    stationWaterFill.style.height = `${sPct}%`;
  }
  if (stationWaterRem) {
    const rem = Math.max(0, (waterTarget - waterCurrent)).toFixed(1);
    stationWaterRem.textContent = `${rem} L`;
  }

  // 4. Goal Ring & Goal Details
  const goalCircle = document.getElementById('goalProgressCircle');
  const goalPctText = document.getElementById('goalProgressText');
  const dashGoalTitle = document.getElementById('dashGoalTitle');
  const dashGoalTarget = document.getElementById('dashGoalTarget');
  if (goalCircle) {
    const circumference = 264;
    const offset = circumference - (circumference * (state.goal.progressPercent || 0)) / 100;
    goalCircle.style.strokeDashoffset = offset;
  }
  if (goalPctText) {
    goalPctText.textContent = `${state.goal.progressPercent || 0}%`;
  }
  if (dashGoalTitle) {
    dashGoalTitle.textContent = state.goal.title || 'General Fitness';
  }
  if (dashGoalTarget) {
    dashGoalTarget.innerHTML = state.goal.targetWeight && state.goal.targetWeight !== '--'
      ? `Target: <strong>${escapeHtml(state.goal.targetWeight)}</strong>`
      : 'Set your target in Profile & Biometrics';
  }

  // 4b. Dashboard Gym & Membership Card + Recent Progress Weight
  const dGymName = document.getElementById('dashGymName');
  const dGymStatus = document.getElementById('dashGymStatus');
  const dGymLoc = document.getElementById('dashGymLocation');
  const dGymPlan = document.getElementById('dashGymPlan');
  const dGymValid = document.getElementById('dashGymValidTill');
  const dRecentWt = document.getElementById('dashRecentProgressWeight');

  if (dGymName) dGymName.textContent = state.membership.gymName || 'No Gym Connected';
  if (dGymStatus) {
    const st = String(state.membership.status || 'None').toLowerCase();
    dGymStatus.textContent = st.charAt(0).toUpperCase() + st.slice(1);
    dGymStatus.style.background = st === 'active' ? 'rgba(16,185,129,0.12)' : (st === 'pending' ? 'rgba(245,158,11,0.15)' : '#F1F5F9');
    dGymStatus.style.color = st === 'active' ? '#059669' : (st === 'pending' ? '#D97706' : '#64748B');
  }
  if (dGymLoc) dGymLoc.textContent = state.membership.location || 'Select a gym branch';
  if (dGymPlan) dGymPlan.textContent = state.membership.plan || 'None';
  if (dGymValid) dGymValid.textContent = state.membership.validTill && state.membership.validTill !== '--' ? `Valid till: ${state.membership.validTill}` : 'No active pass';
  if (dRecentWt) {
    dRecentWt.textContent = state.stats.weight.current ? `${state.stats.weight.current} kg` : '-- kg';
  }

  // 5. Attendance Module Stats
  const attMonthlyVisits = document.getElementById('attMonthlyVisits');
  const attStreak = document.getElementById('attStreak');
  const attConsistency = document.getElementById('attConsistency');
  if (attMonthlyVisits) attMonthlyVisits.textContent = `${state.attendance.monthlyVisits} / ${state.attendance.targetVisits} Days`;
  if (attStreak) attStreak.textContent = `${state.attendance.currentStreak} Days 🔥`;
  if (attConsistency) attConsistency.textContent = `${state.attendance.consistencyPct}%`;
}

// Event Listeners for Quick Action Buttons, Modals, Forms
function setupEventListeners() {
  // Mobile Sidebar Toggle
  const mobileToggle = document.getElementById('mobileNavToggle');
  const sidebar = document.getElementById('sidebarNav');
  const overlay = document.getElementById('sidebarOverlay');

  if (mobileToggle && sidebar && overlay) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Quick Action Buttons
  document.getElementById('actionLogWorkout')?.addEventListener('click', () => openModal('workoutModal'));
  document.getElementById('actionAddMeal')?.addEventListener('click', () => openModal('addMealModal'));
  document.getElementById('actionAddWater')?.addEventListener('click', () => openModal('addWaterModal'));
  document.getElementById('actionUpdateProgress')?.addEventListener('click', () => openModal('updateProgressModal'));
  document.getElementById('actionBookAppointment')?.addEventListener('click', () => openModal('bookAppointmentModal'));
  document.getElementById('actionUploadReport')?.addEventListener('click', () => openModal('uploadReportModal'));

  // Today's Workout Button
  document.getElementById('startWorkoutBtn')?.addEventListener('click', () => openModal('workoutModal'));

  // View Details Links
  document.getElementById('rightAddWaterLink')?.addEventListener('click', () => openModal('addWaterModal'));

  // Attendance Check-in Button (Direct Database Verification)
  document.getElementById('simulateCheckInBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    simulateTurnstileCheckIn();
  });

  // Modal Close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // Keyboard ESC to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });

  // Setup Form Handlers
  setupFormHandlers();
}

// Trigger Realistic Glass Water Filling Animation
function triggerWaterFillAnimation() {
  const glassWrapper = document.getElementById('glassStationWrapper');
  if (!glassWrapper) return;
  glassWrapper.classList.remove('water-filling');
  void glassWrapper.offsetWidth; // force browser layout reflow
  glassWrapper.classList.add('water-filling');
  setTimeout(() => {
    glassWrapper.classList.remove('water-filling');
  }, 1200);
}

function setupFormHandlers() {
  // 1. Water Intake Form & Station Presets (100% Database-Driven)
  const waterForm = document.getElementById('waterForm');
  document.querySelectorAll('.water-preset-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const amount = parseFloat(btn.getAttribute('data-amount'));
      if (!amount || isNaN(amount)) return;
      const amountMl = Math.round(amount * 1000);

      try {
        const res = await fetch('api/water.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_ml: amountMl })
        });
        const json = await res.json();
        if (json.success && json.data) {
          const state = window.fitSyncStore?.state;
          if (state?.stats?.water) state.stats.water.current = json.data.liters;
          if (state?.waterStation) state.waterStation.current = json.data.liters;
          updateDashboardUI();
          triggerWaterFillAnimation();
          closeModal('addWaterModal');
          if (typeof renderWaterLogs === 'function') renderWaterLogs(json.data.logs);
          if (window.renderAllCharts) window.renderAllCharts();
          showToast(`Recorded +${amountMl} ml (${json.data.liters} L total today)!`, 'success');
        } else {
          showToast(json.message || json.error || 'Failed to record water intake.', 'danger');
        }
      } catch (err) {
        console.warn('Water API log error:', err);
        showToast('Server error recording water intake.', 'danger');
      }
    });
  });

  if (waterForm) {
    waterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const customMl = parseFloat(document.getElementById('customWaterInput').value);
      if (customMl > 0) {
        try {
          const res = await fetch('api/water.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount_ml: Math.round(customMl) })
          });
          const json = await res.json();
          if (json.success && json.data) {
            const state = window.fitSyncStore?.state;
            if (state?.stats?.water) state.stats.water.current = json.data.liters;
            if (state?.waterStation) state.waterStation.current = json.data.liters;
            updateDashboardUI();
            triggerWaterFillAnimation();
            closeModal('addWaterModal');
            waterForm.reset();
            if (typeof renderWaterLogs === 'function') renderWaterLogs(json.data.logs);
            if (window.renderAllCharts) window.renderAllCharts();
            showToast(`Added ${customMl} ml (${json.data.liters} L total today)!`, 'success');
          } else {
            showToast(json.message || json.error || 'Failed to record water intake.', 'danger');
          }
        } catch (err) {
          console.warn('Water API log error:', err);
          showToast('Server error recording water intake.', 'danger');
        }
      }
    });
  }

  // 2. Add / Edit Meal Form (100% Database-Driven with Macro Consistency Protection)
  const mealForm = document.getElementById('mealForm');
  if (mealForm) {
    // Ensure pressing Enter inside any meal input logs the meal
    mealForm.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          mealForm.requestSubmit();
        }
      });
    });

    let isSubmittingMeal = false;
    mealForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmittingMeal) return;

      const timing = document.getElementById('mealTiming').value;
      const foodName = document.getElementById('mealFoodName').value.trim();
      const cal = parseInt(document.getElementById('mealCalories').value) || 0;
      const protein = parseFloat(document.getElementById('mealProtein').value) || 0;
      const carbs = parseFloat(document.getElementById('mealCarbs').value) || 0;
      const fat = parseFloat(document.getElementById('mealFat').value) || 0;
      const editId = document.getElementById('mealEditId')?.value || '';

      if (!foodName) {
        showToast('Please enter a food item or recipe name.', 'warning');
        return;
      }

      isSubmittingMeal = true;
      const submitBtn = document.getElementById('mealSubmitBtn');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Log Nutrition';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = editId ? 'Saving Changes...' : 'Logging Meal...';
      }

      try {
        const payload = {
          category: timing,
          food_name: foodName,
          calories: cal,
          protein: protein,
          carbs: carbs,
          fat: fat
        };
        if (editId) {
          payload.id = parseInt(editId);
          payload.action = 'edit';
        }

        const res = await fetch('api/meals.php', {
          method: editId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          showToast(editId ? `Updated "${foodName}" (${cal} kcal)!` : `Logged "${foodName}" (+${cal} kcal)!`, 'success');
          closeModal('addMealModal');
          resetMealForm();
          await syncUserDashboardFromDb();
          if (typeof renderMealsTimeline === 'function') renderMealsTimeline();
        } else {
          showToast(json.message || json.error || 'Failed to record meal.', 'danger');
        }
      } catch (err) {
        console.warn('Meal API log error:', err);
        showToast('Server error recording meal.', 'danger');
      } finally {
        isSubmittingMeal = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  // 3. Update Progress Form (Workflow A: Real database weight recording)
  const progressForm = document.getElementById('progressForm');
  if (progressForm) {
    progressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newWeight = parseFloat(document.getElementById('newWeightInput').value);
      if (newWeight && newWeight > 20 && newWeight < 350) {
        try {
          const r = await fetch('api/user/measurements.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weight_kg: newWeight })
          });
          const res = await r.json();
          if (res.success) {
            await syncUserDashboardFromDb();
            if (typeof loadUserProfileData === 'function') loadUserProfileData();
            if (window.renderAllCharts) window.renderAllCharts();
            showToast(`Weight recorded in database: ${newWeight} kg!`, 'success');
            closeModal('updateProgressModal');
          } else {
            showToast(res.message || res.error || 'Failed to record weight.', 'danger');
          }
        } catch (err) {
          console.warn('Weight sync err:', err);
          showToast('Server error saving weight.', 'danger');
        }
      } else {
        showToast('Please enter a valid weight between 20 and 350 kg.', 'warning');
      }
    });
  }

  // 6. User Settings Profile Form (Authoritative Database Persistence)
  const settingsForm = document.getElementById('settingsProfileForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('setFullName')?.value?.trim();
      const phone = document.getElementById('setPhone')?.value?.trim();
      if (!fullName) return;
      try {
        const res = await fetch('api/user/profile.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_profile_details', full_name: fullName, mobile: phone })
        });
        const json = await res.json();
        if (json.success) {
          await syncUserDashboardFromDb();
          showToast('Profile settings saved to database!', 'success');
        } else {
          showToast(json.message || 'Failed to save profile settings.', 'danger');
        }
      } catch (err) {
        showToast('Server error saving profile.', 'danger');
      }
    });
  }
}

// Live Biometric Calculator (Mifflin-St Jeor Formula) for Assessment Module
function setupAssessmentLiveCalculator() {
  const form = document.getElementById('fullAssessmentForm');
  if (!form) return;

  const ageInput = document.getElementById('asAge');
  const genderInput = document.getElementById('asGender');
  const heightInput = document.getElementById('asHeight');
  const weightInput = document.getElementById('asWeight');
  const waistInput = document.getElementById('asWaist');
  const neckInput = document.getElementById('asNeck');
  const hipInput = document.getElementById('asHip');
  const actInput = document.getElementById('asActivity');
  const goalInput = document.getElementById('asGoal');

  function recompute() {
    const age = parseFloat(ageInput?.value) || 24;
    const gender = genderInput?.value || 'female';
    const height = parseFloat(heightInput?.value) || 168;
    const weight = parseFloat(weightInput?.value) || 62.5;
    const waist = parseFloat(waistInput?.value) || 74;
    const neck = parseFloat(neckInput?.value) || 32;
    const hip = parseFloat(hipInput?.value) || 94;
    const activity = parseFloat(actInput?.value) || 1.55;
    const goal = goalInput?.value || 'muscle_gain';

    // BMI
    const hm = height / 100;
    const bmi = parseFloat((weight / (hm * hm)).toFixed(1));

    // BMR (Mifflin-St Jeor)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'female') {
      bmr -= 161;
    } else {
      bmr += 5;
    }
    bmr = Math.round(bmr);

    // TDEE
    const tdee = Math.round(bmr * activity);

    // Goal Calorie Target
    let targetCal = tdee;
    if (goal === 'muscle_gain') targetCal += 250;
    else if (goal === 'fat_loss') targetCal = Math.max(1200, tdee - 400);

    // Macros
    const proteinG = Math.round(weight * 2.0);
    const fatG = Math.round((targetCal * 0.25) / 9);
    const carbsG = Math.round((targetCal - (proteinG * 4) - (fatG * 9)) / 4);

    // U.S. Navy Body Fat Estimate
    let bodyFat = 22.0;
    if (gender === 'female' && waist && hip && neck && height) {
      bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    } else if (waist && neck && height) {
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    }
    bodyFat = Math.max(8, Math.min(50, parseFloat(bodyFat.toFixed(1))));

    // Update Live Display Elements
    document.getElementById('asResBmi') && (document.getElementById('asResBmi').textContent = bmi);
    document.getElementById('asResBmr') && (document.getElementById('asResBmr').textContent = `${bmr.toLocaleString()} kcal`);
    document.getElementById('asResTdee') && (document.getElementById('asResTdee').textContent = `${tdee.toLocaleString()} kcal`);
    document.getElementById('asResTarget') && (document.getElementById('asResTarget').textContent = `${targetCal.toLocaleString()} kcal`);
    document.getElementById('asResMacros') && (document.getElementById('asResMacros').textContent = `${proteinG}g P • ${carbsG}g C • ${fatG}g F`);
    document.getElementById('asResBodyFat') && (document.getElementById('asResBodyFat').textContent = `${bodyFat}%`);

    return { bmi, bmr, tdee, targetCalories: targetCal, targetProtein: proteinG, targetCarbs: carbsG, targetFat: fatG, bodyFatPct: bodyFat };
  }

  [ageInput, genderInput, heightInput, weightInput, waistInput, neckInput, hipInput, actInput, goalInput].forEach(el => {
    if (el) el.addEventListener('input', recompute);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const age = parseFloat(ageInput?.value) || 24;
    const gender = genderInput?.value || 'male';
    const height = parseFloat(heightInput?.value) || 175;
    const weight = parseFloat(weightInput?.value) || 72;
    const waist = parseFloat(waistInput?.value) || 0;
    const neck = parseFloat(neckInput?.value) || 0;
    const hip = parseFloat(hipInput?.value) || 0;
    const activity = parseFloat(actInput?.value) || 1.55;
    const goal = goalInput?.value || 'muscle_gain';

    try {
      const res = await fetch('api/assessment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, gender, height, weight, waist, neck, hip, activity, goal })
      });
      const json = await res.json();
      if (json.success) {
        const computed = recompute();
        window.fitSyncStore.saveAssessment(computed);
        await syncUserDashboardFromDb();
        if (typeof loadUserProfileData === 'function') loadUserProfileData();
        showToast('Biometric assessment saved to MySQL!', 'success');
      } else {
        showToast(json.message || 'Failed to save biometric assessment.', 'danger');
      }
    } catch (err) {
      showToast('Server error saving assessment.', 'danger');
    }
  });

  recompute();
}

// Modal Open / Close Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Rest Timer Engine for Workout Session Modal
let timerSeconds = 60;
let timerRunning = false;
let timerInterval = null;

function setupRestTimer() {
  const display = document.getElementById('modalTimerDisplay');
  const startBtn = document.getElementById('modalTimerStartBtn');
  const resetBtn = document.getElementById('modalTimerResetBtn');

  if (!display || !startBtn || !resetBtn) return;

  function updateDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  startBtn.addEventListener('click', () => {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.textContent = 'Start';
    } else {
      timerRunning = true;
      startBtn.textContent = 'Pause';
      timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
          timerSeconds--;
          updateDisplay();
        } else {
          clearInterval(timerInterval);
          timerRunning = false;
          startBtn.textContent = 'Start';
          timerSeconds = 60;
          updateDisplay();
          showToast('🔔 Rest interval complete! Ready for next set.', 'info');
        }
      }, 1000);
    }
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 60;
    startBtn.textContent = 'Start';
    updateDisplay();
  });

  document.querySelectorAll('.timer-chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.textContent = 'Start';
      timerSeconds = parseInt(chip.getAttribute('data-sec')) || 60;
      updateDisplay();
    });
  });

  updateDisplay();
}

// Toast Feedback Notification
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-msg">${message}</span>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global functions for inline HTML event handlers
window.switchView = switchView;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.initIcons = initIcons;
window.triggerWaterFillAnimation = triggerWaterFillAnimation;

// =========================================================================
// 7-DAY WORKOUT SPLIT PLANNER & DAY TRAVELLER CONTROLLER
// =========================================================================

let currentWorkoutDay = 'tue'; // Default to Tuesday matching reference preview
let headerRestSeconds = 90;
let headerTimerRunning = false;
let headerTimerInterval = null;

function initWorkoutPlannerModule() {
  const dayButtons = document.querySelectorAll('#wkDaysStrip .wk-day-btn');
  dayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.getAttribute('data-day');
      if (day) {
        selectWorkoutDay(day);
      }
    });
  });

  // Initial load
  selectWorkoutDay(currentWorkoutDay);
}

function selectWorkoutDay(dayKey) {
  currentWorkoutDay = dayKey;

  // Update 7-day strip active classes
  document.querySelectorAll('#wkDaysStrip .wk-day-btn').forEach(btn => {
    if (btn.getAttribute('data-day') === dayKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Get plan data from store or default fallback
  let plan = null;
  if (window.fitSyncStore && typeof window.fitSyncStore.getWorkoutPlan === 'function') {
    plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  }
  if (!plan && window.DEFAULT_FITSYNC_DATA && window.DEFAULT_FITSYNC_DATA.workoutPlans) {
    plan = window.DEFAULT_FITSYNC_DATA.workoutPlans[dayKey];
  }
  if (!plan) return;

  // Update routine titles and badges
  const badgeEl = document.getElementById('wkRoutineBadge');
  const subBadgeEl = document.getElementById('wkRoutineSubBadge');
  const titleEl = document.getElementById('wkRoutineTitle');
  const taglineEl = document.getElementById('wkRoutineTagline');
  const scheduledBadgeEl = document.getElementById('wkScheduledBadge');
  const statTargetEl = document.getElementById('wkStatTarget');
  const statDurationEl = document.getElementById('wkStatDuration');

  if (badgeEl) badgeEl.textContent = plan.badge || `${dayKey.toUpperCase()}'S ROUTINE`;
  if (subBadgeEl) subBadgeEl.textContent = plan.subBadge || 'Daily Routine Preview';
  if (titleEl) titleEl.textContent = plan.title || 'Workout Session';
  if (taglineEl) taglineEl.textContent = plan.tagline || '';
  
  const exCount = plan.exercises ? plan.exercises.length : 0;
  if (scheduledBadgeEl) scheduledBadgeEl.textContent = `${exCount} Exercises Scheduled`;
  if (statTargetEl) statTargetEl.textContent = `${exCount} Exercises`;
  if (statDurationEl) statDurationEl.textContent = `Estimated Duration: ${plan.duration || '45 mins'}`;

  // Render Exercise Cards
  renderWorkoutExercises(plan);

  // Update stats summary cards
  updateWorkoutStats(plan);

  // Initialize Lucide icons inside newly rendered exercise cards
  initIcons();
}

function updateWorkoutStats(plan) {
  if (!plan || !plan.exercises) return;

  let totalVolume = 0;
  let totalSets = 0;
  let completedSets = 0;

  plan.exercises.forEach(ex => {
    if (ex.sets) {
      ex.sets.forEach(s => {
        totalSets++;
        if (s.done) {
          completedSets++;
          const numWeight = (s.weight === 'Bodyweight' || s.weight === 0 || s.weight === '0') ? 0 : (parseFloat(s.weight) || 0);
          totalVolume += (s.reps || 0) * numWeight;
        }
      });
    }
  });

  const volEl = document.getElementById('wkStatVolume');
  const setsEl = document.getElementById('wkStatSets');
  const setsSubEl = document.getElementById('wkStatSetsSub');

  if (volEl) volEl.textContent = `${Math.round(totalVolume).toLocaleString()} kg`;
  if (setsEl) setsEl.textContent = `${completedSets} / ${totalSets} sets`;
  if (setsSubEl) {
    const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    setsSubEl.textContent = `${pct}% of routine completed`;
  }
}

function renderWorkoutExercises(plan) {
  const container = document.getElementById('wkExercisesContainer');
  if (!container) return;

  if (!plan.exercises || plan.exercises.length === 0) {
    container.innerHTML = `
      <div class="fs-card" style="text-align: center; padding: 32px; color: var(--text-secondary);">
        <i data-lucide="coffee" style="width: 32px; height: 32px; margin-bottom: 8px; color: var(--primary-blue);"></i>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main);">Rest & Muscle Recovery Day</h4>
        <p style="font-size: 13px; margin-top: 4px;">No intense lifting scheduled for ${plan.dayName}. Focus on hydration, mobility, and recovery nutrition.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = plan.exercises.map((ex, exIdx) => {
    let exCompletedSets = 0;
    let exVolume = 0;
    (ex.sets || []).forEach(s => {
      if (s.done) {
        exCompletedSets++;
        const numWeight = (s.weight === 'Bodyweight' || s.weight === 0 || s.weight === '0') ? 0 : (parseFloat(s.weight) || 0);
        exVolume += (s.reps || 0) * numWeight;
      }
    });

    const rowsHtml = (ex.sets || []).map((set, setIdx) => {
      const isBw = set.weight === 'Bodyweight' || set.weight === 0 || set.weight === '0' || set.weight === '0.0 kg';
      const displayWeight = isBw ? 'Bodyweight' : `${parseFloat(set.weight).toFixed(1)} kg`;

      return `
      <tr class="${set.done ? 'set-completed' : ''}" id="row-${plan.dayKey}-${exIdx}-${setIdx}">
        <td><span class="wk-set-pill">Set ${set.set}</span></td>
        <td>
          <div class="wk-stepper-box">
            <button type="button" class="wk-stepper-btn" onclick="stepReps(this, -1, '${plan.dayKey}', ${exIdx}, ${setIdx})">-</button>
            <span class="wk-step-input" id="rep-val-${plan.dayKey}-${exIdx}-${setIdx}">${set.reps}</span>
            <button type="button" class="wk-stepper-btn" onclick="stepReps(this, 1, '${plan.dayKey}', ${exIdx}, ${setIdx})">+</button>
            <span class="wk-unit-label">reps</span>
          </div>
        </td>
        <td>
          <div class="wk-stepper-box">
            <button type="button" class="wk-stepper-btn" onclick="stepWeight(this, -2.5, '${plan.dayKey}', ${exIdx}, ${setIdx})">-</button>
            <span class="wk-step-input wk-weight-num ${isBw ? 'wk-weight-bodyweight' : ''}" id="wt-val-${plan.dayKey}-${exIdx}-${setIdx}">${displayWeight}</span>
            <button type="button" class="wk-stepper-btn" onclick="stepWeight(this, 2.5, '${plan.dayKey}', ${exIdx}, ${setIdx})">+</button>
          </div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn-mark-done ${set.done ? 'completed' : ''}" id="btn-done-${plan.dayKey}-${exIdx}-${setIdx}" onclick="toggleSetDone(this, '${plan.dayKey}', ${exIdx}, ${setIdx})">
              <i data-lucide="${set.done ? 'check-circle' : 'circle'}" style="width: 13px; height: 13px;"></i>
              <span>${set.done ? 'Completed ✓' : 'Mark Done'}</span>
            </button>
            <button type="button" class="wk-trash-btn" onclick="deleteSet('${plan.dayKey}', ${exIdx}, ${setIdx})" title="Remove Set">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `}).join('');

    return `
      <div class="wk-exercise-card">
        <div class="wk-ex-header">
          <div class="wk-ex-left">
            <img src="${ex.image || 'assets/images/bench_press.jpg'}" alt="${ex.name}" class="wk-ex-thumb" onerror="this.src='assets/images/bench_press.jpg'">
            <div>
              <h4 class="wk-ex-title">${ex.name}</h4>
              <p class="wk-ex-subtitle">${ex.muscle} • ${ex.equipment}</p>
              <span class="wk-ex-target-pill">${ex.target || 'Target: 4 sets × 10-12 reps'}</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="wk-pill-btn" onclick="openModal('bookAppointmentModal')">
              <i data-lucide="message-square" style="width: 12px; height: 12px;"></i> Ask Trainer
            </button>
            <button type="button" class="wk-pill-btn" onclick="switchView('exercises')">
              <i data-lucide="help-circle" style="width: 12px; height: 12px;"></i> Exercise Guide
            </button>
            <button type="button" class="wk-trash-btn" onclick="deleteExercise('${plan.dayKey}', ${exIdx})" title="Remove Exercise">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>

        <table class="wk-set-table">
          <thead>
            <tr>
              <th style="width: 15%;">Set</th>
              <th style="width: 32%;">Reps</th>
              <th style="width: 33%;">Weight</th>
              <th style="width: 20%;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="wk-ex-footer">
          <button type="button" class="wk-btn-add-set" onclick="addSetToExercise('${plan.dayKey}', ${exIdx})">
            <i data-lucide="plus" style="width: 13px; height: 13px;"></i> Add Set ${(ex.sets || []).length + 1}
          </button>
          <div class="wk-ex-footer-stats" id="ex-summary-${plan.dayKey}-${exIdx}">
            <span>Sets: <strong>${exCompletedSets}/${(ex.sets || []).length}</strong></span>
            <span style="margin: 0 6px; color: var(--border-color);">•</span>
            <span>Volume: <strong>${Math.round(exVolume).toLocaleString()} kg</strong></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleSetDone(btn, dayKey, exIdx, setIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises[exIdx] || !plan.exercises[exIdx].sets[setIdx]) return;

  const setObj = plan.exercises[exIdx].sets[setIdx];
  setObj.done = !setObj.done;

  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);

  const row = document.getElementById(`row-${dayKey}-${exIdx}-${setIdx}`);
  const doneBtn = document.getElementById(`btn-done-${dayKey}-${exIdx}-${setIdx}`);

  if (setObj.done) {
    if (row) row.classList.add('set-completed');
    if (doneBtn) {
      doneBtn.classList.add('completed');
      doneBtn.innerHTML = '<i data-lucide="check-circle" style="width: 13px; height: 13px;"></i> <span>Completed ✓</span>';
    }
    // Automatically launch rest timer countdown & persist set to MySQL
    startHeaderRestTimer(90);
    const exObj = plan.exercises[exIdx];
    const weightVal = (setObj.weight === 'Bodyweight' || !setObj.weight) ? 0 : parseFloat(setObj.weight) || 0;
    fetch('api/workouts.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'log_set',
        plan_day_id: plan.plan_day_id || null,
        exercise_id: exObj.exercise_id || 0,
        exercise: exObj.name,
        set_number: setObj.set || (setIdx + 1),
        weight_kg: weightVal,
        reps: parseInt(setObj.reps || 10, 10)
      })
    }).then(r => r.json()).then(json => {
      if (json.success) {
        showToast(`🎉 Set ${setObj.set} saved to MySQL! Rest timer (90s) started.`, 'success');
        loadWorkoutPlanFromDb();
      }
    }).catch(() => {});
  } else {
    if (row) row.classList.remove('set-completed');
    if (doneBtn) {
      doneBtn.classList.remove('completed');
      doneBtn.innerHTML = '<i data-lucide="circle" style="width: 13px; height: 13px;"></i> <span>Mark Done</span>';
    }
  }

  // Update summary stats
  updateWorkoutStats(plan);

  // Update exercise footer
  let exCompletedSets = 0;
  let exVolume = 0;
  plan.exercises[exIdx].sets.forEach(s => {
    if (s.done) {
      exCompletedSets++;
      exVolume += (s.reps || 0) * (s.weight || 0);
    }
  });
  const summaryEl = document.getElementById(`ex-summary-${dayKey}-${exIdx}`);
  if (summaryEl) {
    summaryEl.innerHTML = `<span>Sets: <strong>${exCompletedSets}/${plan.exercises[exIdx].sets.length}</strong></span><span style="margin: 0 6px; color: var(--border-color);">•</span><span>Volume: <strong>${Math.round(exVolume).toLocaleString()} kg</strong></span>`;
  }

  initIcons();
}

function stepReps(btn, delta, dayKey, exIdx, setIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises[exIdx] || !plan.exercises[exIdx].sets[setIdx]) return;

  const setObj = plan.exercises[exIdx].sets[setIdx];
  setObj.reps = Math.max(1, (setObj.reps || 10) + delta);
  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);

  const repValEl = document.getElementById(`rep-val-${dayKey}-${exIdx}-${setIdx}`);
  if (repValEl) repValEl.textContent = setObj.reps;

  updateWorkoutStats(plan);
}

function stepWeight(btn, delta, dayKey, exIdx, setIdx) {
  let plan = window.fitSyncStore && typeof window.fitSyncStore.getWorkoutPlan === 'function'
    ? window.fitSyncStore.getWorkoutPlan(dayKey)
    : (window.DEFAULT_FITSYNC_DATA?.workoutPlans[dayKey]);
  if (!plan || !plan.exercises[exIdx] || !plan.exercises[exIdx].sets[setIdx]) return;

  const setObj = plan.exercises[exIdx].sets[setIdx];
  let cur = (setObj.weight === 'Bodyweight' || setObj.weight === 0 || setObj.weight === '0') ? 0 : (parseFloat(setObj.weight) || 0);
  let next = cur + delta;
  if (next <= 0) {
    setObj.weight = 'Bodyweight';
  } else {
    setObj.weight = parseFloat(next.toFixed(1));
  }

  if (window.fitSyncStore && typeof window.fitSyncStore.saveWorkoutPlan === 'function') {
    window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  }

  const wtValEl = document.getElementById(`wt-val-${dayKey}-${exIdx}-${setIdx}`);
  if (wtValEl) {
    const isBw = setObj.weight === 'Bodyweight';
    wtValEl.textContent = isBw ? 'Bodyweight' : `${setObj.weight.toFixed(1)} kg`;
    if (isBw) {
      wtValEl.classList.add('wk-weight-bodyweight');
    } else {
      wtValEl.classList.remove('wk-weight-bodyweight');
    }
  }

  updateWorkoutStats(plan);
}

function addSetToExercise(dayKey, exIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises[exIdx]) return;

  const ex = plan.exercises[exIdx];
  const lastSet = ex.sets && ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : { reps: 10, weight: 50 };
  const newSetNum = (ex.sets ? ex.sets.length : 0) + 1;

  ex.sets.push({
    set: newSetNum,
    reps: lastSet.reps,
    weight: lastSet.weight,
    done: false
  });

  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  selectWorkoutDay(dayKey);
  showToast(`Added Set ${newSetNum} to ${ex.name}`, 'info');
}

function deleteSet(dayKey, exIdx, setIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises[exIdx]) return;

  plan.exercises[exIdx].sets.splice(setIdx, 1);
  // Re-number sets
  plan.exercises[exIdx].sets.forEach((s, idx) => {
    s.set = idx + 1;
  });

  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  selectWorkoutDay(dayKey);
  showToast('Set removed.', 'info');
}

function deleteExercise(dayKey, exIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises) return;

  const removed = plan.exercises.splice(exIdx, 1);
  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  selectWorkoutDay(dayKey);
  showToast(`Removed exercise: ${removed[0]?.name || ''}`, 'info');
}

function resetWorkoutSets() {
  const plan = window.fitSyncStore.getWorkoutPlan(currentWorkoutDay);
  if (!plan || !plan.exercises) return;

  plan.exercises.forEach(ex => {
    (ex.sets || []).forEach(s => {
      s.done = false;
    });
  });

  window.fitSyncStore.saveWorkoutPlan(currentWorkoutDay, plan);
  selectWorkoutDay(currentWorkoutDay);
  showToast(`All sets reset to 0 for ${plan.badge || 'this routine'}.`, 'info');
}

function promptAddExercise() {
  const name = prompt('Enter exercise name to add to this routine (e.g. Standing Overhead Press):');
  if (!name || !name.trim()) return;

  const plan = window.fitSyncStore.getWorkoutPlan(currentWorkoutDay);
  if (!plan) return;

  if (!plan.exercises) plan.exercises = [];
  plan.exercises.push({
    id: 'ex_' + Date.now(),
    name: name.trim(),
    muscle: 'Full Body Compound',
    equipment: 'Free Weights / Machine',
    image: 'assets/images/bench_press.jpg',
    target: 'Target: 4 sets × 10 reps @ 50.0 kg',
    sets: [
      { set: 1, reps: 10, weight: 40.0, done: false },
      { set: 2, reps: 10, weight: 45.0, done: false },
      { set: 3, reps: 8, weight: 50.0, done: false }
    ]
  });

  window.fitSyncStore.saveWorkoutPlan(currentWorkoutDay, plan);
  selectWorkoutDay(currentWorkoutDay);
  showToast(`Added ${name} to routine!`, 'success');
}

// Routine Header Rest Timer Engine
function setupHeaderRestTimer() {
  updateHeaderTimerDisplay();
}

function updateHeaderTimerDisplay() {
  const clock = document.getElementById('wkHeaderTimerDisplay');
  if (!clock) return;
  const mins = Math.floor(headerRestSeconds / 60);
  const secs = headerRestSeconds % 60;
  clock.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function toggleHeaderRestTimer() {
  if (headerTimerRunning) {
    pauseHeaderRestTimer();
  } else {
    resumeHeaderRestTimer();
  }
}

function resumeHeaderRestTimer() {
  if (headerTimerRunning) return;
  headerTimerRunning = true;

  const btn = document.getElementById('wkHeaderTimerToggle');
  if (btn) btn.innerHTML = '<i data-lucide="pause" style="width: 12px; height: 12px;"></i>';
  initIcons();

  headerTimerInterval = setInterval(() => {
    if (headerRestSeconds > 0) {
      headerRestSeconds--;
      updateHeaderTimerDisplay();
    } else {
      pauseHeaderRestTimer();
      headerRestSeconds = 90;
      updateHeaderTimerDisplay();
      showToast('🔔 Rest Interval Complete! Begin your next set.', 'info');
    }
  }, 1000);
}

function pauseHeaderRestTimer() {
  clearInterval(headerTimerInterval);
  headerTimerRunning = false;
  const btn = document.getElementById('wkHeaderTimerToggle');
  if (btn) btn.innerHTML = '<i data-lucide="play" style="width: 12px; height: 12px;"></i>';
  initIcons();
}

function startHeaderRestTimer(seconds = 90) {
  clearInterval(headerTimerInterval);
  headerRestSeconds = seconds;
  updateHeaderTimerDisplay();
  resumeHeaderRestTimer();
}

function setHeaderRestPreset(seconds) {
  clearInterval(headerTimerInterval);
  headerTimerRunning = false;
  headerRestSeconds = seconds;
  const btn = document.getElementById('wkHeaderTimerToggle');
  if (btn) btn.innerHTML = '<i data-lucide="play" style="width: 12px; height: 12px;"></i>';
  updateHeaderTimerDisplay();
  initIcons();
}

function resetHeaderRestTimer() {
  clearInterval(headerTimerInterval);
  headerTimerRunning = false;
  headerRestSeconds = 90;
  const btn = document.getElementById('wkHeaderTimerToggle');
  if (btn) btn.innerHTML = '<i data-lucide="play" style="width: 12px; height: 12px;"></i>';
  updateHeaderTimerDisplay();
  initIcons();
}

// Reset Water Intake Action (100% Database-Driven)
async function resetWaterIntake() {
  try {
    await fetch('api/water.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' })
    });
  } catch (err) {
    console.warn('Reset water API warning:', err);
  }
  if (window.fitSyncStore && typeof window.fitSyncStore.resetWater === 'function') {
    window.fitSyncStore.resetWater();
  }
  await syncUserDashboardFromDb();
  updateDashboardUI();
  const stationWaterFill = document.getElementById('stationWaterFill');
  if (stationWaterFill) {
    stationWaterFill.style.height = '0%';
  }
  showToast('💧 Water intake reset to 0.0 L for today.', 'info');
}

// Global functions for inline HTML event handlers
window.initWorkoutPlannerModule = initWorkoutPlannerModule;
window.selectWorkoutDay = selectWorkoutDay;
window.toggleSetDone = toggleSetDone;
window.stepReps = stepReps;
window.stepWeight = stepWeight;
window.addSetToExercise = addSetToExercise;
window.deleteSet = deleteSet;
window.deleteExercise = deleteExercise;
window.resetWorkoutSets = resetWorkoutSets;
window.promptAddExercise = promptAddExercise;
window.toggleHeaderRestTimer = toggleHeaderRestTimer;
window.setHeaderRestPreset = setHeaderRestPreset;
window.resetHeaderRestTimer = resetHeaderRestTimer;
window.startHeaderRestTimer = startHeaderRestTimer;
window.resetWaterIntake = resetWaterIntake;

// =========================================================================
// INTERACTIVE HUMAN ANATOMY & EXERCISE LIBRARY CONTROLLER
// =========================================================================

let currentSelectedMuscle = 'all';
let currentExerciseSearch = '';
let currentAnatomyView = 'front';

function initExerciseLibraryModule() {
  // 1. Setup SVG Muscle Group Click & Hover Listeners
  const svgMuscleGroups = document.querySelectorAll('.muscle-group');
  svgMuscleGroups.forEach(group => {
    const muscle = group.getAttribute('data-muscle');
    if (!muscle) return;

    // Hover highlight
    group.addEventListener('mouseenter', () => {
      highlightMuscleOnDiagram(muscle, true);
    });

    group.addEventListener('mouseleave', () => {
      highlightMuscleOnDiagram(muscle, false);
    });

    // Click to select/filter
    group.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentSelectedMuscle === muscle) {
        selectMuscle('all');
      } else {
        selectMuscle(muscle);
      }
    });
  });

  // 2. Setup Filter Chips
  const filterChips = document.querySelectorAll('#exerciseFilterChips .filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const muscle = chip.getAttribute('data-muscle') || 'all';
      selectMuscle(muscle);
    });
  });

  // 3. Setup Live Search Input
  const searchInput = document.getElementById('exerciseSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentExerciseSearch = e.target.value.trim().toLowerCase();
      renderExerciseLibrary(currentSelectedMuscle, currentExerciseSearch);
    });
  }

  // 4. Initial Render
  selectMuscle('all');
}

function setAnatomyView(view) {
  currentAnatomyView = view;
  const wrapper = document.getElementById('anatomyDiagramWrapper');
  if (wrapper) {
    wrapper.setAttribute('data-active-view', view);
  }

  // Update button active classes
  document.querySelectorAll('.anatomy-toggle-pill').forEach(btn => {
    btn.classList.remove('active');
  });

  if (view === 'front') {
    document.getElementById('btnAnatomyFront')?.classList.add('active');
  } else if (view === 'back') {
    document.getElementById('btnAnatomyBack')?.classList.add('active');
  } else {
    document.getElementById('btnAnatomyBoth')?.classList.add('active');
  }
  initIcons();
}

function highlightMuscleOnDiagram(muscleKey, isHover) {
  const groups = document.querySelectorAll(`.muscle-group[data-muscle="${muscleKey}"]`);
  groups.forEach(g => {
    if (isHover) {
      g.classList.add('highlighted');
    } else {
      g.classList.remove('highlighted');
    }
  });
}

function selectMuscle(muscleKey) {
  currentSelectedMuscle = muscleKey || 'all';

  // 1. Sync anatomy diagram active classes across both SVGs
  document.querySelectorAll('.muscle-group').forEach(g => {
    const m = g.getAttribute('data-muscle');
    if (currentSelectedMuscle !== 'all' && m === currentSelectedMuscle) {
      g.classList.add('active');
    } else {
      g.classList.remove('active');
    }
  });

  // 2. Auto-switch diagram view if the selected muscle is predominantly on the other side
  const biomechanics = window.MUSCLE_BIOMECHANICS || {};
  const muscleInfo = biomechanics[currentSelectedMuscle] || biomechanics['all'];

  if (currentAnatomyView !== 'both') {
    if (muscleInfo && muscleInfo.view === 'posterior' && currentAnatomyView !== 'back') {
      setAnatomyView('back');
    } else if (muscleInfo && muscleInfo.view === 'anterior' && currentAnatomyView !== 'front') {
      setAnatomyView('front');
    }
  }

  // 3. Update the Anatomy Info Card Banner
  updateAnatomyInfoBanner(currentSelectedMuscle, muscleInfo);

  // 4. Update Filter Chips active state
  document.querySelectorAll('#exerciseFilterChips .filter-chip').forEach(chip => {
    const chipMuscle = chip.getAttribute('data-muscle') || 'all';
    if (chipMuscle === currentSelectedMuscle) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  // 5. Render Exercise Grid
  renderExerciseLibrary(currentSelectedMuscle, currentExerciseSearch);
}

function updateAnatomyInfoBanner(muscleKey, muscleInfo) {
  const allExercises = window.fitSyncStore ? window.fitSyncStore.getExerciseLibrary() : [];
  let matchingCount = allExercises.length;
  if (muscleKey !== 'all') {
    matchingCount = allExercises.filter(ex => ex.muscleGroup === muscleKey).length;
  }

  const titleEl = document.getElementById('anatomyMuscleTitle');
  const latinEl = document.getElementById('anatomyMuscleLatin');
  const funcEl = document.getElementById('anatomyMuscleFunction');
  const synEl = document.getElementById('anatomyMuscleSynergists');
  const planeEl = document.getElementById('anatomyMusclePlane');
  const counterEl = document.getElementById('anatomyExerciseCounter');

  if (muscleInfo) {
    if (titleEl) titleEl.textContent = muscleInfo.name || "Musculoskeletal System";
    if (latinEl) latinEl.textContent = muscleInfo.latin || "Anatomia";
    if (funcEl) funcEl.textContent = muscleInfo.function || "";
    if (synEl) synEl.textContent = muscleInfo.synergists || "Full Body Kinetic Chain";
    if (planeEl) {
      planeEl.textContent = muscleInfo.view === 'both' ? 'Multi-Planar' : (muscleInfo.view === 'anterior' ? 'Frontal / Sagittal' : 'Posterior Sagittal');
    }
  }

  if (counterEl) {
    counterEl.textContent = `${matchingCount} Exercise${matchingCount === 1 ? '' : 's'} Available`;
  }
}

async function renderExerciseLibrary(filterMuscle = 'all', searchQuery = '') {
  const container = document.getElementById('exerciseLibraryGrid');
  if (!container) return;

  try {
    const res = await fetch(`api/exercises.php?muscle=${encodeURIComponent(filterMuscle)}&q=${encodeURIComponent(searchQuery)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.exercises)) {
        if (window.fitSyncStore) {
          window.fitSyncStore.state.exerciseLibrary = json.exercises;
        }
      }
    }
  } catch (err) {
    console.warn('Exercise API fetch error, using cache:', err);
  }

  const allExercises = window.fitSyncStore ? window.fitSyncStore.getExerciseLibrary() : [];
  let filtered = allExercises;

  // Filter by muscle group
  if (filterMuscle && filterMuscle !== 'all') {
    filtered = filtered.filter(ex => ex.muscleGroup === filterMuscle);
  }

  // Filter by search query
  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(ex => {
      const name = (ex.name || '').toLowerCase();
      const muscle = (ex.muscle || '').toLowerCase();
      const equip = (ex.equipment || '').toLowerCase();
      const diff = (ex.difficulty || '').toLowerCase();
      const cues = (ex.cues || '').toLowerCase();
      return name.includes(q) || muscle.includes(q) || equip.includes(q) || diff.includes(q) || cues.includes(q);
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; background: #FFFFFF; border: 1px dashed var(--border-color); border-radius: var(--radius-lg); padding: 48px 24px; text-align: center;">
        <div style="font-size: 36px; margin-bottom: 10px;">🔍</div>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">No exercises found matching criteria</h4>
        <p style="font-size: 13px; color: var(--text-secondary); max-width: 400px; margin: 0 auto 16px auto;">Try clearing your search query or selecting a different muscle group from the anatomy diagram.</p>
        <button type="button" class="btn-primary-block" style="width: auto; margin: 0 auto; padding: 8px 18px;" onclick="document.getElementById('exerciseSearchInput').value=''; currentExerciseSearch=''; selectMuscle('all');">
          Reset Filter & Search
        </button>
      </div>
    `;
    initIcons();
    return;
  }

  let html = '';
  filtered.forEach(ex => {
    const diffClass = ex.difficulty === 'Beginner' ? 'diff-beginner' : (ex.difficulty === 'Advanced' ? 'diff-advanced' : 'diff-intermediate');
    html += `
      <div class="ex-library-card">
        <div class="ex-library-card-img-wrap" onclick="showExerciseDetailModal('${ex.id}')">
          <img src="${ex.image || 'assets/images/ex_flat_bench.jpg'}" class="ex-library-card-img" alt="${ex.name}" onerror="this.src='assets/images/ex_flat_bench.jpg'">
          <span class="ex-library-diff-badge ${diffClass}">${ex.difficulty || 'Intermediate'}</span>
        </div>
        <div class="ex-library-muscle-tag" title="${ex.muscle}">
          ${ex.muscle}
        </div>
        <h4 class="ex-library-title" onclick="showExerciseDetailModal('${ex.id}')" style="cursor: pointer;">
          ${ex.name}
        </h4>
        <p class="ex-library-cues">${ex.cues || 'Maintain rigid kinetic alignment and focus on eccentric stretch.'}</p>
        <div class="ex-library-tags-row">
          <span class="tag-badge">${ex.equipment || 'Gym Equipment'}</span>
          <span class="tag-badge">${ex.type || 'Compound'}</span>
        </div>
        <div class="ex-library-actions">
          <button type="button" class="ex-btn-guide" onclick="showExerciseDetailModal('${ex.id}')">
            <i data-lucide="book-open" style="width: 13px; height: 13px;"></i> Guide
          </button>
          <button type="button" class="ex-btn-add" onclick="quickAddExerciseToRoutine('${ex.id}')" title="Add to Today's Routine">
            <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add to Routine
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  initIcons();
}

function showExerciseDetailModal(exId) {
  const allExercises = window.fitSyncStore ? window.fitSyncStore.getExerciseLibrary() : [];
  const ex = allExercises.find(item => item.id === exId) || allExercises[0];
  if (!ex) return;

  const titleEl = document.getElementById('exModalTitle');
  const imgEl = document.getElementById('exModalImage');
  const diffEl = document.getElementById('exModalDifficultyTag');
  const muscleBadgeEl = document.getElementById('exModalMuscleBadge');
  const typeBadgeEl = document.getElementById('exModalTypeBadge');
  const equipBadgeEl = document.getElementById('exModalEquipBadge');
  const cuesEl = document.getElementById('exModalCues');
  const targetSetsEl = document.getElementById('exModalTargetSets');
  const addBtn = document.getElementById('exModalAddBtn');

  if (titleEl) titleEl.textContent = ex.name;
  if (imgEl) {
    imgEl.src = ex.image || 'assets/images/ex_flat_bench.jpg';
    imgEl.onerror = () => { imgEl.src = 'assets/images/ex_flat_bench.jpg'; };
  }
  if (diffEl) {
    diffEl.textContent = ex.difficulty || 'Intermediate';
    diffEl.className = 'tag-badge ' + (ex.difficulty === 'Beginner' ? 'diff-beginner' : (ex.difficulty === 'Advanced' ? 'diff-advanced' : 'diff-intermediate'));
  }
  if (muscleBadgeEl) muscleBadgeEl.textContent = `Target: ${ex.muscle}`;
  if (typeBadgeEl) typeBadgeEl.textContent = ex.type || 'Compound Movement';
  if (equipBadgeEl) equipBadgeEl.textContent = ex.equipment || 'Free Weights';
  if (cuesEl) cuesEl.textContent = ex.cues || 'Maintain proper form and control throughout.';
  if (targetSetsEl) {
    targetSetsEl.textContent = ex.type === 'Compound' ? '4 Sets • 6-10 Reps • 90-120s Rest' : '3-4 Sets • 10-15 Reps • 60s Rest';
  }

  if (addBtn) {
    addBtn.onclick = () => {
      quickAddExerciseToRoutine(ex.id);
      closeModal('exerciseDetailModal');
    };
  }

  openModal('exerciseDetailModal');
  initIcons();
}

function quickAddExerciseToRoutine(exId) {
  const allExercises = window.fitSyncStore ? window.fitSyncStore.getExerciseLibrary() : [];
  const ex = allExercises.find(item => item.id === exId);
  if (!ex) return;

  const dayKey = currentWorkoutDay || 'tue';
  const plan = window.fitSyncStore ? window.fitSyncStore.getWorkoutPlan(dayKey) : null;
  if (!plan) return;

  if (!plan.exercises) plan.exercises = [];

  const defaultSets = [
    { set: 1, reps: 10, weight: 50.0, done: false },
    { set: 2, reps: 10, weight: 55.0, done: false },
    { set: 3, reps: 8, weight: 60.0, done: false }
  ];

  plan.exercises.push({
    id: `ex_${Date.now()}`,
    name: ex.name,
    muscle: ex.muscle,
    equipment: ex.equipment,
    image: ex.image || 'assets/images/ex_flat_bench.jpg',
    target: `Target: 3 sets × 8–10 reps`,
    sets: defaultSets
  });

  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  if (typeof renderWorkoutPlan === 'function') {
    renderWorkoutPlan(plan);
  }
  showToast(`✅ Added "${ex.name}" to ${plan.dayName}'s Routine!`, 'success');
}

// Global exports for inline HTML handlers
window.initExerciseLibraryModule = initExerciseLibraryModule;
window.setAnatomyView = setAnatomyView;
window.selectMuscle = selectMuscle;
window.highlightMuscleOnDiagram = highlightMuscleOnDiagram;
window.renderExerciseLibrary = renderExerciseLibrary;
window.showExerciseDetailModal = showExerciseDetailModal;
window.quickAddExerciseToRoutine = quickAddExerciseToRoutine;


// ==========================================================================
// FitSync AI — Authentication & Session Controller
// ==========================================================================

function initAuthSystem() {
  const store = window.fitSyncStore;
  if (!store) return;

  const authOverlay = document.getElementById('authDashboardOverlay');
  const appLayout = document.querySelector('.app-layout');

  // Synchronize strictly with server-side authenticated PHP session
  if (window.__AUTHENTICATED_USER__) {
    store.state.isLoggedIn = true;
    if (!store.state.user) store.state.user = {};
    store.state.user.id = window.__AUTHENTICATED_USER__.id;
    store.state.user.name = window.__AUTHENTICATED_USER__.full_name || window.__AUTHENTICATED_USER__.name;
    store.state.user.full_name = window.__AUTHENTICATED_USER__.full_name || window.__AUTHENTICATED_USER__.name;
    store.state.user.email = window.__AUTHENTICATED_USER__.email;
    store.state.user.role = window.__AUTHENTICATED_USER__.role;

    // Strictly enforce RBAC for the Member Portal without bouncing to login/registration
    const hasMemberAccess = typeof window.fitSyncHasPortalAccess === 'function'
      ? window.fitSyncHasPortalAccess(window.__AUTHENTICATED_USER__, 'user')
      : (window.__AUTHENTICATED_USER__.role === 'user' || window.__AUTHENTICATED_USER__.role === 'admin');
    if (!hasMemberAccess) {
      if (typeof window.renderFitSyncAccessDenied === 'function') {
        window.renderFitSyncAccessDenied('user', window.__AUTHENTICATED_USER__);
      }
      return false;
    }
  } else {
    store.state.isLoggedIn = false;
  }

  if (!authOverlay) return;

  if (!window.__AUTHENTICATED_USER__) {
    authOverlay.style.display = 'flex';
    if (appLayout) appLayout.style.display = 'none';
    renderRegisteredAccountsChips();
    initIcons();
  } else {
    authOverlay.style.display = 'none';
    if (appLayout) appLayout.style.display = 'flex';
    syncUserProfileUI();
    if (window.__INITIAL_VIEW__ && typeof switchView === 'function') {
      switchView(window.__INITIAL_VIEW__);
    }
  }
}

function enterGuestPortal() {
  // Redirect to real login page/overlay instead of fake unauthenticated guest bypass
  switchAuthTab('signin');
  showToast('Please sign in with your FitSync account to continue.', 'info');
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

  // Dynamically render assigned coach and branch coaches
  renderTrainersUI();
}

function renderTrainersUI() {
  const store = window.fitSyncStore;
  if (!store) return;
  const trainers = Array.isArray(store.state.eligibleTrainers) && store.state.eligibleTrainers.length
    ? store.state.eligibleTrainers
    : (typeof store.getTrainers === 'function' ? store.getTrainers() : []);
  const currentUser = store.state.user || {};

  // Assigned trainer comes strictly from DB assignment (never fall back to trainers[0]!)
  const assigned = store.state.assignedTrainerObj || trainers.find(t => t.isAssigned) || null;

  const spotlightEl = document.getElementById('assignedCoachSpotlightContainer');
  if (spotlightEl) {
    if (assigned) {
      spotlightEl.innerHTML = `
        <div style="display: flex; gap: 18px; align-items: center; flex-wrap: wrap;">
          <img src="${assigned.avatar || 'assets/images/trainer_raj.jpg'}" class="trainer-avatar-img" style="margin: 0; width: 84px; height: 84px; border-radius: 50%; object-fit: cover;" alt="${escapeHtml(assigned.name)}">
          <div style="flex: 1;">
            <span class="badge-active" style="margin-bottom: 4px; display: inline-block;">YOUR ASSIGNED COACH</span>
            <h3 style="font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 2px;">${escapeHtml(assigned.name)}</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">${escapeHtml(assigned.title)} • ${escapeHtml(assigned.gym || 'FitSync Partner Gym')} • ${escapeHtml(assigned.experience || 'Certified')}</p>
            <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
              ${(assigned.specialties || []).map(s => `<span class="tag-badge">${escapeHtml(s)}</span>`).join('')}
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-primary-block" style="width: auto; padding: 8px 16px; background: #2563EB;" onclick="switchView('coach_chat')">
              <i data-lucide="message-square" style="width: 14px; height: 14px; margin-right: 4px;"></i> Chat with Coach
            </button>
            <button class="btn-primary-block" style="width: auto; padding: 8px 16px;" onclick="openModal('bookAppointmentModal')">Book PT Session</button>
            <button class="btn-secondary" onclick="switchView('workouts')">My Workout Plan</button>
          </div>
        </div>
      `;
    } else {
      spotlightEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; padding: 12px 6px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
            <i data-lucide="user-check" style="width: 26px; height: 26px;"></i>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">No Personal Coach Assigned Yet</h3>
            <p style="font-size: 13px; color: var(--text-secondary);">Browse FitSync registered trainers below and submit a trainer request for your Gym Owner to approve.</p>
          </div>
        </div>
      `;
    }
  }

  // Populate Specialization Filter dynamically
  const specFilterEl = document.getElementById('memberTrainerSpecFilter');
  if (specFilterEl) {
    const curSpec = specFilterEl.value || 'all';
    const specs = Array.from(new Set(trainers.flatMap(t => Array.isArray(t.specialties) ? t.specialties : []).filter(Boolean))).sort();
    specFilterEl.innerHTML = '<option value="all">All Specializations</option>' +
      specs.map(s => `<option value="${escapeHtml(s)}" ${curSpec === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('');
  }

  const q = (document.getElementById('memberTrainerSearch')?.value || '').trim().toLowerCase();
  const sf = document.getElementById('memberTrainerSpecFilter')?.value || 'all';
  const filtered = trainers.filter(t => {
    if (q && !(t.name || '').toLowerCase().includes(q) && !(t.gym || '').toLowerCase().includes(q) && !(t.specialties || []).join(' ').toLowerCase().includes(q)) return false;
    if (sf !== 'all' && !(t.specialties || []).includes(sf)) return false;
    return true;
  });

  const gridEl = document.getElementById('availableTrainersGrid');
  if (gridEl) {
    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: #F8FAFC; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <i data-lucide="users" style="width: 32px; height: 32px; color: #94A3B8; margin-bottom: 8px;"></i>
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">No Registered Trainers Found</h4>
          <p style="font-size: 13px; color: var(--text-secondary); max-width: 420px; margin: 0 auto;">Registered FitSync personal trainers appear here automatically as they join the platform.</p>
        </div>
      `;
    } else {
      gridEl.innerHTML = filtered.map(t => {
        const certColor = t.is_certified ? 'background:#DCFCE7;color:#166534;' : 'background:#FEF3C7;color:#92400E;';
        const reqBtn = t.isAssigned
          ? `<button class="btn-primary-block" style="width:100%;background:#10B981;border:none;" disabled>Assigned Trainer</button>`
          : (t.request_status === 'pending'
            ? `<button class="btn-secondary" style="width:100%;" disabled>Request Pending Approval</button>`
            : `<button class="btn-primary-block" style="width:100%;" onclick="requestTrainerFromPortal(${t.user_id || 0})">Request Trainer</button>`);
        return `
        <div class="trainer-card">
          <img src="${t.avatar || 'assets/images/trainer_raj.jpg'}" class="trainer-avatar-img" alt="${escapeHtml(t.name)}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">${escapeHtml(t.name)}</h4>
          <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;margin-bottom:6px;${certColor}">${escapeHtml(t.certification_badge || (t.is_certified ? 'Verified Certified' : 'Verification Pending'))}</span>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${escapeHtml(t.experience || '0 Years')} Exp • ${escapeHtml(t.qualifications || 'Trainer')}</p>
          <p style="font-size: 11px; color: #64748B; margin-bottom: 6px;">Gym: ${escapeHtml(t.gym || 'Independent')}</p>
          <p style="font-size: 11px; color: #64748B; margin-bottom: 8px;">Availability: ${escapeHtml(t.availability || 'Scheduled Slots')}</p>
          <div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 10px; flex-wrap: wrap;">
            ${(t.specialties || []).slice(0, 3).map(s => `<span class="tag-badge">${escapeHtml(s)}</span>`).join('')}
          </div>
          <div style="display: flex; gap: 6px; flex-direction: column;">
            <button class="btn-secondary" style="width: 100%; font-size: 12px;" onclick="previewTrainerProfile(${t.user_id || 0})">View Profile</button>
            ${reqBtn}
          </div>
        </div>`;
      }).join('');
    }
  }

  // Update appointment booking form coach select options dynamically
  const consultSelect = document.querySelector('#appointmentForm select');
  if (consultSelect && trainers.length > 0) {
    consultSelect.innerHTML = trainers.map(t => `
      <option value="${escapeHtml(t.name)} (${escapeHtml(t.title || '')})">${escapeHtml(t.name)} — ${escapeHtml(t.title || 'Coach')}</option>
    `).join('');
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function previewTrainerProfile(trainerUserId) {
  const trainers = window.fitSyncStore?.state?.eligibleTrainers || [];
  const t = trainers.find(x => parseInt(x.user_id, 10) === parseInt(trainerUserId, 10));
  if (!t) return;
  alert(
    `Trainer Profile: ${t.name}\n` +
    `Certification Status: ${t.certification_badge || (t.is_certified ? 'Verified Certified' : 'Verification Pending')}\n` +
    `Specialties: ${(t.specialties || []).join(', ')}\n` +
    `Experience: ${t.experience}\n` +
    `Qualifications: ${t.qualifications}\n` +
    `Associated Gym: ${t.gym}\n` +
    `Availability: ${t.availability}\n` +
    `Bio: ${t.bio || 'No biography added yet.'}`
  );
}

async function requestTrainerFromPortal(trainerUserId) {
  if (!trainerUserId) return;
  try {
    const res = await fetch('api/user/trainers.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_trainer', trainer_user_id: trainerUserId })
    });
    const json = await res.json();
    if (json.success) {
      if (typeof showToast === 'function') showToast(json.message || 'Trainer request submitted.', 'success');
      else alert(json.message || 'Trainer request submitted.');
      await syncUserDashboardFromDb();
      renderTrainersUI();
    } else {
      alert(json.message || 'Unable to request trainer.');
    }
  } catch (err) {
    console.error('Request trainer err:', err);
  }
}

function renderMemberNotifications(notifs, unreadCount) {
  const badge = document.getElementById('memberNotifUnreadBadge');
  if (badge) {
    badge.textContent = String(unreadCount || 0);
    badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
  const listEl = document.getElementById('memberNotifList');
  if (!listEl) return;
  if (!notifs || notifs.length === 0) {
    listEl.innerHTML = '<div style="padding:12px;text-align:center;color:#64748B;">No notifications yet.</div>';
    return;
  }
  listEl.innerHTML = notifs.map(n => `
    <div onclick="handleMemberNotificationClick(${Number(n.id || 0)}, '${escapeHtml(n.entity_type || '')}')" style="padding:8px;border-bottom:1px solid #F1F5F9;background:${n.is_read ? '#fff' : '#EFF6FF'};border-radius:6px;margin-bottom:4px;cursor:pointer;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
        <div style="font-weight:700;color:#0F172A;">${escapeHtml(n.title)}</div>
        ${!n.is_read ? '<span style="width:7px;height:7px;border-radius:50%;background:#2563EB;display:inline-block;flex-shrink:0;"></span>' : ''}
      </div>
      <div style="font-size:11px;color:#475569;margin-top:2px;">${escapeHtml(n.body)}</div>
      <div style="font-size:10px;color:#94A3B8;margin-top:2px;">${escapeHtml(n.created_at || '')}</div>
    </div>
  `).join('');
}

async function handleMemberNotificationClick(notifId, entityType) {
  const dd = document.getElementById('memberNotifDropdown');
  if (dd) dd.style.display = 'none';
  try {
    if (notifId > 0) {
      await fetch('api/notifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId })
      });
    }
  } catch (err) {
    console.warn('Mark notification click read err:', err);
  }
  const routeMap = {
    message: 'coach_chat',
    membership: 'gyms',
    trainer_assignment: 'trainers',
    member_trainer_request: 'trainers',
    workout_plan: 'workouts',
    workout_reminder: 'workouts',
    trainer_note: 'trainers'
  };
  const targetView = routeMap[entityType] || 'dashboard';
  if (typeof switchView === 'function') switchView(targetView);
  syncUserDashboardFromDb();
}

function toggleMemberNotifications() {
  const dd = document.getElementById('memberNotifDropdown');
  if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}

async function markAllMemberNotifsRead() {
  try {
    await fetch('api/notifications.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    await syncUserDashboardFromDb();
  } catch (err) {
    console.warn('Mark notifications read err:', err);
  }
}

function switchAuthTab(tab) {
  const signInBtn = document.getElementById('authTabBtnSignIn');
  const registerBtn = document.getElementById('authTabBtnRegister');

  const signInPane = document.getElementById('authSignInPane');
  const registerPane = document.getElementById('authRegisterPane');
  const container = document.getElementById('authCardContainer');

  [signInBtn, registerBtn].forEach(b => b?.classList.remove('active'));
  if (signInPane) signInPane.style.display = 'none';
  if (registerPane) registerPane.style.display = 'none';

  if (tab === 'signin') {
    signInBtn?.classList.add('active');
    if (signInPane) signInPane.style.display = 'block';
    container?.classList.remove('auth-container-wide');
  } else if (tab === 'register') {
    registerBtn?.classList.add('active');
    if (registerPane) registerPane.style.display = 'block';
    container?.classList.add('auth-container-wide');
    loadModalRegisterGyms();
  }
  initIcons();
}

async function loadModalRegisterGyms() {
  try {
    const res = await fetch('api/auth/register_options.php');
    const json = await res.json();
    if (!json.success || !json.data) return;
    const gyms = Array.isArray(json.data.gyms) ? json.data.gyms : [];
    const memSel = document.getElementById('modalMemberGymSelect');
    const trSel = document.getElementById('modalTrGymSelect');
    if (memSel) {
      memSel.innerHTML = '<option value="">No gym yet (Browse after sign in)</option>' +
        gyms.map(g => `<option value="${g.id}">${escapeHtml(g.name)} (${escapeHtml(g.city)})</option>`).join('');
    }
    if (trSel) {
      trSel.innerHTML = '<option value="none">Not associated with a gym</option>' +
        gyms.map(g => `<option value="${g.id}">${escapeHtml(g.name)} (${escapeHtml(g.city)})</option>`).join('');
    }
  } catch (err) {
    console.warn('Could not load modal gyms:', err);
  }
}

function selectRegisterRole(role) {
  const normalized = (role === 'member' || role === 'user' || !role) ? 'user' : role;
  const roleInput = document.getElementById('regRoleInput');
  const memberCard = document.getElementById('roleCardMember');
  const trainerCard = document.getElementById('roleCardTrainer');
  const ownerCard = document.getElementById('roleCardOwner');
  const submitBtn = document.getElementById('regSubmitBtn');

  const memFields = document.getElementById('modalRoleMemberFields');
  const trFields = document.getElementById('modalRoleTrainerFields');
  const goFields = document.getElementById('modalRoleOwnerFields');
  const dobBox = document.getElementById('modalRegDobBox');

  if (roleInput) roleInput.value = normalized;
  [memberCard, trainerCard, ownerCard].forEach(c => c?.classList.remove('active'));
  if (memFields) memFields.style.display = normalized === 'user' ? 'block' : 'none';
  if (trFields) trFields.style.display = normalized === 'trainer' ? 'block' : 'none';
  if (goFields) goFields.style.display = normalized === 'gym_owner' ? 'block' : 'none';
  if (dobBox) dobBox.style.display = normalized === 'gym_owner' ? 'none' : 'block';

  const mobileLabel = document.getElementById('modalRegMobileLabel');
  if (mobileLabel) {
    mobileLabel.textContent = normalized === 'user' ? 'Mobile Number (Optional)' : 'Mobile Number *';
  }

  if (normalized === 'trainer') {
    trainerCard?.classList.add('active');
    if (submitBtn) submitBtn.innerHTML = 'Create Trainer Account &amp; Enter FitSync <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>';
  } else if (normalized === 'gym_owner') {
    ownerCard?.classList.add('active');
    if (submitBtn) submitBtn.innerHTML = 'Register Gym &amp; Owner Account <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>';
  } else {
    memberCard?.classList.add('active');
    if (submitBtn) submitBtn.innerHTML = 'Create Member Account &amp; Enter FitSync <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>';
  }
  initIcons();
}

function selectHomeGym(branchName, location, index) {
  document.getElementById('regGymBranchInput').value = branchName;
  document.getElementById('regGymLocationInput').value = location;
  for (let i = 0; i < 3; i++) {
    const card = document.getElementById(`gymBranch${i}`);
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
    return `<button type="button" class="auth-account-chip ${isActive}" onclick="quickSelectAccount('${u.email}')">
      <i data-lucide="${icon}" style="width:13px; height:13px;"></i> ${shortName} (${tag})
    </button>`;
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
  const users = window.fitSyncStore?.state?.registeredUsers || [];
  const target = users.find(u => type === 'coach' ? u.role === 'Gym Trainer' : u.role !== 'Gym Trainer');
  if (target) {
    quickSelectAccount(target.email);
  }
}

async function handleSignInSubmit(e) {
  if (e) e.preventDefault();
  const alertEl = document.getElementById('authSignInAlert');
  if (alertEl) { alertEl.style.display = 'none'; alertEl.innerText = ''; }

  const email = document.getElementById('authEmailInput')?.value?.trim();
  const password = document.getElementById('authPasswordInput')?.value;
  const remember = document.getElementById('authStaySignedIn')?.checked;

  if (!email || !password) {
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Please enter both your email address and password.';
    } else {
      alert('Please enter both your email address and password.');
    }
    return;
  }

  // Attempt backend database authentication
  try {
    const res = await fetch('api/auth/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password, remember })
    });

    const data = await res.json().catch(() => null);

    if (data && data.success) {
      // Role-based routing: if trainer, gym_owner, or admin, navigate to their dedicated portal
      if (data.user && data.user.role && data.user.role !== 'user') {
        const dest = data.redirect || (data.user.role === 'trainer' ? 'trainer/index.html' : (data.user.role === 'gym_owner' ? 'gym_owner/index.html' : 'admin/index.html'));
        window.location.href = dest;
        return;
      }

      if (typeof window.fitSyncRefreshSession === 'function') {
        await window.fitSyncRefreshSession();
      } else {
        window.__AUTHENTICATED_USER__ = data.user;
      }

      initAuthSystem();
      await syncUserDashboardFromDb();
      loadUserProfileData();
      loadMembershipPortalData();
      loadWorkoutPlanFromDb();
      loadAttendanceCalendar();
      renderMealsTimeline();
      renderWaterLogs();
      if (typeof showNotification === 'function') {
        showNotification(`Welcome back to FitSync, ${data.user.full_name || data.user.name}!`);
      }
      return;
    } else {
      const msg = (data && data.message) ? data.message : 'Invalid email or password.';
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.innerText = msg;
      } else {
        alert(msg);
      }
      return;
    }
  } catch (err) {
    console.warn('[FitSync Auth] API error:', err);
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Authentication server unreachable. Please ensure PHP & MySQL are running.';
    }
  }
}

let modalRegSubmitting = false;

async function handleRegisterSubmit(e) {
  if (e) e.preventDefault();
  if (modalRegSubmitting) return;
  const alertEl = document.getElementById('authRegisterAlert');
  if (alertEl) { alertEl.style.display = 'none'; alertEl.innerText = ''; }

  const fullName = document.getElementById('regFullName')?.value?.trim() || '';
  const email = document.getElementById('regEmail')?.value?.trim() || '';
  const mobile = document.getElementById('regPhone')?.value?.trim() || '';
  const dob = document.getElementById('regDobInput')?.value || '';
  const password = document.getElementById('regPassword')?.value || '';
  const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';
  const rawRole = document.getElementById('regRoleInput')?.value || 'user';
  const role = rawRole === 'member' ? 'user' : rawRole;

  if (password !== confirmPassword) {
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Passwords do not match. Please verify your password.';
    }
    return;
  }

  if (password.length < 6) {
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Password must be at least 6 characters.';
    }
    return;
  }

  const payload = {
    role: role,
    full_name: fullName,
    email: email,
    mobile: mobile,
    date_of_birth: dob,
    password: password,
    confirm_password: confirmPassword
  };

  if (role === 'user') {
    payload.gender = document.getElementById('regGender')?.value || 'male';
    payload.height_cm = document.getElementById('regHeight')?.value || '';
    payload.weight_kg = document.getElementById('regWeight')?.value || '';
    payload.fitness_experience = document.getElementById('regExperienceLevel')?.value || 'intermediate';
    payload.primary_goal = document.getElementById('regGoal')?.value || 'Muscle Gain';
    payload.activity_level = document.getElementById('regActivity')?.value || '1.55';
    const memGym = document.getElementById('modalMemberGymSelect')?.value || '';
    if (memGym) {
      payload.gym_id = parseInt(memGym, 10);
      payload.request_membership = 1;
    }
  } else if (role === 'trainer') {
    payload.trainer_specialization = document.getElementById('modalTrSpec')?.value || 'Strength Training';
    payload.experience_years = parseInt(document.getElementById('modalTrExp')?.value || '2', 10);
    payload.certification_name = document.getElementById('modalTrCert')?.value?.trim() || '';
    payload.certifying_body = document.getElementById('modalTrIssuer')?.value?.trim() || '';
    payload.qualifications = document.getElementById('modalTrQual')?.value?.trim() || '';
    payload.bio = document.getElementById('modalTrBio')?.value?.trim() || '';
    const trGym = document.getElementById('modalTrGymSelect')?.value || 'none';
    if (trGym && trGym !== 'none') payload.gym_id = parseInt(trGym, 10);
  } else if (role === 'gym_owner') {
    payload.gym_name = document.getElementById('modalGoName')?.value?.trim() || '';
    payload.gym_email = document.getElementById('modalGoEmail')?.value?.trim() || '';
    payload.gym_phone = document.getElementById('modalGoPhone')?.value?.trim() || '';
    payload.address_line1 = document.getElementById('modalGoAddr')?.value?.trim() || '';
    payload.city = document.getElementById('modalGoCity')?.value?.trim() || '';
    payload.state = document.getElementById('modalGoState')?.value?.trim() || '';
    payload.postal_code = document.getElementById('modalGoPin')?.value?.trim() || '';
  }

  const submitBtn = document.getElementById('regSubmitBtn');
  const origHtml = submitBtn ? submitBtn.innerHTML : '';
  modalRegSubmitting = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
  }

  try {
    const res = await fetch('api/auth/register.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);

    if (data && data.success) {
      if (role === 'trainer' || role === 'gym_owner') {
        window.location.href = data.redirect || (role === 'trainer' ? 'trainer/index.html' : 'gym_owner/index.html');
        return;
      }

      if (typeof window.fitSyncRefreshSession === 'function') {
        await window.fitSyncRefreshSession();
      } else {
        window.__AUTHENTICATED_USER__ = data.user;
      }

      initAuthSystem();
      await syncUserDashboardFromDb();
      loadUserProfileData();
      loadMembershipPortalData();
      loadWorkoutPlanFromDb();
      loadAttendanceCalendar();
      if (typeof showNotification === 'function') {
        showNotification(`Profile created! Welcome to FitSync, ${fullName}.`);
      }
      return;
    } else {
      const msg = (data && data.message) ? data.message : 'Registration failed.';
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.innerText = msg;
      } else {
        alert(msg);
      }
      return;
    }
  } catch (err) {
    console.warn('[FitSync Auth] Registration API error:', err);
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Unable to connect to registration server.';
    }
  } finally {
    modalRegSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHtml;
    }
  }
}

async function loginDemoAccount(key) {
  const users = window.fitSyncStore?.state?.registeredUsers || [];
  let user = users.find(u => key === 'coach' ? u.role === 'Gym Trainer' : u.role !== 'Gym Trainer');
  let email = user ? user.email : '';
  if (!email) {
    showToast?.('Please register an account or enter your credentials.', 'info');
    return;
  }

  // Try API login
  try {
    const res = await fetch('api/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', remember: true })
    });
    const data = await res.json().catch(() => null);

    if (data && data.success) {
      if (data.user && data.user.role && data.user.role !== 'user') {
        const dest = data.redirect || (data.user.role === 'trainer' ? 'trainer/' : (data.user.role === 'gym_owner' ? 'gym_owner/' : 'admin/'));
        window.location.href = dest;
        return;
      }
      if (window.fitSyncStore) {
        window.fitSyncStore.login(email, 'password123');
        if (data.user && window.fitSyncStore.state && window.fitSyncStore.state.user) {
          window.fitSyncStore.state.user.id = data.user.id;
          window.fitSyncStore.state.user.name = data.user.full_name || data.user.name;
          window.fitSyncStore.state.user.email = data.user.email;
          window.fitSyncStore.state.user.role = data.user.role;
          if (typeof window.fitSyncStore.save === 'function') window.fitSyncStore.save();
        }
      }
      initAuthSystem();
      if (typeof updateDashboardUI === 'function') updateDashboardUI();
      if (typeof showNotification === 'function') {
        showNotification(`Signed in as ${data.user.full_name || data.user.name}!`);
      }
      return;
    }
  } catch (err) {
    console.warn('[FitSync Auth] Demo API login failed, using local demo store:', err);
  }

  // Fallback for role accounts if offline or demo
  if (key === 'coach') {
    window.location.href = 'trainer/';
    return;
  }
  if (key === 'owner') {
    window.location.href = 'gym_owner/';
    return;
  }
  if (key === 'admin') {
    window.location.href = 'admin/';
    return;
  }

  // Fallback for member
  if (window.fitSyncStore) {
    window.fitSyncStore.login(email, 'password123');
    initAuthSystem();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
    if (typeof showNotification === 'function') {
      showNotification(`Signed in as ${window.fitSyncStore.state.user.name}!`);
    }
  }
}

async function logoutUser() {
  console.log('Logging out user from FitSync...');
  sessionStorage.setItem('fitsync_logged_out', 'true');
  try {
    await fetch('api/auth/logout.php', { method: 'POST' }).catch(() => {});
  } catch (e) {
    console.warn('Backend logout call error:', e);
  }

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
    console.warn('Error during store logout:', e);
  }

  window.__AUTHENTICATED_USER__ = null;
  initAuthSystem();
  switchAuthTab('signin');

  if (typeof showNotification === 'function') {
    showNotification('You have logged out safely. Please sign in to continue.');
  }
}

function handleResetDatabase() {
  window.fitSyncStore.resetDatabase();
  window.__AUTHENTICATED_USER__ = null;
  initAuthSystem();
  switchAuthTab('signin');
}

function handleForgotPassword() {
  window.location.href = 'forgot_password.php';
}

function openDataStorageModal() {
  openModal('dataStorageModal');
}

// ==========================================================================
// COACH CHAT & DIRECT MESSAGING LOGIC (Database-Backed 2s Polling Chat)
// ==========================================================================
let coachChatPollInterval = null;
let lastCoachChatSignature = '';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatChatTime(sentAt) {
  if (!sentAt) return 'Just now';
  const normalized = String(sentAt).replace(' ', 'T');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return String(sentAt);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getAssignedCoachContext() {
  const dash = window._latestDashboardData || window.__CURRENT_DASHBOARD__ || {};
  const assignedTrainer = dash.trainer || dash.assigned_trainer || null;
  if (assignedTrainer && (assignedTrainer.coach_id || assignedTrainer.id)) {
    return {
      id: parseInt(assignedTrainer.coach_id || assignedTrainer.id, 10),
      name: assignedTrainer.coach_name || assignedTrainer.full_name || assignedTrainer.name || 'Assigned Coach',
      title: assignedTrainer.coach_title || assignedTrainer.specialization || 'Personal Coach',
      avatar: assignedTrainer.avatar_url || assignedTrainer.avatar || 'assets/images/trainer_raj.jpg'
    };
  }
  const store = window.fitSyncStore;
  const trainers = store ? store.getTrainers() : [];
  const currentUser = window.__AUTHENTICATED_USER__ || (store && store.state ? store.state.user : {});
  let coach = null;
  if (currentUser && currentUser.assignedCoachId) {
    coach = trainers.find(t => parseInt(t.user_id || t.id, 10) === parseInt(currentUser.assignedCoachId, 10));
  }
  if (!coach) coach = trainers.find(t => t.isAssigned) || trainers[0] || null;
  if (!coach) return null;
  return {
    id: parseInt(coach.user_id || coach.id, 10),
    name: coach.name || coach.full_name || 'Assigned Coach',
    title: coach.title || coach.specialization || 'Certified Coach',
    avatar: coach.avatar || coach.avatar_url || 'assets/images/trainer_raj.jpg'
  };
}

function buildCoachMessageHtml(msg, currentUserId, coach) {
  const isUser = parseInt(msg.sender_id, 10) === parseInt(currentUserId, 10);
  const timeStr = formatChatTime(msg.sent_at);
  if (isUser) {
    const isRead = parseInt(msg.is_read || 0, 10) === 1;
    const statusText = isRead ? 'Read' : 'Delivered';
    const checkColor = isRead ? '#2563EB' : '#94A3B8';
    return `
      <div class="chat-bubble-outgoing" data-msg-id="${msg.id}">
        <div class="bubble-content">${escapeHtml(msg.message_text)}</div>
        <div class="chat-bubble-meta" style="color: #64748B;">
          ${timeStr} • ${statusText} <i data-lucide="check-check" style="width: 13px; height: 13px; color: ${checkColor}; display: inline-block;"></i>
        </div>
      </div>`;
  }
  return `
    <div class="chat-bubble-incoming" data-msg-id="${msg.id}">
      <img src="${escapeHtml(coach.avatar || 'assets/images/trainer_raj.jpg')}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2px;" alt="${escapeHtml(coach.name)}">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #64748B; margin-bottom: 3px;">${escapeHtml(coach.name)}</div>
        <div class="bubble-content">${escapeHtml(msg.message_text)}</div>
        <div class="chat-bubble-meta">${timeStr} • Received</div>
      </div>
    </div>`;
}

async function renderCoachChatUI(forceRedraw = false) {
  const stream = document.getElementById('coachChatStream');
  const avatarEl = document.getElementById('coachChatAvatar');
  const nameEl = document.getElementById('coachChatName');
  const statusEl = document.getElementById('coachChatStatus');

  const coach = getAssignedCoachContext();
  const currentUser = window.__AUTHENTICATED_USER__ || (window.fitSyncStore?.state?.user) || {};
  const currentUserId = parseInt(currentUser.id || 0, 10);

  if (!coach || !coach.id || !currentUserId) {
    if (nameEl) nameEl.innerText = 'No Assigned Coach';
    if (statusEl) statusEl.innerText = 'Ask your gym owner to assign a coach to unlock live coaching chat.';
    if (stream) {
      stream.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; color: #64748B;">
          <i data-lucide="user-x" style="width: 28px; height: 28px; margin: 0 auto 8px; opacity: 0.4; display: block;"></i>
          <div style="font-weight: 700; color: #0F172A; margin-bottom: 4px;">No Coach Assigned Yet</div>
          <div style="font-size: 12px;">Once your Gym Owner assigns a trainer to you, two-way real-time coaching chat will appear here.</div>
        </div>`;
      if (typeof initIcons === 'function') initIcons();
    }
    return;
  }

  if (avatarEl) avatarEl.src = coach.avatar || 'assets/images/trainer_raj.jpg';
  if (nameEl) nameEl.innerText = coach.name;
  if (statusEl) statusEl.innerText = `Active Coach Desk • ${coach.title || 'Certified Coach'}`;

  if (!stream) return;

  try {
    const res = await fetch(`api/messages.php?with_user=${encodeURIComponent(coach.id)}`);
    if (!res.ok) return;
    const json = await res.json();
    const msgs = json.messages || (json.data && json.data.messages) || [];
    window.__ACTIVE_CONVERSATION_ID__ = json.conversation_id || (json.data && json.data.conversation_id) || null;

    if (json.success && Array.isArray(msgs)) {
      const sig = `${coach.id}:${msgs.map(m => `${m.id}_${m.is_read ? 1 : 0}`).join(',')}`;
      if (!forceRedraw && sig === lastCoachChatSignature) {
        return;
      }
      const wasAtBottom = (stream.scrollHeight - stream.scrollTop - stream.clientHeight) < 80;
      lastCoachChatSignature = sig;

      // Preserve any unsent pending/failed temporary nodes while replacing confirmed stream
      const pendingNodes = Array.from(stream.querySelectorAll('[data-temp-msg="1"]'));

      if (msgs.length === 0 && pendingNodes.length === 0) {
        stream.innerHTML = `
          <div style="text-align: center; padding: 40px 16px; color: #64748B;">
            <i data-lucide="message-square" style="width: 28px; height: 28px; margin: 0 auto 8px; opacity: 0.4; display: block;"></i>
            <div style="font-weight: 700; color: #0F172A; margin-bottom: 4px;">Direct Desk with ${escapeHtml(coach.name)}</div>
            <div style="font-size: 12px;">No messages recorded yet. Type below to consult on workout form, swap exercises, or adjust macros.</div>
          </div>`;
      } else {
        stream.innerHTML = msgs.map(msg => buildCoachMessageHtml(msg, currentUserId, coach)).join('');
        pendingNodes.forEach(node => stream.appendChild(node));
      }

      if (forceRedraw || wasAtBottom || msgs.length <= 5) {
        stream.scrollTop = stream.scrollHeight;
      }
      if (typeof initIcons === 'function') initIcons();

      const chatBadge = document.getElementById('sidebarChatUnreadBadge');
      if (chatBadge) chatBadge.style.display = 'none';
    }
  } catch (err) {
    console.warn('Coach chat stream load err:', err);
  }
}

async function pollCoachChatMessages() {
  const viewEl = document.getElementById('view-coach_chat');
  if (!viewEl || !viewEl.classList.contains('active')) return;
  await renderCoachChatUI(false);
}

async function dispatchCoachMessageText(text, tempNode) {
  const coach = getAssignedCoachContext();
  if (!coach || !coach.id) {
    if (tempNode) tempNode.remove();
    if (typeof showToast === 'function') showToast('No assigned coach available for chat.', 'warning');
    return;
  }

  try {
    const res = await fetch('api/messages.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: window.__ACTIVE_CONVERSATION_ID__ || null,
        with_user: coach.id,
        message_text: text
      })
    });
    const json = await res.json();
    if (json.success) {
      if (tempNode && tempNode.parentNode) tempNode.remove();
      lastCoachChatSignature = '';
      await renderCoachChatUI(true);
    } else {
      if (tempNode) {
        const metaEl = tempNode.querySelector('.chat-bubble-meta');
        if (metaEl) {
          metaEl.innerHTML = `<span style="color:#DC2626;">Failed: ${escapeHtml(json.error || json.message || 'Error')}</span> <button type="button" onclick="retryCoachMessage(this)" data-retry-text="${escapeHtml(text)}" style="background:none;border:none;color:#2563EB;font-weight:700;cursor:pointer;text-decoration:underline;font-size:11px;">Retry</button>`;
        }
      }
      if (typeof showToast === 'function') showToast(json.error || json.message || 'Failed to send message', 'danger');
    }
  } catch (err) {
    console.warn('Message send err:', err);
    if (tempNode) {
      const metaEl = tempNode.querySelector('.chat-bubble-meta');
      if (metaEl) {
        metaEl.innerHTML = `<span style="color:#DC2626;">Network error</span> <button type="button" onclick="retryCoachMessage(this)" data-retry-text="${escapeHtml(text)}" style="background:none;border:none;color:#2563EB;font-weight:700;cursor:pointer;text-decoration:underline;font-size:11px;">Retry</button>`;
      }
    }
  }
}

async function handleSendCoachChat(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('coachChatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const stream = document.getElementById('coachChatStream');
  let tempNode = null;
  if (stream) {
    const emptyState = stream.querySelector('[data-lucide="message-square"]')?.closest('div');
    if (emptyState && stream.children.length === 1) stream.innerHTML = '';
    tempNode = document.createElement('div');
    tempNode.className = 'chat-bubble-outgoing';
    tempNode.setAttribute('data-temp-msg', '1');
    tempNode.innerHTML = `
      <div class="bubble-content">${escapeHtml(text)}</div>
      <div class="chat-bubble-meta" style="color: #64748B;">Sending...</div>
    `;
    stream.appendChild(tempNode);
    stream.scrollTop = stream.scrollHeight;
  }

  await dispatchCoachMessageText(text, tempNode);
}

async function retryCoachMessage(btnEl) {
  const text = btnEl?.getAttribute('data-retry-text');
  const tempNode = btnEl?.closest('[data-temp-msg="1"]');
  if (!text) return;
  const metaEl = tempNode?.querySelector('.chat-bubble-meta');
  if (metaEl) metaEl.innerHTML = 'Sending...';
  await dispatchCoachMessageText(text, tempNode);
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('coachChatInput');
  if (input) {
    input.value = promptText;
    handleSendCoachChat();
  }
}

function clearCoachChatHistory() {
  if (typeof showToast === 'function') {
    showToast('Conversation messages are stored permanently in MySQL for coach continuity.', 'info');
  }
}

// ==========================================================================
// NUTRITION TIMELINE & MACRO ENGINE
// ==========================================================================
function setupMacroAutoCalculation() {
  const pInput = document.getElementById('mealProtein');
  const cInput = document.getElementById('mealCarbs');
  const fInput = document.getElementById('mealFat');
  const calInput = document.getElementById('mealCalories');
  const noticeEl = document.getElementById('mealMacroNotice');

  if (!pInput || !cInput || !fInput || !calInput) return;

  const updateMacroEnergy = () => {
    const p = parseFloat(pInput.value) || 0;
    const c = parseFloat(cInput.value) || 0;
    const f = parseFloat(fInput.value) || 0;
    const enteredCal = parseInt(calInput.value) || 0;
    const macroEnergy = Math.round((p * 4) + (c * 4) + (f * 9));

    // STRICT REQUIREMENT: NEVER automatically overwrite the user's entered calories!
    // Preserve entered food calories independently of macro energy.
    if (!noticeEl) return;

    if (macroEnergy > 0 || (p > 0 || c > 0 || f > 0)) {
      noticeEl.style.display = 'block';
      let html = `<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div><strong>Macro Energy:</strong> ${macroEnergy} kcal <span style="opacity: 0.8;">(P: ${Math.round(p * 4)} · C: ${Math.round(c * 4)} · F: ${Math.round(f * 9)})</span></div>
      </div>`;

      if (enteredCal > 0 && Math.abs(enteredCal - macroEnergy) > 150) {
        html += `<div style="margin-top: 6px; color: #9A3412; font-weight: 500; font-size: 11px; line-height: 1.4;">
          ⚠️ <strong>Consistency Notice:</strong> Entered calories (${enteredCal} kcal) differs from macro-calculated energy (${macroEnergy} kcal).
          Your entered value of <strong>${enteredCal} kcal</strong> will be strictly preserved in the database.
          <button type="button" onclick="document.getElementById('mealCalories').value=${macroEnergy}; setupMacroAutoCalculation();" style="margin-left: 6px; padding: 2px 6px; background: #DBEAFE; border: 1px solid #93C5FD; color: #1E40AF; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: 600;">Use ${macroEnergy} kcal</button>
        </div>`;
      }
      noticeEl.innerHTML = html;
    } else {
      noticeEl.style.display = 'none';
      noticeEl.innerHTML = '';
    }
  };

  pInput.addEventListener('input', updateMacroEnergy);
  cInput.addEventListener('input', updateMacroEnergy);
  fInput.addEventListener('input', updateMacroEnergy);
  calInput.addEventListener('input', updateMacroEnergy);
}

function resetMealForm() {
  const mealForm = document.getElementById('mealForm');
  if (mealForm) mealForm.reset();
  const editId = document.getElementById('mealEditId');
  if (editId) editId.value = '';
  const title = document.getElementById('mealModalTitle');
  if (title) title.textContent = 'Log Meal & Nutrition';
  const submitBtn = document.getElementById('mealSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Log Nutrition';
  const noticeEl = document.getElementById('mealMacroNotice');
  if (noticeEl) {
    noticeEl.style.display = 'none';
    noticeEl.innerHTML = '';
  }
}

function openEditMealModal(mealId) {
  const meals = window._todayMealsCache || [];
  const meal = meals.find(m => m.id === mealId);
  if (!meal) return;

  const editId = document.getElementById('mealEditId');
  if (editId) editId.value = meal.id;

  const timing = document.getElementById('mealTiming');
  if (timing) timing.value = meal.category || meal.meal_type || 'Lunch';

  const foodName = document.getElementById('mealFoodName');
  if (foodName) foodName.value = meal.food_name || '';

  const cal = document.getElementById('mealCalories');
  if (cal) cal.value = meal.calories || 0;

  const p = document.getElementById('mealProtein');
  if (p) p.value = meal.protein || 0;

  const c = document.getElementById('mealCarbs');
  if (c) c.value = meal.carbs || 0;

  const f = document.getElementById('mealFat');
  if (f) f.value = meal.fat || 0;

  const title = document.getElementById('mealModalTitle');
  if (title) title.textContent = 'Edit Meal & Nutrition';

  const submitBtn = document.getElementById('mealSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Save Changes';

  setupMacroAutoCalculation();
  openModal('addMealModal');
}

async function renderMealsTimeline() {
  const container = document.getElementById('todayMealsTimelineList');
  if (!container) return;

  try {
    const res = await fetch('api/meals.php');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const meals = json.data.meals || [];
        window._todayMealsCache = meals;

        if (meals.length === 0) {
          container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 32px 16px; color: var(--text-secondary); background: #F8FAFC; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
              <i data-lucide="utensils" style="width: 32px; height: 32px; margin: 0 auto 8px; opacity: 0.4; display: block;"></i>
              <div style="font-weight: 700; color: var(--text-main); font-size: 14px; margin-bottom: 4px;">No Meals Logged Today</div>
              <div style="font-size: 12px; color: var(--text-muted);">Log your meals or recipes to track your daily macronutrient progress.</div>
            </div>`;
          if (typeof initIcons === 'function') initIcons();
          return;
        }

        container.innerHTML = meals.map(m => {
          const cat = m.category || 'Meal';
          const food = m.food_name || 'Balanced Intake';
          const p = Math.round(m.protein || 0);
          const c = Math.round(m.carbs || 0);
          const f = Math.round(m.fat || 0);
          const cal = m.calories || 0;
          const time = m.time || 'Today';

          return `
            <div style="display: flex; gap: 14px; align-items: center; padding: 12px 16px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); transition: all 0.15s ease;">
              <div style="width: 44px; height: 44px; border-radius: var(--radius-sm); background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.15); display: flex; align-items: center; justify-content: center; color: var(--primary-blue); flex-shrink: 0;">
                <i data-lucide="utensils" style="width: 20px; height: 20px;"></i>
              </div>
              <div style="flex: 1;">
                <span style="font-size: 11px; font-weight: 700; color: var(--primary-blue); text-transform: uppercase;">${time} • ${cat}</span>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${escapeHtml(food)}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">${p}g Protein • ${c}g Carbs • ${f}g Fat</div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <strong style="color: var(--primary-blue); font-size: 15px;">${cal} kcal</strong>
                <button type="button" onclick="openEditMealModal(${m.id})" style="background: none; border: none; color: var(--primary-blue); cursor: pointer; padding: 4px; border-radius: 4px;" title="Edit meal">
                  <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
                </button>
                <button type="button" onclick="deleteMealEntry(${m.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px;" title="Delete meal">
                  <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                </button>
              </div>
            </div>`;
        }).join('');

        if (typeof initIcons === 'function') initIcons();
      }
    }
  } catch (err) {
    console.warn('Meals timeline fetch err:', err);
  }
}

async function deleteMealEntry(mealId) {
  if (!confirm('Are you sure you want to delete this meal record?')) return;
  try {
    const res = await fetch('api/meals.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: mealId })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Meal removed from database', 'info');
      renderMealsTimeline();
      syncUserDashboardFromDb();
    }
  } catch (e) {
    console.warn('Delete meal error:', e);
  }
}

// ==========================================================================
// HYDRATION LOG & ENTRY MANAGEMENT (100% Database-Driven)
// ==========================================================================
async function renderWaterLogs(passedLogs) {
  const container = document.getElementById('todayWaterLogsList');
  const countEl = document.getElementById('todayWaterEntriesCount');
  if (!container) return;

  try {
    let logs = passedLogs;
    if (!logs) {
      const res = await fetch('api/water.php');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          logs = json.data.logs || [];
        }
      }
    }
    logs = logs || [];

    if (countEl) countEl.textContent = `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`;

    if (logs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--text-secondary); font-size: 13px; background: #F8FAFC; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <i data-lucide="droplet" style="width: 24px; height: 24px; margin: 0 auto 6px; opacity: 0.4; display: block; color: var(--primary-blue);"></i>
          No hydration recorded today. Tap a preset above or enter custom ml to log water.
        </div>`;
      if (typeof initIcons === 'function') initIcons();
      return;
    }

    container.innerHTML = logs.map(l => {
      const ml = l.amount_ml || 0;
      const ltrs = (ml / 1000).toFixed(2);
      const timeStr = l.time || (l.logged_at ? new Date(l.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today');

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); transition: all 0.15s ease;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(37,99,235,0.08); display: flex; align-items: center; justify-content: center; color: var(--primary-blue);">
              <i data-lucide="droplet" style="width: 16px; height: 16px;"></i>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">+${ml} ml <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">(${ltrs} L)</span></div>
              <div style="font-size: 11px; color: var(--text-secondary);">${timeStr}</div>
            </div>
          </div>
          <button type="button" onclick="deleteWaterEntry(${l.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; font-size: 11px;" title="Delete this water entry">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>`;
    }).join('');

    if (typeof initIcons === 'function') initIcons();
  } catch (err) {
    console.warn('Error loading water logs:', err);
  }
}

async function deleteWaterEntry(id) {
  if (!confirm('Remove this water entry?')) return;
  try {
    const res = await fetch('api/water.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    });
    const json = await res.json();
    if (json.success && json.data) {
      const state = window.fitSyncStore?.state;
      if (state?.stats?.water) state.stats.water.current = json.data.liters;
      if (state?.waterStation) state.waterStation.current = json.data.liters;
      updateDashboardUI();
      triggerWaterFillAnimation();
      renderWaterLogs(json.data.logs);
      if (window.renderAllCharts) window.renderAllCharts();
      showToast(`Water entry removed. New total: ${json.data.liters} L.`, 'info');
    }
  } catch (err) {
    console.warn('Error deleting water entry:', err);
  }
}

// ==========================================================================
// ATTENDANCE & TURNSTILE OVERHAUL LOGIC (Authoritative Database CRUD)
// ==========================================================================
async function renderAttendanceView() {
  const tbody = document.getElementById('attendanceLogsTbody');
  if (!tbody) return;

  try {
    const res = await fetch('api/attendance.php');
    if (res.ok) {
      const json = await res.json();
      const payload = (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) ? json.data : {};
      const records = Array.isArray(payload.logs) ? payload.logs : (Array.isArray(json.data) ? json.data : (Array.isArray(json.history) ? json.history : []));

      const user = window.__AUTHENTICATED_USER__ || window.fitSyncStore?.state?.user || {};
      const passIdEl = document.getElementById('attPassId');
      if (passIdEl && user.id) passIdEl.textContent = `FS-PASS-${String(user.id).padStart(4, '0')}`;

      if (records.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 36px 16px; color: var(--text-secondary);">
              <i data-lucide="qr-code" style="width: 28px; height: 28px; margin: 0 auto 8px; opacity: 0.4; display: block;"></i>
              <strong style="color: var(--text-main); display: block; margin-bottom: 4px;">No Check-Ins Recorded Yet</strong>
              <span style="font-size: 12px; color: var(--text-muted);">Scan your QR pass or click "Simulate Check-In" to record turnstile entry.</span>
            </td>
          </tr>`;
        if (typeof initIcons === 'function') initIcons();
        return;
      }

      tbody.innerHTML = records.map(r => {
        const checkInDate = r.check_in_time ? new Date(String(r.check_in_time).replace(' ', 'T')) : new Date();
        const dateStr = checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const duration = r.check_out_time ? 'Completed' : 'Active Session';
        const gymName = r.gym_name || 'FitZone Fitness Center';

        return `
          <tr>
            <td>
              <div style="font-weight: 600; color: #0F172A;">${dateStr}</div>
              <span style="font-size: 11px; color: #64748B;">Checked in at ${timeStr}</span>
            </td>
            <td>
              <span style="font-weight: 600; color: #2563EB;">${duration}</span>
            </td>
            <td>
              <div style="font-size: 13px; color: #0F172A;">${escapeHtml(gymName)}</div>
              <span style="font-size: 11px; color: #64748B;">Turnstile Gate #1</span>
            </td>
            <td>
              <span class="fs-badge fs-badge-blue">${escapeHtml(r.check_in_method || 'Turnstile QR')}</span>
            </td>
            <td>
              <span class="fs-badge fs-badge-green" style="display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="check-circle-2" style="width: 12px; height: 12px;"></i> Verified
              </span>
            </td>
          </tr>`;
      }).join('');
      if (typeof initIcons === 'function') initIcons();
    }
  } catch (err) {
    console.warn('Attendance load error:', err);
  }
}

async function simulateTurnstileCheckIn() {
  const dash = window._latestDashboardData || window.__CURRENT_DASHBOARD__ || {};
  const membership = dash.membership || {};
  const gymId = membership.gym_id ? parseInt(membership.gym_id, 10) : 1;

  try {
    const res = await fetch('api/attendance.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gym_id: gymId,
        action: 'check_in',
        method: 'turnstile'
      })
    });
    const json = await res.json();
    const card = document.querySelector('.turnstile-pass-card');
    if (json.success) {
      if (card) {
        card.style.boxShadow = '0 0 30px #22C55E';
        card.style.borderColor = '#22C55E';
        setTimeout(() => {
          card.style.boxShadow = '';
          card.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        }, 1500);
      }
      showToast(json.message || 'Turnstile Pass Verified • Facility Occupancy Updated!', 'success');
      renderAttendanceView();
      loadAttendanceCalendar(currentCalYear, currentCalMonth);
      syncUserDashboardFromDb();
    } else {
      if (card) {
        card.style.boxShadow = '0 0 24px #EF4444';
        card.style.borderColor = '#EF4444';
        setTimeout(() => {
          card.style.boxShadow = '';
          card.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        }, 1500);
      }
      showToast(json.message || json.error || 'Check-in rejected.', 'warning');
    }
  } catch (err) {
    console.warn('Attendance sync err:', err);
    showToast('Server error recording check-in.', 'danger');
  }
}

function exportAttendanceCSV() {
  const rows = Array.from(document.querySelectorAll('#attendanceLogsTbody tr'));
  let csv = "Date,Status,Branch,Method,Verification\n";
  rows.forEach(tr => {
    const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/\s+/g, ' ').trim().replace(/"/g, '""')}"`);
    if (cols.length >= 4) csv += cols.join(',') + "\n";
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitsync_turnstile_attendance_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof showToast === 'function') showToast('Attendance report exported to CSV successfully.', 'success');
}

// Export Auth & Interactive Functions
window.initAuthSystem = initAuthSystem;
window.enterGuestPortal = enterGuestPortal;
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
window.handleForgotPassword = handleForgotPassword;
window.openDataStorageModal = openDataStorageModal;
window.renderCoachChatUI = renderCoachChatUI;
window.handleSendCoachChat = handleSendCoachChat;
window.sendQuickPrompt = sendQuickPrompt;
window.clearCoachChatHistory = clearCoachChatHistory;
window.renderAttendanceView = renderAttendanceView;
window.simulateTurnstileCheckIn = simulateTurnstileCheckIn;
window.exportAttendanceCSV = exportAttendanceCSV;

/* ==========================================================================
   USER PROFILE, BIOMETRICS & ATTENDANCE CALENDAR CONTROLLER
   ========================================================================== */

function stepValue(inputId, delta, min, max, decimals) {
  const el = document.getElementById(inputId);
  if (!el) return;
  let val = parseFloat(el.value) || 0;
  val = val + delta;
  if (min !== undefined && val < min) val = min;
  if (max !== undefined && val > max) val = max;
  el.value = (decimals && decimals > 0) ? val.toFixed(decimals) : Math.round(val);
}

let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth() + 1; // 1-12

async function loadAttendanceCalendar(year, month) {
  if (!year) year = currentCalYear;
  if (!month) month = currentCalMonth;
  currentCalYear = year;
  currentCalMonth = month;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const titleEl = document.getElementById('calMonthYearTitle');
  if (titleEl) {
    titleEl.textContent = `${monthNames[month - 1]} ${year}`;
  }

  try {
    const res = await fetch(`api/user/attendance_calendar.php?year=${year}&month=${month}`);
    const json = await res.json();
    if (json.success && json.data) {
      renderAttendanceCalendarGrid(json.data);
    }
  } catch (err) {
    console.warn('Failed to load attendance calendar:', err);
  }
}

function renderAttendanceCalendarGrid(data) {
  const grid = document.getElementById('calendarDaysGrid');
  if (!grid) return;

  const totalVisitsEl = document.getElementById('calTotalVisits');
  const consistencyEl = document.getElementById('calConsistencyPct');
  const gymTitleEl = document.getElementById('calGymTitle');

  if (totalVisitsEl) totalVisitsEl.textContent = data.total_checkins || 0;
  if (consistencyEl) consistencyEl.textContent = `${data.consistency_pct || 0}%`;
  if (gymTitleEl && data.gym_name) gymTitleEl.textContent = data.gym_name;

  const attendedDays = new Set((data.attended_days || []).map(d => parseInt(d)));
  const daysInMonth = data.days_in_month || 30;
  const firstDayWeekday = data.first_day_weekday !== undefined ? data.first_day_weekday : 0; // 0 = Sunday
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === data.year && (today.getMonth() + 1) === data.month;
  const currentDayNum = today.getDate();

  let html = '';

  // Blank padding cells for days before the 1st
  for (let i = 0; i < firstDayWeekday; i++) {
    html += '<div class="calendar-day-cell empty" style="visibility: hidden; min-height: 44px;"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && day === currentDayNum;
    const isAttended = attendedDays.has(day);

    let cellClass = 'calendar-day-cell';
    let cellStyle = 'min-height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; font-weight: 600; cursor: default; transition: all 0.15s ease; position: relative;';
    
    if (isAttended) {
      cellClass += ' attended';
      cellStyle += ' background: rgba(16, 185, 129, 0.18); border-color: #10B981; color: #065F46; font-weight: 700;';
    } else if (isToday) {
      cellClass += ' today';
      cellStyle += ' background: rgba(37, 99, 235, 0.12); border-color: #2563EB; color: #1E40AF; font-weight: 800;';
    } else {
      cellStyle += ' background: #FFFFFF; color: #64748B;';
    }

    let dot = '';
    if (isAttended) {
      dot = '<span style="width: 5px; height: 5px; border-radius: 50%; background: #10B981; margin-top: 3px;"></span>';
    } else if (isToday) {
      dot = '<span style="width: 5px; height: 5px; border-radius: 50%; background: #2563EB; margin-top: 3px;"></span>';
    }

    html += `
      <div class="${cellClass}" style="${cellStyle}" title="${isAttended ? 'Verified Check-in Recorded' : (isToday ? 'Today' : '')}">
        <span>${day}</span>
        ${dot}
      </div>
    `;
  }

  grid.innerHTML = html;
}

function changeCalendarMonth(delta) {
  currentCalMonth += delta;
  if (currentCalMonth > 12) {
    currentCalMonth = 1;
    currentCalYear += 1;
  } else if (currentCalMonth < 1) {
    currentCalMonth = 12;
    currentCalYear -= 1;
  }
  loadAttendanceCalendar(currentCalYear, currentCalMonth);
}

async function handleCalendarCheckIn() {
  const btn = document.getElementById('btnProfileCheckin');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Verifying...';
  }

  const dash = window._latestDashboardData || window.__CURRENT_DASHBOARD__ || {};
  const gymId = (dash.membership && dash.membership.gym_id) ? parseInt(dash.membership.gym_id, 10) : 1;

  try {
    const res = await fetch('api/user/attendance_calendar.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'checkin',
        gym_id: gymId,
        method: 'turnstile'
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast(result.message || 'Check-in verified! Attendance logged.', 'success');
      }
      loadAttendanceCalendar(currentCalYear, currentCalMonth);
      renderAttendanceView();
      loadUserProfileData();
      if (typeof syncUserDashboardFromDb === 'function') {
        syncUserDashboardFromDb();
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(result.error || result.message || 'Check-in failed.', 'warning');
      }
    }
  } catch (err) {
    console.error('Check-in error:', err);
    if (typeof showToast === 'function') showToast('Server communication error during check-in.', 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="qr-code" style="width: 14px; height: 14px;"></i> Check In to Gym Today';
      if (window.initIcons) initIcons();
    }
  }
}

async function loadUserProfileData() {
  try {
    const res = await fetch('api/user/profile.php');
    const json = await res.json();
    if (!json.success || !json.data) {
      console.warn('Profile fetch unsuccessful:', json.error || json.message);
      return;
    }

    const d = json.data;
    const u = d.user || {};
    const b = d.biometrics || {};
    const m = (d.measurements && d.measurements.history) ? d.measurements.history : [];
    const n = d.notifications || {};
    const t = d.trainer || {};
    const perms = d.data_permissions || d.permissions || {};
    const streak = u.streak_days || 0;

    // Synchronize authoritative user identity across store and global UI elements
    if (u.full_name) {
      if (window.fitSyncStore?.state?.user) {
        window.fitSyncStore.state.user.id = u.id;
        window.fitSyncStore.state.user.name = u.full_name;
        window.fitSyncStore.state.user.full_name = u.full_name;
        window.fitSyncStore.state.user.email = u.email;
      }
      const sideName = document.getElementById('sidebarUserName');
      if (sideName) sideName.textContent = u.full_name;
      const sideEmail = document.getElementById('sidebarUserEmail');
      if (sideEmail && u.email) sideEmail.textContent = u.email;
      const welcomeName = document.getElementById('welcomeName');
      if (welcomeName) welcomeName.textContent = u.full_name;
      updateWelcomeGreeting(u.full_name);
    }

    // SECTION A: Profile Summary Header
    const nameEl = document.getElementById('profHeaderName');
    if (nameEl) nameEl.textContent = u.full_name || 'FitSync Athlete';

    const avatarEl = document.getElementById('profHeaderAvatar');
    if (avatarEl && u.avatar) avatarEl.src = u.avatar;

    const ageEl = document.getElementById('profHeaderAge');
    if (ageEl) ageEl.textContent = u.age ? `${u.age} Years` : '--';

    const heightEl = document.getElementById('profHeaderHeight');
    if (heightEl) heightEl.textContent = u.height_cm ? `${u.height_cm} cm` : '--';

    const weightEl = document.getElementById('profHeaderWeight');
    if (weightEl) weightEl.textContent = u.weight_kg ? `${u.weight_kg} kg` : '--';

    const gymEl = document.getElementById('profHeaderGym');
    if (gymEl) gymEl.textContent = u.home_gym || 'No Gym Connected';

    const goalEl = document.getElementById('profHeaderGoal');
    if (goalEl) goalEl.textContent = u.goal_title || 'General Fitness';

    const tierEl = document.getElementById('profHeaderTier');
    if (tierEl) tierEl.textContent = u.membership_tier || 'No Active Plan';

    const streakEl = document.getElementById('profHeaderStreak');
    if (streakEl) streakEl.textContent = `${streak} Days`;

    // SECTION B: Steppers & Selects
    const ctrlWeight = document.getElementById('ctrlWeight');
    if (ctrlWeight && u.weight_kg) ctrlWeight.value = u.weight_kg;

    const ctrlHeight = document.getElementById('ctrlHeight');
    if (ctrlHeight && u.height_cm) ctrlHeight.value = u.height_cm;

    const ctrlAge = document.getElementById('ctrlAge');
    if (ctrlAge && u.age) ctrlAge.value = u.age;

    const ctrlGoal = document.getElementById('ctrlGoal');
    if (ctrlGoal && u.goal_title) {
      ctrlGoal.value = u.goal_title;
    }

    const ctrlActivity = document.getElementById('ctrlActivity');
    if (ctrlActivity && u.activity_level) {
      ctrlActivity.value = u.activity_level;
    }

    // SECTION C: Biometrics
    const bmiVal = document.getElementById('bioBmiVal');
    if (bmiVal) bmiVal.textContent = b.bmi || '--';

    const bmiCat = document.getElementById('bioBmiCategory');
    if (bmiCat) bmiCat.textContent = b.bmi_category || '--';

    const bmrVal = document.getElementById('bioBmrVal');
    if (bmrVal) bmrVal.innerHTML = `${b.bmr ? Number(b.bmr).toLocaleString() : '--'} <span style="font-size: 15px; font-weight: 600;">kcal</span>`;

    const tdeeVal = document.getElementById('bioTdeeVal');
    if (tdeeVal) tdeeVal.innerHTML = `${b.tdee ? Number(b.tdee).toLocaleString() : '--'} <span style="font-size: 15px; font-weight: 600;">kcal</span>`;

    const fatVal = document.getElementById('bioBodyFatVal');
    if (fatVal) fatVal.textContent = b.body_fat_pct ? `${b.body_fat_pct}%` : '--';

    // SECTION D: Milestones
    renderMilestonesTable(m);

    // SECTION F: Edit Profile Form
    const inputName = document.getElementById('profInputFullName');
    if (inputName) inputName.value = u.full_name || '';

    const inputMobile = document.getElementById('profInputMobile');
    if (inputMobile) inputMobile.value = u.mobile || '';

    const inputAvatar = document.getElementById('profInputAvatar');
    if (inputAvatar) inputAvatar.value = u.avatar || '';

    // SECTION H: Notification Toggles
    if (document.getElementById('notifWorkout')) document.getElementById('notifWorkout').checked = n.workout_reminders !== false;
    if (document.getElementById('notifNutrition')) document.getElementById('notifNutrition').checked = n.nutrition_alerts !== false;
    if (document.getElementById('notifCoach')) document.getElementById('notifCoach').checked = n.coach_messages !== false;
    if (document.getElementById('notifAnnouncements')) document.getElementById('notifAnnouncements').checked = n.gym_announcements !== false;

    // SECTION H2: Trainer Data Permissions
    if (document.getElementById('permViewMeasurements')) document.getElementById('permViewMeasurements').checked = perms.can_view_measurements !== false && perms.can_view_measurements !== 0;
    if (document.getElementById('permViewNutrition')) document.getElementById('permViewNutrition').checked = perms.can_view_nutrition !== false && perms.can_view_nutrition !== 0;
    if (document.getElementById('permViewAssessments')) document.getElementById('permViewAssessments').checked = perms.can_view_assessments !== false && perms.can_view_assessments !== 0;
    if (document.getElementById('permViewPhotos')) document.getElementById('permViewPhotos').checked = perms.can_view_progress_photos === true || perms.can_view_progress_photos === 1;
    if (document.getElementById('permViewWorkouts')) document.getElementById('permViewWorkouts').checked = perms.can_view_workouts !== false && perms.can_view_workouts !== 0;

    // SECTION I: Account Details
    const acctEmail = document.getElementById('acctEmail');
    if (acctEmail) acctEmail.textContent = u.email || '--';

    const acctGym = document.getElementById('acctHomeGym');
    if (acctGym) acctGym.textContent = u.home_gym || 'No Gym Connected';

    const acctTier = document.getElementById('acctTier');
    if (acctTier) acctTier.textContent = u.membership_tier || 'No Active Plan';

    const acctCoach = document.getElementById('acctCoachName');
    if (acctCoach) acctCoach.textContent = t.name ? t.name : 'Not assigned';

    if (window.initIcons) initIcons();
  } catch (err) {
    console.error('Error in loadUserProfileData:', err);
  }
}

function renderMilestonesTable(milestones) {
  const tbody = document.getElementById('measHistoryTbody');
  const countBadge = document.getElementById('measCountBadge');
  if (countBadge) countBadge.textContent = `${milestones.length} Entries`;

  if (!tbody) return;

  if (!milestones || milestones.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 24px;">
          No milestone measurements recorded yet. Click <strong>+ Record Milestone</strong> to log your first progress entry!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = milestones.map(m => `
    <tr>
      <td style="font-weight: 600; color: #0F172A; white-space: nowrap;">${m.date || m.recorded_at}</td>
      <td><strong>${m.weight_kg ? m.weight_kg + ' kg' : '--'}</strong></td>
      <td>${m.waist_cm ? m.waist_cm + ' cm' : '--'}</td>
      <td>${m.chest_cm ? m.chest_cm + ' cm' : '--'}</td>
      <td>${m.arms_cm ? m.arms_cm + ' cm' : '--'}</td>
      <td style="color: var(--text-secondary); font-size: 12px; max-width: 220px;">${escapeHtml(m.notes || 'Routine check')}</td>
      <td style="text-align: right;">
        <button type="button" class="btn-secondary" style="padding: 3px 8px; font-size: 11px; color: #EF4444; border-color: rgba(239, 68, 68, 0.3);" onclick="deleteMilestoneMeasurement(${m.id})">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

async function saveBodyStatsAndRecalculate() {
  const btn = document.getElementById('btnSaveBodyStats');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Saving & Recalculating...';
  }

  const weight = parseFloat(document.getElementById('ctrlWeight')?.value) || 72.0;
  const height = parseFloat(document.getElementById('ctrlHeight')?.value) || 175.0;
  const age    = parseInt(document.getElementById('ctrlAge')?.value) || 24;
  const goal   = document.getElementById('ctrlGoal')?.value || 'Build Muscle';
  const activity = document.getElementById('ctrlActivity')?.value || 'moderately_active';

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_body_stats',
        weight: weight,
        height: height,
        age: age,
        goal: goal,
        activity_level: activity
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast('Body stats saved & daily targets recalculated successfully!', 'success');
      } else {
        alert('Body stats saved!');
      }

      // Update local state and reload UI
      if (window.fitSyncStore && typeof window.fitSyncStore.updateWeight === 'function') {
        window.fitSyncStore.updateWeight(weight);
      }
      if (typeof updateDashboardUI === 'function') updateDashboardUI();
      if (typeof syncUserDashboardFromDb === 'function') syncUserDashboardFromDb();
      loadUserProfileData();
    } else {
      if (typeof showToast === 'function') showToast(result.error || 'Failed to save stats.', 'danger');
    }
  } catch (err) {
    console.error('Error saving stats:', err);
    if (typeof showToast === 'function') showToast('Server communication error.', 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="calculator" style="width: 16px; height: 16px;"></i> Save & Recalculate Daily Targets';
      if (window.initIcons) initIcons();
    }
  }
}

function toggleMilestoneForm() {
  const form = document.getElementById('milestoneEntryForm');
  if (!form) return;
  form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
}

async function saveMilestoneMeasurement() {
  const weight = parseFloat(document.getElementById('milestoneWeight')?.value);
  if (!weight || isNaN(weight) || weight <= 0) {
    alert('Please enter a valid weight in kg.');
    return;
  }
  const waist = parseFloat(document.getElementById('milestoneWaist')?.value) || null;
  const chest = parseFloat(document.getElementById('milestoneChest')?.value) || null;
  const arms  = parseFloat(document.getElementById('milestoneArms')?.value) || null;
  const notes = document.getElementById('milestoneNotes')?.value || '';

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'record_milestone',
        weight: weight,
        waist: waist,
        chest: chest,
        arms: arms,
        notes: notes
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast('Milestone measurement recorded into database!', 'success');
      } else {
        alert('Milestone saved!');
      }

      // Clear input fields
      document.getElementById('milestoneWeight').value = '';
      document.getElementById('milestoneWaist').value = '';
      document.getElementById('milestoneChest').value = '';
      document.getElementById('milestoneArms').value = '';
      document.getElementById('milestoneNotes').value = '';
      toggleMilestoneForm();

      // Refresh data
      loadUserProfileData();
      if (typeof syncUserDashboardFromDb === 'function') syncUserDashboardFromDb();
    } else {
      if (typeof showToast === 'function') showToast(result.error || 'Failed to save milestone.', 'danger');
    }
  } catch (err) {
    console.error('Milestone save error:', err);
  }
}

async function deleteMilestoneMeasurement(id) {
  if (!confirm('Are you sure you want to delete this measurement entry?')) return;

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_measurement',
        measurement_id: id
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast('Measurement deleted.', 'success');
      }
      loadUserProfileData();
      if (typeof syncUserDashboardFromDb === 'function') syncUserDashboardFromDb();
    } else {
      if (typeof showToast === 'function') showToast(result.error || 'Failed to delete entry.', 'danger');
    }
  } catch (err) {
    console.error('Error deleting measurement:', err);
  }
}

async function handleSaveProfileDetails(e) {
  if (e && e.preventDefault) e.preventDefault();

  const fullName = document.getElementById('profInputFullName')?.value.trim();
  const mobile   = document.getElementById('profInputMobile')?.value.trim();
  const avatar   = document.getElementById('profInputAvatar')?.value.trim();

  if (!fullName) {
    alert('Full name is required.');
    return;
  }

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_profile_details',
        full_name: fullName,
        mobile: mobile,
        avatar_url: avatar
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast('Profile details updated successfully!', 'success');
      } else {
        alert('Profile saved!');
      }

      // Update UI elements across header, sidebar and store
      if (window.fitSyncStore?.state?.user) {
        window.fitSyncStore.state.user.name = fullName;
        window.fitSyncStore.state.user.full_name = fullName;
        if (mobile) window.fitSyncStore.state.user.mobile = mobile;
      }

      const headerName = document.getElementById('profHeaderName');
      if (headerName) headerName.textContent = fullName;

      const userNameEl = document.getElementById('userName');
      if (userNameEl) userNameEl.textContent = fullName;

      const sidebarName = document.getElementById('sidebarUserName');
      if (sidebarName) sidebarName.textContent = fullName;

      const welcomeName = document.getElementById('welcomeName');
      if (welcomeName) welcomeName.textContent = fullName;
      updateWelcomeGreeting(fullName);

      if (avatar) {
        const headerAvatar = document.getElementById('profHeaderAvatar');
        if (headerAvatar) headerAvatar.src = avatar;
      }

      loadUserProfileData();
    } else {
      if (typeof showToast === 'function') showToast(result.error || 'Failed to update profile.', 'danger');
    }
  } catch (err) {
    console.error('Error saving profile details:', err);
  }
}

async function handleProfilePasswordChange(e) {
  if (e && e.preventDefault) e.preventDefault();

  const curPwd = document.getElementById('pwdCurrent')?.value;
  const newPwd = document.getElementById('pwdNew')?.value;
  const conPwd = document.getElementById('pwdConfirm')?.value;
  const alertBox = document.getElementById('pwdAlertBox');

  if (newPwd !== conPwd) {
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
      alertBox.style.color = '#DC2626';
      alertBox.textContent = 'New passwords do not match. Please verify and try again.';
    }
    return;
  }

  if (newPwd.length < 6) {
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
      alertBox.style.color = '#DC2626';
      alertBox.textContent = 'Password must be at least 6 characters.';
    }
    return;
  }

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'change_password',
        current_password: curPwd,
        new_password: newPwd
      })
    });
    const result = await res.json();
    if (result.success) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = 'rgba(16, 185, 129, 0.12)';
        alertBox.style.color = '#059669';
        alertBox.textContent = 'Password updated successfully!';
      }
      if (typeof showToast === 'function') {
        showToast('Password updated successfully!', 'success');
      }
      document.getElementById('pwdCurrent').value = '';
      document.getElementById('pwdNew').value = '';
      document.getElementById('pwdConfirm').value = '';
      setTimeout(() => { if (alertBox) alertBox.style.display = 'none'; }, 4000);
    } else {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
        alertBox.style.color = '#DC2626';
        alertBox.textContent = result.error || 'Password update failed.';
      }
    }
  } catch (err) {
    console.error('Password change error:', err);
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
      alertBox.style.color = '#DC2626';
      alertBox.textContent = 'Server communication error.';
    }
  }
}

async function saveNotificationPreferences() {
  const notifWorkout = document.getElementById('notifWorkout')?.checked ? 1 : 0;
  const notifNutrition = document.getElementById('notifNutrition')?.checked ? 1 : 0;
  const notifCoach = document.getElementById('notifCoach')?.checked ? 1 : 0;
  const notifAnnouncements = document.getElementById('notifAnnouncements')?.checked ? 1 : 0;

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_notifications',
        workout_reminders: notifWorkout,
        nutrition_alerts: notifNutrition,
        coach_messages: notifCoach,
        gym_announcements: notifAnnouncements
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') showToast('Notification preference saved.', 'success');
    } else if (typeof showToast === 'function') {
      showToast(result.message || result.error || 'Unable to save preferences.', 'warning');
    }
  } catch (err) {
    console.warn('Error saving notifications:', err);
  }
}

async function saveTrainerDataPermissions() {
  const pm = document.getElementById('permViewMeasurements')?.checked ? 1 : 0;
  const pn = document.getElementById('permViewNutrition')?.checked ? 1 : 0;
  const pa = document.getElementById('permViewAssessments')?.checked ? 1 : 0;
  const pp = document.getElementById('permViewPhotos')?.checked ? 1 : 0;
  const pw = document.getElementById('permViewWorkouts')?.checked ? 1 : 0;

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_data_permissions',
        can_view_measurements: pm,
        can_view_nutrition: pn,
        can_view_assessments: pa,
        can_view_progress_photos: pp,
        can_view_workouts: pw
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') showToast('Trainer data sharing permissions updated.', 'success');
    } else if (typeof showToast === 'function') {
      showToast(result.message || result.error || 'Could not update data permissions.', 'danger');
    }
  } catch (err) {
    console.warn('Error updating permissions:', err);
  }
}

// ==========================================================================
// MEMBERSHIP & GYMS DIRECTORY CONTROLLER (DB-Backed)
// ==========================================================================
let activeGymFilterChip = 'all';

function setGymFilterChip(filterVal) {
  activeGymFilterChip = filterVal || 'all';
  document.querySelectorAll('#gymFilterChipsRow .filter-chip').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-gym-filter') === activeGymFilterChip);
  });
  renderGymsDirectoryFromCache();
}

function renderGymsDirectoryFromCache() {
  const grid = document.getElementById('gymsDirectoryGrid');
  if (!grid) return;

  const gyms = Array.isArray(window.__USER_GYMS_DIRECTORY__) ? window.__USER_GYMS_DIRECTORY__ : [];
  const current = window.__USER_CURRENT_MEMBERSHIP__ || null;
  const q = (document.getElementById('gymSearchInput')?.value || '').trim().toLowerCase();
  const facFilter = (document.getElementById('gymFacilityFilter')?.value || 'all').trim().toLowerCase();
  const priceFilterRaw = (document.getElementById('gymPriceFilter')?.value || 'all').trim();
  const maxPrice = priceFilterRaw !== 'all' ? parseFloat(priceFilterRaw) : NaN;

  const filtered = gyms.filter(g => {
    const facs = Array.isArray(g.facilities) ? g.facilities : [];
    const hay = [
      g.name, g.city, g.state, g.address_line1, g.description, g.hours_summary,
      ...facs,
      ...(Array.isArray(g.equipment) ? g.equipment : [])
    ].join(' ').toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (facFilter !== 'all' && !facs.some(f => String(f).toLowerCase() === facFilter)) return false;
    if (!Number.isNaN(maxPrice)) {
      const plans = Array.isArray(g.plans) ? g.plans : [];
      if (plans.length === 0 || !plans.some(p => Number(p.price || 0) <= maxPrice)) return false;
    }
    if (activeGymFilterChip !== 'all') {
      if ((g.city || '').toLowerCase() !== activeGymFilterChip.toLowerCase() && !hay.includes(activeGymFilterChip.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: #F8FAFC; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">No Active Partner Gyms Found</h4>
        <p style="font-size: 13px; color: var(--text-secondary); max-width: 440px; margin: 0 auto;">
          ${gyms.length === 0
            ? 'No active gyms are currently open for public discovery. Once a Gym Owner activates their facility, it appears here automatically.'
            : 'No gyms matched your search or filter. Try clearing the search box.'}
        </p>
      </div>`;
    return;
  }

  const imgs = ['assets/images/gym_fitzone.jpg', 'assets/images/gym_powerhouse.jpg', 'assets/images/gym_crossfit.jpg', 'assets/images/gym_elite.jpg'];
  grid.innerHTML = filtered.map((g, idx) => {
    const isCurrentGym = current && parseInt(current.gym_id, 10) === parseInt(g.id, 10);
    const plans = Array.isArray(g.plans) ? g.plans : [];
    const coverImg = g.cover_url || g.logo_url || imgs[idx % imgs.length];
    const facTags = (Array.isArray(g.facilities) ? g.facilities : []).slice(0, 3);
    const eqSummary = (Array.isArray(g.equipment) && g.equipment.length) ? g.equipment.slice(0, 3).join(', ') : '';
    const planButtonsHtml = plans.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-top:6px;">
        <div>
          <div style="font-size:12px;font-weight:700;color:#0F172A;">${escapeHtml(p.name)}</div>
          <div style="font-size:11px;color:#64748B;">${p.duration_months} mo • ₹${Number(p.price || 0).toLocaleString()}</div>
        </div>
        <button type="button" class="btn-primary-block" style="width:auto;padding:6px 12px;font-size:11px;" onclick="openEnrollConfirmationModal(${g.id}, ${p.id}, ${isCurrentGym ? 'true' : 'false'})">
          ${isCurrentGym && current.status === 'active' ? 'Renew / Switch' : (isCurrentGym && current.status === 'pending' ? 'Pending' : 'Enroll')}
        </button>
      </div>
    `).join('');

    const enrollBtnHtml = plans.length > 0
      ? `<button type="button" class="btn-primary-block" style="width: 100%; margin-top: 4px; font-size: 12px;" onclick="openEnrollConfirmationModal(${g.id}, ${plans[0].id}, ${isCurrentGym ? 'true' : 'false'})">${isCurrentGym && current.status === 'active' ? 'Manage / Renew Plan' : (isCurrentGym && current.status === 'pending' ? 'Enrollment Pending Approval' : 'Enroll / Join Gym')}</button>`
      : '';

    return `
      <div class="gym-card">
        <img src="${escapeHtml(coverImg)}" class="gym-card-img" alt="${escapeHtml(g.name)}" onerror="this.src='assets/images/bench_press.jpg'">
        <div class="gym-card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <h4 style="font-size: 15px; font-weight: 700;">${escapeHtml(g.name)}</h4>
            ${isCurrentGym ? `<span class="badge-active">${escapeHtml(String(current.status).toUpperCase())}</span>` : `<span class="stat-badge-pill badge-healthy">Open for Enrollment</span>`}
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${escapeHtml(g.address_line1 || '')}${g.city ? ', ' + escapeHtml(g.city) : ''} • ${g.rating || '4.8'} ★</p>
          <p style="font-size: 11px; color: #64748B; margin-bottom: 4px;">⏰ ${escapeHtml(g.hours_summary || 'Hours configured by gym')} • 📞 ${escapeHtml(g.phone || '--')}</p>
          ${g.description ? `<p style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.4;">${escapeHtml(g.description)}</p>` : ''}
          ${facTags.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;">${facTags.map(f => `<span class="tag-badge">${escapeHtml(f)}</span>`).join('')}</div>` : ''}
          ${eqSummary ? `<div style="font-size:11px;color:#64748B;margin-bottom:8px;">⚙️ ${escapeHtml(eqSummary)}</div>` : ''}
          <div style="margin-top: auto; display: flex; flex-direction: column; gap: 6px;">
            ${planButtonsHtml || '<div style="font-size:12px;color:#64748B;">Contact gym desk for membership pricing.</div>'}
            ${enrollBtnHtml}
            <button type="button" class="btn-secondary" style="width: 100%; font-size: 12px;" onclick="openGymDetailsModal(${g.id})">View Gym Details</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function openEnrollConfirmationModal(gymId, planId = 0, isRenewal = false) {
  const gyms = Array.isArray(window.__USER_GYMS_DIRECTORY__) ? window.__USER_GYMS_DIRECTORY__ : [];
  const g = gyms.find(x => parseInt(x.id, 10) === parseInt(gymId, 10));
  if (!g) return;

  const plans = Array.isArray(g.plans) ? g.plans : [];
  if (plans.length === 0) {
    if (typeof showToast === 'function') showToast('This gym has not published active membership plans yet.', 'warning');
    return;
  }

  document.getElementById('enrollConfirmGymId').value = String(g.id);
  document.getElementById('enrollConfirmIsRenewal').value = isRenewal ? '1' : '0';
  document.getElementById('enrollConfirmGymName').textContent = g.name;
  document.getElementById('enrollConfirmGymLoc').textContent = `${[g.address_line1, g.city, g.state, g.postal_code].filter(Boolean).join(', ')} • ${g.phone || ''}`;
  document.getElementById('enrollConfirmGymHours').textContent = `Hours: ${g.hours_summary || 'See gym desk'}`;

  const sel = document.getElementById('enrollConfirmPlanSelect');
  sel.innerHTML = plans.map(p =>
    `<option value="${p.id}" ${parseInt(p.id, 10) === parseInt(planId, 10) ? 'selected' : ''}>${escapeHtml(p.name)} — ${p.duration_months} month(s) • ₹${Number(p.price || 0).toLocaleString()}</option>`
  ).join('');

  const errBox = document.getElementById('enrollConfirmAlert');
  if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }

  updateEnrollPlanSummary();
  if (typeof openModal === 'function') openModal('enrollConfirmationModal');
}

function updateEnrollPlanSummary() {
  const gymId = parseInt(document.getElementById('enrollConfirmGymId')?.value || '0', 10);
  const planId = parseInt(document.getElementById('enrollConfirmPlanSelect')?.value || '0', 10);
  const gyms = Array.isArray(window.__USER_GYMS_DIRECTORY__) ? window.__USER_GYMS_DIRECTORY__ : [];
  const g = gyms.find(x => parseInt(x.id, 10) === gymId);
  const plan = (g && Array.isArray(g.plans)) ? g.plans.find(p => parseInt(p.id, 10) === planId) : null;
  const sumEl = document.getElementById('enrollConfirmPlanSummary');
  if (!sumEl) return;
  if (!plan) {
    sumEl.textContent = 'Select a membership plan above.';
    return;
  }
  sumEl.innerHTML = `
    <strong>${escapeHtml(plan.name)}</strong> (${plan.duration_months} month${plan.duration_months > 1 ? 's' : ''}) — <strong>₹${Number(plan.price || 0).toLocaleString()}</strong><br>
    <span style="font-size:11px;">Submitting creates a <strong>Pending</strong> enrollment request in MySQL. Your membership activates after Gym Owner approval.</span>
  `;
}

async function confirmSubmitEnrollment() {
  const gymId = parseInt(document.getElementById('enrollConfirmGymId')?.value || '0', 10);
  const planId = parseInt(document.getElementById('enrollConfirmPlanSelect')?.value || '0', 10);
  const isRenewal = document.getElementById('enrollConfirmIsRenewal')?.value === '1';
  const btn = document.getElementById('btnConfirmEnrollment');
  const errBox = document.getElementById('enrollConfirmAlert');
  if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }
  if (!gymId || !planId) return;

  if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
  try {
    const res = await fetch('api/user/membership.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: isRenewal ? 'renew' : 'request',
        gym_id: gymId,
        plan_id: planId
      })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      if (typeof closeModal === 'function') closeModal('enrollConfirmationModal');
      if (typeof showToast === 'function') showToast(json.message || 'Enrollment request submitted!', 'success');
      await loadMembershipPortalData();
      if (typeof syncUserDashboardFromDb === 'function') await syncUserDashboardFromDb();
    } else {
      const msg = json.message || json.error || 'Unable to submit enrollment request.';
      if (errBox) { errBox.style.display = 'block'; errBox.textContent = msg; }
      else if (typeof showToast === 'function') showToast(msg, 'danger');
    }
  } catch (err) {
    if (errBox) { errBox.style.display = 'block'; errBox.textContent = 'Network error while submitting enrollment.'; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Enrollment Request'; }
  }
}

function openGymDetailsModal(gymId) {
  const gyms = Array.isArray(window.__USER_GYMS_DIRECTORY__) ? window.__USER_GYMS_DIRECTORY__ : [];
  const g = gyms.find(x => parseInt(x.id, 10) === parseInt(gymId, 10));
  if (!g) return;

  const current = window.__USER_CURRENT_MEMBERSHIP__ || null;
  const isCurrent = current && parseInt(current.gym_id, 10) === parseInt(g.id, 10);

  const hTitle = document.getElementById('gymModalHeaderTitle');
  const cover = document.getElementById('gymModalCoverImg');
  const gName = document.getElementById('gymModalGymName');
  const badge = document.getElementById('gymModalStatusBadge');
  const desc = document.getElementById('gymModalDescription');
  const box = document.getElementById('gymModalDetailsBox');
  const plansBox = document.getElementById('gymModalPlansBox');
  const primaryBtn = document.getElementById('gymModalPrimaryActionBtn');

  if (hTitle) hTitle.textContent = `${g.name}${g.city ? ' – ' + g.city : ''}`;
  if (cover) cover.src = g.cover_url || g.logo_url || 'assets/images/gym_fitzone.jpg';
  if (gName) gName.textContent = g.name;
  if (badge) badge.textContent = isCurrent ? `${String(current.status).toUpperCase()} MEMBER` : String(g.status || 'active').toUpperCase();
  if (desc) desc.textContent = g.description || 'Verified FitSync partner fitness facility.';

  const hoursLines = Array.isArray(g.operating_hours) && g.operating_hours.length
    ? g.operating_hours.map(h => `${h.day_label}: ${h.is_closed ? 'Closed' : `${h.open_time}–${h.close_time}`}`).join(' | ')
    : (g.hours_summary || 'See gym desk');

  if (box) {
    box.innerHTML = `
      <div>📍 <strong>Address:</strong> ${escapeHtml([g.address_line1, g.address_line2, g.city, g.state, g.postal_code].filter(Boolean).join(', '))}</div>
      <div>📞 <strong>Contact:</strong> ${escapeHtml(g.phone || '--')} • ${escapeHtml(g.email || '--')}</div>
      <div>⏰ <strong>Operating Hours:</strong> ${escapeHtml(hoursLines)}</div>
      <div>🏋️ <strong>Facilities:</strong> ${escapeHtml((g.facilities && g.facilities.length) ? g.facilities.join(', ') : 'General Gym Floor')}</div>
      <div>⚙️ <strong>Equipment:</strong> ${escapeHtml((g.equipment && g.equipment.length) ? g.equipment.join(', ') : 'Standard Free Weights & Machines')}</div>
    `;
  }

  const plans = Array.isArray(g.plans) ? g.plans : [];
  if (plansBox) {
    plansBox.innerHTML = plans.length
      ? `<strong style="font-size:12px;color:#0F172A;">Available Membership Plans:</strong>` + plans.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid #E2E8F0;border-radius:8px;background:#fff;">
          <div style="font-size:12px;"><strong>${escapeHtml(p.name)}</strong> (${p.duration_months} mo) — ₹${Number(p.price || 0).toLocaleString()}</div>
          <button type="button" class="btn-primary-block" style="width:auto;padding:5px 12px;font-size:11px;" onclick="requestGymMembership(${g.id}, ${p.id}, ${isCurrent ? 'true' : 'false'}); closeModal('gymDetailsModal');">Request Membership</button>
        </div>`).join('')
      : '<div style="font-size:12px;color:#64748B;">No membership plans published yet.</div>';
  }

  if (primaryBtn) {
    primaryBtn.style.display = (isCurrent && current.status === 'active') ? 'inline-flex' : 'none';
  }

  if (typeof openModal === 'function') openModal('gymDetailsModal');
}

async function loadMembershipPortalData() {
  try {
    const res = await fetch('api/user/membership.php', { cache: 'no-store' });
    if (!res.ok) return;
    const json = await res.json();
    if (!json.success || !json.data) return;

    const current = json.data.current_membership || null;
    const history = Array.isArray(json.data.history) ? json.data.history : [];
    const gyms = Array.isArray(json.data.gyms) ? json.data.gyms : [];
    window.__USER_GYMS_DIRECTORY__ = gyms;
    window.__USER_CURRENT_MEMBERSHIP__ = current;

    const badgeEl = document.getElementById('memBannerBadge');
    const titleEl = document.getElementById('memBannerTitle');
    const metaEl = document.getElementById('memBannerMeta');
    const extraEl = document.getElementById('memBannerExtra');
    const actionsEl = document.getElementById('memBannerActions');

    if (current) {
      const st = String(current.status || 'pending').toUpperCase();
      if (badgeEl) {
        badgeEl.textContent = st;
        badgeEl.style.background = st === 'ACTIVE' ? '#DCFCE7' : (st === 'PENDING' ? '#FEF3C7' : '#FEE2E2');
        badgeEl.style.color = st === 'ACTIVE' ? '#166534' : (st === 'PENDING' ? '#92400E' : '#991B1B');
      }
      if (titleEl) {
        titleEl.textContent = `${current.gym_name || 'FitSync Partner Gym'} — ${current.plan_name || 'Membership Plan'}`;
      }
      if (metaEl) {
        metaEl.textContent = `Requested: ${(current.created_at || current.start_date || '--').slice(0, 10)} • Valid Till: ${current.end_date || 'Pending Approval'} • Amount: ₹${Number(current.price || 0).toLocaleString()} • Pass Token: ${current.qr_code_token || 'Pending'}`;
      }
      if (extraEl) {
        let ownerResp = 'Awaiting Gym Owner review';
        if (st === 'ACTIVE') ownerResp = current.approved_at ? `Approved ${String(current.approved_at).slice(0, 16)}` : 'Approved & Active';
        else if (st === 'REJECTED') ownerResp = current.rejection_reason ? `Declined: ${current.rejection_reason}` : 'Declined by Gym Owner';
        else if (st === 'EXPIRED') ownerResp = 'Membership term ended';
        else if (st === 'CANCELLED') ownerResp = 'Cancelled';

        const coachHtml = current.assigned_coach_name
          ? `<span>Assigned Coach: <strong>${escapeHtml(current.assigned_coach_name)}</strong></span> <button type="button" class="btn-secondary" style="padding:3px 9px;font-size:11px;" onclick="switchView('coach_chat')">Message Coach</button>`
          : `<span>Assigned Coach: <strong>Unassigned</strong></span>`;
        extraEl.innerHTML = `<span>Owner Response: <strong>${escapeHtml(ownerResp)}</strong></span> • ${coachHtml}`;
      }
      if (actionsEl) {
        let btns = '';
        if (st === 'ACTIVE') {
          btns += `<button type="button" class="btn-primary-block" style="width: auto; padding: 8px 18px;" onclick="switchView('attendance')">Open Turnstile Pass</button>`;
          btns += `<button type="button" class="btn-secondary" style="padding: 8px 16px;" onclick="openEnrollConfirmationModal(${current.gym_id}, ${current.plan_id}, true)">Renew Plan</button>`;
        }
        if (st === 'ACTIVE' || st === 'PENDING') {
          btns += `<button type="button" class="btn-secondary" style="padding: 8px 14px; color: #DC2626; border-color: rgba(239,68,68,0.35);" onclick="cancelMyMembership(${current.id})">Cancel</button>`;
        }
        actionsEl.innerHTML = btns;
      }
    } else {
      if (badgeEl) {
        badgeEl.textContent = 'NO MEMBERSHIP';
        badgeEl.style.background = '#E2E8F0';
        badgeEl.style.color = '#475569';
      }
      if (titleEl) titleEl.textContent = 'No Active Gym Membership';
      if (metaEl) metaEl.textContent = 'Select a verified gym branch below to enroll or renew your membership.';
      if (extraEl) extraEl.innerHTML = '';
      if (actionsEl) actionsEl.innerHTML = '';
    }

    // Populate facility filter dropdown dynamically
    const facSel = document.getElementById('gymFacilityFilter');
    if (facSel) {
      const curFac = facSel.value || 'all';
      const facs = Array.from(new Set(gyms.flatMap(g => Array.isArray(g.facilities) ? g.facilities : []).filter(Boolean))).sort();
      facSel.innerHTML = '<option value="all">All Facilities</option>' +
        facs.map(f => `<option value="${escapeHtml(f)}" ${curFac === f ? 'selected' : ''}>${escapeHtml(f)}</option>`).join('');
    }

    // Populate filter chips dynamically from real DB cities
    const chipsRow = document.getElementById('gymFilterChipsRow');
    if (chipsRow) {
      const cities = Array.from(new Set(gyms.map(g => g.city).filter(Boolean))).slice(0, 4);
      chipsRow.innerHTML = `<button type="button" class="filter-chip ${activeGymFilterChip === 'all' ? 'active' : ''}" data-gym-filter="all" onclick="setGymFilterChip('all')">All Branches (${gyms.length})</button>` +
        cities.map(c => `<button type="button" class="filter-chip ${activeGymFilterChip === c ? 'active' : ''}" data-gym-filter="${escapeHtml(c)}" onclick="setGymFilterChip('${escapeHtml(c)}')">${escapeHtml(c)}</button>`).join('');
    }

    renderGymsDirectoryFromCache();
    renderMembershipHistory(history);
    await loadUserInvitations();
  } catch (err) {
    console.warn('Failed to load membership portal:', err);
  }
}

async function loadUserInvitations() {
  const sec = document.getElementById('memberGymInvitationsSection');
  const listEl = document.getElementById('memberGymInvitationsList');
  const badgeEl = document.getElementById('memberInvitationsCountBadge');
  if (!sec || !listEl) return;

  try {
    const res = await fetch('api/user/invitations.php', { cache: 'no-store' });
    if (!res.ok) return;
    const json = await res.json();
    const invs = Array.isArray(json.data?.invitations) ? json.data.invitations : [];
    const emailVerified = Boolean(json.data?.email_verified);

    if (invs.length === 0) {
      sec.style.display = 'none';
      return;
    }

    sec.style.display = 'block';
    if (badgeEl) badgeEl.textContent = `${invs.length} Pending`;

    listEl.innerHTML = invs.map(inv => `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:12px 14px;background:#fff;border:1px solid #FDE68A;border-radius:10px;">
        <div>
          <div style="font-size:14px;font-weight:700;color:#0F172A;">${escapeHtml(inv.gym_name)} ${inv.gym_city ? `<span style="font-weight:500;color:#64748B;">(${escapeHtml(inv.gym_city)})</span>` : ''}</div>
          <div style="font-size:12px;color:#475569;margin-top:2px;">
            Plan: <strong>${escapeHtml(inv.plan_name || 'Standard Membership')}</strong>
            ${inv.plan_price ? ` • ₹${Number(inv.plan_price).toLocaleString()}` : ''}
            ${inv.trainer_name ? ` • Coach: <strong>${escapeHtml(inv.trainer_name)}</strong>` : ''}
            • Invited by ${escapeHtml(inv.invited_by_name || 'Gym Owner')}
          </div>
          ${!emailVerified ? `<div style="font-size:11px;color:#DC2626;margin-top:4px;">Verify your email before accepting this invitation. <a href="javascript:void(0)" onclick="promptMemberEmailVerification()" style="color:#2563EB;font-weight:600;">Verify Email Now</a></div>` : ''}
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" class="btn-primary-block" style="width:auto;padding:7px 14px;font-size:12px;" onclick="respondGymInvitation(${inv.id}, 'accept')">Accept Invitation</button>
          <button type="button" class="btn-secondary" style="padding:7px 12px;font-size:12px;color:#DC2626;" onclick="respondGymInvitation(${inv.id}, 'reject')">Decline</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('loadUserInvitations err:', err);
  }
}

async function promptMemberEmailVerification() {
  try {
    const r1 = await fetch('api/auth/verify_email.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend' })
    });
    const j1 = await r1.json();
    const hint = j1.data?.verification_code ? ` (Dev code: ${j1.data.verification_code})` : '';
    const code = prompt(`Enter the 6-digit verification code sent to your email${hint}:`);
    if (!code) return;
    const r2 = await fetch('api/auth/verify_email.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', code: code.trim() })
    });
    const j2 = await r2.json();
    alert(j2.message || (j2.success ? 'Email verified!' : 'Verification failed.'));
    if (j2.success) await loadUserInvitations();
  } catch (err) {
    alert('Unable to verify email.');
  }
}

async function respondGymInvitation(invitationId, decision) {
  try {
    const res = await fetch('api/user/invitations.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitation_id: invitationId, decision })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || 'Unable to process invitation.');
      if (json.message && json.message.toLowerCase().includes('verify your email')) {
        await promptMemberEmailVerification();
      }
      return;
    }
    alert(json.message || 'Invitation updated!');
    await loadMembershipPortalData();
    await loadUserDashboardData();
  } catch (err) {
    alert('Network error while responding to invitation.');
  }
}

function renderMembershipHistory(history) {
  const container = document.getElementById('memberEnrollmentHistoryContainer');
  const countBadge = document.getElementById('memHistoryCountBadge');
  const list = Array.isArray(history) ? history : [];
  if (countBadge) countBadge.textContent = `${list.length} Record${list.length === 1 ? '' : 's'}`;
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<div style="padding: 18px; text-align: center; color: #64748B; font-size: 13px;">No enrollment requests submitted yet. Choose a gym above and click Enroll to get started.</div>';
    return;
  }

  container.innerHTML = `
    <table class="fs-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="text-align: left; border-bottom: 1px solid #E2E8F0; color: #64748B;">
          <th style="padding: 8px 10px;">GYM</th>
          <th style="padding: 8px 10px;">SELECTED PLAN</th>
          <th style="padding: 8px 10px;">REQUEST DATE</th>
          <th style="padding: 8px 10px;">STATUS</th>
          <th style="padding: 8px 10px;">OWNER RESPONSE</th>
          <th style="padding: 8px 10px;">ASSIGNED COACH</th>
          <th style="padding: 8px 10px; text-align: right;">ACTION</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(h => {
          const st = String(h.status || 'pending').toUpperCase();
          const stStyle = st === 'ACTIVE'
            ? 'background:#DCFCE7;color:#166534;'
            : (st === 'PENDING' ? 'background:#FEF3C7;color:#92400E;' : 'background:#FEE2E2;color:#991B1B;');
          let resp = 'Pending Owner Review';
          if (st === 'ACTIVE') resp = h.approved_at ? `Approved ${String(h.approved_at).slice(0, 10)}` : 'Approved';
          else if (st === 'REJECTED') resp = h.rejection_reason ? `Declined: ${h.rejection_reason}` : 'Declined';
          else if (st === 'CANCELLED') resp = 'Cancelled by member';
          else if (st === 'EXPIRED') resp = `Ended ${h.end_date || ''}`;

          const coachHtml = h.assigned_coach_name
            ? `<strong>${escapeHtml(h.assigned_coach_name)}</strong>`
            : '<span style="color:#64748B;">Unassigned</span>';
          const actionBtn = (st === 'ACTIVE' || st === 'PENDING')
            ? `<button type="button" class="btn-secondary" style="padding:3px 8px;font-size:11px;color:#DC2626;" onclick="cancelMyMembership(${h.id})">Cancel</button>`
            : '--';

          return `
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 8px 10px;"><strong>${escapeHtml(h.gym_name || 'Gym')}</strong><div style="font-size:11px;color:#64748B;">${escapeHtml(h.gym_city || '')}</div></td>
              <td style="padding: 8px 10px;">${escapeHtml(h.plan_name || 'Plan')}<div style="font-size:11px;color:#64748B;">₹${Number(h.price || 0).toLocaleString()}</div></td>
              <td style="padding: 8px 10px;">${escapeHtml((h.created_at || h.start_date || '--').slice(0, 10))}</td>
              <td style="padding: 8px 10px;"><span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;${stStyle}">${escapeHtml(st)}</span></td>
              <td style="padding: 8px 10px;">${escapeHtml(resp)}</td>
              <td style="padding: 8px 10px;">${coachHtml}</td>
              <td style="padding: 8px 10px; text-align: right;">${actionBtn}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}

async function requestGymMembership(gymId, planId, isRenewal = false) {
  try {
    const res = await fetch('api/user/membership.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: isRenewal ? 'renew' : 'request',
        gym_id: gymId,
        plan_id: planId
      })
    });
    const json = await res.json();
    if (json.success) {
      if (typeof showToast === 'function') showToast(json.message || 'Membership request submitted!', 'success');
      loadMembershipPortalData();
      if (typeof syncUserDashboardFromDb === 'function') syncUserDashboardFromDb();
    } else {
      if (typeof showToast === 'function') showToast(json.message || json.error || 'Membership request failed.', 'danger');
    }
  } catch (err) {
    console.warn('Membership request err:', err);
  }
}

async function cancelMyMembership(membershipId) {
  if (!confirm('Are you sure you want to cancel this gym membership? Turnstile check-in access will be disabled.')) return;
  try {
    const res = await fetch('api/user/membership.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cancel',
        membership_id: membershipId
      })
    });
    const json = await res.json();
    if (json.success) {
      if (typeof showToast === 'function') showToast(json.message || 'Membership cancelled.', 'info');
      loadMembershipPortalData();
      if (typeof syncUserDashboardFromDb === 'function') syncUserDashboardFromDb();
    } else {
      if (typeof showToast === 'function') showToast(json.message || json.error || 'Unable to cancel membership.', 'danger');
    }
  } catch (err) {
    console.warn('Cancel membership err:', err);
  }
}

// ==========================================================================
// ASSIGNED WORKOUT SYNCHRONIZATION & SESSION LOGGING (DB-Backed)
// ==========================================================================
function applyServerWorkoutData(workoutData) {
  if (!workoutData) return;
  window.__LATEST_WORKOUT_DATA__ = workoutData;

  const activePlan = workoutData.plan || workoutData.active_plan || null;
  const days = Array.isArray(workoutData.days) ? workoutData.days : [];
  const sessions = Array.isArray(workoutData.sessions) ? workoutData.sessions : (Array.isArray(workoutData.completed_sessions) ? workoutData.completed_sessions : []);

  // Map server assigned plan days into FitSyncStore's workoutPlans structure if present
  if (activePlan && days.length > 0 && window.fitSyncStore?.state?.workouts) {
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const mappedPlans = {};
    days.forEach((day, idx) => {
      const key = dayKeys[(parseInt(day.day_number || idx + 1, 10) - 1) % 7] || `day${idx + 1}`;
      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      mappedPlans[key] = {
        planDayId: day.id,
        dayName: day.focus_area || day.day_name || `Day ${day.day_number || idx + 1}`,
        dayKey: key,
        isRest: exercises.length === 0,
        exercises: exercises.map(ex => {
          const targetSets = parseInt(ex.target_sets || 3, 10);
          const repsVal = parseInt(String(ex.target_reps || '10').replace(/[^\d].*$/, ''), 10) || 10;
          const setsArr = [];
          for (let s = 1; s <= targetSets; s++) {
            setsArr.push({
              set: s,
              reps: repsVal,
              weight: ex.target_weight_kg && parseFloat(ex.target_weight_kg) > 0 ? parseFloat(ex.target_weight_kg) : 'Bodyweight',
              done: false,
              exerciseId: ex.exercise_id,
              planDayId: day.id
            });
          }
          return {
            exercise_id: ex.exercise_id,
            plan_day_id: day.id,
            name: ex.exercise_name || ex.name || 'Exercise',
            muscle: ex.muscle_group_name || ex.muscle_group || 'Full Body',
            equipment: ex.equipment_required || ex.equipment_needed || 'Gym Equipment',
            target: `Target: ${targetSets} sets × ${ex.target_reps || '10'} reps`,
            image: ex.image_path || 'assets/images/bench_press.jpg',
            sets: setsArr
          };
        })
      };
    });

    window.fitSyncStore.state.workouts.assignedPlanTitle = activePlan.plan_name || activePlan.name || activePlan.title || 'Assigned Training Plan';
    window.fitSyncStore.state.workouts.assignedPlanMeta = `${activePlan.goal || activePlan.goal_focus || 'Strength'} • Coach: ${activePlan.trainer_name || 'Assigned Coach'}`;
    window.fitSyncStore.state.workouts.plans = Object.assign({}, window.fitSyncStore.state.workouts.plans || {}, mappedPlans);

    const firstActiveKey = Object.keys(mappedPlans)[0];
    if (firstActiveKey && document.getElementById('view-workouts')?.classList.contains('active')) {
      if (typeof renderWorkoutExercises === 'function') {
        renderWorkoutExercises(mappedPlans[firstActiveKey]);
      }
      if (typeof updateWorkoutHeaderStats === 'function') {
        updateWorkoutHeaderStats(mappedPlans[firstActiveKey]);
      }
    }
  }

  renderWorkoutModalList(workoutData);
  renderCompletedWorkoutsHistory(sessions);
}

async function loadWorkoutPlanFromDb() {
  try {
    const res = await fetch('api/workouts.php');
    if (!res.ok) return;
    const json = await res.json();
    if (json.success && json.data) {
      applyServerWorkoutData(json.data);
    }
  } catch (err) {
    console.warn('Workout load error:', err);
  }
}

function renderWorkoutModalList(workoutData) {
  const listEl = document.getElementById('workoutModalExerciseList');
  const headingEl = document.getElementById('workoutModalHeading');
  if (!listEl) return;

  const days = workoutData && Array.isArray(workoutData.days) ? workoutData.days : [];
  const activePlan = workoutData ? (workoutData.plan || workoutData.active_plan) : null;

  if (!activePlan || days.length === 0) {
    if (headingEl) headingEl.textContent = 'Assigned Routine Exercises';
    listEl.innerHTML = `
      <div style="padding: 16px; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 10px; font-size: 13px; color: #64748B; text-align: center;">
        No coach workout plan assigned yet. You can still log a custom workout session by clicking Complete Session below.
      </div>`;
    return;
  }

  const firstDay = workoutData.today_day || days[0];
  const exercises = Array.isArray(firstDay.exercises) ? firstDay.exercises : [];
  if (headingEl) headingEl.textContent = `${activePlan.plan_name || activePlan.name || activePlan.title || 'Workout'} — ${firstDay.focus_area || firstDay.day_name || 'Day 1'}`;

  if (exercises.length === 0) {
    listEl.innerHTML = `<div style="padding:12px;color:#64748B;font-size:13px;">No exercises listed on this training day.</div>`;
    return;
  }

  listEl.innerHTML = exercises.map((ex, i) => `
    <label style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;cursor:pointer;">
      <span style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" class="wk-modal-ex-cb" data-idx="${i}" data-ex-id="${ex.exercise_id || ''}" data-ex-name="${escapeHtml(ex.exercise_name || ex.name)}" data-sets="${ex.target_sets || 3}" data-reps="${escapeHtml(ex.target_reps || '10')}" data-weight="${ex.target_weight_kg || 0}" checked>
        <span>
          <strong style="font-size:13px;color:#0F172A;display:block;">${escapeHtml(ex.exercise_name || ex.name)}</strong>
          <small style="font-size:11px;color:#64748B;">${ex.target_sets || 3} sets × ${escapeHtml(ex.target_reps || '10')} reps ${ex.target_weight_kg ? '@ ' + ex.target_weight_kg + ' kg' : ''}</small>
        </span>
      </span>
      <span class="fs-badge fs-badge-blue">${escapeHtml(ex.muscle_group_name || ex.muscle_group || 'Training')}</span>
    </label>
  `).join('');
}

async function completeWorkoutModalSession() {
  const btn = document.getElementById('btnCompleteWorkoutSession');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving Session...';
  }

  try {
    const checkboxes = Array.from(document.querySelectorAll('.wk-modal-ex-cb:checked'));
    const exercisesPayload = checkboxes.map(cb => {
      const setsCount = parseInt(cb.getAttribute('data-sets') || '3', 10);
      const repsVal = parseInt(String(cb.getAttribute('data-reps') || '10').replace(/[^\d].*$/, ''), 10) || 10;
      const wtVal = parseFloat(cb.getAttribute('data-weight') || '0') || 0;
      const setsArr = [];
      for (let s = 1; s <= setsCount; s++) {
        setsArr.push({ set: s, reps: repsVal, weight: wtVal });
      }
      return {
        exercise_id: parseInt(cb.getAttribute('data-ex-id') || '0', 10) || null,
        name: cb.getAttribute('data-ex-name') || 'Training Exercise',
        sets: setsArr
      };
    });

    const latestWk = window.__LATEST_WORKOUT_DATA__ || {};
    const firstDayId = latestWk.days && latestWk.days[0] ? latestWk.days[0].id : null;

    const res = await fetch('api/workouts.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete_session',
        plan_day_id: firstDayId,
        duration_minutes: 45,
        notes: 'Completed via Member Workout Player',
        exercises: exercisesPayload
      })
    });
    const json = await res.json();
    if (json.success) {
      if (typeof showToast === 'function') showToast(json.message || 'Workout session saved to database!', 'success');
      if (typeof closeAllModals === 'function') closeAllModals();
      await loadWorkoutPlanFromDb();
      if (typeof syncUserDashboardFromDb === 'function') syncUserDashboardFromDb();
    } else {
      if (typeof showToast === 'function') showToast(json.message || json.error || 'Failed to save workout session.', 'danger');
    }
  } catch (err) {
    console.warn('Complete workout error:', err);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Complete Session';
    }
  }
}

function renderCompletedWorkoutsHistory(sessions) {
  const container = document.getElementById('wkCompletedHistoryContainer');
  const badge = document.getElementById('wkSessionsCountBadge');
  const list = Array.isArray(sessions) ? sessions : [];
  if (badge) badge.textContent = `${list.length} ${list.length === 1 ? 'Session' : 'Sessions'}`;
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = 'No completed workout sessions recorded yet.';
    return;
  }

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${list.map(s => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">
          <div>
            <div style="font-weight:700;color:#0F172A;font-size:13px;">${escapeHtml(s.plan_title || s.focus_area || 'Training Session')}</div>
            <div style="font-size:11px;color:#64748B;">${escapeHtml(s.completed_at || s.started_at || '')} • ${s.duration_minutes || 45} mins</div>
          </div>
          <div style="text-align:right;">
            <span class="fs-badge fs-badge-green">${Number(s.total_volume_kg || 0).toLocaleString()} kg volume</span>
          </div>
        </div>
      `).join('')}
    </div>`;
}

// Window exports
window.stepValue = stepValue;
window.loadAttendanceCalendar = loadAttendanceCalendar;
window.renderAttendanceCalendarGrid = renderAttendanceCalendarGrid;
window.changeCalendarMonth = changeCalendarMonth;
window.handleCalendarCheckIn = handleCalendarCheckIn;
window.loadUserProfileData = loadUserProfileData;
window.renderMilestonesTable = renderMilestonesTable;
window.saveBodyStatsAndRecalculate = saveBodyStatsAndRecalculate;
window.toggleMilestoneForm = toggleMilestoneForm;
window.saveMilestoneMeasurement = saveMilestoneMeasurement;
window.deleteMilestoneMeasurement = deleteMilestoneMeasurement;
window.handleSaveProfileDetails = handleSaveProfileDetails;
window.handleProfilePasswordChange = handleProfilePasswordChange;
window.saveNotificationPreferences = saveNotificationPreferences;
window.saveTrainerDataPermissions = saveTrainerDataPermissions;
window.loadMembershipPortalData = loadMembershipPortalData;
window.requestGymMembership = requestGymMembership;
window.cancelMyMembership = cancelMyMembership;
window.loadWorkoutPlanFromDb = loadWorkoutPlanFromDb;
window.applyServerWorkoutData = applyServerWorkoutData;
window.renderWorkoutModalList = renderWorkoutModalList;
window.completeWorkoutModalSession = completeWorkoutModalSession;
window.renderCompletedWorkoutsHistory = renderCompletedWorkoutsHistory;
window.pollCoachChatMessages = pollCoachChatMessages;
window.retryCoachMessage = retryCoachMessage;
window.clearCoachChatHistory = clearCoachChatHistory;
window.openEditMealModal = openEditMealModal;
window.resetMealForm = resetMealForm;
window.deleteMealEntry = deleteMealEntry;
window.renderWaterLogs = renderWaterLogs;
window.deleteWaterEntry = deleteWaterEntry;
