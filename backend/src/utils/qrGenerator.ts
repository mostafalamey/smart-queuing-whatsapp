import QRCode from 'qrcode';

export const generateQRCode = async (message: string): Promise<string> => {
    try {
        const qrCodeUrl = await QRCode.toDataURL(message);
        return qrCodeUrl;
    } catch (error) {
        throw new Error('Failed to generate QR code: ' + error.message);
    }
};