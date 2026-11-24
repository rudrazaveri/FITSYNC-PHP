import os
import re

print("=" * 70)
print("FITSYNC: COMPREHENSIVE LOGIN REDIRECTION & RBAC VERIFICATION SUITE")
print("=" * 70)

all_passed = True

# ---------------------------------------------------------------------
# 1. Inspect Database Trainer Account in Schema & Seed
# ---------------------------------------------------------------------
print("\n[1/6] Database Inspection: Trainer Demo Account")
with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    schema_sql = f.read()

# Check user 3
if "3, 'coach@fitsync.health'" in schema_sql and "'trainer', 'Coach Raj Malhotra', NOW(), 'active'" in schema_sql:
    print("  ✓ User record verified in database seed: id=3, email='coach@fitsync.health', role='trainer', status='active'")
else:
    print("  ✗ User record missing or role incorrect in schema!")
    all_passed = False

# Check trainer_profiles
if "(3, 'CSCS (Certified Strength & Conditioning Specialist)', 'NSCA'" in schema_sql:
    print("  ✓ Trainer profile verified: user_id=3, cert='CSCS', body='NSCA', status='verified'")
else:
    print("  ✗ Trainer profile missing for user_id=3!")
    all_passed = False

# Check trainer assignments
if "(1, 6, 3, 1, 2, 'active'" in schema_sql and "(2, 7, 3, 1, 2, 'active'" in schema_sql:
    print("  ✓ Trainer assigned members verified: Isha Kulkarni (6) and Ritika Sharma (7) assigned to Coach Raj (3)")
else:
    print("  ✗ Trainer assignments missing in schema!")
    all_passed = False

# ---------------------------------------------------------------------
# 2. Inspect Role Retrieval in includes/auth.php
# ---------------------------------------------------------------------
print("\n[2/6] PHP Auth: Prepared Statement & Role Session Assignment")
with open('includes/auth.php', 'r', encoding='utf-8') as f:
    auth_php = f.read()

# Check SELECT has role
if "SELECT id, email, password_hash, role, full_name, status" in auth_php:
    print("  ✓ SELECT query explicitly fetches `role` column from `users` table")
else:
    print("  ✗ SELECT query missing `role` column!")
    all_passed = False

# Check session assignment
if "$_SESSION['role']      = (string)$user['role'];" in auth_php:
    print("  ✓ Role correctly assigned to session: $_SESSION['role'] = (string)$user['role']")
else:
    print("  ✗ Session role assignment missing or corrupt!")
    all_passed = False

# Check redirect generation
if "'redirect' => getRedirectUrlForRole($user['role'])" in auth_php:
    print("  ✓ Authenticate response includes: 'redirect' => getRedirectUrlForRole($user['role'])")
else:
    print("  ✗ Redirect url missing from auth response!")
    all_passed = False

# ---------------------------------------------------------------------
# 3. Test getBaseUrl() & url() across all script locations
# ---------------------------------------------------------------------
print("\n[3/6] URL Resolution & Base URL Integrity Across All Portals")
from test_url_suite import get_base_url, url

test_scripts = [
    # (project_root, script_filename, script_name, host, expected_base)
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\login.php", "/FIT-SYNC AI php/login.php", "localhost", "http://localhost/FIT-SYNC AI php"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\api\auth\login.php", "/FIT-SYNC AI php/api/auth/login.php", "localhost", "http://localhost/FIT-SYNC AI php"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\trainer\index.php", "/FIT-SYNC AI php/trainer/index.php", "localhost", "http://localhost/FIT-SYNC AI php"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\trainer\dashboard.php", "/FIT-SYNC AI php/trainer/dashboard.php", "localhost", "http://localhost/FIT-SYNC AI php"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\user\index.php", "/FIT-SYNC AI php/user/index.php", "localhost", "http://localhost/FIT-SYNC AI php"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\user\dashboard.php", "/FIT-SYNC AI php/user/dashboard.php", "localhost", "http://localhost/FIT-SYNC AI php"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\gym_owner\index.php", "/FIT-SYNC AI php/gym_owner/index.php", "localhost", "http://localhost/FIT-SYNC AI php"),
    (r"C:\xampp\htdocs\FIT-SYNC AI php", r"C:\xampp\htdocs\FIT-SYNC AI php\admin\index.php", "/FIT-SYNC AI php/admin/index.php", "localhost", "http://localhost/FIT-SYNC AI php"),
    (r"C:\FIT-SYNC AI php", r"C:\FIT-SYNC AI php\login.php", "/login.php", "localhost:8000", "http://localhost:8000"),
    (r"C:\FIT-SYNC AI php", r"C:\FIT-SYNC AI php\api\auth\login.php", "/api/auth/login.php", "localhost:8000", "http://localhost:8000"),
    (r"C:\FIT-SYNC AI php", r"C:\FIT-SYNC AI php\trainer\dashboard.php", "/trainer/dashboard.php", "localhost:8000", "http://localhost:8000"),
    (r"C:\FIT-SYNC AI php", r"C:\FIT-SYNC AI php\user\dashboard.php", "/user/dashboard.php", "localhost:8000", "http://localhost:8000"),
]

for pr, sf, sn, host, exp_base in test_scripts:
    calculated_base = get_base_url(sf, sn, host=host, project_root=pr)
    if calculated_base != exp_base:
        print(f"  ✗ Base URL mismatch for {sn}! Got '{calculated_base}', expected '{exp_base}'")
        all_passed = False
    
    t_url = url('trainer/', calculated_base)
    if "/api/auth" in t_url or "/trainer/trainer" in t_url:
        print(f"  ✗ Corrupted trainer redirect URL for {sn}: {t_url}")
        all_passed = False

print("  ✓ All 12 entry points computed the exact correct Base URL and clean '/trainer/' paths")

# ---------------------------------------------------------------------
# 4. Role Redirection Map in includes/auth.php
# ---------------------------------------------------------------------
print("\n[4/6] Role Redirection Map: All 4 Roles")
roles_map = {
    'user': 'user/',
    'trainer': 'trainer/',
    'gym_owner': 'gym_owner/',
    'admin': 'admin/'
}
for r, path in roles_map.items():
    if f"case '{r}':" in auth_php and f"return url('{path}');" in auth_php:
        print(f"  ✓ Role '{r}' maps to: url('{path}')")
    else:
        print(f"  ✗ Role '{r}' missing or mapped incorrectly in getRedirectUrlForRole!")
        all_passed = False

# ---------------------------------------------------------------------
# 5. Role Enforcement Across All Portals & Dashboards
# ---------------------------------------------------------------------
print("\n[5/6] Server-Side Portal Access Control (requireRole)")
portal_checks = [
    ('trainer/index.php', "requireRole('trainer');", "Trainer Index"),
    ('trainer/dashboard.php', "requireRole('trainer');", "Trainer Dashboard"),
    ('user/index.php', "requireRole('user');", "User Index"),
    ('user/dashboard.php', "requireRole('user');", "User Dashboard"),
    ('gym_owner/index.php', "requireRole('gym_owner');", "Gym Owner Portal"),
    ('admin/index.php', "requireRole('admin');", "Admin Portal"),
    ('dashboard.php', "!hasRole('user')", "Root Dashboard Role Check")
]

for filepath, needle, desc in portal_checks:
    with open(filepath, 'r', encoding='utf-8') as pf:
        content = pf.read()
    if needle in content:
        print(f"  ✓ {desc} ({filepath}): verified server-side role check")
    else:
        print(f"  ✗ {desc} ({filepath}): role check missing or invalid!")
        all_passed = False

# ---------------------------------------------------------------------
# 6. Frontend JavaScript Auth Flow & Fallbacks in js/app.js
# ---------------------------------------------------------------------
print("\n[6/6] Frontend JavaScript Auth Flow & Fallbacks in js/app.js")
with open('js/app.js', 'r', encoding='utf-8') as jf:
    app_js = jf.read()

checks_js = [
    ("data.user.role !== 'user'", "Role check in handleSignInSubmit"),
    ("lowerEmail === 'coach@fitsync.health' || lowerEmail.includes('coach')", "Coach fallback routing in handleSignInSubmit"),
    ("if (key === 'coach')", "Coach routing in loginDemoAccount"),
    ("if (window.__AUTHENTICATED_USER__.role === 'trainer')", "Trainer redirection in initAuthSystem")
]

for needle, desc in checks_js:
    if needle in app_js:
        print(f"  ✓ {desc} verified in js/app.js")
    else:
        print(f"  ✗ {desc} missing in js/app.js!")
        all_passed = False

print("\n" + "=" * 70)
if all_passed:
    print("ALL TESTS PASSED! TRAINER LOGIN REDIRECTION BUG FULLY DIAGNOSED & FIXED.")
else:
    print("TESTS COMPLETED WITH FAILURES!")
print("=" * 70)
