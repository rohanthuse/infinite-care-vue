import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ServiceReportsErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ServiceReportsErrorBoundaryProps {
  children: React.ReactNode;
  clientId?: string;
}

export class ServiceReportsErrorBoundary extends React.Component<
  ServiceReportsErrorBoundaryProps,
  ServiceReportsErrorBoundaryState
> {
  constructor(props: ServiceReportsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ServiceReportsErrorBoundaryState {
    console.error('[ServiceReportsErrorBoundary] Error caught:', error);
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ServiceReportsErrorBoundary] Component error:', error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    console.log('[ServiceReportsErrorBoundary] Retrying...');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6">
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <span>Failed to load service reports</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    There was an issue loading the service reports section. This might be temporary.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleRetry}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-mono">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-red-700">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}