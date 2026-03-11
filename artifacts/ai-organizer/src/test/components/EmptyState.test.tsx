import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../../components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title correctly', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState 
        title="No results" 
        description="Try adjusting your search terms" 
      />
    );
    expect(screen.getByText('Try adjusting your search terms')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState 
        title="Empty" 
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );
    
    const button = screen.getByText('Add Item');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with different variants', () => {
    const { rerender } = render(<EmptyState title="Test" variant="default" />);
    expect(screen.getByText('📋')).toBeInTheDocument();

    rerender(<EmptyState title="Test" variant="search" />);
    expect(screen.getByText('🔍')).toBeInTheDocument();

    rerender(<EmptyState title="Test" variant="error" />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<EmptyState title="Test" variant="success" />);
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('uses custom icon when provided', () => {
    render(<EmptyState title="Custom" icon="🎉" />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });
});
