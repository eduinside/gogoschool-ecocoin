interface QueuedEvent {
  eventKey: string;
  payload?: Record<string, unknown>;
  clientTs: number;
}

const FLUSH_INTERVAL_MS = 5000;
const FLUSH_SIZE = 10;
const STORAGE_KEY = 'ecoin_event_queue';

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function getSessionId(): string {
  let id = sessionStorage.getItem('ecoin_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('ecoin_session_id', id);
  }
  return id;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

async function flush() {
  if (queue.length === 0) return;

  const events = queue.splice(0);
  const token = localStorage.getItem('ecoin_token');
  if (!token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return;
  }

  try {
    await fetch('/api/logs/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId: getSessionId(),
        events,
        appVersion: '2.0.0',
        platform: 'web',
      }),
    });
  } catch {
    queue.unshift(...events);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }
}

export function track(eventKey: string, payload?: Record<string, unknown>) {
  queue.push({ eventKey, payload: payload ?? {}, clientTs: Date.now() });
  if (queue.length >= FLUSH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

export function initTracking() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      queue.unshift(...JSON.parse(saved));
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
