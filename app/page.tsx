// ==================== app/page.js ====================
'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Loading component
const AppLoadingSpinner = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        {/* Animated spinner */}
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4 mx-auto"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-emerald-400 rounded-full animate-spin-reverse mb-4 mx-auto" style={{ animationDelay: '0.5s' }}></div>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Loading Time Balance</h2>
      <p className="text-gray-400">Setting up your productivity workspace...</p>
      <div className="mt-4 flex justify-center space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
)

// Dynamically import TimeBalanceApp with SSR disabled
const TimeBalanceApp = dynamic(
  () => import('./components/TimeBalanceApp'),
  { 
    ssr: false,
    loading: AppLoadingSpinner
  }
)

// Fallback error component
const ErrorFallback = ({ error, retry }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
      <p className="text-gray-400 mb-6">
        The Time Balance app failed to load. This might be due to browser storage issues or a temporary glitch.
      </p>
      <div className="space-y-3">
        <button
          onClick={retry}
          className="w-full bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 px-6 py-3 rounded-xl transition-all duration-200"
        >
          Refresh Page
        </button>
      </div>
      <details className="mt-4 text-left">
        <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
          Technical Details
        </summary>
        <pre className="mt-2 text-xs text-gray-500 bg-gray-800 p-3 rounded-lg overflow-auto">
          {error?.message || 'Unknown error occurred'}
        </pre>
      </details>
    </div>
  </div>
)

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  // Ensure we're running on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Error boundary-like behavior for dynamic imports
  const handleRetry = () => {
    setError(null)
    setRetryCount(prev => prev + 1)
    // Force re-render to retry the dynamic import
    setIsClient(false)
    setTimeout(() => setIsClient(true), 100)
  }

  // Don't render anything during SSR
  if (!isClient) {
    return <AppLoadingSpinner />
  }

  // Show error state if something went wrong
  if (error) {
    return <ErrorFallback error={error} retry={handleRetry} />
  }

  // Render the dynamic component with error handling
  try {
    return (
      <div key={retryCount}>
        <TimeBalanceApp />
      </div>
    )
  } catch (err) {
    console.error('Error rendering TimeBalanceApp:', err)
    setError(err)
    return <ErrorFallback error={err} retry={handleRetry} />
  }
}
