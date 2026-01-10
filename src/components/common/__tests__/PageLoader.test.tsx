import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLoader, InlineLoader } from '../PageLoader';

describe('PageLoader', () => {
    it('renders with default message', () => {
        render(<PageLoader />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
        render(<PageLoader message="Loading dashboard..." />);

        expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('has proper accessibility attributes', () => {
        render(<PageLoader />);

        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-live', 'polite');
    });
});

describe('InlineLoader', () => {
    it('renders with accessibility attributes', () => {
        render(<InlineLoader />);

        const status = screen.getByRole('status');
        expect(status).toBeInTheDocument();
        expect(status).toHaveAttribute('aria-live', 'polite');
    });
});
