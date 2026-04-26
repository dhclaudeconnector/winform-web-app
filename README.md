# WinForm Web App

Modern web application với Windows Forms-style UI, built with Next.js và Node.js.

## Features

- ✅ Windows Forms-style MenuStrip navigation
- ✅ Role-based permission system
- ✅ Auto-update system with Git integration
- ✅ Smart database migrations (AUTO/MANUAL)
- ✅ Hybrid deployment (Docker/PM2/Native)
- ✅ PWA support
- ✅ Vietnamese localization

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Material-UI (MUI)
- AG Grid
- Zustand (state management)
- React Query

### Backend
- Node.js 20
- Express 5
- PostgreSQL
- JWT authentication
- Helmet security

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 12+
- Docker (optional)

### Installation

1. **Clone repository**
```bash
git clone <repo-url>
cd winform-web-app
```

2. **Setup backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
```

3. **Setup frontend**
```bash
cd frontend
npm install
```

4. **Initialize database**
```bash
# Run init migration
psql -d your_database -f backend/migrations/001_auto_low_init_permissions.sql
```

5. **Start development**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access application**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health

## Production Deployment

### Option 1: Docker (Recommended)

```bash
# Configure environment
cp .env.example .env
nano .env

# Start containers
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

See [Docker Deployment Guide](./docs/update-deploy/DOCKER-DEPLOYMENT.md)

### Option 2: PM2

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start ecosystem.config.js

# Start frontend
cd frontend
npm run build
pm2 start npm --name "winform-frontend" -- start

# Save configuration
pm2 save
pm2 startup
```

See [PM2 Deployment Guide](./docs/update-deploy/PM2-DEPLOYMENT.md)

## Auto-Update System

Hệ thống tự động cập nhật cho phép khách hàng update mà không cần developer access.

### For Developers

```bash
# 1. Create migration
npm run migration:create -- --type auto --risk low --name "add_feature"

# 2. Build release
npm run build:release -- --version 1.1.0 --message "New features"

# 3. Publish to Git
npm run release:publish -- --version 1.1.0
```

### For Customers

1. Enable auto-update in `.env`:
```bash
UPDATE_CHECK_ENABLED=true
GIT_RELEASE_URL=https://github.com/user/repo
```

2. System auto-checks every 6 hours
3. Notification appears when update available
4. Admin reviews and approves via UI
5. System auto-updates with rollback on failure

See [Update System Documentation](./docs/update-deploy/UPDATE-SYSTEM.md)

## Project Structure

```
winform-web-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── migrationService.js
│   │   │   ├── updateService.js
│   │   │   ├── versionService.js
│   │   │   ├── deploymentDetector.js
│   │   │   └── gitUpdateChecker.js
│   │   └── utils/           # Utilities
│   ├── migrations/          # Database migrations
│   └── ecosystem.config.js  # PM2 config
├── frontend/
│   └── src/
│       ├── app/             # Next.js app router
│       ├── components/      # React components
│       │   ├── admin/       # Admin components
│       │   ├── common/      # Shared components
│       │   └── layout/      # Layout components
│       └── lib/             # Libraries
│           ├── api/         # API clients
│           ├── hooks/       # Custom hooks
│           └── store/       # State management
├── scripts/
│   ├── create-migration.js  # Create migration
│   ├── build-release.js     # Build release
│   └── publish-release.js   # Publish release
├── docs/
│   └── update-deploy/       # Documentation
├── backups/                 # Auto-created
├── update-temp/             # Auto-created
├── .release/                # Auto-created
├── docker-compose.yml
├── version.json
└── CHANGELOG.md
```

## Documentation

- [Update System](./docs/update-deploy/UPDATE-SYSTEM.md) - Complete update system guide
- [Quick Start](./docs/update-deploy/QUICK-START-UPDATE.md) - Quick start for updates
- [Migration Guide](./docs/update-deploy/MIGRATION-GUIDE.md) - Database migration guide
- [Docker Deployment](./docs/update-deploy/DOCKER-DEPLOYMENT.md) - Docker setup
- [PM2 Deployment](./docs/update-deploy/PM2-DEPLOYMENT.md) - PM2 setup

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Permissions
- `GET /api/permissions/my-permissions` - Get user permissions
- `GET /api/permissions/my-modules` - Get accessible modules
- `GET /api/permissions/my-favorites` - Get favorite menus

### Update System
- `GET /api/update/check` - Check for updates
- `GET /api/update/status` - Get update status
- `GET /api/update/migrations/pending` - Get pending migrations
- `POST /api/update/apply` - Apply update

See [API Documentation](./docs/API.md) for complete list.

## Environment Variables

### Backend (.env)
```bash
# Server
PORT=3001
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Update System
UPDATE_CHECK_ENABLED=true
UPDATE_CHECK_INTERVAL=21600000
GIT_RELEASE_URL=https://github.com/user/repo
GIT_ACCESS_TOKEN=ghp_xxxxx
DEPLOYMENT_TYPE=auto
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Scripts

### Backend
```bash
npm run dev              # Development with hot reload
npm run start            # Production
npm run migration:create # Create migration
npm run migration:run    # Run migrations
npm run migration:status # Check migration status
npm run build:release    # Build release package
npm run release:publish  # Publish to Git
```

### Frontend
```bash
npm run dev    # Development
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Lint code
```

## Contributing

1. Create feature branch
2. Make changes
3. Create migration if needed
4. Test locally
5. Submit pull request

## Security

- JWT authentication
- Role-based access control
- Helmet security headers
- Rate limiting
- Input sanitization
- CORS configuration
- Checksum validation for updates

## License

Private - All rights reserved

## Support

For issues or questions:
- Check documentation in `docs/`
- Review logs: `docker logs` or `pm2 logs`
- Check health: `GET /health`
- Contact: developer@example.com

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.
