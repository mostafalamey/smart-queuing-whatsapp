import { Printer } from 'some-printer-library'; // Replace with actual printer library import

const printer = new Printer();

export const printTicket = (ticketData) => {
    const ticketContent = `
        Ticket Number: ${ticketData.ticketNumber}
        Service: ${ticketData.serviceName}
        Date: ${ticketData.date}
        Time: ${ticketData.time}
    `;

    printer.print(ticketContent)
        .then(() => {
            console.log('Ticket printed successfully');
        })
        .catch((error) => {
            console.error('Error printing ticket:', error);
        });
};