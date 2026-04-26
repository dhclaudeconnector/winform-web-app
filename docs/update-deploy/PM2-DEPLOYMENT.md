# PM2 Deployment Configuration

## Overview

File `ecosystem.config.js` cấu hình PM2 process manager cho backend application.

## Configuration

```javascript
module.exports = {
  apps: [{
    name: 'winform-backend',
    script: './src/server.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

## Usage

### Start application
```bash
cd backend
pm2 start ecosystem.config.js
```

### Restart application
```bash
pm2 restart winform-backend
```

### Reload (zero-downtime)
```bash
pm2 reload winform-backend
```

### Stop application
```bash
pm2 stop winform-backend
```

### View logs
```bash
pm2 logs winform-backend
```

### Monitor
```bash
pm2 monit
```

### Save configuration
```bash
pm2 save
```

### Auto-start on boot
```bash
pm2 startup
# Follow the instructions
pm2 save
```

## Update System Integration

Khi sử dụng PM2, update system sẽ:
1. Auto-detect PM2 environment
2. Use `pm2 reload` để restart (zero-downtime)
3. Preserve environment variables

### Enable auto-update with PM2

```bash
# Set environment variables
export UPDATE_CHECK_ENABLED=true
export GIT_RELEASE_URL=https://github.com/user/repo
export DEPLOYMENT_TYPE=pm2

# Restart with new env
pm2 restart winform-backend --update-env
pm2 save
```

## Configuration Options

### instances
- `1`: Single instance
- `max`: Use all CPU cores
- `2`, `3`, etc.: Specific number

### exec_mode
- `cluster`: Load balancing across instances
- `fork`: Single process

### watch
- `false`: No auto-restart on file changes (production)
- `true`: Auto-restart on file changes (development)

### max_memory_restart
- Restart if memory exceeds limit
- Example: `'500M'`, `'1G'`

## Logs

PM2 logs are stored in:
- Error log: `./logs/pm2-error.log`
- Output log: `./logs/pm2-out.log`

View logs:
```bash
pm2 logs winform-backend --lines 100
```

## Troubleshooting

### Application not starting
```bash
# Check status
pm2 status

# View logs
pm2 logs winform-backend --err

# Restart
pm2 restart winform-backend
```

### High memory usage
```bash
# Check memory
pm2 monit

# Adjust max_memory_restart in ecosystem.config.js
# Restart
pm2 restart winform-backend
```

### Port already in use
```bash
# Check what's using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

## Best Practices

1. **Always use `pm2 save`** after configuration changes
2. **Use `pm2 reload`** instead of `restart` for zero-downtime
3. **Monitor logs** regularly: `pm2 logs`
4. **Set up auto-startup** on server boot
5. **Use environment variables** for configuration
6. **Keep PM2 updated**: `npm install -g pm2@latest`

## See Also

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Update System Documentation](./UPDATE-SYSTEM.md)
- [Deployment Guide](./UPDATE-SYSTEM.md#deployment-types)
