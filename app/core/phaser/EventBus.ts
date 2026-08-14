export const PHASER_EVENTS = {
  action: "spectacle:action",
  entrance: "spectacle:entrance",
  hit: "spectacle:hit",
  nearMiss: "spectacle:near_miss",
  streak: "spectacle:streak",
} as const;

type Listener = (payload: Record<string, unknown>) => void;

class PhaserEventBus {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener) {
    const listeners = this.listeners.get(event) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return () => this.off(event, listener);
  }

  off(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, payload: Record<string, unknown> = {}) {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }
}

export const phaserEventBus = new PhaserEventBus();
