import { Bell } from 'lucide-react'
import { useUpdateChecker } from '@/lib/hooks/useUpdateChecker'

export function UpdateNotificationBadge() {
  const { hasUpdate, updateInfo } = useUpdateChecker()

  if (!hasUpdate || !updateInfo) {
    return null
  }

  return (
    <div className="relative inline-flex items-center">
      <Bell className="w-5 h-5 text-yellow-500 animate-pulse" />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
      <span className="ml-2 text-sm font-medium text-yellow-600">
        Update available: v{updateInfo.latest}
      </span>
    </div>
  )
}
