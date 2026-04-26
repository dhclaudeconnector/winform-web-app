-- Migration: 001_auto_low_init_permissions
-- Version: 1.0.0
-- Type: auto
-- Risk: low
-- Date: 2026-04-26
-- Description: Initialize permission system schema and tables
-- Author: system

BEGIN;

-- Create schema
CREATE SCHEMA IF NOT EXISTS webauth;

-- Roles table
CREATE TABLE IF NOT EXISTS webauth.roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modules table
CREATE TABLE IF NOT EXISTS webauth.modules (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES webauth.modules(id),
  section VARCHAR(100),
  icon VARCHAR(50),
  route VARCHAR(200),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS webauth.permissions (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES webauth.modules(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(module_id, code)
);

-- User roles table
CREATE TABLE IF NOT EXISTS webauth.user_roles (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) REFERENCES current.dmnhanvien(taikhoan) ON DELETE CASCADE,
  role_id INTEGER REFERENCES webauth.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by VARCHAR(50),
  UNIQUE(username, role_id)
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS webauth.role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES webauth.roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES webauth.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  UNIQUE(role_id, permission_id)
);

-- User permissions table
CREATE TABLE IF NOT EXISTS webauth.user_permissions (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) REFERENCES current.dmnhanvien(taikhoan) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES webauth.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(username, permission_id)
);

-- User favorites table
CREATE TABLE IF NOT EXISTS webauth.user_favorites (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) REFERENCES current.dmnhanvien(taikhoan) ON DELETE CASCADE,
  module_id INTEGER REFERENCES webauth.modules(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(username, module_id)
);

-- Schema migrations table
CREATE TABLE IF NOT EXISTS webauth.schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  migration_type VARCHAR(20) NOT NULL,
  risk_level VARCHAR(20) DEFAULT 'low',
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by VARCHAR(50),
  checksum VARCHAR(64),
  execution_time_ms INTEGER,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT
);

-- Comments
COMMENT ON SCHEMA webauth IS 'Schema for authentication and permission system';
COMMENT ON TABLE webauth.roles IS 'System roles (Admin, Doctor, Nurse, etc.)';
COMMENT ON TABLE webauth.modules IS 'System modules and features';
COMMENT ON TABLE webauth.permissions IS 'Detailed permissions for each module';
COMMENT ON TABLE webauth.user_roles IS 'User role assignments';
COMMENT ON TABLE webauth.role_permissions IS 'Role permission mappings';
COMMENT ON TABLE webauth.user_permissions IS 'User-specific permission overrides';
COMMENT ON TABLE webauth.user_favorites IS 'User favorite menus';
COMMENT ON TABLE webauth.schema_migrations IS 'Database migration tracking';

COMMIT;
