import React from 'react';
import { usePrinter } from '../hooks/usePrinter';

const PrintButton: React.FC<{ ticket: string }> = ({ ticket }) => {
    const { printTicket } = usePrinter();

    const handlePrint = () => {
        printTicket(ticket);
    };

    return (
        <button onClick={handlePrint}>
            Print Ticket
        </button>
    );
};

export default PrintButton;