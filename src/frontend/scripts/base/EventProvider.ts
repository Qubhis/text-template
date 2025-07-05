export default abstract class EventProvider<E> {
    protected listeners: Map<E, Set<(event: E, data?: unknown) => void>>;

    protected constructor() {
        this.listeners = new Map();
    }

    protected emit(event: E, data?: unknown): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach((listener) => {
                try {
                    listener(event, data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Add event listener
     */
    public addEventListener(event: E, listener: (event: E, data?: unknown) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }
}
