'use client'

import { Box, Typography } from '@mui/material'
import { useAppStore } from '@/lib/store/uiStore'

export function StatusBar() {
  const mode = useAppStore((state) => state.mode)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: mode === 'dark' ? '#1e2936' : '#f6f8fb',
        fontSize: 11,
      }}
    >
      <Typography sx={{ fontSize: 11, color: 'text.primary' }}>Sẵn sàng</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Hospital Management System v1.1</Typography>
    </Box>
  )
}
