# Smart Queuing WhatsApp System

A comprehensive queue management system that provides seamless customer interaction through WhatsApp, eliminating the need for separate customer applications. Features a powerful admin dashboard, kiosk interface, and complete WhatsApp-first customer experience.

## 🚀 System Overview

The Smart Queuing WhatsApp System enables customers to join and manage their queue positions entirely through WhatsApp conversations. The system consists of three main applications:

### **Admin Dashboard** (`/admin-app`)

- Organization, branch, and department management
- Real-time queue monitoring and analytics
- WhatsApp message template customization
- Member management with role-based access control
- Comprehensive reporting and insights

### **Kiosk Application** (`/kiosk-app`)

- Touch-screen interface for walk-in customers
- QR code generation for WhatsApp integration
- Real-time queue display and management
- Ticket printing functionality

### **Customer App** (`/customer-app`)

- Optional web interface for customers
- Real-time queue status checking
- Alternative to WhatsApp interaction

## 📱 WhatsApp-First Customer Journey

1. **QR Code Scan**: Customer scans QR code, opens WhatsApp with predefined message
2. **Welcome Message**: System responds with branch/department selection
3. **Service Selection**: Customer chooses service with estimated wait times
4. **Ticket Confirmation**: System confirms ticket with position and details
5. **Status Updates**: Real-time position updates via WhatsApp
6. **Completion Notification**: Final notification when service is ready

## 🏗 Technical Architecture

### **Backend Services**

- **UltraMsg Integration**: WhatsApp Business API for message handling
- **Supabase Database**: PostgreSQL with real-time subscriptions
- **Conversation Engine**: Multi-step conversation flow management
- **Analytics System**: Queue performance and wait time calculation
- **Webhook Processing**: Automated message routing and responses

### **Frontend Applications**

- **Next.js Framework**: Modern React-based applications
- **Tailwind CSS**: Responsive, mobile-first styling
- **TypeScript**: Type-safe development across all applications
- **Real-time Updates**: Live queue status and analytics
- **PWA Support**: Mobile-optimized progressive web apps

### **Database Schema**

- Organizations, branches, departments, and services
- Queue tickets with status tracking
- Conversation state management
- Analytics and reporting data
- User authentication and role management

## 🛠 Project Structure

```bash
smart-queuing-whatsapp/
├── admin-app/              # Admin dashboard (Next.js)
│   ├── src/app/           # App router pages
│   ├── src/components/    # Reusable React components
│   └── src/lib/           # Utilities and configurations
├── kiosk-app/             # Kiosk interface (Vite + React)
│   ├── src/components/    # Kiosk-specific components
│   └── src/services/      # API integration
├── customer-app/          # Customer web interface (Next.js)
│   ├── src/app/          # Customer-facing pages
│   └── src/components/   # Customer UI components
├── backend/               # API server (Node.js + Express)
│   ├── src/controllers/   # Route handlers
│   ├── src/services/      # Business logic
│   └── src/models/        # Data models
├── supabase/              # Database migrations and functions
│   ├── migrations/        # SQL migration files
│   └── src/functions/     # Edge functions
├── shared/                # Shared utilities and types
└── docs/                  # Documentation and guides
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- UltraMsg WhatsApp Business API account
- Git for version control

### Quick Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd smart-queuing-whatsapp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit with your credentials
   # - Supabase URL and keys
   # - UltraMsg API credentials
   # - WhatsApp Business number
   ```

4. **Run database migrations**

   ```bash
   npx supabase db push
   ```

5. **Start development servers**

   ```bash
   # Start all applications
   npm run dev

   # Or start individually:
   cd admin-app && npm run dev      # Admin dashboard
   cd kiosk-app && npm run dev      # Kiosk interface
   cd customer-app && npm run dev   # Customer app
   ```

## 🔧 Configuration

### Environment Variables

Key environment variables needed:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# UltraMsg WhatsApp API
ULTRAMSG_TOKEN=your_ultramsg_token
ULTRAMSG_INSTANCE_ID=your_instance_id
WHATSAPP_BUSINESS_NUMBER=your_whatsapp_number

# Application URLs
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
NEXT_PUBLIC_KIOSK_URL=http://localhost:3002
NEXT_PUBLIC_CUSTOMER_URL=http://localhost:3003
```

### WhatsApp Integration

1. Set up UltraMsg account and get API credentials
2. Configure webhook URL in UltraMsg dashboard
3. Test message sending and receiving
4. Configure message templates in admin dashboard

## 📋 Features

### ✅ Completed Features

- **WhatsApp-First Customer Experience**: Complete conversation flow
- **Admin Dashboard**: Organization and queue management
- **Real-time Analytics**: Queue performance and wait times
- **Multi-tenant Architecture**: Support for multiple organizations
- **Kiosk Interface**: Touch-screen queue management
- **Message Templates**: Customizable WhatsApp conversations
- **Role-based Access**: Admin, Manager, Employee permissions
- **Database Migrations**: Automated schema management
- **End-to-end Testing**: Comprehensive test framework

### 🔮 Future Enhancements

- Multi-language support for international organizations
- Advanced analytics and reporting dashboard
- Integration with additional messaging platforms
- Mobile app for queue managers
- AI-powered queue optimization
- Customer feedback and rating system

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**: Production deployment instructions
- **[WhatsApp Setup](docs/ULTRAMSG_ENVIRONMENT_SETUP.md)**: WhatsApp API configuration
- **[Database Setup](docs/Others/DATABASE_SETUP.md)**: Database schema and migrations
- **[Analytics Guide](docs/Analytics/)**: Analytics implementation and usage

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in `/docs`
- Review existing issues and discussions

---

**Last Updated**: September 3, 2025  
**Status**: Production Ready ✅
