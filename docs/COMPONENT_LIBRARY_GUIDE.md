# Component Library Quick Reference

## 🎨 New UI Components - Phase 2

All components are located in `admin-app/src/components/ui/` and can be imported via the index file.

---

## Import Syntax

```tsx
// Import all components
import { Button, Card, CardHeader, Input, Label } from '@/components/ui';

// Or import individually
import { Button } from '@/components/ui/Button';
```

---

## 🔘 Button Component

### Basic Usage
```tsx
<Button variant="primary">Click Me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

### With Loading State
```tsx
<Button loading={isLoading}>Save Changes</Button>
```

### Sizes
```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
```

### Full Width
```tsx
<Button fullWidth>Full Width Button</Button>
```

---

## 📇 Card Component

### Basic Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Your content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Card with Action Button in Header
```tsx
<Card>
  <CardHeader action={<Button size="sm">Action</Button>}>
    <CardTitle as="h2">Main Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Padding Options
```tsx
<Card padding="none">No padding</Card>
<Card padding="sm">Small padding (16px)</Card>
<Card padding="md">Medium padding (24px) - default</Card>
<Card padding="lg">Large padding (32px)</Card>
```

### Interactive Card
```tsx
<Card hover interactive onClick={handleClick}>
  Clickable card with hover effect
</Card>
```

---

## 📝 Form Controls

### Input Field
```tsx
<FormGroup>
  <Label required>Email Address</Label>
  <Input 
    type="email" 
    placeholder="you@example.com"
    error={hasError}
    helperText="Enter a valid email"
  />
</FormGroup>
```

### Select Dropdown
```tsx
<FormGroup>
  <Label>Country</Label>
  <Select error={hasError} helperText="Select your country">
    <option value="">Choose...</option>
    <option value="us">United States</option>
    <option value="uk">United Kingdom</option>
  </Select>
</FormGroup>
```

### Textarea
```tsx
<FormGroup>
  <Label>Description</Label>
  <Textarea 
    placeholder="Enter description"
    rows={4}
    helperText="Maximum 500 characters"
  />
</FormGroup>
```

### Checkbox
```tsx
<Checkbox label="I agree to the terms" />
<Checkbox label="Subscribe to newsletter" defaultChecked />
```

### Radio Buttons
```tsx
<div className="space-y-2">
  <Radio name="plan" label="Basic Plan" value="basic" />
  <Radio name="plan" label="Pro Plan" value="pro" />
  <Radio name="plan" label="Enterprise Plan" value="enterprise" />
</div>
```

---

## 💀 Skeleton Loaders

### Basic Skeleton
```tsx
<Skeleton className="h-4 w-32" />
<Skeleton className="h-10 w-full" />
```

### Pre-built Skeletons
```tsx
{loading ? <SkeletonCard /> : <Card>...</Card>}

{loading ? <SkeletonTable /> : <Table>...</Table>}

{loading ? <SkeletonForm /> : <Form>...</Form>}

{loading ? <SkeletonDashboard /> : <Dashboard />}

{loading ? <SkeletonList items={5} /> : <List />}
```

---

## 🍞 Breadcrumb Navigation

```tsx
<Breadcrumb
  items={[
    { label: 'Organization', href: '/organization' },
    { label: 'Branches', href: '/organization/branches' },
    { label: 'Branch Details' } // Current page (no href)
  ]}
/>
```

---

## 🚫 Empty State

```tsx
<EmptyState
  icon={<InboxIcon className="w-16 h-16" />}
  title="No items found"
  description="Get started by creating your first item"
  action={{
    label: "Create Item",
    onClick: handleCreate
  }}
/>
```

---

## 🎨 Color Usage

### Primary Actions
```tsx
<Button variant="primary">Primary Action</Button>
className="bg-primary text-white"
```

### Success States
```tsx
className="bg-success text-white"
className="text-success-700 bg-success-50"
```

### Warning States
```tsx
className="bg-warning text-white"
className="text-warning-800 bg-warning-100"
```

### Error States
```tsx
<Button variant="destructive">Delete</Button>
className="bg-error text-white"
className="text-error-700 bg-error-50"
```

### Neutral States
```tsx
className="bg-gray-50 text-gray-900"
className="text-gray-700 bg-gray-100"
```

---

## ♿ Accessibility Best Practices

### Always Include Labels
```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### Mark Required Fields
```tsx
<Label required>Password</Label>
```

### Provide Helper Text
```tsx
<Input 
  helperText="Must be at least 8 characters"
  error={passwordTooShort}
/>
```

### Icon-Only Buttons
```tsx
<Button aria-label="Close modal">
  <XIcon className="w-5 h-5" />
</Button>
```

---

## 📏 Spacing Guidelines

Use Tailwind's spacing scale based on 4px increments:

```tsx
className="space-y-4"  // 16px vertical spacing
className="space-x-3"  // 12px horizontal spacing
className="p-6"        // 24px padding
className="mb-4"       // 16px margin bottom
```

---

## ⚡ Performance Tips

1. **Use Skeleton Loaders** instead of spinners for better UX
2. **Lazy load** heavy components
3. **Debounce** form inputs for real-time validation
4. **Memoize** expensive computations with `useMemo`

---

## 🔍 Common Patterns

### Form with Validation
```tsx
<form onSubmit={handleSubmit}>
  <FormGroup>
    <Label required>Name</Label>
    <Input 
      value={name}
      onChange={(e) => setName(e.target.value)}
      error={!!errors.name}
      helperText={errors.name}
    />
  </FormGroup>
  
  <div className="flex justify-end space-x-3 mt-6">
    <Button variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" loading={isSubmitting}>
      Save
    </Button>
  </div>
</form>
```

### Card with Header Action
```tsx
<Card>
  <CardHeader action={
    <Button size="sm" variant="outline">
      Edit
    </Button>
  }>
    <CardTitle>User Profile</CardTitle>
    <CardDescription>Manage your account settings</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Profile content */}
  </CardContent>
</Card>
```

### Loading State
```tsx
{isLoading ? (
  <SkeletonCard />
) : data ? (
  <Card>
    <CardContent>{data.content}</CardContent>
  </Card>
) : (
  <EmptyState 
    title="No data available"
    action={{ label: "Reload", onClick: refetch }}
  />
)}
```

---

## 📚 Further Reading

- [DESIGN_LANGUAGE.md](../DESIGN_LANGUAGE.md) - Complete design specifications
- [ACCESSIBILITY_AUDIT.md](../ACCESSIBILITY_AUDIT.md) - Accessibility guidelines
- [PHASE_2_IMPLEMENTATION_COMPLETE.md](../PHASE_2_IMPLEMENTATION_COMPLETE.md) - Implementation details

---

*Last Updated: February 11, 2026*
