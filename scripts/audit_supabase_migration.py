import re

with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

tables = re.findall(r'CREATE TABLE `([^`]+)` \((.*?)\) ENGINE=InnoDB', sql, re.DOTALL)
print(f"Total tables in MySQL schema: {len(tables)}")

table_details = {}
for name, body in tables:
    cols = re.findall(r'^\s*`([^`]+)`\s+([A-Za-z0-9_()]+)', body, re.MULTILINE)
    fks = re.findall(r'FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)` \(`([^`]+)`\)', body)
    table_details[name] = {
        'col_count': len(cols),
        'cols': cols,
        'fks': fks,
        'has_user_id': any(c[0] == 'user_id' for c in cols),
        'body': body
    }

print("\n--- TABLE CATEGORIZATION ---")
categories = {
    "Auth & User Core": ['users', 'user_profiles', 'user_settings', 'auth_tokens', 'user_sessions', 'notification_preferences', 'password_resets', 'email_verifications'],
    "Gym & Organization": ['gyms', 'gym_branches', 'gym_amenities', 'gym_trainers', 'gym_operating_hours', 'gym_closures'],
    "Trainer & Staff": ['trainer_profiles', 'trainer_certifications', 'trainer_specializations', 'trainer_assignments', 'trainer_availability_rules', 'trainer_unavailable_dates', 'trainer_sessions', 'trainer_notes'],
    "Memberships & Subscriptions": ['membership_plans', 'memberships', 'membership_history', 'membership_pauses', 'membership_cancellations'],
    "Workouts & Exercises": ['exercise_categories', 'muscle_groups', 'exercises', 'exercise_muscles', 'workout_plans', 'plan_days', 'plan_exercises', 'plan_assignments', 'workout_sessions', 'workout_session_exercises', 'workout_session_sets'],
    "Biometrics & Goals": ['body_measurements', 'fitness_goals', 'fitness_assessments', 'health_reports', 'report_categories'],
    "Nutrition & Hydration": ['food_items', 'meals', 'meal_items', 'nutrition_logs', 'water_intake_logs', 'recipes', 'recipe_ingredients'],
    "Attendance & Check-in": ['attendance', 'qr_checkins', 'geofence_checkins', 'turnstile_logs', 'attendance_streaks'],
    "Communications & Social": ['conversations', 'conversation_participants', 'messages', 'notifications', 'community_posts', 'post_comments', 'post_likes'],
    "Gamification & Challenges": ['badges', 'user_badges', 'challenges', 'challenge_participants', 'leaderboards'],
    "Billing & Payments": ['invoices', 'invoice_items', 'payments', 'payment_methods', 'refunds'],
    "Platform Administration": ['audit_logs', 'system_settings', 'admin_actions', 'feature_flags']
}

all_categorized = set()
for cat, tbls in categories.items():
    found = [t for t in tbls if t in table_details]
    all_categorized.update(found)
    print(f"{cat}: {len(found)} tables")

uncategorized = set(table_details.keys()) - all_categorized
print(f"\nUncategorized tables ({len(uncategorized)}):", uncategorized)
