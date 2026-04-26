'use client'

import { Box, Button, Card, CardContent, Checkbox, FormControlLabel, Stack, TextField, Typography, Alert } from '@mui/material'
import { LockKeyhole, LogIn } from 'lucide-react'
import { APP_CONFIG } from '@/lib/config/appConfig'
import { useAppStore } from '@/lib/store/uiStore'
import { authService } from '@/lib/api'
import { ApiError } from '@/lib/apiClient'
import { useState } from 'react'

export function LoginScreen() {
  const login = useAppStore((state) => state.login)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123')
  const [month, setMonth] = useState('2026-04')
  const [workDate, setWorkDate] = useState('2026-04-25')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await authService.login({
        username,
        password,
        accountingMonth: month,
        workDate,
      })

      // Store user info only (token is in httpOnly cookie)
      if (remember) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      // Update app state
      login(data.user.username)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Đăng nhập thất bại')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #6ba6cf 0%, #3f8ab7 100%)',
      }}
    >
      <Box className="legacy-watermark" />
      <Stack spacing={2} sx={{ alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <Typography variant="h2" sx={{ fontSize: 46, fontWeight: 300, color: 'white', letterSpacing: 2 }}>
          {APP_CONFIG.company}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: -1 }}>{APP_CONFIG.subtitle}</Typography>
        <Card sx={{ minWidth: 420, border: '1px solid #88a6bf', boxShadow: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid #9ab6cd', backgroundColor: '#dbe6f1' }}>
              <Typography sx={{ fontSize: 18, color: '#37638a' }}>:: Đăng nhập</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 2, p: 2 }}>
              <Box
                sx={{
                  border: '1px solid #b3c7d8',
                  borderRadius: 1,
                  p: 1,
                  display: 'grid',
                  placeItems: 'center',
                  minHeight: 140,
                  background: 'linear-gradient(180deg, #f3f7fb 0%, #dbe6f1 100%)',
                }}
              >
                <LockKeyhole size={72} color="#6a839a" />
              </Box>
              <Stack spacing={1.5} onKeyPress={handleKeyPress}>
                {error && (
                  <Alert severity="error" sx={{ py: 0.5 }}>
                    {error}
                  </Alert>
                )}
                <TextField
                  label="Tháng kế toán"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={loading}
                />
                <TextField
                  label="Ngày làm việc"
                  type="date"
                  value={workDate}
                  onChange={(event) => setWorkDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={loading}
                />
                <TextField
                  label="Tài khoản"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <TextField
                  label="Mật khẩu"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                />
                <FormControlLabel
                  control={<Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} disabled={loading} />}
                  label="Ghi nhớ đăng nhập"
                />
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pt: 1 }}>
                  <Button
                    startIcon={<LogIn size={16} />}
                    variant="contained"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>
                  <Button variant="outlined" onClick={() => window.location.reload()} disabled={loading}>
                    Kết thúc
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
