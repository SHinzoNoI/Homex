import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
                    <div className="glass rounded-2xl p-10 text-center max-w-lg border border-red-500/20">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h2 className="text-white text-2xl font-bold mb-2">Something went wrong</h2>
                        <p className="text-slate-400 mb-2">An unexpected error occurred in this section.</p>
                        <p className="text-red-400 text-xs font-mono bg-red-500/10 rounded-lg p-3 mb-6 text-left overflow-auto max-h-32">
                            {this.state.error?.message}
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="btn-primary px-6 py-2.5 mr-3"
                        >
                            Try Again
                        </button>
                        <a href="/" className="btn-ghost px-6 py-2.5">Go Home</a>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
