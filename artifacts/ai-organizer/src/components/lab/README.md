# Lab Components Library

CoFounderBay-inspired component library for Think!Hub Research Lab. This library provides a comprehensive set of enterprise-grade UI components designed for scientific research workflows.

## Components Overview

### LabButton
Professional button component with multiple variants and states.

**Variants:** `primary` | `secondary` | `outline` | `ghost` | `link` | `success` | `warning` | `error`  
**Sizes:** `xs` | `sm` | `md` | `lg` | `xl`

```tsx
import { LabButton } from '@/components/lab';

// Primary button
<LabButton variant="primary" size="md" onClick={handleClick}>
  Submit Analysis
</LabButton>

// With icons
<LabButton 
  variant="success" 
  leftIcon={<span>✓</span>}
  rightIcon={<span>→</span>}
>
  Verify Claim
</LabButton>

// Loading state
<LabButton variant="primary" loading>
  Processing...
</LabButton>

// Full width
<LabButton variant="outline" fullWidth>
  Full Width Button
</LabButton>
```

### LabCard
Versatile card component for content organization.

**Variants:** `default` | `elevated` | `outlined` | `filled` | `glass`  
**Padding:** `none` | `sm` | `md` | `lg` | `xl`

```tsx
import { LabCard } from '@/components/lab';

// Basic card
<LabCard variant="elevated" padding="md">
  <h3>Research Findings</h3>
  <p>Your content here...</p>
</LabCard>

// With header and footer
<LabCard
  variant="default"
  padding="lg"
  header={<h3>Document Analysis</h3>}
  footer={<div>Last updated: 2 hours ago</div>}
>
  <p>Analysis results...</p>
</LabCard>

// Hoverable and clickable
<LabCard 
  variant="outlined" 
  hoverable 
  clickable
  onClick={handleCardClick}
>
  Click me!
</LabCard>

// Glass morphism effect
<LabCard variant="glass" padding="md">
  <p>Beautiful glass effect</p>
</LabCard>
```

### LabInput
Form input component with validation and icons.

**Variants:** `outline` | `filled` | `flushed`  
**Sizes:** `sm` | `md` | `lg`

```tsx
import { LabInput } from '@/components/lab';

// Basic input
<LabInput
  variant="outline"
  size="md"
  placeholder="Enter claim text..."
/>

// With label and helper text
<LabInput
  label="Research Question"
  helperText="Be specific and measurable"
  placeholder="What is your hypothesis?"
/>

// With error
<LabInput
  label="Email"
  error="Invalid email format"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With icons
<LabInput
  leftIcon={<span>🔍</span>}
  rightIcon={<span>✓</span>}
  placeholder="Search documents..."
/>

// Full width
<LabInput fullWidth placeholder="Full width input" />
```

### LabPanel
Advanced panel component for organizing content sections.

**Variants:** `default` | `compact` | `expanded`

```tsx
import { LabPanel } from '@/components/lab';

// Basic panel
<LabPanel
  title="Documents & Sources"
  icon={<span>📚</span>}
  description="Manage your research documents"
>
  <p>Panel content...</p>
</LabPanel>

// With actions
<LabPanel
  title="Claims Workspace"
  icon={<span>📝</span>}
  actions={
    <LabButton variant="primary" size="sm">
      Add Claim
    </LabButton>
  }
  onRefresh={handleRefresh}
>
  <p>Claims list...</p>
</LabPanel>

// Collapsible
<LabPanel
  title="Evidence & Verification"
  collapsible
  defaultCollapsed={false}
>
  <p>Evidence content...</p>
</LabPanel>

// With loading state
<LabPanel
  title="Analytics"
  loading={isLoading}
>
  <p>Analytics data...</p>
</LabPanel>

// With error
<LabPanel
  title="News Feed"
  error="Failed to load news. Please try again."
>
  <p>News content...</p>
</LabPanel>
```

### LabToolCard
Interactive tool card with drag & drop support.

**Status:** `idle` | `active` | `completed` | `error`

```tsx
import { LabToolCard } from '@/components/lab';

// Basic tool card
<LabToolCard
  id="tool-1"
  title="Claim Verification"
  description="Verify claims against evidence sources"
  icon={<span>✓</span>}
  category="Analysis"
  onClick={handleToolClick}
/>

// With status and progress
<LabToolCard
  id="tool-2"
  title="Document Parser"
  description="Extract key information from documents"
  icon={<span>📄</span>}
  status="active"
  progress={75}
  onActivate={handleActivate}
/>

// Draggable
<LabToolCard
  id="tool-3"
  title="Evidence Chain Builder"
  description="Build logical evidence chains"
  icon={<span>🔗</span>}
  draggable
  onRemove={handleRemove}
/>

// With custom actions
<LabToolCard
  id="tool-4"
  title="Peer Review Simulator"
  description="Simulate peer review feedback"
  icon={<span>👥</span>}
  status="completed"
  actions={
    <>
      <LabButton variant="ghost" size="sm">View</LabButton>
      <LabButton variant="ghost" size="sm">Share</LabButton>
    </>
  }
/>
```

### Layout Components

#### LabContainer
Responsive container with max-width constraints.

```tsx
import { LabContainer } from '@/components/lab';

<LabContainer maxWidth="xl" centerContent>
  <h1>Research Lab</h1>
  <p>Content is centered and constrained to xl width</p>
</LabContainer>
```

#### LabGrid
Responsive grid layout system.

```tsx
import { LabGrid } from '@/components/lab';

// Simple grid
<LabGrid columns={3} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</LabGrid>

// Responsive grid
<LabGrid 
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} 
  gap="lg"
>
  <LabCard>Card 1</LabCard>
  <LabCard>Card 2</LabCard>
  <LabCard>Card 3</LabCard>
  <LabCard>Card 4</LabCard>
</LabGrid>
```

#### LabFlex
Flexible layout with alignment control.

```tsx
import { LabFlex } from '@/components/lab';

// Horizontal flex
<LabFlex direction="row" align="center" justify="between" gap="md">
  <h3>Title</h3>
  <LabButton>Action</LabButton>
</LabFlex>

// Vertical flex
<LabFlex direction="column" align="start" gap="sm">
  <LabInput placeholder="Name" />
  <LabInput placeholder="Email" />
  <LabButton>Submit</LabButton>
</LabFlex>
```

#### LabStack
Vertical stacking with optional dividers.

```tsx
import { LabStack, LabDivider } from '@/components/lab';

// Simple stack
<LabStack spacing="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</LabStack>

// Stack with dividers
<LabStack spacing="lg" divider={<LabDivider />}>
  <LabCard>Section 1</LabCard>
  <LabCard>Section 2</LabCard>
  <LabCard>Section 3</LabCard>
</LabStack>
```

#### LabSpacer
Spacing utility component.

```tsx
import { LabSpacer } from '@/components/lab';

<div>
  <h1>Title</h1>
  <LabSpacer size="xl" />
  <p>Content with extra spacing above</p>
</div>
```

#### LabDivider
Horizontal or vertical divider.

```tsx
import { LabDivider } from '@/components/lab';

// Horizontal divider
<LabDivider orientation="horizontal" variant="solid" />

// Vertical divider
<LabFlex direction="row">
  <div>Left content</div>
  <LabDivider orientation="vertical" variant="dashed" />
  <div>Right content</div>
</LabFlex>
```

## Complete Example: Research Lab Panel

```tsx
import {
  LabPanel,
  LabGrid,
  LabToolCard,
  LabButton,
  LabInput,
  LabFlex,
  LabStack,
  LabDivider,
} from '@/components/lab';

function ResearchLabPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tools = [
    {
      id: 'claim-verification',
      title: 'Claim Verification',
      description: 'Verify claims against evidence sources',
      icon: '✓',
      category: 'Analysis',
      status: 'active' as const,
      progress: 60,
    },
    {
      id: 'evidence-chain',
      title: 'Evidence Chain Builder',
      description: 'Build logical evidence chains',
      icon: '🔗',
      category: 'Construction',
      status: 'idle' as const,
    },
    {
      id: 'peer-review',
      title: 'Peer Review Simulator',
      description: 'Simulate peer review feedback',
      icon: '👥',
      category: 'Validation',
      status: 'completed' as const,
    },
  ];

  return (
    <LabPanel
      title="Research Tools"
      icon={<span>🔬</span>}
      description="Select and activate research tools"
      loading={isLoading}
      onRefresh={() => setIsLoading(true)}
      actions={
        <LabButton variant="primary" size="sm">
          Add Tool
        </LabButton>
      }
    >
      <LabStack spacing="lg">
        {/* Search */}
        <LabInput
          leftIcon={<span>🔍</span>}
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />

        <LabDivider />

        {/* Tools Grid */}
        <LabGrid columns={{ xs: 1, md: 2, lg: 3 }} gap="md">
          {tools.map((tool) => (
            <LabToolCard
              key={tool.id}
              {...tool}
              draggable
              onActivate={() => console.log('Activate', tool.id)}
              onRemove={() => console.log('Remove', tool.id)}
            />
          ))}
        </LabGrid>

        <LabDivider />

        {/* Actions */}
        <LabFlex justify="end" gap="sm">
          <LabButton variant="outline">Cancel</LabButton>
          <LabButton variant="primary">Apply Changes</LabButton>
        </LabFlex>
      </LabStack>
    </LabPanel>
  );
}
```

## Design Tokens Integration

All components use the centralized design tokens system from `src/styles/DesignTokens.ts`:

- **Colors**: Semantic colors, neutral palette, brand colors, theme-specific colors
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl, 2xl, etc.)
- **Typography**: Font families, sizes, weights, line heights, letter spacing
- **Shadows**: Shadow system for depth and elevation
- **Border Radius**: Consistent border radius values
- **Animation**: Duration and easing functions
- **Breakpoints**: Responsive breakpoint system
- **Z-Index**: Layering system

## Best Practices

1. **Consistency**: Use Lab components throughout the Research Lab for visual consistency
2. **Accessibility**: All components include proper ARIA attributes and keyboard navigation
3. **Responsiveness**: Components adapt to different screen sizes automatically
4. **Performance**: Components are optimized with proper memoization and transitions
5. **Composition**: Combine components to create complex UIs
6. **Type Safety**: Full TypeScript support with comprehensive type definitions

## Migration Guide

To migrate existing Research Lab UI to use Lab components:

1. Replace inline styled divs with `LabCard`
2. Replace custom buttons with `LabButton`
3. Replace form inputs with `LabInput`
4. Wrap sections in `LabPanel` for consistent panel UI
5. Use `LabGrid` and `LabFlex` for layouts instead of inline styles
6. Replace tool cards with `LabToolCard`

## Support

For questions or issues, refer to:
- Design Tokens: `src/styles/DesignTokens.ts`
- Component Source: `src/components/lab/`
- CoFounderBay Transformation Plan: `RESEARCH_LAB_COFOUNDERBAY_PLAN.md`
