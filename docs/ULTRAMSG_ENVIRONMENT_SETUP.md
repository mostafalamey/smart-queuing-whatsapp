# WhatsApp-First Queue System - Environment Configuration Guide

## Overview

This guide covers all environment variables needed for the WhatsApp-first queue management system.

## 🔧 Core UltraMessage Configuration

### Required Variables (Already Set)

```bash
# UltraMessage API Credentials
ULTRAMSG_INSTANCE_ID=instance140392              # Your UltraMessage instance
ULTRAMSG_TOKEN=hrub8q5j85dp0bgn                 # Your API token
ULTRAMSG_BASE_URL=https://api.ultramsg.com      # UltraMessage base URL

# WhatsApp Business Number
WHATSAPP_BUSINESS_NUMBER=201015544028           # Your connected WhatsApp number
WHATSAPP_COMPANY_NUMBER=201015544028            # Same as business number
```

### Webhook Configuration

```bash
# Webhook Security
ULTRAMSG_WEBHOOK_TOKEN=secure_webhook_secret_token_2025    # Secure webhook token
ULTRAMSG_WEBHOOK_ENABLED=true                              # Enable webhook processing
ULTRAMSG_WEBHOOK_URL=https://your-domain.vercel.app/api/webhooks/whatsapp/inbound
```

## 📱 WhatsApp Conversation System

### Core Settings

```bash
WHATSAPP_ENABLED=true                           # Enable WhatsApp features
WHATSAPP_DEBUG=true                            # Enable debug logging (dev only)
WHATSAPP_SESSION_DURATION_HOURS=24             # Conversation session duration
WHATSAPP_CONVERSATION_TIMEOUT=30               # Minutes before conversation reset
```

### QR Code Configuration

```bash
WHATSAPP_QR_ENABLED=true                       # Enable QR code generation
WHATSAPP_QR_MESSAGE_TEMPLATE=Hello! I would like to join the queue.
```

### Message Templates

```bash
WHATSAPP_WELCOME_MESSAGE=Welcome! I'm here to help you join our queue.
WHATSAPP_ERROR_MESSAGE=I'm sorry, something went wrong. Please try again by sending 'hello'.
WHATSAPP_INVALID_SELECTION_MESSAGE=Please reply with a valid number from the options above.
```

### Notification Settings

```bash
WHATSAPP_NOTIFICATIONS_ENABLED=true            # Enable WhatsApp notifications
WHATSAPP_QUEUE_UPDATES_ENABLED=true           # Send queue status updates
WHATSAPP_DETAILED_LOGGING=true                # Detailed logging for debugging
```

## 🖥️ Kiosk App Configuration

### Kiosk-Specific Variables

```bash
VITE_KIOSK_MODE=true                          # Enable kiosk mode
VITE_KIOSK_BRANCH_ID=                         # Set specific branch (if any)
VITE_KIOSK_DEPARTMENT_ID=                     # Set specific department (if any)
VITE_ORGANIZATION_ID=                         # Set organization ID
```

### Printer Configuration

```bash
VITE_PRINTER_ENABLED=true                     # Enable thermal printer
VITE_PRINTER_TYPE=thermal                     # Printer type
VITE_PRINTER_CONNECTION=usb                   # Connection type
VITE_PRINTER_WIDTH=80mm                       # Paper width
```

### Display Settings

```bash
VITE_AUTO_REFRESH_INTERVAL=30000              # Auto-refresh every 30 seconds
VITE_IDLE_TIMEOUT=120000                      # Idle timeout (2 minutes)
VITE_SHOW_QUEUE_STATS=true                    # Show queue statistics
```

## 🚀 Production Deployment Setup

### 1. Vercel Deployment (Admin App)

Add these environment variables in Vercel dashboard:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# UltraMessage (Production)
ULTRAMSG_INSTANCE_ID=instance140392
ULTRAMSG_TOKEN=hrub8q5j85dp0bgn
ULTRAMSG_BASE_URL=https://api.ultramsg.com
ULTRAMSG_WEBHOOK_TOKEN=your_secure_production_webhook_token

# WhatsApp
WHATSAPP_BUSINESS_NUMBER=201015544028
WHATSAPP_ENABLED=true
WHATSAPP_DEBUG=false
WHATSAPP_NOTIFICATIONS_ENABLED=true

# URLs
NEXT_PUBLIC_SITE_URL=https://your-admin-domain.vercel.app
ULTRAMSG_WEBHOOK_URL=https://your-admin-domain.vercel.app/api/webhooks/whatsapp/inbound
```

### 2. UltraMessage Webhook Configuration

Configure in your UltraMessage dashboard:

- **Webhook URL**: `https://your-domain.vercel.app/api/webhooks/whatsapp/inbound`
- **Webhook Token**: Same as `ULTRAMSG_WEBHOOK_TOKEN`
- **Events**: Enable "Message Received"

### 3. Database Organization Setup

Add your WhatsApp business number to organizations table:

```sql
UPDATE organizations
SET whatsapp_business_number = '201015544028',
    qr_code_message_template = 'Hello! I would like to join the queue for {{organization_name}}.'
WHERE id = 'your-organization-id';
```

## 🧪 Testing Configuration

### Local Testing

1. **Start admin app**: `npm run dev` (port 3001)
2. **Start kiosk app**: `npm run dev` (port 3003)
3. **Test webhook**: Use ngrok or similar for local webhook testing

### WhatsApp Flow Testing

1. Generate QR codes using the admin interface
2. Scan with mobile device - should open WhatsApp
3. Send test messages to verify conversation flows
4. Check database for conversation state persistence

## 🔒 Security Notes

### Production Security Checklist

- [ ] Use strong webhook tokens (32+ characters)
- [ ] Set `WHATSAPP_DEBUG=false` in production
- [ ] Secure your UltraMessage API token
- [ ] Use HTTPS for all webhook URLs
- [ ] Implement rate limiting for webhook endpoints
- [ ] Monitor webhook logs for suspicious activity

### Environment File Security

- Never commit `.env.local` files to version control
- Use different tokens for development/production
- Rotate webhook tokens regularly
- Monitor UltraMessage usage for unexpected spikes

## 📞 Support & Troubleshooting

### Common Issues

1. **Webhook not receiving messages**: Check UltraMessage webhook configuration
2. **QR codes not opening WhatsApp**: Verify phone number format
3. **Conversation state not persisting**: Check database connection
4. **Messages not sending**: Verify UltraMessage token and instance

### Debug Settings

For troubleshooting, enable these temporary settings:

```bash
WHATSAPP_DEBUG=true
WHATSAPP_DETAILED_LOGGING=true
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

## 📋 Environment Validation Checklist

- [ ] UltraMessage credentials working
- [ ] Webhook URL accessible from internet
- [ ] Database migration deployed
- [ ] Organization WhatsApp number configured
- [ ] QR code generation working
- [ ] Conversation flows tested
- [ ] Kiosk app printer connected
- [ ] All environment files secured
