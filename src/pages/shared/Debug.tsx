import React, { useState, useEffect } from 'react';
import { Bug, RefreshCw, Trash2, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { getErrorLogs, clearErrorLogs } from '../../utils/errorLogger';
import { auth, db } from '../../lib/firebase';

const Debug: React.FC = () => {
  const { user, loading, error, isAuthenticated } = useAuth();
  const authStoreState = useAuthStore();
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadLogs = () => {
    setErrorLogs(getErrorLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Auto refresh every 2 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLogs();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleClearLogs = () => {
    if (confirm('Weet je zeker dat je alle error logs wilt verwijderen?')) {
      clearErrorLogs();
      loadLogs();
    }
  };

  const handleCopyDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      auth: {
        isAuthenticated,
        loading,
        error,
        user: user ? {
          uid: user.uid,
          email: user.email,
          role: user.role,
          verification_status: user.verification_status,
          onboarding_completed: user.onboarding_completed,
        } : null,
      },
      firebase: {
        authInitialized: !!auth,
        dbInitialized: !!db,
        currentUser: auth?.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
        } : null,
      },
      url: {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        href: window.location.href,
      },
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      errorLogs: errorLogs.slice(0, 5), // Last 5 errors
    };

    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--vl-bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="vl-card p-6 rounded-lg mb-6 border border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bug className="w-8 h-8 text-orange-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Debug Info</h1>
                <p className="text-neutral-400 text-sm">Voor PWA debugging op telefoon</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-md transition-colors ${
                  autoRefresh ? 'bg-green-500 text-white' : 'bg-neutral-700 text-neutral-300'
                }`}
                title="Auto refresh"
              >
                <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleCopyDebugInfo}
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-400 transition-colors"
                title="Kopieer debug info"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Auth State */}
        <div className="vl-card p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🔐 Auth State
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between border-b border-neutral-700 pb-2">
              <span className="text-neutral-400">Authenticated:</span>
              <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                {isAuthenticated ? '✅ YES' : '❌ NO'}
              </span>
            </div>
            <div className="flex justify-between border-b border-neutral-700 pb-2">
              <span className="text-neutral-400">Loading:</span>
              <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
                {loading ? '⏳ YES' : '✅ NO'}
              </span>
            </div>
            {error && (
              <div className="border-b border-neutral-700 pb-2">
                <span className="text-neutral-400">Error:</span>
                <div className="text-red-400 mt-1 break-words">{error}</div>
              </div>
            )}
            {user && (
              <>
                <div className="flex justify-between border-b border-neutral-700 pb-2">
                  <span className="text-neutral-400">UID:</span>
                  <span className="text-white break-all">{user.uid.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between border-b border-neutral-700 pb-2">
                  <span className="text-neutral-400">Email:</span>
                  <span className="text-white break-all">{user.email}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-700 pb-2">
                  <span className="text-neutral-400">Role:</span>
                  <span className="text-purple-400 font-bold">{user.role?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-700 pb-2">
                  <span className="text-neutral-400">Verification:</span>
                  <span className={
                    user.verification_status === 'approved' ? 'text-green-400' :
                    user.verification_status === 'pending' ? 'text-yellow-400' :
                    'text-red-400'
                  }>
                    {user.verification_status?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-neutral-700 pb-2">
                  <span className="text-neutral-400">Onboarding:</span>
                  <span className={user.onboarding_completed ? 'text-green-400' : 'text-red-400'}>
                    {user.onboarding_completed ? '✅ DONE' : '❌ NOT DONE'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Firebase State */}
        <div className="vl-card p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🔥 Firebase State
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between border-b border-neutral-700 pb-2">
              <span className="text-neutral-400">Auth Init:</span>
              <span className={auth ? 'text-green-400' : 'text-red-400'}>
                {auth ? '✅ YES' : '❌ NO'}
              </span>
            </div>
            <div className="flex justify-between border-b border-neutral-700 pb-2">
              <span className="text-neutral-400">DB Init:</span>
              <span className={db ? 'text-green-400' : 'text-red-400'}>
                {db ? '✅ YES' : '❌ NO'}
              </span>
            </div>
            {auth?.currentUser && (
              <>
                <div className="flex justify-between border-b border-neutral-700 pb-2">
                  <span className="text-neutral-400">Current User UID:</span>
                  <span className="text-white break-all">{auth.currentUser.uid.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between border-b border-neutral-700 pb-2">
                  <span className="text-neutral-400">Current User Email:</span>
                  <span className="text-white break-all">{auth.currentUser.email}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* URL Info */}
        <div className="vl-card p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🌐 URL Info
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="border-b border-neutral-700 pb-2">
              <span className="text-neutral-400">Pathname:</span>
              <div className="text-white break-all mt-1">{window.location.pathname}</div>
            </div>
            <div className="border-b border-neutral-700 pb-2">
              <span className="text-neutral-400">Full URL:</span>
              <div className="text-white break-all mt-1">{window.location.href}</div>
            </div>
            <div className="flex justify-between border-b border-neutral-700 pb-2">
              <span className="text-neutral-400">Online:</span>
              <span className={navigator.onLine ? 'text-green-400' : 'text-red-400'}>
                {navigator.onLine ? '✅ YES' : '❌ NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Logs */}
        <div className="vl-card p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🐛 Error Logs ({errorLogs.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={loadLogs}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-400 transition-colors text-sm flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleClearLogs}
                className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-400 transition-colors text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          {errorLogs.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">Geen errors gelogd 🎉</p>
          ) : (
            <div className="space-y-4">
              {errorLogs.slice(0, 10).map((log, index) => (
                <div key={index} className="bg-neutral-800 border border-red-900 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-red-400 font-bold text-sm">#{index + 1}</span>
                    <span className="text-neutral-500 text-xs">
                      {new Date(log.timestamp).toLocaleString('nl-NL')}
                    </span>
                  </div>
                  <div className="text-red-300 font-mono text-sm mb-2 break-words">
                    {log.message}
                  </div>
                  {log.stack && (
                    <details className="mt-2">
                      <summary className="text-neutral-400 text-xs cursor-pointer hover:text-neutral-300">
                        Stack trace
                      </summary>
                      <pre className="text-neutral-500 text-xs mt-2 overflow-x-auto whitespace-pre-wrap break-words">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                  <div className="text-neutral-600 text-xs mt-2">
                    URL: {log.url}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="vl-card p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors font-semibold"
            >
              🔄 Reload App
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                alert('Storage cleared! De app zal nu herladen.');
                window.location.href = '/';
              }}
              className="w-full px-4 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-400 transition-colors font-semibold"
            >
              🗑️ Clear Storage & Reload
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-400 transition-colors font-semibold"
            >
              🏠 Go Home
            </button>
          </div>
        </div>

        {/* User Agent */}
        <div className="mt-6 p-4 bg-neutral-900 rounded-lg">
          <p className="text-neutral-500 text-xs font-mono break-words">
            {navigator.userAgent}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Debug;
