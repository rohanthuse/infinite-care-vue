
import React from 'react';

interface AuthErrorBoundaryProps {
  error: string | null;
  children: React.ReactNode;
}

export const AuthErrorBoundary = ({ error, children }: AuthErrorBoundaryProps) => {
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-destructive/10">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md border border-destructive/20">
          <div className="text-destructive mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
