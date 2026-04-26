# Auto-Update System Documentation

## Overview

Hệ thống tự động cập nhật cho phép khách hàng cập nhật ứng dụng mà không cần developer truy cập vào server. Hệ thống hỗ trợ:

- ✅ Auto-check từ Git repository (GitHub/GitLab)
- ✅ Manual upload (offline fallback)
- ✅ Smart migrations (AUTO/MANUAL classification)
- ✅ Hybrid deployment (Docker/PM2/Native)
- ✅ Automatic rollback on failure
- ✅ Web UI cho admin

## Architecture

```
Git Repository → Auto-check (6h) → Update Service → Deploy → Health Check
                                          ↓
                                    Migrations
                                    (AUTO/MANUAL)
```

## For Developers

### 1. Create Migration

```bash
cd backend
npm run migration:create -- --type auto --risk low --name "add_audit_table"
```

**Migration types:**
- `auto`: Chạy tự động (CREATE TABLE, ADD COLUMN, CREATE INDEX)
- `manual`: Cần admin approve (UPDATE data, DROP, ALTER)

**Risk levels:**
- `low`: Safe operations
- `medium`: Moderate risk
- `high`: Dangerous operations

### 2. Build Release

```bash
npm run build:release -- --version 1.1.0 --message "Add audit logging"
```

Output: `.release/release-1.1.0.zip`

### 3. Publish to Git

```bash
npm run release:publish -- --version 1.1.0
```

This will:
- Commit version.json
- Create git tag v1.1.0
- Push to remote
- Create GitHub release (if gh CLI available)

### 4. Manual Publish (if gh CLI not available)

1. Go to GitHub → Releases → New Release
2. Tag: `v1.1.0`
3. Upload `release-1.1.0.zip`
4. Publish

## For Customers

### Setup

1. **Configure environment variables** (`.env`):

```bash
# Enable auto-update
UPDATE_CHECK_ENABLED=true
UPDATE_CHECK_INTERVAL=21600000  # 6 hours

# Git repository
GIT_RELEASE_URL=https://github.com/user/repo
GIT_ACCESS_TOKEN=ghp_xxxxx  # For private repos

# Deployment type (auto-detect if not set)
DEPLOYMENT_TYPE=auto  # or docker, pm2, native
```

2. **Restart application** to apply settings

### Update Process

#### Auto-update (Recommended)

1. System checks for updates every 6 hours
2. When new version available → Notification badge appears in admin menu
3. Admin clicks notification → View update details:
   - Changelog
   - Migrations (AUTO/MANUAL)
   - Version comparison
4. Admin approves MANUAL migrations (if any)
5. Admin clicks "Update Now"
6. System automatically:
   - Downloads release
   - Validates checksum
   - Runs AUTO migrations
   - Runs approved MANUAL migrations
   - Deploys code
   - Restarts services
   - Health check
   - Success or auto-rollback

#### Manual upload (Offline)

1. Developer sends `release-1.1.0.zip` via email/USB
2. Admin goes to System → Update Manager
3. Upload zip file
4. Same approval flow as auto-update

### Rollback

If update fails:
- **Automatic rollback**: System auto-rollback on failure
- **Manual rollback**: Admin can rollback from Update History

## Deployment Types

### Docker

```yaml
# docker-compose.yml already configured
services:
  backend:
    volumes:
      - ./backups:/app/backups
      - ./update-temp:/app/update-temp
    environment:
      - UPDATE_CHECK_ENABLED=true
      - DEPLOYMENT_TYPE=docker
```

Restart command: `docker-compose restart`

### PM2

```bash
# Start with PM2
cd backend
pm2 start ecosystem.config.js

# Enable auto-update
export UPDATE_CHECK_ENABLED=true
export DEPLOYMENT_TYPE=pm2
pm2 restart winform-backend --update-env
```

Restart command: `pm2 reload winform-backend`

### Native Node.js

```bash
# Start
cd backend
node src/server.js

# Enable auto-update
export UPDATE_CHECK_ENABLED=true
export DEPLOYMENT_TYPE=native
```

Restart: Process exit and restart by process manager

## API Endpoints

### Check for updates
```
GET /api/update/check
```

### Get status
```
GET /api/update/status
```

### Get pending migrations
```
GET /api/update/migrations/pending
```

### Preview migration SQL
```
GET /api/update/migrations/:version/preview
```

### Approve manual migration
```
POST /api/update/migrations/:version/approve
```

### Apply update
```
POST /api/update/apply
Body: { releaseUrl, version, checksum }
```

### Get progress
```
GET /api/update/progress
```

## Migration Examples

### AUTO Migration (low risk)

```sql
-- 002_auto_low_add_audit_table.sql
BEGIN;

CREATE TABLE IF NOT EXISTS webauth.audit_log (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
```

### MANUAL Migration (high risk)

```sql
-- 003_manual_high_migrate_user_data.sql
BEGIN;

-- Backup first
CREATE TABLE webauth.users_backup AS SELECT * FROM webauth.users;

-- Migrate data
UPDATE webauth.users SET email = LOWER(email);

-- Verify
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM webauth.users WHERE email ~ '[A-Z]') THEN
    RAISE EXCEPTION 'Migration failed: uppercase emails found';
  END IF;
END $$;

COMMIT;
```

## Troubleshooting

### Update check not working

1. Check environment variables:
```bash
echo $UPDATE_CHECK_ENABLED
echo $GIT_RELEASE_URL
```

2. Check logs:
```bash
# Docker
docker logs winform-backend

# PM2
pm2 logs winform-backend

# Native
tail -f logs/app.log
```

### Migration failed

1. Check migration status:
```bash
npm run migration:status
```

2. View error in database:
```sql
SELECT * FROM webauth.schema_migrations WHERE status = 'failed';
```

3. Fix migration and retry

### Update failed and rollback

1. Check backup directory:
```bash
ls -la backups/versions/
```

2. Manual restore if needed:
```bash
cp -r backups/versions/backup-1.0.0-xxx/* .
```

3. Restart services

## Security

- ✅ Admin-only access (SYSTEM.MANAGE permission)
- ✅ Checksum validation
- ✅ Transaction-based migrations
- ✅ Automatic rollback
- ✅ Audit log
- ✅ HTTPS for Git downloads
- ✅ Private repo support (access token)

## Best Practices

### For Developers

1. **Test migrations locally first**
2. **Use AUTO for structure changes**
3. **Use MANUAL for data changes**
4. **Always include rollback instructions in comments**
5. **Keep migrations small and focused**
6. **Test release package before publishing**

### For Customers

1. **Backup database before major updates**
2. **Review all MANUAL migrations carefully**
3. **Update during low-traffic hours**
4. **Monitor logs during update**
5. **Test application after update**
6. **Keep last 3 backups**

## File Structure

```
project/
├── backend/
│   ├── migrations/           # Migration files
│   │   ├── 001_auto_low_init_permissions.sql
│   │   └── README.md
│   ├── src/
│   │   ├── services/
│   │   │   ├── migrationService.js
│   │   │   ├── updateService.js
│   │   │   ├── versionService.js
│   │   │   ├── deploymentDetector.js
│   │   │   └── gitUpdateChecker.js
│   │   └── routes/
│   │       └── update.routes.js
│   └── ecosystem.config.js   # PM2 config
├── frontend/
│   └── src/
│       ├── components/admin/
│       │   ├── UpdateManager.tsx
│       │   └── UpdateNotificationBadge.tsx
│       └── lib/
│           ├── api/updateService.ts
│           └── hooks/useUpdateChecker.ts
├── scripts/
│   ├── create-migration.js
│   ├── build-release.js
│   └── publish-release.js
├── backups/                  # Auto-created
├── update-temp/              # Auto-created
├── .release/                 # Auto-created
└── version.json              # Current version
```

## Support

For issues or questions:
1. Check logs
2. Review migration status
3. Check deployment info: `GET /api/update/deployment-info`
4. Contact developer with error logs

## Changelog

### v1.0.0 (2026-04-26)
- Initial release with auto-update system
- Smart migration system (AUTO/MANUAL)
- Hybrid deployment support (Docker/PM2/Native)
- Git-based auto-check
- Web UI for admin
- Automatic rollback
