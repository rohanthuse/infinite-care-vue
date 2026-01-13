
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WizardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface WizardErrorBoundaryProps {
  children: React.ReactNode;
  stepNumber?: number;
  onRetry?: () => void;
}

export class WizardErrorBoundary extends React.Component<
  WizardErrorBoundaryProps,
  WizardErrorBoundaryState
> {
  constructor(props: WizardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): WizardErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Always log detailed error info for debugging
    console.error('[WizardErrorBoundary] Error caught:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      stepNumber: this.props.stepNumber
    });
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 text-center mb-4 max-w-md">
            {this.props.stepNumber 
              ? `There was an error loading step ${this.props.stepNumber}. This may be caused by corrupted draft data (e.g., invalid dates or missing fields).`
              : "There was an error loading this section. The draft data may contain invalid or corrupted values."
            }
          </p>
          <p className="text-red-500 text-sm text-center mb-4 max-w-md">
            Try clicking "Try Again" or refresh the page. If the issue persists, you may need to clear the draft and start fresh.
          </p>
          <div className="space-x-2">
            <Button onClick={this.handleRetry} variant="outline">
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="destructive"
            >
              Refresh Page
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full max-w-2xl">
              <summary className="cursor-pointer text-sm text-red-700">
                Error Details (Development Mode)
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-40">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
