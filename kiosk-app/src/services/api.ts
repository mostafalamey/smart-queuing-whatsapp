import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Update with your backend URL

export const sendWhatsAppMessage = async (message: string, phoneNumber: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/whatsapp/send`, {
            message,
            phoneNumber,
        });
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
};

export const getServiceNumbers = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/services`);
        return response.data;
    } catch (error) {
        console.error('Error fetching service numbers:', error);
        throw error;
    }
};

export const requestTicket = async (serviceNumber: string, phoneNumber: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/queue/request`, {
            serviceNumber,
            phoneNumber,
        });
        return response.data;
    } catch (error) {
        console.error('Error requesting ticket:', error);
        throw error;
    }
};

export const getTicketStatus = async (ticketId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/queue/status/${ticketId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching ticket status:', error);
        throw error;
    }
};