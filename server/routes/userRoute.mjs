import express from 'express';
import { getAllUsers, updateUserRole, deleteUser, updateUserPermissions, getUserTransactions, createUser, updateMyProfile, updateAllUsersCommission } from '../controllers/userController.mjs';
import { verifyAuth, requireRole } from '../middlewares/roleAuth.mjs';

const router = express.Router();

// All routes below require the user to be logged in
router.use(verifyAuth);

// Update own profile
router.put('/profile', updateMyProfile);

// Get all users (Superadmin and Admin can view)
router.get('/', requireRole('superadmin', 'admin'), getAllUsers);

// Bulk commission update (Superadmin only)
router.put('/bulk-commission', requireRole('superadmin'), updateAllUsersCommission);

// Create user (Only Superadmin can create)
router.post('/', requireRole('superadmin'), createUser);

// Update user role (Only Superadmin can update)
router.put('/:id/role', requireRole('superadmin'), updateUserRole);

// Update user permissions (Only Superadmin can update)
router.put('/:id/permissions', requireRole('superadmin'), updateUserPermissions);

// Delete user (Only Superadmin can delete)
router.delete('/:id', requireRole('superadmin'), deleteUser);

// Get user specific transactions (Superadmin and Admin can view)
router.get('/:id/transactions', requireRole('superadmin', 'admin'), getUserTransactions);

export default router;
