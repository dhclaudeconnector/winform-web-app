# WinForm Web App - Codex Agent Guide

This file provides working instructions for Codex-style agents operating in this repository.

## Project Overview

Modern web application with Windows Forms-style UI, built with Next.js and Node.js.

Key features:
- Windows Forms-style MenuStrip navigation
- Role-based permission system
- Auto-update system with Git integration
- Smart database migrations (AUTO/MANUAL)
- PWA support
- Vietnamese localization throughout the UI

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Material-UI (MUI) v9
- TanStack Query
- Zustand
- AG Grid Community
- React Hook Form + Zod
- lucide-react

### Backend
- Node.js 20
- Express 5
- PostgreSQL
- JWT authentication via httpOnly cookies
- Helmet
- express-rate-limit
- express-validator

## Repository Structure

```text
winform-web-app/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js pages and routes
│   │   ├── components/
│   │   │   ├── common/             # Shared UI components
│   │   │   ├── layout/             # App shell, sidebar, workspace
│   │   │   └── modules/            # Business modules
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # API client, stores, utils, config
│   │   └── public/
│   ├── agents.md                   # Frontend-specific rules
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── migrations/
│   └── package.json
├── tasks/
│   └── task.md
├── docs/
├── CLAUDE.md
└── AGENTS.md
```

## Required Reading Before Changes

Before implementing any non-trivial change, read:
1. `tasks/task.md`
2. `frontend/agents.md`
3. `CLAUDE.md`

If the task is frontend-focused, use `frontend/agents.md` as the most specific source of truth.

## Critical Rules

### 1. Use `apiClient` for all frontend HTTP requests

Do not use `fetch()` directly in frontend modules, hooks, or components.

```ts
import { apiClient } from '@/lib/apiClient'

const users = await apiClient.get<User[]>('/api/nhanvien')
const created = await apiClient.post<User>('/api/nhanvien', data)
const updated = await apiClient.put<User>(`/api/nhanvien/${id}`, data)
await apiClient.delete(`/api/nhanvien/${id}`)
```

Never hardcode backend URLs in frontend code.

### 2. Use `useApiError` for frontend mutations

All user-facing mutation flows must surface errors consistently.

```ts
const { handleError, ErrorSnackbar } = useApiError()

const mutation = useMutation({
  mutationFn: (data) => apiClient.post('/api/users', data),
  onError: handleError,
})
```

Render `ErrorSnackbar` in the component.

### 3. Use `snake_case` across API and database boundaries

Any data sent to or received from the backend/database must use `snake_case`.

```ts
interface Role {
  id: number
  name: string
  is_active: boolean
}
```

Do not introduce `camelCase` field names for request/response payloads.

### 4. Follow the Windows Forms layout pattern

Module screens must keep the main grid stretched and the CRUD toolbar docked at the bottom.

```tsx
<Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
  <Box sx={{ flex: 1, minHeight: 0, p: 1, pb: 0, overflow: 'hidden' }}>
    <AppGrid {...gridProps} />
  </Box>

  <Box sx={{ flexShrink: 0, p: 1, pt: 0, backgroundColor: 'background.default' }}>
    <CrudToolbar {...toolbarProps} />
  </Box>
</Box>
```

Do not place `CrudToolbar` elsewhere.

### 5. Do not add `PageHeader` to module forms

The tab title is sufficient. Keep module UIs compact.

### 6. AG Grid must use Vietnamese localization

Use the shared locale configuration from `frontend/src/lib/agGridVietnamese.ts`.

### 7. Print and Export Excel are expected where `CrudToolbar` exposes them

When a module includes print/export actions, implement real functionality. Do not leave placeholder handlers.

For CSV export, include UTF-8 BOM so Vietnamese text renders correctly in Excel.

### 8. Respect permission-aware UI patterns

Use `PermissionGuard` or pass `module` into `CrudToolbar` so actions align with the permission system.

## Frontend Conventions

- Prefer existing shared components in `frontend/src/components/common/`
- Reuse patterns from existing modules in `frontend/src/components/modules/`
- Keep forms typed with TypeScript
- Prefer React Hook Form + Zod for validation
- Avoid adding new abstractions unless there is a clear repeated need
- Keep UI text in Vietnamese where consistent with surrounding screens

## Backend Conventions

- Use route -> controller -> service/repository flow already present in `backend/src/`
- Validate request data at the API boundary
- Keep database access in repositories
- Return consistent JSON response shapes
- Use parameterized SQL queries
- Preserve `snake_case` in controller input/output and repository data mapping

## Security Expectations

- Do not store auth tokens in localStorage
- Assume JWT auth uses httpOnly cookies
- Validate external input at boundaries
- Avoid SQL injection by using parameterized queries
- Avoid XSS by not injecting raw HTML unless there is an established sanitized pattern

## Existing Important Files

### Frontend
- `frontend/src/lib/apiClient.ts` - centralized HTTP client
- `frontend/src/components/common/CrudToolbar.tsx` - bottom action toolbar
- `frontend/src/components/common/AppGrid.tsx` - shared grid wrapper
- `frontend/src/hooks/useApiError.ts` - standard mutation error handling
- `frontend/src/lib/agGridVietnamese.ts` - AG Grid Vietnamese locale

### Backend
- `backend/src/server.js` - app entry point
- `backend/src/routes/` - API routes
- `backend/src/controllers/` - request handlers
- `backend/src/repositories/` - SQL access
- `backend/src/services/migrationService.js` - migration runner

## Working Workflow

### Before implementation
- Determine whether the task affects frontend, backend, or both
- Check for an existing similar module or route before creating new patterns
- Prefer editing existing files over creating new ones

### For frontend work
- Follow `frontend/agents.md`
- Reuse `apiClient`, `useApiError`, `CrudToolbar`, and `AppGrid`
- Keep module layout aligned with the existing Windows Forms style

### For backend work
- Keep API changes consistent with existing route structure
- If schema changes are needed, add a migration under `backend/migrations/`

### After changes
- Run the smallest relevant validation first
- Frontend: `npm run lint` or `npm run build` when appropriate
- Backend: start or validate the touched flow where appropriate

## Commands

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run lint
npm run build
```

### Backend
```bash
cd backend
npm install
npm run dev
npm run migration:status
npm run migration:run
```

## Common Mistakes To Avoid

- Using `fetch()` directly in frontend code
- Sending `camelCase` payload fields to backend APIs
- Leaving print/export buttons unimplemented
- Adding `PageHeader` to module screens
- Breaking the bottom-docked toolbar layout
- Skipping Vietnamese localization for AG Grid
- Hardcoding API hosts or credentials logic in components

## Decision Priority

When rules conflict, prefer this order:
1. Existing code patterns in the touched area
2. `frontend/agents.md` for frontend-specific implementation
3. `tasks/task.md` workflow guidance
4. `CLAUDE.md` repository-level guidance
5. This file as Codex-oriented operational summary

## Goal

Make changes that match the repository's existing architecture, preserve Vietnamese business UI conventions, and avoid introducing new patterns unless clearly necessary.
