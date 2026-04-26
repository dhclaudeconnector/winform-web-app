'use client'

import { Button, Stack, TextField, Menu, MenuItem, IconButton, InputAdornment } from '@mui/material'
import { Plus, Pencil, Trash2, Save, X, ChevronLeft, ChevronRight, Search, Printer, FileSpreadsheet, MoreVertical, RefreshCw, XCircle } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { PermissionGuard } from './PermissionGuard'

interface CrudToolbarProps {
  module?: string // Module code để tự động check quyền
  onAdd?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSave?: () => void
  onCancel?: () => void
  onPrev?: () => void
  onNext?: () => void
  onPrint?: () => void
  onExportExcel?: () => void
  onRefresh?: () => void
  onClose?: () => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  editDisabled?: boolean
  deleteDisabled?: boolean
  saveDisabled?: boolean
  prevDisabled?: boolean
  nextDisabled?: boolean
  additionalMenuItems?: Array<{ label: string; onClick: () => void }>
}

export function CrudToolbar(props: CrudToolbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      className="no-print"
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        px: 1,
        py: 0.75,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        flexWrap: 'wrap',
        gap: { xs: 0.5, sm: 1 },
      }}
    >
      {props.onAdd ? (
        props.module ? (
          <PermissionGuard module={props.module} action="CREATE">
            <Button startIcon={<Plus size={16} />} onClick={props.onAdd}>
              Thêm
            </Button>
          </PermissionGuard>
        ) : (
          <Button startIcon={<Plus size={16} />} onClick={props.onAdd}>
            Thêm
          </Button>
        )
      ) : null}

      {props.onEdit ? (
        props.module ? (
          <PermissionGuard module={props.module} action="EDIT">
            <Button startIcon={<Pencil size={16} />} onClick={props.onEdit} disabled={props.editDisabled}>
              Sửa
            </Button>
          </PermissionGuard>
        ) : (
          <Button startIcon={<Pencil size={16} />} onClick={props.onEdit} disabled={props.editDisabled}>
            Sửa
          </Button>
        )
      ) : null}

      {props.onDelete ? (
        props.module ? (
          <PermissionGuard module={props.module} action="DELETE">
            <Button startIcon={<Trash2 size={16} />} onClick={props.onDelete} disabled={props.deleteDisabled} color="error">
              Xóa
            </Button>
          </PermissionGuard>
        ) : (
          <Button startIcon={<Trash2 size={16} />} onClick={props.onDelete} disabled={props.deleteDisabled} color="error">
            Xóa
          </Button>
        )
      ) : null}
      {props.onSave ? (
        <Button startIcon={<Save size={16} />} onClick={props.onSave} disabled={props.saveDisabled} variant="contained">
          Lưu
        </Button>
      ) : null}
      {props.onCancel ? (
        <Button startIcon={<X size={16} />} onClick={props.onCancel}>
          Hủy
        </Button>
      ) : null}
      {props.onPrev ? (
        <Button startIcon={<ChevronLeft size={16} />} onClick={props.onPrev} disabled={props.prevDisabled}>
          Trước
        </Button>
      ) : null}
      {props.onNext ? (
        <Button startIcon={<ChevronRight size={16} />} onClick={props.onNext} disabled={props.nextDisabled}>
          Sau
        </Button>
      ) : null}
      {props.onPrint ? (
        props.module ? (
          <PermissionGuard module={props.module} action="PRINT">
            <Button startIcon={<Printer size={16} />} onClick={props.onPrint}>
              In
            </Button>
          </PermissionGuard>
        ) : (
          <Button startIcon={<Printer size={16} />} onClick={props.onPrint}>
            In
          </Button>
        )
      ) : null}
      {props.onExportExcel ? (
        props.module ? (
          <PermissionGuard module={props.module} action="EXPORT">
            <Button startIcon={<FileSpreadsheet size={16} />} onClick={props.onExportExcel}>
              Xuất Excel
            </Button>
          </PermissionGuard>
        ) : (
          <Button startIcon={<FileSpreadsheet size={16} />} onClick={props.onExportExcel}>
            Xuất Excel
          </Button>
        )
      ) : null}
      {props.onRefresh ? (
        <Button startIcon={<RefreshCw size={16} />} onClick={props.onRefresh}>
          Làm mới
        </Button>
      ) : null}
      {props.onClose ? (
        <Button startIcon={<XCircle size={16} />} onClick={props.onClose} color="error">
          Thoát
        </Button>
      ) : null}
      {props.additionalMenuItems && props.additionalMenuItems.length > 0 ? (
        <>
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreVertical size={16} />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            {props.additionalMenuItems.map((item, index) => (
              <MenuItem
                key={index}
                onClick={() => {
                  item.onClick()
                  handleMenuClose()
                }}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : null}
      {props.onSearchChange ? (
        <TextField
          placeholder="Tìm kiếm..."
          value={props.searchValue ?? ''}
          onChange={(event) => props.onSearchChange?.(event.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 260 }}
        />
      ) : null}
    </Stack>
  )
}
