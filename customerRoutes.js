import express from 'express';
import { getCustomers, getCustomerById } from '../controllers/customerController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getCustomers);
router.get('/:id', verifyToken, getCustomerById);

export default router;
