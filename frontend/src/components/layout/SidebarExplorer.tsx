'use client'

import React from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material'
import { ChevronDown, FolderOpen, Moon, Sun, PanelLeftClose, PanelLeftOpen, LogOut, User, Star, StarOff } from 'lucide-react'
import { useAppStore } from '@/lib/store/uiStore'
import { useUserModules, useFavorites } from '@/lib/hooks/usePermission'
import { usePermissionStore } from '@/lib/store/permissionStore'

export function SidebarExplorer() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const toggleMode = useAppStore((state) => state.toggleMode)
  const openModule = useAppStore((state) => state.openModule)
  const mode = useAppStore((state) => state.mode)
  const currentUser = useAppStore((state) => state.currentUser)
  const logout = useAppStore((state) => state.logout)
  const [expandedSections, setExpandedSections] = React.useState<string[]>([])

  // Load modules từ permissions
  const { modules, isLoaded } = useUserModules()
  const { favorites, addFavorite, removeFavorite } = useFavorites()
  const clearPermissions = usePermissionStore((state) => state.clearPermissions)

  // Debug: Log modules
  React.useEffect(() => {
    console.log('SidebarExplorer - modules:', modules)
    console.log('SidebarExplorer - isLoaded:', isLoaded)
    console.log('SidebarExplorer - favorites:', favorites)
  }, [modules, isLoaded, favorites])

  // Tổ chức modules theo sections
  const modulesBySection = React.useMemo(() => {
    const sections: Record<string, typeof modules> = {}
    modules.forEach((module) => {
      const section = module.section || 'Khác'
      if (!sections[section]) {
        sections[section] = []
      }
      sections[section].push(module)
    })
    return sections
  }, [modules])

  React.useEffect(() => {
    if (!sidebarCollapsed || isMobile) {
      setExpandedSections(['Thường dùng', ...Object.keys(modulesBySection)])
    } else {
      setExpandedSections([])
    }
  }, [sidebarCollapsed, isMobile, modulesBySection])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    clearPermissions()
    logout()
  }

  const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSections(prev =>
      isExpanded ? [...prev, section] : prev.filter(s => s !== section)
    )
  }

  const isFavorite = (moduleCode: string) => {
    return favorites.some((fav) => fav.code === moduleCode)
  }

  const handleToggleFavorite = async (moduleCode: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      if (isFavorite(moduleCode)) {
        await removeFavorite(moduleCode)
      } else {
        await addFavorite(moduleCode)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const showCollapseButton = !isMobile

  return (
    <Box
      sx={{
        borderRight: '1px solid',
        borderColor: 'divider',
        background: mode === 'dark' ? '#1e2936' : 'linear-gradient(180deg, #ecf2f8 0%, #e0e8f0 100%)',
        width: isMobile ? '100%' : (sidebarCollapsed ? '60px' : '250px'),
        transition: 'width 0.3s',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        {(!sidebarCollapsed || isMobile) && (
          <>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main' }}>Ngày làm việc</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'error.main' }}>
              {new Date().toLocaleTimeString('vi-VN')}
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'error.main' }}>
              {new Date().toLocaleDateString('vi-VN')}
            </Typography>
          </>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {/* Section Thường dùng */}
        {favorites.length > 0 && (
          <Accordion
            expanded={expandedSections.includes('Thường dùng')}
            onChange={handleAccordionChange('Thường dùng')}
            disableGutters
            sx={{ backgroundColor: 'transparent' }}
          >
            <AccordionSummary expandIcon={(!sidebarCollapsed || isMobile) && <ChevronDown size={16} />}>
              {sidebarCollapsed && !isMobile ? (
                <Tooltip title="Thường dùng" placement="right">
                  <Star size={20} />
                </Tooltip>
              ) : (
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'warning.main' }}>⭐ Thường dùng</Typography>
              )}
            </AccordionSummary>
            {(!sidebarCollapsed || isMobile) && (
              <AccordionDetails sx={{ p: 0.5 }}>
                <Stack spacing={0.5}>
                  {favorites.map((module) => (
                    <Box key={module.code} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Button
                        onClick={() => openModule(module.code, module.name)}
                        startIcon={<FolderOpen size={16} />}
                        sx={{ color: 'text.primary', justifyContent: 'flex-start', flex: 1 }}
                      >
                        {module.name}
                      </Button>
                      <IconButton
                        size="small"
                        onClick={(e) => handleToggleFavorite(module.code, e)}
                      >
                        <Star size={14} fill="currentColor" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </AccordionDetails>
            )}
          </Accordion>
        )}

        {/* Các sections khác */}
        {Object.entries(modulesBySection).map(([section, sectionModules]) => (
        <Accordion
          key={section}
          expanded={expandedSections.includes(section)}
          onChange={handleAccordionChange(section)}
          disableGutters
          sx={{ backgroundColor: 'transparent' }}
        >
          <AccordionSummary expandIcon={(!sidebarCollapsed || isMobile) && <ChevronDown size={16} />}>
            {sidebarCollapsed && !isMobile ? (
              <Tooltip title={section} placement="right">
                <FolderOpen size={20} />
              </Tooltip>
            ) : (
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'text.primary' }}>{section}</Typography>
            )}
          </AccordionSummary>
          {(!sidebarCollapsed || isMobile) && (
            <AccordionDetails sx={{ p: 0.5 }}>
              <Stack spacing={0.5}>
                {sectionModules.map((module) => (
                  <Box key={module.code} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Button
                      onClick={() => openModule(module.code, module.name)}
                      startIcon={<FolderOpen size={16} />}
                      sx={{ color: 'text.primary', justifyContent: 'flex-start', flex: 1 }}
                    >
                      {module.name}
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => handleToggleFavorite(module.code, e)}
                    >
                      {isFavorite(module.code) ? (
                        <Star size={14} fill="currentColor" />
                      ) : (
                        <StarOff size={14} />
                      )}
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          )}
        </Accordion>
        ))}
      </Box>

      <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Stack spacing={0.5}>
          {sidebarCollapsed && !isMobile ? (
            <>
              {showCollapseButton && (
                <Tooltip title="Mở rộng" placement="right">
                  <IconButton onClick={toggleSidebar} size="small" sx={{ color: 'text.primary' }}>
                    <PanelLeftOpen size={20} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={mode === 'light' ? 'Chế độ tối' : 'Chế độ sáng'} placement="right">
                <IconButton onClick={toggleMode} size="small" sx={{ color: 'text.primary' }}>
                  {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </IconButton>
              </Tooltip>
              <Tooltip title={`Tài khoản: ${currentUser}`} placement="right">
                <IconButton size="small" sx={{ color: 'text.primary' }}>
                  <User size={20} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Đăng xuất" placement="right">
                <IconButton onClick={handleLogout} size="small" sx={{ color: 'error.main' }}>
                  <LogOut size={20} />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              {showCollapseButton && (
                <Button onClick={toggleSidebar} startIcon={<PanelLeftClose size={16} />} sx={{ color: 'text.primary', justifyContent: 'flex-start' }}>
                  Thu gọn
                </Button>
              )}
              <Button onClick={toggleMode} startIcon={mode === 'light' ? <Moon size={16} /> : <Sun size={16} />} sx={{ color: 'text.primary', justifyContent: 'flex-start' }}>
                {mode === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
              </Button>
              <Box sx={{ px: 1, py: 0.5 }}>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Tài khoản</Typography>
                <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 600 }}>{currentUser}</Typography>
              </Box>
              <Button onClick={handleLogout} startIcon={<LogOut size={16} />} sx={{ color: 'error.main', justifyContent: 'flex-start' }}>
                Đăng xuất
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
