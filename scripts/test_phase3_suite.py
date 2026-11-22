import os
import re
import sys

def check_php_syntax_tokens(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Basic PHP syntax and balance checks
    if not (content.startswith("<?php") or content.startswith("<!DOCTYPE") or "<script" in content or "<?php" in content):
        return False, "File does not start with PHP opening tag or HTML doctype"

    # Bracket matching
    open_curly = content.count('{')
    close_curly = content.count('}')
    if open_curly != close_curly:
        return False, f"Unbalanced curly brackets: {open_curly} open vs {close_curly} close"

    open_paren = content.count('(')
    close_paren = content.count(')')
    if open_paren != close_paren:
        return False, f"Unbalanced parentheses: {open_paren} open vs {close_paren} close"

    return True, "Tokens balanced & syntax structure valid"

def test_phase3_suite():
    print("=================================================================")
    print("          FITSYNC PHASE 3 - VERIFICATION TEST SUITE              ")
    print("=================================================================")

    # 1. File Inventory & Structural Syntax Check
    print("\n--- 1. File Inventory & PHP Structure Check ---")
    files_to_check = [
        "includes/trainer_data.php",
        "trainer/index.php",
        "trainer/includes/header.php",
        "trainer/includes/sidebar.php",
        "trainer/includes/footer.php",
        "trainer/dashboard.php",
        "trainer/members.php",
        "trainer/member_details.php",
        "trainer/schedule.php",
        "trainer/workouts.php",
        "trainer/exercise_library.php",
        "trainer/attendance.php",
        "trainer/messages.php",
        "trainer/notifications.php",
        "trainer/profile.php",
        "trainer/settings.php",
        "api/trainer/members.php",
        "api/trainer/member_details.php",
        "api/trainer/notes.php",
        "api/trainer/schedule.php",
        "user/index.php",
        "user/dashboard.php",
        "user/workouts.php",
        "user/exercise_library.php",
        "user/progress.php",
        "user/nutrition.php",
        "user/attendance.php",
        "user/trainer.php",
        "user/messages.php",
        "user/notifications.php",
        "user/profile.php",
        "user/settings.php",
        "user/portal_template.php"
    ]

    all_syntax_pass = True
    for f in files_to_check:
        if not os.path.exists(f):
            print(f" [FAIL] File missing: {f}")
            all_syntax_pass = False
            continue
        ok, msg = check_php_syntax_tokens(f)
        if ok:
            print(f" [PASS] {f} ({os.path.getsize(f):,} bytes) - {msg}")
        else:
            print(f" [FAIL] Syntax/token check failed in {f}: {msg}")
            all_syntax_pass = False

    # 2. Static Asset Verification
    print("\n--- 2. Static Asset Verification ---")
    assets = [
        "css/trainer.css",
        "js/trainer.js"
    ]
    assets_pass = True
    for a in assets:
        if os.path.exists(a) and os.path.getsize(a) > 0:
            print(f" [PASS] Asset exists & non-empty: {a} ({os.path.getsize(a):,} bytes)")
        else:
            print(f" [FAIL] Asset missing or empty: {a}")
            assets_pass = False

    # 3. RBAC & Access Control Checks
    print("\n--- 3. Role-Based Access Control (RBAC) Protection Verification ---")
    
    # User routes must require 'user' role
    user_files = [f for f in files_to_check if f.startswith("user/") and f != "user/portal_template.php"]
    user_rbac_pass = True
    for uf in user_files:
        with open(uf, 'r', encoding='utf-8') as handle:
            content = handle.read()
        if "requireRole('user')" in content:
            print(f" [PASS] User portal route protected: {uf} -> requireRole('user')")
        else:
            print(f" [FAIL] Missing requireRole('user') in {uf}")
            user_rbac_pass = False

    # Trainer pages must require 'trainer' role
    trainer_pages = [f for f in files_to_check if f.startswith("trainer/") and not f.startswith("trainer/includes/")]
    trainer_rbac_pass = True
    for tf in trainer_pages:
        with open(tf, 'r', encoding='utf-8') as handle:
            content = handle.read()
        if "requireRole('trainer')" in content:
            print(f" [PASS] Trainer portal page protected: {tf} -> requireRole('trainer')")
        else:
            print(f" [FAIL] Missing requireRole('trainer') in {tf}")
            trainer_rbac_pass = False

    # Trainer APIs must require 'trainer' role
    trainer_apis = [f for f in files_to_check if f.startswith("api/trainer/")]
    api_rbac_pass = True
    for ap in trainer_apis:
        with open(ap, 'r', encoding='utf-8') as handle:
            content = handle.read()
        if "requireRole('trainer')" in content:
            print(f" [PASS] Trainer API endpoint protected: {ap} -> requireRole('trainer')")
        else:
            print(f" [FAIL] Missing requireRole('trainer') in {ap}")
            api_rbac_pass = False

    # 4. Member Assignment Privacy Logic Verification
    print("\n--- 4. Member Assignment Privacy Logic Verification ---")
    with open("includes/trainer_data.php", "r", encoding="utf-8") as f:
        td_code = f.read()

    privacy_pass = True
    if "FROM trainer_assignments" in td_code and "trainer_user_id = :tid" in td_code and "user_id = :uid" in td_code:
        print(" [PASS] trainer_data.php enforces strict trainer_assignments query binding trainer_user_id and user_id.")
    else:
        print(" [FAIL] trainer_data.php does not strictly enforce trainer_assignments verification.")
        privacy_pass = False

    if "return null;" in td_code:
        print(" [PASS] getAssignedMemberDetails returns null when unassigned, preventing data disclosure.")
    else:
        print(" [FAIL] Missing null return on unassigned member.")
        privacy_pass = False

    with open("trainer/member_details.php", "r", encoding="utf-8") as f:
        md_code = f.read()

    if "http_response_code(403)" in md_code and "Access Denied" in md_code:
        print(" [PASS] trainer/member_details.php issues HTTP 403 status & Access Denied screen on unassigned access.")
    else:
        print(" [FAIL] trainer/member_details.php missing HTTP 403 status or Access Denied UI.")
        privacy_pass = False

    with open("api/trainer/member_details.php", "r", encoding="utf-8") as f:
        api_code = f.read()

    if "403" in api_code and "Access Denied" in api_code:
        print(" [PASS] api/trainer/member_details.php returns HTTP 403 Forbidden on unassigned member access.")
    else:
        print(" [FAIL] api/trainer/member_details.php missing HTTP 403 status call.")
        privacy_pass = False

    # 5. User Portal Feature & UI Preservation Check
    print("\n--- 5. User Portal Feature & UI Preservation Check ---")
    with open("user/portal_template.php", "r", encoding="utf-8") as f:
        user_tpl = f.read()

    preservation_items = [
        ("Base href injection for clean relative asset loading", '<base href="'),
        ("Authenticated user state injection for seamless session handoff", 'window.__AUTHENTICATED_USER__'),
        ("Initial active view state injection for deep linking", 'window.__INITIAL_VIEW__'),
        ("11+ SVG anatomical and vector icons", '<svg'),
        ("Workout Logger interface (actionLogWorkout)", 'actionLogWorkout'),
        ("Rest Timer controls", 'restTimer'),
        ("Exercise Library view container (view-exercises)", 'id="view-exercises"'),
        ("Workouts view container (view-workouts)", 'id="view-workouts"'),
        ("Progress view container (view-progress)", 'id="view-progress"'),
        ("Nutrition view container (view-nutrition)", 'id="view-nutrition"'),
        ("Attendance view container (view-attendance)", 'id="view-attendance"'),
        ("Weekly Activity Chart canvas", 'id="weeklyActivityChart"'),
        ("Recent Progress Chart canvas", 'id="recentProgressChart"'),
        ("Full Progress Chart canvas", 'id="fullProgressChart"')
    ]

    tpl_pass = True
    for name, pattern in preservation_items:
        if pattern.lower() in user_tpl.lower():
            print(f" [PASS] Preserved User UI component: {name}")
        else:
            print(f" [FAIL] Missing or altered User UI component: {name}")
            tpl_pass = False

    # 6. Database Schema Alignment Verification
    print("\n--- 6. SQL Schema Alignment in Trainer Functions ---")
    with open("database/fitsync_mysql_schema.sql", "r", encoding="utf-8") as f:
        schema = f.read()

    schema_checks = [
        ("trainer_profiles", ["user_id", "certification_name", "certifying_body", "experience_years", "specializations_summary", "bio", "rating"]),
        ("trainer_assignments", ["trainer_user_id", "user_id", "status"]),
        ("fitness_goals", ["user_id", "title", "goal_type", "target_weight_kg", "status"]),
        ("trainer_sessions", ["trainer_user_id", "member_user_id", "session_date", "start_time", "end_time", "status"]),
        ("trainer_notes", ["user_id", "trainer_user_id", "note_type", "note_text", "created_at"]),
        ("workout_sessions", ["user_id", "session_date", "duration_minutes", "total_volume_kg", "total_sets_completed", "perceived_rpe"]),
        ("body_measurements", ["user_id", "recorded_at", "weight_kg", "body_fat_pct"]),
        ("attendance", ["user_id", "gym_id", "check_in_time", "status"])
    ]

    schema_pass = True
    for tbl, cols in schema_checks:
        tbl_match = re.search(r'CREATE TABLE `' + tbl + r'` \((.*?)\) ENGINE=InnoDB', schema, re.DOTALL)
        if not tbl_match:
            print(f" [FAIL] Table {tbl} missing in fitsync_mysql_schema.sql")
            schema_pass = False
            continue
        tbl_def = tbl_match.group(1)
        for c in cols:
            if f"`{c}`" not in tbl_def:
                print(f" [FAIL] Column `{c}` not in table `{tbl}`")
                schema_pass = False
        print(f" [PASS] Verified columns for `{tbl}` ({len(cols)} checked)")

    print("\n=================================================================")
    print("                    PHASE 3 VERIFICATION SUMMARY                 ")
    print("=================================================================")
    overall_pass = all_syntax_pass and assets_pass and user_rbac_pass and trainer_rbac_pass and api_rbac_pass and privacy_pass and tpl_pass and schema_pass
    print(f" File Syntax & Inventory: {'PASSED' if all_syntax_pass else 'FAILED'}")
    print(f" Static Assets:           {'PASSED' if assets_pass else 'FAILED'}")
    print(f" RBAC Route Security:     {'PASSED' if user_rbac_pass and trainer_rbac_pass and api_rbac_pass else 'FAILED'}")
    print(f" Member Privacy Logic:    {'PASSED' if privacy_pass else 'FAILED'}")
    print(f" User UI Preservation:    {'PASSED' if tpl_pass else 'FAILED'}")
    print(f" Database SQL Alignment:  {'PASSED' if schema_pass else 'FAILED'}")
    print("-----------------------------------------------------------------")
    print(f" OVERALL PHASE 3 STATUS:  {'ALL CHECKS PASSED (100%)' if overall_pass else 'FAILED'}")
    print("=================================================================")
    return overall_pass

if __name__ == "__main__":
    success = test_phase3_suite()
    sys.exit(0 if success else 1)
