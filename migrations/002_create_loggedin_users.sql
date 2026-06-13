CREATE TABLE IF NOT EXISTS loggedin_users (
    id                    SERIAL PRIMARY KEY,
    username              VARCHAR(100) NOT NULL,
    normalized_username   VARCHAR(150) UNIQUE NOT NULL,
    password_hash         VARCHAR(100) NOT NULL,
    role                  VARCHAR(20) NOT NULL,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE loggedin_users
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
