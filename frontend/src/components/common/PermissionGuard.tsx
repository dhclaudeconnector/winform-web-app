import React from 'react'
import { usePermission } from '@/lib/hooks/usePermission'

interface PermissionGuardProps {
  module: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showMessage?: boolean
}

/**
 * Component bảo vệ quyền - chỉ render children nếu user có quyền
 */
export function PermissionGuard({
  module,
  action,
  children,
  fallback = null,
  showMessage = false,
}: PermissionGuardProps) {
  const { hasPermission } = usePermission(module, action)

  if (!hasPermission) {
    if (showMessage) {
      return (
        <div style={{ padding: '8px', color: '#999', fontSize: '13px' }}>
          Bạn không có quyền {action} trên {module}
        </div>
      )
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}
