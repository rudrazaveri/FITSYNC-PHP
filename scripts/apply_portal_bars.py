portal_bar_index = """  <!-- Top Global Portal Switcher -->
  <div class="portal-nav-bar" style="background:#0f172a; border-bottom:1px solid rgba(255,255,255,0.08); padding:10px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; z-index:100; position:relative;">
    <div style="display:flex; align-items:center; gap:16px;">
      <a href="index.html" style="display:flex; align-items:center; gap:8px; text-decoration:none;">
        <div style="width:28px; height:28px; border-radius:6px; background:#2563eb; display:flex; align-items:center; justify-content:center; color:#fff;">
          <i data-lucide="activity" style="width:16px; height:16px;"></i>
        </div>
        <span style="font-weight:800; font-size:15px; color:#fff; letter-spacing:-0.3px;">FitSync AI</span>
      </a>
      <div style="display:flex; align-items:center; gap:8px;">
        <a href="gym_owner/index.html" style="font-size:12px; font-weight:600; padding:6px 14px; border-radius:9999px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.1);">
          <i data-lucide="building-2" style="width:14px; height:14px;"></i> Gym Owner Portal
        </a>
        <a href="trainer/index.html" style="font-size:12px; font-weight:600; padding:6px 14px; border-radius:9999px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.1);">
          <i data-lucide="dumbbell" style="width:14px; height:14px;"></i> Trainer Portal
        </a>
        <a href="index.html" style="font-size:12px; font-weight:600; padding:6px 14px; border-radius:9999px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:rgba(37,99,235,0.2); color:#60a5fa; border:1px solid rgba(96,165,250,0.4);">
          <i data-lucide="user" style="width:14px; height:14px;"></i> Member Portal
        </a>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:#94a3b8;">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981;"></span>
      <span>Live Sync Active</span>
    </div>
  </div>
"""

# Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx_content = f.read()

if 'portal-nav-bar' not in idx_content:
    target = '<body>\n\n  <!-- Mobile Top Header'
    replacement = '<body>\n\n' + portal_bar_index + '\n  <!-- Mobile Top Header'
    if target in idx_content:
        idx_content = idx_content.replace(target, replacement)
        print("Added portal nav bar to index.html")
    else:
        print("Target for index.html body not found")

# Replace hardcoded FAQ mention in index.html
idx_content = idx_content.replace('locate Coach Raj Malhotra, and click "Send Query"', 'locate your assigned coach, and click "Send Query"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_content)

# Update gym_owner/index.html
portal_bar_gym = """  <!-- Top Global Portal Switcher -->
  <div class="portal-nav-bar" style="background:#0f172a; border-bottom:1px solid rgba(255,255,255,0.08); padding:10px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; z-index:100; position:relative;">
    <div style="display:flex; align-items:center; gap:16px;">
      <a href="index.html" style="display:flex; align-items:center; gap:8px; text-decoration:none;">
        <div style="width:28px; height:28px; border-radius:6px; background:#2563eb; display:flex; align-items:center; justify-content:center; color:#fff;">
          <i data-lucide="activity" style="width:16px; height:16px;"></i>
        </div>
        <span style="font-weight:800; font-size:15px; color:#fff; letter-spacing:-0.3px;">FitSync AI</span>
      </a>
      <div style="display:flex; align-items:center; gap:8px;">
        <a href="gym_owner/index.html" style="font-size:12px; font-weight:600; padding:6px 14px; border-radius:9999px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:rgba(37,99,235,0.2); color:#60a5fa; border:1px solid rgba(96,165,250,0.4);">
          <i data-lucide="building-2" style="width:14px; height:14px;"></i> Gym Owner Portal
        </a>
        <a href="trainer/index.html" style="font-size:12px; font-weight:600; padding:6px 14px; border-radius:9999px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.1);">
          <i data-lucide="dumbbell" style="width:14px; height:14px;"></i> Trainer Portal
        </a>
        <a href="index.html" style="font-size:12px; font-weight:600; padding:6px 14px; border-radius:9999px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.1);">
          <i data-lucide="user" style="width:14px; height:14px;"></i> Member Portal
        </a>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:#94a3b8;">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981;"></span>
      <span>FitZone Fitness • Owner Console</span>
    </div>
  </div>
"""

with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    gym_content = f.read()

if 'portal-nav-bar' not in gym_content:
    target_gym = '<body>\n\n  <!-- Mobile Top Header'
    replacement_gym = '<body>\n\n' + portal_bar_gym + '\n  <!-- Mobile Top Header'
    if target_gym in gym_content:
        gym_content = gym_content.replace(target_gym, replacement_gym)
        print("Added portal nav bar to gym_owner/index.html")
    else:
        print("Target for gym_owner body not found")

with open('gym_owner/index.html', 'w', encoding='utf-8') as f:
    f.write(gym_content)

print("Updates applied successfully!")
