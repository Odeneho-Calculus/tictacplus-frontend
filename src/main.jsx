import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

// Store
import { store, persistor } from './store';

// Components
import App from './App';
import LoadingSpinner from './components/ui/LoadingSpinner/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary/ErrorBoundary';

// Styles
import './styles/_index.scss';

// Performance monitoring
if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    // Initialize analytics here if needed
    console.log('Analytics enabled');
}

// Service Worker management
if ('serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
        // In development, aggressively unregister any existing service workers
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                console.log('Unregistering SW for development:', registration);
                registration.unregister().then(() => {
                    console.log('SW unregistered successfully');
                    // Clear all caches
                    if ('caches' in window) {
                        caches.keys().then(cacheNames => {
                            cacheNames.forEach(cacheName => {
                                console.log('Deleting cache:', cacheName);
                                caches.delete(cacheName);
                            });
                        });
                    }
                    // Force a hard reload to clear any cached resources
                    window.location.reload(true);
                });
            });
        }).catch(err => {
            console.error('Error unregistering service workers:', err);
        });
    } else if (import.meta.env.VITE_ENABLE_PWA === 'true') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New content is available, notify user
                                    console.log('New content available, please refresh');
                                }
                            });
                        }
                    });
                })
                .catch((registrationError) => {
                    console.warn('SW registration failed: ', registrationError);
                    // Don't throw error, just log it
                });
        });
    }
}

// Toast configuration
const toastOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
    },
    success: {
        iconTheme: {
            primary: 'var(--color-success)',
            secondary: 'white',
        },
    },
    error: {
        iconTheme: {
            primary: 'var(--color-error)',
            secondary: 'white',
        },
    },
    loading: {
        iconTheme: {
            primary: 'var(--color-primary)',
            secondary: 'white',
        },
    },
};

// Error boundary fallback
const ErrorFallback = ({ error, onReset }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
    }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Oops! Something went wrong
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
                onClick={onReset}
                style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
            >
                Try Again
            </button>
            <button
                onClick={() => window.location.reload()}
                style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
            >
                Reload Page
            </button>
        </div>
        {import.meta.env.DEV && (
            <details style={{ marginTop: '2rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                    Error Details (Development)
                </summary>
                <pre style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    overflow: 'auto',
                    maxHeight: '200px',
                    whiteSpace: 'pre-wrap',
                }}>
                    {error?.toString()}
                </pre>
            </details>
        )}
    </div>
);

// Loading fallback for PersistGate
const PersistLoading = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
        <LoadingSpinner size="large" color="white" text="Loading TicTac+..." />
    </div>
);

// Main App Component
const AppWithProviders = () => (
    <ErrorBoundary fallback={ErrorFallback}>
        <Provider store={store}>
            <PersistGate loading={<PersistLoading />} persistor={persistor}>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <HelmetProvider>
                        <App />
                        <Toaster toastOptions={toastOptions} />
                    </HelmetProvider>
                </BrowserRouter>
            </PersistGate>
        </Provider>
    </ErrorBoundary>
);

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));

// Enable React strict mode in development
if (import.meta.env.DEV) {
    root.render(
        <React.StrictMode>
            <AppWithProviders />
        </React.StrictMode>
    );
} else {
    root.render(<AppWithProviders />);
}

// Hot Module Replacement for development
if (import.meta.hot) {
    import.meta.hot.accept();
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);

    // Report to analytics if enabled
    if (window.gtag && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
        window.gtag('event', 'exception', {
            description: event.error?.toString() || 'Unknown error',
            fatal: false,
        });
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // Report to analytics if enabled
    if (window.gtag && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
        window.gtag('event', 'exception', {
            description: event.reason?.toString() || 'Unhandled promise rejection',
            fatal: false,
        });
    }
});

// Performance monitoring
if (import.meta.env.VITE_SHOW_PERFORMANCE === 'true') {
    // Log performance metrics
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Performance metrics:', {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                totalTime: perfData.loadEventEnd - perfData.fetchStart,
            });
        }, 0);
    });
}