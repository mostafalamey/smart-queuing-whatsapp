import { Schema, model } from 'mongoose';

const queueSchema = new Schema({
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

const Queue = model('Queue', queueSchema);

export default Queue;