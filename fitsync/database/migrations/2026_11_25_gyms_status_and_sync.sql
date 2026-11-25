-- Safe migration to support gym lifecycle statuses (active, inactive, pending_approval, suspended)
-- Preserves all existing gyms, plans, memberships, users, and relationships.
ALTER TABLE `gyms`
    MODIFY COLUMN `status` ENUM('active','inactive','pending_approval','suspended') NOT NULL DEFAULT 'active';
