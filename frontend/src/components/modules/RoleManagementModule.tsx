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
} from '@mui/material'
import { CrudToolbar } from '@/components/common/CrudToolbar'
import { apiClient } from '@/lib/apiClient'

interface Role {
  id: number
  code: string
  name: string
  description: string
  is_active: boolean
}

interface Module {
  id: number
  code: string
  name: string
  section: string
}

interface Permission {
  id: number
  module_id: number
  code: string
  name: string
}

interface RolePermission {
  permission_id: number
  granted: boolean
}

export function RoleManagementModule() {
  const [roles, setRoles] = useState<Role[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [rolePermissions, setRolePermissions] = useState<Record<number, boolean>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('RoleManagementModule mounted, useEffect running')
    loadRoles()
    loadModules()
    loadPermissions()
  }, [])

  console.log('RoleManagementModule render, roles:', roles.length, 'modules:', modules.length, 'permissions:', permissions.length)

  const loadRoles = async () => {
    try {
      console.log('Loading roles...')
      const data = await apiClient.get<Role[]>('/api/admin/roles')
      console.log('Roles loaded:', data)
      setRoles(data)
    } catch (err) {
      console.error('Failed to load roles:', err)
      setError('Không thể tải danh sách vai trò')
    }
  }

  const loadModules = async () => {
    try {
      console.log('Loading modules...')
      const data = await apiClient.get<Module[]>('/api/admin/modules')
      console.log('Modules loaded:', data)
      setModules(data)
    } catch (err) {
      console.error('Failed to load modules:', err)
      setError('Không thể tải danh sách module')
    }
  }

  const loadPermissions = async () => {
    try {
      console.log('Loading permissions...')
      const data = await apiClient.get<Permission[]>('/api/admin/permissions')
      console.log('Permissions loaded:', data)
      setPermissions(data)
    } catch (err) {
      console.error('Failed to load permissions:', err)
      setError('Không thể tải danh sách quyền')
    }
  }

  const handleEditRole = async (role: Role) => {
    setSelectedRole(role)
    setLoading(true)
    setError('')

    try {
      const data = await apiClient.get<RolePermission[]>(`/api/admin/roles/${role.id}/permissions`)
      const permMap: Record<number, boolean> = {}
      data.forEach((rp) => {
        permMap[rp.permission_id] = rp.granted
      })
      setRolePermissions(permMap)
      setDialogOpen(true)
    } catch (err: any) {
      setError(err.message || 'Lỗi tải quyền của vai trò')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return

    setLoading(true)
    setError('')

    try {
      const permissionsToUpdate = Object.entries(rolePermissions)
        .filter(([permId]) => permId && permId !== 'null' && permId !== 'undefined')
        .map(([permId, granted]) => ({
          permission_id: parseInt(permId),
          granted,
        }))

      await apiClient.post(`/api/admin/roles/${selectedRole.id}/permissions`, {
        permissions: permissionsToUpdate,
      })

      // Reload permissions to show updated data
      await handleEditRole(selectedRole)

      setDialogOpen(false)
      setSelectedRole(null)
      setRolePermissions({})
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu quyền')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (permissionId: number) => {
    setRolePermissions((prev) => ({
      ...prev,
      [permissionId]: !prev[permissionId],
    }))
  }

  const handleSelectAllModule = (moduleId: number, checked: boolean) => {
    const modulePerms = permissions.filter((p) => p.module_id === moduleId)
    const updates: Record<number, boolean> = {}
    modulePerms.forEach((p) => {
      updates[p.id] = checked
    })
    setRolePermissions((prev) => ({ ...prev, ...updates }))
  }

  const getModulePermissions = (moduleId: number) => {
    return permissions.filter((p) => p.module_id === moduleId)
  }

  const isModuleFullySelected = (moduleId: number) => {
    const modulePerms = getModulePermissions(moduleId)
    return modulePerms.every((p) => rolePermissions[p.id] === true)
  }

  return (
    <Box sx={{ p: 2 }}>
      <CrudToolbar
        module="users"
        onRefresh={loadRoles}
      />

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mã vai trò</TableCell>
              <TableCell>Tên vai trò</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id} hover>
                <TableCell>{role.code}</TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <Chip
                    label={role.is_active ? 'Hoạt động' : 'Ngừng'}
                    color={role.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Button size="small" onClick={() => handleEditRole(role)}>
                    Phân quyền
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog phân quyền */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Phân quyền cho vai trò: {selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mt: 1 }}>
            {modules.map((module) => {
              const modulePerms = getModulePermissions(module.id)
              const allSelected = isModuleFullySelected(module.id)

              return (
                <Paper key={module.id} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allSelected}
                          onChange={(e) => handleSelectAllModule(module.id, e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {module.name}
                        </Typography>
                      }
                    />
                    <Chip label={module.section} size="small" sx={{ ml: 1 }} />
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 4 }}>
                    {modulePerms.map((perm) => (
                      <FormControlLabel
                        key={perm.id}
                        control={
                          <Checkbox
                            checked={rolePermissions[perm.id] === true}
                            onChange={() => handleTogglePermission(perm.id)}
                            size="small"
                          />
                        }
                        label={perm.name}
                      />
                    ))}
                  </Box>
                </Paper>
              )
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSavePermissions} variant="contained" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
