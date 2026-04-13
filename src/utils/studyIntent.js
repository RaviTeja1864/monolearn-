const PENDING_INTENT_KEY = 'solo-tutor-pending-intent';
const LEGACY_PENDING_INTENT_KEY = 'studyos-pending-intent';

export const getPendingIntent = () => {
  try {
    const raw =
      localStorage.getItem(PENDING_INTENT_KEY) ||
      localStorage.getItem(LEGACY_PENDING_INTENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPendingIntent = () => {
  localStorage.removeItem(PENDING_INTENT_KEY);
  localStorage.removeItem(LEGACY_PENDING_INTENT_KEY);
};

export const setPendingIntent = (intent) => {
  localStorage.setItem(PENDING_INTENT_KEY, JSON.stringify(intent));
  return intent;
};

export const dispatchNavigationIntent = ({ page, status, payload = {} }) => {
  const intent = setPendingIntent({
    id: crypto.randomUUID(),
    page,
    status,
    payload,
    createdAt: new Date().toISOString(),
  });

  window.dispatchEvent(
    new CustomEvent('solo-tutor:navigate', {
      detail: {
        page,
        status,
        intent,
      },
    }),
  );

  return intent;
};
