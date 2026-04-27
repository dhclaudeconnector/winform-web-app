# WinForm Web App - Development Guide

Modern web application with Windows Forms-style UI, built with Next.js and Node.js.

## Project Overview

Full-stack TypeScript/JavaScript application featuring:
- Windows Forms-style MenuStrip navigation
- Role-based permission system with granular access control
- Auto-update system with Git integration
- Smart database migrations (AUTO/MANUAL)
- PWA support with offline capabilities
- Vietnamese localization throughout

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: Material-UI (MUI) v9
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Grid**: AG Grid Community
- **Forms**: React Hook Form + Zod validation
- **Icons**: lucide-react
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js 20 (ES Modules)
- **Framework**: Express 5
- **Database**: PostgreSQL 12+
- **Authentication**: JWT (httpOnly cookies)
- **Security**: Helmet, rate limiting, input sanitization
- **Language**: JavaScript (ES Modules)

## Architecture

### Directory Structure

```
winform-web-app/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   ├── components/
│   │   │   ├── common/             # Shared components
│   │   │   │   ├── AppGrid.tsx     # AG Grid wrapper
│   │   │   │   ├── CrudToolbar.tsx # Bottom toolbar (Windows Forms style)
│   │   │   │   ├── FormDialog.tsx  # Modal form wrapper
│   │   │   │   └── PermissionGuard.tsx
│   │   │   ├── layout/             # Layout components
│   │   │   │   ├── AppShell.tsx    # Main layout shell
│   │   │   │   ├── SidebarExplorer.tsx
│   │   │   │   └── TabWorkspace.tsx
│   │   │   └── modules/            # Business modules
│   │   │       ├── UsersModule.tsx
│   │   │       ├── PatientsModule.tsx
│   │   │       ├── RoleManagementModule.tsx
│   │   │       └── ...
│   │   ├── lib/
│   │   │   ├── api/                # API service files
│   │   │   ├── store/              # Zustand stores
│   │   │   │   ├── uiStore.ts      # UI state (tabs, sidebar)
│   │   │   │   └── permissionStore.ts
│   │   │   ├── apiClient.ts        # HTTP client wrapper
│   │   │   ├── agGridVietnamese.ts # Vietnamese translations
│   │   │   └── config/
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useApiError.ts      # Error handling
│   │   │   └── usePermission.ts
│   │   └── public/                 # Static assets
│   ├── agents.md                   # Frontend development rules
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/                 # Express routes
│   │   ├── controllers/            # Request handlers
│   │   ├── repositories/           # Database queries
│   │   ├── services/               # Business logic
│   │   ├── middleware/             # Auth, validation, error handling
│   │   ├── config/                 # Database, environment config
│   │   └── server.js               # Entry point
│   ├── migrations/                 # Database migrations
│   └── package.json
├── tasks/
│   └── task.md                     # Task execution workflow
└── docs/                           # Documentation

```

## Critical Development Rules

### 1. API Client Usage (MANDATORY)

**ALL HTTP requests MUST use `apiClient` from `@/lib/apiClient`**

```typescript
import { apiClient } from '@/lib/apiClient'

// ✅ CORRECT
const users = await apiClient.get<User[]>('/api/nhanvien')
const newUser = await apiClient.post<User>('/api/nhanvien', data)
const updated = await apiClient.put<User>(`/api/nhanvien/${id}`, data)
await apiClient.delete(`/api/nhanvien/${id}`)

// ❌ NEVER DO THIS
const res = await fetch('http://localhost:3001/api/users')
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`)
```

**Benefits:**
- Automatic base URL handling from environment variables
- Automatic credentials (cookies) with every request
- Automatic error handling with ApiError
- Timeout handling
- Type-safe with TypeScript generics
- Development logging

### 2. Error Handling (MANDATORY)

**ALL mutations MUST use `useApiError` hook**

```typescript
import { useApiError } from '@/hooks/useApiError'

function MyComponent() {
  const { handleError, ErrorSnackbar } = useApiError()

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/api/users', data),
    onError: handleError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  return (
    <>
      {/* Your component */}
      <ErrorSnackbar />
    </>
  )
}
```

### 3. Naming Convention (CRITICAL)

**Database and API: snake_case ONLY**

```typescript
// ✅ CORRECT - snake_case everywhere
interface Role {
  id: number
  code: string
  name: string
  description: string
  is_active: boolean  // snake_case
}

// Backend receives snake_case
const { name, description, is_active } = req.body

// Frontend sends snake_case
await apiClient.put(`/api/admin/roles/${id}`, {
  name: 'Admin',
  description: 'Administrator role',
  is_active: true
})

// ❌ WRONG - camelCase causes data loss
interface Role {
  isActive: boolean  // Backend won't recognize this
}
```

**Rule:** Any data crossing API or database boundaries MUST use snake_case.

### 4. Module Layout Pattern (MANDATORY)

**Windows Forms dock-bottom style**

```typescript
<Box sx={{ 
  height: '100%', 
  minHeight: 0, 
  display: 'flex', 
  flexDirection: 'column', 
  overflow: 'hidden' 
}}>
  {/* Grid area - flex: 1 */}
  <Box sx={{ flex: 1, minHeight: 0, p: 1, pb: 0, overflow: 'hidden' }}>
    <AppGrid
      rowData={data}
      columnDefs={columns}
      onRowDoubleClicked={handleEdit}
      onSelectionChanged={handleSelectionChange}
    />
  </Box>
  
  {/* Toolbar area - flexShrink: 0, docked at bottom */}
  <Box sx={{ flexShrink: 0, p: 1, pt: 0, backgroundColor: 'background.default' }}>
    <CrudToolbar
      module="USERS"
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onPrint={handlePrint}
      onExportExcel={handleExportExcel}
      searchValue={searchText}
      onSearchChange={setSearchText}
      editDisabled={!selectedRow}
      deleteDisabled={!selectedRow}
    />
  </Box>
</Box>
```

**Key points:**
- Grid takes flex: 1 (fills available space)
- Toolbar at bottom with flexShrink: 0 (fixed height)
- No PageHeader component (tab title is sufficient)
- Buttons centered in toolbar

### 5. AG Grid Configuration

**Vietnamese localization required**

```typescript
import { agGridVietnamese } from '@/lib/agGridVietnamese'

<AppGrid
  rowData={data}
  columnDefs={columns}
  localeText={agGridVietnamese}
  pagination={true}
  paginationPageSize={50}
  paginationPageSizeSelector={[20, 50, 100, 200]}
/>
```

### 6. Print & Export Excel (MANDATORY)

**Every module with CrudToolbar MUST implement these functions**

```typescript
const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>In danh sách</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #1976d2; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1976d2; color: white; padding: 8px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .print-date { text-align: right; font-size: 12px; color: #666; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>DANH SÁCH</h1>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.headerName}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${filteredData.map(row => `
            <tr>
              ${columns.map(col => `<td>${row[col.field] ?? ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="print-date">
        Ngày in: ${new Date().toLocaleString('vi-VN')}
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

const handleExportExcel = () => {
  let csv = columns.map(col => col.headerName).join(',') + '\n'
  
  filteredData.forEach(row => {
    const rowData = columns.map(col => row[col.field] ?? '')
    csv += rowData.map(cell => `"${cell}"`).join(',') + '\n'
  })

  // UTF-8 BOM for Vietnamese characters
  const BOM = '﻿'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `export-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}
```

**Critical:** UTF-8 BOM is REQUIRED for Excel to display Vietnamese correctly.

### 7. Permission System

**Use PermissionGuard for UI elements**

```typescript
import { PermissionGuard } from '@/components/common/PermissionGuard'

<PermissionGuard module="USERS" action="CREATE">
  <Button onClick={handleAdd}>Thêm</Button>
</PermissionGuard>

<PermissionGuard module="USERS" action="EDIT">
  <Button onClick={handleEdit}>Sửa</Button>
</PermissionGuard>
```

**CrudToolbar auto-wraps buttons when module prop is provided:**

```typescript
<CrudToolbar
  module="USERS"  // Automatically applies permission guards
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### 8. Form Validation

**Use React Hook Form + Zod**

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  is_active: z.boolean()
})

type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Important:** URL contains host + port only, NO `/api` suffix.

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

## Database Migrations

### Migration Types

1. **AUTO migrations** - Run automatically on server start
   - Naming: `XXX_auto_[low|medium|high]_description.sql`
   - Use for: schema changes, new tables, indexes

2. **MANUAL migrations** - Require manual execution
   - Naming: `XXX_manual_[low|medium|high]_description.sql`
   - Use for: data migrations, destructive operations

### Creating Migrations

```bash
cd backend
npm run migration:create

# Follow prompts:
# - Type: AUTO or MANUAL
# - Priority: LOW, MEDIUM, HIGH
# - Description: init_permissions
```

### Migration Status

```bash
npm run migration:status  # Check which migrations have run
npm run migration:run     # Run pending AUTO migrations
```

## Icon Standards

**Use lucide-react icons consistently:**

```typescript
import { 
  Plus,           // Add/Create
  Pencil,         // Edit
  Trash2,         // Delete
  Save,           // Save
  X,              // Cancel/Close
  Printer,        // Print
  FileSpreadsheet,// Export Excel
  RefreshCw,      // Refresh
  Search,         // Search
  Eye,            // View
  Users,          // Users module
  Building,       // Departments
  UserCog,        // Roles
  Shield          // Permissions
} from 'lucide-react'
```

## Development Workflow

### Before Starting Any Task

1. **Read required files:**
   - `frontend/agents.md` - Frontend rules
   - `tasks/task.md` - Task workflow
   - `C:\Users\ongtr\.claude\projects\h--nodejs-tester-winform-web-app\memory\MEMORY.md` - User preferences

2. **Analyze task scope:**
   - Frontend, backend, or both?
   - New module or modify existing?
   - Need new API endpoints?
   - Need database migration?

3. **Check similar modules:**
   - Reference existing modules for patterns
   - Maintain consistency with codebase

### Creating a New Module

**Checklist:**

- [ ] Layout follows Windows Forms dock-bottom pattern
- [ ] Uses `apiClient` for all HTTP requests
- [ ] Uses `useApiError` for error handling
- [ ] AG Grid has Vietnamese localization
- [ ] Print and Export Excel functions implemented
- [ ] Permission guards applied (if needed)
- [ ] Form validation with Zod
- [ ] All fields use snake_case for API/database
- [ ] No PageHeader component
- [ ] CrudToolbar at bottom with centered buttons

### Testing

```bash
# Frontend
cd frontend
npm run dev        # http://localhost:3000
npm run build      # Test production build
npm run lint       # Check code quality

# Backend
cd backend
npm run dev        # http://localhost:3001
# Test endpoints with curl or Postman
```

### Common Pitfalls

1. **Using fetch() instead of apiClient** - Always use apiClient
2. **camelCase in API/database fields** - Always use snake_case
3. **Missing UTF-8 BOM in Excel export** - Vietnamese won't display
4. **Forgetting useApiError** - Errors won't show to users
5. **Missing AG Grid Vietnamese localization** - UI will be in English
6. **Adding PageHeader** - Not needed, tab title is sufficient
7. **Toolbar not at bottom** - Must follow Windows Forms pattern

## Security

- JWT tokens in httpOnly cookies (not localStorage)
- CORS configured for specific origins
- Helmet security headers
- Rate limiting on API endpoints
- Input sanitization and validation
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping + CSP)

## Performance

- React Query caching with staleTime
- AG Grid virtual scrolling for large datasets
- Next.js automatic code splitting
- Image optimization with next/image
- PWA caching for offline support

## Deployment

### Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Production (Docker)
```bash
docker-compose up -d
docker-compose logs -f
```

### Production (PM2)
```bash
# Backend
cd backend
pm2 start ecosystem.config.js

# Frontend
cd frontend
npm run build
pm2 start npm --name "winform-frontend" -- start
```

## Support & Resources

- **Task workflow**: `tasks/task.md`
- **Frontend rules**: `frontend/agents.md`
- **Memory/preferences**: `C:\Users\ongtr\.claude\projects\h--nodejs-tester-winform-web-app\memory\MEMORY.md`
- **API docs**: Check backend routes in `backend/src/routes/`
- **Component examples**: See existing modules in `frontend/src/components/modules/`

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-module

# Commit with descriptive message
git commit -m "Add UserManagement module with CRUD operations

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# Push and create PR
git push origin feature/new-module
```

## Key Principles

1. **Consistency** - Follow existing patterns in the codebase
2. **Type Safety** - Use TypeScript interfaces for all data structures
3. **Error Handling** - Always handle errors gracefully with user feedback
4. **Accessibility** - Use semantic HTML and ARIA labels
5. **Performance** - Optimize for large datasets and slow networks
6. **Security** - Never trust client input, validate everything
7. **Maintainability** - Write clear, self-documenting code
8. **User Experience** - Vietnamese UI, intuitive navigation, fast responses

---

**Last Updated:** 2026-04-27
**Model:** Claude Opus 4.6
