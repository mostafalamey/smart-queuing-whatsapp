import React from 'react';

interface TicketDisplayProps {
    ticketNumber: string;
    serviceName: string;
    estimatedWaitTime: string;
}

const TicketDisplay: React.FC<TicketDisplayProps> = ({ ticketNumber, serviceName, estimatedWaitTime }) => {
    return (
        <div className="ticket-display">
            <h2>Your Ticket</h2>
            <p><strong>Ticket Number:</strong> {ticketNumber}</p>
            <p><strong>Service:</strong> {serviceName}</p>
            <p><strong>Estimated Wait Time:</strong> {estimatedWaitTime}</p>
        </div>
    );
};

export default TicketDisplay;