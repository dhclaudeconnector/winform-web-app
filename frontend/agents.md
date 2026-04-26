# Frontend Development Rules

## API Client Usage

**CRITICAL RULE**: Tất cả HTTP requests trong frontend PHẢI sử dụng `apiClient` từ `@/lib/apiClient`.

### ❌ KHÔNG BAO GIỜ làm như thế này:

```typescript
// WRONG - Không dùng fetch trực tiếp
const res = await fetch('http://localhost:3001/api/users')
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`)

// WRONG - Hardcode URL
const res = await fetch('http://localhost:3001/api/nhanvien', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  credentials: 'include'
})
```

### ✅ ĐÚNG - Luôn dùng apiClient:

```typescript
import { apiClient } from '@/lib/apiClient'

// GET request
const users = await apiClient.get<User[]>('/api/nhanvien')

// POST request
const newUser = await apiClient.post<User>('/api/nhanvien', {
  taikhoan: 'test',
  holot: 'Nguyen',
  ten: 'Van A'
})

// PUT request
const updated = await apiClient.put<User>(`/api/nhanvien/${id}`, data)

// DELETE request
await apiClient.delete(`/api/nhanvien/${id}`)
```

### Lợi ích của apiClient:

1. **Tự động xử lý base URL** từ environment variables
2. **Tự động gửi credentials** (cookies) với mọi request
3. **Tự động xử lý errors** và throw ApiError với status code
4. **Timeout handling** mặc định
5. **Type-safe** với TypeScript generics
6. **Logging** trong development mode
7. **Consistent error handling** trong toàn bộ app

### Khi nào cần sửa code:

- Khi thấy `fetch(` trong bất kỳ component/hook nào
- Khi thấy hardcoded URL như `http://localhost:3001`
- Khi thấy manual header setup cho authentication
- Khi thấy manual credentials: 'include'

### React Query Integration:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

// Query
const { data } = useQuery({
  queryKey: ['employees'],
  queryFn: () => apiClient.get<Employee[]>('/api/nhanvien?limit=100')
})

// Mutation
const createMutation = useMutation({
  mutationFn: (data: Partial<Employee>) => 
    apiClient.post<Employee>('/api/nhanvien', data)
})
```

## Environment Variables

API base URL được cấu hình trong:
- `frontend/.env.local` (development)
- `frontend/.env.production` (production)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**QUAN TRỌNG**: `NEXT_PUBLIC_API_URL` chỉ chứa host + port, KHÔNG bao gồm `/api`. Endpoint trong code phải có `/api/` prefix.

Ví dụ:
- ✅ ĐÚNG: `NEXT_PUBLIC_API_URL=http://localhost:3001` + `apiClient.get('/api/nhanvien')`
- ❌ SAI: `NEXT_PUBLIC_API_URL=http://localhost:3001/api` + `apiClient.get('/api/nhanvien')` → `/api/api/nhanvien`

## Error Handling

**CRITICAL RULE**: Tất cả mutations PHẢI sử dụng `useApiError` hook để hiển thị lỗi cho người dùng.

### apiClient error shape

apiClient tự động throw `ApiError` với các trường:
- `status`: HTTP status code
- `message`: thông báo lỗi chính
- `errors`: chi tiết lỗi trả về từ response
- `code`: mã lỗi nghiệp vụ nếu backend trả về

### ✅ ĐÚNG - Sử dụng useApiError hook

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { useApiError } from '@/hooks/useApiError'

function MyComponent() {
  const queryClient = useQueryClient()
  const { handleError, ErrorSnackbar } = useApiError()

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      return await apiClient.post<Employee>('/api/nhanvien', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (error) => {
      handleError(error, 'tạo nhân viên')
    },
  })

  return (
    <>
      {/* Your component UI */}
      <ErrorSnackbar />
    </>
  )
}
```

### Quy tắc bắt buộc

1. Mọi mutation (create/update/delete) PHẢI có `onError` handler
2. PHẢI dùng `useApiError()` thay vì tự tạo `errorMessage` state riêng
3. PHẢI render `<ErrorSnackbar />` trong component
4. `handleError(error, action)` phải truyền action rõ nghĩa, ví dụ: `tạo nhân viên`, `cập nhật bệnh nhân`, `xóa khoa phòng`
5. Snackbar phải hiển thị được cả `message`, `status`, `code`, và `errors` từ response nếu có

### ❌ Không dùng pattern cũ

```typescript
const [errorMessage, setErrorMessage] = useState('')

onError: (error) => {
  if (error instanceof ApiError) {
    setErrorMessage(`Lỗi: ${error.message}`)
  }
}

<Snackbar open={!!errorMessage}>...</Snackbar>
```

### Khi refactor code cũ

- Thay mọi `setErrorMessage(...)` bằng `handleError(error, '...')`
- Xóa state `errorMessage`
- Xóa import `Snackbar`, `Alert`, `ApiError` nếu chỉ còn phục vụ UI lỗi cũ
- Thêm `const { handleError, ErrorSnackbar } = useApiError()`
- Thêm `<ErrorSnackbar />` vào JSX gốc của component

---

**Nhớ**: Mỗi khi viết code mới hoặc refactor, LUÔN kiểm tra và sử dụng `apiClient` thay vì `fetch` trực tiếp.
