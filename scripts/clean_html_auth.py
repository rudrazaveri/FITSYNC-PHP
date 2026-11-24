import re

def clean_html_file(fpath):
    print(f"Cleaning {fpath}...")
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Clean auth-tabs
    old_tabs = """        <div class="auth-tabs">
          <button type="button" class="auth-tab-btn active" id="authTabBtnSignIn" onclick="switchAuthTab('signin')">
            Sign In
          </button>
          <button type="button" class="auth-tab-btn" id="authTabBtnRegister" onclick="switchAuthTab('register')">
            Register (New)
          </button>
          <button type="button" class="auth-tab-btn" id="authTabBtnDemo" onclick="switchAuthTab('demo')">
            ⚡ 1-Click Demo
          </button>
        </div>"""

    new_tabs = """        <div class="auth-tabs" style="grid-template-columns: 1fr 1fr;">
          <button type="button" class="auth-tab-btn active" id="authTabBtnSignIn" onclick="switchAuthTab('signin')">
            Sign In
          </button>
          <button type="button" class="auth-tab-btn" id="authTabBtnRegister" onclick="switchAuthTab('register')">
            Create Account
          </button>
        </div>"""

    if old_tabs in c:
        c = c.replace(old_tabs, new_tabs)
        print("  ✓ Replaced auth-tabs")
    else:
        print("  ⚠️ old_tabs not found")

    # 2. Clean prefilled inputs in authSignInPane
    c = c.replace('id="authEmailInput" class="auth-input" placeholder="e.g. athlete@fitsync.health or coach@fitsync.health" value="ritika@fitsync.health"',
                  'id="authEmailInput" class="auth-input" placeholder="name@example.com"')
    c = c.replace('id="authPasswordInput" class="auth-input" placeholder="••••••••" value="password123"',
                  'id="authPasswordInput" class="auth-input" placeholder="Enter your password"')

    # 3. Remove authDemoPane and banners and auth-card-footer
    # Pattern to find from <!-- PANE 3: 1-CLICK DEMO ACCOUNTS down through auth-card-footer </div>
    pattern_demo_to_footer = re.compile(
        r'<!-- -{10,}\s*PANE 3: 1-CLICK DEMO ACCOUNTS.*?<!-- Shared Card Footer Actions -->\s*<div class="auth-card-footer">.*?</div>\s*</div>',
        re.DOTALL
    )
    if pattern_demo_to_footer.search(c):
        c = pattern_demo_to_footer.sub('</div>', c)
        print("  ✓ Removed authDemoPane, cleanDbBanner, and auth-card-footer")
    else:
        # Fallback manual removal
        start_demo = c.find('id="authDemoPane"')
        if start_demo != -1:
            start_block = c.rfind('<!--', 0, start_demo)
            end_block = c.find('</div>\n    </div>\n  </div>\n\n  <div class="app-layout">')
            if end_block != -1:
                c = c[:start_block] + c[end_block:]
                print("  ✓ Removed demo & footer via index offset")

    # 4. Remove dataStorageModal
    pattern_storage_modal = re.compile(r'<div class="modal-overlay" id="dataStorageModal">.*?</div>\s*</div>\s*</div>', re.DOTALL)
    if pattern_storage_modal.search(c):
        c = pattern_storage_modal.sub('', c)
        print("  ✓ Removed dataStorageModal")

    # 5. Remove reset button in Settings
    pattern_reset_settings = re.compile(r'<button type="button" onclick="handleResetDatabase\(\)" class="btn-settings-reset">.*?</button>', re.DOTALL)
    if pattern_reset_settings.search(c):
        c = pattern_reset_settings.sub('<button type="button" onclick="if(confirm(\'Sign out of this session?\')) window.fitSyncStore.logout();" class="btn-settings-reset" style="border-color: #E2E8F0; color: #64748B;"><i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Sign Out</button>', c)
        print("  ✓ Cleaned reset button in settings")

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f"  Finished {fpath}\n")

for f in ['index.html', 'fitsync/index.html', 'user/portal_template.php']:
    clean_html_file(f)
