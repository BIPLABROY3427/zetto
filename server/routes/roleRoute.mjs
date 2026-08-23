import express from 'express';
import { createRole, deleteRole, getRoles, updateRole } from '../controllers/roleController.mjs';
import { requireRole, verifyAuth } from '../middlewares/roleAuth.mjs';

const router = express.Router();

router.use(verifyAuth);
// Only superadmin can manage roles
router.use(requireRole('superadmin'));

router.get('/', getRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
