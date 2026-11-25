-- Safe non-destructive migration for end-to-end enrollment lifecycle audit fields,
-- owner approval/rejection tracking, rejection reasons, and cross-portal query indexes.
-- Preserves all existing tables, users, gyms, memberships, and relationships.

ALTER TABLE `memberships`
    ADD COLUMN IF NOT EXISTS `approved_by_user_id` BIGINT UNSIGNED NULL AFTER `auto_renew`,
    ADD COLUMN IF NOT EXISTS `approved_at` DATETIME NULL AFTER `approved_by_user_id`,
    ADD COLUMN IF NOT EXISTS `rejected_by_user_id` BIGINT UNSIGNED NULL AFTER `approved_at`,
    ADD COLUMN IF NOT EXISTS `rejected_at` DATETIME NULL AFTER `rejected_by_user_id`,
    ADD COLUMN IF NOT EXISTS `rejection_reason` TEXT NULL AFTER `rejected_at`;

CREATE INDEX IF NOT EXISTS `idx_memberships_gym_status` ON `memberships` (`gym_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_memberships_user_status` ON `memberships` (`user_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_ta_gym_status` ON `trainer_assignments` (`gym_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_ta_user_status` ON `trainer_assignments` (`user_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_messages_conv_sender_read` ON `messages` (`conversation_id`, `sender_id`, `is_read`);
CREATE INDEX IF NOT EXISTS `idx_notifications_user_read_created` ON `notifications` (`user_id`, `is_read`, `created_at`);
