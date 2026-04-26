# Database Migrations

## Migration Naming Convention

All migration files must follow this naming pattern:

```
[version]_[type]_[risk]_[description].sql
```

### Components:

- **version**: Sequential number (001, 002, 003, etc.)
- **type**: `auto` or `manual`
  - `auto`: Runs automatically without user approval (structure changes)
  - `manual`: Requires admin approval before execution (data changes)
- **risk**: `low`, `medium`, or `high`
  - `low`: Safe operations (CREATE TABLE, ADD COLUMN nullable)
  - `medium`: Moderate risk (UPDATE with WHERE, ALTER COLUMN)
  - `high`: Dangerous operations (DROP, DELETE, data migration)
- **description**: Snake_case description of the change

### Examples:

```
001_auto_low_init_permissions.sql
002_auto_low_add_audit_table.sql
003_manual_high_migrate_user_data.sql
004_manual_medium_update_permissions.sql
005_auto_low_add_index_username.sql
```

## Migration Classification

### AUTO Migrations (Run automatically):
- CREATE TABLE
- CREATE INDEX
- CREATE FUNCTION
- CREATE VIEW
- ADD COLUMN (nullable or with default)
- CREATE SCHEMA
- COMMENT ON

### MANUAL Migrations (Require approval):
- ALTER COLUMN (type change, NOT NULL)
- DROP COLUMN
- DROP TABLE
- UPDATE data
- DELETE data
- INSERT data (bulk)
- TRUNCATE
- Complex data transformations

## Migration File Structure

```sql
-- Migration: 002_auto_low_add_audit_table
-- Version: 1.1.0
-- Type: auto
-- Risk: low
-- Date: 2026-04-26
-- Description: Add audit log table for tracking user actions
-- Author: developer@example.com

BEGIN;

-- Your SQL statements here
CREATE TABLE IF NOT EXISTS webauth.audit_log (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
```

## Creating New Migrations

Use the migration creation script:

```bash
npm run migration:create -- --type auto --risk low --name "add_audit_table"
```

This will generate a properly named migration file with the correct template.

## Migration Execution

- Migrations are executed in order by version number
- Each migration runs in a transaction (BEGIN/COMMIT)
- Failed migrations trigger automatic rollback
- Executed migrations are tracked in `webauth.schema_migrations` table
- Migrations are never re-executed (checksum validation)

## Best Practices

1. Always use `IF NOT EXISTS` for CREATE statements
2. Always use `IF EXISTS` for DROP statements
3. Test migrations on a copy of production database first
4. For data migrations, include verification queries
5. Keep migrations small and focused
6. Document why the migration is needed
7. For MANUAL migrations, include warnings about risks
8. Consider adding rollback instructions in comments
