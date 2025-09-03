import express from 'express';
import { WebhookController } from '../controllers/webhookController';

const router = express.Router();
const webhookController = new WebhookController();

// Route to handle incoming WhatsApp webhook requests
router.post('/whatsapp', webhookController.handleIncomingMessage);

export default router;