import { config } from 'dotenv';

config();

const whatsappConfig = {
    apiKey: process.env.WHATSAPP_API_KEY,
    apiUrl: process.env.WHATSAPP_API_URL,
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER,
    predefinedMessage: "Hello, I would like to take a queue ticket for your services. Please provide me with the available options.",
};

export default whatsappConfig;