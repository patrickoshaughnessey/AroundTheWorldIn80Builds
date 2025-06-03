/**
 * Interface for event registration that can be used to remove a listener.
 */
export interface EventRegistration {
  remove(): void;
}

/**
 * A generic event dispatcher that allows binding and triggering of events.
 */
export class EventDispatcher<T> {
  private listeners: ((data: T) => void)[] = [];

  /**
   * Add a listener to this event dispatcher.
   * @param callback The function to call when the event is dispatched.
   * @returns An event registration that can be used to remove the listener.
   */
  add(callback: (data: T) => void): EventRegistration {
    this.listeners.push(callback);
    return {
      remove: () => {
        const index = this.listeners.indexOf(callback);
        if (index !== -1) {
          this.listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Remove a listener from this event dispatcher.
   * @param registration The event registration returned by the add method.
   */
  remove(registration: EventRegistration): void {
    if (registration && typeof registration.remove === 'function') {
      registration.remove();
    }
  }

  /**
   * Dispatch an event to all listeners.
   * @param data The data to pass to the listeners.
   */
  dispatch(data: T): void {
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}
