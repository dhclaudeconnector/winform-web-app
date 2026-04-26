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

## Module Form Layout Standard

**CRITICAL RULE**: Tất cả module forms PHẢI tuân thủ layout chuẩn Windows Forms với toolbar dock bottom và grid scroll độc lập.

### ✅ ĐÚNG - Layout chuẩn:

```typescript
export function MyModule() {
  return (
    <Box sx={{ 
      height: '100%', 
      minHeight: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden' 
    }}>
      {/* Grid area - chiếm toàn bộ không gian còn lại */}
      <Box sx={{ 
        flex: 1, 
        minHeight: 0, 
        p: 1, 
        pb: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <AppGrid
            rowData={data}
            columnDefs={columnDefs}
            onRowSelected={setSelected}
            loading={isLoading}
          />
        </Box>
      </Box>

      {/* Toolbar - dock bottom, không cuộn */}
      <Box sx={{ 
        flexShrink: 0, 
        p: 1, 
        pt: 0, 
        backgroundColor: 'background.default' 
      }}>
        <CrudToolbar
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={handleRefresh}
          onClose={handleClose}
          editDisabled={!selected}
          deleteDisabled={!selected}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </Box>

      {/* Dialogs */}
      <FormDialog ... />
      <ConfirmDialog ... />
      <ErrorSnackbar />
    </Box>
  )
}
```

### ❌ SAI - Các pattern cần tránh:

```typescript
// SAI 1: Grid container có overflow: auto
<Box sx={{ flex: 1, p: 1, overflow: 'auto' }}>
  <AppGrid ... />
</Box>

// SAI 2: Toolbar không có flexShrink: 0
<Box>
  <CrudToolbar ... />
</Box>

// SAI 3: Container chính không có overflow: hidden
<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
  ...
</Box>

// SAI 4: Sử dụng PageHeader (không cần thiết, tab title đã đủ)
<PageHeader title="Quản lý người dùng" />
```

### Quy tắc bắt buộc:

1. **Container chính**:
   - `height: '100%'` - chiếm toàn bộ chiều cao
   - `minHeight: 0` - cho phép flex shrink
   - `display: 'flex', flexDirection: 'column'` - layout dọc
   - `overflow: 'hidden'` - ngăn scroll toàn form

2. **Grid area**:
   - `flex: 1` - chiếm không gian còn lại
   - `minHeight: 0` - cho phép shrink
   - `overflow: 'hidden'` - grid tự quản lý scroll
   - Padding: `p: 1, pb: 0` - không padding bottom để sát toolbar

3. **Toolbar area**:
   - `flexShrink: 0` - không bị co lại
   - `p: 1, pt: 0` - không padding top để sát grid
   - `backgroundColor: 'background.default'` - nền riêng

4. **KHÔNG sử dụng PageHeader** - tab title đã đủ

### Lợi ích:

- Grid scroll độc lập, không ảnh hưởng toolbar
- Toolbar luôn hiển thị ở bottom, không bị cuộn
- Không chèn vào StatusBar của AppShell
- Layout giống Windows Forms chuẩn
- Responsive tốt trên mọi kích thước màn hình

### Khi refactor module cũ:

1. Xóa import `PageHeader` nếu có
2. Xóa `<PageHeader />` khỏi JSX
3. Thay đổi container chính theo pattern trên
4. Di chuyển grid vào vùng flex: 1
5. Di chuyển toolbar vào vùng flexShrink: 0
6. Kiểm tra padding để grid và toolbar sát nhau

## AG Grid Configuration Standard

**CRITICAL RULE**: AG Grid v32.2+ đã deprecated string values cho `rowSelection`. PHẢI sử dụng object format.

### ❌ KHÔNG BAO GIỜ làm như thế này:

```typescript
// DEPRECATED - Sẽ có warning trong console
<AgGridReact
  rowSelection="single"
  suppressRowClickSelection={false}
  ...
/>
```

### ✅ ĐÚNG - Sử dụng object format:

```typescript
<AgGridReact
  rowSelection={{
    mode: 'singleRow',
    enableClickSelection: true,
  }}
  // Không cần suppressRowClickSelection nữa
  ...
/>
```

### Các giá trị rowSelection mode:

- `'singleRow'` - chọn 1 dòng (thay cho "single")
- `'multiRow'` - chọn nhiều dòng (thay cho "multiple")

### enableClickSelection:

- `true` - cho phép click vào dòng để chọn (thay cho `suppressRowClickSelection={false}`)
- `false` - chỉ chọn qua checkbox

### Vietnamese Localization:

Tất cả AG Grid PHẢI có `localeText` tiếng Việt đầy đủ:

```typescript
<AgGridReact
  localeText={{
    // Pagination
    page: 'Trang',
    of: 'của',
    to: 'đến',
    more: 'thêm',
    next: 'Tiếp',
    last: 'Cuối',
    first: 'Đầu',
    previous: 'Trước',
    loadingOoo: 'Đang tải...',
    ariaPageSizeSelectorLabel: 'Kích thước trang',
    pageSizeSelectorLabel: 'Kích thước trang',
    
    // Selection
    selectAll: 'Chọn tất cả',
    searchOoo: 'Tìm kiếm...',
    blanks: 'Trống',
    noRowsToShow: 'Không có dữ liệu',
    
    // Filters
    filterOoo: 'Lọc...',
    equals: 'Bằng',
    notEqual: 'Không bằng',
    lessThan: 'Nhỏ hơn',
    greaterThan: 'Lớn hơn',
    contains: 'Chứa',
    notContains: 'Không chứa',
    startsWith: 'Bắt đầu với',
    endsWith: 'Kết thúc với',
    applyFilter: 'Áp dụng',
    resetFilter: 'Đặt lại',
    clearFilter: 'Xóa',
  }}
/>
```

### Khi nào cần sửa:

- Thấy warning "AG Grid: As of version 32.2.1, using `rowSelection` with the values "single" or "multiple" has been deprecated"
- Thấy `rowSelection="single"` hoặc `rowSelection="multiple"`
- Thấy `suppressRowClickSelection` prop
- AG Grid không có localeText hoặc thiếu các key

## CrudToolbar Print & Export Excel Implementation

**CRITICAL RULE**: Tất cả CrudToolbar PHẢI có chức năng in và xuất Excel thật, KHÔNG được chỉ `console.log`.

### ❌ KHÔNG BAO GIỜ làm như thế này:

```typescript
<CrudToolbar
  onPrint={() => console.log('In')}
  onExportExcel={() => console.log('Xuất Excel')}
/>
```

### ✅ ĐÚNG - Implement đầy đủ:

```typescript
// 1. Tạo handlePrint function
const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tiêu đề báo cáo</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #1976d2; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #1976d2; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .print-date { text-align: right; font-size: 12px; color: #666; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>TIÊU ĐỀ BÁO CÁO</h1>
      <table>
        <thead>
          <tr>
            <th>Cột 1</th>
            <th>Cột 2</th>
            <th>Cột 3</th>
          </tr>
        </thead>
        <tbody>
          ${filteredData.map(item => `
            <tr>
              <td>${item.field1}</td>
              <td>${item.field2}</td>
              <td>${item.field3}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="print-date">Ngày in: ${new Date().toLocaleString('vi-VN')}</div>
    </body>
    </html>
  `

  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

// 2. Tạo handleExportExcel function
const handleExportExcel = () => {
  const headers = ['Cột 1', 'Cột 2', 'Cột 3']
  const rows = filteredData.map(item => [
    item.field1,
    item.field2,
    item.field3
  ])

  let csv = headers.join(',') + '\n'
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n'
  })

  // UTF-8 BOM để Excel hiển thị đúng tiếng Việt
  const BOM = '﻿'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `ten-file-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

// 3. Kết nối với CrudToolbar
<CrudToolbar
  onPrint={handlePrint}
  onExportExcel={handleExportExcel}
/>
```

### Quy tắc bắt buộc:

1. **Print function**:
   - Mở window mới với `window.open('', '_blank')`
   - HTML có style đầy đủ (table borders, colors, padding)
   - Tiêu đề in hoa, căn giữa, màu primary
   - Table có header màu xanh, dòng chẵn màu xám nhạt
   - Footer có ngày giờ in (format vi-VN)
   - Delay 250ms trước khi gọi `print()` để đảm bảo render xong

2. **Export Excel function**:
   - Format CSV với headers
   - Wrap mỗi cell trong quotes `"${cell}"` để tránh lỗi với dấu phẩy
   - **BẮT BUỘC**: Thêm UTF-8 BOM (`﻿`) để Excel hiển thị đúng tiếng Việt
   - Filename có date stamp format ISO (YYYY-MM-DD)
   - Extension `.csv` (Excel tự động mở)

3. **Data source**:
   - Sử dụng `filteredData` (đã qua search filter) chứ không phải raw data
   - Map đúng fields theo thứ tự columns
   - Format giá trị (boolean → text, number → string, date → locale)

### Khi nào cần implement:

- Module mới tạo có CrudToolbar
- Thấy `console.log('In')` hoặc `console.log('Xuất Excel')`
- User report nút Print/Export không hoạt động
- Refactor module cũ

### Template HTML cho Print:

- Font: Arial, sans-serif
- Padding body: 20px
- H1: center, color #1976d2
- Table: width 100%, border-collapse
- TH: background #1976d2, color white
- TD: border 1px solid #ddd, padding 8px
- TR even: background #f2f2f2
- Print date: right align, font-size 12px, color #666

