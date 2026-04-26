import React from 'react'
import { Snackbar, Alert } from '@mui/material'

interface UnauthorizedAlertProps {
  open: boolean
  onClose: () => void
  message?: string
}

/**
 * Alert hiển thị khi user không có quyền
 */
export function UnauthorizedAlert({
  open,
  onClose,
  message = 'Bạn không có quyền thực hiện thao tác này',
}: UnauthorizedAlertProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="warning" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}
