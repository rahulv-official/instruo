import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export type FifteenPuzzleStatus = "ready" | "playing" | "won";

export interface FifteenPuzzleGameState extends PhaserGameState {
  status: FifteenPuzzleStatus;
  moves: number;
  elapsedSeconds: number;
  bestMoves: number;
}

interface TileView {
  value: number;
  body: GameObjects.Image;
  label: GameObjects.Text;
}

const SIZE = 4;
const TILE_COUNT = SIZE * SIZE;
const TILE_SIZE = 76 * WORLD_SCALE;
const TILE_GAP = 7 * WORLD_SCALE;
const BOARD_SIZE = SIZE * TILE_SIZE + (SIZE - 1) * TILE_GAP;
const BOARD_X = (WIDTH - BOARD_SIZE) / 2;
const BOARD_Y = 164 * WORLD_SCALE;
const SHUFFLE_MOVES = 120;
const TILE_TEXTURE = "tile-grey";
const BEST_KEY = "instruo:fifteen-puzzle-best";
const GAME_FONT = "Geist, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

const COLORS = {
  background: 0x151a21,
  panel: 0x27313b,
  panelDark: 0x10161d,
  ink: "#f5f7fa",
  muted: "#9ba7b4",
  accent: 0xf4bd68,
  accentText: "#f4bd68",
  number: "#19232d",
};

const SOLVED_BOARD = Array.from({ length: TILE_COUNT }, (_, index) => (index + 1) % TILE_COUNT);

function readBestMoves() {
  try {
    return Number.parseInt(localStorage.getItem(BEST_KEY) ?? "", 10) || 0;
  } catch {
    return 0;
  }
}

function writeBestMoves(value: number) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // A best score is optional when storage is blocked.
  }
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  return `${String(minutes).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export const createFifteenPuzzleGame: PhaserGameFactory = async (
  parent,
  onState,
  onReady,
  onError,
) => {
  const Phaser = (await import("phaser")).default;

  class FifteenPuzzleScene extends Phaser.Scene {
    private board = [...SOLVED_BOARD];
    private emptyIndex = TILE_COUNT - 1;
    private views = new Map<number, TileView>();
    private status: FifteenPuzzleStatus = "ready";
    private moves = 0;
    private elapsedSeconds = 0;
    private startedAt = 0;
    private lastElapsed = -1;
    private bestMoves = readBestMoves();
    private locked = false;
    private boardWasShuffled = false;
    private muted = false;
    private finishTimer?: { remove: () => void };
    private statusText!: GameObjects.Text;
    private movesText!: GameObjects.Text;
    private timeText!: GameObjects.Text;
    private bestText!: GameObjects.Text;
    private emptySlot!: GameObjects.Image;

    constructor() {
      super("fifteen-puzzle");
    }

    preload() {
      const root = "/game-assets/kenney/ui/PNG/Grey/Double";
      this.load.image("tile-grey", `${root}/button_square_depth_flat.png`);
      this.load.image("empty-slot", `${root}/button_square_depth_line.png`);
      this.load.audio("slide", "/game-assets/kenney/casino-audio/Audio/card-slide-3.ogg");
      this.load.audio("move", "/game-assets/kenney/ui/Sounds/click-a.ogg");
      this.load.audio("win", "/game-assets/kenney/interface-sounds/Audio/confirmation_003.ogg");
    }

    create() {
      try {
        this.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor("#151a21");
        this.createArt();
        this.resetBoard(false);
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.addCapture("LEFT,RIGHT,UP,DOWN,W,A,S,D,ENTER,SPACE");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "fifteen-puzzle" });
        onReady();
      } catch (error) {
        onError?.(error);
      }
    }

    override update() {
      if (this.status !== "playing") return;
      const elapsed = Math.floor((this.time.now - this.startedAt) / 1_000);
      if (elapsed === this.lastElapsed) return;
      this.elapsedSeconds = elapsed;
      this.lastElapsed = elapsed;
      this.emitState();
    }

    startFromOverlay() {
      if (this.status !== "ready") return;
      if (!this.boardWasShuffled) {
        this.shuffleBoard();
        this.boardWasShuffled = true;
        this.syncViews(false);
      }
      this.status = "playing";
      this.startedAt = this.time.now;
      this.lastElapsed = -1;
      this.statusText.setText("SLIDE INTO ORDER").setColor(COLORS.ink);
      this.playSound("move", 0.08);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "fifteen-puzzle", action: "start" });
      this.emitState();
    }

    restartFromOverlay() {
      this.resetBoard(true);
      this.startFromOverlay();
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    private createArt() {
      this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.background);

      this.add.text(24 * WORLD_SCALE, 22 * WORLD_SCALE, "FIFTEEN", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${20 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.add
        .text(WIDTH - 24 * WORLD_SCALE, 30 * WORLD_SCALE, "SLIDING ATELIER", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
      this.statusText = this.add
        .text(WIDTH / 2, 112 * WORLD_SCALE, "READY TO SLIDE", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${11 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      this.add
        .rectangle(
          WIDTH / 2,
          BOARD_Y + BOARD_SIZE / 2,
          BOARD_SIZE + 12 * WORLD_SCALE,
          BOARD_SIZE + 12 * WORLD_SCALE,
          COLORS.panelDark,
          1,
        )
        .setStrokeStyle(2 * WORLD_SCALE, 0x9ba7b4, 0.35)
        .setDepth(1);
      this.emptySlot = this.add
        .image(0, 0, "empty-slot")
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .setDepth(2);

      this.movesText = this.add.text(24 * WORLD_SCALE, HEIGHT - 76 * WORLD_SCALE, "0", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${19 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.timeText = this.add
        .text(WIDTH / 2, HEIGHT - 72 * WORLD_SCALE, "00:00", {
          color: COLORS.accentText,
          fontFamily: GAME_FONT,
          fontSize: `${12 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5, 0);
      this.bestText = this.add
        .text(WIDTH - 24 * WORLD_SCALE, HEIGHT - 72 * WORLD_SCALE, "—", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${12 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
      this.add.text(24 * WORLD_SCALE, HEIGHT - 42 * WORLD_SCALE, "MOVES", {
        color: COLORS.muted,
        fontFamily: GAME_FONT,
        fontSize: `${8 * WORLD_SCALE}px`,
      });
      this.add
        .text(WIDTH / 2, HEIGHT - 42 * WORLD_SCALE, "TAP / ARROWS / WASD", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5, 0);
      this.add
        .text(WIDTH - 24 * WORLD_SCALE, HEIGHT - 42 * WORLD_SCALE, "BEST MOVES", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);

      for (let index = 0; index < TILE_COUNT - 1; index += 1) {
        const value = index + 1;
        const { x, y } = this.slotPosition(index);
        const body = this.add
          .image(x, y, TILE_TEXTURE)
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .setDepth(4)
          .setInteractive({ useHandCursor: true });
        const label = this.add
          .text(x, y, String(value), {
            color: COLORS.number,
            fontFamily: GAME_FONT,
            fontSize: `${27 * WORLD_SCALE}px`,
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(5);
        body.on("pointerdown", () => this.moveTile(value));
        this.views.set(value, { value, body, label });
      }
      this.emitState();
    }

    private slotPosition(index: number) {
      const column = index % SIZE;
      const row = Math.floor(index / SIZE);
      return {
        x: BOARD_X + TILE_SIZE / 2 + column * (TILE_SIZE + TILE_GAP),
        y: BOARD_Y + TILE_SIZE / 2 + row * (TILE_SIZE + TILE_GAP),
      };
    }

    private resetBoard(shuffle: boolean) {
      this.finishTimer?.remove();
      this.finishTimer = undefined;
      this.board = [...SOLVED_BOARD];
      this.emptyIndex = TILE_COUNT - 1;
      this.boardWasShuffled = shuffle;
      if (shuffle) this.shuffleBoard();
      this.status = "ready";
      this.locked = false;
      this.moves = 0;
      this.elapsedSeconds = 0;
      this.startedAt = 0;
      this.lastElapsed = -1;
      this.statusText?.setText("READY TO SLIDE").setColor(COLORS.ink);
      this.syncViews(false);
      this.emitState();
    }

    private shuffleBoard() {
      let previous = -1;
      for (let count = 0; count < SHUFFLE_MOVES; count += 1) {
        const options = this.neighborIndexes(this.emptyIndex).filter((index) => index !== previous);
        const next = options[Math.floor(Math.random() * options.length)] ?? options[0]!;
        [this.board[this.emptyIndex], this.board[next]] = [
          this.board[next]!,
          this.board[this.emptyIndex]!,
        ];
        previous = this.emptyIndex;
        this.emptyIndex = next;
      }
      if (this.board.every((value, index) => value === SOLVED_BOARD[index])) this.shuffleBoard();
    }

    private neighborIndexes(index: number) {
      const row = Math.floor(index / SIZE);
      const column = index % SIZE;
      return [
        row > 0 ? index - SIZE : -1,
        row < SIZE - 1 ? index + SIZE : -1,
        column > 0 ? index - 1 : -1,
        column < SIZE - 1 ? index + 1 : -1,
      ].filter((candidate) => candidate >= 0);
    }

    private syncViews(animate: boolean) {
      const empty = this.slotPosition(this.emptyIndex);
      this.emptySlot.setPosition(empty.x, empty.y);
      this.views.forEach((view) => {
        const index = this.board.indexOf(view.value);
        const position = this.slotPosition(index);
        if (animate) {
          this.tweens.add({
            targets: [view.body, view.label],
            x: position.x,
            y: position.y,
            duration: 145,
            ease: "Cubic.out",
          });
        } else {
          view.body.setPosition(position.x, position.y);
          view.label.setPosition(position.x, position.y);
        }
      });
    }

    private moveTile(value: number) {
      if (this.status !== "playing" || this.locked) return;
      const tileIndex = this.board.indexOf(value);
      if (!this.neighborIndexes(this.emptyIndex).includes(tileIndex)) return;
      const from = this.emptyIndex;
      [this.board[from], this.board[tileIndex]] = [this.board[tileIndex]!, this.board[from]!];
      this.emptyIndex = tileIndex;
      this.moves += 1;
      this.playSound("slide", 0.11);
      this.syncViews(true);
      phaserEventBus.emit(PHASER_EVENTS.action, {
        game: "fifteen-puzzle",
        action: "slide",
        moves: this.moves,
      });
      this.emitState();
      if (this.board.every((tile, index) => tile === SOLVED_BOARD[index])) this.complete();
    }

    private handleKeydown(event: KeyboardEvent) {
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "KeyA",
          "KeyD",
          "KeyW",
          "KeyS",
          "Enter",
          "Space",
        ].includes(event.code)
      )
        return;
      event.preventDefault();
      if (event.code === "Enter" || event.code === "Space") {
        if (this.status === "ready") this.startFromOverlay();
        else if (this.status === "won") this.restartFromOverlay();
        return;
      }
      if (this.status !== "playing" || this.locked) return;
      const row = Math.floor(this.emptyIndex / SIZE);
      const column = this.emptyIndex % SIZE;
      const target =
        event.code === "ArrowUp" || event.code === "KeyW"
          ? row < SIZE - 1
            ? this.emptyIndex + SIZE
            : -1
          : event.code === "ArrowDown" || event.code === "KeyS"
            ? row > 0
              ? this.emptyIndex - SIZE
              : -1
            : event.code === "ArrowLeft" || event.code === "KeyA"
              ? column < SIZE - 1
                ? this.emptyIndex + 1
                : -1
              : column > 0
                ? this.emptyIndex - 1
                : -1;
      if (target >= 0) this.moveTile(this.board[target]!);
    }

    private complete() {
      this.locked = true;
      this.statusText.setText("ORDER RESTORED").setColor("#65d4a0");
      this.playSound("win", 0.22);
      phaserEventBus.emit(PHASER_EVENTS.streak, { game: "fifteen-puzzle", moves: this.moves });
      this.views.forEach((view, index) => {
        this.tweens.add({
          targets: [view.body, view.label],
          scale: 1.1,
          angle: index % 2 ? 2 : -2,
          duration: 180,
          delay: index * 32,
          yoyo: true,
          ease: "Back.out",
        });
      });
      this.finishTimer = this.time.delayedCall(1_000, () => {
        this.status = "won";
        this.locked = false;
        if (!this.bestMoves || this.moves < this.bestMoves) {
          this.bestMoves = this.moves;
          writeBestMoves(this.bestMoves);
        }
        this.emitState();
      });
    }

    private emitState() {
      this.movesText?.setText(String(this.moves));
      this.timeText?.setText(formatSeconds(this.elapsedSeconds));
      this.bestText?.setText(this.bestMoves ? String(this.bestMoves) : "—");
      onState({
        status: this.status,
        moves: this.moves,
        elapsedSeconds: this.elapsedSeconds,
        bestMoves: this.bestMoves,
      } satisfies FifteenPuzzleGameState);
    }

    private playSound(key: string, volume: number) {
      if (this.muted || this.sound.locked || !this.cache.audio.exists(key)) return;
      try {
        this.sound.play(key, { volume });
      } catch {
        // Audio is optional.
      }
    }

    private removeInput() {
      this.input.keyboard?.off("keydown", this.handleKeydown, this);
      this.input.keyboard?.removeCapture("LEFT,RIGHT,UP,DOWN,W,A,S,D,ENTER,SPACE");
      this.finishTimer?.remove();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#151a21;",
    backgroundColor: "#151a21",
    scene: FifteenPuzzleScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
  });

  return Object.assign(game, {
    startGame: () =>
      (game.scene.getScene("fifteen-puzzle") as FifteenPuzzleScene).startFromOverlay(),
    restartGame: () =>
      (game.scene.getScene("fifteen-puzzle") as FifteenPuzzleScene).restartFromOverlay(),
    toggleMute: () => (game.scene.getScene("fifteen-puzzle") as FifteenPuzzleScene).toggleMute(),
  }) as PhaserGameHandle;
};
