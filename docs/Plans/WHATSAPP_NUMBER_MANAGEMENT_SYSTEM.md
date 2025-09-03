# WhatsApp Number Management System - Implementation Plan

## 📋 Overview

This plan outlines the implementation of an automated WhatsApp number management system that allows organizations to manage multiple WhatsApp numbers with automatic switching when numbers get suspended by Meta or reach daily limits.

## 🎯 Objectives

- **Eliminate manual UltraMsg setup** - Numbers managed entirely through the admin dashboard
- **Multi-number support** - Organizations can configure multiple WhatsApp numbers as backups
- **Automatic failover** - System switches to backup numbers when primary gets suspended
- **Daily limit management** - Track and enforce daily message limits per number
- **Real-time monitoring** - Test connections and monitor number status

## 🏗️ Architecture Overview

### Database Schema

```table
whatsapp_numbers
├── id (uuid, primary key)
├── organization_id (uuid, foreign key)
├── phone_number (varchar)
├── instance_id (varchar) - UltraMsg instance
├── token (varchar) - UltraMsg token
├── is_active (boolean)
├── is_suspended (boolean)
├── suspension_reason (text)
├── suspended_at (timestamp)
├── daily_message_count (integer)
├── daily_limit (integer)
├── priority (integer) - Lower = higher priority
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Service Architecture

```Architecture
WhatsAppNumberManager (Service Layer)
├── getAvailableNumber() - Get next available number
├── suspendNumber() - Mark number as suspended
├── incrementMessageCount() - Track usage
├── addNumber() - Add new number
├── updateNumber() - Update number config
└── testConnection() - Test UltraMsg connection

UltraMsgService (Enhanced)
├── sendMessage() - Send with auto-number selection
├── handleSuspensionErrors() - Detect suspension responses
└── getInstanceStatus() - Check number status
```

## 📅 Implementation Phases

### Phase 1: Database & Core Services (Day 1-2)

#### 1.1 Database Migration

- [ ] Create `whatsapp_numbers` table
- [ ] Add RLS policies for organization isolation
- [ ] Create indexes for performance
- [ ] Add trigger functions for daily reset
- [ ] Create stored procedures for number selection

**Files to create:**

- `supabase/migrations/20250903140000_whatsapp_numbers_management.sql`

#### 1.2 WhatsApp Number Manager Service

- [ ] Create `WhatsAppNumberManager` class
- [ ] Implement number selection logic
- [ ] Add suspension detection
- [ ] Implement daily limit tracking
- [ ] Add connection testing

**Files to create:**

- `admin-app/src/lib/whatsapp-number-manager.ts`

#### 1.3 Enhanced UltraMsg Service

- [ ] Update `UltraMsgService` to use number manager
- [ ] Add automatic failover logic
- [ ] Implement suspension error detection
- [ ] Add debug mode support

**Files to update:**

- `admin-app/src/lib/ultramsg-service.ts`

### Phase 2: Admin Interface (Day 3-4)

#### 2.1 WhatsApp Numbers Management Component

- [ ] Create management interface
- [ ] Add CRUD operations for numbers
- [ ] Implement connection testing UI
- [ ] Add status monitoring dashboard
- [ ] Create priority management

**Files to create:**

- `admin-app/src/app/organization/features/whatsapp-numbers/whatsapp-numbers-management.tsx`

#### 2.2 API Routes

- [ ] Create connection testing endpoint
- [ ] Add number validation API
- [ ] Implement status checking routes

**Files to create:**

- `admin-app/src/app/api/whatsapp/test-connection/route.ts`
- `admin-app/src/app/api/whatsapp/validate-number/route.ts`

#### 2.3 Integration with Organization Page

- [ ] Add "WhatsApp Numbers" tab
- [ ] Update organization navigation
- [ ] Add number status indicators

**Files to update:**

- `admin-app/src/app/organization/page.tsx`

### Phase 3: Integration & Testing (Day 5-6)

#### 3.1 WhatsApp Webhook Updates

- [ ] Update webhook to use new number management
- [ ] Implement automatic number switching
- [ ] Add error handling for suspended numbers

**Files to update:**

- `admin-app/src/app/api/whatsapp/webhook/route.ts`

#### 3.2 Message Template Integration

- [ ] Update message templates to use new service
- [ ] Ensure proper number selection
- [ ] Add number tracking in templates

**Files to update:**

- `admin-app/src/app/organization/features/message-templates/message-template-management.tsx`

#### 3.3 QR Code Generation Updates

- [ ] Update QR codes to use organization's primary number
- [ ] Ensure dynamic number selection
- [ ] Add fallback handling

**Files to update:**

- `admin-app/src/app/organization/features/qr-management/qr-management.tsx`

### Phase 4: Advanced Features (Day 7-8)

#### 4.1 Analytics & Monitoring

- [ ] Create number usage analytics
- [ ] Add suspension history tracking
- [ ] Implement performance metrics

**Files to create:**

- `admin-app/src/app/organization/features/whatsapp-numbers/whatsapp-analytics.tsx`

#### 4.2 Automated Health Checks

- [ ] Create scheduled health check system
- [ ] Implement automatic suspension detection
- [ ] Add email alerts for suspensions

**Files to create:**

- `admin-app/src/lib/whatsapp-health-monitor.ts`
- `admin-app/src/app/api/cron/whatsapp-health-check/route.ts`

#### 4.3 Bulk Operations

- [ ] Add bulk number import/export
- [ ] Implement batch testing
- [ ] Create number migration tools

**Files to create:**

- `admin-app/src/app/organization/features/whatsapp-numbers/bulk-operations.tsx`

## 🔧 Technical Requirements

### Database Functions

```sql
-- Get next available WhatsApp number
CREATE FUNCTION get_available_whatsapp_number(org_id UUID)
RETURNS TABLE(...) AS $$
-- Implementation details in migration file

-- Reset daily message counts
CREATE FUNCTION reset_daily_message_counts()
RETURNS void AS $$
-- Implementation details in migration file

-- Increment message count
CREATE FUNCTION increment_message_count(number_id UUID)
RETURNS void AS $$
-- Implementation details in migration file
```

### Service Layer Architecture

```typescript
// WhatsApp Number Manager Interface
interface WhatsAppNumberManager {
  getAvailableNumber(orgId: string): Promise<WhatsAppNumber | null>;
  suspendNumber(numberId: string, reason: string): Promise<boolean>;
  incrementMessageCount(numberId: string): Promise<boolean>;
  addNumber(orgId: string, numberData: NumberData): Promise<WhatsAppNumber>;
  updateNumber(
    numberId: string,
    updates: Partial<NumberData>
  ): Promise<boolean>;
  testConnection(instanceId: string, token: string): Promise<TestResult>;
}

// Enhanced UltraMsg Service
interface UltraMsgService {
  sendMessage(orgId: string, to: string, body: string): Promise<SendResult>;
  getInstanceStatus(instanceId: string, token: string): Promise<StatusResult>;
}
```

## 🔒 Security Considerations

### Row Level Security Policies

```sql
-- Users can only view their organization's numbers
CREATE POLICY "view_org_whatsapp_numbers" ON whatsapp_numbers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Only admins/managers can manage numbers
CREATE POLICY "manage_whatsapp_numbers" ON whatsapp_numbers
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM members
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
```

### Token Security

- Store UltraMsg tokens encrypted
- Use environment variables for encryption keys
- Implement token rotation capabilities

## 🧪 Testing Strategy

### Unit Tests

- [ ] WhatsAppNumberManager service methods
- [ ] UltraMsgService enhanced methods
- [ ] Database functions
- [ ] API route handlers

### Integration Tests

- [ ] End-to-end message sending flow
- [ ] Number switching scenarios
- [ ] Suspension detection workflow
- [ ] Daily limit enforcement

### Manual Testing Scenarios

- [ ] Add/edit/delete WhatsApp numbers
- [ ] Test connection functionality
- [ ] Suspension and reactivation flow
- [ ] Priority-based number selection
- [ ] Daily limit reaching and reset

## 📊 Monitoring & Metrics

### Key Metrics to Track

- Messages sent per number per day
- Number suspension events
- Average message delivery time
- Number switch frequency
- Connection test success rates

### Alerting System

- Email notifications for number suspensions
- Daily usage reports
- Connection failure alerts
- Daily limit approaching warnings

## 🚀 Deployment Strategy

### Database Migration

1. Run migration during low-traffic period
2. Create backup before migration
3. Test migration on staging environment
4. Verify RLS policies after deployment

### Feature Rollout

1. **Beta Testing** - Enable for select organizations
2. **Gradual Rollout** - 25% → 50% → 100%
3. **Monitoring** - Watch error rates and performance
4. **Rollback Plan** - Revert to single number if issues

### Environment Configuration

```bash
# Required environment variables
WHATSAPP_DEBUG=false
ULTRAMSG_BASE_URL=https://api.ultramsg.com
ENCRYPTION_KEY=your_encryption_key_here
```

## ✅ Success Criteria

### Functional Requirements Met

- [ ] Organizations can add/manage multiple WhatsApp numbers
- [ ] System automatically switches between numbers
- [ ] Suspended numbers are detected and bypassed
- [ ] Daily limits are enforced and reset properly
- [ ] Connection testing works reliably

### Performance Requirements Met

- [ ] Number selection takes < 100ms
- [ ] Message sending latency unchanged
- [ ] Database queries optimized with proper indexes
- [ ] UI responsive with < 2s load times

### Security Requirements Met

- [ ] All data properly isolated by organization
- [ ] Tokens encrypted at rest
- [ ] RLS policies prevent unauthorized access
- [ ] API endpoints properly authenticated

## 📚 Documentation Deliverables

- [ ] API documentation for new endpoints
- [ ] User guide for WhatsApp number management
- [ ] Admin guide for monitoring and troubleshooting
- [ ] Database schema documentation
- [ ] Deployment and configuration guide

## 🔄 Maintenance Plan

### Daily Tasks

- Monitor number health checks
- Review suspension reports
- Check daily usage metrics

### Weekly Tasks

- Analyze number performance trends
- Review and update number priorities
- Test backup number functionality

### Monthly Tasks

- Security audit of stored tokens
- Performance optimization review
- Update documentation as needed

---

This implementation plan provides a comprehensive roadmap for building a robust, automated WhatsApp number management system that eliminates manual configuration and provides enterprise-grade reliability with multiple number support and automatic failover capabilities.
