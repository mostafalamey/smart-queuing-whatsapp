export const parseIncomingMessage = (message: string): { serviceNumber?: string; action?: string } => {
    const trimmedMessage = message.trim().toLowerCase();
    
    // Check for service number
    const serviceMatch = trimmedMessage.match(/^\d+$/);
    if (serviceMatch) {
        return { serviceNumber: serviceMatch[0] };
    }

    // Check for specific actions (e.g., "help", "status")
    const actionMatch = trimmedMessage.match(/^(help|status)$/);
    if (actionMatch) {
        return { action: actionMatch[0] };
    }

    return {};
};