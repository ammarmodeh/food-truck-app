import express from 'express';
import { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, getQueue } from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, placeOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/', protect, admin, getAllOrders);
router.put('/:id', protect, admin, updateOrderStatus);
router.get('/queue', getQueue);

export default router;