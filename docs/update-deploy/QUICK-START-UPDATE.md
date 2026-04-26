# Quick Start Guide - Auto-Update System

## Cho Developer

### Bước 1: Tạo migration mới

```bash
cd backend
npm run migration:create -- --type auto --risk low --name "add_new_table"
```

### Bước 2: Viết SQL trong file migration

```sql
-- backend/migrations/002_auto_low_add_new_table.sql
BEGIN;

CREATE TABLE IF NOT EXISTS webauth.new_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

COMMIT;
```

### Bước 3: Build release

```bash
npm run build:release -- --version 1.1.0 --message "Thêm tính năng mới"
```

### Bước 4: Publish lên Git

```bash
npm run release:publish -- --version 1.1.0
```

**Hoặc upload thủ công:**
1. Vào GitHub → Releases → New Release
2. Tag: `v1.1.0`
3. Upload file `.release/release-1.1.0.zip`
4. Publish

✅ Xong! Khách hàng sẽ nhận được thông báo update trong vòng 6 giờ.

---

## Cho Khách Hàng

### Lần đầu setup

1. **Thêm vào file `.env`:**

```bash
UPDATE_CHECK_ENABLED=true
GIT_RELEASE_URL=https://github.com/user/repo
```

2. **Restart ứng dụng:**

```bash
# Docker
docker-compose restart

# PM2
pm2 restart winform-backend

# Native
# Restart process
```

### Khi có update mới

1. **Thông báo xuất hiện** trên menu admin (chuông vàng)
2. **Click vào thông báo** → Xem chi tiết update
3. **Review migrations:**
   - ✅ AUTO (màu xanh): Chạy tự động
   - ⚠️ MANUAL (màu vàng): Cần approve
4. **Tick chọn** các MANUAL migrations để approve
5. **Click "Update Now"**
6. **Đợi** progress bar chạy xong
7. **Trang tự động reload** với version mới

### Nếu offline (không có internet)

1. Developer gửi file `release-1.1.0.zip` qua email/USB
2. Vào System → Update Manager
3. Upload file zip
4. Làm theo bước 3-7 ở trên

### Nếu update lỗi

- Hệ thống **tự động rollback** về version cũ
- Hoặc vào Update History → Click "Rollback"

---

## Các loại Migration

### AUTO (Chạy tự động)
- Thêm table mới
- Thêm column mới (nullable)
- Thêm index
- Thêm function

### MANUAL (Cần approve)
- Sửa data
- Xóa column/table
- Update hàng loạt
- Thay đổi cấu trúc quan trọng

---

## Lưu ý

✅ **An toàn:**
- Tự động backup trước khi update
- Tự động rollback nếu lỗi
- Migrations chạy trong transaction

⚠️ **Khuyến nghị:**
- Update vào giờ ít người dùng
- Backup database trước update lớn
- Đọc kỹ MANUAL migrations trước khi approve

---

## Hỗ trợ

**Kiểm tra logs:**
```bash
# Docker
docker logs winform-backend

# PM2
pm2 logs winform-backend
```

**Kiểm tra migration status:**
```bash
npm run migration:status
```

**Liên hệ developer** nếu có vấn đề.
