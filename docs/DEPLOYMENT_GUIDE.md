# 🚀 WhatsApp-First Queue System - Deployment Guide

## Overview

This guide covers the complete deployment of your WhatsApp-first queue management system with UltraMessage integration.

## 📋 Pre-Deployment Checklist

### ✅ Environment Configuration

- [x] UltraMessage credentials configured
- [x] WhatsApp business number set
- [x] Supabase connection working
- [x] Environment variables validated
- [ ] Production environment variables configured
- [ ] Webhook URLs updated for production

### ✅ Code Preparation

- [x] WhatsApp conversation engine implemented
- [x] Webhook system enhanced
- [x] QR code service created
- [x] Kiosk app transformed
- [x] Database migration ready
- [x] TypeScript compilation successful

## 🗄️ Database Deployment

### Step 1: Deploy Migration

```bash
cd supabase
supabase db push --db-url "postgresql://postgres.your-project-id:your-db-password@aws-0-ap-southeast-1.pooler.supabase.co:5432/postgres"
```

### Step 2: Configure Organization

```sql
-- Update your organization with WhatsApp settings
UPDATE organizations
SET
    whatsapp_business_number = '201015544028',
    qr_code_message_template = 'Hello! I would like to join the queue for {{organization_name}}.'
WHERE id = 'YOUR_ORGANIZATION_ID';
```

### Step 3: Verify Tables

Check that these tables exist:

- `whatsapp_conversations`
- `whatsapp_inbound_messages` (from previous migration)
- Updated `tickets` table with WhatsApp columns
- Updated `services` table with WhatsApp features

## 🌐 Vercel Deployment

### Admin App Deployment

1. **Deploy to Vercel**

   ```bash
   cd admin-app
   npx vercel --prod
   ```

2. **Configure Environment Variables in Vercel Dashboard**
   Go to your Vercel project → Settings → Environment Variables

   Copy from `.env.production.template`:

   ```bash
   # Core Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # UltraMessage
   ULTRAMSG_INSTANCE_ID=instance140392
   ULTRAMSG_TOKEN=hrub8q5j85dp0bgn
   ULTRAMSG_BASE_URL=https://api.ultramsg.com

   # WhatsApp
   WHATSAPP_BUSINESS_NUMBER=201015544028
   WHATSAPP_ENABLED=true
   WHATSAPP_DEBUG=false

   # Production URLs
   NEXT_PUBLIC_SITE_URL=https://your-admin.vercel.app
   ULTRAMSG_WEBHOOK_URL=https://your-admin.vercel.app/api/webhooks/whatsapp/inbound

   # IMPORTANT: Generate a secure webhook token
   ULTRAMSG_WEBHOOK_TOKEN=your_secure_32_char_production_token_here
   ```

3. **Update Webhook URL**

   ```bash
   ULTRAMSG_WEBHOOK_URL=https://your-actual-domain.vercel.app/api/webhooks/whatsapp/inbound
   ```

### Kiosk App Deployment

1. **Deploy Kiosk App**

   ```bash
   cd kiosk-app
   npx vercel --prod
   ```

2. **Configure Kiosk Environment**

   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_WHATSAPP_BUSINESS_NUMBER=201015544028
   VITE_PRINTER_ENABLED=true
   ```

## 📱 UltraMessage Configuration

### Step 1: Access UltraMessage Dashboard

1. Login to your UltraMessage account
2. Go to instance140392 dashboard

### Step 2: Configure Webhook

1. Navigate to **Settings** → **Webhooks**
2. Set webhook URL: `https://your-domain.vercel.app/api/webhooks/whatsapp/inbound`
3. Set webhook token: Same as `ULTRAMSG_WEBHOOK_TOKEN` in your env
4. Enable events:
   - ✅ **Message Received**
   - ✅ **Message Status** (optional)
5. Save configuration

### Step 3: Test Webhook

Use the test tool in UltraMessage dashboard or:

```bash
# From admin app directory
npm run setup:webhook
```

## 🧪 Testing Deployment

### 1. Environment Validation

```bash
cd admin-app
npm run validate-env
```

### 2. WhatsApp Flow Testing

1. **Generate QR Code**

   - Login to admin dashboard
   - Go to Organization → QR Codes
   - Generate QR for testing

2. **Test Conversation Flow**

   - Scan QR code with mobile device
   - Should open WhatsApp with predefined message
   - Send message to start conversation
   - Verify conversation responses

3. **Test Kiosk Integration**
   - Access kiosk app URL
   - Test service selection
   - Test printer functionality (if connected)

### 3. Database Verification

Check conversation logging:

```sql
SELECT * FROM whatsapp_conversations ORDER BY created_at DESC LIMIT 5;
SELECT * FROM whatsapp_inbound_messages ORDER BY created_at DESC LIMIT 5;
```

## 🔒 Security Configuration

### Production Security Checklist

- [ ] Generate secure webhook token (32+ characters)
- [ ] Use HTTPS for all URLs
- [ ] Set `WHATSAPP_DEBUG=false`
- [ ] Configure proper CORS settings
- [ ] Enable Supabase RLS policies
- [ ] Monitor webhook logs for suspicious activity

### Environment Security

- [ ] Never commit `.env` files to version control
- [ ] Use different tokens for development/production
- [ ] Rotate webhook tokens regularly
- [ ] Monitor UltraMessage usage for anomalies

## 📊 Monitoring & Logging

### Application Monitoring

1. **Vercel Functions**

   - Monitor webhook function performance
   - Check function logs for errors
   - Set up alerts for failures

2. **Supabase Database**

   - Monitor conversation table growth
   - Set up database backups
   - Monitor API usage

3. **UltraMessage Usage**
   - Track message sending quotas
   - Monitor webhook delivery rates
   - Check for failed message deliveries

## 🐛 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Messages**

   - ✅ Verify webhook URL is accessible from internet
   - ✅ Check UltraMessage webhook configuration
   - ✅ Verify webhook token matches environment variable
   - ✅ Check Vercel function logs

2. **Messages Not Sending**

   - ✅ Verify UltraMessage credentials
   - ✅ Check phone number format (no + prefix)
   - ✅ Verify UltraMessage instance status
   - ✅ Check message content for forbidden characters

3. **QR Codes Not Opening WhatsApp**

   - ✅ Verify phone number format in QR generation
   - ✅ Check WhatsApp business number configuration
   - ✅ Test QR content manually

4. **Conversation State Issues**
   - ✅ Check database connection
   - ✅ Verify conversation timeout settings
   - ✅ Clear old conversation records if needed

### Debug Mode

Enable for troubleshooting:

```bash
WHATSAPP_DEBUG=true
WHATSAPP_DETAILED_LOGGING=true
```

## 📞 Support Resources

- **UltraMessage Documentation**: <https://docs.ultramsg.com/>
- **Vercel Deployment Guide**: <https://vercel.com/docs>
- **Supabase Documentation**: <https://supabase.com/docs>
- **Next.js API Routes**: <https://nextjs.org/docs/api-routes>

## 🎉 Post-Deployment Steps

1. **User Training**

   - Train staff on new WhatsApp workflow
   - Update customer communication materials
   - Create user guides for kiosk operation

2. **Performance Optimization**

   - Monitor response times
   - Optimize database queries
   - Set up caching where appropriate

3. **Feature Enhancement**
   - Monitor user feedback
   - Plan additional WhatsApp features
   - Consider analytics integration

---

## 📧 Next Steps After Deployment

1. **Test Complete Flow**

   - Generate QR codes
   - Test customer journey
   - Verify notifications

2. **Production Monitoring**

   - Set up alerts
   - Monitor logs
   - Track usage metrics

3. **User Onboarding**
   - Train your team
   - Update documentation
   - Gather feedback

Your WhatsApp-first queue system is now ready for production! 🚀
