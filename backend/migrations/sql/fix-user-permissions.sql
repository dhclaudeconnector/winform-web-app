-- =====================================================
-- KIỂM TRA VÀ GÁN QUYỀN CHO USER
-- =====================================================

-- Bước 1: Kiểm tra schema webauth đã tồn tại chưa
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'webauth';
-- Nếu không có kết quả → Cần chạy migration script trước!

-- Bước 2: Kiểm tra user htnoanh có role chưa
SELECT ur.username, r.code, r.name
FROM webauth.user_roles ur
JOIN webauth.roles r ON ur.role_id = r.id
WHERE ur.username = 'htnoanh';
-- Nếu không có kết quả → User chưa có role

-- Bước 3: Xem tất cả roles có sẵn
SELECT id, code, name, description FROM webauth.roles;

-- Bước 4: GÁN ROLE CHO USER htnoanh
-- Chọn 1 trong các lệnh sau:

-- Option 1: Gán role ADMIN (toàn quyền)
INSERT INTO webauth.user_roles (username, role_id, assigned_by)
VALUES ('htnoanh', (SELECT id FROM webauth.roles WHERE code = 'ADMIN'), 'system')
ON CONFLICT (username, role_id) DO NOTHING;

-- Option 2: Gán role DOCTOR (bệnh nhân, lịch hẹn, hồ sơ)
INSERT INTO webauth.user_roles (username, role_id, assigned_by)
VALUES ('htnoanh', (SELECT id FROM webauth.roles WHERE code = 'DOCTOR'), 'system')
ON CONFLICT (username, role_id) DO NOTHING;

-- Option 3: Gán role NURSE (xem và sửa bệnh nhân, lịch hẹn)
INSERT INTO webauth.user_roles (username, role_id, assigned_by)
VALUES ('htnoanh', (SELECT id FROM webauth.roles WHERE code = 'NURSE'), 'system')
ON CONFLICT (username, role_id) DO NOTHING;

-- Bước 5: Kiểm tra lại sau khi gán
SELECT ur.username, r.code, r.name, COUNT(rp.permission_id) as total_permissions
FROM webauth.user_roles ur
JOIN webauth.roles r ON ur.role_id = r.id
LEFT JOIN webauth.role_permissions rp ON r.id = rp.role_id AND rp.granted = true
WHERE ur.username = 'htnoanh'
GROUP BY ur.username, r.code, r.name;

-- Bước 6: Xem chi tiết quyền của user
SELECT * FROM webauth.get_user_permissions('htnoanh');

-- Bước 7: Sau khi gán xong, LOGOUT và LOGIN lại để load permissions mới!
