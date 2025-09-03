export const welcomeMessage = (businessName: string) => {
    return `Welcome to ${businessName}! Please send us a message with the service number you would like to queue for.`;
};

export const serviceListMessage = (services: Array<{ number: number; name: string }>) => {
    const serviceList = services.map(service => `${service.number}: ${service.name}`).join('\n');
    return `Here are the available services:\n${serviceList}\nPlease reply with the service number to get your ticket.`;
};

export const ticketConfirmationMessage = (ticketNumber: string, serviceName: string) => {
    return `Your ticket for ${serviceName} has been confirmed! Your ticket number is ${ticketNumber}.`;
};

export const statusUpdateMessage = (ticketNumber: string, status: string) => {
    return `Update for ticket number ${ticketNumber}: ${status}`;
};

export const goodbyeMessage = () => {
    return `Thank you for using our service! If you need further assistance, feel free to reach out.`;
};