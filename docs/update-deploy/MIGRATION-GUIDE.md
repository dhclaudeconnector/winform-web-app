# Migration System Guide

## Overview

Hệ thống migration cho phép quản lý thay đổi database schema một cách có tổ chức và an toàn.

## Migration Types

### AUTO Migrations
Chạy tự động khi update, không cần admin approve.

**Sử dụng cho:**
- CREATE TABLE
- CREATE INDEX
- CREATE FUNCTION/PROCEDURE
- CREATE VIEW
- ADD COLUMN (nullable hoặc có default)
- CREATE SCHEMA
- COMMENT ON

**Ví dụ:**
```sql
-- 002_auto_low_add_audit_table.sql
BEGIN;

CREATE TABLE IF NOT EXISTS webauth.audit_log (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  module_code VARCHAR(50),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_username ON webauth.audit_log(username);
CREATE INDEX idx_audit_log_created_at ON webauth.audit_log(created_at);

COMMENT ON TABLE webauth.audit_log IS 'Audit log for user actions';

COMMIT;
```

### MANUAL Migrations
Cần admin review và approve trước khi chạy.

**Sử dụng cho:**
- UPDATE data
- DELETE data
- DROP TABLE/COLUMN
- ALTER COLUMN (type change, add NOT NULL)
- TRUNCATE
- Complex data transformations

**Ví dụ:**
```sql
-- 003_manual_high_migrate_user_data.sql
-- WARNING: This migration modifies existing data
BEGIN;

-- Step 1: Backup
CREATE TABLE IF NOT EXISTS webauth.users_backup_20260426 AS 
SELECT * FROM current.dmnhanvien;

-- Step 2: Migrate data
UPDATE current.dmnhanvien 
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL;

-- Step 3: Verify
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM current.dmnhanvien
  WHERE email IS NOT NULL 
    AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$';
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % invalid email addresses', invalid_count;
  END IF;
END $$;

COMMIT;
```

## Risk Levels

### Low Risk
- Safe operations
- No data loss
- Easy to rollback
- Examples: CREATE TABLE, ADD COLUMN (nullable)

### Medium Risk
- Moderate impact
- Affects existing data
- Rollback possible but complex
- Examples: UPDATE with WHERE, ALTER COLUMN

### High Risk
- Dangerous operations
- Potential data loss
- Difficult to rollback
- Examples: DROP, DELETE, data migration

## Naming Convention

```
[version]_[type]_[risk]_[description].sql
```

**Components:**
- `version`: 001, 002, 003... (sequential)
- `type`: auto | manual
- `risk`: low | medium | high
- `description`: snake_case description

**Examples:**
```
001_auto_low_init_permissions.sql
002_auto_low_add_audit_table.sql
003_manual_high_migrate_user_data.sql
004_manual_medium_update_permissions.sql
005_auto_low_add_index_username.sql
```

## Creating Migrations

### Using CLI tool

```bash
cd backend
npm run migration:create -- --type auto --risk low --name "add_audit_table"
```

This creates:
```
backend/migrations/002_auto_low_add_audit_table.sql
```

### Manual creation

1. Determine next version number
2. Choose type (auto/manual) and risk (low/medium/high)
3. Create file with proper naming
4. Write SQL with transaction wrapper

## Migration File Structure

```sql
-- Migration: [version]_[type]_[risk]_[description]
-- Version: 1.1.0
-- Type: auto|manual
-- Risk: low|medium|high
-- Date: YYYY-MM-DD
-- Description: Human-readable description
-- Author: developer@example.com

BEGIN;

-- Your SQL statements here

COMMIT;
```

## Best Practices

### 1. Always use transactions
```sql
BEGIN;
-- statements
COMMIT;
```

### 2. Use IF EXISTS/IF NOT EXISTS
```sql
CREATE TABLE IF NOT EXISTS ...
DROP TABLE IF EXISTS ...
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
```

### 3. Add verification for data migrations
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM table WHERE condition) > 0 THEN
    RAISE EXCEPTION 'Verification failed';
  END IF;
END $$;
```

### 4. Backup before destructive operations
```sql
CREATE TABLE backup_table AS SELECT * FROM original_table;
```

### 5. Keep migrations small and focused
- One migration = one logical change
- Don't combine unrelated changes

### 6. Test on development database first
```bash
# Test migration
psql -d dev_database -f backend/migrations/002_auto_low_add_audit_table.sql

# Verify
psql -d dev_database -c "SELECT * FROM webauth.audit_log LIMIT 1;"
```

### 7. Document complex migrations
```sql
-- This migration does X because Y
-- Related to issue #123
-- Affects approximately N rows
```

## Running Migrations

### Automatic (during update)
AUTO migrations run automatically when update is applied.

### Manual approval
MANUAL migrations require admin approval via UI:
1. Admin sees pending migrations
2. Reviews SQL preview
3. Approves or rejects
4. System runs approved migrations

### CLI (development)
```bash
# Run all pending AUTO migrations
npm run migration:run

# Check migration status
npm run migration:status
```

## Migration Status

Migrations are tracked in `webauth.schema_migrations` table:

```sql
SELECT 
  version,
  name,
  migration_type,
  risk_level,
  status,
  executed_at,
  approved_by,
  execution_time_ms
FROM webauth.schema_migrations
ORDER BY version;
```

## Rollback

### AUTO migrations
- Transaction-based rollback on error
- Automatic rollback if migration fails

### MANUAL migrations
- No automatic rollback (too risky)
- Provide rollback instructions in comments:

```sql
-- Migration: Add new column
BEGIN;
ALTER TABLE users ADD COLUMN status VARCHAR(20);
COMMIT;

-- Rollback (manual):
-- BEGIN;
-- ALTER TABLE users DROP COLUMN status;
-- COMMIT;
```

## Common Patterns

### Adding a table
```sql
BEGIN;

CREATE TABLE IF NOT EXISTS schema.table_name (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_table_name ON schema.table_name(name);

COMMENT ON TABLE schema.table_name IS 'Description';

COMMIT;
```

### Adding a column
```sql
BEGIN;

-- Nullable column (safe)
ALTER TABLE schema.table_name 
ADD COLUMN IF NOT EXISTS new_column VARCHAR(50);

-- With default (safe)
ALTER TABLE schema.table_name 
ADD COLUMN IF NOT EXISTS new_column VARCHAR(50) DEFAULT 'value';

COMMIT;
```

### Modifying data
```sql
BEGIN;

-- Backup first
CREATE TABLE schema.table_backup AS 
SELECT * FROM schema.table_name;

-- Update
UPDATE schema.table_name 
SET column = new_value
WHERE condition;

-- Verify
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM schema.table_name WHERE invalid_condition) > 0 THEN
    RAISE EXCEPTION 'Verification failed';
  END IF;
END $$;

COMMIT;
```

### Adding constraints
```sql
BEGIN;

-- Add NOT NULL (check data first!)
ALTER TABLE schema.table_name 
ALTER COLUMN column_name SET NOT NULL;

-- Add foreign key
ALTER TABLE schema.table_name 
ADD CONSTRAINT fk_name 
FOREIGN KEY (column) 
REFERENCES other_table(id);

-- Add unique constraint
ALTER TABLE schema.table_name 
ADD CONSTRAINT uk_name 
UNIQUE (column);

COMMIT;
```

## Troubleshooting

### Migration failed

1. Check error in database:
```sql
SELECT * FROM webauth.schema_migrations 
WHERE status = 'failed' 
ORDER BY executed_at DESC;
```

2. Fix the migration file
3. Delete failed record:
```sql
DELETE FROM webauth.schema_migrations WHERE version = '002';
```

4. Retry migration

### Migration stuck

1. Check for locks:
```sql
SELECT * FROM pg_locks WHERE NOT granted;
```

2. Kill blocking queries if needed
3. Retry migration

### Wrong migration order

Migrations run in version order. If you need to insert a migration:
- Use version like `002a`, `002b`
- Or renumber all subsequent migrations

## See Also

- [Update System Documentation](./UPDATE-SYSTEM.md)
- [Quick Start Guide](./QUICK-START-UPDATE.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
