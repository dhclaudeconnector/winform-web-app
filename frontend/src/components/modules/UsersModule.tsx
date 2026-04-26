'use client'

import { useState } from 'react'
import { Box, Stack, TextField } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColDef } from 'ag-grid-community'
import { PageHeader } from '@/components/common/PageHeader'
import { CrudToolbar } from '@/components/common/CrudToolbar'
import { AppGrid } from '@/components/common/AppGrid'
import { FormDialog, ConfirmDialog } from '@/components/common/FormDialog'
import { useAppStore } from '@/lib/store/uiStore'
import { apiClient } from '@/lib/apiClient'
import { useApiError } from '@/hooks/useApiError'

interface Employee {
  manv: string
  taikhoan: string
  holot: string
  ten: string
  gioitinh: number
  email: string
  trangthai: string
}

export function UsersModule() {
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Employee>>({})
  const [searchValue, setSearchValue] = useState('')
  const { handleError, ErrorSnackbar } = useApiError()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await apiClient.get<Employee[]>('/api/nhanvien?limit=1000')
      return result || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      return await apiClient.post<Employee>('/api/nhanvien', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
      setFormData({})
    },
    onError: (error) => {
      handleError(error, 'tạo nhân viên')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Employee) => {
      return await apiClient.put<Employee>(`/api/nhanvien/${data.manv}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
      setFormData({})
      setSelectedUser(null)
    },
    onError: (error) => {
      handleError(error, 'cập nhật nhân viên')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/nhanvien/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmOpen(false)
      setSelectedUser(null)
    },
    onError: (error) => {
      handleError(error, 'xóa nhân viên')
    },
  })

  const columnDefs: ColDef<Employee>[] = [
    { field: 'manv', headerName: 'Mã NV', width: 100 },
    { field: 'taikhoan', headerName: 'Tài khoản', width: 150 },
    { field: 'holot', headerName: 'Họ lót', width: 150 },
    { field: 'ten', headerName: 'Tên', width: 120 },
    { field: 'gioitinh', headerName: 'Giới tính', width: 100, valueFormatter: (params) => params.value === 0 ? 'Nam' : 'Nữ' },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'trangthai', headerName: 'Trạng thái', width: 130, valueFormatter: (params) => params.value === '0' ? 'Đang làm việc' : 'Nghỉ việc' },
  ]

  const filteredUsers = Array.isArray(users) ? users.filter((user: Employee) =>
    Object.values(user).some((val) => String(val).toLowerCase().includes(searchValue.toLowerCase()))
  ) : []

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, p: 1, overflow: 'auto', minHeight: 0 }}>
        <AppGrid
          rowData={filteredUsers}
          columnDefs={columnDefs}
          onRowSelected={setSelectedUser}
          loading={isLoading}
          getRowId={(params) => params.data.manv}
        />
      </Box>
      <Box sx={{ flexShrink: 0 }}>
        <CrudToolbar
          onAdd={() => {
            setFormData({})
            setDialogOpen(true)
          }}
          onEdit={() => {
            if (selectedUser) {
              setFormData(selectedUser)
              setDialogOpen(true)
            }
          }}
          onDelete={() => selectedUser && setConfirmOpen(true)}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
          onClose={() => {
            const closeTab = useAppStore.getState().closeTab
            closeTab('users')
          }}
          editDisabled={!selectedUser}
          deleteDisabled={!selectedUser}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onPrint={() => console.log('In')}
          onExportExcel={() => console.log('Xuất Excel')}
          additionalMenuItems={[
            { label: 'Nhập từ Excel', onClick: () => console.log('Nhập Excel') },
            { label: 'Sao chép', onClick: () => console.log('Sao chép') },
          ]}
        />
      </Box>

      <FormDialog
        open={dialogOpen}
        title={formData.manv ? 'Sửa nhân viên' : 'Thêm nhân viên'}
        onClose={() => {
          setDialogOpen(false)
          setFormData({})
        }}
        onConfirm={() => {
          if (formData.manv) {
            updateMutation.mutate(formData as Employee)
          } else {
            createMutation.mutate(formData)
          }
        }}
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Tài khoản" value={formData.taikhoan || ''} onChange={(e) => setFormData({ ...formData, taikhoan: e.target.value })} />
          <TextField label="Họ lót" value={formData.holot || ''} onChange={(e) => setFormData({ ...formData, holot: e.target.value })} />
          <TextField label="Tên" value={formData.ten || ''} onChange={(e) => setFormData({ ...formData, ten: e.target.value })} />
          <TextField label="Email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </Stack>
      </FormDialog>

      <ConfirmDialog open={confirmOpen} title="Xác nhận xóa" message={`Bạn có chắc chắn muốn xóa nhân viên "${selectedUser?.holot} ${selectedUser?.ten}"?`} onClose={() => setConfirmOpen(false)} onConfirm={() => selectedUser && deleteMutation.mutate(selectedUser.manv)} />

      <ErrorSnackbar />
    </Box>
  )
}
