import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * Provides a fallback UI and recovery options instead of crashing the whole app
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // TODO: In production, send error to monitoring service (Sentry)
        // if (import.meta.env.PROD) {
        //   Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                    <div className="max-w-md text-center space-y-6">
                        {/* Error Icon */}
                        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>

                        {/* Error Message */}
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">
                                Something went wrong
                            </h1>
                            <p className="text-muted-foreground">
                                We're sorry, but something unexpected happened. Please try again or return to the homepage.
                            </p>
                        </div>

                        {/* Error Details (Shown for debugging APK) */}
                        {this.state.error && (
                            <details className="text-left bg-muted/50 rounded-lg p-4 text-sm w-full">
                                <summary className="cursor-pointer font-medium text-muted-foreground">
                                    Technical Error Details (Please show this to support)
                                </summary>
                                <pre className="mt-2 overflow-auto text-xs text-destructive whitespace-pre-wrap break-all">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button onClick={this.handleRetry} variant="default">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                            <Button onClick={this.handleGoHome} variant="outline">
                                <Home className="mr-2 h-4 w-4" />
                                Go to Homepage
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
