import os
import re

os.makedirs('database', exist_ok=True)
print("Starting generation of MySQL schema and seed data...")

schema_sql = """-- =====================================================================
-- FitSync – Complete MySQL 8.0 / MariaDB 10.4+ Database Schema
--
-- Roles: user (member/athlete), trainer (coach), gym_owner, admin
-- Architecture: Consolidated PHP + MySQL Backend with PDO Data Access
-- 
-- Explicitly Excluded (Per Master Spec):
--   * Doctor & Physiotherapist modules
--   * Medical appointment booking & consultations
--   * Patient & physiotherapy rehabilitation management
--
-- Technical Characteristics:
--   * Engine: InnoDB with utf8mb4_unicode_ci for internationalization
--   * Primary Keys: BIGINT UNSIGNED AUTO_INCREMENT
--   * Timestamps: DATETIME with CURRENT_TIMESTAMP
--   * Foreign Keys: Explicit ON DELETE CASCADE / ON DELETE SET NULL
--   * Key Indexes: Optimized for user search, attendance, and workout analytics
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS `fitsync_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fitsync_db`;

-- =====================================================================
-- 1. FILES & MEDIA ASSET REGISTRY
-- =====================================================================
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `owner_user_id` BIGINT UNSIGNED DEFAULT NULL,
    `storage_key` VARCHAR(255) NOT NULL UNIQUE,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size_bytes` BIGINT UNSIGNED NOT NULL,
    `purpose` ENUM('profile_picture','gym_photo','verification_doc','health_report','progress_photo','exercise_media','message_attachment','report_export','other') NOT NULL,
    `is_private` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    INDEX `idx_files_owner` (`owner_user_id`),
    INDEX `idx_files_purpose` (`purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. CORE USERS & AUTHENTICATION
-- =====================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `mobile` VARCHAR(30) DEFAULT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('user','trainer','gym_owner','admin') NOT NULL DEFAULT 'user',
    `full_name` VARCHAR(150) NOT NULL,
    `profile_picture_id` BIGINT UNSIGNED DEFAULT NULL,
    `email_verified_at` DATETIME DEFAULT NULL,
    `status` ENUM('active','deactivated','suspended','deleted') NOT NULL DEFAULT 'active',
    `last_login_at` DATETIME DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_status` (`status`),
    CONSTRAINT `fk_users_profile_picture` FOREIGN KEY (`profile_picture_id`) REFERENCES `files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `files` ADD CONSTRAINT `fk_files_owner` 
    FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

DROP TABLE IF EXISTS `auth_tokens`;
CREATE TABLE `auth_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `purpose` ENUM('email_verify','password_reset','email_change') NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL UNIQUE,
    `new_email` VARCHAR(191) DEFAULT NULL,
    `expires_at` DATETIME NOT NULL,
    `used_at` DATETIME DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_auth_tokens_user` (`user_id`),
    CONSTRAINT `fk_auth_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `session_token_hash` VARCHAR(255) NOT NULL UNIQUE,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sessions_user` (`user_id`),
    CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `account_deletion_requests`;
CREATE TABLE `account_deletion_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `reason` TEXT DEFAULT NULL,
    `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `scheduled_for` DATETIME NOT NULL,
    `cancelled_at` DATETIME DEFAULT NULL,
    INDEX `idx_deletion_user` (`user_id`),
    CONSTRAINT `fk_deletion_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL UNIQUE,
    `theme` VARCHAR(30) NOT NULL DEFAULT 'light',
    `language` VARCHAR(10) NOT NULL DEFAULT 'en',
    `measurement_system` ENUM('metric','imperial') NOT NULL DEFAULT 'metric',
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notification_preferences`;
CREATE TABLE `notification_preferences` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `event_type` VARCHAR(50) NOT NULL,
    `in_app` TINYINT(1) NOT NULL DEFAULT 1,
    `email` TINYINT(1) NOT NULL DEFAULT 1,
    `sms` TINYINT(1) NOT NULL DEFAULT 0,
    `push` TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY `uq_user_event_pref` (`user_id`, `event_type`),
    CONSTRAINT `fk_notif_pref_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. PROFILES, TRAINERS & INTERESTS
-- =====================================================================
DROP TABLE IF EXISTS `user_profiles`;
CREATE TABLE `user_profiles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL UNIQUE,
    `date_of_birth` DATE DEFAULT NULL,
    `gender` ENUM('male','female','other','prefer_not_to_say') DEFAULT NULL,
    `height_cm` DECIMAL(5,2) DEFAULT NULL,
    `weight_kg` DECIMAL(5,2) DEFAULT NULL,
    `fitness_experience` ENUM('beginner','intermediate','advanced','elite') NOT NULL DEFAULT 'intermediate',
    `emergency_contact_name` VARCHAR(100) DEFAULT NULL,
    `emergency_contact_phone` VARCHAR(30) DEFAULT NULL,
    `emergency_contact_relation` VARCHAR(50) DEFAULT NULL,
    `bio` TEXT DEFAULT NULL,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `fitness_interests`;
CREATE TABLE `fitness_interests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `icon` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_fitness_interests`;
CREATE TABLE `user_fitness_interests` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `interest_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`user_id`, `interest_id`),
    CONSTRAINT `fk_ufi_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ufi_interest` FOREIGN KEY (`interest_id`) REFERENCES `fitness_interests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trainer_profiles`;
CREATE TABLE `trainer_profiles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL UNIQUE,
    `certification_name` VARCHAR(255) DEFAULT NULL,
    `certifying_body` VARCHAR(255) DEFAULT NULL,
    `certification_year` INT DEFAULT NULL,
    `experience_years` INT NOT NULL DEFAULT 0,
    `specializations_summary` VARCHAR(255) DEFAULT NULL,
    `bio` TEXT DEFAULT NULL,
    `hourly_rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `rating` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    `reviews_count` INT NOT NULL DEFAULT 0,
    `status` ENUM('pending_verification','verified','rejected') NOT NULL DEFAULT 'verified',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_trainer_profile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trainer_credentials`;
CREATE TABLE `trainer_credentials` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `trainer_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `issuer` VARCHAR(255) NOT NULL,
    `year_obtained` INT DEFAULT NULL,
    `credential_file_id` BIGINT UNSIGNED DEFAULT NULL,
    `verification_status` ENUM('pending','verified','rejected') NOT NULL DEFAULT 'verified',
    INDEX `idx_credentials_trainer` (`trainer_id`),
    CONSTRAINT `fk_trainer_cred_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_trainer_cred_file` FOREIGN KEY (`credential_file_id`) REFERENCES `files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `specializations`;
CREATE TABLE `specializations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trainer_specializations`;
CREATE TABLE `trainer_specializations` (
    `trainer_id` BIGINT UNSIGNED NOT NULL,
    `specialization_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`trainer_id`, `specialization_id`),
    CONSTRAINT `fk_ts_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ts_spec` FOREIGN KEY (`specialization_id`) REFERENCES `specializations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `verification_requests`;
CREATE TABLE `verification_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `reviewed_by` BIGINT UNSIGNED DEFAULT NULL,
    `reviewed_at` DATETIME DEFAULT NULL,
    `rejection_reason` TEXT DEFAULT NULL,
    INDEX `idx_verif_user` (`user_id`),
    CONSTRAINT `fk_verif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_verif_admin` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `verification_documents`;
CREATE TABLE `verification_documents` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `request_id` BIGINT UNSIGNED NOT NULL,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `document_type` VARCHAR(100) NOT NULL,
    `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    INDEX `idx_verif_docs_req` (`request_id`),
    CONSTRAINT `fk_verif_docs_req` FOREIGN KEY (`request_id`) REFERENCES `verification_requests` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_verif_docs_file` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. GYMS, FACILITIES & EQUIPMENT
-- =====================================================================
DROP TABLE IF EXISTS `gyms`;
CREATE TABLE `gyms` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `owner_user_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `brand_name` VARCHAR(200) DEFAULT NULL,
    `registration_no` VARCHAR(100) DEFAULT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `address_line1` VARCHAR(255) NOT NULL,
    `address_line2` VARCHAR(255) DEFAULT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NOT NULL,
    `latitude` DECIMAL(10,7) DEFAULT NULL,
    `longitude` DECIMAL(10,7) DEFAULT NULL,
    `cover_photo_id` BIGINT UNSIGNED DEFAULT NULL,
    `rating` DECIMAL(3,2) NOT NULL DEFAULT 4.80,
    `status` ENUM('active','inactive','pending_approval') NOT NULL DEFAULT 'active',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_gyms_owner` (`owner_user_id`),
    INDEX `idx_gyms_city` (`city`),
    CONSTRAINT `fk_gyms_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gyms_cover` FOREIGN KEY (`cover_photo_id`) REFERENCES `files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gym_photos`;
CREATE TABLE `gym_photos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `gym_id` BIGINT UNSIGNED NOT NULL,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `caption` VARCHAR(255) DEFAULT NULL,
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
    `display_order` INT NOT NULL DEFAULT 0,
    INDEX `idx_gym_photos_gym` (`gym_id`),
    CONSTRAINT `fk_gym_photos_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gym_photos_file` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gym_operating_hours`;
CREATE TABLE `gym_operating_hours` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `gym_id` BIGINT UNSIGNED NOT NULL,
    `day_of_week` TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday ... 6=Saturday',
    `open_time` TIME DEFAULT NULL,
    `close_time` TIME DEFAULT NULL,
    `is_closed` TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY `uq_gym_day` (`gym_id`, `day_of_week`),
    CONSTRAINT `fk_gym_hours_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `facilities`;
CREATE TABLE `facilities` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `icon` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gym_facilities`;
CREATE TABLE `gym_facilities` (
    `gym_id` BIGINT UNSIGNED NOT NULL,
    `facility_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`gym_id`, `facility_id`),
    CONSTRAINT `fk_gf_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gf_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `equipment`;
CREATE TABLE `equipment` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `category` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gym_equipment`;
CREATE TABLE `gym_equipment` (
    `gym_id` BIGINT UNSIGNED NOT NULL,
    `equipment_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `condition_status` ENUM('excellent','good','fair','maintenance') NOT NULL DEFAULT 'good',
    PRIMARY KEY (`gym_id`, `equipment_id`),
    CONSTRAINT `fk_ge_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ge_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gym_trainers`;
CREATE TABLE `gym_trainers` (
    `gym_id` BIGINT UNSIGNED NOT NULL,
    `trainer_user_id` BIGINT UNSIGNED NOT NULL,
    `employment_type` ENUM('full_time','part_time','freelance') NOT NULL DEFAULT 'full_time',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `joined_at` DATE NOT NULL,
    PRIMARY KEY (`gym_id`, `trainer_user_id`),
    CONSTRAINT `fk_gt_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gt_trainer` FOREIGN KEY (`trainer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `membership_plans`;
CREATE TABLE `membership_plans` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `gym_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `duration_months` INT NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `access_type` ENUM('single_gym','multi_gym_brand','all_access') NOT NULL DEFAULT 'single_gym',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_plans_gym` (`gym_id`),
    CONSTRAINT `fk_plans_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `memberships`;
CREATE TABLE `memberships` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `plan_id` BIGINT UNSIGNED NOT NULL,
    `gym_id` BIGINT UNSIGNED NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('active','expired','cancelled','frozen') NOT NULL DEFAULT 'active',
    `qr_code_token` VARCHAR(255) NOT NULL UNIQUE,
    `auto_renew` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_memberships_user` (`user_id`),
    INDEX `idx_memberships_gym` (`gym_id`),
    CONSTRAINT `fk_memberships_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_memberships_plan` FOREIGN KEY (`plan_id`) REFERENCES `membership_plans` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_memberships_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 5. TRAINER-MEMBER ASSIGNMENTS, SCHEDULES & SESSIONS
-- =====================================================================
DROP TABLE IF EXISTS `trainer_assignments`;
CREATE TABLE `trainer_assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `trainer_user_id` BIGINT UNSIGNED NOT NULL,
    `gym_id` BIGINT UNSIGNED DEFAULT NULL,
    `assigned_by_user_id` BIGINT UNSIGNED DEFAULT NULL,
    `status` ENUM('active','inactive','transferred','completed') NOT NULL DEFAULT 'active',
    `start_date` DATE NOT NULL,
    `end_date` DATE DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_ta_user` (`user_id`),
    INDEX `idx_ta_trainer` (`trainer_user_id`),
    CONSTRAINT `fk_ta_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ta_trainer` FOREIGN KEY (`trainer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ta_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ta_assigned_by` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `reassignment_requests`;
CREATE TABLE `reassignment_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `assignment_id` BIGINT UNSIGNED NOT NULL,
    `requested_by_user_id` BIGINT UNSIGNED NOT NULL,
    `preferred_trainer_id` BIGINT UNSIGNED DEFAULT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `decided_at` DATETIME DEFAULT NULL,
    `decision_notes` TEXT DEFAULT NULL,
    INDEX `idx_rr_assignment` (`assignment_id`),
    CONSTRAINT `fk_rr_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `trainer_assignments` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rr_req_user` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rr_pref_trainer` FOREIGN KEY (`preferred_trainer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trainer_data_permissions`;
CREATE TABLE `trainer_data_permissions` (
    `assignment_id` BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    `can_view_measurements` TINYINT(1) NOT NULL DEFAULT 1,
    `can_view_nutrition` TINYINT(1) NOT NULL DEFAULT 1,
    `can_view_assessments` TINYINT(1) NOT NULL DEFAULT 1,
    `can_log_attendance` TINYINT(1) NOT NULL DEFAULT 1,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tdp_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `trainer_assignments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trainer_availability_rules`;
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


-- =====================================================================
-- 6. BIOMETRICS, ASSESSMENTS & GOALS
-- =====================================================================
DROP TABLE IF EXISTS `fitness_goals`;
CREATE TABLE `fitness_goals` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `goal_type` ENUM('hypertrophy','fat_loss','strength','endurance','mobility','maintenance') NOT NULL DEFAULT 'hypertrophy',
    `target_weight_kg` DECIMAL(5,2) DEFAULT NULL,
    `starting_weight_kg` DECIMAL(5,2) DEFAULT NULL,
    `target_date` DATE DEFAULT NULL,
    `status` ENUM('active','achieved','paused','abandoned') NOT NULL DEFAULT 'active',
    `progress_pct` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_fg_user` (`user_id`),
    CONSTRAINT `fk_fg_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `body_measurements`;
CREATE TABLE `body_measurements` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `recorded_at` DATE NOT NULL,
    `weight_kg` DECIMAL(5,2) NOT NULL,
    `body_fat_pct` DECIMAL(4,1) DEFAULT NULL,
    `chest_cm` DECIMAL(5,2) DEFAULT NULL,
    `waist_cm` DECIMAL(5,2) DEFAULT NULL,
    `hips_cm` DECIMAL(5,2) DEFAULT NULL,
    `arms_cm` DECIMAL(5,2) DEFAULT NULL,
    `thighs_cm` DECIMAL(5,2) DEFAULT NULL,
    `calves_cm` DECIMAL(5,2) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_bm_user_date` (`user_id`, `recorded_at`),
    CONSTRAINT `fk_bm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `progress_photos`;
CREATE TABLE `progress_photos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `photo_type` ENUM('front','back','side_left','side_right') NOT NULL DEFAULT 'front',
    `recorded_at` DATE NOT NULL,
    `is_private` TINYINT(1) NOT NULL DEFAULT 1,
    INDEX `idx_pp_user_date` (`user_id`, `recorded_at`),
    CONSTRAINT `fk_pp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pp_file` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `fitness_assessments`;
CREATE TABLE `fitness_assessments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `assessed_by_user_id` BIGINT UNSIGNED DEFAULT NULL,
    `assessment_date` DATE NOT NULL,
    `height_cm` DECIMAL(5,2) NOT NULL,
    `weight_kg` DECIMAL(5,2) NOT NULL,
    `age` INT NOT NULL,
    `gender` ENUM('male','female','other') NOT NULL DEFAULT 'male',
    `activity_level` DECIMAL(4,3) NOT NULL DEFAULT 1.550,
    `bmr_kcal` INT NOT NULL,
    `tdee_kcal` INT NOT NULL,
    `target_calories_kcal` INT NOT NULL,
    `target_protein_g` INT NOT NULL,
    `target_carbs_g` INT NOT NULL,
    `target_fat_g` INT NOT NULL,
    `bmi` DECIMAL(4,1) NOT NULL,
    `body_fat_us_navy` DECIMAL(4,1) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_fa_user` (`user_id`),
    CONSTRAINT `fk_fa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fa_assessor` FOREIGN KEY (`assessed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 7. MUSCLES, EXERCISES & ANATOMY ENGINE
-- =====================================================================
DROP TABLE IF EXISTS `muscle_groups`;
CREATE TABLE `muscle_groups` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `latin_name` VARCHAR(150) NOT NULL,
    `view_aspect` ENUM('anterior','posterior','both') NOT NULL DEFAULT 'both',
    `category` VARCHAR(100) NOT NULL,
    `biomechanical_function` TEXT NOT NULL,
    `synergist_muscles` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `body_regions`;
CREATE TABLE `body_regions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `code` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `exercises`;
CREATE TABLE `exercises` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL UNIQUE,
    `name` VARCHAR(200) NOT NULL,
    `primary_muscle_id` BIGINT UNSIGNED NOT NULL,
    `body_region_id` BIGINT UNSIGNED DEFAULT NULL,
    `exercise_type` ENUM('compound','isolation','cardio','mobility') NOT NULL DEFAULT 'compound',
    `equipment_required` ENUM('barbell','dumbbell','cable','machine','bodyweight','kettlebell','other') NOT NULL DEFAULT 'barbell',
    `difficulty` ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
    `form_cues` TEXT NOT NULL,
    `coaching_tips` TEXT DEFAULT NULL,
    `default_target_sets` INT NOT NULL DEFAULT 3,
    `default_target_reps` VARCHAR(50) NOT NULL DEFAULT '8-12',
    `default_rest_seconds` INT NOT NULL DEFAULT 90,
    `image_path` VARCHAR(255) NOT NULL,
    `is_verified` TINYINT(1) NOT NULL DEFAULT 1,
    `created_by_trainer_id` BIGINT UNSIGNED DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_ex_muscle` (`primary_muscle_id`),
    INDEX `idx_ex_type` (`exercise_type`),
    CONSTRAINT `fk_ex_muscle` FOREIGN KEY (`primary_muscle_id`) REFERENCES `muscle_groups` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_ex_region` FOREIGN KEY (`body_region_id`) REFERENCES `body_regions` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ex_trainer` FOREIGN KEY (`created_by_trainer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `exercise_media`;
CREATE TABLE `exercise_media` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `exercise_id` BIGINT UNSIGNED NOT NULL,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `media_type` ENUM('image','video','animation') NOT NULL DEFAULT 'image',
    `is_thumbnail` TINYINT(1) NOT NULL DEFAULT 0,
    INDEX `idx_em_exercise` (`exercise_id`),
    CONSTRAINT `fk_em_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_em_file` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `exercise_muscles`;
CREATE TABLE `exercise_muscles` (
    `exercise_id` BIGINT UNSIGNED NOT NULL,
    `muscle_id` BIGINT UNSIGNED NOT NULL,
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`exercise_id`, `muscle_id`),
    CONSTRAINT `fk_xmuscle_ex` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_xmuscle_muscle` FOREIGN KEY (`muscle_id`) REFERENCES `muscle_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `exercise_equipment`;
CREATE TABLE `exercise_equipment` (
    `exercise_id` BIGINT UNSIGNED NOT NULL,
    `equipment_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`exercise_id`, `equipment_id`),
    CONSTRAINT `fk_xeq_ex` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_xeq_eq` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 8. WORKOUT PLANS, SCHEDULES & PERFORMANCE TRACKING
-- =====================================================================
DROP TABLE IF EXISTS `workout_plans`;
CREATE TABLE `workout_plans` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `author_trainer_id` BIGINT UNSIGNED DEFAULT NULL,
    `is_template` TINYINT(1) NOT NULL DEFAULT 0,
    `difficulty` ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
    `days_per_week` INT NOT NULL DEFAULT 4,
    `goal` ENUM('hypertrophy','fat_loss','strength','endurance','mobility') NOT NULL DEFAULT 'hypertrophy',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_wp_author` (`author_trainer_id`),
    CONSTRAINT `fk_wp_author` FOREIGN KEY (`author_trainer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `plan_days`;
CREATE TABLE `plan_days` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `plan_id` BIGINT UNSIGNED NOT NULL,
    `day_number` TINYINT NOT NULL COMMENT '1=Mon ... 7=Sun',
    `day_code` VARCHAR(10) NOT NULL COMMENT 'mon, tue, wed...',
    `day_name` VARCHAR(100) NOT NULL,
    `focus_area` VARCHAR(150) NOT NULL,
    `is_rest_day` TINYINT(1) NOT NULL DEFAULT 0,
    `sort_order` INT NOT NULL DEFAULT 0,
    UNIQUE KEY `uq_plan_day` (`plan_id`, `day_number`),
    CONSTRAINT `fk_pd_plan` FOREIGN KEY (`plan_id`) REFERENCES `workout_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `plan_day_exercises`;
CREATE TABLE `plan_day_exercises` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `plan_day_id` BIGINT UNSIGNED NOT NULL,
    `exercise_id` BIGINT UNSIGNED NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `target_sets` INT NOT NULL DEFAULT 3,
    `target_reps` VARCHAR(50) NOT NULL DEFAULT '10-12',
    `target_rpe` DECIMAL(3,1) DEFAULT NULL,
    `rest_seconds` INT NOT NULL DEFAULT 90,
    `exercise_notes` TEXT DEFAULT NULL,
    INDEX `idx_pde_day` (`plan_day_id`),
    CONSTRAINT `fk_pde_day` FOREIGN KEY (`plan_day_id`) REFERENCES `plan_days` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pde_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `plan_assignments`;
CREATE TABLE `plan_assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `plan_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `assigned_by_trainer_id` BIGINT UNSIGNED DEFAULT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `status` ENUM('active','completed','paused','superseded') NOT NULL DEFAULT 'active',
    `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_pa_user` (`user_id`),
    INDEX `idx_pa_trainer` (`assigned_by_trainer_id`),
    CONSTRAINT `fk_pa_plan` FOREIGN KEY (`plan_id`) REFERENCES `workout_plans` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pa_trainer` FOREIGN KEY (`assigned_by_trainer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `scheduled_workouts`;
CREATE TABLE `scheduled_workouts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `plan_day_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `scheduled_date` DATE NOT NULL,
    `status` ENUM('scheduled','completed','missed','skipped') NOT NULL DEFAULT 'scheduled',
    `completed_at` DATETIME DEFAULT NULL,
    INDEX `idx_sw_user_date` (`user_id`, `scheduled_date`),
    CONSTRAINT `fk_sw_day` FOREIGN KEY (`plan_day_id`) REFERENCES `plan_days` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sw_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `workout_sessions`;
CREATE TABLE `workout_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `plan_day_id` BIGINT UNSIGNED DEFAULT NULL,
    `gym_id` BIGINT UNSIGNED DEFAULT NULL,
    `session_date` DATE NOT NULL,
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME DEFAULT NULL,
    `duration_minutes` INT DEFAULT NULL,
    `total_volume_kg` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `total_sets_completed` INT NOT NULL DEFAULT 0,
    `perceived_rpe` TINYINT DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_ws_user_date` (`user_id`, `session_date`),
    CONSTRAINT `fk_ws_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ws_plan_day` FOREIGN KEY (`plan_day_id`) REFERENCES `plan_days` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ws_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `session_exercises`;
CREATE TABLE `session_exercises` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `session_id` BIGINT UNSIGNED NOT NULL,
    `exercise_id` BIGINT UNSIGNED NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    INDEX `idx_se_session` (`session_id`),
    CONSTRAINT `fk_se_session` FOREIGN KEY (`session_id`) REFERENCES `workout_sessions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_se_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `exercise_set_logs`;
CREATE TABLE `exercise_set_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `session_exercise_id` BIGINT UNSIGNED NOT NULL,
    `set_number` INT NOT NULL,
    `weight_kg` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    `reps_completed` INT NOT NULL DEFAULT 0,
    `is_completed` TINYINT(1) NOT NULL DEFAULT 1,
    `rpe` DECIMAL(3,1) DEFAULT NULL,
    `logged_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_esl_se` (`session_exercise_id`),
    CONSTRAINT `fk_esl_se` FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `plan_modification_requests`;
CREATE TABLE `plan_modification_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `assignment_id` BIGINT UNSIGNED NOT NULL,
    `requested_by_user_id` BIGINT UNSIGNED NOT NULL,
    `exercise_to_replace_id` BIGINT UNSIGNED NOT NULL,
    `requested_replacement_exercise_id` BIGINT UNSIGNED DEFAULT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    `reviewed_by_trainer_id` BIGINT UNSIGNED DEFAULT NULL,
    `reviewed_at` DATETIME DEFAULT NULL,
    CONSTRAINT `fk_pmr_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `plan_assignments` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pmr_user` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pmr_ex1` FOREIGN KEY (`exercise_to_replace_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pmr_ex2` FOREIGN KEY (`requested_replacement_exercise_id`) REFERENCES `exercises` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_pmr_trainer` FOREIGN KEY (`reviewed_by_trainer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trainer_notes`;
CREATE TABLE `trainer_notes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `trainer_user_id` BIGINT UNSIGNED NOT NULL,
    `session_id` BIGINT UNSIGNED DEFAULT NULL,
    `note_type` ENUM('workout_feedback','form_correction','milestone_praise','general_observation') NOT NULL DEFAULT 'workout_feedback',
    `note_text` TEXT NOT NULL,
    `is_visible_to_user` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_tn_user` (`user_id`),
    INDEX `idx_tn_trainer` (`trainer_user_id`),
    CONSTRAINT `fk_tn_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tn_trainer` FOREIGN KEY (`trainer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tn_session` FOREIGN KEY (`session_id`) REFERENCES `workout_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 9. NUTRITION, RECIPES, ALLERGENS & HYDRATION
-- =====================================================================
DROP TABLE IF EXISTS `food_categories`;
CREATE TABLE `food_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `icon` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `foods`;
CREATE TABLE `foods` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT UNSIGNED DEFAULT NULL,
    `name` VARCHAR(200) NOT NULL,
    `brand` VARCHAR(150) DEFAULT NULL,
    `serving_unit` VARCHAR(50) NOT NULL DEFAULT '100g',
    `serving_size_grams` DECIMAL(6,2) NOT NULL DEFAULT 100.00,
    `calories` INT NOT NULL,
    `protein_g` DECIMAL(5,1) NOT NULL,
    `carbs_g` DECIMAL(5,1) NOT NULL,
    `fat_g` DECIMAL(5,1) NOT NULL,
    `fiber_g` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    `is_verified` TINYINT(1) NOT NULL DEFAULT 1,
    INDEX `idx_foods_category` (`category_id`),
    INDEX `idx_foods_name` (`name`),
    CONSTRAINT `fk_foods_category` FOREIGN KEY (`category_id`) REFERENCES `food_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `food_servings`;
CREATE TABLE `food_servings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `food_id` BIGINT UNSIGNED NOT NULL,
    `serving_name` VARCHAR(100) NOT NULL,
    `gram_weight` DECIMAL(6,2) NOT NULL,
    INDEX `idx_fs_food` (`food_id`),
    CONSTRAINT `fk_fs_food` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `allergens`;
CREATE TABLE `allergens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `icon` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `food_allergens`;
CREATE TABLE `food_allergens` (
    `food_id` BIGINT UNSIGNED NOT NULL,
    `allergen_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`food_id`, `allergen_id`),
    CONSTRAINT `fk_fa_food` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fa_allergen` FOREIGN KEY (`allergen_id`) REFERENCES `allergens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `dietary_tags`;
CREATE TABLE `dietary_tags` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `food_dietary_tags`;
CREATE TABLE `food_dietary_tags` (
    `food_id` BIGINT UNSIGNED NOT NULL,
    `tag_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`food_id`, `tag_id`),
    CONSTRAINT `fk_fdt_food` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fdt_tag` FOREIGN KEY (`tag_id`) REFERENCES `dietary_tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_allergies`;
CREATE TABLE `user_allergies` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `allergen_id` BIGINT UNSIGNED NOT NULL,
    `severity` ENUM('mild','moderate','severe') NOT NULL DEFAULT 'moderate',
    `notes` TEXT DEFAULT NULL,
    PRIMARY KEY (`user_id`, `allergen_id`),
    CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ua_allergen` FOREIGN KEY (`allergen_id`) REFERENCES `allergens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_dietary_restrictions`;
CREATE TABLE `user_dietary_restrictions` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `tag_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`user_id`, `tag_id`),
    CONSTRAINT `fk_udr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_udr_tag` FOREIGN KEY (`tag_id`) REFERENCES `dietary_tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `food_reactions`;
CREATE TABLE `food_reactions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `food_id` BIGINT UNSIGNED DEFAULT NULL,
    `consumed_at` DATETIME NOT NULL,
    `symptoms` TEXT NOT NULL,
    `severity` ENUM('mild','moderate','severe') NOT NULL DEFAULT 'moderate',
    `notes` TEXT DEFAULT NULL,
    `logged_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_fr_user` (`user_id`),
    CONSTRAINT `fk_fr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fr_food` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `recipe_categories`;
CREATE TABLE `recipe_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `recipes`;
CREATE TABLE `recipes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT UNSIGNED DEFAULT NULL,
    `name` VARCHAR(200) NOT NULL,
    `prep_time_minutes` INT NOT NULL DEFAULT 15,
    `cook_time_minutes` INT NOT NULL DEFAULT 20,
    `servings` INT NOT NULL DEFAULT 1,
    `total_calories` INT NOT NULL,
    `protein_g` DECIMAL(5,1) NOT NULL,
    `carbs_g` DECIMAL(5,1) NOT NULL,
    `fat_g` DECIMAL(5,1) NOT NULL,
    `instructions` TEXT NOT NULL,
    `image_path` VARCHAR(255) NOT NULL,
    `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
    INDEX `idx_recipes_category` (`category_id`),
    CONSTRAINT `fk_recipes_category` FOREIGN KEY (`category_id`) REFERENCES `recipe_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `recipe_ingredients`;
CREATE TABLE `recipe_ingredients` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `recipe_id` BIGINT UNSIGNED NOT NULL,
    `food_id` BIGINT UNSIGNED DEFAULT NULL,
    `quantity` DECIMAL(6,2) NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `notes` VARCHAR(150) DEFAULT NULL,
    INDEX `idx_ri_recipe` (`recipe_id`),
    CONSTRAINT `fk_ri_recipe` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ri_food` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `favourite_foods`;
CREATE TABLE `favourite_foods` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `food_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`user_id`, `food_id`),
    CONSTRAINT `fk_ff_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ff_food` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `favourite_recipes`;
CREATE TABLE `favourite_recipes` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `recipe_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`user_id`, `recipe_id`),
    CONSTRAINT `fk_frp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_frp_recipe` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `meals`;
CREATE TABLE `meals` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `meal_type` ENUM('breakfast','lunch','dinner','snack','pre_workout','post_workout') NOT NULL DEFAULT 'lunch',
    `meal_date` DATE NOT NULL,
    `total_calories` INT NOT NULL DEFAULT 0,
    `total_protein_g` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    `total_carbs_g` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    `total_fat_g` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    `logged_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_meals_user_date` (`user_id`, `meal_date`),
    CONSTRAINT `fk_meals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `meal_items`;
CREATE TABLE `meal_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `meal_id` BIGINT UNSIGNED NOT NULL,
    `food_id` BIGINT UNSIGNED DEFAULT NULL,
    `quantity` DECIMAL(6,2) NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `calories` INT NOT NULL,
    `protein_g` DECIMAL(5,1) NOT NULL,
    `carbs_g` DECIMAL(5,1) NOT NULL,
    `fat_g` DECIMAL(5,1) NOT NULL,
    INDEX `idx_mi_meal` (`meal_id`),
    CONSTRAINT `fk_mi_meal` FOREIGN KEY (`meal_id`) REFERENCES `meals` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mi_food` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `water_logs`;
CREATE TABLE `water_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `log_date` DATE NOT NULL,
    `amount_ml` INT NOT NULL,
    `logged_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_water_user_date` (`user_id`, `log_date`),
    CONSTRAINT `fk_water_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 10. MULTI-GYM ATTENDANCE & TURNSTILE CHECK-IN
-- =====================================================================
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `gym_id` BIGINT UNSIGNED NOT NULL,
    `check_in_time` DATETIME NOT NULL,
    `check_out_time` DATETIME DEFAULT NULL,
    `check_in_method` ENUM('qr_code','turnstile','manual_trainer','manual_staff') NOT NULL DEFAULT 'qr_code',
    `status` ENUM('verified','flagged','disputed') NOT NULL DEFAULT 'verified',
    `notes` VARCHAR(255) DEFAULT NULL,
    INDEX `idx_att_user` (`user_id`),
    INDEX `idx_att_gym` (`gym_id`),
    INDEX `idx_att_time` (`check_in_time`),
    CONSTRAINT `fk_att_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_att_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 11. PRIVATE FITNESS DOCUMENTS VAULT (EXCLUDES MEDICAL CONSULTATIONS)
-- =====================================================================
DROP TABLE IF EXISTS `report_categories`;
CREATE TABLE `report_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `health_reports`;
CREATE TABLE `health_reports` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `category_id` BIGINT UNSIGNED DEFAULT NULL,
    `title` VARCHAR(200) NOT NULL,
    `report_date` DATE NOT NULL,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `facility_or_provider_name` VARCHAR(200) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_hr_user` (`user_id`),
    CONSTRAINT `fk_hr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_hr_category` FOREIGN KEY (`category_id`) REFERENCES `report_categories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_hr_file` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 12. TWO-WAY MESSAGING, NOTIFICATIONS & AUDITING
-- =====================================================================
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `participant_one_id` BIGINT UNSIGNED NOT NULL,
    `participant_two_id` BIGINT UNSIGNED NOT NULL,
    `conversation_type` ENUM('trainer_member','gym_member','support') NOT NULL DEFAULT 'trainer_member',
    `last_message_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_conversation_peers` (`participant_one_id`, `participant_two_id`),
    CONSTRAINT `fk_conv_p1` FOREIGN KEY (`participant_one_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_conv_p2` FOREIGN KEY (`participant_two_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` BIGINT UNSIGNED NOT NULL,
    `sender_id` BIGINT UNSIGNED NOT NULL,
    `message_text` TEXT NOT NULL,
    `attachment_file_id` BIGINT UNSIGNED DEFAULT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `read_at` DATETIME DEFAULT NULL,
    `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_msg_conv` (`conversation_id`),
    INDEX `idx_msg_sender` (`sender_id`),
    CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_msg_file` FOREIGN KEY (`attachment_file_id`) REFERENCES `files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `body` TEXT NOT NULL,
    `entity_type` VARCHAR(50) DEFAULT NULL,
    `entity_id` BIGINT UNSIGNED DEFAULT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notif_user` (`user_id`),
    CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `reminders`;
CREATE TABLE `reminders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `event_type` ENUM('water','workout','nutrition','trainer_session') NOT NULL,
    `scheduled_time` TIME NOT NULL,
    `days_of_week` VARCHAR(30) NOT NULL DEFAULT '1,2,3,4,5,6,7',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_reminders_user` (`user_id`),
    CONSTRAINT `fk_reminders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `report_exports`;
CREATE TABLE `report_exports` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `export_type` ENUM('pdf_progress','csv_workouts','csv_nutrition') NOT NULL,
    `file_id` BIGINT UNSIGNED DEFAULT NULL,
    `status` ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_exports_user` (`user_id`),
    CONSTRAINT `fk_exports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_exports_file` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `complaints`;
CREATE TABLE `complaints` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `filed_by_user_id` BIGINT UNSIGNED NOT NULL,
    `target_gym_id` BIGINT UNSIGNED DEFAULT NULL,
    `target_trainer_id` BIGINT UNSIGNED DEFAULT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('open','in_review','resolved','dismissed') NOT NULL DEFAULT 'open',
    `filed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` DATETIME DEFAULT NULL,
    INDEX `idx_complaints_user` (`filed_by_user_id`),
    CONSTRAINT `fk_comp_user` FOREIGN KEY (`filed_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comp_gym` FOREIGN KEY (`target_gym_id`) REFERENCES `gyms` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_comp_trainer` FOREIGN KEY (`target_trainer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `platform_settings`;
CREATE TABLE `platform_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT NOT NULL,
    `description` TEXT DEFAULT NULL,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED DEFAULT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_table` VARCHAR(100) NOT NULL,
    `entity_id` BIGINT UNSIGNED DEFAULT NULL,
    `details` JSON DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_user` (`user_id`),
    INDEX `idx_audit_action` (`action`),
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 13. SEED DATA (VERIFIED DEMO DATA FOR IMMEDIATE EVALUATION)
-- =====================================================================

-- Default bcrypt hash for 'password123':
-- $2y$10$RDPpscCZYVHxkmh4lWdifexoQJvfA6c4C.RdkBCjIsin5jYI5MqJW

-- 1. Users
INSERT INTO `users` (`id`, `email`, `mobile`, `password_hash`, `role`, `full_name`, `email_verified_at`, `status`) VALUES
(1, 'admin@fitsync.com', '+919900000001', '$2y$10$RDPpscCZYVHxkmh4lWdifexoQJvfA6c4C.RdkBCjIsin5jYI5MqJW', 'admin', 'System Administrator', NOW(), 'active'),
(2, 'owner@fitzone.com', '+919900000002', '$2y$10$RDPpscCZYVHxkmh4lWdifexoQJvfA6c4C.RdkBCjIsin5jYI5MqJW', 'gym_owner', 'Priya Sharma (FitZone Owner)', NOW(), 'active'),
(3, 'coach@fitsync.health', '+919811122334', '$2y$10$RDPpscCZYVHxkmh4lWdifexoQJvfA6c4C.RdkBCjIsin5jYI5MqJW', 'trainer', 'Coach Raj Malhotra', NOW(), 'active'),
(4, 'vikram@fitsync.health', '+919811122335', '$2y$10$RDPpscCZYVHxkmh4lWdifexoQJvfA6c4C.RdkBCjIsin5jYI5MqJW', 'trainer', 'Trainer Vikram Singh', NOW(), 'active'),
(5, 'simran@fitsync.health', '+919811122336', '$2y$10$RDPpscCZYVHxkmh4lWdifexoQJvfA6c4C.RdkBCjIsin5jYI5MqJW', 'trainer', 'Trainer Simran Kaur', NOW(), 'active'),
(6, 'isha.kulkarni@fitsync.com', '+919876543210', '$2y$10$RDPpscCZYVHxkmh4lWdifexoQJvfA6c4C.RdkBCjIsin5jYI5MqJW', 'user', 'Isha Kulkarni', NOW(), 'active'),
(7, 'ritika@fitsync.health', '+919876543211', '$2y$10$RDPpscCZYVHxkmh4lWdifexoQJvfA6c4C.RdkBCjIsin5jYI5MqJW', 'user', 'Ritika Sharma', NOW(), 'active'),
(8, 'aarav.patel@fitsync.ai', '+919823456789', '$2y$10$RDPpscCZYVHxkmh4lWdifexoQJvfA6c4C.RdkBCjIsin5jYI5MqJW', 'user', 'Aarav Patel', NOW(), 'active');

-- 2. User Profiles
INSERT INTO `user_profiles` (`user_id`, `date_of_birth`, `gender`, `height_cm`, `weight_kg`, `fitness_experience`, `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relation`, `bio`) VALUES
(6, '2002-04-15', 'female', 168.00, 62.50, 'intermediate', 'Anand Kulkarni', '+91 98220 12345', 'Father', 'Passionate athlete focused on progressive overload and hypertrophy.'),
(7, '2002-08-20', 'female', 168.00, 58.50, 'intermediate', 'Sunil Sharma', '+91 98765 00001', 'Father', 'Focusing on athletic conditioning, strength development, and clean nutrition.'),
(8, '2000-01-10', 'male', 178.00, 74.00, 'intermediate', 'Meena Patel', '+91 98234 00002', 'Mother', 'Targeting fat loss and lean athletic definition.');

-- 3. Trainer Profiles
INSERT INTO `trainer_profiles` (`user_id`, `certification_name`, `certifying_body`, `certification_year`, `experience_years`, `specializations_summary`, `bio`, `hourly_rate`, `rating`, `reviews_count`, `status`) VALUES
(3, 'CSCS (Certified Strength & Conditioning Specialist)', 'NSCA', 2018, 8, 'Hypertrophy, Powerlifting, Body Composition', '8+ years coaching national athletes and intermediate lifters toward peak physique and functional strength.', 1500.00, 4.95, 42, 'verified'),
(4, 'Certified Functional Trainer', 'ACE', 2019, 6, 'Mobility, Calisthenics, HIIT', 'Specialized in movement quality, injury-free lifting, and athletic speed.', 1200.00, 4.80, 28, 'verified'),
(5, 'Certified Physique Coach', 'ISSA', 2021, 4, 'Female Hypertrophy, Glute Specialization, Dietetics', 'Empowering athletes to master nutrition and heavy compound lifting.', 1100.00, 4.90, 19, 'verified');

-- 4. Gyms
INSERT INTO `gyms` (`id`, `owner_user_id`, `name`, `brand_name`, `registration_no`, `email`, `phone`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `latitude`, `longitude`, `rating`, `status`) VALUES
(1, 2, 'FitZone Fitness', 'FitZone Global', 'REG-PUN-2024-001', 'kothrud@fitzone.com', '+91 20 2544 1100', 'Plot 44, Paud Road, Kothrud', 'Opposite Metro Station', 'Pune', 'Maharashtra', '411038', 18.5074, 73.8077, 4.90, 'active'),
(2, 2, 'PowerHouse Gym', 'PowerHouse Arena', 'REG-AHM-2023-088', 'contact@powerhouse.com', '+91 79 4001 2200', 'SG Highway, Bodakdev', 'Near Grand Bhagwati', 'Ahmedabad', 'Gujarat', '380054', 23.0373, 72.5119, 4.80, 'active'),
(3, 2, 'Elite Fitness Studio', 'Elite Health', 'REG-SUR-2025-012', 'info@elitefitness.com', '+91 261 2233 444', 'Vesu Main Road', 'Next to Star Bazaar', 'Surat', 'Gujarat', '395007', 21.1418, 72.7709, 4.70, 'active');

-- 5. Gym Trainers Roster
INSERT INTO `gym_trainers` (`gym_id`, `trainer_user_id`, `employment_type`, `is_active`, `joined_at`) VALUES
(1, 3, 'full_time', 1, '2023-01-15'),
(1, 4, 'full_time', 1, '2023-06-01'),
(2, 3, 'freelance', 1, '2024-02-10'),
(3, 5, 'full_time', 1, '2024-01-01');

-- 6. Membership Plans
INSERT INTO `membership_plans` (`id`, `gym_id`, `name`, `description`, `duration_months`, `price`, `access_type`, `is_active`) VALUES
(1, 1, 'FitZone Gold Annual', 'Unlimited multi-facility access, locker room, turnstile pass, and bi-monthly trainer assessment.', 12, 18000.00, 'multi_gym_brand', 1),
(2, 1, 'FitZone Silver Quarterly', 'Full branch access for 3 months with cardio and free weights zone access.', 3, 6000.00, 'single_gym', 1),
(3, 2, 'PowerHouse Pro Access', 'Olympic lifting platform access, recovery lounge, and turnstile badge.', 12, 22000.00, 'all_access', 1);

-- 7. Active Memberships
INSERT INTO `memberships` (`id`, `user_id`, `plan_id`, `gym_id`, `start_date`, `end_date`, `status`, `qr_code_token`, `auto_renew`) VALUES
(1, 6, 1, 1, '2026-01-01', '2026-12-31', 'active', 'FS-QR-IK-2026-9921', 1),
(2, 7, 1, 1, '2026-02-01', '2027-01-31', 'active', 'FS-QR-RS-2026-4412', 1),
(3, 8, 3, 2, '2026-03-01', '2027-02-28', 'active', 'FS-QR-AP-2026-7733', 0);

-- 8. Trainer-Member Assignments (Coach Raj assigned to Isha, Ritika, Aarav)
INSERT INTO `trainer_assignments` (`id`, `user_id`, `trainer_user_id`, `gym_id`, `assigned_by_user_id`, `status`, `start_date`, `notes`) VALUES
(1, 6, 3, 1, 2, 'active', '2026-01-05', 'Focusing on upper body push mechanics, shoulder stability, and clean hypertrophy surplus.'),
(2, 7, 3, 1, 2, 'active', '2026-02-10', 'Primary goal: Hypertrophy Surplus and posture alignment.'),
(3, 8, 3, 2, 2, 'active', '2026-03-05', 'Metabolic conditioning and 4-day strength split.');

INSERT INTO `trainer_data_permissions` (`assignment_id`, `can_view_measurements`, `can_view_nutrition`, `can_view_assessments`, `can_log_attendance`) VALUES
(1, 1, 1, 1, 1),
(2, 1, 1, 1, 1),
(3, 1, 1, 1, 1);

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
(2, 3, 6, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:00:00', '09:00:00', 'form_check', 'completed', 'Checked barbell squat depth, hip hinge, and torso bracing.');

-- 9. Muscle Groups
INSERT INTO `muscle_groups` (`id`, `code`, `name`, `latin_name`, `view_aspect`, `category`, `biomechanical_function`, `synergist_muscles`) VALUES
(1, 'chest', 'Pectoralis Major & Minor', 'Pectoralis major, minor', 'anterior', 'Anterior Torso', 'Horizontal adduction, shoulder flexion, internal arm rotation.', 'Anterior Deltoids, Triceps Brachii, Serratus Anterior'),
(2, 'back', 'Latissimus Dorsi & Rhomboids', 'Latissimus dorsi, Rhomboidei', 'posterior', 'Posterior Torso', 'Shoulder adduction, extension, internal rotation, scapular retraction.', 'Teres Major, Biceps Brachii, Posterior Deltoid, Trapezius'),
(3, 'shoulders', 'Deltoids (Anterior, Lateral, Posterior)', 'Deltoideus', 'both', 'Shoulder Girdle', 'Shoulder abduction, flexion, extension, and dynamic humeral stabilization.', 'Supraspinatus, Trapezius, Triceps Brachii, Pectoralis Major'),
(4, 'traps', 'Trapezius (Upper, Middle, Lower)', 'Trapezius', 'posterior', 'Upper Back & Neck', 'Scapular elevation, retraction, depression, and upward rotation.', 'Levator Scapulae, Rhomboids, Serratus Anterior'),
(5, 'lower_back', 'Erector Spinae & Lumbar Stabilizers', 'Musculus erector spinae', 'posterior', 'Posterior Chain', 'Spinal extension, lateral flexion, and anti-flexion posture preservation.', 'Gluteus Maximus, Hamstrings, Quadratus Lumborum'),
(6, 'biceps', 'Biceps Brachii & Brachialis', 'Biceps brachii, Brachialis', 'anterior', 'Anterior Arm', 'Elbow flexion, radioulnar supination, and secondary shoulder flexion.', 'Brachioradialis, Pronator Teres, Anterior Deltoids'),
(7, 'triceps', 'Triceps Brachii', 'Triceps brachii', 'posterior', 'Posterior Arm', 'Elbow extension; long head assists in shoulder extension.', 'Anconeus, Pectoralis Major (sternal head)'),
(8, 'forearms', 'Brachioradialis & Forearm Flexors', 'Brachioradialis, Flexores carpi', 'both', 'Lower Arm & Grip', 'Elbow flexion in neutral grip, wrist flexion/extension, crushing grip.', 'Extensor carpi, Flexor digitorum'),
(9, 'quads', 'Quadriceps Femoris', 'Rectus femoris, Vasti', 'anterior', 'Anterior Thigh', 'Knee extension; rectus femoris assists with hip flexion.', 'Gluteus Maximus, Adductor Magnus, Soleus'),
(10, 'hamstrings', 'Hamstrings (Biceps Femoris & Semis)', 'Biceps femoris, Semitendinosus', 'posterior', 'Posterior Thigh', 'Knee flexion, hip extension, eccentric deceleration in sprinting.', 'Gluteus Maximus, Adductor Magnus, Gastrocnemius'),
(11, 'glutes', 'Gluteus Maximus, Medius & Minimus', 'Gluteus maximus, medius', 'posterior', 'Pelvic Girdle', 'Primary hip extension, hip abduction, pelvic stabilization.', 'Hamstrings, Erector Spinae, Tensor Fasciae Latae'),
(12, 'calves', 'Gastrocnemius & Soleus', 'Gastrocnemius, Soleus', 'both', 'Lower Leg', 'Ankle plantarflexion, propulsive force generation.', 'Plantaris, Tibialis posterior'),
(13, 'abs', 'Rectus Abdominis & Obliques', 'Rectus abdominis, Obliquus', 'anterior', 'Anterior Core', 'Trunk flexion, posterior pelvic tilt, spinal rotation, intra-abdominal pressure.', 'Transverse Abdominis, Multifidus, Diaphragm');

-- 10. Core Exercise Library (38 Verified Exercises Matching App)
INSERT INTO `exercises` (`id`, `code`, `name`, `primary_muscle_id`, `exercise_type`, `equipment_required`, `difficulty`, `form_cues`, `coaching_tips`, `default_target_sets`, `default_target_reps`, `default_rest_seconds`, `image_path`, `is_verified`) VALUES
(1, 'ex_bench', 'Barbell Flat Bench Press', 1, 'compound', 'barbell', 'intermediate', 'Retract scapulae, touch lower sternum, drive heels into ground, press vertically.', 'Keep wrists stacked directly over elbows; avoid excessive flare.', 4, '8-10', 90, 'assets/images/ex_flat_bench.jpg', 1),
(2, 'ex_incline_bench', 'Incline Barbell Bench Press', 1, 'compound', 'barbell', 'intermediate', 'Set bench to 30 degrees, touch clavicle notch, press upward with elbow control.', 'Focus on upper clavicular pectoralis stretch at bottom.', 4, '8-10', 90, 'assets/images/ex_incline_bench.jpg', 1),
(3, 'ex_dumbbell_press', 'Dumbbell Flat Bench Press', 1, 'compound', 'dumbbell', 'intermediate', 'Converging arc path, full stretch at chest level, soft lockout at top.', 'Allows deeper eccentric stretch than barbell.', 3, '10-12', 75, 'assets/images/ex_dumbbell_press.jpg', 1),
(4, 'ex_cable_crossover', 'Standing Cable Crossover Flyes', 1, 'isolation', 'cable', 'beginner', 'Slight torso forward lean, hug a tree motion, squeeze pectorals at midline.', 'Maintain slight bend in elbows throughout movement.', 3, '12-15', 60, 'assets/images/ex_cable_crossover.jpg', 1),
(5, 'ex_pushups', 'Strict Military Push-Ups', 1, 'compound', 'bodyweight', 'beginner', 'Plank posture, glutes engaged, elbows at 45 degrees, chest touches floor.', 'Keep core rigid; do not let lumbar spine sag.', 3, '15-20', 60, 'assets/images/ex_pushups.jpg', 1),
(6, 'ex_parallel_dips', 'Parallel Bar Chest Dips', 1, 'compound', 'bodyweight', 'advanced', 'Lean torso 30 degrees forward, lower to 90 degrees elbow bend, press upward.', 'Keep shoulders packed down away from ears.', 3, '8-12', 90, 'assets/images/ex_parallel_dips.jpg', 1),
(7, 'ex_lat_pulldown', 'Wide-Grip Lat Pulldown', 2, 'compound', 'cable', 'beginner', 'Grip outside shoulder width, depress scapulae, pull bar to upper sternum.', 'Drive elbows down and back into back pockets.', 4, '10-12', 75, 'assets/images/ex_lat_pulldown.jpg', 1),
(8, 'ex_pullups', 'Bodyweight Pull-Ups', 2, 'compound', 'bodyweight', 'advanced', 'Overhand grip, initiate from dead hang, pull chin over bar without swinging.', 'Full range of motion; avoid kipping.', 3, '6-10', 90, 'assets/images/ex_pullups.jpg', 1),
(9, 'ex_barbell_row', 'Bent-Over Barbell Row', 2, 'compound', 'barbell', 'intermediate', 'Hinge hips to 45 degrees, pull barbell to navel, flare lats at stretch.', 'Keep spine neutral and neck aligned.', 4, '8-10', 90, 'assets/images/ex_barbell_row.jpg', 1),
(10, 'ex_seated_row', 'Seated Cable Row (V-Grip)', 2, 'compound', 'cable', 'beginner', 'Upright posture, neutral spine, pull handle to abdomen, squeeze rhomboids.', 'Do not use excessive momentum or swing backward.', 3, '10-12', 75, 'assets/images/ex_seated_row.jpg', 1),
(11, 'ex_overhead_press', 'Standing Barbell Overhead Press', 3, 'compound', 'barbell', 'advanced', 'Brace abs, clear head trajectory, drive bar vertically to full lockout.', 'Squeeze glutes and quads to create a rigid base.', 4, '6-8', 120, 'assets/images/ex_overhead_press.jpg', 1),
(12, 'ex_lateral_raise', 'Dumbbell Side Lateral Raise', 3, 'isolation', 'dumbbell', 'beginner', 'Lead with elbows in scapular plane, raise to shoulder height, 2s eccentric.', 'Pour the pitcher cue: slight forward tilt.', 4, '12-15', 60, 'assets/images/ex_lateral_raise.jpg', 1),
(13, 'ex_face_pull', 'Rope Cable Face Pulls', 3, 'isolation', 'cable', 'beginner', 'Set pulley eye level, pull to forehead, externally rotate shoulders at peak.', 'Crucial for rotator cuff and rear deltoid health.', 3, '15-20', 60, 'assets/images/ex_face_pull.jpg', 1),
(14, 'ex_shrugs', 'Barbell Power Shrugs', 4, 'isolation', 'barbell', 'intermediate', 'Stand tall, elevate shoulders straight toward ears, 1s pause at peak.', 'Do not roll shoulders; straight vertical elevation.', 4, '10-12', 75, 'assets/images/ex_shrugs.jpg', 1),
(15, 'ex_deadlift', 'Conventional Barbell Deadlift', 5, 'compound', 'barbell', 'advanced', 'Bar over midfoot, engage lats, push floor away through heels, lock out glutes.', 'Keep bar in contact with legs throughout the pull.', 4, '5-6', 150, 'assets/images/ex_deadlift.jpg', 1),
(16, 'ex_barbell_curl', 'Standing Barbell Bicep Curl', 6, 'isolation', 'barbell', 'beginner', 'Pin elbows to ribs, curl bar in smooth arc, squeeze peak, 3s negative.', 'Avoid rocking back; keep core braced.', 3, '10-12', 60, 'assets/images/ex_barbell_curl.jpg', 1),
(17, 'ex_incline_curl', 'Incline Dumbbell Bicep Curl', 6, 'isolation', 'dumbbell', 'intermediate', 'Bench at 60 degrees, let arms hang in full stretch, supinate while curling.', 'Emphasizes long head of biceps under deep stretch.', 3, '10-12', 60, 'assets/images/ex_incline_curl.jpg', 1),
(18, 'ex_tricep_pushdown', 'Cable Tricep Pushdown (Straight Bar)', 7, 'isolation', 'cable', 'beginner', 'Lock upper arms at side, push downward until full elbow extension.', 'Do not let shoulders roll forward.', 3, '12-15', 60, 'assets/images/ex_tricep_pushdown.jpg', 1),
(19, 'ex_skullcrushers', 'Lying EZ-Bar Skullcrushers', 7, 'isolation', 'barbell', 'intermediate', 'Lower bar toward forehead/crown, extend elbows back to vertical.', 'Keep elbows pointing forward, not flaring wide.', 3, '10-12', 75, 'assets/images/ex_skullcrushers.jpg', 1),
(20, 'ex_back_squat', 'Barbell Back Squat', 9, 'compound', 'barbell', 'advanced', 'Bar on upper traps, break hips and knees, descend below parallel, drive up.', 'Keep chest tall and knees tracking over toes.', 4, '6-8', 120, 'assets/images/ex_back_squat.jpg', 1),
(21, 'ex_leg_extension', 'Seated Leg Extension Machine', 9, 'isolation', 'machine', 'beginner', 'Back flush against pad, extend knees fully, control the descent.', 'Keep toes pointed slightly upward for quad isolation.', 3, '12-15', 60, 'assets/images/ex_leg_extension.jpg', 1),
(22, 'ex_romanian_deadlift', 'Barbell Romanian Deadlift (RDL)', 10, 'compound', 'barbell', 'intermediate', 'Soft knee bend, push hips far back, hinge until hamstring stretch, drive hips forward.', 'Keep barbell sliding down thighs to shins.', 4, '8-10', 90, 'assets/images/ex_romanian_deadlift.jpg', 1),
(23, 'ex_lying_leg_curl', 'Lying Hamstring Leg Curl', 10, 'isolation', 'machine', 'beginner', 'Hips pressed firmly into bench, curl pad toward glutes, 2s controlled lowering.', 'Avoid lifting hips off bench.', 3, '10-12', 60, 'assets/images/ex_lying_leg_curl.jpg', 1),
(24, 'ex_standing_calf_raise', 'Standing Machine Calf Raise', 12, 'isolation', 'machine', 'beginner', 'Balls of feet on ledge, drop heels into deep stretch, drive up onto big toes.', 'Pause 2 seconds in bottom stretch to eliminate Achilles bounce.', 4, '15-20', 60, 'assets/images/ex_standing_calf_raise.jpg', 1),
(25, 'ex_cable_crunch', 'Kneeling Cable Rope Crunch', 13, 'isolation', 'cable', 'intermediate', 'Kneel holding rope beside ears, flex spine downward, curl elbows to thighs.', 'Focus on spinal flexion, not hip hinging.', 3, '15-20', 60, 'assets/images/ex_cable_crunch.jpg', 1);

-- 11. Sample Workout Plan (Push / Pull / Legs Hypertrophy Split by Coach Raj)
INSERT INTO `workout_plans` (`id`, `name`, `description`, `author_trainer_id`, `is_template`, `difficulty`, `days_per_week`, `goal`) VALUES
(1, 'PPL Hypertrophy Master Program', 'Evidence-based 7-day push, pull, legs split programmed for muscle hypertrophy surplus and strength progression.', 3, 1, 'intermediate', 5, 'hypertrophy');

INSERT INTO `plan_days` (`id`, `plan_id`, `day_number`, `day_code`, `day_name`, `focus_area`, `is_rest_day`, `sort_order`) VALUES
(1, 1, 1, 'mon', 'Monday Routine', 'Chest, Shoulders & Triceps (Push Heavy)', 0, 1),
(2, 1, 2, 'tue', 'Tuesday Routine', 'Back & Biceps Power (Pull Movement)', 0, 2),
(3, 1, 3, 'wed', 'Wednesday Routine', 'Quadriceps, Hamstrings & Calves (Legs Hypertrophy)', 0, 3),
(4, 1, 4, 'thu', 'Thursday Routine', 'Active Recovery, Mobility & Core Flow', 0, 4),
(5, 1, 5, 'fri', 'Friday Routine', 'Chest & Back Antagonist Upper Body', 0, 5),
(6, 1, 6, 'sat', 'Saturday Routine', 'Posterior Chain & Shoulder V-Taper', 0, 6),
(7, 1, 7, 'sun', 'Sunday Routine', 'Full Body Rest & Systemic Recovery', 1, 7);

-- Monday Push Exercises
INSERT INTO `plan_day_exercises` (`plan_day_id`, `exercise_id`, `sort_order`, `target_sets`, `target_reps`, `rest_seconds`, `exercise_notes`) VALUES
(1, 2, 1, 4, '8-10', 90, 'Primary compound pressing movement; focus on upper chest.'),
(1, 1, 2, 3, '8-10', 90, 'Flat barbell bench; keep scapulae retracted.'),
(1, 11, 3, 3, '8-10', 90, 'Overhead pressing power.'),
(1, 12, 4, 4, '12-15', 60, 'Strict side deltoid volume.'),
(1, 18, 5, 3, '12-15', 60, 'Finishing triceps pushdown.');

-- Tuesday Pull Exercises
INSERT INTO `plan_day_exercises` (`plan_day_id`, `exercise_id`, `sort_order`, `target_sets`, `target_reps`, `rest_seconds`, `exercise_notes`) VALUES
(2, 7, 1, 4, '10-12', 75, 'Wide-grip lat pulldown; pull bar to upper clavicle.'),
(2, 9, 2, 4, '8-10', 90, 'Bent-over row; squeeze lats at contraction.'),
(2, 10, 3, 3, '10-12', 75, 'Seated cable row neutral grip.'),
(2, 13, 4, 3, '15-20', 60, 'Rear delt face pull with rope.'),
(2, 16, 5, 3, '10-12', 60, 'Standing barbell bicep curl.');

-- Assign Workout Plan to Ritika & Isha
INSERT INTO `plan_assignments` (`id`, `plan_id`, `user_id`, `assigned_by_trainer_id`, `start_date`, `is_active`, `status`) VALUES
(1, 1, 6, 3, '2026-01-05', 1, 'active'),
(2, 1, 7, 3, '2026-02-10', 1, 'active');

-- 12. Food Categories & Sample Verified Foods
INSERT INTO `food_categories` (`id`, `name`, `icon`) VALUES
(1, 'Lean Proteins', 'drumstick'),
(2, 'Complex Carbohydrates', 'wheat'),
(3, 'Healthy Fats', 'droplet'),
(4, 'Vegetables & Greens', 'salad'),
(5, 'Dairy & Eggs', 'egg');

INSERT INTO `foods` (`id`, `category_id`, `name`, `serving_unit`, `serving_size_grams`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`) VALUES
(1, 1, 'Grilled Skinless Chicken Breast', '100g', 100.00, 165, 31.0, 0.0, 3.6, 0.0),
(2, 2, 'Rolled Whole Oats', '100g', 100.00, 389, 16.9, 66.3, 6.9, 10.6),
(3, 5, 'Whole Boiled Egg', '1 large egg', 50.00, 78, 6.3, 0.6, 5.3, 0.0),
(4, 5, 'Fresh Low-Fat Paneer', '100g', 100.00, 208, 18.0, 4.0, 14.0, 0.0),
(5, 1, 'Organic Firm Tofu', '100g', 100.00, 144, 17.3, 2.8, 8.7, 2.3),
(6, 1, 'Atlantic Salmon Fillet', '100g', 100.00, 208, 20.0, 0.0, 13.0, 0.0),
(7, 2, 'Steamed Brown Rice', '100g cooked', 100.00, 111, 2.6, 23.0, 0.9, 1.8),
(8, 5, 'Greek Yogurt (Plain 0% Fat)', '100g', 100.00, 59, 10.0, 3.6, 0.4, 0.0);

-- 13. High-Protein Recipes (Matching App Recipes)
INSERT INTO `recipe_categories` (`id`, `name`) VALUES
(1, 'High Protein Mains'),
(2, 'Post-Workout Fuel'),
(3, 'Breakfast Energy');

INSERT INTO `recipes` (`id`, `category_id`, `name`, `prep_time_minutes`, `cook_time_minutes`, `servings`, `total_calories`, `protein_g`, `carbs_g`, `fat_g`, `instructions`, `image_path`, `is_featured`) VALUES
(1, 1, 'Mediterranean Grilled Chicken & Quinoa Bowl', 15, 20, 1, 520, 48.0, 42.0, 14.0, 'Season chicken with oregano, garlic, and lemon juice. Grill 6 mins per side. Serve over fluffy cooked quinoa with diced cucumbers and cherry tomatoes.', 'assets/images/recipe_chicken_rice.jpg', 1),
(2, 3, 'Power Protein Oatmeal with Berries & Whey', 5, 5, 1, 410, 34.0, 48.0, 8.0, 'Cook rolled oats in water or almond milk. Stir in one scoop vanilla whey protein powder off heat. Top with blueberries and chia seeds.', 'assets/images/recipe_oats.jpg', 1),
(3, 1, 'Pan-Seared Salmon with Steamed Asparagus', 10, 15, 1, 540, 42.0, 12.0, 26.0, 'Season salmon with coarse sea salt and cracked black pepper. Sear skin-down for 5 mins, flip and baste. Serve alongside garlic-steamed asparagus.', 'assets/images/recipe_salmon.jpg', 1),
(4, 1, 'Tandoori Spiced Low-Fat Paneer Tikka', 20, 15, 1, 380, 28.0, 18.0, 16.0, 'Marinate paneer cubes and bell peppers in Greek yogurt, Kashmiri chili, and garam masala. Bake or air-fry at 200°C for 14 minutes.', 'assets/images/recipe_paneer.jpg', 1);

-- 14. Sample Water Logs for User 6 (Isha) & User 7 (Ritika)
INSERT INTO `water_logs` (`user_id`, `log_date`, `amount_ml`) VALUES
(6, CURDATE(), 500),
(6, CURDATE(), 500),
(6, CURDATE(), 250),
(6, CURDATE(), 1000),
(7, CURDATE(), 750),
(7, CURDATE(), 500),
(7, CURDATE(), 1000);

-- 15. Sample Multi-Gym Attendance Logs
INSERT INTO `attendance` (`user_id`, `gym_id`, `check_in_time`, `check_in_method`, `status`) VALUES
(6, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'turnstile', 'verified'),
(6, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), 'turnstile', 'verified'),
(6, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), 'turnstile', 'verified'),
(7, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'qr_code', 'verified'),
(8, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'qr_code', 'verified');

-- 16. Two-Way Messaging Channel Between Coach Raj & Ritika Sharma
INSERT INTO `conversations` (`id`, `participant_one_id`, `participant_two_id`, `conversation_type`, `last_message_at`) VALUES
(1, 3, 7, 'trainer_member', NOW());

INSERT INTO `messages` (`conversation_id`, `sender_id`, `message_text`, `is_read`, `read_at`, `sent_at`) VALUES
(1, 3, 'Hi Ritika! I have reviewed your Tuesday back & bicep sets. Excellent control on the wide-grip pulldown.', 1, NOW(), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(1, 7, 'Thank you Coach Raj! The pause at the bottom really helped feel the lats engage.', 1, NOW(), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1, 3, 'Great work. For Thursday, focus on mobility and recovery. Drink at least 3 liters of water today.', 0, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE));

-- 17. Sample Trainer Note
INSERT INTO `trainer_notes` (`user_id`, `trainer_user_id`, `note_type`, `note_text`, `is_visible_to_user`) VALUES
(7, 3, 'workout_feedback', 'Increased pull-up volume by 2 reps per set. Form remains strictly controlled without hip swing.', 1),
(6, 3, 'milestone_praise', 'Hit 62.5 kg bodyweight target with healthy body composition metrics. Ready for next progressive overload phase.', 1);

-- 18. Sample Fitness Assessment
INSERT INTO `fitness_assessments` (`user_id`, `assessed_by_user_id`, `assessment_date`, `height_cm`, `weight_kg`, `age`, `gender`, `activity_level`, `bmr_kcal`, `tdee_kcal`, `target_calories_kcal`, `target_protein_g`, `target_carbs_g`, `target_fat_g`, `bmi`, `body_fat_us_navy`, `notes`) VALUES
(6, 3, '2026-01-10', 168.00, 62.50, 24, 'female', 1.550, 1420, 2201, 2200, 125, 275, 60, 22.1, 21.5, 'Initial assessment by Coach Raj; target hypertrophy surplus.');

SET FOREIGN_KEY_CHECKS = 1;
"""

with open('database/fitsync_mysql_schema.sql', 'w', encoding='utf-8') as f:
    f.write(schema_sql)

with open('fitsync_mysql_schema.sql', 'w', encoding='utf-8') as f:
    f.write(schema_sql)

print(f"Schema written successfully! Size: {len(schema_sql)} characters.")
