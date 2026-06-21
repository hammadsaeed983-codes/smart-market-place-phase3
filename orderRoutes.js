import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
} from '../controllers/orderController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getOrders);
router.get('/:id', verifyToken, getOrderById);
router.post('/', createOrder);
router.put('/:id/status', verifyToken, updateOrderStatus);

export default router;
