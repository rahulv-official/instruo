import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export type TetrisStatus = "ready" | "playing" | "over";

export interface TetrisGameState extends PhaserGameState {
  status: TetrisStatus;
  score: number;
  lines: number;
  level: number;
  best: number;
}

type Cell = [number, number];

interface Piece {
  kind: number;
  rotation: number;
  x: number;
  y: number;
}

const COLUMNS = 12;
const ROWS = 24;
// A denser well keeps the board readable on mobile and gives pieces room to
// breathe instead of letting the footer collide with the last row.
const CELL_SIZE = 19 * WORLD_SCALE;
const BOARD_WIDTH = COLUMNS * CELL_SIZE;
const BOARD_HEIGHT = ROWS * CELL_SIZE;
const BOARD_X = (WIDTH - BOARD_WIDTH) / 2;
const BOARD_Y = 74 * WORLD_SCALE;
const DROP_START = 680;
const DROP_MIN = 120;
const SWIPE_THRESHOLD = 24 * WORLD_SCALE;
const BEST_KEY = "instruo:tetris-best";
const GAME_FONT = "Manrope, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

/* eslint-disable unicorn/number-literal-case */
const COLORS = {
  background: 0x151d2b,
  board: 0x202c3f,
  grid: 0x2c3b52,
  ink: "#f9f4e6",
  muted: "#a8b5c8",
  accent: 0xf4bd68,
  line: 0x65d4a0,
  ghost: 0x8da4bd,
};

const PIECE_COLORS = [0x65d4e8, 0xf4bd68, 0xb88be8, 0x65d4a0, 0xe87373, 0x6f9ee8, 0xf3a86d];
/* eslint-enable unicorn/number-literal-case */

const SHAPES: Cell[][] = [
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
];

function readBest() {
  try {
    return Number.parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function writeBest(value: number) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Best score is optional.
  }
}

function rotatedCells(kind: number, rotation: number) {
  let cells = SHAPES[kind] ?? SHAPES[0]!;
  for (let turn = 0; turn < rotation; turn += 1) {
    cells = cells.map(([x, y]) => [y, -x] as Cell);
  }
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells
    .map(([x, y]) => [x - minX, y - minY] as Cell)
    .sort(([aX, aY], [bX, bY]) => aY - bY || aX - bX);
}

export const createTetrisGame: PhaserGameFactory = async (parent, onState, onReady, onError) => {
  const Phaser = (await import("phaser")).default;

  class TetrisScene extends Phaser.Scene {
    private board: (number | null)[][] = [];
    private piece: Piece | null = null;
    private status: TetrisStatus = "ready";
    private score = 0;
    private lines = 0;
    private level = 1;
    private best = readBest();
    private dropTimer = 0;
    private resolving = false;
    private pointerStartX = 0;
    private pointerStartY = 0;
    private boardVisual!: GameObjects.Container;
    private activeVisual!: GameObjects.Container;
    private activeBlocks: GameObjects.Rectangle[] = [];
    private scoreText!: GameObjects.Text;
    private linesText!: GameObjects.Text;
    private levelText!: GameObjects.Text;

    constructor() {
      super("tetris");
    }

    preload() {
      this.load.audio("move", "/game-assets/kenney/interface-sounds/Audio/select_004.ogg");
      this.load.audio("drop", "/game-assets/kenney/interface-sounds/Audio/drop_004.ogg");
      this.load.audio("line", "/game-assets/kenney/interface-sounds/Audio/confirmation_001.ogg");
      this.load.audio("over", "/game-assets/kenney/interface-sounds/Audio/error_008.ogg");
    }

    create() {
      try {
        this.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor("#151d2b");
        this.createArt();
        this.resetBoard();
        this.input.on("pointerdown", this.handlePointerDown, this);
        this.input.on("pointerup", this.handlePointerUp, this);
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.addCapture("LEFT,RIGHT,UP,DOWN,SPACE,A,D,W,S");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "tetris" });
        onReady();
      } catch (error) {
        this.status = "over";
        onError?.(error);
      }
    }

    override update(_time: number, delta: number) {
      if (this.status !== "playing" || this.resolving || !this.piece) return;
      this.dropTimer += delta;
      if (this.dropTimer >= this.gravityDelay()) {
        this.dropTimer = 0;
        this.dropOne();
      }
    }

    startFromOverlay() {
      if (this.status !== "ready") return;
      this.status = "playing";
      this.spawnPiece();
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "tetris", action: "start" });
      this.emitState();
    }

    restartFromOverlay() {
      this.resetBoard();
      this.startFromOverlay();
    }

    private createArt() {
      this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.background);
      this.add.text(26 * WORLD_SCALE, 28 * WORLD_SCALE, "TETRIS", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${26 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.add
        .text(WIDTH - 26 * WORLD_SCALE, 34 * WORLD_SCALE, "STACK LAB", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);

      this.add
        .rectangle(
          BOARD_X + BOARD_WIDTH / 2,
          BOARD_Y + BOARD_HEIGHT / 2,
          BOARD_WIDTH + 16 * WORLD_SCALE,
          BOARD_HEIGHT + 16 * WORLD_SCALE,
          COLORS.board,
        )
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.accent, 0.48);
      this.add.rectangle(
        BOARD_X + BOARD_WIDTH / 2,
        BOARD_Y + BOARD_HEIGHT / 2,
        BOARD_WIDTH,
        BOARD_HEIGHT,
        COLORS.background,
      );

      for (let row = 0; row < ROWS; row += 1) {
        for (let column = 0; column < COLUMNS; column += 1) {
          this.add.rectangle(
            BOARD_X + column * CELL_SIZE + CELL_SIZE / 2,
            BOARD_Y + row * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE - 3 * WORLD_SCALE,
            CELL_SIZE - 3 * WORLD_SCALE,
            COLORS.grid,
            0.46,
          );
        }
      }

      this.boardVisual = this.add.container(0, 0).setDepth(5);
      this.activeVisual = this.add.container(0, 0).setDepth(10);
      this.scoreText = this.add.text(26 * WORLD_SCALE, HEIGHT - 70 * WORLD_SCALE, "0", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${18 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.linesText = this.add
        .text(WIDTH / 2, HEIGHT - 70 * WORLD_SCALE, "0 LINES", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${10 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5, 0);
      this.levelText = this.add
        .text(WIDTH - 26 * WORLD_SCALE, HEIGHT - 70 * WORLD_SCALE, "LEVEL 1", {
          color: "#f4bd68",
          fontFamily: GAME_FONT,
          fontSize: `${10 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
      this.add.text(26 * WORLD_SCALE, HEIGHT - 38 * WORLD_SCALE, "SCORE", {
        color: COLORS.muted,
        fontFamily: GAME_FONT,
        fontSize: `${8 * WORLD_SCALE}px`,
      });
      this.add
        .text(WIDTH / 2, HEIGHT - 38 * WORLD_SCALE, "TAP / SWIPE / ARROWS", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5, 0);
      this.add
        .text(WIDTH - 26 * WORLD_SCALE, HEIGHT - 38 * WORLD_SCALE, `BEST ${this.best}`, {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
    }

    private resetBoard() {
      this.status = "ready";
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.dropTimer = 0;
      this.resolving = false;
      this.piece = null;
      this.board = Array.from({ length: ROWS }, () => new Array<number | null>(COLUMNS).fill(null));
      this.boardVisual.removeAll(true);
      this.activeVisual.removeAll(true);
      this.activeBlocks = [];
      this.emitState();
    }

    private gravityDelay() {
      return Math.max(DROP_MIN, DROP_START - (this.level - 1) * 55);
    }

    private spawnPiece() {
      const kind = Math.floor(Math.random() * SHAPES.length);
      const next = { kind, rotation: 0, x: Math.floor((COLUMNS - 4) / 2), y: 0 } satisfies Piece;
      this.piece = next;
      if (!this.canPlace(next.x, next.y, next.rotation)) {
        this.endRound();
        return;
      }
      this.renderActive(false);
    }

    private canPlace(x: number, y: number, rotation: number) {
      return rotatedCells(this.piece?.kind ?? 0, rotation).every(([cellX, cellY]) => {
        const boardX = x + cellX;
        const boardY = y + cellY;
        if (boardX < 0 || boardX >= COLUMNS || boardY >= ROWS) return false;
        return boardY < 0 || this.board[boardY]?.[boardX] === null;
      });
    }

    private moveHorizontal(direction: -1 | 1) {
      if (this.status !== "playing" || this.resolving || !this.piece) return;
      if (!this.canPlace(this.piece.x + direction, this.piece.y, this.piece.rotation)) return;
      this.piece.x += direction;
      this.renderActive(true);
      this.playSound("move", 0.07);
      phaserEventBus.emit(PHASER_EVENTS.action, {
        game: "tetris",
        action: direction < 0 ? "left" : "right",
      });
    }

    private rotate() {
      if (this.status !== "playing" || this.resolving || !this.piece) return;
      const rotation = (this.piece.rotation + 1) % 4;
      const kicks = [0, -1, 1, -2, 2];
      const offset = kicks.find((kick) =>
        this.canPlace(this.piece!.x + kick, this.piece!.y, rotation),
      );
      if (offset === undefined) return;
      this.piece.x += offset;
      this.piece.rotation = rotation;
      this.renderActive(true);
      this.playSound("move", 0.08);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "tetris", action: "rotate" });
    }

    private dropOne() {
      if (!this.piece || this.status !== "playing" || this.resolving) return;
      if (this.canPlace(this.piece.x, this.piece.y + 1, this.piece.rotation)) {
        this.piece.y += 1;
        this.renderActive(true);
        return;
      }
      this.lockPiece();
    }

    private hardDrop() {
      if (!this.piece || this.status !== "playing" || this.resolving) return;
      let distance = 0;
      while (this.canPlace(this.piece.x, this.piece.y + 1, this.piece.rotation)) {
        this.piece.y += 1;
        distance += 1;
      }
      if (distance) this.score += distance * 2;
      this.renderActive(true);
      this.playSound("drop", 0.11);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "tetris", action: "hard-drop", distance });
      this.lockPiece();
    }

    private lockPiece() {
      if (!this.piece) return;
      for (const [cellX, cellY] of rotatedCells(this.piece.kind, this.piece.rotation)) {
        const boardX = this.piece.x + cellX;
        const boardY = this.piece.y + cellY;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLUMNS)
          this.board[boardY]![boardX] = this.piece.kind;
      }
      this.piece = null;
      this.activeVisual.removeAll(true);
      this.activeBlocks = [];
      this.renderSettled();
      const completed = this.board.flatMap((row, rowIndex) =>
        row.every((cell) => cell !== null) ? [rowIndex] : [],
      );
      if (!completed.length) {
        this.spawnPiece();
        this.emitState();
        return;
      }

      this.resolving = true;
      const flashes = completed.map((row) =>
        this.add
          .rectangle(
            WIDTH / 2,
            BOARD_Y + row * CELL_SIZE + CELL_SIZE / 2,
            BOARD_WIDTH - 2 * WORLD_SCALE,
            CELL_SIZE - 4 * WORLD_SCALE,
            COLORS.line,
            0.9,
          )
          .setDepth(20),
      );
      this.tweens.add({
        targets: flashes,
        alpha: 0,
        scaleX: 1.08,
        duration: 180,
        ease: "Cubic.out",
        onComplete: () => {
          flashes.forEach((flash) => flash.destroy());
          const remaining = this.board.filter((row, rowIndex) => !completed.includes(rowIndex));
          this.board = [
            ...Array.from({ length: completed.length }, () =>
              new Array<number | null>(COLUMNS).fill(null),
            ),
            ...remaining,
          ];
          this.lines += completed.length;
          this.level = Math.floor(this.lines / 10) + 1;
          const rewards = [0, 40, 100, 300, 1_200];
          this.score += (rewards[completed.length] ?? 1_200) * this.level;
          this.best = Math.max(this.best, this.score);
          writeBest(this.best);
          this.renderSettled();
          this.playSound("line", 0.15);
          phaserEventBus.emit(PHASER_EVENTS.hit, {
            game: "tetris",
            lines: completed.length,
            score: this.score,
          });
          if (completed.length >= 4)
            phaserEventBus.emit(PHASER_EVENTS.streak, { game: "tetris", streak: completed.length });
          this.resolving = false;
          this.spawnPiece();
          this.emitState();
        },
      });
    }

    private renderSettled() {
      this.boardVisual.removeAll(true);
      for (let row = 0; row < ROWS; row += 1) {
        for (let column = 0; column < COLUMNS; column += 1) {
          const kind = this.board[row]?.[column];
          if (kind === null || kind === undefined) continue;
          this.boardVisual.add(this.block(column, row, PIECE_COLORS[kind] ?? COLORS.accent));
        }
      }
    }

    private renderActive(animate: boolean) {
      if (!this.piece) return;
      const cells = rotatedCells(this.piece.kind, this.piece.rotation);
      while (this.activeBlocks.length < cells.length) {
        this.activeBlocks.push(this.block(0, 0, PIECE_COLORS[this.piece.kind] ?? COLORS.accent));
        this.activeVisual.add(this.activeBlocks.at(-1)!);
      }
      cells.forEach(([cellX, cellY], index) => {
        const target = this.activeBlocks[index]!;
        const x = BOARD_X + (this.piece!.x + cellX) * CELL_SIZE + CELL_SIZE / 2;
        const y = BOARD_Y + (this.piece!.y + cellY) * CELL_SIZE + CELL_SIZE / 2;
        target.setFillStyle(PIECE_COLORS[this.piece!.kind] ?? COLORS.accent, 1);
        if (animate) this.tweens.add({ targets: target, x, y, duration: 70, ease: "Cubic.out" });
        else target.setPosition(x, y);
      });
    }

    private block(column: number, row: number, color: number) {
      return this.add
        .rectangle(
          BOARD_X + column * CELL_SIZE + CELL_SIZE / 2,
          BOARD_Y + row * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE - 4 * WORLD_SCALE,
          CELL_SIZE - 4 * WORLD_SCALE,
          color,
        )
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.background, 0.22);
    }

    private handleKeydown(event: KeyboardEvent) {
      const code = event.code;
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Space",
          "KeyA",
          "KeyD",
          "KeyW",
          "KeyS",
        ].includes(code)
      )
        event.preventDefault();
      if (code === "ArrowLeft" || code === "KeyA") this.moveHorizontal(-1);
      else if (code === "ArrowRight" || code === "KeyD") this.moveHorizontal(1);
      else if (code === "ArrowUp" || code === "KeyW") this.rotate();
      else if (code === "ArrowDown" || code === "KeyS") this.dropOne();
      else if (code === "Space") this.hardDrop();
    }

    private handlePointerDown(pointer: { x: number; y: number }) {
      this.pointerStartX = pointer.x;
      this.pointerStartY = pointer.y;
    }

    private handlePointerUp(pointer: { x: number; y: number }) {
      if (this.status !== "playing") return;
      const deltaX = pointer.x - this.pointerStartX;
      const deltaY = pointer.y - this.pointerStartY;
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= SWIPE_THRESHOLD) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) this.moveHorizontal(deltaX < 0 ? -1 : 1);
        else if (deltaY > 0) this.dropOne();
        else this.rotate();
        return;
      }
      this.moveHorizontal(pointer.x < WIDTH / 2 ? -1 : 1);
    }

    private endRound() {
      this.status = "over";
      this.best = Math.max(this.best, this.score);
      writeBest(this.best);
      this.playSound("over", 0.16);
      this.cameras.main.shake(180, 0.006);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "tetris", action: "game-over" });
      this.emitState();
    }

    private emitState() {
      this.scoreText?.setText(String(this.score));
      this.linesText?.setText(`${this.lines} LINES`);
      this.levelText?.setText(`LEVEL ${this.level}`);
      onState({
        status: this.status,
        score: this.score,
        lines: this.lines,
        level: this.level,
        best: this.best,
      } satisfies TetrisGameState);
    }

    private playSound(key: string, volume: number) {
      if (this.sound.locked || !this.cache.audio.exists(key)) return;
      try {
        this.sound.play(key, { volume });
      } catch {
        // Audio stays optional.
      }
    }

    private removeInput() {
      this.input.off("pointerdown", this.handlePointerDown, this);
      this.input.off("pointerup", this.handlePointerUp, this);
      this.input.keyboard?.off("keydown", this.handleKeydown, this);
      this.input.keyboard?.removeCapture("LEFT,RIGHT,UP,DOWN,SPACE,A,D,W,S");
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#151d2b;",
    backgroundColor: "#151d2b",
    scene: TetrisScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
  });

  return Object.assign(game, {
    startGame: () => (game.scene.getScene("tetris") as TetrisScene).startFromOverlay(),
    restartGame: () => (game.scene.getScene("tetris") as TetrisScene).restartFromOverlay(),
  }) as PhaserGameHandle;
};
