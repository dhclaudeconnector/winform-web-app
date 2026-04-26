'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Chip,
  Stack,
  Alert,
  Autocomplete,
  IconButton,
  Tooltip,
} from '@mui/material'
import { Trash2, UserPlus } from 'lucide-react'
import { CrudToolbar } from '@/components/common/CrudToolbar'
import { apiClient } from '@/lib/apiClient'
import { useAppStore } from '@/lib/store/uiStore'

interface User {
  username: string
  fullName: string
  email: string
}

interface Role {
  id: number
  code: string
  name: string
}

interface UserRole {
  id: number
  username: string
  role_id: number
  role_code: string
  role_name: string
  assigned_at: string
  assigned_by: string
}

export function UserPermissionModule() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  const loadUsers = async () => {
    try {
      // Giả sử có API lấy danh sách users
      const data = await apiClient.get<User[]>('/api/admin/users')
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await apiClient.get<Role[]>('/api/admin/roles')
      setRoles(data)
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }

  const loadUserRoles = async (username: string) => {
    try {
      const data = await apiClient.get<UserRole[]>(`/api/admin/users/${username}/roles`)
      setUserRoles(data)
    } catch (err) {
      console.error('Failed to load user roles:', err)
    }
  }

  const handleSelectUser = async (user: User | null) => {
    setSelectedUser(user)
    if (user) {
      await loadUserRoles(user.username)
      setDialogOpen(true)
    }
  }

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) return

    setLoading(true)
    setError('')

    try {
      await apiClient.post(`/api/admin/users/${selectedUser.username}/roles`, {
        roleId: selectedRole.id,
      })

      await loadUserRoles(selectedUser.username)
      setSelectedRole(null)
    } catch (err: any) {
      setError(err.message || 'Lỗi gán vai trò')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveRole = async (userRoleId: number) => {
    if (!selectedUser) return

    setLoading(true)
    setError('')

    try {
      await apiClient.delete(`/api/admin/users/${selectedUser.username}/roles/${userRoleId}`)
      await loadUserRoles(selectedUser.username)
    } catch (err: any) {
      setError(err.message || 'Lỗi xóa vai trò')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Danh sách phân quyền người dùng</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1976d2; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1976d2; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .print-date { text-align: right; font-size: 12px; color: #666; margin-top: 10px; }
        </style>
      </head>
      <body>
        <h1>DANH SÁCH PHÂN QUYỀN NGƯỜI DÙNG</h1>
        <table>
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Họ tên</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map(user => `
              <tr>
                <td>${user.username}</td>
                <td>${user.fullName}</td>
                <td>${user.email}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="print-date">Ngày in: ${new Date().toLocaleString('vi-VN')}</div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleExportExcel = () => {
    const headers = ['Tài khoản', 'Họ tên', 'Email']
    const rows = filteredUsers.map(user => [
      user.username,
      user.fullName,
      user.email
    ])

    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    const BOM = '﻿'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `danh-sach-phan-quyen-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, minHeight: 0, p: 1, pb: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tài khoản</TableCell>
                  <TableCell>Họ tên</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.username} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell align="center">
                      <Button size="small" onClick={() => handleSelectUser(user)}>
                        Phân quyền
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
      <Box sx={{ flexShrink: 0, p: 1, pt: 0, backgroundColor: 'background.default' }}>
        <CrudToolbar
          module="users"
          onRefresh={loadUsers}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onPrint={handlePrint}
          onExportExcel={handleExportExcel}
          onClose={() => {
            const closeTab = useAppStore.getState().closeTab
            closeTab('user-permission')
          }}
          additionalMenuItems={[
            { label: 'Nhập từ Excel', onClick: () => console.log('Nhập Excel') },
            { label: 'Sao chép', onClick: () => console.log('Sao chép') },
          ]}
        />
      </Box>

      {/* Dialog phân quyền user */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Phân quyền cho user: {selectedUser?.fullName} ({selectedUser?.username})
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Thêm vai trò mới */}
          <Box sx={{ mb: 3, mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Thêm vai trò
            </Typography>
            <Stack direction="row" spacing={1}>
              <Autocomplete
                options={roles}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                value={selectedRole}
                onChange={(_, newValue) => setSelectedRole(newValue)}
                renderInput={(params) => <TextField {...params} placeholder="Chọn vai trò" size="small" />}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                startIcon={<UserPlus size={16} />}
                onClick={handleAddRole}
                disabled={!selectedRole || loading}
              >
                Thêm
              </Button>
            </Stack>
          </Box>

          {/* Danh sách vai trò hiện tại */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Vai trò hiện tại
          </Typography>
          {userRoles.length === 0 ? (
            <Alert severity="info">User chưa có vai trò nào</Alert>
          ) : (
            <Stack spacing={1}>
              {userRoles.map((ur) => (
                <Paper key={ur.id} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {ur.role_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Gán bởi: {ur.assigned_by} • {new Date(ur.assigned_at).toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                  <Tooltip title="Xóa vai trò">
                    <IconButton size="small" color="error" onClick={() => handleRemoveRole(ur.id)} disabled={loading}>
                      <Trash2 size={16} />
                    </IconButton>
                  </Tooltip>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
