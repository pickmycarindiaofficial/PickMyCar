import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLink } from '../SkipLink';

describe('SkipLink', () => {
    it('renders skip link', () => {
        render(<SkipLink />);

        const link = screen.getByRole('link', { name: /skip to main content/i });
        expect(link).toBeInTheDocument();
    });

    it('links to main content', () => {
        render(<SkipLink />);

        const link = screen.getByRole('link', { name: /skip to main content/i });
        expect(link).toHaveAttribute('href', '#main-content');
    });

    it('has sr-only class for screen reader accessibility', () => {
        render(<SkipLink />);

        const link = screen.getByRole('link', { name: /skip to main content/i });
        expect(link).toHaveClass('sr-only');
    });
});
