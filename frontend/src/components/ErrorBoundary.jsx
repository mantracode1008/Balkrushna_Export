import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8" />
                        </div>

                        <h2 className="text-2xl font-black text-slate-800 mb-2">Something went wrong</h2>
                        <p className="text-slate-500 mb-6">
                            We encountered an unexpected error. The application has been paused to prevent data loss.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-100 p-4 rounded-lg text-left mb-6 overflow-auto max-h-40">
                                <p className="text-xs font-mono text-slate-600 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Reload Application
                            </button>
                        </div>

                        <p className="mt-6 text-xs text-slate-400">
                            If this persists, please contact support with the error details above.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
