import express from 'express';
import { getAuditLogs, getMyAuditLogs } from '../controllers/auditController.js';
import { protect, admin, posUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getAuditLogs);
router.get('/my', protect, posUser, getMyAuditLogs);

export default router;
