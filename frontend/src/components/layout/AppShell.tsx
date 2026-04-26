'use client'

import { Box, IconButton, useMediaQuery, useTheme, Drawer } from '@mui/material'
import { Menu, X } from 'lucide-react'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { SidebarExplorer } from '@/components/layout/SidebarExplorer'
import { TabWorkspace } from '@/components/layout/TabWorkspace'
import { StatusBar } from '@/components/layout/StatusBar'
import { useAppStore } from '@/lib/store/uiStore'
import { useState } from 'react'

export function AppShell({ children }: { children?: React.ReactNode }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <Box sx={{ height: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr 26px', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {isMobile && (
          <IconButton
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            sx={{ ml: 1, color: 'text.primary' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </IconButton>
        )}
        <Box sx={{ flex: 1 }}>
          <TopNavBar />
        </Box>
      </Box>

      {isMobile ? (
        <>
          <Drawer
            anchor="left"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: 250,
                boxSizing: 'border-box',
              },
            }}
          >
            <SidebarExplorer />
          </Drawer>
          <TabWorkspace />
        </>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: sidebarCollapsed ? '60px 1fr' : '250px 1fr',
            minHeight: 0,
            overflow: 'hidden',
            transition: 'grid-template-columns 0.3s',
          }}
        >
          <SidebarExplorer />
          <TabWorkspace />
        </Box>
      )}

      <StatusBar />
    </Box>
  )
}
