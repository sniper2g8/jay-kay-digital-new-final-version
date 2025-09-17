# Jay Kay Digital Press - Updated Design System

This document outlines the updated design system implemented for the Jay Kay Digital Press application with the new red, black, and yellow color scheme.

## Color Palette

The application now uses a bold and professional color palette with red, black, and yellow as the primary colors:

### Primary Colors

- **Primary**: `#dc2626` (Red) - Used for primary actions, highlights, and important UI elements
- **Secondary**: `#000000` (Black) - Used for text, backgrounds, and secondary elements
- **Accent**: `#eab308` (Yellow) - Used for warnings, highlights, and special elements

### Semantic Colors

- **Success**: Green tones (kept for success messages)
- **Warning**: Yellow (`#eab308`) for warnings and highlights
- **Destructive**: Red (`#dc2626`) for destructive actions and errors

### Light/Dark Mode

The application supports both light and dark modes with appropriate color adjustments for each theme:

- **Light Mode**: White backgrounds with black text
- **Dark Mode**: Black backgrounds with white text

## Typography

The application continues to use the Geist font family:

- **Sans-serif**: Geist Sans for body text and UI elements
- **Monospace**: Geist Mono for code and technical information

Font weights used:

- Regular (400) for body text
- Medium (500) for headings and important text
- Semibold (600) for titles and labels

## Spacing System

The application uses a consistent spacing system based on a 4px grid:

- 1 unit = 4px
- xs: 2 units (8px)
- sm: 3 units (12px)
- md: 4 units (16px)
- lg: 6 units (24px)
- xl: 8 units (32px)
- 2xl: 12 units (48px)

## Shadows

Custom shadow definitions for different elevation levels:

- `--shadow-sm`: Subtle shadow for low elevation
- `--shadow-md`: Medium shadow for cards and modals
- `--shadow-lg`: Strong shadow for dropdowns and tooltips
- `--shadow-xl`: Prominent shadow for focused elements

## Border Radius

Consistent border radius system:

- `--radius-sm`: 2px
- `--radius-md`: 4px
- `--radius-lg`: 8px (default)
- `--radius-xl`: 12px

## Animations & Transitions

### Custom Animations

- `fadeIn`: Smooth opacity transition
- `slideInFromTop`: Slide-in effect from top
- `scaleIn`: Scale animation for modal appearances

### Hover Effects

- `hover-lift`: Elements lift slightly and gain shadow on hover
- `hover-scale`: Subtle scaling effect on interactive elements

### Transition Properties

- Duration: 200-300ms for most interactions
- Timing: `cubic-bezier(0.4, 0, 0.2, 1)` for natural easing

## Component Design

### Buttons

- Rounded corners with consistent padding
- Shadow effects that enhance on hover
- Clear visual feedback for all states (default, hover, active, disabled)
- Primary buttons use red background with white text
- Secondary buttons use black background with white text
- Outline buttons use black borders with hover effects

### Cards

- Subtle border with shadow
- Smooth hover effects with shadow enhancement
- Consistent padding and spacing
- Red accents for important cards

### Navigation

- Clear visual indication of active states with red highlights
- Smooth transitions between states
- Responsive design for mobile and desktop
- Black sidebar with red/yellow accents

## Responsive Design

The application follows a mobile-first approach with breakpoints:

- Small: 640px
- Medium: 768px
- Large: 1024px
- Extra Large: 1280px

## Accessibility

- Sufficient color contrast for text elements
- Focus states for keyboard navigation
- Semantic HTML structure
- ARIA attributes where appropriate

## Implementation Details

### CSS Custom Properties

All design tokens are defined as CSS custom properties for easy maintenance and theming.

### Utility Classes

The application leverages Tailwind CSS with custom utility classes for:

- Animations (`animate-in`, `fade-in`, `slide-in-from-top-2`)
- Hover effects (`hover-lift`, `hover-scale`)
- Gradients (`gradient-bg`, `gradient-text`)
- Glass effects (`glass-effect`)

### Component Variants

UI components are built with variants using `class-variance-authority` for consistent styling across the application.

## Branding Elements

### Logo

- The JK_Logo.jpg from the public directory is used in the header
- Red background with white logo for contrast

### Hero Image

- The hero.jpg from the public directory is used in the hero section
- With a subtle opacity overlay to ensure text readability

## Future Enhancements

1. Add more comprehensive component documentation
2. Implement a design token system for easier theme management
3. Add more advanced animation libraries for complex interactions
4. Create a component playground for testing UI elements
