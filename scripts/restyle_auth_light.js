/**
 * FitSync AI — Restyle Auth & Registration Dashboard to match Native App Theme
 * Light Blue & Crisp White Design System (#F5F7FF, #FFFFFF, #155DFC)
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const fitsyncDir = path.join(rootDir, 'fitsync');

console.log('Restyling Auth Dashboard to native FitSync App Light Theme...');

const nativeAppAuthCss = `
/* ==========================================================================
   FitSync AI — Login & Register Dashboard & Session Styles (Native App Theme)
   Color System: Electric Blue (#155DFC) + Light Canvas (#F5F7FF) + Crisp Card (#FFFFFF)
   ========================================================================== */

.auth-dashboard-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: radial-gradient(circle at 50% 0%, #DBEAFE 0%, #F5F7FF 65%);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 40px 16px 80px;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text-main, #0F172A);
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
  max-width: 600px;
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
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 6px 20px rgba(21, 93, 252, 0.14);
  overflow: hidden;
}

.auth-logo-badge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-brand-title {
  font-size: 30px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.5px;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.auth-brand-title .text-blue {
  color: #155DFC;
}

.auth-brand-subtitle {
  font-size: 13.5px;
  color: #64748B;
  max-width: 440px;
  line-height: 1.5;
  margin: 0;
}

.auth-card {
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  box-shadow: 0 10px 28px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
  padding: 28px;
  box-sizing: border-box;
}

.auth-tabs {
  display: flex;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 22px;
}

.auth-tab-btn {
  flex: 1;
  padding: 9px 12px;
  border: none;
  background: transparent;
  color: #64748B;
  font-size: 13px;
  font-weight: 600;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.auth-tab-btn:hover {
  color: #0F172A;
  background: rgba(255, 255, 255, 0.8);
}

.auth-tab-btn.active {
  background: #155DFC;
  color: #FFFFFF;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(21, 93, 252, 0.28);
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
  color: #1E293B;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.auth-label i, .auth-label svg {
  color: #155DFC;
  width: 15px;
  height: 15px;
}

.auth-forgot-link {
  font-size: 12px;
  color: #155DFC;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s;
}

.auth-forgot-link:hover {
  color: #0E48D4;
  text-decoration: underline;
}

.auth-input, .auth-select {
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  padding: 10px 13px;
  color: #0F172A;
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.auth-input::placeholder {
  color: #94A3B8;
}

.auth-input:focus, .auth-select:focus {
  border-color: #155DFC;
  box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.15);
}

.auth-select option {
  background: #FFFFFF;
  color: #0F172A;
}

.auth-registered-label {
  font-size: 12px;
  color: #64748B;
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
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 6px 12px;
  color: #334155;
  font-size: 12.5px;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-account-chip i, .auth-account-chip svg {
  color: #155DFC;
}

.auth-account-chip:hover, .auth-account-chip.active {
  border-color: #93C5FD;
  background: #EFF6FF;
  color: #155DFC;
  font-weight: 600;
}

.auth-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  font-size: 12.5px;
  color: #64748B;
}

.auth-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #334155;
  font-size: 12.5px;
}

.auth-checkbox-label input {
  accent-color: #155DFC;
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
  color: #155DFC;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: inherit;
  transition: color 0.15s;
}

.auth-quick-btn:hover {
  color: #0E48D4;
  text-decoration: underline;
}

.auth-submit-btn {
  width: 100%;
  background: #155DFC;
  color: #FFFFFF;
  font-size: 14.5px;
  font-weight: 700;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(21, 93, 252, 0.26);
  transition: all 0.2s ease;
  margin-bottom: 16px;
  font-family: inherit;
}

.auth-submit-btn:hover {
  background: #0E48D4;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(21, 93, 252, 0.35);
}

.auth-banner {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 10px;
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
  color: #155DFC;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.auth-banner strong {
  color: #1E3A8A;
  font-size: 13px;
  font-weight: 700;
  display: block;
}

.auth-banner p {
  color: #1E40AF;
  font-size: 12px;
  line-height: 1.4;
  margin: 2px 0 0;
}

.auth-banner-close {
  background: transparent;
  border: none;
  color: #64748B;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
}

.auth-banner-close:hover {
  color: #0F172A;
}

.auth-card-footer {
  border-top: 1px solid #E2E8F0;
  padding-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-auth-reset-db {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #DC2626;
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
  background: #FEE2E2;
  color: #B91C1C;
}

.auth-data-storage-link {
  color: #155DFC;
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
  color: #0E48D4;
  text-decoration: underline;
}

/* Register Specific Roles, Steps, and Gyms */
.auth-step-title {
  color: #0F172A;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin: 18px 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.auth-step-title i, .auth-step-title svg {
  color: #155DFC;
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
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.auth-role-card:hover {
  border-color: #93C5FD;
  background: #F0F7FF;
}

.auth-role-card.active {
  border-color: #155DFC;
  background: #EFF6FF;
  box-shadow: 0 4px 14px rgba(21, 93, 252, 0.12);
}

.auth-role-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #DBEAFE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.auth-role-card.active .auth-role-icon {
  background: #155DFC;
  color: #FFFFFF;
}

.auth-role-info strong {
  display: block;
  font-size: 13.5px;
  color: #0F172A;
}

.auth-role-info span {
  display: block;
  font-size: 11.5px;
  color: #64748B;
  margin-top: 2px;
}

.auth-gym-card {
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.auth-gym-card:hover {
  border-color: #93C5FD;
  background: #F0F7FF;
}

.auth-gym-card.active {
  border-color: #155DFC;
  background: #EFF6FF;
}

.auth-gym-info strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: #0F172A;
}

.auth-gym-rating {
  color: #155DFC;
  font-size: 12px;
  font-weight: 700;
}

.auth-gym-info span {
  display: block;
  font-size: 11.5px;
  color: #64748B;
  margin-top: 2px;
}

.auth-gym-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.2s;
}

.auth-gym-card.active .auth-gym-check {
  border-color: #155DFC;
  background: #155DFC;
  color: #FFFFFF;
}

/* 1-Click Demo Grid */
.auth-demo-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.auth-demo-card {
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-demo-card:hover {
  border-color: #155DFC;
  background: #EFF6FF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(21, 93, 252, 0.08);
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
  border: 1px solid #CBD5E1;
}

.auth-demo-info strong {
  display: block;
  font-size: 13.5px;
  color: #0F172A;
}

.auth-demo-info span {
  display: block;
  font-size: 11.5px;
  color: #64748B;
  margin-top: 2px;
}

.auth-demo-arrow {
  color: #155DFC;
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
  background: rgba(239, 68, 68, 0.08) !important;
  color: #DC2626 !important;
}

.btn-sidebar-user-logout {
  background: transparent;
  border: none;
  color: var(--text-muted, #94A3B8);
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
  border: 1px solid var(--border-color, #E2E8F0);
  color: var(--text-secondary, #64748B);
  background: #FFFFFF;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-settings-reset:hover {
  background: var(--light-blue-bg, #EFF6FF);
  color: var(--primary-blue, #155DFC);
  border-color: var(--light-blue, #DBEAFE);
}
`;

function updateCssFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const startMarker = '/* ==========================================================================\n   FitSync AI — Login & Register Dashboard & Session Styles';
  
  if (content.includes(startMarker)) {
    const parts = content.split(startMarker);
    content = parts[0] + nativeAppAuthCss.trim() + '\n';
  } else {
    content += '\n' + nativeAppAuthCss;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated CSS with native FitSync app light theme:', filePath);
}

// Update modal markup to match native app light theme
const lightDataStorageModalHtml = `
  <!-- Modal: Where & How is Data Stored -->
  <div class="modal-overlay" id="dataStorageModal">
    <div class="modal-card" style="max-width: 520px; background: #FFFFFF; border: 1px solid var(--border-color, #E2E8F0); color: var(--text-main, #0F172A); box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);">
      <div class="modal-header" style="border-bottom: 1px solid var(--border-color, #E2E8F0);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="database" style="color: var(--primary-blue, #155DFC);"></i>
          <h4 class="modal-title" style="color: var(--text-main, #0F172A);">Where & How is Data Stored?</h4>
        </div>
        <button class="modal-close-btn" data-close-modal style="color: var(--text-secondary, #64748B);">&times;</button>
      </div>
      <div class="modal-body" style="font-size: 13.5px; line-height: 1.6; color: var(--text-secondary, #475569);">
        <div style="background: var(--light-blue-bg, #EFF6FF); border: 1px solid var(--light-blue, #DBEAFE); border-radius: 10px; padding: 14px; margin-bottom: 16px;">
          <strong style="color: var(--primary-blue, #155DFC); display: flex; align-items: center; gap: 6px;">
            <i data-lucide="shield-check" style="width: 16px; height: 16px;"></i> 100% Private, On-Device Browser Storage
          </strong>
          <p style="margin: 6px 0 0; font-size: 12.5px; color: #1E40AF;">
            FitSync stores all user profiles, custom workout logs, sets, hydration logs, and fitness assessments exclusively in your browser's private LocalStorage sandbox.
          </p>
        </div>

        <ul style="padding-left: 20px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; color: #334155;">
          <li><strong>Zero Cloud Tracking:</strong> No remote servers, No Supabase, No Firebase, and zero telemetry sent to third parties.</li>
          <li><strong>Complete Offline Capability:</strong> The entire application operates completely offline without internet once loaded.</li>
          <li><strong>Instant Zero-Latency:</strong> Logging reps, updating sets, or filling water renders in under 1 millisecond.</li>
          <li><strong>Full User Control:</strong> You can wipe or reset the local database anytime by clicking "Reset Database (Start from Scratch)".</li>
        </ul>

        <div style="font-size: 12px; color: var(--text-muted, #94A3B8); border-top: 1px solid var(--border-color, #E2E8F0); padding-top: 12px;">
          Storage Key: <code style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; color: var(--primary-blue, #155DFC);">fitsync_master_platform_v2</code>
        </div>
      </div>
      <div class="modal-footer" style="border-top: 1px solid var(--border-color, #E2E8F0);">
        <button class="btn-primary-block" data-close-modal style="width: auto; padding: 8px 18px;">Got it</button>
      </div>
    </div>
  </div>
`;

function updateHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace old dark dataStorageModal
  const oldModalStart = '<!-- Modal: Where & How is Data Stored -->';
  const oldModalEnd = '</div>\n  </div>';
  if (content.includes(oldModalStart)) {
    const before = content.substring(0, content.indexOf(oldModalStart));
    const afterModalIndex = content.indexOf('</body>');
    content = before + lightDataStorageModalHtml.trim() + '\n\n' + content.substring(afterModalIndex);
  }

  // Update logo onerror in auth header to blue
  content = content.replace("style=\\'color:#10B981;", "style=\\'color:#155DFC;");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated HTML modal and brand icons:', filePath);
}

// Execute
updateCssFile(path.join(rootDir, 'css', 'style.css'));
updateCssFile(path.join(fitsyncDir, 'css', 'style.css'));

updateHtmlFile(path.join(rootDir, 'index.html'));
updateHtmlFile(path.join(fitsyncDir, 'index.html'));

console.log('All files updated to native FitSync App light theme successfully!');
