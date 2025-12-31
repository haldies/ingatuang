// Simple event emitter for cross-component communication
type EventCallback = () => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }
}

export const eventEmitter = new EventEmitter();

// Event names
export const EVENTS = {
  TRANSACTION_ADDED: 'transaction:added',
  TRANSACTION_UPDATED: 'transaction:updated',
  SUBSCRIPTION_ADDED: 'subscription:added',
  SUBSCRIPTION_UPDATED: 'subscription:updated',
};
