# Atlas UI Guidelines

## Design Philosophy

Atlas follows a modern, professional aesthetic designed for insurance restoration professionals. The UI prioritizes clarity, efficiency, and accessibility while maintaining a sophisticated visual identity.

## Color System

### Primary Colors
- **Atlas Navy**: Deep blue background for depth and professionalism
- **Atlas Cyan**: Accent color for interactive elements and highlights
- **Atlas Violet**: Secondary accent for warnings and attention states
- **Atlas Signal**: Alert color for critical information

### Semantic Colors
- **Success**: Green for positive states and confirmations
- **Warning**: Yellow/amber for caution states
- **Error**: Red for errors and destructive actions
- **Info**: Blue for informational messages

### Neutral Colors
- **Background**: Dark navy for main application background
- **Surface**: Slightly lighter navy for cards and panels
- **Border**: Subtle borders for separation
- **Text**: High contrast for readability
- **Muted**: Lower contrast for secondary text

## Typography

### Font Families
- **Display**: Custom font for headings and large text
- **Body**: System sans-serif for readability
- **Mono**: Monospace for code and technical content

### Type Scale
- **H1**: 2.5rem (40px) - Page titles
- **H2**: 2rem (32px) - Section headers
- **H3**: 1.5rem (24px) - Subsection headers
- **Body**: 1rem (16px) - Body text
- **Small**: 0.875rem (14px) - Secondary text
- **X-Small**: 0.75rem (12px) - Labels and metadata

### Typography Rules
- Use sentence case for UI elements (except proper nouns)
- Use title case for page titles and section headers
- Limit line length to 60-75 characters for readability
- Use appropriate font weights for hierarchy

## Components

### Buttons
- **Primary**: Atlas Cyan background, white text, rounded corners
- **Secondary**: Transparent background, cyan border, cyan text
- **Ghost**: Transparent background, no border, subtle hover
- **Destructive**: Red background for destructive actions
- Size variants: small, medium, large
- Include loading states for async actions

### Cards
- Dark navy background with subtle borders
- Rounded corners (8px-12px)
- Consistent padding (16px-24px)
- Subtle hover effects for interactive cards
- Use for grouping related content

### Forms
- Clear labels above input fields
- Placeholder text for guidance
- Validation states (error, success, warning)
- Accessible focus states
- Consistent spacing between elements

### Navigation
- Sidebar navigation for main app
- Breadcrumbs for deep navigation
- Tab navigation for related content
- Clear active states
- Responsive mobile menu

### Tables
- Zebra striping for readability
- Sortable columns where appropriate
- Action buttons in last column
- Responsive design for mobile
- Pagination for large datasets

## Layout Patterns

### Dashboard Layout
- Sidebar navigation (left)
- Main content area (center)
- Optional right panel for details
- Responsive: collapses to hamburger menu on mobile

### Page Structure
- Page header with title and actions
- Breadcrumb navigation (if needed)
- Main content area
- Footer with pagination or actions

### Grid System
- 12-column grid for layout
- Responsive breakpoints: sm, md, lg, xl
- Consistent gutters (16px-24px)
- Flexbox for component alignment

## Spacing

### Scale
- **xs**: 4px - Tight spacing
- **sm**: 8px - Small spacing
- **md**: 16px - Medium spacing (default)
- **lg**: 24px - Large spacing
- **xl**: 32px - Extra large spacing
- **2xl**: 48px - Section spacing

### Usage Rules
- Use consistent spacing within components
- Larger spacing between sections
- Tighter spacing for related elements
- Maintain visual rhythm

## Interactive States

### Hover
- Subtle background color change
- Slight elevation increase
- Clear visual feedback
- Smooth transitions (200-300ms)

### Focus
- Clear focus ring (2px-3px)
- High contrast for accessibility
- Consistent across all interactive elements
- Keyboard navigation support

### Active
- Slight scale reduction (buttons)
- Darker background
- Clear pressed state
- Immediate feedback

### Loading
- Skeleton screens for content
- Spinners for actions
- Progress bars for operations
- Disabled state during loading

## Accessibility

### Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- WCAG AA compliant
- Test with color blindness simulators

### Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order
- Skip to main content link
- Focus indicators visible

### Screen Readers
- Proper ARIA labels
- Semantic HTML elements
- Alt text for images
- Descriptive link text

### Touch Targets
- Minimum 44x44px for touch targets
- Adequate spacing between targets
- No accidental taps
- Responsive to touch gestures

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px - 1280px
- **Large Desktop**: > 1280px

### Mobile First
- Design for mobile first
- Progressive enhancement
- Touch-friendly interactions
- Simplified layouts on small screens

### Adaptive Components
- Collapsible navigation
- Responsive tables
- Flexible grids
- Adaptive typography

## Animation

### Principles
- Purposeful motion, not decorative
- Smooth and natural (300-500ms)
- Respect user preferences (reduced motion)
- Performance optimized (60fps)

### Common Animations
- Fade in for page transitions
- Slide for mobile navigation
- Scale for button presses
- Spin for loading states

### Performance
- Use CSS transforms and opacity
- Avoid layout thrashing
- Test on low-end devices
- Provide fallbacks

## Iconography

### Icon System
- Lucide React icons (consistent style)
- 24px default size
- Consistent stroke width
- Appropriate color usage

### Usage Rules
- Use icons to supplement text, not replace
- Maintain consistent sizing
- Proper semantic meaning
- Accessible labels

## Data Visualization

### Charts
- Clear labels and legends
- Appropriate chart types
- Consistent color coding
- Interactive tooltips
- Responsive design

### Tables
- Clear headers
- Consistent alignment
- Sortable columns
- Filter options
- Export functionality

## Error Handling

### Error States
- Clear error messages
- Suggested actions
- Visual indicators
- Recovery options
- Logging for debugging

### Empty States
- Friendly messaging
- Clear next steps
- Illustrations or icons
- Call-to-action buttons

## Performance

### Loading
- Skeleton screens
- Progressive loading
- Lazy loading images
- Code splitting
- Optimized bundles

### Optimization
- Image optimization
- Font optimization
- CSS optimization
- JavaScript minification
- CDN usage

## Brand Consistency

### Logo Usage
- Consistent sizing
- Proper clear space
- Correct color usage
- Appropriate contexts

### Voice and Tone
- Professional and clear
- Action-oriented
- Concise and direct
- User-focused language

## Component Library

### Usage
- Prefer existing components over custom
- Follow component patterns
- Maintain consistency
- Document custom components

### shadcn/ui Components
- Button, Card, Input, Select
- Dialog, Sheet, Drawer
- Table, Badge, Avatar
- Form, Calendar, Date Picker
- And more as needed

## Testing

### Visual Testing
- Cross-browser testing
- Device testing
- Responsive testing
- Accessibility testing

### User Testing
- Usability testing
- A/B testing
- Feedback collection
- Iteration based on results

## Documentation

### Component Docs
- Props documentation
- Usage examples
- Accessibility notes
- Design rationale

### Pattern Library
- Common patterns
- Best practices
- Code examples
- Design tokens
