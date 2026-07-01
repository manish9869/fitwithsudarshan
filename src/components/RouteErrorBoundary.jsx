import { Component } from 'react';

export default class RouteErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('[RouteErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 16,
                    background: 'hsl(0 0% 4%)', color: 'white', textAlign: 'center', padding: 24,
                }}>
                    <p>Something went wrong loading this page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: '10px 24px', borderRadius: 999, background: '#e71763', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}