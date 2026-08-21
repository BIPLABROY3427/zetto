import express from 'express';
import { 
  createTicket, 
  getTickets, 
  getTicket, 
  addMessage, 
  markAsRead, 
  updateStatus 
} from '../controllers/ticketController.mjs';
import { verifyAuth, requireRole } from '../middlewares/roleAuth.mjs';

const router = express.Router();

// All routes require auth
router.use(verifyAuth);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicket);
router.post('/:id/message', addMessage);
router.put('/:id/read', markAsRead);

// Admin only status update
router.put('/:id/status', requireRole('superadmin', 'admin'), updateStatus);

export default router;
