import express from 'express'
import { permissionController } from '../controllers/permissionController.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

// Tất cả routes đều yêu cầu authentication
router.use(authenticate)

// Lấy quyền của user hiện tại
router.get('/my-permissions', permissionController.getMyPermissions)

// Lấy danh sách module user được truy cập
router.get('/my-modules', permissionController.getMyModules)

// Lấy menu thường dùng
router.get('/my-favorites', permissionController.getMyFavorites)

// Thêm vào thường dùng
router.post('/favorites/:moduleCode', permissionController.addFavorite)

// Xóa khỏi thường dùng
router.delete('/favorites/:moduleCode', permissionController.removeFavorite)

// Kiểm tra quyền cụ thể
router.post('/check', permissionController.checkPermission)

// Lấy thông tin đầy đủ (permissions + modules + favorites)
router.get('/details', permissionController.getPermissionDetails)

export default router
