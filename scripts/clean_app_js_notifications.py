for fpath in ['js/app.js', 'fitsync/js/app.js']:
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace("showNotification('You have logged out safely. Enter your credentials or use 1-Click Demo.');",
                  "showNotification('You have logged out safely. Please sign in to continue.');")

    old_block = """function handleResetDatabase() {
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
}"""

    new_block = """function handleResetDatabase() {
  window.fitSyncStore.resetDatabase();
  initAuthSystem();
  switchAuthTab('signin');
}"""

    if old_block in c:
        c = c.replace(old_block, new_block)
        print(f"Updated {fpath}")

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(c)

print("Cleaned logout and reset notifications")
