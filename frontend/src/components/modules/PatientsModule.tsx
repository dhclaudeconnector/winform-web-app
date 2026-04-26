'use client'

import { useState } from 'react'
import { Box, Stack, TextField, MenuItem } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColDef } from 'ag-grid-community'
import { PageHeader } from '@/components/common/PageHeader'
import { CrudToolbar } from '@/components/common/CrudToolbar'
import { AppGrid } from '@/components/common/AppGrid'
import { FormDialog, ConfirmDialog } from '@/components/common/FormDialog'
import { useAppStore } from '@/lib/store/uiStore'
import { apiClient } from '@/lib/apiClient'
import { useApiError } from '@/hooks/useApiError'

interface Patient {
  id: string
  patientCode: string
  fullName: string
  dateOfBirth: string
  gender: string
  phone: string
  address: string
  email: string
}

export function PatientsModule() {
  const queryClient = useQueryClient()
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Patient>>({})
  const [searchValue, setSearchValue] = useState('')
  const { handleError, ErrorSnackbar } = useApiError()

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const result = await apiClient.get<Patient[]>('/api/patients')
      return result || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      return await apiClient.post<Patient>('/api/patients', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      setDialogOpen(false)
      setFormData({})
    },
    onError: (error) => {
      handleError(error, 'tạo bệnh nhân')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Patient) => {
      return await apiClient.put<Patient>(`/api/patients/${data.id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      setDialogOpen(false)
      setFormData({})
      setSelectedPatient(null)
    },
    onError: (error) => {
      handleError(error, 'cập nhật bệnh nhân')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/patients/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      setConfirmOpen(false)
      setSelectedPatient(null)
    },
    onError: (error) => {
      handleError(error, 'xóa bệnh nhân')
    },
  })

  const columnDefs: ColDef<Patient>[] = [
    { field: 'patientCode', headerName: 'Mã BN', width: 120 },
    { field: 'fullName', headerName: 'Họ và tên', width: 200 },
    { field: 'dateOfBirth', headerName: 'Ngày sinh', width: 120 },
    { field: 'gender', headerName: 'Giới tính', width: 100 },
    { field: 'phone', headerName: 'Điện thoại', width: 130 },
    { field: 'address', headerName: 'Địa chỉ', width: 250 },
  ]

  const filteredPatients = Array.isArray(patients) ? patients.filter((patient: Patient) =>
    Object.values(patient).some((val) => String(val).toLowerCase().includes(searchValue.toLowerCase()))
  ) : []

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, p: 1, overflow: 'auto' }}>
        <AppGrid rowData={filteredPatients} columnDefs={columnDefs} onRowSelected={setSelectedPatient} loading={isLoading} />
      </Box>
      <CrudToolbar
        onAdd={() => {
          setFormData({})
          setDialogOpen(true)
        }}
        onEdit={() => {
          if (selectedPatient) {
            setFormData(selectedPatient)
            setDialogOpen(true)
          }
        }}
        onDelete={() => selectedPatient && setConfirmOpen(true)}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['patients'] })}
        onClose={() => {
          const closeTab = useAppStore.getState().closeTab
          closeTab('patients')
        }}
        onPrint={() => console.log('In')}
        onExportExcel={() => console.log('Xuất Excel')}
        additionalMenuItems={[
          { label: 'Nhập từ Excel', onClick: () => console.log('Nhập Excel') },
          { label: 'Sao chép', onClick: () => console.log('Sao chép') },
        ]}
        editDisabled={!selectedPatient}
        deleteDisabled={!selectedPatient}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <FormDialog
        open={dialogOpen}
        title={formData.id ? 'Sửa bệnh nhân' : 'Thêm bệnh nhân'}
        onClose={() => {
          setDialogOpen(false)
          setFormData({})
        }}
        onConfirm={() => {
          if (formData.id) {
            updateMutation.mutate(formData as Patient)
          } else {
            createMutation.mutate(formData)
          }
        }}
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Mã bệnh nhân" value={formData.patientCode || ''} onChange={(e) => setFormData({ ...formData, patientCode: e.target.value })} />
          <TextField label="Họ và tên" value={formData.fullName || ''} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
          <TextField label="Ngày sinh" type="date" value={formData.dateOfBirth || ''} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Giới tính" select value={formData.gender || ''} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
            <MenuItem value="Nam">Nam</MenuItem>
            <MenuItem value="Nữ">Nữ</MenuItem>
          </TextField>
          <TextField label="Điện thoại" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <TextField label="Email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <TextField label="Địa chỉ" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} multiline rows={2} />
        </Stack>
      </FormDialog>

      <ConfirmDialog open={confirmOpen} title="Xác nhận xóa" message={`Bạn có chắc chắn muốn xóa bệnh nhân "${selectedPatient?.fullName}"?`} onClose={() => setConfirmOpen(false)} onConfirm={() => selectedPatient && deleteMutation.mutate(selectedPatient.id)} />

      <ErrorSnackbar />
    </Box>
  )
}
