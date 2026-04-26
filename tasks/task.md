# Task Management System

## Mục đích

File này định nghĩa quy trình thực hiện task cho dự án WinForm Web App. Agent phải đọc và tuân thủ tất cả các bước trước khi bắt đầu và sau khi hoàn thành task.

---

## 📋 BƯỚC 1: ĐỌC CÁC FILE QUI TẮC BẮT BUỘC

Trước khi thực hiện BẤT KỲ task nào, agent PHẢI đọc các file sau theo thứ tự:

### 1.1. Qui tắc Frontend
- **File**: `frontend/agents.md`
- **Nội dung**: 
  - API Client usage (apiClient)
  - Error handling (useApiError)
  - Module layout pattern (Windows Forms dock bottom)
  - AG Grid configuration standard
  - Print & Export Excel implementation
  - Environment variables

### 1.2. Qui tắc Backend
- **File**: `backend/RULES.md` (nếu có)
- **Nội dung**:
  - API endpoint conventions
  - Database query patterns
  - Authentication & authorization
  - Error response format

### 1.3. Memory & Preferences
- **File**: `C:\Users\ongtr\.claude\projects\h--nodejs-tester-winform-web-app\memory\MEMORY.md`
- **Nội dung**:
  - User preferences
  - Project feedback
  - Layout standards
  - Icon standards
  - Reference documents

### 1.4. Cấu trúc dự án
```
winform-web-app/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   ├── components/
│   │   │   ├── common/             # Shared components (CrudToolbar, AppGrid, FormDialog)
│   │   │   ├── layout/             # Layout components (AppShell, SidebarExplorer, TabWorkspace)
│   │   │   └── modules/            # Business modules (UsersModule, PatientsModule, etc.)
│   │   ├── lib/
│   │   │   ├── api/                # API service files
│   │   │   ├── store/              # Zustand stores (uiStore, permissionStore)
│   │   │   ├── apiClient.ts        # HTTP client wrapper
│   │   │   └── config/             # Configuration files
│   │   └── hooks/                  # Custom React hooks (useApiError, usePermission)
│   ├── agents.md                   # Frontend development rules
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/                 # Express routes
│   │   ├── middleware/             # Authentication, error handling
│   │   ├── config/                 # Database, environment config
│   │   └── server.js               # Entry point
│   └── package.json
└── tasks/
    └── task.md                     # This file
```

---

## 📝 BƯỚC 2: PHÂN TÍCH TASK

Khi nhận task mới, agent phải:

### 2.1. Xác định phạm vi
- [ ] Task này ảnh hưởng Frontend, Backend, hay cả hai?
- [ ] Task này tạo module mới hay sửa module hiện có?
- [ ] Task này cần thêm API endpoint mới không?
- [ ] Task này cần migration database không?

### 2.2. Xác định dependencies
- [ ] Cần đọc thêm file nào để hiểu context?
- [ ] Module này phụ thuộc vào module nào khác?
- [ ] API endpoint nào cần gọi?
- [ ] Database table nào liên quan?

### 2.3. Checklist trước khi code
- [ ] Đã đọc `frontend/agents.md`
- [ ] Đã đọc memory files
- [ ] Đã hiểu rõ yêu cầu task
- [ ] Đã xác định phạm vi thay đổi (chỉ 1 form hay toàn bộ?)
- [ ] Đã kiểm tra module tương tự để tham khảo pattern

---

## 🔨 BƯỚC 3: THỰC HIỆN TASK

### 3.1. Nếu tạo module Frontend mới

**Checklist bắt buộc:**

- [ ] **Layout pattern**: Tuân thủ Windows Forms dock bottom
  ```typescript
  <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    {/* Grid area - flex: 1 */}
    <Box sx={{ flex: 1, minHeight: 0, p: 1, pb: 0, overflow: 'hidden' }}>
      <AppGrid ... />
    </Box>
    
    {/* Toolbar area - flexShrink: 0 */}
    <Box sx={{ flexShrink: 0, p: 1, pt: 0, backgroundColor: 'background.default' }}>
      <CrudToolbar ... />
    </Box>
  </Box>
  ```

- [ ] **API calls**: Sử dụng `apiClient` từ `@/lib/apiClient`
  ```typescript
  import { apiClient } from '@/lib/apiClient'
  
  const { data } = useQuery({
    queryKey: ['resource'],
    queryFn: () => apiClient.get<Type[]>('/api/endpoint')
  })
  ```

- [ ] **Error handling**: Sử dụng `useApiError` hook
  ```typescript
  const { handleError, ErrorSnackbar } = useApiError()
  
  const mutation = useMutation({
    mutationFn: ...,
    onError: (error) => handleError(error, 'tên hành động')
  })
  
  // Render ErrorSnackbar ở cuối component
  <ErrorSnackbar />
  ```

- [ ] **AG Grid config**: Sử dụng object format cho rowSelection
  ```typescript
  <AgGridReact
    rowSelection={{
      mode: 'singleRow',
      enableClickSelection: true,
    }}
    localeText={{
      page: 'Trang',
      of: 'của',
      // ... full Vietnamese translation
    }}
  />
  ```

- [ ] **Print function**: Implement đầy đủ với HTML template
  ```typescript
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tiêu đề</title>
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
        <h1>TIÊU ĐỀ</h1>
        <table>...</table>
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
  ```

- [ ] **Export Excel function**: CSV với UTF-8 BOM
  ```typescript
  const handleExportExcel = () => {
    const headers = ['Cột 1', 'Cột 2']
    const rows = filteredData.map(item => [item.field1, item.field2])
    
    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })
    
    const BOM = '﻿'  // UTF-8 BOM - BẮT BUỘC
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ten-file-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }
  ```

- [ ] **KHÔNG sử dụng PageHeader** - tab title đã đủ

### 3.2. Nếu tạo API endpoint Backend mới

**Checklist bắt buộc:**

- [ ] **Route file**: Tạo trong `backend/src/routes/`
- [ ] **Authentication**: Sử dụng middleware `authenticateToken`
- [ ] **Error handling**: Sử dụng try-catch và trả về format chuẩn
  ```javascript
  try {
    // logic
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    })
  }
  ```

- [ ] **CORS**: Đảm bảo endpoint cho phép credentials
- [ ] **Validation**: Validate input trước khi xử lý
- [ ] **Database connection**: Sử dụng pool connection, đóng kết nối sau khi dùng

### 3.3. Nếu sửa module hiện có

**Checklist bắt buộc:**

- [ ] Đọc toàn bộ file hiện tại để hiểu logic
- [ ] Kiểm tra xem có ảnh hưởng đến module khác không
- [ ] Giữ nguyên pattern hiện có (trừ khi pattern sai qui tắc)
- [ ] Test kỹ các chức năng cũ không bị break

---

## ✅ BƯỚC 4: KIỂM TRA SAU KHI CODE

### 4.1. Kiểm tra Frontend

- [ ] **Build thành công**: `cd frontend && npm run build`
- [ ] **Không có TypeScript errors**
- [ ] **Không có console warnings** (đặc biệt AG Grid deprecation)
- [ ] **Layout đúng**: Grid scroll độc lập, toolbar luôn hiển thị bottom
- [ ] **Responsive**: Test trên mobile (sidebar overlay) và desktop
- [ ] **Dark mode**: Test cả light và dark mode

### 4.2. Kiểm tra Backend

- [ ] **Server start thành công**: `cd backend && npm start`
- [ ] **Endpoint trả về đúng format**: `{ success: true, data: ... }`
- [ ] **Authentication hoạt động**: Token được verify đúng
- [ ] **Database query không lỗi**: Kiểm tra console log
- [ ] **CORS headers đúng**: Frontend gọi được API

### 4.3. Kiểm tra tích hợp Frontend-Backend

- [ ] **API endpoint khớp**: Frontend gọi đúng URL backend expose
- [ ] **Data format khớp**: Interface TypeScript khớp với response JSON
- [ ] **Error handling hoạt động**: Lỗi từ backend hiển thị đúng trên UI
- [ ] **Loading state**: Hiển thị loading khi fetch data
- [ ] **Empty state**: Hiển thị "Không có dữ liệu" khi array rỗng

### 4.4. Kiểm tra chức năng CRUD đầy đủ

- [ ] **Create**: Thêm mới record thành công, grid refresh
- [ ] **Read**: Load danh sách đúng, pagination hoạt động
- [ ] **Update**: Sửa record thành công, grid refresh, row vẫn được chọn
- [ ] **Delete**: Xóa record thành công, confirm dialog hiển thị
- [ ] **Search**: Filter hoạt động đúng
- [ ] **Print**: Mở window mới, hiển thị đúng data, có thể in
- [ ] **Export Excel**: Download file CSV, mở được bằng Excel, tiếng Việt hiển thị đúng

### 4.5. Kiểm tra tuân thủ qui tắc

- [ ] **Đọc lại `frontend/agents.md`**: Đối chiếu từng rule
- [ ] **Đọc lại memory files**: Đảm bảo không vi phạm feedback
- [ ] **Kiểm tra icon usage**: Sử dụng đúng icon theo `reference_icon_standards.md`
- [ ] **Kiểm tra layout**: Tuân thủ `feedback_sidebar_layout.md` và `feedback_crudtoolbar_layout.md`

---

## 🔍 BƯỚC 5: RÀ SOÁT TOÀN BỘ DỰ ÁN (nếu task ảnh hưởng nhiều file)

### 5.1. Khi nào cần rà soát toàn bộ?

- Task thay đổi shared component (AppGrid, CrudToolbar, FormDialog)
- Task thay đổi apiClient hoặc error handling
- Task thay đổi authentication flow
- Task thay đổi layout pattern
- Task fix bug ảnh hưởng nhiều module

### 5.2. Checklist rà soát toàn bộ

- [ ] **Grep tất cả usages**: Tìm tất cả file sử dụng component/function đã sửa
  ```bash
  cd frontend/src
  grep -r "AppGrid" --include="*.tsx" --include="*.ts"
  grep -r "apiClient" --include="*.tsx" --include="*.ts"
  grep -r "useApiError" --include="*.tsx" --include="*.ts"
  ```

- [ ] **Test từng module**: Mở từng module trên UI, test CRUD cơ bản
- [ ] **Kiểm tra console**: Không có error/warning nào
- [ ] **Kiểm tra network tab**: Tất cả API calls thành công
- [ ] **Kiểm tra responsive**: Sidebar, grid, toolbar hoạt động đúng trên mobile

### 5.3. Khi nào chỉ cần test module theo task?

- Task chỉ thêm/sửa 1 module cụ thể
- Task không động đến shared components
- Task không thay đổi API client hoặc error handling
- Task không ảnh hưởng layout pattern

---

## 📊 BƯỚC 6: BÁO CÁO TRẠNG THÁI TASK

Sau khi hoàn thành tất cả các bước, agent phải báo cáo theo format:

### Format báo cáo:

```markdown
## ✅ Task hoàn thành: [Tên task]

### Phạm vi thực hiện:
- Frontend: [Liệt kê files đã sửa/tạo]
- Backend: [Liệt kê files đã sửa/tạo]
- Database: [Có migration không? Table nào?]

### Checklist hoàn thành:
- [x] Đọc qui tắc frontend/agents.md
- [x] Đọc memory files
- [x] Layout pattern đúng chuẩn
- [x] API client sử dụng đúng
- [x] Error handling đầy đủ
- [x] AG Grid config không deprecated
- [x] Print function hoạt động
- [x] Export Excel hoạt động (UTF-8 BOM)
- [x] Build frontend thành công
- [x] Backend start thành công
- [x] Frontend-Backend tích hợp đúng
- [x] Test CRUD đầy đủ
- [x] Không có console errors/warnings
- [x] Responsive hoạt động
- [x] Dark mode hoạt động

### Kết quả kiểm tra:
- Build status: ✅ Success / ❌ Failed
- TypeScript errors: 0
- Console warnings: 0
- API endpoints tested: [Liệt kê]
- Modules tested: [Liệt kê]

### Lưu ý:
- [Ghi chú đặc biệt nếu có]
- [Breaking changes nếu có]
- [TODO items nếu còn việc chưa xong]
```

---

## 📌 TASK HIỆN TẠI

### Task ID: [Để trống - User sẽ điền]

### Mô tả yêu cầu:
```
[User điền yêu cầu task ở đây]
```

### Phạm vi dự kiến:
- [ ] Frontend only
- [ ] Backend only
- [ ] Full-stack (cả Frontend và Backend)
- [ ] Database migration required

### Files cần đọc trước:
- [ ] frontend/agents.md
- [ ] memory/MEMORY.md
- [ ] [Thêm file khác nếu cần]

### Checklist thực hiện:
- [ ] Bước 1: Đọc qui tắc
- [ ] Bước 2: Phân tích task
- [ ] Bước 3: Thực hiện code
- [ ] Bước 4: Kiểm tra sau khi code
- [ ] Bước 5: Rà soát (nếu cần)
- [ ] Bước 6: Báo cáo trạng thái

---

## 🔗 QUICK LINKS

### Frontend
- Rules: `frontend/agents.md`
- Components: `frontend/src/components/`
- Modules: `frontend/src/components/modules/`
- API Client: `frontend/src/lib/apiClient.ts`
- Stores: `frontend/src/lib/store/`

### Backend
- Routes: `backend/src/routes/`
- Server: `backend/src/server.js`
- Middleware: `backend/src/middleware/`

### Memory
- Main index: `C:\Users\ongtr\.claude\projects\h--nodejs-tester-winform-web-app\memory\MEMORY.md`
- Feedback: `memory/feedback_*.md`
- Reference: `memory/reference_*.md`

### Commands
```bash
# Frontend
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Lint check

# Backend
cd backend
npm start            # Start server
npm run dev          # Development with nodemon

# Full stack
# Terminal 1: cd backend && npm start
# Terminal 2: cd frontend && npm run dev
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **KHÔNG BAO GIỜ skip bước đọc qui tắc** - Đây là bước bắt buộc
2. **KHÔNG BAO GIỜ dùng `fetch` trực tiếp** - Phải dùng `apiClient`
3. **KHÔNG BAO GIỜ dùng `console.log` cho Print/Export** - Phải implement thật
4. **KHÔNG BAO GIỜ dùng `rowSelection="single"` deprecated** - Phải dùng object format
5. **KHÔNG BAO GIỜ quên UTF-8 BOM** khi export CSV - Excel sẽ lỗi font tiếng Việt
6. **KHÔNG BAO GIỜ dùng PageHeader** trong module - Tab title đã đủ
7. **LUÔN LUÔN test trên UI thật** - Không chỉ build pass là đủ
8. **LUÔN LUÔN kiểm tra responsive** - Mobile và desktop
9. **LUÔN LUÔN kiểm tra dark mode** - Light và dark theme
10. **LUÔN LUÔN báo cáo đầy đủ** - Theo format ở Bước 6
