# Tasks Directory

## Mục đích

Thư mục này chứa hệ thống quản lý task cho dự án WinForm Web App.

## Cấu trúc

```
tasks/
├── README.md           # File này - Giới thiệu về tasks directory
├── task.md             # Template và quy trình thực hiện task
└── [task-id].md        # Các task cụ thể (sẽ được tạo khi có task mới)
```

## Cách sử dụng

### Cho User (Người giao task)

1. Mở file `task.md`
2. Tìm section **"TASK HIỆN TẠI"**
3. Điền thông tin:
   - Task ID (ví dụ: TASK-001, FEATURE-123)
   - Mô tả yêu cầu chi tiết
   - Đánh dấu phạm vi (Frontend/Backend/Full-stack)
4. Gửi message cho Agent: "Thực hiện task trong tasks/task.md"

### Cho Agent (AI Assistant)

Khi nhận được yêu cầu thực hiện task:

1. **ĐỌC** `tasks/task.md` từ đầu đến cuối
2. **THỰC HIỆN** theo đúng 6 bước:
   - Bước 1: Đọc các file qui tắc bắt buộc
   - Bước 2: Phân tích task
   - Bước 3: Thực hiện task
   - Bước 4: Kiểm tra sau khi code
   - Bước 5: Rà soát toàn bộ dự án (nếu cần)
   - Bước 6: Báo cáo trạng thái task
3. **BÁO CÁO** kết quả theo format chuẩn

## Ví dụ Task Flow

### Ví dụ 1: Tạo module mới

```markdown
### Task ID: FEATURE-001

### Mô tả yêu cầu:
Tạo module quản lý Phòng khám với các chức năng:
- Thêm/sửa/xóa phòng khám
- Tìm kiếm phòng khám
- In danh sách
- Xuất Excel

### Phạm vi dự kiến:
- [x] Frontend only
- [ ] Backend only
- [ ] Full-stack
- [ ] Database migration required
```

Agent sẽ:
1. Đọc `frontend/agents.md` để biết pattern
2. Tạo `frontend/src/components/modules/ClinicsModule.tsx`
3. Implement đầy đủ CRUD, Print, Export
4. Test trên UI
5. Báo cáo kết quả

### Ví dụ 2: Fix bug

```markdown
### Task ID: BUG-042

### Mô tả yêu cầu:
Fix lỗi: Khi click nút Sửa trong module Bệnh nhân, form dialog không hiển thị đúng dữ liệu

### Phạm vi dự kiến:
- [x] Frontend only
- [ ] Backend only
- [ ] Full-stack
- [ ] Database migration required
```

Agent sẽ:
1. Đọc `frontend/src/components/modules/PatientsModule.tsx`
2. Debug logic handleEdit
3. Fix bug
4. Test lại chức năng Sửa
5. Báo cáo kết quả

### Ví dụ 3: Thêm API endpoint

```markdown
### Task ID: API-015

### Mô tả yêu cầu:
Thêm API endpoint GET /api/statistics/dashboard để lấy thống kê tổng quan:
- Tổng số bệnh nhân
- Tổng số phòng khám
- Tổng số nhân viên
- Doanh thu tháng này

### Phạm vi dự kiến:
- [ ] Frontend only
- [ ] Backend only
- [x] Full-stack
- [ ] Database migration required
```

Agent sẽ:
1. Tạo `backend/src/routes/statistics.routes.js`
2. Implement endpoint với authentication
3. Tạo `frontend/src/lib/api/statistics.service.ts`
4. Test API call từ frontend
5. Báo cáo kết quả

## Lưu trữ Task

Sau khi task hoàn thành, agent có thể tạo file riêng:

```bash
tasks/
├── task.md                    # Template chính
├── FEATURE-001-clinics.md     # Task đã hoàn thành
├── BUG-042-patient-edit.md    # Bug đã fix
└── API-015-dashboard-stats.md # API đã implement
```

Mỗi file task riêng sẽ chứa:
- Mô tả yêu cầu ban đầu
- Các file đã thay đổi
- Checklist đã hoàn thành
- Kết quả kiểm tra
- Lưu ý đặc biệt

## Quick Commands

```bash
# Xem task hiện tại
cat tasks/task.md | grep -A 20 "TASK HIỆN TẠI"

# Tạo task mới từ template
cp tasks/task.md tasks/FEATURE-XXX.md

# List tất cả tasks
ls -la tasks/

# Tìm task theo ID
grep -r "FEATURE-001" tasks/
```

## Liên hệ

Nếu có thắc mắc về quy trình task, tham khảo:
- `tasks/task.md` - Quy trình chi tiết
- `frontend/agents.md` - Qui tắc frontend
- `memory/MEMORY.md` - Memory và preferences
