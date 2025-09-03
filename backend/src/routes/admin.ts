import { Router } from 'express';
import { QueueController } from '../controllers/queueController';

const router = Router();
const queueController = new QueueController();

// Route to get all services
router.get('/services', queueController.getServices);

// Route to create a ticket
router.post('/ticket', queueController.createTicket);

// Route to get ticket status
router.get('/ticket/:id/status', queueController.getTicketStatus);

export default router;