// Mock replacement for the `pusher-js` module. Vite aliases `pusher-js` to
// this file when VITE_MOCK is on, so every `new Pusher(...)` in the app gets a
// no-op client that never opens a websocket and never hits the auth endpoints.
//
// It doubles as a tiny in-process event bus so mock API handlers can push
// `agent-event`s back to subscribed components (simulated streaming).

// channelName -> Map<eventName, Set<callback>>
const channels = new Map();

function ensure(channelName) {
  if (!channels.has(channelName)) channels.set(channelName, new Map());
  return channels.get(channelName);
}

export function emit(channelName, eventName, data) {
  const ch = channels.get(channelName);
  if (!ch) return;
  const cbs = ch.get(eventName);
  if (!cbs) return;
  for (const cb of cbs) {
    try {
      cb(data);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[mock-pusher] handler threw", e);
    }
  }
}

class MockChannel {
  constructor(name) {
    this.name = name;
  }

  bind(eventName, cb) {
    const ch = ensure(this.name);
    if (!ch.has(eventName)) ch.set(eventName, new Set());
    ch.get(eventName).add(cb);
    // Immediately resolve subscription-success style events.
    if (eventName === "pusher:subscription_succeeded") {
      setTimeout(() => cb({}), 0);
    }
    return this;
  }

  unbind(eventName, cb) {
    const ch = channels.get(this.name);
    if (!ch) return this;
    if (!eventName) {
      ch.clear();
    } else if (cb) {
      ch.get(eventName)?.delete(cb);
    } else {
      ch.delete(eventName);
    }
    return this;
  }

  unbind_all() {
    channels.get(this.name)?.clear();
    return this;
  }
}

export default class MockPusher {
  constructor() {
    this.connection = {
      bind: (eventName, cb) => {
        // Immediately report a healthy connection so consumers that gate on
        // connection state (e.g. the analytics chat input) become usable.
        if (eventName === "connected") setTimeout(() => cb(), 0);
        if (eventName === "state_change") setTimeout(() => cb({ previous: "connecting", current: "connected" }), 0);
      },
      unbind: () => {},
      unbind_all: () => {},
    };
  }

  static logToConsole() {}

  signin() {}

  subscribe(name) {
    return new MockChannel(name);
  }

  unsubscribe(name) {
    channels.delete(name);
  }

  disconnect() {}

  bind() {}

  unbind_all() {}
}
