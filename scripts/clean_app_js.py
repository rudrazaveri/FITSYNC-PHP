def clean_app_js(fpath):
    print(f"Cleaning {fpath}...")
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Update switchAuthTab
    old_switch = """function switchAuthTab(tab) {
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
}"""

    new_switch = """function switchAuthTab(tab) {
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
  }
  initIcons();
}"""

    if old_switch in c:
        c = c.replace(old_switch, new_switch)
        print("  ✓ Updated switchAuthTab")
    else:
        print("  ⚠️ old_switch not found")

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f"  Finished {fpath}\n")

for f in ['js/app.js', 'fitsync/js/app.js']:
    clean_app_js(f)
