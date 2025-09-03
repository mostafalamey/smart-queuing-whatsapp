// This file exports TypeScript types used throughout the kiosk application.

export interface Service {
    id: number;
    name: string;
    description: string;
}

export interface Ticket {
    id: number;
    serviceId: number;
    customerName: string;
    ticketNumber: string;
    status: 'waiting' | 'in_progress' | 'completed';
    createdAt: Date;
}

export interface QueueStatus {
    ticketNumber: string;
    position: number;
    estimatedWaitTime: number; // in minutes
}