-- =====================================================
-- Hệ thống phân quyền chi tiết và menu thường dùng
-- Schema: webauth
-- Created: 2026-04-26
-- =====================================================

-- Tạo schema webauth
CREATE SCHEMA IF NOT EXISTS webauth;

-- =====================================================
-- 1. Bảng roles - Vai trò hệ thống
-- =====================================================
CREATE TABLE webauth.roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE webauth.roles IS 'Vai trò hệ thống (Admin, Doctor, Nurse, etc.)';

-- =====================================================
-- 2. Bảng modules - Danh sách module/chức năng
-- =====================================================
CREATE TABLE webauth.modules (
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

COMMENT ON TABLE webauth.modules IS 'Danh sách module/chức năng trong hệ thống';

-- =====================================================
-- 3. Bảng permissions - Quyền hạn chi tiết
-- =====================================================
CREATE TABLE webauth.permissions (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES webauth.modules(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(module_id, code)
);

COMMENT ON TABLE webauth.permissions IS 'Quyền hạn chi tiết cho từng module (VIEW, CREATE, EDIT, DELETE, PRINT, EXPORT)';

-- =====================================================
-- 4. Bảng user_roles - Gán vai trò cho user
-- =====================================================
CREATE TABLE webauth.user_roles (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) REFERENCES current.dmnhanvien(taikhoan) ON DELETE CASCADE,
  role_id INTEGER REFERENCES webauth.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by VARCHAR(50),
  UNIQUE(username, role_id)
);

COMMENT ON TABLE webauth.user_roles IS 'Gán vai trò cho user';

-- =====================================================
-- 5. Bảng role_permissions - Quyền của vai trò
-- =====================================================
CREATE TABLE webauth.role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES webauth.roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES webauth.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE webauth.role_permissions IS 'Quyền của vai trò';

-- =====================================================
-- 6. Bảng user_permissions - Quyền riêng của user
-- =====================================================
CREATE TABLE webauth.user_permissions (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) REFERENCES current.dmnhanvien(taikhoan) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES webauth.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(username, permission_id)
);

COMMENT ON TABLE webauth.user_permissions IS 'Quyền riêng của user (override role)';

-- =====================================================
-- 7. Bảng user_favorites - Menu thường dùng
-- =====================================================
CREATE TABLE webauth.user_favorites (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) REFERENCES current.dmnhanvien(taikhoan) ON DELETE CASCADE,
  module_id INTEGER REFERENCES webauth.modules(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(username, module_id)
);

COMMENT ON TABLE webauth.user_favorites IS 'Menu thường dùng của user';

-- =====================================================
-- Dữ liệu mẫu: Roles
-- =====================================================
INSERT INTO webauth.roles (code, name, description) VALUES
('ADMIN', 'Quản trị viên', 'Toàn quyền hệ thống'),
('DOCTOR', 'Bác sĩ', 'Quản lý khám bệnh và hồ sơ'),
('NURSE', 'Điều dưỡng', 'Hỗ trợ khám bệnh'),
('RECEPTIONIST', 'Lễ tân', 'Tiếp nhận bệnh nhân'),
('ACCOUNTANT', 'Kế toán', 'Quản lý tài chính');

-- =====================================================
-- Dữ liệu mẫu: Modules
-- =====================================================
INSERT INTO webauth.modules (code, name, section, route, sort_order) VALUES
('users', 'Quản lý người dùng', 'Quản trị hệ thống', '/users', 1),
('departments', 'Quản lý khoa phòng', 'Quản trị hệ thống', '/departments', 2),
('patients', 'Quản lý bệnh nhân', 'Quản lý khám bệnh', '/patients', 3),
('doctors', 'Quản lý bác sĩ', 'Quản lý khám bệnh', '/doctors', 4),
('appointments', 'Quản lý lịch hẹn', 'Quản lý khám bệnh', '/appointments', 5),
('medical-records', 'Hồ sơ bệnh án', 'Hồ sơ y tế', '/medical-records', 6);

-- =====================================================
-- Dữ liệu mẫu: Permissions (CRUD chuẩn cho mỗi module)
-- =====================================================
DO $$
DECLARE
  module_record RECORD;
  permission_codes TEXT[] := ARRAY['VIEW', 'CREATE', 'EDIT', 'DELETE', 'PRINT', 'EXPORT'];
  permission_names TEXT[] := ARRAY['Xem', 'Thêm mới', 'Sửa', 'Xóa', 'In', 'Xuất Excel'];
  i INTEGER;
BEGIN
  FOR module_record IN SELECT id, code, name FROM webauth.modules LOOP
    FOR i IN 1..array_length(permission_codes, 1) LOOP
      INSERT INTO webauth.permissions (module_id, code, name, description)
      VALUES (
        module_record.id,
        permission_codes[i],
        permission_names[i],
        permission_names[i] || ' ' || module_record.name
      );
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- Dữ liệu mẫu: Gán toàn quyền cho role ADMIN
-- =====================================================
INSERT INTO webauth.role_permissions (role_id, permission_id, granted)
SELECT
  (SELECT id FROM webauth.roles WHERE code = 'ADMIN'),
  id,
  true
FROM webauth.permissions;

-- =====================================================
-- Dữ liệu mẫu: Gán quyền cho role DOCTOR
-- =====================================================
INSERT INTO webauth.role_permissions (role_id, permission_id, granted)
SELECT
  (SELECT id FROM webauth.roles WHERE code = 'DOCTOR'),
  p.id,
  true
FROM webauth.permissions p
JOIN webauth.modules m ON p.module_id = m.id
WHERE m.code IN ('patients', 'appointments', 'medical-records')
  AND p.code IN ('VIEW', 'CREATE', 'EDIT', 'PRINT');

-- =====================================================
-- Dữ liệu mẫu: Gán quyền cho role NURSE
-- =====================================================
INSERT INTO webauth.role_permissions (role_id, permission_id, granted)
SELECT
  (SELECT id FROM webauth.roles WHERE code = 'NURSE'),
  p.id,
  true
FROM webauth.permissions p
JOIN webauth.modules m ON p.module_id = m.id
WHERE m.code IN ('patients', 'appointments')
  AND p.code IN ('VIEW', 'EDIT');

-- =====================================================
-- Dữ liệu mẫu: Gán quyền cho role RECEPTIONIST
-- =====================================================
INSERT INTO webauth.role_permissions (role_id, permission_id, granted)
SELECT
  (SELECT id FROM webauth.roles WHERE code = 'RECEPTIONIST'),
  p.id,
  true
FROM webauth.permissions p
JOIN webauth.modules m ON p.module_id = m.id
WHERE m.code IN ('patients', 'appointments')
  AND p.code IN ('VIEW', 'CREATE', 'EDIT');

-- =====================================================
-- Indexes để tối ưu performance
-- =====================================================
CREATE INDEX idx_user_roles_username ON webauth.user_roles(username);
CREATE INDEX idx_user_permissions_username ON webauth.user_permissions(username);
CREATE INDEX idx_user_favorites_username ON webauth.user_favorites(username);
CREATE INDEX idx_role_permissions_role_id ON webauth.role_permissions(role_id);
CREATE INDEX idx_permissions_module_id ON webauth.permissions(module_id);
CREATE INDEX idx_modules_code ON webauth.modules(code);
CREATE INDEX idx_modules_section ON webauth.modules(section);

-- =====================================================
-- Function: Lấy tất cả quyền của user
-- =====================================================
CREATE OR REPLACE FUNCTION webauth.get_user_permissions(p_username VARCHAR)
RETURNS TABLE (
  module_code VARCHAR,
  permission_code VARCHAR,
  granted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH role_perms AS (
    -- Quyền từ roles
    SELECT
      m.code AS module_code,
      p.code AS permission_code,
      rp.granted
    FROM webauth.user_roles ur
    JOIN webauth.role_permissions rp ON ur.role_id = rp.role_id
    JOIN webauth.permissions p ON rp.permission_id = p.id
    JOIN webauth.modules m ON p.module_id = m.id
    WHERE ur.username = p_username
      AND m.is_active = true
  ),
  user_perms AS (
    -- Quyền riêng của user (override)
    SELECT
      m.code AS module_code,
      p.code AS permission_code,
      up.granted
    FROM webauth.user_permissions up
    JOIN webauth.permissions p ON up.permission_id = p.id
    JOIN webauth.modules m ON p.module_id = m.id
    WHERE up.username = p_username
      AND m.is_active = true
  )
  -- Kết hợp: user_perms override role_perms
  SELECT
    COALESCE(u.module_code, r.module_code) AS module_code,
    COALESCE(u.permission_code, r.permission_code) AS permission_code,
    COALESCE(u.granted, r.granted) AS granted
  FROM role_perms r
  FULL OUTER JOIN user_perms u
    ON r.module_code = u.module_code
    AND r.permission_code = u.permission_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Kiểm tra quyền cụ thể
-- =====================================================
CREATE OR REPLACE FUNCTION webauth.check_permission(
  p_username VARCHAR,
  p_module_code VARCHAR,
  p_permission_code VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT granted INTO has_permission
  FROM webauth.get_user_permissions(p_username)
  WHERE module_code = p_module_code
    AND permission_code = p_permission_code
  LIMIT 1;

  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Hoàn tất
-- =====================================================
COMMENT ON SCHEMA webauth IS 'Schema chứa hệ thống phân quyền và menu thường dùng';

-- Hiển thị thống kê
SELECT 'Roles' AS table_name, COUNT(*) AS count FROM webauth.roles
UNION ALL
SELECT 'Modules', COUNT(*) FROM webauth.modules
UNION ALL
SELECT 'Permissions', COUNT(*) FROM webauth.permissions
UNION ALL
SELECT 'Role Permissions', COUNT(*) FROM webauth.role_permissions;
