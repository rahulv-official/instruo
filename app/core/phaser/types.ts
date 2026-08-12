export interface PhaserGameHandle {
  destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
  startGame?: (option?: unknown) => void;
  restartGame?: (option?: unknown) => void;
  toggleMute?: () => boolean;
}

export type PhaserGameState = Record<string, unknown>;

export type PhaserGameFactory = (
  parent: HTMLElement,
  onState: (state: PhaserGameState) => void,
  onReady: () => void,
  onError?: (error: unknown) => void,
) => Promise<PhaserGameHandle>;
