import { useState } from 'react'
import { Snackbar, Alert } from '@mui/material'
import { ApiError } from '@/lib/apiClient'

interface ApiErrorDetails {
  status?: number
  message: string
  errors?: any
  code?: string
  response?: any
}

export function useApiError() {
  const [error, setError] = useState<ApiErrorDetails | null>(null)

  const handleError = (err: unknown, action: string = 'thực hiện') => {
    if (err instanceof ApiError) {
      setError({
        status: err.status,
        message: err.message,
        errors: err.errors,
        code: err.code,
      })
    } else if (err instanceof Error) {
      setError({
        message: err.message,
      })
    } else {
      setError({
        message: `Lỗi không xác định khi ${action}`,
      })
    }
  }

  const clearError = () => setError(null)

  const ErrorSnackbar = () => (
    <Snackbar
      open={!!error}
      autoHideDuration={6000}
      onClose={clearError}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
        <div>
          <strong>{error?.message}</strong>
          {error?.status && <div style={{ fontSize: '0.875rem', marginTop: 4 }}>Mã lỗi: {error.status}</div>}
          {error?.code && <div style={{ fontSize: '0.875rem' }}>Code: {error.code}</div>}
          {error?.errors && (
            <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
              Chi tiết: {JSON.stringify(error.errors)}
            </div>
          )}
        </div>
      </Alert>
    </Snackbar>
  )

  return {
    error,
    handleError,
    clearError,
    ErrorSnackbar,
  }
}
