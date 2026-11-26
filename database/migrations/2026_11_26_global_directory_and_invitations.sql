-- FitSync Migration: Global Gym Directory, Invitations & Audit Integrity
-- Date: 2026-11-26

CREATE TABLE IF NOT EXISTS `gym_invitations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `gym_id` BIGINT UNSIGNED NOT NULL,
  `invited_by_user_id` BIGINT UNSIGNED NOT NULL,
  `invited_user_id` BIGINT UNSIGNED NULL,
  `invited_email` VARCHAR(191) NOT NULL,
  `invited_name` VARCHAR(150) NULL,
  `invited_phone` VARCHAR(30) NULL,
  `plan_id` BIGINT UNSIGNED NULL,
  `trainer_user_id` BIGINT UNSIGNED NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `status` ENUM('pending','accepted','rejected','expired','cancelled') NOT NULL DEFAULT 'pending',
  `expires_at` DATETIME NOT NULL,
  `accepted_at` DATETIME NULL,
  `rejected_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gym_inv_token_hash` (`token_hash`),
  KEY `idx_gym_inv_email_status` (`invited_email`, `status`),
  KEY `idx_gym_inv_user_status` (`invited_user_id`, `status`),
  KEY `idx_gym_inv_gym_status` (`gym_id`, `status`),
  CONSTRAINT `fk_gym_inv_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gym_inv_by` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gym_inv_user` FOREIGN KEY (`invited_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gym_inv_plan` FOREIGN KEY (`plan_id`) REFERENCES `membership_plans` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gym_inv_trainer` FOREIGN KEY (`trainer_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `gyms`
  ADD COLUMN IF NOT EXISTS `is_published` TINYINT(1) NOT NULL DEFAULT 1 AFTER `status`,
  ADD COLUMN IF NOT EXISTS `verification_status` ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending' AFTER `is_published`;

ALTER TABLE `memberships`
  ADD COLUMN IF NOT EXISTS `payment_status` ENUM('unpaid','pending','paid','refunded') NOT NULL DEFAULT 'unpaid' AFTER `status`;

-- Ensure existing active gyms are published, and pending_approval gyms from registration are usable if active
UPDATE `gyms` SET `is_published` = 1 WHERE `is_published` IS NULL;
