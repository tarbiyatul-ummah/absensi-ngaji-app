const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const STORAGE_KEY = "absensi:login-rate-limit";

interface LoginLimitState {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const readState = (): LoginLimitState => {
  if (typeof window === "undefined") {
    return { attempts: 0, firstAttemptAt: 0 };
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return { attempts: 0, firstAttemptAt: 0 };

    return JSON.parse(rawValue) as LoginLimitState;
  } catch {
    return { attempts: 0, firstAttemptAt: 0 };
  }
};

const writeState = (state: LoginLimitState) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getLoginRateLimitStatus = () => {
  const state = readState();
  const now = Date.now();

  if (state.lockedUntil && state.lockedUntil > now) {
    return {
      isLocked: true,
      retryAfterSeconds: Math.ceil((state.lockedUntil - now) / 1000),
    };
  }

  return { isLocked: false, retryAfterSeconds: 0 };
};

export const recordFailedLoginAttempt = () => {
  const state = readState();
  const now = Date.now();
  const isOutsideWindow = !state.firstAttemptAt || now - state.firstAttemptAt > WINDOW_MS;
  const nextState: LoginLimitState = isOutsideWindow
    ? { attempts: 1, firstAttemptAt: now }
    : { ...state, attempts: state.attempts + 1 };

  if (nextState.attempts >= MAX_ATTEMPTS) {
    nextState.lockedUntil = now + LOCK_MS;
  }

  writeState(nextState);
};

export const clearLoginRateLimit = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEY);
};
