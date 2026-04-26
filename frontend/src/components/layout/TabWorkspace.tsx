'use client'

import { Box, Tab, Tabs, Stack, Typography } from '@mui/material'
import { X } from 'lucide-react'
import { useAppStore } from '@/lib/store/uiStore'
import dynamic from 'next/dynamic'

const UsersModule = dynamic(() => import('@/components/modules/UsersModule').then((mod) => ({ default: mod.UsersModule })), { ssr: false })
const DepartmentsModule = dynamic(() => import('@/components/modules/DepartmentsModule').then((mod) => ({ default: mod.DepartmentsModule })), { ssr: false })
const PatientsModule = dynamic(() => import('@/components/modules/PatientsModule').then((mod) => ({ default: mod.PatientsModule })), { ssr: false })
const RoleManagementModule = dynamic(() => import('@/components/modules/RoleManagementModule').then((mod) => ({ default: mod.RoleManagementModule })), { ssr: false })
const UserPermissionModule = dynamic(() => import('@/components/modules/UserPermissionModule').then((mod) => ({ default: mod.UserPermissionModule })), { ssr: false })

export function TabWorkspace() {
  const openTabs = useAppStore((state) => state.openTabs)
  const activeTabId = useAppStore((state) => state.activeTabId)
  const setActiveTab = useAppStore((state) => state.setActiveTab)
  const closeTab = useAppStore((state) => state.closeTab)
  const mode = useAppStore((state) => state.mode)

  const renderModule = (moduleId: string) => {
    switch (moduleId) {
      case 'users':
        return <UsersModule />
      case 'departments':
        return <DepartmentsModule />
      case 'patients':
        return <PatientsModule />
      case 'role-management':
        return <RoleManagementModule />
      case 'user-permissions':
        return <UserPermissionModule />
      default:
        return <Box sx={{ p: 2, color: 'text.primary' }}>Module: {moduleId}</Box>
    }
  }

  if (openTabs.length === 0) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', color: 'text.secondary' }}>
        Chọn một module từ menu bên trái để bắt đầu
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: mode === 'dark' ? '#1e2936' : '#f6f8fb', display: 'flex', alignItems: 'center' }}>
        <Tabs value={activeTabId} onChange={(_, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto" sx={{ flex: 1 }}>
          {openTabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{tab.title}</Typography>
                  <Box
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 16,
                      height: 16,
                      borderRadius: '2px',
                      cursor: 'pointer',
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        color: 'text.primary',
                      },
                    }}
                  >
                    <X size={12} />
                  </Box>
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: 'background.default' }}>
        {openTabs.map((tab) => (
          <Box key={tab.id} sx={{ display: tab.id === activeTabId ? 'block' : 'none', height: '100%' }}>
            {renderModule(tab.id)}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
