-- Safe non-destructive migration for granular member consent & progress monitoring indexes
ALTER TABLE `trainer_data_permissions`
    ADD COLUMN IF NOT EXISTS `can_view_progress_photos` TINYINT(1) NOT NULL DEFAULT 0 AFTER `can_log_attendance`,
    ADD COLUMN IF NOT EXISTS `can_view_workouts` TINYINT(1) NOT NULL DEFAULT 1 AFTER `can_view_progress_photos`;

CREATE INDEX IF NOT EXISTS `idx_progress_photos_user_date` ON `progress_photos` (`user_id`, `recorded_at`);
CREATE INDEX IF NOT EXISTS `idx_workout_sessions_user_date` ON `workout_sessions` (`user_id`, `session_date`);
