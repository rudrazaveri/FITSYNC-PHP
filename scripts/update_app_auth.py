with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Locate handleSignInSubmit to openDataStorageModal block
import re

start_target = "function handleSignInSubmit(e) {"
end_target = "function openDataStorageModal() {\n  openModal('dataStorageModal');\n}"

start_pos = js.find(start_target)
end_pos = js.find(end_target)

if start_pos == -1 or end_pos == -1:
    raise Exception("Could not find auth functions block in js/app.js")

end_pos = end_pos + len(end_target)

replacement = """async function handleSignInSubmit(e) {
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
        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }
      }

      // Member / User role: update client store and enter application
      if (window.fitSyncStore) {
        window.fitSyncStore.login(email, password, remember);
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
        showNotification(`Welcome back to FitSync, ${data.user.full_name || data.user.name}!`);
      }
      return;
    } else if (data && !data.success) {
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.innerText = data.message || 'Invalid email or password.';
      } else {
        alert(data.message || 'Invalid email or password.');
      }
      return;
    }
  } catch (err) {
    console.warn('[FitSync Auth] API unreachable, falling back to local client store:', err);
  }

  // Graceful fallback for local offline / static server demo
  if (window.fitSyncStore) {
    window.fitSyncStore.login(email, password, remember);
    initAuthSystem();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
    if (typeof showNotification === 'function') {
      showNotification(`Welcome back to FitSync AI, ${window.fitSyncStore.state.user.name}!`);
    }
  }
}

async function handleRegisterSubmit(e) {
  if (e) e.preventDefault();
  const alertEl = document.getElementById('authRegisterAlert');
  if (alertEl) { alertEl.style.display = 'none'; alertEl.innerText = ''; }

  const fullName = document.getElementById('regFullName')?.value?.trim();
  const email = document.getElementById('regEmail')?.value?.trim();
  const phone = document.getElementById('regPhone')?.value?.trim();
  const avatarUrl = document.getElementById('regAvatarUrl')?.value;
  const password = document.getElementById('regPassword')?.value;
  const confirmPassword = document.getElementById('regConfirmPassword')?.value;
  const role = document.getElementById('regRoleInput')?.value || 'member';
  const gender = document.getElementById('regGender')?.value;
  const age = document.getElementById('regAge')?.value;
  const height = document.getElementById('regHeight')?.value;
  const weight = document.getElementById('regWeight')?.value;
  const goal = document.getElementById('regGoal')?.value;
  const activityLevel = document.getElementById('regActivity')?.value;
  const gymBranch = document.getElementById('regGymBranchInput')?.value;
  const gymLocation = document.getElementById('regGymLocationInput')?.value;

  if (password !== confirmPassword) {
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Passwords do not match. Please verify your password.';
    } else {
      alert('Passwords do not match. Please verify your password.');
    }
    return;
  }

  if (password.length < 6) {
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Password must be at least 6 characters.';
    } else {
      alert('Password must be at least 6 characters.');
    }
    return;
  }

  // Attempt backend database registration
  try {
    const res = await fetch('api/auth/register.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        full_name: fullName,
        email: email,
        phone: phone,
        password: password,
        gender: gender,
        height: height,
        weight: weight,
        activityLevel: activityLevel,
        gymBranch: gymBranch,
        gymLocation: gymLocation
      })
    });

    const data = await res.json().catch(() => null);

    if (data && data.success) {
      if (window.fitSyncStore) {
        window.fitSyncStore.register({
          fullName, email, phone, avatarUrl, role: 'member',
          gender, age, height, weight, goal, activityLevel,
          gymBranch, gymLocation
        });
        if (data.user && window.fitSyncStore.state && window.fitSyncStore.state.user) {
          window.fitSyncStore.state.user.id = data.user.id;
          window.fitSyncStore.state.user.name = data.user.full_name || fullName;
          window.fitSyncStore.state.user.email = data.user.email;
          if (typeof window.fitSyncStore.save === 'function') window.fitSyncStore.save();
        }
      }

      initAuthSystem();
      if (typeof updateDashboardUI === 'function') updateDashboardUI();
      if (typeof showNotification === 'function') {
        showNotification(`Profile created! Welcome to FitSync, ${fullName}.`);
      }
      return;
    } else if (data && !data.success) {
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.innerText = data.message || 'Registration failed.';
      } else {
        alert(data.message || 'Registration failed.');
      }
      return;
    }
  } catch (err) {
    console.warn('[FitSync Auth] API unreachable, attempting local client registration fallback:', err);
  }

  // Fallback for static offline demo
  if (window.fitSyncStore) {
    window.fitSyncStore.register({
      fullName, email, phone, avatarUrl, role,
      gender, age, height, weight, goal, activityLevel,
      gymBranch, gymLocation
    });
    initAuthSystem();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
    if (typeof showNotification === 'function') {
      showNotification(`Profile created! Welcome to FitSync AI, ${fullName}.`);
    }
  }
}

async function loginDemoAccount(key) {
  let email = 'ritika@fitsync.health';

  if (key === 'ritika') {
    email = 'ritika@fitsync.health';
  } else if (key === 'coach') {
    email = 'coach@fitsync.health';
  } else if (key === 'owner') {
    email = 'owner@fitzone.com';
  } else if (key === 'admin') {
    email = 'admin@fitsync.com';
  } else if (key === 'aarav') {
    email = 'aarav.patel@fitsync.ai';
  } else {
    email = 'isha.kulkarni@fitsync.com';
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
        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }
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

  // Fallback
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

  initAuthSystem();
  switchAuthTab('signin');

  if (typeof showNotification === 'function') {
    showNotification('You have logged out safely. Enter your credentials or use 1-Click Demo.');
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
  window.location.href = 'forgot_password.php';
}

function openDataStorageModal() {
  openModal('dataStorageModal');
}"""

updated_js = js[:start_pos] + replacement + js[end_pos:]

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(updated_js)

print("Updated js/app.js with database auth integration successfully!")
