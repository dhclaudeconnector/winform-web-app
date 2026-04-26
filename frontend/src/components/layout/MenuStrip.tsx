'use client'

import { Box, Menu, MenuItem, Typography } from '@mui/material'
import { useState, type MouseEvent } from 'react'
import { useAppStore } from '@/lib/store/uiStore'
import { usePermissionStore } from '@/lib/store/permissionStore'
import { authService } from '@/lib/api'

const menuItems = [
  {
    label: 'Hệ thống',
    items: ['Đăng xuất', 'Đổi mật khẩu', 'Cấu hình'],
  },
  {
    label: 'Quản trị người dùng',
    items: ['Danh sách người dùng', 'Phân quyền', 'Nhóm người dùng'],
  },
  {
    label: 'Khai báo số liệu',
    items: ['Danh mục khoa', 'Danh mục phòng', 'Danh mục dịch vụ', 'Danh mục thuốc'],
  },
  {
    label: 'Tiện ích',
    items: ['Sao lưu dữ liệu', 'Phục hồi dữ liệu', 'Xuất báo cáo'],
  },
  {
    label: 'Công cụ hỗ trợ',
    items: ['Hướng dẫn sử dụng', 'Kiểm tra cập nhật', 'Thông tin hệ thống'],
  },
  {
    label: 'Giúp đỡ',
    items: ['Tài liệu', 'Video hướng dẫn', 'Liên hệ hỗ trợ', 'Về chúng tôi'],
  },
]

export function MenuStrip() {
  const mode = useAppStore((state) => state.mode)
  const logout = useAppStore((state) => state.logout)
  const clearPermissions = usePermissionStore((state) => state.clearPermissions)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const handleMenuOpen = (event: MouseEvent<HTMLElement>, label: string) => {
    setAnchorEl(event.currentTarget)
    setActiveMenu(label)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setActiveMenu(null)
  }

  const handleMenuItemClick = async (item: string) => {
    handleMenuClose()

    if (item === 'Đăng xuất') {
      try {
        await authService.logout()
      } catch (error) {
        // Ignore logout errors
      } finally {
        clearPermissions()
        logout()
      }
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: mode === 'dark' ? '#1e2936' : '#f6f8fb',
        minHeight: '32px',
        overflowX: 'auto',
        flexWrap: { xs: 'nowrap', md: 'wrap' },
      }}
    >
      {menuItems.map((menu) => (
        <Box key={menu.label}>
          <Box
            onClick={(e) => handleMenuOpen(e, menu.label)}
            sx={{
              px: 2,
              py: 0.5,
              cursor: 'pointer',
              backgroundColor: activeMenu === menu.label ? (mode === 'dark' ? '#2d3748' : '#e0e8f0') : 'transparent',
              '&:hover': {
                backgroundColor: mode === 'dark' ? '#2d3748' : '#e0e8f0',
              },
            }}
          >
            <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{menu.label}</Typography>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={activeMenu === menu.label}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.5,
                  minWidth: 200,
                },
              },
            }}
          >
            {menu.items.map((item) => (
              <MenuItem key={item} onClick={() => handleMenuItemClick(item)} sx={{ fontSize: 13 }}>
                {item}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      ))}
    </Box>
  )
}
