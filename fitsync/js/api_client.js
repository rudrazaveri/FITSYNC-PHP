/**
 * FitSync AI — Shared Authoritative Session & CSRF Fetch Interceptor
 * Automatically attaches X-CSRF-Token to mutating API calls, handles 401/403 cleanly,
 * and enforces server-authenticated session state across all portals.
 */
(function () {
  if (window.__FITSYNC_API_CLIENT_INSTALLED__) return;
  window.__FITSYNC_API_CLIENT_INSTALLED__ = true;

  window.__FITSYNC_CSRF_TOKEN__ = '';
  window.__AUTHENTICATED_USER__ = null;

  const nativeFetch = window.fetch.bind(window);

  const curPathLower = (window.location.pathname || '').toLowerCase();
  const currentTabPortal = curPathLower.includes('/trainer/')
    ? 'trainer'
    : (curPathLower.includes('/gym_owner/')
      ? 'gym_owner'
      : (curPathLower.includes('/admin/') ? 'admin' : 'user'));
  window.__FITSYNC_TAB_PORTAL__ = currentTabPortal;

  async function refreshCsrfToken() {
    try {
      const res = await nativeFetch('api/auth/csrf.php', {
        credentials: 'same-origin',
        headers: { 'X-FitSync-Portal': currentTabPortal }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.csrf_token) {
          window.__FITSYNC_CSRF_TOKEN__ = json.csrf_token;
          return json.csrf_token;
        }
      }
    } catch (e) {
      console.warn('[FitSync API] CSRF refresh failed:', e);
    }
    return '';
  }

  window.fitSyncHasPortalAccess = function (user, requiredRole) {
    if (!user) return false;
    if (!requiredRole) return true;
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const roles = Array.isArray(user.authorized_roles) && user.authorized_roles.length
      ? user.authorized_roles
      : [user.role];
    if (roles.includes('admin')) return true;
    return allowed.some(r => roles.includes(r));
  };

  window.renderFitSyncAccessDenied = function (requiredRole, user) {
    const labels = {
      user: 'Member Portal',
      trainer: 'Trainer Portal',
      gym_owner: 'Gym Owner Portal',
      admin: 'Admin Portal'
    };
    const roleKey = Array.isArray(requiredRole) ? requiredRole[0] : (requiredRole || 'user');
    const targetLabel = labels[roleKey] || 'Requested Portal';
    const curRole = (user && user.role) ? user.role : 'user';
    const curLabel = labels[curRole] || 'Your Portal';
    const homeUrl = (curRole === 'trainer')
      ? 'trainer/index.html'
      : (curRole === 'gym_owner')
        ? 'gym_owner/index.html'
        : (curRole === 'admin')
          ? 'admin/index.php'
          : 'index.html';
    const safeName = String((user && (user.full_name || user.email)) || 'Authenticated User')
      .replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

    const switchLoginUrl = `login.php?switch_account=1&portal_ctx=${encodeURIComponent(roleKey)}&next=${encodeURIComponent(window.location.pathname + window.location.search)}`;

    document.title = `403 Access Denied — ${targetLabel}`;
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F1F5F9;font-family:'Inter',sans-serif;color:#0F172A;padding:24px;">
        <div style="max-width:500px;width:100%;background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:32px;box-shadow:0 10px 25px rgba(15,23,42,0.08);text-align:center;">
          <span style="display:inline-block;background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:14px;">403 Forbidden — Portal Access Denied</span>
          <h1 style="font-size:21px;font-weight:800;margin:0 0 10px;color:#0F172A;">You don't have access to ${targetLabel}</h1>
          <p style="font-size:14px;color:#475569;line-height:1.55;margin:0 0 22px;">
            You are currently signed in as <strong>${safeName}</strong> (${curLabel}). Your account does not have permission to open <strong>${targetLabel}</strong>. Your current session has been preserved.
          </p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <a href="${homeUrl}" style="background:#155DFC;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;">Return to My Portal</a>
            <a href="${switchLoginUrl}" style="background:#10B981;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;">Sign In to ${targetLabel} (Keep Other Tab Active)</a>
            <a href="logout.php?portal_ctx=${encodeURIComponent(curRole)}" style="background:#F8FAFC;color:#334155;border:1px solid #CBD5E1;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;">Sign Out</a>
          </div>
        </div>
      </div>
    `;
  };

  window.fitSyncRefreshSession = async function (requiredRole = null, redirectUrl = null) {
    try {
      const res = await nativeFetch('api/auth/me.php', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'X-FitSync-Portal': currentTabPortal }
      });
      if (!res.ok) return { isLoggedIn: false, user: null, authorized: false };
      const json = await res.json();
      if (json && json.csrf_token) {
        window.__FITSYNC_CSRF_TOKEN__ = json.csrf_token;
      }
      if (json && json.isLoggedIn && json.user) {
        window.__AUTHENTICATED_USER__ = json.user;
        if (requiredRole && !window.fitSyncHasPortalAccess(json.user, requiredRole)) {
          window.renderFitSyncAccessDenied(requiredRole, json.user);
          return { isLoggedIn: true, user: json.user, authorized: false };
        }
        return { isLoggedIn: true, user: json.user, authorized: true };
      }
      window.__AUTHENTICATED_USER__ = null;
      if (requiredRole && redirectUrl) {
        const nextTarget = window.location.pathname + window.location.search;
        const sep = redirectUrl.includes('?') ? '&' : '?';
        window.location.href = `${redirectUrl}${sep}portal_ctx=${encodeURIComponent(currentTabPortal)}&next=${encodeURIComponent(nextTarget)}`;
      }
      return { isLoggedIn: false, user: null, authorized: false };
    } catch (e) {
      console.warn('[FitSync API] Session check error:', e);
      return { isLoggedIn: false, user: null, authorized: false };
    }
  };

  window.fetch = async function (resource, init = {}) {
    const urlStr = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
    const isApiCall = /(^|\/)api\//.test(urlStr);
    if (!isApiCall) {
      return nativeFetch(resource, init);
    }

    const opts = Object.assign({}, init);
    opts.credentials = opts.credentials || 'same-origin';
    const method = String(opts.method || 'GET').toUpperCase();
    const headers = new Headers(opts.headers || {});
    if (!headers.has('X-FitSync-Portal')) {
      headers.set('X-FitSync-Portal', currentTabPortal);
    }

    if (method !== 'GET' && method !== 'HEAD') {
      if (!window.__FITSYNC_CSRF_TOKEN__) {
        await refreshCsrfToken();
      }
      if (window.__FITSYNC_CSRF_TOKEN__ && !headers.has('X-CSRF-Token')) {
        headers.set('X-CSRF-Token', window.__FITSYNC_CSRF_TOKEN__);
      }
    }
    opts.headers = headers;

    let response = await nativeFetch(resource, opts);

    // If CSRF token expired/mismatched once, refresh and retry once
    if (response.status === 403 && method !== 'GET' && method !== 'HEAD') {
      try {
        const cloneJson = await response.clone().json();
        if (cloneJson && typeof cloneJson.message === 'string' && cloneJson.message.toLowerCase().includes('csrf')) {
          const fresh = await refreshCsrfToken();
          if (fresh) {
            const retryHeaders = new Headers(opts.headers || {});
            retryHeaders.set('X-CSRF-Token', fresh);
            opts.headers = retryHeaders;
            response = await nativeFetch(resource, opts);
          }
        }
      } catch (e) {}
    }

    return response;
  };
})();
