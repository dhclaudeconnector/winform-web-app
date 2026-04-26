import { useEffect, useState } from 'react'
import { updateService, UpdateInfo } from '../api/updateService'

/**
 * Hook to check for updates periodically
 */
export function useUpdateChecker(intervalMs: number = 6 * 60 * 60 * 1000) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkForUpdates = async () => {
    setIsChecking(true)
    setError(null)
    try {
      const info = await updateService.checkForUpdates()
      setUpdateInfo(info)
      return info
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    // Check immediately on mount
    checkForUpdates()

    // Then check periodically
    const interval = setInterval(checkForUpdates, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs])

  return {
    updateInfo,
    isChecking,
    error,
    hasUpdate: updateInfo?.hasUpdate || false,
    checkForUpdates
  }
}
