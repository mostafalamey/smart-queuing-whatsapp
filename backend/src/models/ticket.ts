// smart-queuing-whatsapp/backend/src/models/ticket.ts

import { Schema, model } from 'mongoose';

const ticketSchema = new Schema({
    serviceId: {
        type: String,
        required: true,
    },
    customerId: {
        type: String,
        required: true,
    },
    ticketNumber: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['waiting', 'in_progress', 'completed'],
        default: 'waiting',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Ticket = model('Ticket', ticketSchema);

export default Ticket;