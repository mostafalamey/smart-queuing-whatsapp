import { useEffect, useState } from 'react';

const usePrinter = () => {
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState(null);

    const printTicket = async (ticketData) => {
        setIsPrinting(true);
        setError(null);

        try {
            // Assuming there's a function in the printer service to handle printing
            await window.printTicket(ticketData);
            setIsPrinting(false);
        } catch (err) {
            setError('Failed to print the ticket. Please try again.');
            setIsPrinting(false);
        }
    };

    return { isPrinting, error, printTicket };
};

export default usePrinter;