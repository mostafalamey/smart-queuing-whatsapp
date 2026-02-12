# Smart Queue Design Language
## Healthcare Admin Application Design System

**Version:** 1.0  
**Last Updated:** February 2026  
**Application:** Smart Queue Admin App

---

## Overview

This design language document defines the visual and interaction standards for the Smart Queue Admin Application. The system is designed for **healthcare environments** where clarity, professionalism, and efficiency are paramount.

### Design Philosophy

> **"Clinical Precision"** — Every pixel serves a purpose. No decoration without function.

Our design embodies:
- **Trust** through consistent, professional aesthetics
- **Clarity** through intentional hierarchy and spacing
- **Efficiency** through reduced cognitive load
- **Accessibility** through inclusive design patterns

---

## Color System

### Primary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Primary** | `#2563EB` | 37, 99, 235 | Primary actions, links, active states |
| **Primary Dark** | `#1E40AF` | 30, 64, 175 | Hover states, emphasis |
| **Primary Light** | `#DBEAFE` | 219, 234, 254 | Subtle backgrounds, highlights |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#16A34A` | Positive actions, completed states |
| **Success Light** | `#DCFCE7` | Success backgrounds |
| **Warning** | `#D97706` | Attention required, pending states |
| **Warning Light** | `#FEF3C7` | Warning backgrounds |
| **Error** | `#DC2626` | Errors, destructive actions |
| **Error Light** | `#FEE2E2` | Error backgrounds |
| **Info** | `#0891B2` | Informational content |
| **Info Light** | `#CFFAFE` | Info backgrounds |

### Neutral Palette

```css
--gray-50:  #F8FAFC;  /* Page backgrounds */
--gray-100: #F1F5F9;  /* Subtle backgrounds */
--gray-200: #E2E8F0;  /* Borders, dividers */
--gray-300: #CBD5E1;  /* Disabled states */
--gray-400: #94A3B8;  /* Placeholder text */
--gray-500: #64748B;  /* Muted text */
--gray-600: #475569;  /* Secondary text */
--gray-700: #334155;  /* Primary text (light mode) */
--gray-800: #1E293B;  /* Sidebar background */
--gray-900: #0F172A;  /* Headings, emphasis */
```

### CSS Variables Implementation

```css
:root {
  /* Primary */
  --color-primary: #2563EB;
  --color-primary-dark: #1E40AF;
  --color-primary-light: #DBEAFE;
  
  /* Semantic */
  --color-success: #16A34A;
  --color-success-light: #DCFCE7;
  --color-warning: #D97706;
  --color-warning-light: #FEF3C7;
  --color-error: #DC2626;
  --color-error-light: #FEE2E2;
  --color-info: #0891B2;
  --color-info-light: #CFFAFE;
  
  /* Surfaces */
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-elevated: #FFFFFF;
  
  /* Text */
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #64748B;
  --color-text-inverse: #FFFFFF;
  
  /* Borders */
  --color-border: #E2E8F0;
  --color-border-strong: #CBD5E1;
}
```

### Color Usage Rules

1. **Never use gradients** for backgrounds or buttons
2. **Never use color alone** to convey meaning (add icons/text)
3. **Maintain 4.5:1 contrast** for normal text
4. **Maintain 3:1 contrast** for large text (18px+ or 14px bold+)
5. **Use semantic colors** consistently across the application

---

## Typography

### Font Family

```css
--font-family-base: 'IBM Plex Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'IBM Plex Mono', 'Fira Code', monospace;
```

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| `text-display` | 32px | 600 | 1.2 | -0.02em |
| `text-h1` | 24px | 600 | 1.3 | -0.01em |
| `text-h2` | 20px | 600 | 1.4 | 0 |
| `text-h3` | 16px | 600 | 1.4 | 0 |
| `text-body` | 14px | 400 | 1.5 | 0 |
| `text-body-sm` | 13px | 400 | 1.5 | 0 |
| `text-caption` | 12px | 500 | 1.4 | 0.01em |
| `text-overline` | 11px | 600 | 1.4 | 0.05em |

### CSS Implementation

```css
/* Display */
.text-display {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

/* Heading 1 */
.text-h1 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

/* Heading 2 */
.text-h2 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-text-primary);
}

/* Heading 3 */
.text-h3 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-text-primary);
}

/* Body */
.text-body {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

/* Caption */
.text-caption {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.01em;
  color: var(--color-text-muted);
}
```

### Typography Rules

1. **Limit to 3 sizes** per view when possible
2. **Never use font weights** below 400 or above 700
3. **Avoid all-caps** except for overlines and labels
4. **Maximum line length:** 65-75 characters for body text

---

## Spacing System

### Base Unit: 4px

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `space-0` | 0 | `p-0` | Reset |
| `space-1` | 4px | `p-1` | Tight internal spacing |
| `space-2` | 8px | `p-2` | Icon gaps, tight padding |
| `space-3` | 12px | `p-3` | Input padding |
| `space-4` | 16px | `p-4` | Standard card padding |
| `space-5` | 20px | `p-5` | Medium gaps |
| `space-6` | 24px | `p-6` | Section padding |
| `space-8` | 32px | `p-8` | Large section gaps |
| `space-10` | 40px | `p-10` | Page margins |
| `space-12` | 48px | `p-12` | Major section breaks |

### Spacing Rules

1. **Use consistent vertical rhythm** - stick to the scale
2. **Increase spacing** for visual hierarchy (more important = more space)
3. **Group related items** with smaller spacing
4. **Separate sections** with larger spacing

---

## Components

### Buttons

#### Variants

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| **Primary** | `#2563EB` | `#FFFFFF` | none |
| **Secondary** | `transparent` | `#2563EB` | `1px #2563EB` |
| **Ghost** | `transparent` | `#475569` | none |
| **Destructive** | `#DC2626` | `#FFFFFF` | none |

#### Sizes

| Size | Height | Padding | Font Size | Border Radius |
|------|--------|---------|-----------|---------------|
| **Small** | 32px | 8px 16px | 13px | 6px |
| **Default** | 40px | 10px 20px | 14px | 8px |
| **Large** | 48px | 12px 24px | 16px | 8px |

#### States

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: white;
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: background-color 150ms ease-out;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:active {
  background: #1E3A8A;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

#### Rules

1. **One primary button** per view/card
2. **Minimum width:** 80px for text buttons
3. **Icon + text:** 8px gap between icon and label
4. **Loading state:** Replace text with spinner, maintain width

---

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-content {
  color: var(--color-text-secondary);
}
```

#### Card Variants

| Variant | Usage | Border |
|---------|-------|--------|
| **Default** | General content | `#E2E8F0` |
| **Elevated** | Important content | `#E2E8F0` + shadow |
| **Interactive** | Clickable cards | Hover: `#CBD5E1` |
| **Status** | KPIs, metrics | Left border accent |

---

### Form Controls

#### Input Fields

```css
.input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}

.input:hover {
  border-color: var(--color-border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input:disabled {
  background: var(--gray-100);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.input::placeholder {
  color: var(--gray-400);
}
```

#### Select Dropdowns

```css
.select {
  height: 40px;
  padding: 0 36px 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-surface) url('chevron-down.svg') no-repeat right 12px center;
  background-size: 16px;
  appearance: none;
  cursor: pointer;
}
```

#### Labels

```css
.label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.label-required::after {
  content: ' *';
  color: var(--color-error);
}
```

---

### Navigation

#### Sidebar

```css
.sidebar {
  width: 280px;
  background: var(--gray-800);
  color: var(--color-text-inverse);
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  transition: background-color 150ms ease-out, color 150ms ease-out;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-inverse);
}

.nav-item.active {
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.nav-item-icon {
  width: 20px;
  height: 20px;
  opacity: 0.8;
}
```

---

### Data Display

#### Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background: var(--gray-50);
  border-bottom: 1px solid var(--color-border);
}

.table td {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.table tr:hover td {
  background: var(--gray-50);
}
```

#### Stats/KPIs

```css
.stat-card {
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-change {
  font-size: 13px;
  margin-top: 8px;
}

.stat-change.positive {
  color: var(--color-success);
}

.stat-change.negative {
  color: var(--color-error);
}
```

---

### Feedback

#### Loading States

```css
/* Skeleton Loader */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-100) 25%,
    var(--gray-200) 50%,
    var(--gray-100) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### Toast Notifications

```css
.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--color-surface);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;
}

.toast-success { border-left: 4px solid var(--color-success); }
.toast-error { border-left: 4px solid var(--color-error); }
.toast-warning { border-left: 4px solid var(--color-warning); }
.toast-info { border-left: 4px solid var(--color-info); }
```

---

## Motion & Animation

### Timing

| Duration | Usage |
|----------|-------|
| 100ms | Micro-interactions (button press) |
| 150ms | Standard transitions (hover, focus) |
| 200ms | Component state changes |
| 250ms | Modal/overlay entrance |
| 300ms | Page transitions (max) |

### Easing Functions

```css
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Animation Rules

1. **Never animate layout properties** (width, height, top, left)
2. **Use transform and opacity** for performance
3. **Never use scale transforms** on interactive elements
4. **No animations longer than 300ms** for UI feedback
5. **Respect prefers-reduced-motion** media query

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Iconography

### Icon Specifications

| Context | Size | Stroke Width |
|---------|------|--------------|
| Navigation | 20px | 1.5px |
| Buttons | 16px | 2px |
| Inline | 14px | 2px |
| Feature | 24px | 1.5px |

### Icon Library

Use **Lucide Icons** for consistency. Key icons:

| Action | Icon |
|--------|------|
| Dashboard | `layout-dashboard` |
| Organization | `building-2` |
| Analytics | `bar-chart-3` |
| Settings | `settings` |
| Users | `users` |
| Add | `plus` |
| Edit | `pencil` |
| Delete | `trash-2` |
| Success | `check-circle` |
| Error | `x-circle` |
| Warning | `alert-triangle` |
| Info | `info` |

---

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet portrait */
--breakpoint-lg: 1024px;  /* Tablet landscape / Small desktop */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Large desktop */
```

### Layout Guidelines

| Breakpoint | Sidebar | Content Max Width |
|------------|---------|-------------------|
| < 1024px | Hidden (overlay) | 100% |
| >= 1024px | Fixed 280px | 100% - 280px |
| >= 1536px | Fixed 280px | 1200px (centered) |

---

## Accessibility Checklist

### Required for All Components

- [ ] Keyboard navigable
- [ ] Visible focus indicators
- [ ] ARIA labels where needed
- [ ] Color contrast ≥ 4.5:1
- [ ] Touch targets ≥ 44x44px
- [ ] No motion without reduced-motion fallback

### Testing Tools

- axe DevTools
- WAVE
- Lighthouse Accessibility
- VoiceOver / NVDA

---

## Anti-Patterns to Avoid

### Never Do

1. ❌ Gradient backgrounds
2. ❌ Glassmorphism (`backdrop-blur`)
3. ❌ Decorative shapes/elements
4. ❌ `transition-all`
5. ❌ Scale transforms on hover
6. ❌ Animation durations > 300ms
7. ❌ Color-only status indicators
8. ❌ Oversized text (> 48px)
9. ❌ Multiple shadows per element
10. ❌ Rounded corners > 12px

### Always Do

1. ✅ Solid, muted colors
2. ✅ Consistent spacing scale
3. ✅ Clear visual hierarchy
4. ✅ Accessible contrast ratios
5. ✅ Semantic color usage
6. ✅ Performance-first animations
7. ✅ Skeleton loaders for content
8. ✅ Meaningful empty states
9. ✅ Clear focus management
10. ✅ Mobile-first responsive

---

## File Structure

```
admin-app/
├── src/
│   ├── styles/
│   │   ├── globals.css      # CSS variables, base styles
│   │   ├── components.css   # Component classes
│   │   └── utilities.css    # Helper classes
│   ├── components/
│   │   ├── ui/              # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── tailwind.config.js       # Tailwind customization
└── ...
```

---

## Related Documents

- [UI/UX Redesign Plan](./UI_UX_REDESIGN_PLAN.md)
- [Copilot Instructions](../.github/copilot-instructions.md)

---

*This design language is the source of truth for the Smart Queue Admin App. All new components and features must adhere to these guidelines.*
