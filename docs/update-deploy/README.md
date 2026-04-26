# Update & Deployment System

Hệ thống tự động cập nhật và triển khai cho phép khách hàng cập nhật ứng dụng mà không cần developer truy cập server.

## Tài liệu

- **[Quick Start Guide](./QUICK-START-UPDATE.md)** - Hướng dẫn nhanh cho developer và khách hàng
- **[Full Documentation](./UPDATE-SYSTEM.md)** - Tài liệu đầy đủ về hệ thống
- **[Migration Guide](./MIGRATION-GUIDE.md)** - Hướng dẫn tạo và quản lý migrations
- **[Docker Deployment](./DOCKER-DEPLOYMENT.md)** - Triển khai với Docker
- **[PM2 Deployment](./PM2-DEPLOYMENT.md)** - Triển khai với PM2

## Tính năng chính

✅ Auto-check từ Git repository (GitHub/GitLab)  
✅ Manual upload (offline fallback)  
✅ Smart migrations (AUTO/MANUAL classification)  
✅ Hybrid deployment (Docker/PM2/Native)  
✅ Automatic rollback on failure  
✅ Web UI cho admin  

## Quick Commands

```bash
# Tạo migration
npm run migration:create -- --type auto --risk low --name "add_feature"

# Build release
npm run build:release -- --version 1.1.0 --message "New features"

# Publish release
npm run release:publish -- --version 1.1.0

# Check migration status
npm run migration:status
```

## Architecture

```
Git Repository → Auto-check (6h) → Update Service → Deploy → Health Check
                                          ↓
                                    Migrations
                                    (AUTO/MANUAL)
```

## Support

- Check logs: `docker logs winform-backend` or `pm2 logs`
- Migration status: `npm run migration:status`
- API health: `GET /health`
- Update status: `GET /api/update/status`
