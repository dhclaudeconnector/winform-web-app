# Hệ thống phân quyền chi tiết

## Tổng quan

Hệ thống phân quyền được thiết kế để:
- Phân quyền chi tiết đến từng chức năng/module cho từng user
- Cảnh báo khi user không đủ quyền truy cập
- Tổ chức menu "Thường dùng" riêng cho từng user
- Dữ liệu phân quyền lưu riêng trong schema `webauth`, không ảnh hưởng bảng `current.dmnhanvien`

## Kiến trúc

### Database Schema: `webauth`

```
webauth.roles                 → Vai trò (ADMIN, DOCTOR, NURSE, ...)
webauth.modules               → Danh sách module/chức năng
webauth.permissions           → Quyền hạn chi tiết (VIEW, CREATE, EDIT, DELETE, PRINT, EXPORT)
webauth.user_roles            → Gán vai trò cho user
webauth.role_permissions      → Quyền của vai trò
webauth.user_permissions      → Quyền riêng của user (override role)
webauth.user_favorites        → Menu thường dùng
```

### Backend Architecture

```
repositories/
  ├── permissionRepository.js  → Truy vấn permissions
  ├── roleRepository.js        → Quản lý roles
  └── moduleRepository.js      → Quản lý modules

services/
  └── permissionService.js     → Logic nghiệp vụ + cache (5 phút)

middleware/
  └── permissionMiddleware.js  → Kiểm tra quyền trên routes

routes/
  ├── permission.routes.js     → API endpoints cho user
  └── admin/roles.routes.js    → API endpoints cho admin

controllers/
  ├── permissionController.js
  └── admin/roleController.js
```

### Frontend Architecture

```
lib/
  ├── store/permissionStore.ts     → Zustand store quản lý permissions
  ├── hooks/usePermission.ts       → Hook kiểm tra quyền
  └── api/permissionService.ts     → API client

components/
  ├── common/
  │   ├── PermissionGuard.tsx      → Wrapper component ẩn/hiện theo quyền
  │   ├── UnauthorizedAlert.tsx    → Alert khi không đủ quyền
  │   └── CrudToolbar.tsx          → Toolbar tự động check quyền
  └── layout/
      └── SidebarExplorer.tsx      → Sidebar với "Thường dùng" + filter theo quyền
```

## API Endpoints

### User Endpoints

```
GET    /api/permissions/my-permissions      → Lấy tất cả quyền của user hiện tại
GET    /api/permissions/my-modules          → Lấy danh sách module được phép truy cập
GET    /api/permissions/my-favorites        → Lấy menu thường dùng
POST   /api/permissions/favorites/:moduleCode → Thêm vào thường dùng
DELETE /api/permissions/favorites/:moduleCode → Xóa khỏi thường dùng
POST   /api/permissions/check               → Kiểm tra quyền cụ thể
```

### Admin Endpoints

```
GET    /api/admin/roles                     → Danh sách vai trò
GET    /api/admin/roles/:id/permissions     → Quyền của vai trò
POST   /api/admin/users/:username/roles     → Gán vai trò cho user
DELETE /api/admin/users/:username/roles/:id → Xóa vai trò
POST   /api/admin/users/:username/permissions → Gán quyền riêng
```

## Cách sử dụng

### 1. Kiểm tra quyền trong component

```typescript
import { PermissionGuard } from '@/components/common/PermissionGuard'

function UsersModule() {
  return (
    <>
      <PermissionGuard module="users" action="CREATE">
        <Button onClick={handleAdd}>Thêm</Button>
      </PermissionGuard>

      <PermissionGuard module="users" action="EDIT">
        <Button onClick={handleEdit}>Sửa</Button>
      </PermissionGuard>

      <PermissionGuard module="users" action="DELETE">
        <Button onClick={handleDelete}>Xóa</Button>
      </PermissionGuard>
    </>
  )
}
```

### 2. Sử dụng hook

```typescript
import { usePermission } from '@/lib/hooks/usePermission'

function MyComponent() {
  const { hasPermission } = usePermission('users', 'CREATE')

  if (!hasPermission) {
    return <div>Bạn không có quyền truy cập</div>
  }

  return <div>Nội dung...</div>
}
```

### 3. Sử dụng CrudToolbar với auto permission check

```typescript
<CrudToolbar
  module="users"  // Tự động check quyền theo module
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onPrint={handlePrint}
  onExportExcel={handleExport}
/>
```

### 4. Bảo vệ route trên backend

```javascript
import { requirePermission } from '../middleware/permissionMiddleware.js'

router.post('/users',
  authenticate,
  requirePermission('users', 'CREATE'),
  userController.create
)

router.put('/users/:id',
  authenticate,
  requirePermission('users', 'EDIT'),
  userController.update
)

router.delete('/users/:id',
  authenticate,
  requirePermission('users', 'DELETE'),
  userController.delete
)
```

## Các loại quyền

Mỗi module có 6 loại quyền chuẩn:

- **VIEW**: Xem danh sách và chi tiết
- **CREATE**: Thêm mới
- **EDIT**: Chỉnh sửa
- **DELETE**: Xóa
- **PRINT**: In ấn
- **EXPORT**: Xuất Excel

## Vai trò mặc định

Hệ thống có 5 vai trò mặc định:

1. **ADMIN** - Quản trị viên: Toàn quyền hệ thống
2. **DOCTOR** - Bác sĩ: Quản lý khám bệnh và hồ sơ
3. **NURSE** - Điều dưỡng: Hỗ trợ khám bệnh
4. **RECEPTIONIST** - Lễ tân: Tiếp nhận bệnh nhân
5. **ACCOUNTANT** - Kế toán: Quản lý tài chính

## Module mặc định

Hệ thống có 6 module mặc định:

1. **users** - Quản lý người dùng
2. **departments** - Quản lý khoa phòng
3. **patients** - Quản lý bệnh nhân
4. **doctors** - Quản lý bác sĩ
5. **appointments** - Quản lý lịch hẹn
6. **medical-records** - Hồ sơ bệnh án

## Thêm module mới

Khi thêm module mới vào hệ thống:

### 1. Thêm vào database

```sql
-- Thêm module
INSERT INTO webauth.modules (code, name, section, route, sort_order)
VALUES ('new-module', 'Module mới', 'Section', '/new-module', 10);

-- Thêm permissions cho module
INSERT INTO webauth.permissions (module_id, code, name)
SELECT id, 'VIEW', 'Xem' FROM webauth.modules WHERE code = 'new-module'
UNION ALL
SELECT id, 'CREATE', 'Thêm' FROM webauth.modules WHERE code = 'new-module'
UNION ALL
SELECT id, 'EDIT', 'Sửa' FROM webauth.modules WHERE code = 'new-module'
UNION ALL
SELECT id, 'DELETE', 'Xóa' FROM webauth.modules WHERE code = 'new-module'
UNION ALL
SELECT id, 'PRINT', 'In' FROM webauth.modules WHERE code = 'new-module'
UNION ALL
SELECT id, 'EXPORT', 'Xuất Excel' FROM webauth.modules WHERE code = 'new-module';

-- Gán quyền cho role ADMIN
INSERT INTO webauth.role_permissions (role_id, permission_id, granted)
SELECT
    (SELECT id FROM webauth.roles WHERE code = 'ADMIN'),
    p.id,
    true
FROM webauth.permissions p
JOIN webauth.modules m ON p.module_id = m.id
WHERE m.code = 'new-module';
```

### 2. Tạo component

```typescript
// frontend/src/components/modules/NewModule.tsx
import { CrudToolbar } from '@/components/common/CrudToolbar'

export function NewModule() {
  return (
    <div>
      <CrudToolbar
        module="new-module"  // Module code từ database
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {/* Nội dung module */}
    </div>
  )
}
```

### 3. Thêm vào appConfig

```typescript
// frontend/src/config/appConfig.ts
export const APP_CONFIG = {
  modules: [
    // ... existing modules
    {
      id: 'new-module',
      name: 'Module mới',
      route: '/new-module',
      section: 'Section',
      icon: 'FileText',
    },
  ],
}
```

### 4. Logout và login lại

User cần logout và login lại để load permissions mới.

## Quản lý quyền

### Gán vai trò cho user

```sql
INSERT INTO webauth.user_roles (username, role_id, assigned_by)
VALUES ('username', (SELECT id FROM webauth.roles WHERE code = 'DOCTOR'), 'admin');
```

### Gán quyền riêng cho user (override role)

```sql
-- Cho phép user xem module users (dù role không có quyền)
INSERT INTO webauth.user_permissions (username, permission_id, granted)
VALUES (
    'username',
    (SELECT p.id FROM webauth.permissions p
     JOIN webauth.modules m ON p.module_id = m.id
     WHERE m.code = 'users' AND p.code = 'VIEW'),
    true
);

-- Cấm user xóa bệnh nhân (dù role có quyền)
INSERT INTO webauth.user_permissions (username, permission_id, granted)
VALUES (
    'username',
    (SELECT p.id FROM webauth.permissions p
     JOIN webauth.modules m ON p.module_id = m.id
     WHERE m.code = 'patients' AND p.code = 'DELETE'),
    false
);
```

### Xem quyền của user

```sql
SELECT * FROM webauth.get_user_permissions('username');
```

## Performance

### Backend Cache

- Permissions được cache trong memory với TTL 5 phút
- Cache tự động clear khi có thay đổi quyền
- Sử dụng `permissionService.clearUserCache(username)` để clear cache thủ công

### Frontend Cache

- Permissions được lưu trong Zustand store
- Load một lần khi login
- Tự động clear khi logout
- Có thể reload bằng `permissionStore.loadPermissions()`

## Troubleshooting

### User không thấy menu

**Nguyên nhân:** User chưa có role hoặc role không có quyền

**Giải pháp:**
1. Kiểm tra: `SELECT * FROM webauth.user_roles WHERE username = 'username'`
2. Nếu không có → Gán role
3. Logout và login lại

### Thay đổi quyền không có hiệu lực

**Nguyên nhân:** Cache chưa được clear

**Giải pháp:**
1. Backend: Restart container hoặc đợi 5 phút
2. Frontend: Logout và login lại

### Module mới không hiển thị

**Nguyên nhân:** Chưa insert vào database hoặc chưa gán quyền

**Giải pháp:**
1. Kiểm tra module đã có trong `webauth.modules`
2. Kiểm tra permissions đã được tạo
3. Kiểm tra role đã được gán permissions
4. Logout và login lại

## Files quan trọng

### Database
- `backend/scripts/init-permissions.sql` - Migration script
- `QUICK-FIX-htnoanh.sql` - Gán role ADMIN
- `VERIFY-SYSTEM.sql` - Kiểm tra hệ thống

### Backend
- `backend/src/repositories/permissionRepository.js`
- `backend/src/services/permissionService.js`
- `backend/src/middleware/permissionMiddleware.js`
- `backend/src/routes/permission.routes.js`

### Frontend
- `frontend/src/lib/store/permissionStore.ts`
- `frontend/src/lib/hooks/usePermission.ts`
- `frontend/src/components/common/PermissionGuard.tsx`
- `frontend/src/components/layout/SidebarExplorer.tsx`

## Liên hệ

Nếu có vấn đề, xem file `CHECKLIST.md` hoặc chạy `START-HERE.bat`
