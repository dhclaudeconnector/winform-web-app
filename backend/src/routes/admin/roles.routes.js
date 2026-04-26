import express from 'express'
import { roleController } from '../../controllers/admin/roleController.js'
import { authenticate } from '../../middleware/authMiddleware.js'
import { requirePermission } from '../../middleware/permissionMiddleware.js'

const router = express.Router()

// Tất cả routes đều yêu cầu authentication và quyền admin
router.use(authenticate)
router.use(requirePermission('users', 'EDIT')) // Chỉ admin mới có quyền EDIT users

// Quản lý vai trò
router.get('/roles', roleController.getAllRoles)
router.get('/roles/:id', roleController.getRoleById)
router.post('/roles', roleController.createRole)
router.put('/roles/:id', roleController.updateRole)
router.get('/roles/:id/permissions', roleController.getRolePermissions)

// Gán quyền cho vai trò
router.post('/roles/:id/permissions', roleController.assignPermissionToRole)
router.delete('/roles/:id/permissions/:permissionId', roleController.removePermissionFromRole)

// Quản lý vai trò của user
router.get('/users/:username/roles', roleController.getUserRoles)
router.post('/users/:username/roles', roleController.assignRoleToUser)
router.delete('/users/:username/roles/:roleId', roleController.removeRoleFromUser)

// Quản lý quyền riêng của user
router.get('/users/:username/permissions', roleController.getUserPermissions)
router.post('/users/:username/permissions', roleController.assignPermissionToUser)
router.delete('/users/:username/permissions/:permissionId', roleController.removePermissionFromUser)

// Lấy danh sách modules và permissions
router.get('/modules', roleController.getAllModules)
router.get('/permissions', roleController.getAllPermissions)

// Lấy danh sách users
router.get('/users', roleController.getAllUsers)

export default router
