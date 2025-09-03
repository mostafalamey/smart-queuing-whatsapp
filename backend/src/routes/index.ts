import { Router } from 'express';
import webhookRoutes from './webhook';
import adminRoutes from './admin';

const router = Router();

router.use('/webhook', webhookRoutes);
router.use('/admin', adminRoutes);

export default router;