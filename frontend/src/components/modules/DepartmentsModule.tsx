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

interface Department {
  id: string
  code: string
  name: string
  description: string
  isActive: boolean
}

export function DepartmentsModule() {
  const queryClient = useQueryClient()
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Department>>({})
  const [searchValue, setSearchValue] = useState('')
  const { handleError, ErrorSnackbar } = useApiError()

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const result = await apiClient.get<Department[]>('/api/departments')
      return result || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Department>) => {
      return await apiClient.post<Department>('/api/departments', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDialogOpen(false)
      setFormData({})
    },
    onError: (error) => {
      handleError(error, 'tạo khoa phòng')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Department) => {
      return await apiClient.put<Department>(`/api/departments/${data.id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDialogOpen(false)
      setFormData({})
      setSelectedDept(null)
    },
    onError: (error) => {
      handleError(error, 'cập nhật khoa phòng')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/departments/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setConfirmOpen(false)
      setSelectedDept(null)
    },
    onError: (error) => {
      handleError(error, 'xóa khoa phòng')
    },
  })

  const columnDefs: ColDef<Department>[] = [
    { field: 'code', headerName: 'Mã khoa', width: 120 },
    { field: 'name', headerName: 'Tên khoa', width: 250 },
    { field: 'description', headerName: 'Mô tả', width: 300 },
    { field: 'isActive', headerName: 'Trạng thái', width: 120, valueFormatter: (params) => (params.value ? 'Hoạt động' : 'Khóa') },
  ]

  const filteredDepts = Array.isArray(departments) ? departments.filter((dept: Department) =>
    Object.values(dept).some((val) => String(val).toLowerCase().includes(searchValue.toLowerCase()))
  ) : []

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Danh sách khoa phòng</title>
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
        <h1>DANH SÁCH KHOA PHÒNG</h1>
        <table>
          <thead>
            <tr>
              <th>Mã khoa</th>
              <th>Tên khoa</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDepts.map(dept => `
              <tr>
                <td>${dept.code}</td>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>${dept.isActive ? 'Hoạt động' : 'Khóa'}</td>
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
    const headers = ['Mã khoa', 'Tên khoa', 'Mô tả', 'Trạng thái']
    const rows = filteredDepts.map(dept => [
      dept.code,
      dept.name,
      dept.description,
      dept.isActive ? 'Hoạt động' : 'Khóa'
    ])

    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    const BOM = '﻿'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `danh-sach-khoa-phong-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, minHeight: 0, p: 1, pb: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <AppGrid rowData={filteredDepts} columnDefs={columnDefs} onRowSelected={setSelectedDept} loading={isLoading} />
        </Box>
      </Box>
      <Box sx={{ flexShrink: 0, p: 1, pt: 0, backgroundColor: 'background.default' }}>
        <CrudToolbar
          onAdd={() => {
            setFormData({})
            setDialogOpen(true)
          }}
          onEdit={() => {
            if (selectedDept) {
              setFormData(selectedDept)
              setDialogOpen(true)
            }
          }}
          onDelete={() => selectedDept && setConfirmOpen(true)}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
          onClose={() => {
            const closeTab = useAppStore.getState().closeTab
            closeTab('departments')
          }}
          onPrint={handlePrint}
          onExportExcel={handleExportExcel}
          additionalMenuItems={[
            { label: 'Nhập từ Excel', onClick: () => console.log('Nhập Excel') },
            { label: 'Sao chép', onClick: () => console.log('Sao chép') },
          ]}
          editDisabled={!selectedDept}
          deleteDisabled={!selectedDept}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </Box>

      <FormDialog
        open={dialogOpen}
        title={formData.id ? 'Sửa khoa phòng' : 'Thêm khoa phòng'}
        onClose={() => {
          setDialogOpen(false)
          setFormData({})
        }}
        onConfirm={() => {
          if (formData.id) {
            updateMutation.mutate(formData as Department)
          } else {
            createMutation.mutate(formData)
          }
        }}
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Mã khoa" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
          <TextField label="Tên khoa" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <TextField label="Mô tả" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} multiline rows={3} />
        </Stack>
      </FormDialog>

      <ConfirmDialog open={confirmOpen} title="Xác nhận xóa" message={`Bạn có chắc chắn muốn xóa khoa phòng "${selectedDept?.name}"?`} onClose={() => setConfirmOpen(false)} onConfirm={() => selectedDept && deleteMutation.mutate(selectedDept.id)} />

      <ErrorSnackbar />
    </Box>
  )
}
