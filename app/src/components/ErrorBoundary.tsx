import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fbfaf9] dark:bg-[#121212] p-6 font-sans transition-colors">
          <div className="w-full max-w-md border border-[#f2f0ed] dark:border-[#282624] bg-white dark:bg-[#1c1a19] rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-[18px] font-bold text-[#121212] dark:text-[#fbfaf9] mb-2">Something went wrong</h1>
            <p className="text-[13px] text-[#848281] dark:text-[#a7a7a7] mb-6 leading-relaxed">
              An unexpected error occurred in Shutter. Click below to return to your dashboard.
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-left bg-[#f8f7f4] dark:bg-[#22201d] text-red-500 dark:text-red-400 p-3 rounded-lg overflow-x-auto max-h-32 mb-6 font-mono">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-[#121212] dark:bg-[#fbfaf9] text-white dark:text-[#121212] py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-95 transition-opacity"
            >
              Back to Safety
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
