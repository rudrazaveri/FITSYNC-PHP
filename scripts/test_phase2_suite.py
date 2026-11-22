import os, re, bcrypt, hashlib

print("="*70)
print("FITSYNC — PHASE 2 AUTOMATED VERIFICATION TEST SUITE")
print("="*70)

# 1. FILE EXISTENCE CHECK
required_files = [
    'config/db.php',
    'config/bootstrap.php',
    '.env',
    '.env.example',
    'includes/session.php',
    'includes/csrf.php',
    'includes/functions.php',
    'includes/auth.php',
    'api/auth/login.php',
    'api/auth/register.php',
    'api/auth/logout.php',
    'api/auth/forgot_password.php',
    'api/auth/reset_password.php',
    'api/auth/change_password.php',
    'api/auth/me.php',
    'api/auth/csrf.php',
    'user/index.php',
    'trainer/index.php',
    'gym_owner/index.php',
    'admin/index.php',
    'login.php',
    'register.php',
    'logout.php',
    'forgot_password.php',
    'reset_password.php'
]

print("\n--- 1. Required Files Verification ---")
missing_files = []
for rf in required_files:
    exists = os.path.exists(rf)
    size = os.path.getsize(rf) if exists else 0
    status = f"EXISTS ({size} bytes)" if exists else "MISSING"
    print(f"  [{'PASS' if exists else 'FAIL'}] {rf:<32} {status}")
    if not exists:
        missing_files.append(rf)

assert len(missing_files) == 0, f"Missing files: {missing_files}"

# 2. SCHEMA COMPATIBILITY CHECK FOR AUTH QUERIES
print("\n--- 2. Schema Compatibility with Auth Logic ---")
with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

with open('includes/auth.php', 'r', encoding='utf-8') as f:
    auth_code = f.read()

# Verify table and column references
expected_columns = {
    'users': ['id', 'email', 'mobile', 'password_hash', 'role', 'full_name', 'status', 'last_login_at'],
    'user_profiles': ['user_id', 'gender', 'height_cm', 'weight_kg', 'fitness_experience'],
    'user_settings': ['user_id', 'theme', 'language', 'measurement_system', 'timezone'],
    'auth_tokens': ['id', 'user_id', 'purpose', 'token_hash', 'expires_at', 'used_at'],
    'user_sessions': ['user_id', 'session_token_hash', 'ip_address', 'user_agent', 'expires_at']
}

for tbl, cols in expected_columns.items():
    tbl_match = re.search(r'CREATE TABLE `' + tbl + r'` \((.*?)\) ENGINE=InnoDB', sql, re.DOTALL)
    assert tbl_match, f"Table `{tbl}` not found in schema!"
    tbl_def = tbl_match.group(1)
    print(f"  Validating schema columns for table `{tbl}`:")
    for c in cols:
        assert f"`{c}`" in tbl_def, f"Column `{c}` missing from schema table `{tbl}`!"
        assert c in auth_code, f"Column `{c}` missing from includes/auth.php!"
        print(f"    - Column `{c}`: VERIFIED")

# 3. VERIFY DEMO CREDENTIALS ACROSS ALL 4 ROLES
print("\n--- 3. Demo Credentials & Bcrypt Verification (All 4 Roles) ---")
demo_accounts = [
    {'email': 'aarav.patel@fitsync.ai', 'role': 'user', 'title': 'Member (Athlete)'},
    {'email': 'coach@fitsync.health', 'role': 'trainer', 'title': 'Trainer (Coach)'},
    {'email': 'owner@fitzone.com', 'role': 'gym_owner', 'title': 'Gym Owner'},
    {'email': 'admin@fitsync.com', 'role': 'admin', 'title': 'System Administrator'}
]

seed_match = re.search(r'INSERT INTO `users`.*?;', sql, re.DOTALL)
assert seed_match, "No seed users found in schema!"
seed_text = seed_match.group(0)

for acct in demo_accounts:
    email = acct['email']
    expected_role = acct['role']
    m = re.search(r"\(\d+,\s*'" + re.escape(email) + r"',\s*(?:NULL|'[^']*'),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'", seed_text)
    assert m, f"Account {email} not found in seed SQL!"
    phash = m.group(1)
    db_role = m.group(2)
    full_name = m.group(3)
    
    assert db_role == expected_role, f"Role mismatch for {email}: expected {expected_role}, got {db_role}"
    valid = bcrypt.checkpw(b'password123', phash.encode('utf-8'))
    assert valid, f"Password verification failed for {email}!"
    print(f"  [{'PASS'}] Role: {expected_role:<10} | {acct['title']:<22} | {email:<26} -> password_verify('password123'): TRUE")

# 4. SECURITY & AUTHORIZATION FOUNDATION AUDIT
print("\n--- 4. Security & Role-Based Authorization Code Inspection ---")

# Strict public registration role check
print("  Checking registration role enforcement:")
assert "$role = 'user';" in auth_code, "Security violation: registration does not hardcode role = 'user'!"
print("    [PASS] Public registration strictly hardcodes role = 'user' (never trusts client input)")

# Password hashing algorithm check
assert "PASSWORD_DEFAULT" in auth_code, "password_hash() must use PASSWORD_DEFAULT!"
print("    [PASS] Password hashing uses secure password_hash(..., PASSWORD_DEFAULT)")

# Password verification check
assert "password_verify(" in auth_code, "Must use password_verify()!"
print("    [PASS] Password verification uses password_verify()")

# Session fixation check
assert "regenerateSessionId();" in auth_code or "session_regenerate_id(" in auth_code, "Must regenerate session id on login!"
print("    [PASS] Session regeneration active on login to prevent session fixation")

# Account status verification
assert "$user['status'] === 'suspended'" in auth_code, "Must check suspended status!"
assert "$user['status'] === 'deactivated'" in auth_code, "Must check deactivated status!"
print("    [PASS] Ineligible accounts (suspended/deactivated) rejected before granting access")

# Cryptographic token generation
assert "random_bytes(32)" in auth_code, "Must generate cryptographically secure tokens with random_bytes!"
assert "hash('sha256'" in auth_code, "Must store only hashed reset tokens!"
print("    [PASS] Password reset tokens generated via random_bytes(32) and stored as SHA-256 hashes")

# Generic reset response (no email enumeration)
assert "If this email is registered" in auth_code, "Must return generic message for password reset!"
print("    [PASS] Password reset endpoint prevents email enumeration via generic response")

# 5. ROLE-BASED PORTAL PROTECTION AUDIT
print("\n--- 5. Dedicated Portal Protection Checks ---")
portals = {
    'user/index.php': 'user',
    'trainer/index.php': 'trainer',
    'gym_owner/index.php': 'gym_owner',
    'admin/index.php': 'admin'
}

for pfile, req_role in portals.items():
    with open(pfile, 'r', encoding='utf-8') as f:
        pcode = f.read()
    assert f"requireRole('{req_role}')" in pcode, f"Portal {pfile} missing requireRole('{req_role}')!"
    print(f"  [PASS] {pfile:<22} strictly guarded by requireRole('{req_role}')")

# 6. CSRF PROTECTION AUDIT
print("\n--- 6. CSRF Protection Audit ---")
with open('includes/csrf.php', 'r', encoding='utf-8') as f:
    csrf_code = f.read()

assert "random_bytes(32)" in csrf_code, "CSRF token must use random_bytes!"
assert "hash_equals(" in csrf_code, "CSRF token validation must use hash_equals()!"
print("  [PASS] CSRF generation uses random_bytes(32)")
print("  [PASS] CSRF comparison uses timing-safe hash_equals()")

# Verify forms use csrfInput()
for form_file in ['login.php', 'register.php', 'forgot_password.php', 'reset_password.php']:
    with open(form_file, 'r', encoding='utf-8') as f:
        fcode = f.read()
    assert "csrfInput()" in fcode, f"Form {form_file} missing csrfInput()!"
    assert "requireCsrfToken()" in fcode, f"Form {form_file} missing requireCsrfToken()!"
    print(f"  [PASS] {form_file:<22} contains both csrfInput() and requireCsrfToken()")

print("\n" + "="*70)
print("ALL PHASE 2 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
print("="*70)
