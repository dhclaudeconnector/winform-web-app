'use client'

import { useMemo, useState } from 'react'
import { Box, Stack, TextField, Typography } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColDef } from 'ag-grid-community'
import { CrudToolbar } from '@/components/common/CrudToolbar'
import { AppGrid } from '@/components/common/AppGrid'
import { ConfirmDialog } from '@/components/common/FormDialog'
import { useAppStore } from '@/lib/store/uiStore'
import { apiClient } from '@/lib/apiClient'
import { useApiError } from '@/hooks/useApiError'

interface Department {
  madv: string
  tendv: string
}

type FormMode = 'view' | 'create' | 'edit'

const emptyDepartment: Department = {
  madv: '',
  tendv: '',
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  const copied = document.execCommand('copy')
  textArea.remove()

  if (!copied) {
    throw new Error('Không thể sao chép dữ liệu')
  }
}

export function DepartmentsModule() {
  const queryClient = useQueryClient()
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('view')
  const [formData, setFormData] = useState<Department>(emptyDepartment)
  const [searchValue, setSearchValue] = useState('')
  const { handleError, ErrorSnackbar } = useApiError()

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const result = await apiClient.get<Department[]>('/api/dmdonvi?limit=5000')
      return result || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Department) => {
      return await apiClient.post<Department>('/api/dmdonvi', data)
    },
    onSuccess: (createdDepartment) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setSelectedDepartment(createdDepartment)
      setFormData(createdDepartment)
      setFormMode('view')
    },
    onError: (error) => {
      handleError(error, 'tạo khoa phòng')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ madv, data }: { madv: string; data: Department }) => {
      return await apiClient.put<Department>(`/api/dmdonvi/${encodeURIComponent(madv)}`, data)
    },
    onSuccess: (updatedDepartment) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setSelectedDepartment(updatedDepartment)
      setFormData(updatedDepartment)
      setFormMode('view')
    },
    onError: (error) => {
      handleError(error, 'cập nhật khoa phòng')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/dmdonvi/${encodeURIComponent(id)}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setConfirmOpen(false)
      setSelectedDepartment(null)
      setFormData(emptyDepartment)
      setFormMode('view')
    },
    onError: (error) => {
      handleError(error, 'xóa khoa phòng')
    },
  })

  const columnDefs: ColDef<Department>[] = [
    { field: 'madv', headerName: 'Mã đơn vị', width: 150 },
    { field: 'tendv', headerName: 'Tên đơn vị', flex: 1, minWidth: 260 },
  ]

  const filteredDepartments = useMemo(() => {
    if (!Array.isArray(departments)) {
      return []
    }

    const keyword = searchValue.trim().toLowerCase()
    if (!keyword) {
      return departments
    }

    return departments.filter((department) =>
      [department.madv, department.tendv].some((value) =>
        String(value ?? '').toLowerCase().includes(keyword)
      )
    )
  }, [departments, searchValue])

  const isFormEditable = formMode === 'create' || formMode === 'edit'
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  const formTitle =
    formMode === 'create' ? 'Thêm khoa phòng' : formMode === 'edit' ? 'Sửa khoa phòng' : 'Thông tin khoa phòng'

  const handleRowSelected = (department: Department | null) => {
    if (formMode !== 'view') {
      return
    }

    setSelectedDepartment(department)
    setFormData(department ?? emptyDepartment)
  }

  const handleAdd = () => {
    setSelectedDepartment(null)
    setFormData(emptyDepartment)
    setFormMode('create')
  }

  const handleEdit = () => {
    if (!selectedDepartment) {
      return
    }

    setFormData(selectedDepartment)
    setFormMode('edit')
  }

  const handleCancel = () => {
    setFormMode('view')
    setFormData(selectedDepartment ?? emptyDepartment)
  }

  const handleSave = () => {
    if (formMode === 'view') {
      return
    }

    const payload: Department = {
      madv: formData.madv.trim(),
      tendv: formData.tendv.trim(),
    }

    if (!payload.madv || !payload.tendv) {
      handleError(new Error('Vui lòng nhập đầy đủ mã đơn vị và tên đơn vị'), 'lưu khoa phòng')
      return
    }

    if (formMode === 'create') {
      createMutation.mutate(payload)
      return
    }

    if (!selectedDepartment) {
      handleError(new Error('Vui lòng chọn khoa phòng cần cập nhật'), 'cập nhật khoa phòng')
      return
    }

    updateMutation.mutate({
      madv: selectedDepartment.madv,
      data: payload,
    })
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Danh sách Khoa Phòng</title>
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
              <th>Mã Đơn vị</th>
              <th>Tên Đơn vị</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDepartments.map(department => `
              <tr>
                <td>${escapeHtml(department.madv)}</td>
                <td>${escapeHtml(department.tendv)}</td>
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
    const headers = ['Mã đơn vị', 'Tên đơn vị']
    const rows = filteredDepartments.map(department => [
      department.madv,
      department.tendv
    ])

    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(escapeCsv).join(',') + '\n'
    })

    const BOM = '﻿'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `danh-sach-khoa-phong-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const handleCopy = async () => {
    const rows = selectedDepartment ? [selectedDepartment] : filteredDepartments
    const content = [
      ['Mã đơn vị', 'Tên đơn vị'].join('\t'),
      ...rows.map((department) => [department.madv, department.tendv].join('\t')),
    ].join('\n')

    try {
      await copyText(content)
    } catch (error) {
      handleError(error, 'sao chép khoa phòng')
    }
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, minHeight: 0, p: 1, pb: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Box sx={{ px: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Danh sách khoa phòng
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <AppGrid
              rowData={filteredDepartments}
              columnDefs={columnDefs}
              onRowSelected={handleRowSelected}
              loading={isLoading}
              getRowId={(params) => params.data.madv}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexShrink: 0, p: 1, backgroundColor: 'background.default' }}>
        <Box
          sx={{
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {formTitle}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="Mã đơn vị"
              value={formData.madv}
              onChange={(e) => setFormData((prev) => ({ ...prev, madv: e.target.value }))}
              disabled={formMode !== 'create' || isMutating}
              size="small"
              fullWidth
              required
            />
            <TextField
              label="Tên đơn vị"
              value={formData.tendv}
              onChange={(e) => setFormData((prev) => ({ ...prev, tendv: e.target.value }))}
              disabled={!isFormEditable || isMutating}
              size="small"
              fullWidth
              required
            />
          </Stack>
          <CrudToolbar
            module="departments"
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={() => selectedDepartment && setConfirmOpen(true)}
            onSave={formMode === 'view' ? undefined : handleSave}
            onCancel={formMode === 'view' ? undefined : handleCancel}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
            onClose={() => {
              const closeTab = useAppStore.getState().closeTab
              closeTab('departments')
            }}
            editDisabled={!selectedDepartment || isMutating}
            deleteDisabled={!selectedDepartment || isMutating}
            saveDisabled={!isFormEditable || isMutating}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onPrint={handlePrint}
            onExportExcel={handleExportExcel}
            additionalMenuItems={[
              { label: 'Sao chép', onClick: handleCopy },
            ]}
          />
        </Box>
      </Box>

      <ConfirmDialog open={confirmOpen} title="Xác nhận xóa" message={`Bạn có chắc chắn muốn xóa khoa phòng "${selectedDepartment?.tendv}"?`} onClose={() => setConfirmOpen(false)} onConfirm={() => selectedDepartment && deleteMutation.mutate(selectedDepartment.madv)} />

      <ErrorSnackbar />
    </Box>
  )
}
