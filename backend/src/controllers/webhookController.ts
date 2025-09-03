import { Request, Response } from 'express';
import WhatsAppService from '../services/whatsappService';
import MessageParser from '../services/messageParser';

class WebhookController {
    private whatsappService: WhatsAppService;

    constructor() {
        this.whatsappService = new WhatsAppService();
    }

    public handleIncomingMessage = async (req: Request, res: Response): Promise<void> => {
        const incomingMessage = req.body;
        
        // Parse the incoming message to determine the action
        const parsedMessage = MessageParser(incomingMessage);

        // Handle the parsed message accordingly
        switch (parsedMessage.action) {
            case 'get_services':
                await this.sendServiceList(incomingMessage.from);
                break;
            case 'request_ticket':
                await this.handleTicketRequest(parsedMessage.serviceNumber, incomingMessage.from);
                break;
            default:
                await this.whatsappService.sendMessage(incomingMessage.from, 'Sorry, I did not understand that.');
        }

        res.sendStatus(200);
    };

    private sendServiceList = async (to: string): Promise<void> => {
        const services = await this.whatsappService.getAvailableServices();
        const serviceListMessage = `Available services:\n${services.map(service => `${service.number}: ${service.name}`).join('\n')}`;
        await this.whatsappService.sendMessage(to, serviceListMessage);
    };

    private handleTicketRequest = async (serviceNumber: string, to: string): Promise<void> => {
        const ticket = await this.whatsappService.issueTicket(serviceNumber, to);
        const ticketMessage = `Your ticket for service ${serviceNumber} has been issued. Your ticket number is ${ticket.number}.`;
        await this.whatsappService.sendMessage(to, ticketMessage);
    };
}

export default WebhookController;