-- =====================================================
-- SCRIPT KIỂM TRA TOÀN BỘ HỆ THỐNG PHÂN QUYỀN
-- Chạy script này để kiểm tra trạng thái hiện tại
-- =====================================================

-- 1. Kiểm tra schema webauth
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'webauth')
        THEN '✓ Schema webauth đã tồn tại'
        ELSE '✗ Schema webauth CHƯA tồn tại - Cần chạy init-permissions.sql'
    END as status;

-- 2. Kiểm tra các bảng
SELECT
    table_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'webauth' AND table_name = t.table_name
        )
        THEN '✓ Đã tạo'
        ELSE '✗ Chưa tạo'
    END as status
FROM (
    VALUES
        ('roles'),
        ('modules'),
        ('permissions'),
        ('user_roles'),
        ('role_permissions'),
        ('user_permissions'),
        ('user_favorites')
) AS t(table_name);

-- 3. Kiểm tra dữ liệu roles
SELECT
    '3. ROLES' as section,
    COUNT(*) as total,
    STRING_AGG(code, ', ') as role_codes
FROM webauth.roles
WHERE is_active = true;

-- 4. Kiểm tra dữ liệu modules
SELECT
    '4. MODULES' as section,
    COUNT(*) as total,
    STRING_AGG(code, ', ') as module_codes
FROM webauth.modules
WHERE is_active = true;

-- 5. Kiểm tra dữ liệu permissions
SELECT
    '5. PERMISSIONS' as section,
    COUNT(*) as total
FROM webauth.permissions;

-- 6. Kiểm tra user htnoanh
SELECT
    '6. USER htnoanh' as section,
    CASE
        WHEN EXISTS (SELECT 1 FROM webauth.user_roles WHERE username = 'htnoanh')
        THEN '✓ Đã có role'
        ELSE '✗ CHƯA có role - Cần chạy QUICK-FIX-htnoanh.sql'
    END as status;

-- 7. Chi tiết quyền của user htnoanh (nếu có)
SELECT
    '7. CHI TIẾT QUYỀN htnoanh' as section,
    ur.username,
    r.code as role_code,
    r.name as role_name,
    COUNT(rp.permission_id) as total_permissions
FROM webauth.user_roles ur
JOIN webauth.roles r ON ur.role_id = r.id
LEFT JOIN webauth.role_permissions rp ON r.id = rp.role_id AND rp.granted = true
WHERE ur.username = 'htnoanh'
GROUP BY ur.username, r.code, r.name;

-- 8. Danh sách modules user htnoanh có quyền VIEW
SELECT
    '8. MODULES CÓ QUYỀN VIEW' as section,
    m.code as module_code,
    m.name as module_name,
    m.route
FROM webauth.get_user_permissions('htnoanh') up
JOIN webauth.permissions p ON up.permission_code = p.code
JOIN webauth.modules m ON p.module_id = m.id
WHERE up.granted = true AND p.code = 'VIEW'
ORDER BY m.sort_order;

-- =====================================================
-- HƯỚNG DẪN ĐỌC KẾT QUẢ:
-- =====================================================
--
-- Nếu thấy "✗ Schema webauth CHƯA tồn tại":
--   → Chạy: backend/scripts/init-permissions.sql
--
-- Nếu thấy "✗ CHƯA có role" cho user htnoanh:
--   → Chạy: QUICK-FIX-htnoanh.sql
--
-- Nếu total_permissions = 36 và có 6 modules:
--   → Hệ thống OK, cần LOGOUT và LOGIN lại
--
-- Nếu vẫn không thấy menu sau khi login:
--   → Kiểm tra browser console (F12) xem có lỗi API không
--   → Clear browser cache (Ctrl + Shift + R)
--
-- =====================================================
