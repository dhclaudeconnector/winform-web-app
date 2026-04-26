-- =====================================================
-- THÊM 2 MODULE QUẢN LÝ PHÂN QUYỀN
-- Chạy script này sau khi đã chạy init-permissions.sql
-- =====================================================

-- Thêm 2 modules mới
INSERT INTO webauth.modules (code, name, description, section, route, sort_order, is_active)
VALUES
  ('role-management', 'Quản lý vai trò', 'Quản lý vai trò và phân quyền cho vai trò', 'Quản trị hệ thống', '/role-management', 7, true),
  ('user-permissions', 'Phân quyền người dùng', 'Gán vai trò và quyền cho người dùng', 'Quản trị hệ thống', '/user-permissions', 8, true)
ON CONFLICT (code) DO NOTHING;

-- Thêm permissions cho module role-management
INSERT INTO webauth.permissions (module_id, code, name, description)
SELECT id, 'VIEW', 'Xem', 'Xem danh sách vai trò' FROM webauth.modules WHERE code = 'role-management'
UNION ALL
SELECT id, 'CREATE', 'Thêm', 'Thêm vai trò mới' FROM webauth.modules WHERE code = 'role-management'
UNION ALL
SELECT id, 'EDIT', 'Sửa', 'Sửa vai trò và phân quyền' FROM webauth.modules WHERE code = 'role-management'
UNION ALL
SELECT id, 'DELETE', 'Xóa', 'Xóa vai trò' FROM webauth.modules WHERE code = 'role-management'
UNION ALL
SELECT id, 'PRINT', 'In', 'In danh sách vai trò' FROM webauth.modules WHERE code = 'role-management'
UNION ALL
SELECT id, 'EXPORT', 'Xuất Excel', 'Xuất danh sách vai trò' FROM webauth.modules WHERE code = 'role-management'
ON CONFLICT (module_id, code) DO NOTHING;

-- Thêm permissions cho module user-permissions
INSERT INTO webauth.permissions (module_id, code, name, description)
SELECT id, 'VIEW', 'Xem', 'Xem phân quyền người dùng' FROM webauth.modules WHERE code = 'user-permissions'
UNION ALL
SELECT id, 'CREATE', 'Thêm', 'Gán quyền cho người dùng' FROM webauth.modules WHERE code = 'user-permissions'
UNION ALL
SELECT id, 'EDIT', 'Sửa', 'Sửa quyền người dùng' FROM webauth.modules WHERE code = 'user-permissions'
UNION ALL
SELECT id, 'DELETE', 'Xóa', 'Xóa quyền người dùng' FROM webauth.modules WHERE code = 'user-permissions'
UNION ALL
SELECT id, 'PRINT', 'In', 'In danh sách phân quyền' FROM webauth.modules WHERE code = 'user-permissions'
UNION ALL
SELECT id, 'EXPORT', 'Xuất Excel', 'Xuất danh sách phân quyền' FROM webauth.modules WHERE code = 'user-permissions'
ON CONFLICT (module_id, code) DO NOTHING;

-- Gán tất cả quyền của 2 modules mới cho role ADMIN
INSERT INTO webauth.role_permissions (role_id, permission_id, granted)
SELECT
    (SELECT id FROM webauth.roles WHERE code = 'ADMIN'),
    p.id,
    true
FROM webauth.permissions p
JOIN webauth.modules m ON p.module_id = m.id
WHERE m.code IN ('role-management', 'user-permissions')
ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;

-- Kiểm tra kết quả
SELECT
    m.code as module_code,
    m.name as module_name,
    COUNT(p.id) as total_permissions
FROM webauth.modules m
LEFT JOIN webauth.permissions p ON m.id = p.module_id
WHERE m.code IN ('role-management', 'user-permissions')
GROUP BY m.code, m.name;

-- Kiểm tra role ADMIN có quyền mới chưa
SELECT
    r.code as role_code,
    m.code as module_code,
    p.code as permission_code,
    rp.granted
FROM webauth.role_permissions rp
JOIN webauth.roles r ON rp.role_id = r.id
JOIN webauth.permissions p ON rp.permission_id = p.id
JOIN webauth.modules m ON p.module_id = m.id
WHERE r.code = 'ADMIN' AND m.code IN ('role-management', 'user-permissions')
ORDER BY m.code, p.code;

-- =====================================================
-- KẾT QUẢ MONG ĐỢI:
-- =====================================================
-- 2 modules mới được tạo
-- Mỗi module có 6 permissions (VIEW, CREATE, EDIT, DELETE, PRINT, EXPORT)
-- Role ADMIN có tất cả 12 permissions mới (6 x 2 modules)
--
-- SAU ĐÓ:
-- 1. LOGOUT và LOGIN lại
-- 2. Sidebar sẽ hiển thị thêm 2 modules mới trong section "Quản trị hệ thống":
--    - Quản lý vai trò
--    - Phân quyền người dùng
-- =====================================================
