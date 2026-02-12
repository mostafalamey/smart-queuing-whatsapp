import React from 'react';

const ServiceSelection: React.FC = () => {
    const services = [
        { id: 1, name: 'Service 1' },
        { id: 2, name: 'Service 2' },
        { id: 3, name: 'Service 3' },
    ];

    const handleServiceSelection = (serviceId: number) => {
        const message = `I would like to get a ticket for service number ${serviceId}.`;
        const whatsappNumber = 'YOUR_WHATSAPP_NUMBER'; // Replace with your WhatsApp number
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div>
            <h1>Select a Service</h1>
            <ul>
                {services.map(service => (
                    <li key={service.id}>
                        <button onClick={() => handleServiceSelection(service.id)}>
                            {service.name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ServiceSelection;