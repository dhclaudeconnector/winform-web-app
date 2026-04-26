import express from 'express'
import { pool } from '../config/database.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// Get all employees with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { offset = 0, limit = 100 } = req.query

    const result = await pool.query(
      `SELECT manv, taikhoan, holot, ten, gioitinh, email, trangthai
       FROM current.dmnhanvien
       ORDER BY manv
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    const countResult = await pool.query('SELECT COUNT(*) FROM current.dmnhanvien')

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count)
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách nhân viên' })
  }
})

// Get single employee
router.get('/:manv', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT manv, taikhoan, holot, ten, gioitinh, email, trangthai FROM current.dmnhanvien WHERE manv = $1',
      [req.params.manv]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error fetching employee:', error)
    res.status(500).json({ success: false, message: 'Lỗi khi tải thông tin nhân viên' })
  }
})

// Create employee
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { taikhoan, holot, ten, gioitinh, email, trangthai } = req.body

    // Generate manv
    const maxResult = await pool.query('SELECT MAX(manv::integer) as max FROM current.dmnhanvien WHERE manv ~ \'^[0-9]+$\'')
    const nextManv = (parseInt(maxResult.rows[0].max || 0) + 1).toString()

    const result = await pool.query(
      `INSERT INTO current.dmnhanvien (manv, taikhoan, holot, ten, gioitinh, email, trangthai)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING manv, taikhoan, holot, ten, gioitinh, email, trangthai`,
      [nextManv, taikhoan, holot?.toUpperCase(), ten?.toUpperCase(), gioitinh, email, trangthai || '0']
    )

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error creating employee:', error)
    res.status(500).json({ success: false, message: 'Lỗi khi tạo nhân viên' })
  }
})

// Update employee (also support PATCH for compatibility)
router.put('/:manv', authMiddleware, async (req, res) => {
  try {
    const { taikhoan, holot, ten, gioitinh, email, trangthai } = req.body

    const result = await pool.query(
      `UPDATE current.dmnhanvien
       SET taikhoan = $1, holot = $2, ten = $3, gioitinh = $4, email = $5, trangthai = $6
       WHERE manv = $7
       RETURNING manv, taikhoan, holot, ten, gioitinh, email, trangthai`,
      [taikhoan, holot?.toUpperCase(), ten?.toUpperCase(), gioitinh, email, trangthai, req.params.manv]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating employee:', error)
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật nhân viên' })
  }
})

// Delete employee
router.delete('/:manv', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM current.dmnhanvien WHERE manv = $1 RETURNING manv', [req.params.manv])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' })
    }

    res.json({ success: true, message: 'Xóa nhân viên thành công' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    res.status(500).json({ success: false, message: 'Lỗi khi xóa nhân viên' })
  }
})

export default router
