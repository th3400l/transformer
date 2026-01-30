# Enhanced Paper Template Selector

A modern, responsive paper template selector component with dropdown menu and arrow navigation.

## Features

### 1. Dropdown Menu
- Clean dropdown interface showing template names and types
- Template thumbnails for visual identification
- "Coming Soon" tags for lined templates (disabled state)
- Keyboard navigation support

### 2. Arrow Navigation
- Left/right arrow buttons for cycling through available templates
- Smooth transitions between templates
- Only cycles through available (blank) templates
- Disabled state when only one template is available

### 3. Responsive Design
- **Mobile (≤640px)**: Larger touch targets, optimized spacing
- **Tablet (641px-1024px)**: Balanced sizing for touch and precision
- **Desktop (≥1025px)**: Hover effects and smooth animations
- Touch-friendly interactions with active states

### 4. Accessibility
- Full keyboard navigation support
- Screen reader compatible with proper ARIA labels
- High contrast mode detection and support
- Focus management and visual indicators
- Reduced motion support for users with vestibular disorders

### 5. Template Types
- **Blank Templates**: Fully functional and selectable
- **Lined Templates**: Shown with "Coming Soon" tag, disabled for selection

## Usage

```tsx
import { EnhancedPaperTemplateSelector } from './components/EnhancedPaperTemplateSelector';

<EnhancedPaperTemplateSelector
  templateProvider={templateProvider}
  selectedTemplate={selectedTemplate}
  onTemplateChange={handleTemplateChange}
  className="optional-custom-class"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `templateProvider` | `ITemplateProvider` | Yes | Service for loading templates |
| `selectedTemplate` | `string` | Yes | Currently selected template ID |
| `onTemplateChange` | `(templateId: string) => void` | Yes | Callback when template changes |
| `className` | `string` | No | Additional CSS classes |

## Keyboard Navigation

- **Enter/Space**: Open/close dropdown
- **Arrow Down**: Open dropdown (when closed)
- **Arrow Up**: Close dropdown (when open)
- **Escape**: Close dropdown
- **Tab**: Navigate between arrow buttons and dropdown

## Mobile Optimizations

- Larger touch targets (44px minimum on mobile)
- Active states for touch feedback
- Optimized spacing and typography
- Responsive thumbnail sizes
- Touch-friendly dropdown scrolling

## Theme Support

The component automatically adapts to:
- Light/Dark themes
- High contrast mode
- Custom CSS variables for colors and spacing
- All existing theme variants (nightlight, dark, feminine)

## Error Handling

- Graceful fallback to default templates
- Loading states with spinner
- Error states with retry functionality
- Network error recovery

## Performance

- Lazy loading of template images
- Efficient re-rendering with React hooks
- Optimized for large template lists
- Memory-efficient image caching