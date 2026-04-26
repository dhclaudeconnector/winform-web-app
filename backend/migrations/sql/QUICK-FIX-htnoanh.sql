-- =====================================================
-- SCRIPT NHANH: GÁN ROLE ADMIN CHO USER htnoanh
-- Chạy script này trong pgAdmin hoặc psql
-- =====================================================

-- Bước 1: Kiểm tra schema webauth có tồn tại không
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'webauth') THEN
        RAISE EXCEPTION 'Schema webauth không tồn tại! Vui lòng chạy migration script trước: backend/scripts/init-permissions.sql';
    END IF;
    RAISE NOTICE 'OK: Schema webauth đã tồn tại';
END $$;

-- Bước 2: Gán role ADMIN cho user htnoanh
INSERT INTO webauth.user_roles (username, role_id, assigned_by)
VALUES ('htnoanh', (SELECT id FROM webauth.roles WHERE code = 'ADMIN'), 'system')
ON CONFLICT (username, role_id) DO NOTHING;

-- Bước 3: Kiểm tra kết quả
SELECT
    ur.username,
    r.code as role_code,
    r.name as role_name,
    COUNT(rp.permission_id) as total_permissions
FROM webauth.user_roles ur
JOIN webauth.roles r ON ur.role_id = r.id
LEFT JOIN webauth.role_permissions rp ON r.id = rp.role_id AND rp.granted = true
WHERE ur.username = 'htnoanh'
GROUP BY ur.username, r.code, r.name;

-- Bước 4: Xem chi tiết quyền
SELECT
    module_code,
    permission_code,
    granted
FROM webauth.get_user_permissions('htnoanh')
WHERE granted = true
ORDER BY module_code, permission_code;

-- =====================================================
-- KẾT QUẢ MONG ĐỢI:
-- =====================================================
-- username | role_code | role_name      | total_permissions
-- ---------|-----------|----------------|------------------
-- htnoanh  | ADMIN     | Quản trị viên  | 36
--
-- SAU ĐÓ:
-- 1. LOGOUT khỏi ứng dụng
-- 2. LOGIN lại với user "htnoanh"
-- 3. Sidebar sẽ hiển thị 6 modules:
--    - Quản lý người dùng
--    - Quản lý khoa phòng
--    - Quản lý bệnh nhân
--    - Quản lý bác sĩ
--    - Quản lý lịch hẹn
--    - Hồ sơ bệnh án
-- =====================================================
