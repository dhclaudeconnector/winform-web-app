'use client'

import { useState } from 'react'
import { Box, Stack, TextField } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColDef } from 'ag-grid-community'
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Danh sách nhân viên</title>
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
        <h1>DANH SÁCH NHÂN VIÊN</h1>
        <table>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Tài khoản</th>
              <th>Họ lót</th>
              <th>Tên</th>
              <th>Giới tính</th>
              <th>Email</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map(user => `
              <tr>
                <td>${user.manv}</td>
                <td>${user.taikhoan}</td>
                <td>${user.holot}</td>
                <td>${user.ten}</td>
                <td>${user.gioitinh === 0 ? 'Nam' : 'Nữ'}</td>
                <td>${user.email}</td>
                <td>${user.trangthai === '0' ? 'Đang làm việc' : 'Nghỉ việc'}</td>
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
    const headers = ['Mã NV', 'Tài khoản', 'Họ lót', 'Tên', 'Giới tính', 'Email', 'Trạng thái']
    const rows = filteredUsers.map(user => [
      user.manv,
      user.taikhoan,
      user.holot,
      user.ten,
      user.gioitinh === 0 ? 'Nam' : 'Nữ',
      user.email,
      user.trangthai === '0' ? 'Đang làm việc' : 'Nghỉ việc'
    ])

    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    const BOM = '﻿'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `danh-sach-nhan-vien-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, minHeight: 0, p: 1, pb: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <AppGrid
            rowData={filteredUsers}
            columnDefs={columnDefs}
            onRowSelected={setSelectedUser}
            loading={isLoading}
            getRowId={(params) => params.data.manv}
          />
        </Box>
      </Box>
      <Box sx={{ flexShrink: 0, p: 1, pt: 0, backgroundColor: 'background.default' }}>
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
          onPrint={handlePrint}
          onExportExcel={handleExportExcel}
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
