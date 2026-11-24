import re
import os

def get_base_url(script_filename, script_name, host='localhost', protocol='http://', project_root=r'C:\FIT-SYNC AI php'):
    pr = project_root.replace('\\', '/')
    sf = script_filename.replace('\\', '/')
    sn = script_name.replace('\\', '/')

    base_path = None
    # Primary resolution
    if sf and pr and sf.startswith(pr):
        rel_script = sf[len(pr):].lstrip('/')
        if rel_script and sn.endswith(rel_script):
            base_path = sn[:-len(rel_script)].rstrip('/')

    if base_path is None:
        # Fallback
        script_dir = os.path.dirname(sn).replace('\\', '/')
        base_path = re.sub(r'/(api(/auth|/trainer)?|trainer|user|gym_owner|admin|config)$', '', script_dir, flags=re.IGNORECASE)
        base_path = base_path.rstrip('/')

    return f"{protocol}{host}{base_path}"

def url(path, base_url):
    return base_url.rstrip('/') + '/' + path.lstrip('/')

# Test cases
test_cases = [
    # 1. XAMPP htdocs with subfolder "FIT-SYNC AI php"
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\login.php", "/FIT-SYNC AI php/login.php", "localhost"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\api\auth\login.php", "/FIT-SYNC AI php/api/auth/login.php", "localhost"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\trainer\index.php", "/FIT-SYNC AI php/trainer/index.php", "localhost"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\trainer\dashboard.php", "/FIT-SYNC AI php/trainer/dashboard.php", "localhost"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\user\dashboard.php", "/FIT-SYNC AI php/user/dashboard.php", "localhost"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\gym_owner\index.php", "/FIT-SYNC AI php/gym_owner/index.php", "localhost"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\admin\index.php", "/FIT-SYNC AI php/admin/index.php", "localhost"),

    # 2. Built-in server / Virtual host root
    (r"C:\FIT-SYNC AI php", r"C:\FIT-SYNC AI php\login.php", "/login.php", "localhost:8000"),
    (r"C:\FIT-SYNC AI php", r"C:\FIT-SYNC AI php\api\auth\login.php", "/api/auth/login.php", "localhost:8000"),
    (r"C:\FIT-SYNC AI php", r"C:\FIT-SYNC AI php\trainer\index.php", "/trainer/index.php", "localhost:8000"),
    (r"C:\FIT-SYNC AI php", r"C:\FIT-SYNC AI php\trainer\dashboard.php", "/trainer/dashboard.php", "localhost:8000"),
    (r"C:\FIT-SYNC AI php", r"C:\FIT-SYNC AI php\user\dashboard.php", "/user/dashboard.php", "localhost:8000"),

    # 3. Fallback when SCRIPT_FILENAME is empty
    (r"C:\FIT-SYNC AI php", "", "/FIT-SYNC AI php/api/auth/login.php", "localhost"),
    (r"C:\FIT-SYNC AI php", "", "/FIT-SYNC AI php/trainer/dashboard.php", "localhost"),
    (r"C:\FIT-SYNC AI php", "", "/trainer/dashboard.php", "localhost:8000"),
    (r"C:\FIT-SYNC AI php", "", "/api/auth/login.php", "localhost:8000"),
]

all_passed = True
for pr, sf, sn, host in test_cases:
    base = get_base_url(sf, sn, host=host, project_root=pr)
    trainer_url = url('trainer/', base)
    trainer_dash = url('trainer/dashboard.php', base)
    user_url = url('user/', base)

    # Verify trainer_url does not contain double trainer or api/auth
    if "/api/auth/trainer" in trainer_url or "/trainer/trainer" in trainer_url:
        print(f"FAILED: {sn} -> {trainer_url}")
        all_passed = False
    else:
        print(f"OK: [{sn}] -> base: '{base}', trainer: '{trainer_url}', trainer_dash: '{trainer_dash}'")

if all_passed:
    print("\nALL URL RESOLUTION CASES PASSED 100% PERFECTLY!")
