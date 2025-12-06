import express from 'express';
import { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, getQueue, refundOrder } from '../controllers/orderController.js';
import { protect, admin, posUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, placeOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/', protect, posUser, getAllOrders);
router.put('/:id', protect, posUser, updateOrderStatus);
router.put('/:id/refund', protect, posUser, refundOrder);
router.get('/queue', getQueue);

export default router;