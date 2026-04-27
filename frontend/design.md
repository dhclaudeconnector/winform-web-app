# Frontend Design Document

Tài liệu thiết kế chi tiết các form/module trong frontend, bao gồm đường dẫn file, component sử dụng, và API backend tương ứng.

---

## 📑 MỤC LỤC

### 📦 Business Modules
| # | Module Name                | Mô tả                     | Trạng thái    | Xem chi tiết                                                                 | Mở file trong VS Code                                                                                                                                  |
|---|----------------------------|---------------------------|---------------|------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | UsersModule                | Quản lý Nhân viên         | ✅ Hoàn thiện  | [Đi đến](#1-usersmodule---quản-lý-nhân-viên)                                 | [📂 Mở file](src/components/modules/UsersModule.tsx)                                            |
| 2 | PatientsModule             | Quản lý Bệnh nhân         | ⚠️ Chưa có API | [Đi đến](#2-patientsmodule---quản-lý-bệnh-nhân)                              | [📂 Mở file](src/components/modules/PatientsModule.tsx)                                         |
| 3 | DepartmentsModule          | Quản lý Khoa phòng        | ⚠️ Chưa có API | [Đi đến](#3-departmentsmodule---quản-lý-khoa-phòng)                          | [📂 Mở file](src/components/modules/DepartmentsModule.tsx)                                      |
| 4 | RoleManagementModule       | Quản lý Vai trò           | ✅ Hoàn thiện  | [Đi đến](#4-rolemanagementmodule---quản-lý-vai-trò)                          | [📂 Mở file](src/components/modules/RoleManagementModule.tsx)                                   |
| 5 | UserPermissionModule       | Phân quyền User           | ✅ Hoàn thiện  | [Đi đến](#5-userpermissionmodule---phân-quyền-user)                          | [📂 Mở file](src/components/modules/UserPermissionModule.tsx)                                   |

---

### 🧩 Common System
| # | Phần hệ thống              | Đi đến                                                                 |
|---|----------------------------|------------------------------------------------------------------------|
| 1 | Architecture Overview      | [Đi đến](#architecture-overview)                                       |
| 2 | Common Components          | [Đi đến](#common-components)                                           |
| 3 | Common Hooks               | [Đi đến](#common-hooks)                                                |
| 4 | API Client                 | [Đi đến](#api-client)                                                  |
| 5 | Stores (Zustand)           | [Đi đến](#stores-zustand)                                              |
| 6 | Authentication & Authorization | [Đi đến](#authentication--authorization)                            |
| 7 | Naming Convention          | [Đi đến](#naming-convention)                                           |
| 8 | Print & Export Excel       | [Đi đến](#print--export-excel)                                         |
| 9 | Environment Variables      | [Đi đến](#environment-variables)                                       |
| 10 | TODO List                  | [Đi đến](#todo-list)                                                   |

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Modules"
        Users[UsersModule<br/>Quản lý Nhân viên]
        Patients[PatientsModule<br/>Quản lý Bệnh nhân]
        Departments[DepartmentsModule<br/>Quản lý Khoa phòng]
        Roles[RoleManagementModule<br/>Quản lý Vai trò]
        UserPerms[UserPermissionModule<br/>Phân quyền User]
    end
    
    subgraph "Common Components"
        AppGrid[AppGrid<br/>AG Grid wrapper]
        CrudToolbar[CrudToolbar<br/>Bottom toolbar]
        FormDialog[FormDialog<br/>Modal form]
        PermGuard[PermissionGuard<br/>Access control]
    end
    
    subgraph "Backend APIs"
        NhanvienAPI[/api/nhanvien<br/>Employee API]
        PatientsAPI[/api/patients<br/>⚠️ Chưa có]
        DeptAPI[/api/departments<br/>⚠️ Chưa có]
        RolesAPI[/api/admin/roles<br/>Roles API]
        AdminAPI[/api/admin/users<br/>Admin API]
    end
    
    Users --> AppGrid
    Users --> CrudToolbar
    Users --> FormDialog
    Users --> NhanvienAPI
    
    Patients --> AppGrid
    Patients --> CrudToolbar
    Patients --> FormDialog
    Patients --> PatientsAPI
    
    Departments --> AppGrid
    Departments --> CrudToolbar
    Departments --> FormDialog
    Departments --> DeptAPI
    
    Roles --> AppGrid
    Roles --> CrudToolbar
    Roles --> FormDialog
    Roles --> RolesAPI
    
    UserPerms --> AdminAPI
    UserPerms --> RolesAPI
    
    click Users "src/components/modules/UsersModule.tsx"
    click Patients "src/components/modules/PatientsModule.tsx"
    click Departments "src/components/modules/DepartmentsModule.tsx"
    click Roles "src/components/modules/RoleManagementModule.tsx"
    click UserPerms "src/components/modules/UserPermissionModule.tsx"
    click AppGrid "src/components/common/AppGrid.tsx"
    click CrudToolbar "src/components/common/CrudToolbar.tsx"
    click FormDialog "src/components/common/FormDialog.tsx"
    click PermGuard "src/components/common/PermissionGuard.tsx"
    
    style PatientsAPI fill:#ffcccc
    style DeptAPI fill:#ffcccc
```

---

## 1. UsersModule - Quản lý Nhân viên

### Thông tin cơ bản
- **File**: [UsersModule.tsx](src/components/modules/UsersModule.tsx)
- **Chức năng**: CRUD nhân viên (Thêm, Sửa, Xóa, Xem danh sách)
- **Module code**: `USERS`

### Components sử dụng
- **AppGrid** - [AppGrid.tsx](src/components/common/AppGrid.tsx)
  - Hiển thị danh sách nhân viên dạng bảng
  - AG Grid với Vietnamese localization
  - Hỗ trợ double-click để edit
  - Selection handling

- **CrudToolbar** - [CrudToolbar.tsx](src/components/common/CrudToolbar.tsx)
  - Toolbar dock-bottom với các nút: Thêm, Sửa, Xóa, In, Xuất Excel
  - Search box tích hợp
  - Permission guards tự động

- **FormDialog** - [FormDialog.tsx](src/components/common/FormDialog.tsx)
  - Modal form để thêm/sửa nhân viên
  - Form fields: taikhoan, holot, ten, gioitinh, email, trangthai

- **ConfirmDialog** - [FormDialog.tsx](src/components/common/FormDialog.tsx)
  - Dialog xác nhận xóa

### Hooks sử dụng
- **useApiError** - [useApiError.ts](src/hooks/useApiError.ts)
  - Xử lý lỗi API và hiển thị Snackbar
  
- **useQuery, useMutation** - `@tanstack/react-query`
  - Data fetching và mutations

### Store sử dụng
- **useAppStore** - [uiStore.ts](src/lib/store/uiStore.ts)
  - Quản lý UI state (tabs, sidebar)

### API Backend

#### Base URL
- Environment: `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`)

#### Endpoints

| Method | Endpoint | Controller | Mô tả |
|--------|----------|------------|-------|
| GET | `/api/nhanvien?limit=1000` | [nhanvien.routes.js:7](../../backend/src/routes/nhanvien.routes.js#L7) | Lấy danh sách nhân viên |
| GET | `/api/nhanvien/:manv` | [nhanvien.routes.js:33](../../backend/src/routes/nhanvien.routes.js#L33) | Lấy chi tiết 1 nhân viên |
| POST | `/api/nhanvien` | [nhanvien.routes.js:52](../../backend/src/routes/nhanvien.routes.js#L52) | Tạo nhân viên mới |
| PUT | `/api/nhanvien/:manv` | [nhanvien.routes.js:75](../../backend/src/routes/nhanvien.routes.js#L75) | Cập nhật nhân viên |
| DELETE | `/api/nhanvien/:manv` | [nhanvien.routes.js:99](../../backend/src/routes/nhanvien.routes.js#L99) | Xóa nhân viên |

#### Request/Response Format

**GET /api/nhanvien**
```typescript
Response: {
  success: true,
  data: Employee[],
  total: number
}

interface Employee {
  manv: string
  taikhoan: string
  holot: string
  ten: string
  gioitinh: number  // 0=Nam, 1=Nữ
  email: string
  trangthai: string  // '0'=Đang làm việc, '1'=Nghỉ việc
}
```

**POST /api/nhanvien**
```typescript
Request: {
  taikhoan: string
  holot: string
  ten: string
  gioitinh: number
  email: string
  trangthai?: string
}

Response: {
  success: true,
  data: Employee
}
```

### Database
- **Schema**: `current`
- **Table**: `dmnhanvien`
- **Primary Key**: `manv`

---

## 2. PatientsModule - Quản lý Bệnh nhân

### Thông tin cơ bản
- **File**: [PatientsModule.tsx](src/components/modules/PatientsModule.tsx)
- **Chức năng**: CRUD bệnh nhân
- **Module code**: `PATIENTS`

### Components sử dụng
- **AppGrid** - [AppGrid.tsx](src/components/common/AppGrid.tsx) - Hiển thị danh sách bệnh nhân
- **CrudToolbar** - [CrudToolbar.tsx](src/components/common/CrudToolbar.tsx) - Toolbar với CRUD buttons
- **FormDialog** - [FormDialog.tsx](src/components/common/FormDialog.tsx) - Form thêm/sửa bệnh nhân
- **ConfirmDialog** - [FormDialog.tsx](src/components/common/FormDialog.tsx) - Xác nhận xóa

### Hooks sử dụng
- **useApiError** - Error handling
- **useQuery, useMutation** - Data fetching

### API Backend

⚠️ **CHƯA IMPLEMENT** - Frontend đang gọi các endpoint sau nhưng backend chưa có route tương ứng:

| Method | Endpoint | Status | Mô tả |
|--------|----------|--------|-------|
| GET | `/api/patients` | ❌ Chưa có | Lấy danh sách bệnh nhân |
| POST | `/api/patients` | ❌ Chưa có | Tạo bệnh nhân mới |
| PUT | `/api/patients/:id` | ❌ Chưa có | Cập nhật bệnh nhân |
| DELETE | `/api/patients/:id` | ❌ Chưa có | Xóa bệnh nhân |

#### Expected Interface
```typescript
interface Patient {
  id: string
  patientCode: string
  fullName: string
  dateOfBirth: string
  gender: string
  phone: string
  address: string
  email: string
}
```

**TODO**: Cần tạo route/controller/repository cho patients trong backend.

---

## 3. DepartmentsModule - Quản lý Khoa phòng

### Thông tin cơ bản
- **File**: [DepartmentsModule.tsx](src/components/modules/DepartmentsModule.tsx)
- **Chức năng**: CRUD khoa phòng
- **Module code**: `DEPARTMENTS`

### Components sử dụng
- **AppGrid** - [AppGrid.tsx](src/components/common/AppGrid.tsx) - Hiển thị danh sách khoa phòng
- **CrudToolbar** - [CrudToolbar.tsx](src/components/common/CrudToolbar.tsx) - Toolbar với CRUD buttons
- **FormDialog** - [FormDialog.tsx](src/components/common/FormDialog.tsx) - Form thêm/sửa khoa phòng
- **ConfirmDialog** - [FormDialog.tsx](src/components/common/FormDialog.tsx) - Xác nhận xóa

### Hooks sử dụng
- **useApiError** - Error handling
- **useQuery, useMutation** - Data fetching

### API Backend

⚠️ **CHƯA IMPLEMENT** - Frontend đang gọi các endpoint sau nhưng backend chưa có route tương ứng:

| Method | Endpoint | Status | Mô tả |
|--------|----------|--------|-------|
| GET | `/api/departments` | ❌ Chưa có | Lấy danh sách khoa phòng |
| POST | `/api/departments` | ❌ Chưa có | Tạo khoa phòng mới |
| PUT | `/api/departments/:id` | ❌ Chưa có | Cập nhật khoa phòng |
| DELETE | `/api/departments/:id` | ❌ Chưa có | Xóa khoa phòng |

#### Expected Interface
```typescript
interface Department {
  id: string
  code: string
  name: string
  description: string
  isActive: boolean
}
```

**TODO**: Cần tạo route/controller/repository cho departments trong backend.

---

## 4. RoleManagementModule - Quản lý Vai trò

### Thông tin cơ bản
- **File**: [RoleManagementModule.tsx](src/components/modules/RoleManagementModule.tsx)
- **Chức năng**: 
  - CRUD vai trò (roles)
  - Gán quyền (permissions) cho vai trò
  - Xem danh sách users theo vai trò
- **Module code**: `ROLES`

### Components sử dụng
- **AppGrid** - [AppGrid.tsx](src/components/common/AppGrid.tsx) - Hiển thị danh sách vai trò
- **CrudToolbar** - [CrudToolbar.tsx](src/components/common/CrudToolbar.tsx) - Toolbar với CRUD buttons + nút "Phân quyền" và "Xem User"
- **FormDialog** - [FormDialog.tsx](src/components/common/FormDialog.tsx) - Form thêm/sửa vai trò
- **ConfirmDialog** - [FormDialog.tsx](src/components/common/FormDialog.tsx) - Xác nhận xóa
- **Dialog** (MUI) - Dialog phân quyền với checkbox tree
- **Dialog** (MUI) - Dialog xem danh sách users

### Hooks sử dụng
- **useApiError** - [useApiError.ts](src/hooks/useApiError.ts) - Error handling
- **useQuery, useMutation** - `@tanstack/react-query` - Data fetching
- **useMemo** - Optimize permission grouping

### API Backend

#### Endpoints

| Method | Endpoint | Controller | Mô tả |
|--------|----------|------------|-------|
| GET | `/api/admin/roles` | [roleController.js:11](../../backend/src/controllers/admin/roleController.js#L11) | Lấy danh sách vai trò |
| GET | `/api/admin/roles/:id` | [roleController.js:24](../../backend/src/controllers/admin/roleController.js#L24) | Lấy chi tiết vai trò |
| POST | `/api/admin/roles` | [roleController.js:43](../../backend/src/controllers/admin/roleController.js#L43) | Tạo vai trò mới |
| PUT | `/api/admin/roles/:id` | [roleController.js:62](../../backend/src/controllers/admin/roleController.js#L62) | Cập nhật vai trò |
| DELETE | `/api/admin/roles/:id` | [roleController.js](../../backend/src/controllers/admin/roleController.js) | Xóa vai trò |
| GET | `/api/admin/roles/:id/permissions` | [roleController.js:83](../../backend/src/controllers/admin/roleController.js#L83) | Lấy quyền của vai trò |
| POST | `/api/admin/roles/:id/permissions` | [roleController.js:98](../../backend/src/controllers/admin/roleController.js#L98) | Gán quyền cho vai trò (bulk) |
| DELETE | `/api/admin/roles/:id/permissions/:permissionId` | [roleController.js:133](../../backend/src/controllers/admin/roleController.js#L133) | Xóa quyền khỏi vai trò |
| GET | `/api/admin/roles/:id/users` | [roleController.js:336](../../backend/src/controllers/admin/roleController.js#L336) | Lấy users theo vai trò |
| GET | `/api/admin/modules` | [roleController.js:290](../../backend/src/controllers/admin/roleController.js#L290) | Lấy danh sách modules |
| GET | `/api/admin/permissions` | [roleController.js:303](../../backend/src/controllers/admin/roleController.js#L303) | Lấy danh sách permissions |

#### Request/Response Format

**GET /api/admin/roles**
```typescript
Response: {
  success: true,
  data: Role[]
}

interface Role {
  id: number
  code: string
  name: string
  description: string
  is_active: boolean
}
```

**POST /api/admin/roles/:id/permissions** (Bulk update)
```typescript
Request: {
  permissions: Array<{
    permission_id: number
    granted: boolean
  }>
}

Response: {
  success: true,
  data: { updated: number }
}
```

**GET /api/admin/modules**
```typescript
Response: {
  success: true,
  data: Module[]
}

interface Module {
  id: number
  code: string
  name: string
  section: string
}
```

**GET /api/admin/permissions**
```typescript
Response: {
  success: true,
  data: Permission[]
}

interface Permission {
  id: number
  module_id: number
  code: string
  name: string
}
```

**GET /api/admin/roles/:id/users**
```typescript
Response: {
  success: true,
  data: UserByRole[]
}

interface UserByRole {
  username: string
  fullName: string
  email: string
  assigned_at: string
  assigned_by: string
}
```

### Database
- **Schema**: `webauth`
- **Tables**: 
  - `roles` - Vai trò
  - `modules` - Modules/chức năng
  - `permissions` - Quyền hạn
  - `role_permissions` - Mapping role-permission
  - `user_roles` - Mapping user-role

### Repository
- **File**: [roleRepository.js](../../backend/src/repositories/roleRepository.js)
- **File**: [moduleRepository.js](../../backend/src/repositories/moduleRepository.js)

---

## 5. UserPermissionModule - Phân quyền User

### Thông tin cơ bản
- **File**: [UserPermissionModule.tsx](src/components/modules/UserPermissionModule.tsx)
- **Chức năng**: 
  - Xem danh sách users
  - Gán vai trò (roles) cho user
  - Xóa vai trò khỏi user
- **Module code**: `USER_PERMISSIONS`

### Components sử dụng
- **Table** (MUI) - Hiển thị danh sách users
- **TableContainer, TableHead, TableBody, TableRow, TableCell** (MUI)
- **Dialog** (MUI) - Dialog gán vai trò
- **Autocomplete** (MUI) - Select user và role
- **CrudToolbar** - [CrudToolbar.tsx](src/components/common/CrudToolbar.tsx) - Toolbar với search
- **Chip** (MUI) - Hiển thị roles của user
- **IconButton** (MUI) - Nút xóa role

### Hooks sử dụng
- **useState, useEffect** - State management
- **apiClient** - [apiClient.ts](src/lib/apiClient.ts) - HTTP requests (không dùng React Query)

### API Backend

#### Endpoints

| Method | Endpoint | Controller | Mô tả |
|--------|----------|------------|-------|
| GET | `/api/admin/users` | [roleController.js:316](../../backend/src/controllers/admin/roleController.js#L316) | Lấy danh sách users |
| GET | `/api/admin/roles` | [roleController.js:11](../../backend/src/controllers/admin/roleController.js#L11) | Lấy danh sách roles |
| GET | `/api/admin/users/:username/roles` | [roleController.js:152](../../backend/src/controllers/admin/roleController.js#L152) | Lấy roles của user |
| POST | `/api/admin/users/:username/roles` | [roleController.js:167](../../backend/src/controllers/admin/roleController.js#L167) | Gán role cho user |
| DELETE | `/api/admin/users/:username/roles/:roleId` | [roleController.js:192](../../backend/src/controllers/admin/roleController.js#L192) | Xóa role khỏi user |

#### Request/Response Format

**GET /api/admin/users**
```typescript
Response: {
  success: true,
  data: User[]
}

interface User {
  username: string
  fullName: string
  email: string
}
```

**GET /api/admin/users/:username/roles**
```typescript
Response: {
  success: true,
  data: UserRole[]
}

interface UserRole {
  id: number
  username: string
  role_id: number
  role_code: string
  role_name: string
  assigned_at: string
  assigned_by: string
}
```

**POST /api/admin/users/:username/roles**
```typescript
Request: {
  role_id: number
}

Response: {
  success: true,
  data: UserRole
}
```

### Database
- **Schema**: `webauth`
- **Tables**: 
  - `user_roles` - Mapping user-role
  - `roles` - Vai trò
- **Source**: `current.dmnhanvien` - Danh sách users

---

## Common Components

### AppGrid
- **File**: [AppGrid.tsx](src/components/common/AppGrid.tsx)
- **Mô tả**: Wrapper cho AG Grid Community với cấu hình chuẩn
- **Features**:
  - Vietnamese localization - [agGridVietnamese.ts](src/lib/agGridVietnamese.ts)
  - Pagination (20, 50, 100, 200)
  - Row selection
  - Double-click handler
  - Auto-size columns

### CrudToolbar
- **File**: [CrudToolbar.tsx](src/components/common/CrudToolbar.tsx)
- **Mô tả**: Toolbar dock-bottom với các nút CRUD chuẩn
- **Features**:
  - Buttons: Thêm, Sửa, Xóa, In, Xuất Excel, Làm mới
  - Search box tích hợp
  - Permission guards tự động (khi có prop `module`)
  - Extensible menu (thêm nút custom)
  - Centered layout

### FormDialog
- **File**: [FormDialog.tsx](src/components/common/FormDialog.tsx)
- **Mô tả**: Modal dialog cho form thêm/sửa
- **Features**:
  - Responsive (fullScreen trên mobile)
  - Actions: Lưu, Hủy
  - Loading state

### ConfirmDialog
- **File**: [FormDialog.tsx](src/components/common/FormDialog.tsx)
- **Mô tả**: Dialog xác nhận hành động (xóa, etc.)
- **Features**:
  - Title, message customizable
  - Actions: Xác nhận, Hủy
  - Danger color cho nút xác nhận

### PermissionGuard
- **File**: [PermissionGuard.tsx](src/components/common/PermissionGuard.tsx)
- **Mô tả**: HOC để ẩn/hiện component dựa trên quyền
- **Props**:
  - `module`: Module code (vd: 'USERS')
  - `action`: Action code (vd: 'CREATE', 'EDIT', 'DELETE')
  - `children`: Component cần guard

---

## Common Hooks

### useApiError
- **File**: [useApiError.ts](src/hooks/useApiError.ts)
- **Mô tả**: Hook xử lý lỗi API và hiển thị Snackbar
- **Returns**:
  - `handleError(error, context)`: Function xử lý error
  - `ErrorSnackbar`: Component Snackbar để render

### usePermission
- **File**: [usePermission.ts](src/hooks/usePermission.ts)
- **Mô tả**: Hook kiểm tra quyền của user
- **Returns**:
  - `hasPermission(module, action)`: Function kiểm tra quyền
  - `permissions`: Object chứa tất cả quyền

---

## API Client

### apiClient
- **File**: [apiClient.ts](src/lib/apiClient.ts)
- **Mô tả**: HTTP client wrapper với error handling
- **Methods**:
  - `get<T>(url, config?): Promise<T>`
  - `post<T>(url, data?, config?): Promise<T>`
  - `put<T>(url, data?, config?): Promise<T>`
  - `delete<T>(url, config?): Promise<T>`
- **Features**:
  - Auto base URL từ `NEXT_PUBLIC_API_URL`
  - Auto credentials (cookies)
  - Auto error handling với ApiError
  - Timeout 30s
  - Development logging

---

## Stores (Zustand)

### uiStore
- **File**: [uiStore.ts](src/lib/store/uiStore.ts)
- **State**:
  - `tabs`: Array of open tabs
  - `activeTab`: Current active tab ID
  - `sidebarOpen`: Sidebar visibility
- **Actions**:
  - `openTab(tab)`: Mở tab mới
  - `closeTab(tabId)`: Đóng tab
  - `setActiveTab(tabId)`: Set active tab
  - `toggleSidebar()`: Toggle sidebar

### permissionStore
- **File**: [permissionStore.ts](src/lib/store/permissionStore.ts)
- **State**:
  - `permissions`: Object chứa permissions
  - `modules`: Array of accessible modules
  - `favorites`: Array of favorite modules
- **Actions**:
  - `loadPermissions()`: Load permissions từ API
  - `hasPermission(module, action)`: Kiểm tra quyền
  - `addFavorite(moduleCode)`: Thêm vào thường dùng
  - `removeFavorite(moduleCode)`: Xóa khỏi thường dùng

---

## Authentication & Authorization

### Auth Routes
- **File**: [auth.routes.js](../../backend/src/routes/auth.routes.js)

| Method | Endpoint | Controller | Mô tả |
|--------|----------|------------|-------|
| POST | `/api/auth/login` | [authController.js](../../backend/src/controllers/authController.js) | Đăng nhập |
| POST | `/api/auth/logout` | [authController.js](../../backend/src/controllers/authController.js) | Đăng xuất |
| POST | `/api/auth/refresh` | [authController.js](../../backend/src/controllers/authController.js) | Refresh token |
| GET | `/api/auth/profile` | [authController.js](../../backend/src/controllers/authController.js) | Lấy profile user |

### Permission Routes
- **File**: [permission.routes.js](../../backend/src/routes/permission.routes.js)

| Method | Endpoint | Controller | Mô tả |
|--------|----------|------------|-------|
| GET | `/api/permissions/my-permissions` | [permissionController.js](../../backend/src/controllers/permissionController.js) | Lấy quyền của user hiện tại |
| GET | `/api/permissions/my-modules` | [permissionController.js](../../backend/src/controllers/permissionController.js) | Lấy modules user được truy cập |
| GET | `/api/permissions/my-favorites` | [permissionController.js](../../backend/src/controllers/permissionController.js) | Lấy menu thường dùng |
| POST | `/api/permissions/favorites/:moduleCode` | [permissionController.js](../../backend/src/controllers/permissionController.js) | Thêm vào thường dùng |
| DELETE | `/api/permissions/favorites/:moduleCode` | [permissionController.js](../../backend/src/controllers/permissionController.js) | Xóa khỏi thường dùng |
| POST | `/api/permissions/check` | [permissionController.js](../../backend/src/controllers/permissionController.js) | Kiểm tra quyền cụ thể |
| GET | `/api/permissions/details` | [permissionController.js](../../backend/src/controllers/permissionController.js) | Lấy thông tin đầy đủ |

### Middleware
- **authenticate**: [authMiddleware.js](../../backend/src/middleware/authMiddleware.js)
  - Verify JWT token từ cookie
  - Attach user info vào `req.user`
  
- **requirePermission**: [permissionMiddleware.js](../../backend/src/middleware/permissionMiddleware.js)
  - Kiểm tra quyền user cho module/action
  - Usage: `requirePermission('users', 'EDIT')`

---

## Naming Convention

### ⚠️ CRITICAL: snake_case cho API/Database

**Tất cả fields đi qua API hoặc database PHẢI dùng snake_case:**

```typescript
// ✅ ĐÚNG
interface Role {
  id: number
  code: string
  name: string
  is_active: boolean  // snake_case
}

// ❌ SAI
interface Role {
  id: number
  code: string
  name: string
  isActive: boolean  // camelCase → Dữ liệu bị mất
}
```

**Quy tắc:**
- Database columns: `snake_case`
- API request/response: `snake_case`
- TypeScript interfaces (API data): `snake_case`
- Component internal state: `camelCase` (OK)
- React props: `camelCase` (OK)

---

## Print & Export Excel

**Mọi module có CrudToolbar PHẢI implement 2 functions:**

### handlePrint()
- Mở window mới với HTML formatted
- Style: table borders, header màu xanh, dòng chẵn màu xám
- Footer: ngày giờ in (vi-VN format)
- Delay 250ms trước khi gọi `window.print()`

### handleExportExcel()
- Format CSV với headers
- Wrap cells trong quotes `"${cell}"`
- **BẮT BUỘC**: UTF-8 BOM (`﻿`) để Excel hiển thị đúng tiếng Việt
- Filename: `export-YYYY-MM-DD.csv`

**Template code**: Xem [agents.md](agents.md) section "Print & Export Excel Implementation"

---

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env)
```bash
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## TODO List

### Backend APIs cần implement:

1. **Patients API**
   - Route: `backend/src/routes/patients.routes.js`
   - Controller: `backend/src/controllers/patientController.js`
   - Repository: `backend/src/repositories/patientRepository.js`
   - Endpoints: GET, POST, PUT, DELETE `/api/patients`

2. **Departments API**
   - Route: `backend/src/routes/departments.routes.js`
   - Controller: `backend/src/controllers/departmentController.js`
   - Repository: `backend/src/repositories/departmentRepository.js`
   - Endpoints: GET, POST, PUT, DELETE `/api/departments`

3. **Role DELETE endpoint**
   - Thêm handler [roleController.js](../../backend/src/controllers/admin/roleController.js) vào `deleteRole`
   - Thêm repository method trong [roleRepository.js](../../backend/src/repositories/roleRepository.js)

### Frontend improvements:

1. **UserPermissionModule**
   - Migrate sang React Query (hiện đang dùng useState/useEffect)
   - Thêm useApiError hook
   - Chuẩn hóa error handling

2. **All modules**
   - Verify Print function có đầy đủ style
   - Verify Export Excel có UTF-8 BOM
   - Verify snake_case cho tất cả API fields

---

## References

- **Project rules**: [CLAUDE.md](../CLAUDE.md)
- **Frontend rules**: [agents.md](agents.md)
- **Task workflow**: [task.md](../tasks/task.md)
- **Memory**: `C:\Users\ongtr\.claude\projects\h--nodejs-tester-winform-web-app\memory\MEMORY.md`

---

**Last Updated**: 2026-04-27  
**Version**: 1.1  
**Model**: Claude Opus 4.6
