import express from 'express';
import { approveKYC, createUser, deleteUser, getAllUsers, getMyProfile, getUserById, getUserTransactions, rejectKYC, updateAllUsersCommission, updateMyProfile, updateUserPermissions, updateUserRole, uploadKYC } from '../controllers/userController.mjs';
import { requireRole, verifyAuth } from '../middlewares/roleAuth.mjs';

const router = express.Router();

// All routes below require the user to be logged in
router.use(verifyAuth);

// Get my profile
router.get('/me', getMyProfile);

// KYC upload route
router.post('/kyc/upload', uploadKYC);

// Update own profile
router.put('/profile', updateMyProfile);

// Get all users (Superadmin and Admin can view)
router.get('/', requireRole('superadmin', 'admin'), getAllUsers);

// Bulk commission update (Superadmin only)
router.put('/bulk-commission', requireRole('superadmin'), updateAllUsersCommission);

// Create user (Superadmin & Admin with permission)
router.post('/', requireRole('superadmin', 'admin'), createUser);

// Update user role (Only Superadmin can update)
router.put('/:id/role', requireRole('superadmin'), updateUserRole);

// Update user permissions (Superadmin & Admin with permission)
router.put('/:id/permissions', requireRole('superadmin', 'admin'), updateUserPermissions);

// Delete user (Superadmin & Admin with permission)
router.delete('/:id', requireRole('superadmin', 'admin'), deleteUser);

// Get user specific transactions (Superadmin and Admin can view)
router.get('/:id/transactions', requireRole('superadmin', 'admin'), getUserTransactions);

// Get single user details by ID (Superadmin and Admin can view)
router.get('/:id', requireRole('superadmin', 'admin'), getUserById);

// Approve KYC (Superadmin & Admin with permission)
router.put('/:id/kyc/approve', requireRole('superadmin', 'admin'), approveKYC);

// Reject KYC (Superadmin & Admin with permission)
router.put('/:id/kyc/reject', requireRole('superadmin', 'admin'), rejectKYC);

export default router;
