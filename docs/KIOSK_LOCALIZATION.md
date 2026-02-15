# Kiosk App Localization (i18n)

## Overview

The kiosk app supports multilingual display with English and Arabic languages. Users can switch between languages using the language toggle in the top bar.

## Features

### Language Support
- **English (en)** - Default language, LTR layout
- **Arabic (ar)** - RTL layout with proper text alignment

### What Gets Translated
- All kiosk UI text (buttons, labels, headings)
- Department names (from `name_ar` database field)
- Service names (from `name_ar` database field)
- Service descriptions (from `description_ar` database field)

### What Stays in English
- Settings modal (admin-facing)
- Setup wizard (admin-facing)
- Error messages from server

## Database Schema

Arabic names are stored alongside English names in the database:

### Departments Table
```sql
ALTER TABLE departments ADD COLUMN name_ar VARCHAR(255);
```

### Services Table
```sql
ALTER TABLE services ADD COLUMN name_ar VARCHAR(255);
ALTER TABLE services ADD COLUMN description_ar TEXT;
```

## Admin App Integration

When creating or editing departments/services in the admin app, you can now enter Arabic names:

1. Navigate to **Manage** section
2. Create or edit a department/service
3. Fill in the **Arabic Name** field (marked with RTL input direction)
4. For services, optionally fill in **Arabic Description**

## Kiosk App Usage

### Switching Languages
1. Click the language toggle button in the top bar (shows "EN" or "AR")
2. The UI will immediately switch to the selected language
3. Layout direction changes automatically (LTR ↔ RTL)
4. Language preference is saved to localStorage

### How Localized Names Work
- If Arabic is selected and `name_ar` exists, it displays the Arabic name
- If Arabic is selected but `name_ar` is empty, it falls back to the English `name`
- If English is selected, it always shows the `name` field

## File Structure

```
kiosk-app/src/
├── i18n/
│   ├── index.ts              # Exports
│   ├── translations.ts       # EN/AR translation strings
│   └── LanguageContext.tsx   # React context & hooks
├── components/
│   └── LanguageToggle.tsx    # Toggle button component
└── main.tsx                  # LanguageProvider wrapper
```

## Adding New Translations

1. Open `kiosk-app/src/i18n/translations.ts`
2. Add the new key to the `Translations` interface
3. Add English translation in `translations.en`
4. Add Arabic translation in `translations.ar`
5. Use `const { t } = useLanguage()` in your component
6. Reference the key: `{t.yourNewKey}`

## Hooks

### useLanguage()
Returns the current language context:
```tsx
const { language, setLanguage, t } = useLanguage();
```

### useLocalizedName()
Returns a function to get localized name from an entity:
```tsx
const getLocalizedName = useLocalizedName();
const name = getLocalizedName(department); // Returns name_ar or name
```

### useLocalizedDescription()
Returns a function to get localized description from a service:
```tsx
const getLocalizedDescription = useLocalizedDescription();
const desc = getLocalizedDescription(service); // Returns description_ar or description
```

## RTL Styling

RTL-specific styles are defined in `kiosk-app/src/index.css` using the `[dir="rtl"]` selector:

```css
[dir="rtl"] .kiosk-choice {
  flex-direction: row-reverse;
  text-align: right;
}

[dir="rtl"] .kiosk-service-card {
  flex-direction: row-reverse;
  text-align: right;
}
```

## Migration

Run the database migration to add Arabic columns:
```sql
-- File: supabase/migrations/20260215120000_add_arabic_names.sql
ALTER TABLE departments ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);
ALTER TABLE services ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);
ALTER TABLE services ADD COLUMN IF NOT EXISTS description_ar TEXT;
```
