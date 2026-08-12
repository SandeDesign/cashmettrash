/**
 * Error logger for PWA debugging
 * Stores errors in localStorage so they persist across reloads
 */

interface ErrorLog {
  timestamp: string;
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
}

const MAX_LOGS = 50;
const STORAGE_KEY = 'cmt_error_logs';

export const logError = (error: Error | string, context?: string) => {
  try {
    const logs = getErrorLogs();

    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      message: typeof error === 'string' ? error : `${context ? context + ': ' : ''}${error.message}`,
      stack: typeof error === 'object' ? error.stack : undefined,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    logs.unshift(errorLog);

    // Keep only the last MAX_LOGS entries
    if (logs.length > MAX_LOGS) {
      logs.splice(MAX_LOGS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

    // Also log to console
    console.error('[ErrorLogger]', errorLog);
  } catch (e) {
    // If localStorage fails, just log to console
    console.error('[ErrorLogger] Failed to store error:', e);
    console.error('[ErrorLogger] Original error:', error);
  }
};

export const getErrorLogs = (): ErrorLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[ErrorLogger] Failed to retrieve logs:', e);
    return [];
  }
};

export const clearErrorLogs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('[ErrorLogger] Failed to clear logs:', e);
  }
};

// Errors that come from the dev environment (webcontainer, HMR, etc.) — not our app
const IGNORED_ERROR_PATTERNS = [
  /webcontainer/i,
  /\.webcontainer@/i,
  /webcontainer-api\.io/i,
  /Failed to construct 'URL': Invalid URL/i, // webcontainer proxy runtime error
  /ResizeObserver loop/i,                     // benign browser warning
];

const shouldIgnoreError = (message: string, stack?: string): boolean => {
  const text = `${message} ${stack ?? ''}`;
  return IGNORED_ERROR_PATTERNS.some((p) => p.test(text));
};

// Setup global error handlers
export const setupGlobalErrorHandlers = () => {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    const msg = (event.error?.message ?? event.message) as string;
    const stack = event.error?.stack as string | undefined;
    if (shouldIgnoreError(msg, stack)) return;
    logError(event.error || event.message, 'Unhandled Error');
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message ?? String(reason);
    if (shouldIgnoreError(msg, reason?.stack)) return;
    logError(reason || 'Unhandled Promise Rejection', 'Promise Rejection');
  });

  // Log to console that error logging is active
  console.log('[ErrorLogger] Global error handlers initialized');
};
