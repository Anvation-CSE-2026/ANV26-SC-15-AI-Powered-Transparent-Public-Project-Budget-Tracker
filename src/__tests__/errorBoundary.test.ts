import { describe, it, expect } from 'vitest';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

describe('Application Error Boundary & Safe Fallback Diagnostics', () => {
  it('catches runtime errors and derives error state with reference ID', () => {
    const error = new Error('Simulated component crash (test exception)');
    const state = ErrorBoundary.getDerivedStateFromError(error);

    expect(state.hasError).toBe(true);
    expect(state.errorId).toBeDefined();
    expect(state.errorId.startsWith('ERR-')).toBe(true);
  });

  it('generates distinct error IDs for successive crashes', () => {
    const state1 = ErrorBoundary.getDerivedStateFromError(new Error('Crash 1'));
    const state2 = ErrorBoundary.getDerivedStateFromError(new Error('Crash 2'));

    expect(state1.errorId).not.toBe(state2.errorId);
  });

  it('sanitizes user display by keeping errorId structured and non-sensitive', () => {
    const sensitiveError = new Error('Secret FIREBASE_API_KEY=AIzaSyA123456 leaked in stack');
    const state = ErrorBoundary.getDerivedStateFromError(sensitiveError);

    // The derived state MUST NOT store the sensitive raw message in user-facing errorId
    expect(state.errorId).not.toContain('AIzaSyA123456');
    expect(state.errorId).not.toContain('FIREBASE_API_KEY');
  });
});
