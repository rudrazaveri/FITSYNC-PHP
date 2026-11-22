import os, re

with open('scripts/generate_mysql_schema.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Section 5 Title
content = re.sub(
    r'-- 5\. TRAINER-MEMBER ASSIGNMENTS & DATA ACCESS',
    '-- 5. TRAINER-MEMBER ASSIGNMENTS, SCHEDULES & SESSIONS',
    content
)

# New tables to insert after trainer_data_permissions
new_tables = """DROP TABLE IF EXISTS `trainer_availability_rules`;
CREATE TABLE `trainer_availability_rules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `trainer_user_id` BIGINT UNSIGNED NOT NULL,
    `gym_id` BIGINT UNSIGNED DEFAULT NULL,
    `day_of_week` TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday ... 6=Saturday',
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `slot_duration_minutes` INT NOT NULL DEFAULT 60,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tar_trainer` (`trainer_user_id`),
    INDEX `idx_tar_gym` (`gym_id`),
    CONSTRAINT `fk_tar_trainer` FOREIGN KEY (`trainer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tar_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trainer_unavailability`;
CREATE TABLE `trainer_unavailability` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `trainer_user_id` BIGINT UNSIGNED NOT NULL,
    `start_datetime` DATETIME NOT NULL,
    `end_datetime` DATETIME NOT NULL,
    `reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_tu_trainer_time` (`trainer_user_id`, `start_datetime`, `end_datetime`),
    CONSTRAINT `fk_tu_trainer` FOREIGN KEY (`trainer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trainer_sessions`;
CREATE TABLE `trainer_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `trainer_user_id` BIGINT UNSIGNED NOT NULL,
    `member_user_id` BIGINT UNSIGNED NOT NULL,
    `gym_id` BIGINT UNSIGNED DEFAULT NULL,
    `session_date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `session_type` ENUM('personal_training','fitness_assessment','form_check','nutrition_review','workout_intro') NOT NULL DEFAULT 'personal_training',
    `status` ENUM('scheduled','completed','cancelled','rescheduled','no_show') NOT NULL DEFAULT 'scheduled',
    `rescheduled_to_id` BIGINT UNSIGNED DEFAULT NULL,
    `cancellation_reason` TEXT DEFAULT NULL,
    `session_notes` TEXT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_ts_trainer_date` (`trainer_user_id`, `session_date`),
    INDEX `idx_ts_member_date` (`member_user_id`, `session_date`),
    INDEX `idx_ts_status` (`status`),
    CONSTRAINT `fk_ts_trainer` FOREIGN KEY (`trainer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ts_member` FOREIGN KEY (`member_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ts_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ts_rescheduled` FOREIGN KEY (`rescheduled_to_id`) REFERENCES `trainer_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

# Find end of trainer_data_permissions
tdp_pattern = r'(CREATE TABLE `trainer_data_permissions`.*?\)\s*ENGINE=InnoDB[^\n]*;)'
m = re.search(tdp_pattern, content, re.DOTALL)
if not m:
    raise Exception("Could not find trainer_data_permissions table definition!")

content = content[:m.end()] + "\n\n" + new_tables + content[m.end():]

# Rename lab_or_clinic_name to facility_or_provider_name
content = re.sub(
    r'`lab_or_clinic_name`\s+VARCHAR\(200\)\s+DEFAULT\s+NULL,',
    '`facility_or_provider_name` VARCHAR(200) DEFAULT NULL,',
    content
)

# Add seed data for availability rules & trainer sessions
seed_pattern = r'(INSERT INTO `trainer_data_permissions`.*?;)'
m_seed = re.search(seed_pattern, content, re.DOTALL)
if not m_seed:
    raise Exception("Could not find trainer_data_permissions seed data!")

new_seed = """

-- 8b. Trainer Availability Rules (Coach Raj: Mon-Sat, 06:00 to 12:00 and 16:00 to 20:00)
INSERT INTO `trainer_availability_rules` (`trainer_user_id`, `gym_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`, `is_active`) VALUES
(3, 1, 1, '06:00:00', '12:00:00', 60, 1),
(3, 1, 1, '16:00:00', '20:00:00', 60, 1),
(3, 1, 2, '06:00:00', '12:00:00', 60, 1),
(3, 1, 2, '16:00:00', '20:00:00', 60, 1),
(3, 1, 3, '06:00:00', '12:00:00', 60, 1),
(3, 1, 3, '16:00:00', '20:00:00', 60, 1),
(3, 1, 4, '06:00:00', '12:00:00', 60, 1),
(3, 1, 4, '16:00:00', '20:00:00', 60, 1),
(3, 1, 5, '06:00:00', '12:00:00', 60, 1),
(3, 1, 5, '16:00:00', '20:00:00', 60, 1),
(3, 1, 6, '07:00:00', '13:00:00', 60, 1);

-- 8c. Sample Trainer Training Sessions
INSERT INTO `trainer_sessions` (`id`, `trainer_user_id`, `member_user_id`, `gym_id`, `session_date`, `start_time`, `end_time`, `session_type`, `status`, `session_notes`) VALUES
(1, 3, 7, 1, CURDATE(), '07:00:00', '08:00:00', 'personal_training', 'scheduled', 'Upper body push & pull mechanics review.'),
(2, 3, 6, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:00:00', '09:00:00', 'form_check', 'completed', 'Checked barbell squat depth, hip hinge, and torso bracing.');"""

content = content[:m_seed.end()] + new_seed + content[m_seed.end():]

with open('scripts/generate_mysql_schema.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("scripts/generate_mysql_schema.py successfully updated!")
