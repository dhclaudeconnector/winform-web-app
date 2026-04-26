'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { useAppStore } from '@/lib/store/uiStore'
import { usePermissionStore } from '@/lib/store/permissionStore'

export function MainClient() {
  const [mounted, setMounted] = useState(false)
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const loadPermissions = usePermissionStore((state) => state.loadPermissions)
  const isLoaded = usePermissionStore((state) => state.isLoaded)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // If authenticated but permissions not loaded, load them
    if (mounted && isAuthenticated && !isLoaded) {
      loadPermissions().catch(() => {
        // If loading permissions fails, session might be expired
        // User will need to login again
      })
    }
  }, [mounted, isAuthenticated, isLoaded, loadPermissions])

  if (!mounted) {
    return null
  }

  return isAuthenticated ? <AppShell /> : <LoginScreen />
}
