# Smart Queuing WhatsApp

This project provides a seamless customer workflow for queue management using WhatsApp. The goal is to allow customers to interact with the service entirely through WhatsApp, eliminating the need for a separate customer app.

## Overview

When a customer scans the QR code, they are directed to WhatsApp with a predefined message to initiate the queue process. The workflow is as follows:

1. **Scan QR Code**: The customer scans a QR code that opens WhatsApp with a predefined message.
2. **Send Message**: The customer sends the message to the organization's WhatsApp number.
3. **Receive Services List**: The customer receives a message listing all available services.
4. **Select Service**: The customer replies with the number corresponding to the desired service.
5. **Receive Ticket**: The customer receives a ticket for the selected service.
6. **Status Updates**: The customer receives real-time updates about their queue status via WhatsApp.

## Project Structure

- **backend**: Contains the server-side code for handling WhatsApp messages and managing the queue.
  - **src**: Main source code for the backend application.
  - **config**: Configuration files for database and WhatsApp integration.
  - **controllers**: Logic for handling incoming requests and processing data.
  - **services**: Business logic for WhatsApp messaging and queue management.
  - **models**: Database models representing queues, tickets, and services.
  - **routes**: API routes for handling requests.
  - **utils**: Utility functions for QR code generation and message templates.
- **kiosk-app**: A repurposed application that serves as a kiosk for printing tickets.

  - **src**: Main source code for the kiosk application.
  - **components**: React components for service selection and ticket display.
  - **services**: Functions for API calls and printer management.
  - **hooks**: Custom hooks for managing printer functionality.
  - **types**: TypeScript types used throughout the application.

- **supabase**: Contains database migrations and functions for managing the queue.

- **docker-compose.yml**: Configuration for running the application in Docker.

## Getting Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the backend directory and install dependencies:

   ```bash
   cd smart-queuing-whatsapp/backend
   npm install
   ```

3. Set up environment variables by copying the example:

   ```bash
   cp .env.example .env
   ```

4. Start the backend server:

   ```bash
   npm start
   ```

5. Navigate to the kiosk-app directory and install dependencies:

   ```bash
   cd ../kiosk-app
   npm install
   ```

6. Start the kiosk application:

   ```bash
   npm run dev
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
