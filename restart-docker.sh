#!/bin/bash

echo "=== Bước 1: Dừng containers ==="
docker-compose down

echo ""
echo "=== Bước 2: Rebuild containers (có thể mất vài phút) ==="
docker-compose build --no-cache

echo ""
echo "=== Bước 3: Khởi động lại với volumes mounted ==="
docker-compose up -d

echo ""
echo "=== Bước 4: Đợi containers khởi động ==="
sleep 5

echo ""
echo "=== Bước 5: Kiểm tra logs ==="
echo "Backend logs:"
docker-compose logs --tail=20 backend

echo ""
echo "Frontend logs:"
docker-compose logs --tail=20 frontend

echo ""
echo "=== Bước 6: Kiểm tra files đã mount ==="
echo "Checking backend files..."
docker exec winform-backend ls -la /app/src/routes/permission.routes.js 2>/dev/null && echo "✓ permission.routes.js exists" || echo "✗ permission.routes.js NOT FOUND"
docker exec winform-backend ls -la /app/src/services/permissionService.js 2>/dev/null && echo "✓ permissionService.js exists" || echo "✗ permissionService.js NOT FOUND"

echo ""
echo "Checking frontend files..."
docker exec winform-frontend ls -la /app/src/lib/store/permissionStore.ts 2>/dev/null && echo "✓ permissionStore.ts exists" || echo "✗ permissionStore.ts NOT FOUND"
docker exec winform-frontend ls -la /app/src/lib/hooks/usePermission.ts 2>/dev/null && echo "✓ usePermission.ts exists" || echo "✗ usePermission.ts NOT FOUND"

echo ""
echo "=== Hoàn tất! ==="
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Để xem logs realtime:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f frontend"
