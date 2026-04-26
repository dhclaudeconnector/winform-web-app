'use client'

import { AgGridReact } from 'ag-grid-react'
import { Box } from '@mui/material'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridOptions } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])

export interface AppGridProps<T = any> {
  rowData: T[]
  columnDefs: ColDef<T>[]
  onRowSelected?: (row: T | null) => void
  onRowDoubleClicked?: (row: T) => void
  onCellValueChanged?: (params: any) => void
  editable?: boolean
  loading?: boolean
  height?: string | number
  gridOptions?: GridOptions<T>
}

const defaultLocaleText = {
  page: 'Trang',
  more: 'Thêm',
  to: 'đến',
  of: 'của',
  next: 'Tiếp',
  last: 'Cuối',
  first: 'Đầu',
  previous: 'Trước',
  loadingOoo: 'Đang tải...',
  noRowsToShow: 'Không có dữ liệu',
  selectAll: 'Chọn tất cả',
  searchOoo: 'Tìm kiếm...',
  blanks: 'Trống',
  filterOoo: 'Lọc...',
  applyFilter: 'Áp dụng',
  equals: 'Bằng',
  notEqual: 'Không bằng',
  lessThan: 'Nhỏ hơn',
  greaterThan: 'Lớn hơn',
  contains: 'Chứa',
  notContains: 'Không chứa',
  startsWith: 'Bắt đầu với',
  endsWith: 'Kết thúc với',
}

export function AppGrid<T = any>({
  rowData,
  columnDefs,
  onRowSelected,
  onRowDoubleClicked,
  onCellValueChanged,
  editable = false,
  loading = false,
  height = '500px',
  gridOptions,
}: AppGridProps<T>) {
  const customTheme = themeQuartz.withParams({
    accentColor: '#1a6fc4',
    backgroundColor: '#ffffff',
    borderColor: '#c5d0df',
    browserColorScheme: 'light',
    chromeBackgroundColor: '#dfe8f5',
    columnBorder: true,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 12,
    foregroundColor: '#16314f',
    headerBackgroundColor: '#dfe8f5',
    headerFontSize: 12,
    headerFontWeight: 600,
    oddRowBackgroundColor: '#f9fbff',
    rowBorder: true,
    sidePanelBorder: true,
    wrapperBorder: true,
  })

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    editable: editable,
  }

  const handleSelectionChanged = (event: any) => {
    const selectedRows = event.api.getSelectedRows()
    onRowSelected?.(selectedRows.length > 0 ? selectedRows[0] : null)
  }

  const handleRowDoubleClicked = (event: any) => {
    onRowDoubleClicked?.(event.data)
  }

  return (
    <Box className="legacy-grid-shell" sx={{ height, width: '100%' }}>
      <AgGridReact
        theme={customTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection={{
          mode: 'singleRow',
          enableClickSelection: true,
        }}
        onSelectionChanged={handleSelectionChanged}
        onRowDoubleClicked={handleRowDoubleClicked}
        onCellValueChanged={onCellValueChanged}
        pagination={true}
        paginationPageSize={20}
        paginationPageSizeSelector={[10, 20, 50, 100]}
        localeText={defaultLocaleText}
        loading={loading}
        {...gridOptions}
      />
    </Box>
  )
}
