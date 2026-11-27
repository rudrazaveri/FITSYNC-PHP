-- FitSync Migration: Complete Workout Planning, Exercise Library & Assignment System
-- Date: 2026-11-26

ALTER TABLE `exercises`
  ADD COLUMN IF NOT EXISTS `description` TEXT NULL AFTER `name`,
  ADD COLUMN IF NOT EXISTS `category` VARCHAR(60) NOT NULL DEFAULT 'Chest' AFTER `description`,
  ADD COLUMN IF NOT EXISTS `video_url` VARCHAR(255) NULL AFTER `image_path`,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `is_verified`;

ALTER TABLE `workout_plans`
  ADD COLUMN IF NOT EXISTS `split_type` VARCHAR(60) NOT NULL DEFAULT 'Custom Split' AFTER `goal`,
  ADD COLUMN IF NOT EXISTS `duration_weeks` INT NOT NULL DEFAULT 4 AFTER `split_type`,
  ADD COLUMN IF NOT EXISTS `trainer_instructions` TEXT NULL AFTER `duration_weeks`,
  ADD COLUMN IF NOT EXISTS `source_template_id` BIGINT UNSIGNED NULL AFTER `trainer_instructions`,
  ADD COLUMN IF NOT EXISTS `is_archived` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_template`;

ALTER TABLE `plan_days`
  ADD COLUMN IF NOT EXISTS `day_type` ENUM('training','rest','active_recovery') NOT NULL DEFAULT 'training' AFTER `focus_area`;

ALTER TABLE `plan_day_exercises`
  ADD COLUMN IF NOT EXISTS `exercise_name_snapshot` VARCHAR(200) NULL AFTER `exercise_id`,
  ADD COLUMN IF NOT EXISTS `target_weight` DECIMAL(7,2) NULL AFTER `target_reps`,
  ADD COLUMN IF NOT EXISTS `weight_unit` ENUM('kg','lbs') NOT NULL DEFAULT 'kg' AFTER `target_weight`,
  ADD COLUMN IF NOT EXISTS `duration_seconds` INT NULL AFTER `rest_seconds`,
  ADD COLUMN IF NOT EXISTS `tempo` VARCHAR(30) NULL AFTER `duration_seconds`,
  ADD COLUMN IF NOT EXISTS `warmup_sets` INT NOT NULL DEFAULT 0 AFTER `tempo`,
  ADD COLUMN IF NOT EXISTS `superset_group` VARCHAR(20) NULL AFTER `warmup_sets`;

ALTER TABLE `plan_assignments`
  ADD COLUMN IF NOT EXISTS `trainer_instructions` TEXT NULL AFTER `end_date`,
  ADD COLUMN IF NOT EXISTS `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `assigned_at`;

ALTER TABLE `workout_sessions`
  ADD COLUMN IF NOT EXISTS `assignment_id` BIGINT UNSIGNED NULL AFTER `plan_day_id`,
  ADD COLUMN IF NOT EXISTS `status` ENUM('in_progress','paused','completed','abandoned') NOT NULL DEFAULT 'completed' AFTER `duration_minutes`,
  ADD COLUMN IF NOT EXISTS `paused_at` DATETIME NULL AFTER `status`,
  ADD COLUMN IF NOT EXISTS `elapsed_seconds` INT NOT NULL DEFAULT 0 AFTER `paused_at`,
  ADD COLUMN IF NOT EXISTS `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

ALTER TABLE `exercise_set_logs`
  ADD COLUMN IF NOT EXISTS `weight_unit` ENUM('kg','lbs') NOT NULL DEFAULT 'kg' AFTER `weight_kg`,
  ADD COLUMN IF NOT EXISTS `notes` VARCHAR(255) NULL AFTER `rpe`;

CREATE TABLE IF NOT EXISTS `plan_day_exercise_sets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `plan_day_exercise_id` BIGINT UNSIGNED NOT NULL,
  `set_number` INT NOT NULL,
  `target_reps` VARCHAR(30) NOT NULL DEFAULT '10',
  `target_weight` DECIMAL(7,2) NULL,
  `weight_unit` ENUM('kg','lbs') NOT NULL DEFAULT 'kg',
  `rest_seconds` INT NOT NULL DEFAULT 90,
  `is_warmup` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pdes_ex_set` (`plan_day_exercise_id`, `set_number`),
  CONSTRAINT `fk_pdes_pde` FOREIGN KEY (`plan_day_exercise_id`) REFERENCES `plan_day_exercises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workout_feedback` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT UNSIGNED NOT NULL,
  `assignment_id` BIGINT UNSIGNED NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `difficulty_rating` ENUM('too_easy','just_right','challenging','very_hard') NOT NULL DEFAULT 'just_right',
  `energy_level` TINYINT NULL,
  `feedback_text` TEXT NULL,
  `trainer_reply` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wf_session` (`session_id`),
  KEY `idx_wf_user` (`user_id`),
  CONSTRAINT `fk_wf_session` FOREIGN KEY (`session_id`) REFERENCES `workout_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wf_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `plan_assignments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_wf_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
