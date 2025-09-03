import express from 'express';
import bodyParser from 'body-parser';
import { webhookRouter } from './routes/webhook';
import { adminRouter } from './routes/admin';
import { connectToDatabase } from './config/database';
import { initializeWhatsApp } from './config/whatsapp';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to the database
connectToDatabase();

// Initialize WhatsApp integration
initializeWhatsApp();

// Routes
app.use('/api/webhook', webhookRouter);
app.use('/api/admin', adminRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});