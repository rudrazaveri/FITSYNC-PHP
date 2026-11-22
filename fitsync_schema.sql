-- =====================================================================
-- FitSync – Complete Database Schema (PostgreSQL 14+)
-- Roles: user (member/athlete), trainer, gym_owner, doctor, physio, admin
--
-- Conventions
--   * Every table: id BIGINT identity PK, created_at / updated_at.
--   * "Status" columns are TEXT + CHECK (easier to migrate than PG ENUMs).
--   * History is kept by inserting rows, never by overwriting.
--   * Dashboard numbers are NOT stored – they are computed by queries.
--   * deleted_at = soft delete for things other rows still reference.
-- =====================================================================


-- =====================================================================
-- 0. FILES (section 7.4) – every upload goes through this one table
-- =====================================================================
CREATE TABLE files (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_user_id   BIGINT,                         -- FK added after users
    storage_key     TEXT NOT NULL UNIQUE,           -- path in S3 / local disk
    original_name   TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    size_bytes      BIGINT NOT NULL CHECK (size_bytes > 0),
    purpose         TEXT NOT NULL CHECK (purpose IN
                    ('profile_picture','gym_photo','verification_doc',
                     'health_report','progress_photo','exercise_media',
                     'message_attachment','report_export','other')),
    is_private      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);


-- =====================================================================
-- 1. IDENTITY, AUTH & SECURITY (1.1, 8.1, 8.3)
-- =====================================================================
CREATE TABLE users (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email               TEXT NOT NULL UNIQUE,
    mobile              TEXT UNIQUE,
    password_hash       TEXT NOT NULL,
    role                TEXT NOT NULL CHECK (role IN
                        ('user','trainer','gym_owner','doctor','physio','admin')),
    full_name           TEXT NOT NULL,
    profile_picture_id  BIGINT REFERENCES files(id),
    email_verified_at   TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','deactivated','suspended','deleted')),
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE files ADD CONSTRAINT files_owner_fk
    FOREIGN KEY (owner_user_id) REFERENCES users(id);

-- Email verification + password reset share one table
CREATE TABLE auth_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose     TEXT NOT NULL CHECK (purpose IN ('email_verify','password_reset','email_change')),
    token_hash  TEXT NOT NULL UNIQUE,               -- store a hash, never the raw token
    new_email   TEXT,                               -- only for email_change
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Server-side sessions (needed for forced logout / auto expiry)
CREATE TABLE user_sessions (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL UNIQUE,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ
);

CREATE TABLE account_deletion_requests (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id),
    reason       TEXT,
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','completed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_by BIGINT REFERENCES users(id),
    processed_at TIMESTAMPTZ
);

-- Settings + notification preferences (1.2, 1.23, 7.2)
CREATE TABLE user_settings (
    user_id             BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    timezone            TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    units               TEXT NOT NULL DEFAULT 'metric' CHECK (units IN ('metric','imperial')),
    daily_water_target_ml INT CHECK (daily_water_target_ml > 0),
    extra               JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE notification_preferences (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL,                      -- 'workout_reminder', 'appointment_reminder'…
    in_app      BOOLEAN NOT NULL DEFAULT TRUE,
    email       BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, event_type)
);


-- =====================================================================
-- 2. ROLE PROFILES (1.2, 2.1, 3.1, 4.1, 5.1)
-- =====================================================================
-- User (member / athlete)
CREATE TABLE user_profiles (
    user_id             BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth       DATE,                       -- age is computed, never stored
    gender              TEXT,
    height_cm           NUMERIC(5,1),               -- current value; history in body_measurements
    experience_level    TEXT CHECK (experience_level IN ('beginner','intermediate','advanced')),
    activity_level      TEXT CHECK (activity_level IN
                        ('sedentary','light','moderate','active','very_active')),  -- for TDEE
    emergency_contact_name  TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fitness_interests (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE user_fitness_interests (
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    interest_id BIGINT REFERENCES fitness_interests(id),
    PRIMARY KEY (user_id, interest_id)
);

-- Trainer, doctor and physio all have a "professional" profile.
-- Same columns, so one table with the user's role telling them apart.
CREATE TABLE professional_profiles (
    user_id                 BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio                     TEXT,
    years_experience        INT CHECK (years_experience >= 0),
    registration_number     TEXT,                   -- medical / physio council no.
    clinic_name             TEXT,
    clinic_address          TEXT,
    city                    TEXT,
    latitude                NUMERIC(9,6),
    longitude               NUMERIC(9,6),
    offers_online           BOOLEAN NOT NULL DEFAULT FALSE,
    offers_in_person        BOOLEAN NOT NULL DEFAULT TRUE,
    consultation_fee        NUMERIC(10,2),
    verification_status     TEXT NOT NULL DEFAULT 'pending'
                            CHECK (verification_status IN ('pending','verified','rejected')),
    contact_visible_to_members BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE professional_credentials (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('qualification','certification','registration')),
    title           TEXT NOT NULL,
    issuer          TEXT,
    issued_on       DATE,
    expires_on      DATE,
    document_id     BIGINT REFERENCES files(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE specializations (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    applies_to  TEXT NOT NULL CHECK (applies_to IN ('trainer','doctor','physio')),
    name        TEXT NOT NULL,
    UNIQUE (applies_to, name)
);
CREATE TABLE professional_specializations (
    user_id           BIGINT REFERENCES users(id) ON DELETE CASCADE,
    specialization_id BIGINT REFERENCES specializations(id),
    PRIMARY KEY (user_id, specialization_id)
);

-- Verification requests reviewed by admin (6.4, 6.5)
CREATE TABLE verification_requests (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_type  TEXT NOT NULL CHECK (subject_type IN ('professional','gym')),
    subject_id    BIGINT NOT NULL,                  -- users.id or gyms.id
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by   BIGINT REFERENCES users(id),
    reviewed_at   TIMESTAMPTZ,
    review_note   TEXT
);
CREATE TABLE verification_documents (
    request_id  BIGINT REFERENCES verification_requests(id) ON DELETE CASCADE,
    file_id     BIGINT REFERENCES files(id),
    PRIMARY KEY (request_id, file_id)
);


-- =====================================================================
-- 3. GYMS (1.4, 3.3, 6.4)
-- =====================================================================
CREATE TABLE gyms (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id        BIGINT NOT NULL REFERENCES users(id),
    name            TEXT NOT NULL,
    description     TEXT,
    address_line    TEXT NOT NULL,
    city            TEXT NOT NULL,
    state           TEXT,
    pincode         TEXT,
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    phone           TEXT,
    email           TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (verification_status IN ('pending','verified','rejected')),
    listing_status  TEXT NOT NULL DEFAULT 'inactive'
                    CHECK (listing_status IN ('active','inactive','suspended')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gym_photos (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    gym_id     BIGINT NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    file_id    BIGINT NOT NULL REFERENCES files(id),
    position   INT NOT NULL DEFAULT 0,
    is_cover   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE gym_operating_hours (
    gym_id      BIGINT REFERENCES gyms(id) ON DELETE CASCADE,
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),   -- 0 = Monday
    opens_at    TIME,
    closes_at   TIME,
    is_closed   BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (gym_id, day_of_week)
);

CREATE TABLE facilities (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE                       -- 'Sauna', 'Parking', 'Locker'…
);
CREATE TABLE gym_facilities (
    gym_id      BIGINT REFERENCES gyms(id) ON DELETE CASCADE,
    facility_id BIGINT REFERENCES facilities(id),
    PRIMARY KEY (gym_id, facility_id)
);

-- Shared with the exercise library
CREATE TABLE equipment (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE gym_equipment (
    gym_id       BIGINT REFERENCES gyms(id) ON DELETE CASCADE,
    equipment_id BIGINT REFERENCES equipment(id),
    quantity     INT,
    PRIMARY KEY (gym_id, equipment_id)
);

-- Which trainers work at which gym (3.6)
CREATE TABLE gym_trainers (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    gym_id      BIGINT NOT NULL REFERENCES gyms(id),
    trainer_id  BIGINT NOT NULL REFERENCES users(id),
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    joined_on   DATE NOT NULL DEFAULT CURRENT_DATE,
    left_on     DATE
);
CREATE UNIQUE INDEX uq_gym_trainer_active
    ON gym_trainers (gym_id, trainer_id) WHERE status = 'active';


-- =====================================================================
-- 4. MEMBERSHIPS (1.5, 3.4, 3.5)
-- =====================================================================
CREATE TABLE membership_plans (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    name            TEXT NOT NULL,
    description     TEXT,
    duration_days   INT NOT NULL CHECK (duration_days > 0),
    fee             NUMERIC(10,2) NOT NULL CHECK (fee >= 0),
    benefits        JSONB NOT NULL DEFAULT '[]',
    includes_trainer BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

-- One row = one membership, from request to expiry.
-- fee_paid / duration are copied so later plan edits don't rewrite history.
CREATE TABLE memberships (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    plan_id         BIGINT NOT NULL REFERENCES membership_plans(id),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
                    ('pending','approved','rejected','active','cancel_requested',
                     'cancelled','expired','withdrawn')),
    fee_at_purchase NUMERIC(10,2) NOT NULL,
    duration_days   INT NOT NULL,
    start_date      DATE,
    end_date        DATE,
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by     BIGINT REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    cancelled_at    TIMESTAMPTZ,
    CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX ix_memberships_user   ON memberships (user_id, status);
CREATE INDEX ix_memberships_gym    ON memberships (gym_id, status);
CREATE INDEX ix_memberships_expiry ON memberships (end_date) WHERE status = 'active';


-- =====================================================================
-- 5. TRAINER ↔ USER (1.6, 1.22, 2.3, 3.6)
-- =====================================================================
CREATE TABLE trainer_assignments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    trainer_id      BIGINT NOT NULL REFERENCES users(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','ended')),
    training_status TEXT CHECK (training_status IN ('on_track','needs_attention','inactive','on_hold')),
    assigned_by     BIGINT REFERENCES users(id),
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at        TIMESTAMPTZ,
    end_reason      TEXT
);
CREATE UNIQUE INDEX uq_one_active_trainer
    ON trainer_assignments (user_id, gym_id) WHERE status = 'active';
CREATE INDEX ix_assign_trainer ON trainer_assignments (trainer_id, status);

-- Reassignment requested by user or trainer, decided by gym owner
CREATE TABLE reassignment_requests (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id   BIGINT NOT NULL REFERENCES trainer_assignments(id),
    requested_by    BIGINT NOT NULL REFERENCES users(id),
    reason          TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','withdrawn')),
    decided_by      BIGINT REFERENCES users(id),
    decided_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "Where authorized": what a trainer may see about a user (8.2)
CREATE TABLE trainer_data_permissions (
    user_id                 BIGINT REFERENCES users(id) ON DELETE CASCADE,
    trainer_id              BIGINT REFERENCES users(id) ON DELETE CASCADE,
    can_view_measurements   BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_assessments    BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_progress_photos BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_contact        BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, trainer_id)
);


-- =====================================================================
-- 6. GOALS, ASSESSMENTS & BODY PROGRESS (1.7, 1.12, 1.13, 2.10)
-- =====================================================================
CREATE TABLE fitness_goals (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    goal_type       TEXT NOT NULL CHECK (goal_type IN
                    ('weight_loss','muscle_building','strength','endurance','general_fitness')),
    start_weight_kg NUMERIC(5,1),
    target_weight_kg NUMERIC(5,1),
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date     DATE,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','completed','abandoned','replaced')),
    completed_at    TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_goals_user ON fitness_goals (user_id, status);

CREATE TABLE body_measurements (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    measured_on     DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg       NUMERIC(5,1),
    height_cm       NUMERIC(5,1),
    waist_cm        NUMERIC(5,1),
    neck_cm         NUMERIC(5,1),
    hip_cm          NUMERIC(5,1),
    chest_cm        NUMERIC(5,1),
    arm_cm          NUMERIC(5,1),
    thigh_cm        NUMERIC(5,1),
    other           JSONB NOT NULL DEFAULT '{}',    -- "other supported measurements"
    recorded_by     BIGINT REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_measure_user ON body_measurements (user_id, measured_on DESC);

CREATE TABLE progress_photos (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    file_id     BIGINT NOT NULL REFERENCES files(id),
    taken_on    DATE NOT NULL,
    angle       TEXT CHECK (angle IN ('front','side','back','other')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Results are calculated in Python, then SAVED as a snapshot so history
-- doesn't change if the formula or the user's later data changes.
CREATE TABLE fitness_assessments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id),
    measurement_id      BIGINT REFERENCES body_measurements(id),
    goal_id             BIGINT REFERENCES fitness_goals(id),
    assessed_by         BIGINT REFERENCES users(id),   -- NULL = self-assessment
    age_years           INT,
    activity_level      TEXT,
    bmi                 NUMERIC(4,1),
    bmi_category        TEXT,
    bmr_kcal            INT,
    tdee_kcal           INT,
    target_kcal         INT,
    target_protein_g    INT,
    target_carbs_g      INT,
    target_fat_g        INT,
    waist_to_height     NUMERIC(4,3),
    body_fat_pct        NUMERIC(4,1),
    lean_mass_kg        NUMERIC(5,1),
    formula_version     TEXT NOT NULL DEFAULT 'v1',     -- e.g. Mifflin-St Jeor, US Navy
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_assess_user ON fitness_assessments (user_id, created_at DESC);


-- =====================================================================
-- 7. EXERCISE LIBRARY (1.9, 2.8, 5.8, 6.6)
--    Gym and physio exercises live in one table, told apart by `library`.
-- =====================================================================
CREATE TABLE muscle_groups (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE      -- Chest, Back, Shoulders, Biceps, Triceps, Forearms,
);                                 -- Legs, Glutes, Abs & core, Cardio, Full body

CREATE TABLE body_regions (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE      -- physio: Neck, Lower back, Knee, Shoulder…
);

CREATE TABLE exercises (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    library             TEXT NOT NULL DEFAULT 'gym' CHECK (library IN ('gym','physio')),
    name                TEXT NOT NULL,
    description         TEXT,
    instructions        TEXT,
    safety_instructions TEXT,
    exercise_type       TEXT CHECK (exercise_type IN
                        ('strength','cardio','flexibility','mobility','balance','plyometric','rehab')),
    difficulty          TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
    body_region_id      BIGINT REFERENCES body_regions(id),
    created_by          BIGINT REFERENCES users(id),   -- NULL = platform exercise
    gym_id              BIGINT REFERENCES gyms(id),    -- set for custom gym exercises
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX ix_exercise_name ON exercises (lower(name));

CREATE TABLE exercise_media (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exercise_id BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    media_type  TEXT NOT NULL CHECK (media_type IN ('image','video')),
    file_id     BIGINT REFERENCES files(id),
    url         TEXT,                               -- or external (YouTube/CDN)
    position    INT NOT NULL DEFAULT 0,
    CHECK (file_id IS NOT NULL OR url IS NOT NULL)
);

CREATE TABLE exercise_muscles (
    exercise_id     BIGINT REFERENCES exercises(id) ON DELETE CASCADE,
    muscle_group_id BIGINT REFERENCES muscle_groups(id),
    is_primary      BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (exercise_id, muscle_group_id)
);

CREATE TABLE exercise_equipment (
    exercise_id  BIGINT REFERENCES exercises(id) ON DELETE CASCADE,
    equipment_id BIGINT REFERENCES equipment(id),
    PRIMARY KEY (exercise_id, equipment_id)
);


-- =====================================================================
-- 8. WORKOUT PLANS – 4 layers (1.8, 2.4–2.7)
--    plan (template) → assignment (to a user) → scheduled_workouts (dates)
--    → workout_sessions / set logs (what actually happened)
-- =====================================================================
CREATE TABLE workout_plans (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trainer_id      BIGINT NOT NULL REFERENCES users(id),
    gym_id          BIGINT REFERENCES gyms(id),
    name            TEXT NOT NULL,
    description     TEXT,
    goal_type       TEXT,
    difficulty      TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
    duration_weeks  INT CHECK (duration_weeks > 0),
    days_per_week   SMALLINT CHECK (days_per_week BETWEEN 1 AND 7),
    instructions    TEXT,
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','inactive')),
    parent_plan_id  BIGINT REFERENCES workout_plans(id),   -- duplicate / new version
    version         INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE plan_days (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_id     BIGINT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_number  SMALLINT NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    title       TEXT,                               -- 'Push', 'Pull', 'Legs'
    is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (plan_id, day_number)
);

CREATE TABLE plan_day_exercises (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_day_id      BIGINT NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
    exercise_id      BIGINT NOT NULL REFERENCES exercises(id),
    position         INT NOT NULL,
    sets             SMALLINT CHECK (sets > 0),
    reps_min         SMALLINT,
    reps_max         SMALLINT,
    target_weight_kg NUMERIC(6,2),
    rest_seconds     INT,
    duration_seconds INT,
    instructions     TEXT,
    CHECK (reps_max IS NULL OR reps_min IS NULL OR reps_max >= reps_min)
);

CREATE TABLE plan_assignments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_id         BIGINT NOT NULL REFERENCES workout_plans(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    trainer_id      BIGINT NOT NULL REFERENCES users(id),
    start_date      DATE NOT NULL,
    end_date        DATE,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN
                    ('active','paused','completed','replaced','cancelled')),
    paused_at       TIMESTAMPTZ,
    replaced_by_id  BIGINT REFERENCES plan_assignments(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_plan_assign_user ON plan_assignments (user_id, status);

-- Generated when a plan is assigned: one row per workout date
CREATE TABLE scheduled_workouts (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id    BIGINT NOT NULL REFERENCES plan_assignments(id) ON DELETE CASCADE,
    plan_day_id      BIGINT NOT NULL REFERENCES plan_days(id),
    user_id          BIGINT NOT NULL REFERENCES users(id),   -- denormalised for fast calendar queries
    scheduled_date   DATE NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
                     ('pending','completed','missed','skipped','rest')),
    rescheduled_from DATE
);
CREATE INDEX ix_sched_user_date ON scheduled_workouts (user_id, scheduled_date);

-- What the user actually did (1.10, 1.11, 2.9)
CREATE TABLE workout_sessions (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id              BIGINT NOT NULL REFERENCES users(id),
    scheduled_workout_id BIGINT REFERENCES scheduled_workouts(id),  -- NULL = ad-hoc workout
    status               TEXT NOT NULL DEFAULT 'in_progress'
                         CHECK (status IN ('in_progress','paused','completed','abandoned')),
    started_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at         TIMESTAMPTZ,
    active_seconds       INT,                       -- excludes paused time
    notes                TEXT,
    feedback             TEXT,
    rating               SMALLINT CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX ix_sessions_user ON workout_sessions (user_id, started_at DESC);

CREATE TABLE session_exercises (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id            BIGINT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id           BIGINT NOT NULL REFERENCES exercises(id),
    plan_day_exercise_id  BIGINT REFERENCES plan_day_exercises(id),
    position              INT NOT NULL,
    status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','completed','skipped')),
    notes                 TEXT
);

CREATE TABLE exercise_set_logs (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_exercise_id BIGINT NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    set_number          SMALLINT NOT NULL,
    reps                SMALLINT,
    weight_kg           NUMERIC(6,2),
    duration_seconds    INT,
    completed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_exercise_id, set_number)
);

-- User asks the trainer to change a plan (1.22)
CREATE TABLE plan_modification_requests (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id   BIGINT NOT NULL REFERENCES plan_assignments(id),
    requested_by    BIGINT NOT NULL REFERENCES users(id),
    message         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','declined')),
    trainer_response TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);

-- Trainer notes / feedback / observations (2.9, 2.10, 2.13)
CREATE TABLE trainer_notes (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trainer_id          BIGINT NOT NULL REFERENCES users(id),
    user_id             BIGINT NOT NULL REFERENCES users(id),
    note_type           TEXT NOT NULL CHECK (note_type IN
                        ('private','observation','performance','suggestion','limitation',
                         'progress','assessment','recommendation','workout_feedback')),
    content             TEXT NOT NULL,
    visible_to_user     BOOLEAN NOT NULL DEFAULT FALSE,
    session_id          BIGINT REFERENCES workout_sessions(id),
    plan_assignment_id  BIGINT REFERENCES plan_assignments(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_notes_pair ON trainer_notes (trainer_id, user_id, created_at DESC);


-- =====================================================================
-- 9. NUTRITION, RECIPES, RESTRICTIONS, WATER (1.14–1.17)
-- =====================================================================
CREATE TABLE food_categories (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Nutrients are stored per 100 g; servings convert to grams.
CREATE TABLE foods (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id     BIGINT REFERENCES food_categories(id),
    name            TEXT NOT NULL,
    kcal_per_100g   NUMERIC(7,2) NOT NULL,
    protein_g       NUMERIC(6,2) NOT NULL DEFAULT 0,
    carbs_g         NUMERIC(6,2) NOT NULL DEFAULT 0,
    fat_g           NUMERIC(6,2) NOT NULL DEFAULT 0,
    fibre_g         NUMERIC(6,2),
    sugar_g         NUMERIC(6,2),
    sodium_mg       NUMERIC(7,2),
    other_nutrients JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX ix_food_name ON foods (lower(name));

CREATE TABLE food_servings (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    food_id     BIGINT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,                      -- '1 cup', '1 roti', '1 piece'
    grams       NUMERIC(7,2) NOT NULL CHECK (grams > 0)
);

-- Allergens & restriction tags used for ingredient-conflict warnings
CREATE TABLE allergens (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE                       -- 'Peanut', 'Gluten', 'Lactose'…
);
CREATE TABLE food_allergens (
    food_id     BIGINT REFERENCES foods(id) ON DELETE CASCADE,
    allergen_id BIGINT REFERENCES allergens(id),
    PRIMARY KEY (food_id, allergen_id)
);
CREATE TABLE dietary_tags (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE                       -- 'Vegetarian', 'Vegan', 'Jain', 'Halal'
);
CREATE TABLE food_dietary_tags (                    -- food IS compatible with tag
    food_id BIGINT REFERENCES foods(id) ON DELETE CASCADE,
    tag_id  BIGINT REFERENCES dietary_tags(id),
    PRIMARY KEY (food_id, tag_id)
);
CREATE TABLE user_allergies (
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    allergen_id BIGINT REFERENCES allergens(id),
    notes       TEXT,
    PRIMARY KEY (user_id, allergen_id)
);
CREATE TABLE user_dietary_restrictions (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    tag_id  BIGINT REFERENCES dietary_tags(id),
    PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE food_reactions (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    food_id     BIGINT REFERENCES foods(id),
    meal_item_id BIGINT,                            -- FK added after meal_items
    occurred_at TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    severity    TEXT NOT NULL CHECK (severity IN ('mild','moderate','severe')),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipe_categories (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE recipes (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id     BIGINT REFERENCES recipe_categories(id),
    name            TEXT NOT NULL,
    description     TEXT,
    instructions    TEXT NOT NULL,
    servings        SMALLINT NOT NULL DEFAULT 1,
    prep_minutes    INT,
    image_id        BIGINT REFERENCES files(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
-- Recipe nutrition = SUM over ingredients (computed, not stored)
CREATE TABLE recipe_ingredients (
    recipe_id   BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
    food_id     BIGINT REFERENCES foods(id),
    grams       NUMERIC(7,2) NOT NULL,
    display_text TEXT,                              -- '2 cups chopped spinach'
    PRIMARY KEY (recipe_id, food_id)
);

CREATE TABLE favourite_foods (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    food_id BIGINT REFERENCES foods(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, food_id)
);
CREATE TABLE favourite_recipes (
    user_id   BIGINT REFERENCES users(id) ON DELETE CASCADE,
    recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, recipe_id)
);

CREATE TABLE meals (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    meal_date   DATE NOT NULL,
    meal_type   TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_meals_user_date ON meals (user_id, meal_date);

-- Nutrient values are COPIED at log time so later food-database
-- corrections don't silently change past diaries.
CREATE TABLE meal_items (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    meal_id     BIGINT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_id     BIGINT REFERENCES foods(id),
    recipe_id   BIGINT REFERENCES recipes(id),
    grams       NUMERIC(7,2) NOT NULL CHECK (grams > 0),
    kcal        NUMERIC(7,2) NOT NULL,
    protein_g   NUMERIC(6,2) NOT NULL,
    carbs_g     NUMERIC(6,2) NOT NULL,
    fat_g       NUMERIC(6,2) NOT NULL,
    CHECK ((food_id IS NOT NULL) <> (recipe_id IS NOT NULL))
);
ALTER TABLE food_reactions ADD CONSTRAINT food_reactions_meal_item_fk
    FOREIGN KEY (meal_item_id) REFERENCES meal_items(id) ON DELETE SET NULL;

CREATE TABLE water_logs (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    amount_ml   INT NOT NULL CHECK (amount_ml > 0),
    logged_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    log_date    DATE NOT NULL DEFAULT CURRENT_DATE  -- in user's timezone, for daily totals
);
CREATE INDEX ix_water_user_date ON water_logs (user_id, log_date);


-- =====================================================================
-- 10. ATTENDANCE (1.18, 2.11, 3.7)
-- =====================================================================
CREATE TABLE attendance (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    membership_id   BIGINT REFERENCES memberships(id),
    check_in_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    check_out_at    TIMESTAMPTZ,
    visit_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    method          TEXT NOT NULL DEFAULT 'app' CHECK (method IN ('app','qr','manual','staff')),
    recorded_by     BIGINT REFERENCES users(id)
);
CREATE INDEX ix_att_user ON attendance (user_id, visit_date);
CREATE INDEX ix_att_gym  ON attendance (gym_id, visit_date);


-- =====================================================================
-- 11. AVAILABILITY & BOOKINGS (2.14, 4.5, 5.5)
--     Shared by trainers, doctors and physios.
-- =====================================================================
CREATE TABLE availability_rules (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id         BIGINT NOT NULL REFERENCES users(id),
    day_of_week         SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    slot_minutes        INT NOT NULL DEFAULT 30 CHECK (slot_minutes > 0),
    buffer_minutes      INT NOT NULL DEFAULT 0,
    consultation_type   TEXT NOT NULL DEFAULT 'both'
                        CHECK (consultation_type IN ('online','in_person','both')),
    valid_from          DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until         DATE,
    CHECK (end_time > start_time)
);

CREATE TABLE availability_blocks (                 -- unavailable dates / time off
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES users(id),
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    reason      TEXT,
    CHECK (ends_at > starts_at)
);

-- Appointments with doctors / physios (1.20, 4.4, 5.4)
-- Trainer sessions are stored here too (provider = trainer, kind = 'training').
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE appointments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind                TEXT NOT NULL CHECK (kind IN ('medical','physio','training')),
    provider_id         BIGINT NOT NULL REFERENCES users(id),
    user_id             BIGINT NOT NULL REFERENCES users(id),
    consultation_type   TEXT NOT NULL CHECK (consultation_type IN ('online','in_person')),
    starts_at           TIMESTAMPTZ NOT NULL,
    ends_at             TIMESTAMPTZ NOT NULL,
    status              TEXT NOT NULL DEFAULT 'requested' CHECK (status IN
                        ('requested','confirmed','rejected','cancelled','completed','no_show')),
    reason              TEXT,
    meeting_url         TEXT,
    meeting_provider    TEXT,                       -- 'jitsi', 'google_meet', 'zoom'
    cancelled_by        BIGINT REFERENCES users(id),
    cancel_reason       TEXT,
    rescheduled_from_id BIGINT REFERENCES appointments(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at),
    -- "Prevent overlapping appointments" enforced by the database itself:
    CONSTRAINT no_provider_overlap EXCLUDE USING gist (
        provider_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&
    ) WHERE (status IN ('requested','confirmed'))
);
CREATE INDEX ix_appt_user     ON appointments (user_id, starts_at);
CREATE INDEX ix_appt_provider ON appointments (provider_id, starts_at);

CREATE TABLE reschedule_requests (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id      BIGINT NOT NULL REFERENCES appointments(id),
    requested_by        BIGINT NOT NULL REFERENCES users(id),
    proposed_starts_at  TIMESTAMPTZ NOT NULL,
    proposed_ends_at    TIMESTAMPTZ NOT NULL,
    reason              TEXT,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','declined','withdrawn')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ
);

-- Doctor / physio consultation notes (4.3, 4.8, 5.3)
CREATE TABLE consultation_notes (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id  BIGINT NOT NULL REFERENCES appointments(id),
    provider_id     BIGINT NOT NULL REFERENCES users(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    consultation_date DATE NOT NULL,
    observations    TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =====================================================================
-- 12. PHYSIOTHERAPY (5.7–5.9)
-- =====================================================================
CREATE TABLE physio_sessions (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id      BIGINT REFERENCES appointments(id),
    physio_id           BIGINT NOT NULL REFERENCES users(id),
    user_id             BIGINT NOT NULL REFERENCES users(id),
    session_at          TIMESTAMPTZ NOT NULL,
    description         TEXT,
    reported_symptoms   TEXT,
    pain_score          SMALLINT CHECK (pain_score BETWEEN 0 AND 10),
    observations        TEXT,
    treatment_notes     TEXT,
    reported_progress   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE physio_exercise_assignments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    physio_id           BIGINT NOT NULL REFERENCES users(id),
    user_id             BIGINT NOT NULL REFERENCES users(id),
    session_id          BIGINT REFERENCES physio_sessions(id),
    exercise_id         BIGINT NOT NULL REFERENCES exercises(id),
    sets                SMALLINT,
    reps                SMALLINT,
    duration_seconds    INT,
    times_per_day       SMALLINT,
    instructions        TEXT,
    start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date            DATE,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','completed','stopped'))
);

CREATE TABLE physio_exercise_logs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id   BIGINT NOT NULL REFERENCES physio_exercise_assignments(id) ON DELETE CASCADE,
    performed_on    DATE NOT NULL,
    sets_done       SMALLINT,
    reps_done       SMALLINT,
    pain_score      SMALLINT CHECK (pain_score BETWEEN 0 AND 10),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =====================================================================
-- 13. HEALTH REPORTS & SHARING (1.21, 4.6, 5.6, 8.2)
-- =====================================================================
CREATE TABLE report_categories (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE                       -- 'Blood test', 'X-ray', 'MRI', 'Prescription'
);

CREATE TABLE health_reports (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    file_id     BIGINT NOT NULL REFERENCES files(id),
    category_id BIGINT REFERENCES report_categories(id),
    title       TEXT NOT NULL,
    report_date DATE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX ix_reports_user ON health_reports (user_id, report_date DESC);

-- A row is never deleted: revoking sets revoked_at → sharing history for free.
CREATE TABLE report_shares (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    report_id       BIGINT NOT NULL REFERENCES health_reports(id),
    shared_with_id  BIGINT NOT NULL REFERENCES users(id),     -- doctor / physio
    can_download    BOOLEAN NOT NULL DEFAULT FALSE,
    appointment_id  BIGINT REFERENCES appointments(id),
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_active_share
    ON report_shares (report_id, shared_with_id) WHERE revoked_at IS NULL;

-- Same idea for sharing fitness assessments with a doctor / physio
CREATE TABLE assessment_shares (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assessment_id   BIGINT NOT NULL REFERENCES fitness_assessments(id),
    shared_with_id  BIGINT NOT NULL REFERENCES users(id),
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ
);


-- =====================================================================
-- 14. MESSAGING & NOTIFICATIONS (1.22, 2.12, 7.2)
-- =====================================================================
CREATE TABLE conversations (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_a_id   BIGINT NOT NULL REFERENCES users(id),     -- store smaller id in user_a
    user_b_id   BIGINT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user_a_id < user_b_id),
    UNIQUE (user_a_id, user_b_id)
);

CREATE TABLE messages (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       BIGINT NOT NULL REFERENCES users(id),
    message_type    TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN
                    ('text','query','instruction','reminder','feedback')),
    body            TEXT NOT NULL,
    attachment_id   BIGINT REFERENCES files(id),
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_messages_conv ON messages (conversation_id, created_at);

CREATE TABLE notifications (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL,                      -- matches notification_preferences.event_type
    title       TEXT NOT NULL,
    body        TEXT,
    entity_type TEXT,                               -- 'appointment', 'membership', 'plan_assignment'…
    entity_id   BIGINT,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMPTZ,
    email_sent_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_notif_user ON notifications (user_id, is_read, created_at DESC);

-- Reminders that a scheduler (APScheduler / Celery beat) turns into notifications
CREATE TABLE reminders (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL,                      -- 'water', 'workout', 'nutrition', 'appointment'
    remind_at   TIMESTAMPTZ NOT NULL,
    repeat_rule TEXT,                               -- e.g. 'daily', 'every_2h' (simple rule string)
    entity_type TEXT,
    entity_id   BIGINT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ
);
CREATE INDEX ix_reminders_due ON reminders (remind_at) WHERE is_active;


-- =====================================================================
-- 15. REPORTS, ADMIN & AUDIT (1.24, 6.x, 7.3, 8.3)
-- =====================================================================
CREATE TABLE report_exports (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    requested_by BIGINT NOT NULL REFERENCES users(id),
    report_type  TEXT NOT NULL,                     -- 'weight_progress', 'gym_attendance'…
    params       JSONB NOT NULL DEFAULT '{}',       -- date range, filters
    format       TEXT NOT NULL CHECK (format IN ('pdf','csv')),
    status       TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','ready','failed')),
    file_id      BIGINT REFERENCES files(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE complaints (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reported_by  BIGINT NOT NULL REFERENCES users(id),
    target_type  TEXT NOT NULL CHECK (target_type IN ('gym','user','professional','content','other')),
    target_id    BIGINT,
    subject      TEXT NOT NULL,
    description  TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','dismissed')),
    handled_by   BIGINT REFERENCES users(id),
    resolution   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at  TIMESTAMPTZ
);

CREATE TABLE platform_settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_by  BIGINT REFERENCES users(id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only log of sensitive actions (report viewed, status changed, login…)
CREATE TABLE audit_logs (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id    BIGINT REFERENCES users(id),
    action      TEXT NOT NULL,                      -- 'health_report.view', 'membership.approve'
    entity_type TEXT,
    entity_id   BIGINT,
    details     JSONB NOT NULL DEFAULT '{}',        -- before/after values
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX ix_audit_actor  ON audit_logs (actor_id, created_at DESC);
