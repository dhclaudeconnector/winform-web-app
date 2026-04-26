'use client'

import { Box } from '@mui/material'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef } from 'ag-grid-community'
import { useAppStore } from '@/lib/store/uiStore'

ModuleRegistry.registerModules([AllCommunityModule])

interface AppGridProps<T> {
  rowData: T[]
  columnDefs: ColDef<T>[]
  onRowSelected?: (row: T | null) => void
  height?: number | string
  editable?: boolean
  loading?: boolean
  onCellValueChanged?: (row: T) => void
  getRowId?: (params: any) => string
}

export function AppGrid<T extends Record<string, any>>({
  rowData,
  columnDefs,
  onRowSelected,
  height = '100%',
  loading,
  onCellValueChanged,
  getRowId,
}: AppGridProps<T>) {
  const mode = useAppStore((state) => state.mode)

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
  })

  return (
    <Box className="legacy-grid-shell" sx={{ height, width: '100%' }}>
      <AgGridReact<T>
        theme={customTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        rowSelection={{
          mode: 'singleRow',
          enableClickSelection: true,
        }}
        animateRows
        pagination
        paginationPageSize={10}
        paginationPageSizeSelector={[10, 20, 50, 100]}
        overlayNoRowsTemplate={loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu'}
        getRowId={getRowId}
        onSelectionChanged={(event) => {
          const selected = event.api.getSelectedRows()
          onRowSelected?.(selected[0] ?? null)
        }}
        onCellValueChanged={(event) => onCellValueChanged?.(event.data)}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
          editable: false,
        }}
        localeText={{
          // Pagination
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

          // Selection
          selectAll: 'Chọn tất cả',
          searchOoo: 'Tìm kiếm...',
          blanks: 'Trống',
          noRowsToShow: 'Không có dữ liệu',

          // Filters
          filterOoo: 'Lọc...',
          equals: 'Bằng',
          notEqual: 'Không bằng',
          lessThan: 'Nhỏ hơn',
          greaterThan: 'Lớn hơn',
          lessThanOrEqual: 'Nhỏ hơn hoặc bằng',
          greaterThanOrEqual: 'Lớn hơn hoặc bằng',
          inRange: 'Trong khoảng',
          contains: 'Chứa',
          notContains: 'Không chứa',
          startsWith: 'Bắt đầu với',
          endsWith: 'Kết thúc với',
          andCondition: 'VÀ',
          orCondition: 'HOẶC',
          applyFilter: 'Áp dụng',
          resetFilter: 'Đặt lại',
          clearFilter: 'Xóa',

          // Column menu
          pinColumn: 'Ghim cột',
          autosizeThiscolumn: 'Tự động điều chỉnh cột này',
          autosizeAllColumns: 'Tự động điều chỉnh tất cả cột',
          groupBy: 'Nhóm theo',
          ungroupBy: 'Bỏ nhóm theo',
          resetColumns: 'Đặt lại cột',
          expandAll: 'Mở rộng tất cả',
          collapseAll: 'Thu gọn tất cả',
          copy: 'Sao chép',
          ctrlC: 'Ctrl+C',
          copyWithHeaders: 'Sao chép với tiêu đề',
          paste: 'Dán',
          ctrlV: 'Ctrl+V',
          export: 'Xuất',

          // Row count
          rowCount: 'Số dòng',
        }}
      />
    </Box>
  )
}
