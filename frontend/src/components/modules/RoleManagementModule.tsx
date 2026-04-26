'use client'

import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColDef } from 'ag-grid-community'
import { AppGrid } from '@/components/common/AppGrid'
import { CrudToolbar } from '@/components/common/CrudToolbar'
import { ConfirmDialog, FormDialog } from '@/components/common/FormDialog'
import { useApiError } from '@/hooks/useApiError'
import { agGridVietnamese } from '@/lib/agGridVietnamese'
import { apiClient } from '@/lib/apiClient'
import { useAppStore } from '@/lib/store/uiStore'

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

interface UserByRole {
  username: string
  fullName: string
  email: string
  assigned_at: string
  assigned_by: string
}

interface RoleFormData {
  code: string
  name: string
  description: string
  is_active: boolean
}

export function RoleManagementModule() {
  const queryClient = useQueryClient()
  const { handleError, ErrorSnackbar } = useApiError()

  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [searchText, setSearchText] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [usersDialogOpen, setUsersDialogOpen] = useState(false)
  const [rolePermissions, setRolePermissions] = useState<Record<number, boolean>>({})

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiClient.get<Role[]>('/api/admin/roles'),
  })

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: () => apiClient.get<Module[]>('/api/admin/modules'),
  })

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiClient.get<Permission[]>('/api/admin/permissions'),
  })

  const { data: usersByRole = [] } = useQuery({
    queryKey: ['usersByRole', selectedRole?.id],
    queryFn: () => apiClient.get<UserByRole[]>(`/api/admin/roles/${selectedRole!.id}/users`),
    enabled: Boolean(selectedRole?.id && usersDialogOpen),
  })

  const createMutation = useMutation({
    mutationFn: (data: RoleFormData) => apiClient.post<Role>('/api/admin/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setFormOpen(false)
    },
    onError: (error) => handleError(error, 'tạo vai trò'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoleFormData }) =>
      apiClient.put<Role>(`/api/admin/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setFormOpen(false)
    },
    onError: (error) => handleError(error, 'cập nhật vai trò'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/admin/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeleteConfirmOpen(false)
      setSelectedRole(null)
    },
    onError: (error) => handleError(error, 'xóa vai trò'),
  })

  const savePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      apiClient.post(`/api/admin/roles/${roleId}/permissions`, {
        permission_ids: permissionIds,
      }),
    onSuccess: () => {
      setPermissionDialogOpen(false)
      setSelectedRole(null)
    },
    onError: (error) => handleError(error, 'lưu quyền'),
  })

  const filteredData = useMemo(() => {
    if (!searchText.trim()) {
      return roles
    }

    const keyword = searchText.toLowerCase()
    return roles.filter(
      (role) =>
        role.code.toLowerCase().includes(keyword) ||
        role.name.toLowerCase().includes(keyword) ||
        role.description?.toLowerCase().includes(keyword)
    )
  }, [roles, searchText])

  const columnDefs: ColDef<Role>[] = [
    {
      field: 'code',
      headerName: 'Mã vai trò',
      width: 150,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'name',
      headerName: 'Tên vai trò',
      width: 220,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'description',
      headerName: 'Mô tả',
      flex: 1,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'is_active',
      headerName: 'Trạng thái',
      width: 140,
      filter: false,
      cellRenderer: (params: { value: boolean }) => (
        <Chip
          size="small"
          color={params.value ? 'success' : 'default'}
          label={params.value ? 'Hoạt động' : 'Vô hiệu'}
        />
      ),
    },
  ]

  const handleOpenCreate = () => {
    setSelectedRole(null)
    setFormOpen(true)
  }

  const handleOpenEdit = () => {
    if (!selectedRole) {
      return
    }
    setFormOpen(true)
  }

  const handleOpenPermissionDialog = async () => {
    if (!selectedRole) {
      return
    }

    try {
      const data = await apiClient.get<Array<{ permission_id: number }>>(
        `/api/admin/roles/${selectedRole.id}/permissions`
      )
      const mappedPermissions = data.reduce<Record<number, boolean>>((acc, item) => {
        acc[item.permission_id] = true
        return acc
      }, {})
      setRolePermissions(mappedPermissions)
      setPermissionDialogOpen(true)
    } catch (error) {
      handleError(error, 'tải quyền vai trò')
    }
  }

  const handleTogglePermission = (permissionId: number) => {
    setRolePermissions((prev) => ({
      ...prev,
      [permissionId]: !prev[permissionId],
    }))
  }

  const handleSelectAllModule = (moduleId: number, checked: boolean) => {
    const modulePermissions = permissions.filter((permission) => permission.module_id === moduleId)
    setRolePermissions((prev) => {
      const next = { ...prev }
      modulePermissions.forEach((permission) => {
        next[permission.id] = checked
      })
      return next
    })
  }

  const getModulePermissions = (moduleId: number) =>
    permissions.filter((permission) => permission.module_id === moduleId)

  const isModuleFullySelected = (moduleId: number) => {
    const modulePermissions = getModulePermissions(moduleId)
    return modulePermissions.length > 0 && modulePermissions.every((item) => rolePermissions[item.id])
  }

  const handleSavePermissions = () => {
    if (!selectedRole) {
      return
    }

    const permissionIds = Object.entries(rolePermissions)
      .filter(([, granted]) => granted)
      .map(([id]) => Number(id))

    savePermissionsMutation.mutate({ roleId: selectedRole.id, permissionIds })
  }

  const handleFormSubmit = (data: RoleFormData) => {
    if (selectedRole) {
      updateMutation.mutate({ id: selectedRole.id, data })
      return
    }

    createMutation.mutate(data)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      return
    }

    const rowsHtml = filteredData
      .map(
        (role) => `
          <tr>
            <td>${role.code}</td>
            <td>${role.name}</td>
            <td>${role.description ?? ''}</td>
            <td>${role.is_active ? 'Hoạt động' : 'Vô hiệu'}</td>
          </tr>
        `
      )
      .join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Danh sách vai trò</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #1976d2; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1976d2; color: white; border: 1px solid #ddd; padding: 8px; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background: #f2f2f2; }
            .print-date { text-align: right; font-size: 12px; color: #666; margin-top: 16px; }
          </style>
        </head>
        <body>
          <h1>DANH SÁCH VAI TRÒ</h1>
          <table>
            <thead>
              <tr>
                <th>Mã vai trò</th>
                <th>Tên vai trò</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="print-date">Ngày in: ${new Date().toLocaleString('vi-VN')}</div>
        </body>
      </html>
    `)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleExportExcel = () => {
    const headers = ['Mã vai trò', 'Tên vai trò', 'Mô tả', 'Trạng thái']
    let csv = `${headers.join(',')}\n`

    filteredData.forEach((role) => {
      const row = [
        role.code,
        role.name,
        role.description ?? '',
        role.is_active ? 'Hoạt động' : 'Vô hiệu',
      ]
      csv += `${row.map((cell) => `"${cell}"`).join(',')}\n`
    })

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `vai-tro-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, p: 1, pb: 0, overflow: 'hidden' }}>
        <AppGrid
          rowData={filteredData}
          columnDefs={columnDefs}
          loading={isLoading}
          localeText={agGridVietnamese}
          rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
          onSelectionChanged={(event) => {
            const selectedRows = event.api.getSelectedRows() as Role[]
            setSelectedRole(selectedRows[0] ?? null)
          }}
          onRowDoubleClicked={(event) => {
            setSelectedRole(event.data)
            setFormOpen(true)
          }}
        />
      </Box>

      <Box sx={{ flexShrink: 0, p: 1, pt: 0, backgroundColor: 'background.default' }}>
        <CrudToolbar
          onAdd={handleOpenCreate}
          onEdit={handleOpenEdit}
          onDelete={() => setDeleteConfirmOpen(true)}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['roles'] })}
          onPrint={handlePrint}
          onExportExcel={handleExportExcel}
          onClose={() => {
            const closeTab = useAppStore.getState().closeTab
            closeTab('role-management')
          }}
          searchValue={searchText}
          onSearchChange={setSearchText}
          editDisabled={!selectedRole}
          deleteDisabled={!selectedRole}
          additionalMenuItems={[
            {
              label: 'Quản lý quyền',
              onClick: handleOpenPermissionDialog,
            },
            {
              label: 'Xem users',
              onClick: () => setUsersDialogOpen(true),
            },
          ]}
        />
      </Box>

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={selectedRole ? 'Cập nhật vai trò' : 'Thêm vai trò'}
        onSubmit={handleFormSubmit}
        initialData={
          selectedRole ?? {
            code: '',
            name: '',
            description: '',
            is_active: true,
          }
        }
        fields={[
          {
            name: 'code',
            label: 'Mã vai trò',
            type: 'text',
            required: true,
            disabled: Boolean(selectedRole),
          },
          {
            name: 'name',
            label: 'Tên vai trò',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'Mô tả',
            type: 'text',
            multiline: true,
            rows: 3,
          },
          {
            name: 'is_active',
            label: 'Đang hoạt động',
            type: 'checkbox',
          },
        ]}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => selectedRole && deleteMutation.mutate(selectedRole.id)}
        title="Xác nhận xóa vai trò"
        message={`Bạn có chắc muốn xóa vai trò ${selectedRole?.name ?? ''}?`}
        loading={deleteMutation.isPending}
      />

      <Dialog
        open={permissionDialogOpen}
        onClose={() => setPermissionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Quản lý quyền - {selectedRole?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {modules.map((module) => {
              const modulePermissions = getModulePermissions(module.id)
              const allSelected = isModuleFullySelected(module.id)

              return (
                <Paper key={module.id} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allSelected}
                          onChange={(event) =>
                            handleSelectAllModule(module.id, event.target.checked)
                          }
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
                    {modulePermissions.map((permission) => (
                      <FormControlLabel
                        key={permission.id}
                        control={
                          <Checkbox
                            size="small"
                            checked={rolePermissions[permission.id] === true}
                            onChange={() => handleTogglePermission(permission.id)}
                          />
                        }
                        label={permission.name}
                      />
                    ))}
                  </Box>
                </Paper>
              )
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSavePermissions}
            disabled={savePermissionsMutation.isPending}
          >
            {savePermissionsMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={usersDialogOpen} onClose={() => setUsersDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Danh sách user - {selectedRole?.name}</DialogTitle>
        <DialogContent>
          {usersByRole.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Chưa có user nào được gán vai trò này
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {usersByRole.map((user) => (
                <Paper key={user.username} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {user.fullName} ({user.username})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email || 'Chưa có email'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Gán lúc {new Date(user.assigned_at).toLocaleString('vi-VN')} bởi{' '}
                    {user.assigned_by}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUsersDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <ErrorSnackbar />
    </Box>
  )
}
