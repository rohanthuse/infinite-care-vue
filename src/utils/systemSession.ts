
export const getSystemSessionToken = (): string | null => {
  try {
    const keys = ['system_session_token', 'systemSessionToken', 'system-session-token'];
    for (const key of keys) {
      const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      if (fromLocal && fromLocal !== 'undefined' && fromLocal !== 'null') return fromLocal;

      const fromSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
      if (fromSession && fromSession !== 'undefined' && fromSession !== 'null') return fromSession;
    }
  } catch (e) {
    console.warn('[systemSession] Storage not accessible:', e);
  }
  return null;
};
