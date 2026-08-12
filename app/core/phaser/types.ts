export interface PhaserGameHandle {
  destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
  startGame?: () => void;
  restartGame?: () => void;
}

export type PhaserGameState = Record<string, unknown>;

export type PhaserGameFactory = (
  parent: HTMLElement,
  onState: (state: PhaserGameState) => void,
  onReady: () => void,
  onError?: (error: unknown) => void,
) => Promise<PhaserGameHandle>;
