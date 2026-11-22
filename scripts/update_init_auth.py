with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_init = """function initAuthSystem() {
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
}"""

new_init = """function initAuthSystem() {
  const store = window.fitSyncStore;
  if (!store) return;

  const authOverlay = document.getElementById('authDashboardOverlay');
  const appLayout = document.querySelector('.app-layout');

  // Synchronize with server-side authenticated session if present
  if (window.__AUTHENTICATED_USER__) {
    store.state.isLoggedIn = true;
    if (store.state.user) {
      store.state.user.id = window.__AUTHENTICATED_USER__.id;
      store.state.user.name = window.__AUTHENTICATED_USER__.full_name || window.__AUTHENTICATED_USER__.name;
      store.state.user.email = window.__AUTHENTICATED_USER__.email;
      store.state.user.role = window.__AUTHENTICATED_USER__.role;
    }
  }

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
    if (window.__INITIAL_VIEW__ && typeof switchView === 'function') {
      switchView(window.__INITIAL_VIEW__);
    }
  }
}"""

assert old_init in js, "old_init pattern not found in js/app.js"
js = js.replace(old_init, new_init)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated initAuthSystem() in js/app.js successfully!")
