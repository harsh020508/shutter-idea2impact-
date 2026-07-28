import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Structured error report for logging and diagnostics
    const errorReport = {
      message: error.message,
      stack: error.stack ?? null,
      componentStack: errorInfo.componentStack ?? null,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    console.error("Uncaught runtime error:", errorReport);

    // TODO: Integrate an error reporting service (e.g. Sentry, Datadog, Bugsnag).
    // Example with Sentry:
    //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  /** Retry: clear the error and re-render children on the current page. */
  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  /** Go Home: clear the error and navigate to the application root. */
  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  /** Log extended error details to the console (dev-mode diagnostics). */
  private handleReport = () => {
    const { error, errorInfo } = this.state;

    const details = {
      message: error?.message ?? "Unknown error",
      name: error?.name ?? "Error",
      stack: error?.stack ?? "No stack trace available",
      componentStack: errorInfo?.componentStack ?? "No component stack available",
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.group("[Shutter] Error Report");
    console.log("Details:", details);
    console.groupEnd();

    // Surface a brief confirmation so the user knows it worked
    alert("Error details have been logged to the developer console. Share them with Shutter support if needed.");
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
              An unexpected error occurred in Shutter. You can try again or return to the home page.
            </p>

            {/* Collapsible error details */}
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-[12px] font-medium text-[#848281] dark:text-[#a7a7a7] cursor-pointer select-none hover:text-[#121212] dark:hover:text-[#fbfaf9] transition-colors">
                  Show error details
                </summary>
                <pre className="mt-2 text-[10px] bg-[#f8f7f4] dark:bg-[#22201d] text-red-500 dark:text-red-400 p-3 rounded-lg overflow-x-auto max-h-32 font-mono">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-[#121212] dark:bg-[#fbfaf9] text-white dark:text-[#121212] py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-95 transition-opacity"
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 border border-[#e5e3e0] dark:border-[#333130] bg-transparent text-[#121212] dark:text-[#fbfaf9] py-2.5 rounded-xl text-[13px] font-semibold hover:bg-[#f4f3f0] dark:hover:bg-[#252320] transition-colors"
              >
                Go Home
              </button>
            </div>

            {/* Report link */}
            <button
              onClick={this.handleReport}
              className="mt-4 text-[12px] text-[#848281] dark:text-[#a7a7a7] underline underline-offset-2 hover:text-[#121212] dark:hover:text-[#fbfaf9] transition-colors"
            >
              Report this issue
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
