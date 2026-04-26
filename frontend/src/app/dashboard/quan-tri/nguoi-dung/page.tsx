'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Stack, TextField, MenuItem, Button, CircularProgress, Typography, Tabs, Tab } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColDef, RowSelectedEvent } from 'ag-grid-community'
import { CrudToolbar } from '@/components/common/CrudToolbar'
import { AppGrid } from '@/components/common/AppGrid'
import { apiClient } from '@/lib/apiClient'
import { useAppStore } from '@/lib/store/uiStore'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import { useApiError } from '@/hooks/useApiError'

ModuleRegistry.registerModules([AllCommunityModule])

interface Employee {
  manv: string
  taikhoan: string
  holot: string
  ten: string
  gioitinh: number
  email: string
  trangthai: string
}

export default function NguoiDungPage() {
  const queryClient = useQueryClient()
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Employee>>({
    taikhoan: '',
    holot: '',
    ten: '',
    gioitinh: 0,
    email: '',
    trangthai: '0'
  })
  const [currentTab, setCurrentTab] = useState(0)
  const [loadedCount, setLoadedCount] = useState(100)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const { handleError, ErrorSnackbar } = useApiError()

  const gridRef = useRef<any>(null)
  const taikhoanRef = useRef<HTMLInputElement>(null)
  const holotRef = useRef<HTMLInputElement>(null)
  const tenRef = useRef<HTMLInputElement>(null)
  const gioitinhRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const trangthaiRef = useRef<HTMLInputElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const mode = useAppStore((state) => state.mode)

  // Fetch employees with progressive loading
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', loadedCount],
    queryFn: async () => {
      const result = await apiClient.get<Employee[]>(`/api/nhanvien?limit=${loadedCount}&offset=0`)
      return result || []
    },
  })

  // Auto-load more data
  useEffect(() => {
    if (employees.length > 0 && employees.length === loadedCount && !isLoadingMore) {
      const timer = setTimeout(() => {
        setIsLoadingMore(true)
        setLoadedCount(prev => prev + 100)
        setTimeout(() => setIsLoadingMore(false), 500)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [employees.length, loadedCount, isLoadingMore])

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      return await apiClient.post<Employee>('/api/nhanvien', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setIsEditing(false)
      setFormData({ taikhoan: '', holot: '', ten: '', gioitinh: 0, email: '', trangthai: '0' })
    },
    onError: (error) => {
      handleError(error, 'tạo nhân viên')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Employee) => {
      return await apiClient.put<Employee>(`/api/nhanvien/${data.manv}`, data)
    },
    onSuccess: (updatedEmployee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setIsEditing(false)
      setTimeout(() => {
        if (gridRef.current?.api) {
          gridRef.current.api.forEachNode((node: any) => {
            if (node.data.manv === updatedEmployee.manv) {
              node.setSelected(true)
              gridRef.current.api.ensureIndexVisible(node.rowIndex, 'middle')
            }
          })
        }
      }, 100)
    },
    onError: (error) => {
      handleError(error, 'cập nhật nhân viên')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (manv: string) => {
      return await apiClient.delete(`/api/nhanvien/${manv}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSelectedEmployee(null)
      setFormData({ taikhoan: '', holot: '', ten: '', gioitinh: 0, email: '', trangthai: '0' })
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
    {
      field: 'gioitinh',
      headerName: 'Giới tính',
      width: 100,
      valueFormatter: (params) => params.value === 0 ? 'Nam' : 'Nữ'
    },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'trangthai',
      headerName: 'Trạng thái',
      width: 130,
      valueFormatter: (params) => params.value === '0' ? 'Đang làm việc' : 'Nghỉ việc'
    },
  ]

  const handleRowSelected = useCallback((event: RowSelectedEvent) => {
    const selected = event.api.getSelectedRows()
    const employee = selected[0] || null
    setSelectedEmployee(employee)
    if (employee && !isEditing) {
      setFormData(employee)
    }
  }, [isEditing])

  const handleAdd = () => {
    setIsEditing(true)
    setSelectedEmployee(null)
    setFormData({ taikhoan: '', holot: '', ten: '', gioitinh: 0, email: '', trangthai: '0' })
    setTimeout(() => taikhoanRef.current?.focus(), 100)
  }

  const handleEdit = () => {
    if (selectedEmployee) {
      setIsEditing(true)
      setFormData(selectedEmployee)
      setTimeout(() => taikhoanRef.current?.focus(), 100)
    }
  }

  const handleSave = () => {
    if (selectedEmployee?.manv) {
      updateMutation.mutate({ ...selectedEmployee, ...formData } as Employee)
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (selectedEmployee) {
      setFormData(selectedEmployee)
    } else {
      setFormData({ taikhoan: '', holot: '', ten: '', gioitinh: 0, email: '', trangthai: '0' })
    }
  }

  const handleDelete = () => {
    if (selectedEmployee && window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${selectedEmployee.holot} ${selectedEmployee.ten}"?`)) {
      deleteMutation.mutate(selectedEmployee.manv)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<any>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (!e.shiftKey && nextRef?.current) {
        e.preventDefault()
        nextRef.current.focus()
      }
    }
  }

  // Alt+L shortcut for save
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'l' && isEditing) {
        e.preventDefault()
        saveButtonRef.current?.click()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isEditing])

  // Upper case on blur
  const handleUpperCase = (field: 'holot' | 'ten') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.toUpperCase() || ''
    }))
  }

  // Handle gender select with arrow keys
  const handleGenderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFormData(prev => ({ ...prev, gioitinh: 0 }))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFormData(prev => ({ ...prev, gioitinh: 1 }))
    }
  }

  const handlePrint = () => {
    setCurrentTab(1)
  }

  const handleExportExcel = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `danh-sach-nhan-vien-${new Date().toISOString().split('T')[0]}.csv`
      })
    }
  }

  const customTheme = themeQuartz.withParams({
    accentColor: mode === 'dark' ? '#4a9eff' : '#1a6fc4',
    backgroundColor: mode === 'dark' ? '#1e2936' : '#ffffff',
    borderColor: mode === 'dark' ? '#374151' : '#c5d0df',
    browserColorScheme: mode,
    chromeBackgroundColor: mode === 'dark' ? '#2d3748' : '#dfe8f5',
    columnBorder: true,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 12,
    foregroundColor: mode === 'dark' ? '#e2e8f0' : '#16314f',
    headerBackgroundColor: mode === 'dark' ? '#2d3748' : '#dfe8f5',
    headerFontSize: 12,
    headerFontWeight: 600,
    oddRowBackgroundColor: mode === 'dark' ? '#1a2332' : '#f9fbff',
    rowBorder: true,
    sidePanelBorder: true,
    wrapperBorder: true,
    selectedRowBackgroundColor: mode === 'dark' ? '#2563eb' : '#3b82f6',
  })

  if (currentTab === 1) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab label="Người dùng" />
          <Tab label="Trang in - Người dùng" />
        </Tabs>
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Typography variant="h5" gutterBottom>Danh sách nhân viên</Typography>
          <Box className="legacy-grid-shell" sx={{ height: 600, width: '100%' }}>
            <AgGridReact<Employee>
              ref={gridRef}
              theme={customTheme}
              rowData={employees}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              localeText={{
                page: 'Trang',
                of: 'của',
                to: 'đến',
                more: 'thêm',
                next: 'Tiếp',
                last: 'Cuối',
                first: 'Đầu',
                previous: 'Trước',
                loadingOoo: 'Đang tải...',
                noRowsToShow: 'Không có dữ liệu',
              }}
            />
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button onClick={() => window.print()}>In</Button>
            <Button onClick={handleExportExcel}>Xuất CSV</Button>
            <Button onClick={() => setCurrentTab(0)}>Quay lại</Button>
          </Stack>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
        <Tab label="Người dùng" />
      </Tabs>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        {/* Grid Section */}
        <Box sx={{ flex: 1, p: 1, overflow: 'auto', minWidth: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
            </Box>
          ) : (
            <Box className="legacy-grid-shell" sx={{ height: '100%', width: '100%' }}>
              <AgGridReact<Employee>
                ref={gridRef}
                theme={customTheme}
                rowData={employees}
                columnDefs={columnDefs}
                rowSelection="single"
                suppressRowClickSelection={false}
                animateRows
                pagination
                paginationPageSize={100}
                paginationPageSizeSelector={[50, 100, 200, 500]}
                onRowSelected={handleRowSelected}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                getRowStyle={(params) => {
                  if (params.node.isSelected()) {
                    return {
                      backgroundColor: mode === 'dark' ? '#2563eb' : '#3b82f6',
                      color: '#ffffff',
                      fontWeight: 600
                    }
                  }
                  return undefined
                }}
                localeText={{
                  page: 'Trang',
                  of: 'của',
                  to: 'đến',
                  more: 'thêm',
                  next: 'Tiếp',
                  last: 'Cuối',
                  first: 'Đầu',
                  previous: 'Trước',
                  loadingOoo: 'Đang tải...',
                  ariaPageSizeSelectorLabel: 'Kích thước trang',
                  pageSizeSelectorLabel: 'Kích thước trang',
                  selectAll: 'Chọn tất cả',
                  searchOoo: 'Tìm kiếm...',
                  blanks: 'Trống',
                  noRowsToShow: 'Không có dữ liệu',
                  filterOoo: 'Lọc...',
                  equals: 'Bằng',
                  notEqual: 'Không bằng',
                  contains: 'Chứa',
                  notContains: 'Không chứa',
                  startsWith: 'Bắt đầu với',
                  endsWith: 'Kết thúc với',
                  applyFilter: 'Áp dụng',
                  resetFilter: 'Đặt lại',
                  clearFilter: 'Xóa',
                }}
              />
            </Box>
          )}
          {isLoadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="caption" sx={{ ml: 1 }}>Đang tải thêm...</Typography>
            </Box>
          )}
        </Box>

        {/* Edit Panel */}
        <Box sx={{ width: 350, p: 2, borderLeft: 1, borderColor: 'divider', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {isEditing ? (selectedEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới') : 'Thông tin nhân viên'}
          </Typography>

          <Stack spacing={2}>
            <TextField
              inputRef={taikhoanRef}
              label="Tài khoản"
              value={formData.taikhoan || ''}
              onChange={(e) => setFormData({ ...formData, taikhoan: e.target.value })}
              disabled={!isEditing}
              onKeyDown={(e) => handleKeyDown(e, holotRef)}
              fullWidth
              size="small"
            />

            <TextField
              inputRef={holotRef}
              label="Họ lót"
              value={formData.holot || ''}
              onChange={(e) => setFormData({ ...formData, holot: e.target.value })}
              onBlur={() => handleUpperCase('holot')}
              disabled={!isEditing}
              onKeyDown={(e) => handleKeyDown(e, tenRef)}
              fullWidth
              size="small"
            />

            <TextField
              inputRef={tenRef}
              label="Tên"
              value={formData.ten || ''}
              onChange={(e) => setFormData({ ...formData, ten: e.target.value })}
              onBlur={() => handleUpperCase('ten')}
              disabled={!isEditing}
              onKeyDown={(e) => handleKeyDown(e, gioitinhRef)}
              fullWidth
              size="small"
            />

            <TextField
              inputRef={gioitinhRef}
              select
              label="Giới tính"
              value={formData.gioitinh ?? 0}
              onChange={(e) => setFormData({ ...formData, gioitinh: Number(e.target.value) })}
              disabled={!isEditing}
              onKeyDown={(e) => {
                handleGenderKeyDown(e)
                if (e.key === 'Enter' || e.key === 'Tab') {
                  handleKeyDown(e, emailRef)
                }
              }}
              fullWidth
              size="small"
            >
              <MenuItem value={0}>Nam</MenuItem>
              <MenuItem value={1}>Nữ</MenuItem>
            </TextField>

            <TextField
              inputRef={emailRef}
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              onKeyDown={(e) => handleKeyDown(e, trangthaiRef)}
              fullWidth
              size="small"
            />

            <TextField
              inputRef={trangthaiRef}
              select
              label="Trạng thái"
              value={formData.trangthai || '0'}
              onChange={(e) => setFormData({ ...formData, trangthai: e.target.value })}
              disabled={!isEditing}
              fullWidth
              size="small"
            >
              <MenuItem value="0">Đang làm việc</MenuItem>
              <MenuItem value="1">Nghỉ việc</MenuItem>
            </TextField>

            {isEditing && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  ref={saveButtonRef}
                  variant="contained"
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  fullWidth
                >
                  Lưu (Alt+L)
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  fullWidth
                >
                  Bỏ qua
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>

      <CrudToolbar
        module="users"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={isEditing ? handleSave : undefined}
        onCancel={isEditing ? handleCancel : undefined}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
        onPrint={handlePrint}
        onExportExcel={handleExportExcel}
        onClose={() => {
          const closeTab = useAppStore.getState().closeTab
          closeTab('nguoi-dung')
        }}
        editDisabled={!selectedEmployee || isEditing}
        deleteDisabled={!selectedEmployee || isEditing}
        saveDisabled={!isEditing || createMutation.isPending || updateMutation.isPending}
      />

      <ErrorSnackbar />
    </Box>
  )
}
