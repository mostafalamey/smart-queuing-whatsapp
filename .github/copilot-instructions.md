# COPILOT.md — Smart Queue System Guidelines

## 📌 Project Context

This is a queue management system consisting of:

- **Admin App** (requires authentication)
- **Kiosk App** (no authentication)
- **Role-based Access**: Admin, Manager, Employee
- **Core Features**: Queue handling, QR code generation, WhatsApp notifications

---

## 🏗 Tech Stack

- **Frontend Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Deployment**: Vercel
- **Messaging**: UltraMsg WhatsApp API
- **QR Codes**: `qrcode` npm package

---

## 🔑 Architecture Guidelines

1. **Monorepo Structure**

   - `/admin` → Admin Dashboard
   - `/kiosk` → Kiosk app
   - `/shared` → Reusable components, hooks, and utils

2. **Supabase Usage**

   - Use **Row Level Security (RLS)** for role-based access.
   - Store roles and assignments in a `members` table.
   - Store queue data per department.

3. **Auth Flows**

   - Admin Dashboard → Supabase Auth (email/password or magic link).
   - Kiosk App → No auth; organization/branch/dept ID passed in URL.

4. **API Routes**
   - Use Next.js API routes for server-side logic (ticket increment, QR generation).
   - Secure API routes with Supabase JWT verification.

---

## 🧩 Naming Conventions

- Components: `PascalCase` (`QueueManager.tsx`)
- Hooks: `useCamelCase` (`useQueueStatus.ts`)
- Files & Folders: `kebab-case`
- DB tables: `snake_case` (`queue_tickets`, `branches`)
- Columns: `snake_case`

---

## ⚙️ Supabase Schema Guidelines

**Tables**:

- `organizations` — id, name, logo_url
- `branches` — id, org_id, name, address
- `departments` — id, branch_id, name
- `services` — id, department_id, name, description
- `members` — id, user_id, org_id, role, branch_id?, department_id?
- `tickets` — id, department_id, number, status
- `queue_notifications` — ticket_id, customer_phone, status

---

## 🎯 Best Practices for Copilot

1. **UI/UX**

   - **IMPORTANT:** Follow the Design Language document at `docs/DESIGN_LANGUAGE.md` for all UI work.
   - Follow Tailwind best practices for responsive layouts.
   - Keep color palette consistent with the healthcare-appropriate design system.
   - Reuse components from `/shared` wherever possible.
   - **No gradients, glassmorphism, or decorative elements** in the admin app.
   - Use solid colors, clear hierarchy, and professional aesthetics.
   - Ensure WCAG AA accessibility compliance (4.5:1 contrast ratio minimum).

2. **Database Queries**

   - Always filter by `organization_id` to enforce tenant isolation.
   - Keep queries minimal — fetch only required columns.

3. **Security**

   - Protect admin routes with role checks in middleware.
   - Avoid exposing Supabase service key in the frontend.

4. **Performance**

   - Use SWR or React Query for queue status polling.
   - Debounce QR code generation requests.

5. **Testing**

   - Write Jest tests for critical hooks and API routes.
   - Mock Supabase calls in tests.

6. **Documentation**

   - Keep API documentation up-to-date with Swagger or Postman.
   - Document complex components and hooks with examples.

7. **PowerShell Commands**
   - When using console commands, always use PowerShell commands.

---

## 🚀 Copilot Prompts

When prompting Copilot for code, use:

- “Generate a Supabase query to get all branches for a given organization_id.”
- “Create a Tailwind-based responsive component for the queue status card.”
- “Write an API route in Next.js that increments the ticket number for a given department_id and returns the new number.”

---

## 🎨 Design System Reference

The Admin App follows a strict design language for healthcare environments.

**Key Documents:**
- Design Language: `docs/DESIGN_LANGUAGE.md`
- UI/UX Redesign Plan: `docs/UI_UX_REDESIGN_PLAN.md`

**Design Principles:**
- "Clinical Precision" — Every pixel serves a purpose
- Professional, muted color palette (no playful gradients)
- Clear visual hierarchy through spacing and typography
- Fast transitions (150-200ms max)
- Accessibility-first approach

**Anti-Patterns to Avoid:**
- ❌ Gradient backgrounds
- ❌ Glassmorphism (`backdrop-blur`)
- ❌ Decorative floating shapes
- ❌ Scale transforms on hover
- ❌ Animation durations > 300ms
- ❌ Oversized elements (e.g., 100px+ fonts)

---

## ✅ Definition of Done

- Code follows naming conventions.
- UI matches the Design Language (`docs/DESIGN_LANGUAGE.md`).
- Queries are secure and role-checked.
- All tests pass.
- No console errors/warnings.
- Accessibility: WCAG AA compliance verified.
