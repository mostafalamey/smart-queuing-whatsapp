import { Request, Response } from 'express';
import { QueueService } from '../services/queueService';
import { WhatsAppService } from '../services/whatsappService';

export class QueueController {
    private queueService: QueueService;
    private whatsappService: WhatsAppService;

    constructor() {
        this.queueService = new QueueService();
        this.whatsappService = new WhatsAppService();
    }

    public async handleWhatsAppMessage(req: Request, res: Response): Promise<Response> {
        const { body } = req;
        const message = body.message;

        // Logic to parse the incoming message and determine the action
        const responseMessage = await this.processMessage(message);

        // Send response back to WhatsApp
        await this.whatsappService.sendMessage(body.from, responseMessage);

        return res.status(200).send('Message processed');
    }

    private async processMessage(message: string): Promise<string> {
        // Logic to handle different types of messages
        if (message === 'services') {
            const services = await this.queueService.getAvailableServices();
            return `Available services: ${services.join(', ')}`;
        } else if (this.isServiceNumber(message)) {
            const ticket = await this.queueService.issueTicket(message);
            return `Your ticket number is: ${ticket.number}`;
        }
        return 'Invalid command. Please send "services" to see available options.';
    }

    private isServiceNumber(message: string): boolean {
        // Logic to determine if the message is a valid service number
        return /^\d+$/.test(message);
    }
}