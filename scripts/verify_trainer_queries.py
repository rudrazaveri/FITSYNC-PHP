import re

with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

def check_table_cols(table, cols):
    m = re.search(r'CREATE TABLE `' + table + r'` \((.*?)\) ENGINE=InnoDB', sql, re.DOTALL)
    if not m:
        print(f"Table `{table}` NOT FOUND!")
        return
    body = m.group(1)
    print(f"Checking table `{table}`:")
    for c in cols:
        found = f"`{c}`" in body
        print(f"  Column `{c}`: {'OK' if found else 'MISSING'}")

check_table_cols('trainer_profiles', ['user_id', 'certification_name', 'certifying_body', 'experience_years', 'specializations_summary', 'bio', 'hourly_rate', 'rating'])
check_table_cols('trainer_assignments', ['id', 'user_id', 'trainer_user_id', 'gym_id', 'status', 'start_date', 'notes'])
check_table_cols('trainer_sessions', ['id', 'trainer_user_id', 'member_user_id', 'gym_id', 'session_date', 'start_time', 'end_time', 'session_type', 'status', 'session_notes'])
check_table_cols('trainer_notes', ['id', 'user_id', 'trainer_user_id', 'note_type', 'note_text', 'is_visible_to_user', 'created_at'])
check_table_cols('fitness_goals', ['id', 'user_id', 'primary_goal', 'target_weight_kg', 'target_date', 'status'])
check_table_cols('workout_plans', ['id', 'name', 'description', 'author_trainer_id', 'difficulty', 'days_per_week'])
check_table_cols('plan_assignments', ['id', 'plan_id', 'user_id', 'assigned_by_trainer_id', 'start_date', 'is_active', 'status'])
check_table_cols('attendance', ['id', 'user_id', 'gym_id', 'check_in_time', 'check_in_method', 'status'])
check_table_cols('conversations', ['id', 'participant_one_id', 'participant_two_id', 'conversation_type', 'last_message_at'])
check_table_cols('messages', ['id', 'conversation_id', 'sender_id', 'message_text', 'is_read', 'sent_at'])
