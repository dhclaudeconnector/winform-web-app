# Hướng dẫn triển khai hệ thống phân quyền

## Bước 1: Chạy migration script

Kết nối vào PostgreSQL và chạy script khởi tạo:

```bash
psql -U postgres -d your_database -f backend/scripts/init-permissions.sql
```

Script này sẽ:
- Tạo schema `webauth`
- Tạo các bảng: roles, modules, permissions, user_roles, role_permissions, user_permissions, user_favorites
- Insert dữ liệu mẫu: 5 roles, 6 modules, 36 permissions
- Gán toàn quyền cho role ADMIN
- Tạo functions: `get_user_permissions()`, `check_permission()`

## Bước 2: Cài đặt dependencies (nếu cần)

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Bước 3: Khởi động server

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Bước 4: Gán quyền cho user

### Cách 1: Qua SQL

```sql
-- Gán role ADMIN cho user 'admin'
INSERT INTO webauth.user_roles (username, role_id, assigned_by)
VALUES ('admin', (SELECT id FROM webauth.roles WHERE code = 'ADMIN'), 'system');

-- Gán role DOCTOR cho user 'doctor1'
INSERT INTO webauth.user_roles (username, role_id, assigned_by)
VALUES ('doctor1', (SELECT id FROM webauth.roles WHERE code = 'DOCTOR'), 'admin');
```

### Cách 2: Qua API (sau khi có admin UI)

```bash
# Gán role cho user
curl -X POST http://localhost:3001/api/admin/users/doctor1/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleId": 2}'
```

## Bước 5: Test hệ thống

### Test 1: Login và xem permissions

1. Đăng nhập với user có role
2. Mở DevTools Console
3. Check `localStorage` hoặc gọi API:

```javascript
// Lấy permissions
fetch('http://localhost:3001/api/permissions/my-permissions', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(console.log)
```

### Test 2: Kiểm tra menu sidebar

- User có quyền VIEW sẽ thấy module trong sidebar
- User không có quyền sẽ không thấy module

### Test 3: Kiểm tra buttons trong module

- Mở module Users
- User có quyền CREATE → thấy button "Thêm"
- User không có quyền CREATE → không thấy button "Thêm"

### Test 4: Menu thường dùng

1. Click icon Star bên cạnh tên module
2. Module được thêm vào section "Thường dùng" ở đầu sidebar
3. Click lại để xóa khỏi thường dùng

## Cấu trúc quyền mặc định

### Roles

| Code | Name | Description |
|------|------|-------------|
| ADMIN | Quản trị viên | Toàn quyền hệ thống |
| DOCTOR | Bác sĩ | Quản lý khám bệnh và hồ sơ |
| NURSE | Điều dưỡng | Hỗ trợ khám bệnh |
| RECEPTIONIST | Lễ tân | Tiếp nhận bệnh nhân |
| ACCOUNTANT | Kế toán | Quản lý tài chính |

### Permissions cho mỗi module

- **VIEW**: Xem danh sách
- **CREATE**: Thêm mới
- **EDIT**: Sửa
- **DELETE**: Xóa
- **PRINT**: In
- **EXPORT**: Xuất Excel

### Quyền mặc định của roles

**ADMIN**: Toàn quyền tất cả modules

**DOCTOR**: 
- patients: VIEW, CREATE, EDIT, PRINT
- appointments: VIEW, CREATE, EDIT, PRINT
- medical-records: VIEW, CREATE, EDIT, PRINT

**NURSE**:
- patients: VIEW, EDIT
- appointments: VIEW, EDIT

**RECEPTIONIST**:
- patients: VIEW, CREATE, EDIT
- appointments: VIEW, CREATE, EDIT

## Sử dụng trong code

### Backend - Protect API endpoint

```javascript
import { requirePermission } from '../middleware/permissionMiddleware.js'

// Chỉ user có quyền CREATE trên module users mới được gọi
router.post('/users', 
  authenticate, 
  requirePermission('users', 'CREATE'),
  userController.create
)
```

### Frontend - Ẩn/hiện button

```tsx
import { PermissionGuard } from '@/components/common/PermissionGuard'

<PermissionGuard module="users" action="CREATE">
  <Button onClick={handleAdd}>Thêm</Button>
</PermissionGuard>
```

### Frontend - Check quyền trong logic

```tsx
import { usePermission } from '@/lib/hooks/usePermission'

function MyComponent() {
  const { hasPermission } = usePermission('users', 'DELETE')
  
  const handleDelete = () => {
    if (!hasPermission) {
      alert('Bạn không có quyền xóa')
      return
    }
    // Thực hiện xóa
  }
}
```

### Frontend - Tự động check quyền với CrudToolbar

```tsx
<CrudToolbar
  module="users"  // Thêm prop này
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onPrint={handlePrint}
  onExportExcel={handleExport}
/>
```

## Thêm module mới

### 1. Thêm vào database

```sql
-- Thêm module
INSERT INTO webauth.modules (code, name, section, route, sort_order)
VALUES ('invoices', 'Quản lý hóa đơn', 'Quản lý tài chính', '/invoices', 10);

-- Tạo permissions cho module
INSERT INTO webauth.permissions (module_id, code, name, description)
SELECT 
  (SELECT id FROM webauth.modules WHERE code = 'invoices'),
  unnest(ARRAY['VIEW', 'CREATE', 'EDIT', 'DELETE', 'PRINT', 'EXPORT']),
  unnest(ARRAY['Xem', 'Thêm mới', 'Sửa', 'Xóa', 'In', 'Xuất Excel']),
  unnest(ARRAY['Xem hóa đơn', 'Thêm hóa đơn', 'Sửa hóa đơn', 'Xóa hóa đơn', 'In hóa đơn', 'Xuất Excel hóa đơn']);
```

### 2. Gán quyền cho roles

```sql
-- Gán quyền VIEW cho role ACCOUNTANT
INSERT INTO webauth.role_permissions (role_id, permission_id, granted)
SELECT
  (SELECT id FROM webauth.roles WHERE code = 'ACCOUNTANT'),
  p.id,
  true
FROM webauth.permissions p
JOIN webauth.modules m ON p.module_id = m.id
WHERE m.code = 'invoices' AND p.code IN ('VIEW', 'CREATE', 'EDIT', 'PRINT', 'EXPORT');
```

### 3. Tạo component module

```tsx
// frontend/src/components/modules/InvoicesModule.tsx
export function InvoicesModule() {
  // Implementation
}
```

### 4. Module tự động xuất hiện trong sidebar cho users có quyền

## Troubleshooting

### User không thấy module nào

```sql
-- Kiểm tra user có role không
SELECT * FROM webauth.user_roles WHERE username = 'your_username';

-- Nếu không có, gán role
INSERT INTO webauth.user_roles (username, role_id, assigned_by)
VALUES ('your_username', (SELECT id FROM webauth.roles WHERE code = 'ADMIN'), 'system');
```

### Button không ẩn/hiện đúng

- Check console log xem permissions đã load chưa
- Verify `module` prop trong CrudToolbar đúng với module code trong database
- Clear cache: `permissionService.clearAllCache()`

### API trả về 403 Forbidden

- Verify JWT token còn hạn
- Check middleware `authenticate` đã chạy trước `requirePermission`
- Verify user có quyền trong database

## API Endpoints

### User endpoints

- `GET /api/permissions/my-permissions` - Lấy tất cả quyền
- `GET /api/permissions/my-modules` - Lấy modules được phép truy cập
- `GET /api/permissions/my-favorites` - Lấy menu thường dùng
- `POST /api/permissions/favorites/:moduleCode` - Thêm thường dùng
- `DELETE /api/permissions/favorites/:moduleCode` - Xóa thường dùng
- `POST /api/permissions/check` - Kiểm tra quyền cụ thể

### Admin endpoints (yêu cầu quyền admin)

- `GET /api/admin/roles` - Danh sách roles
- `GET /api/admin/roles/:id/permissions` - Quyền của role
- `POST /api/admin/users/:username/roles` - Gán role cho user
- `DELETE /api/admin/users/:username/roles/:roleId` - Xóa role
- `POST /api/admin/users/:username/permissions` - Gán quyền riêng
- `GET /api/admin/modules` - Danh sách modules
- `GET /api/admin/permissions` - Danh sách permissions

## Notes

- Permissions được cache 5 phút ở backend
- Frontend load permissions 1 lần khi login
- Khi thay đổi quyền, user cần logout/login lại để cập nhật
- Quyền riêng của user (user_permissions) sẽ override quyền từ role
