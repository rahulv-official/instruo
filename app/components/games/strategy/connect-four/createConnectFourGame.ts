import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

type Player = "red" | "yellow";
export type ConnectFourStatus = "ready" | "playing" | "over";

export interface ConnectFourGameState extends PhaserGameState {
  status: ConnectFourStatus;
  currentPlayer: Player;
  winner: Player | null;
  moves: number;
  winningLine: number[];
}

const COLUMNS = 7;
const ROWS = 6;
const CELL_SIZE = 48 * WORLD_SCALE;
const BOARD_WIDTH = COLUMNS * CELL_SIZE;
const BOARD_HEIGHT = ROWS * CELL_SIZE;
const BOARD_X = (WIDTH - BOARD_WIDTH) / 2;
const BOARD_Y = 218 * WORLD_SCALE;
const PLAYER_COLORS = { red: 0xe56f68, yellow: 0xf4bd68 } as const;
const GAME_FONT = "Geist, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

function getWinningLine(state: (Player | null)[]) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const player = state[row * COLUMNS + column];
      if (!player) continue;
      for (const [rowStep, columnStep] of directions) {
        const line = Array.from({ length: 4 }, (_, offset) => {
          const nextRow = row + rowStep * offset;
          const nextColumn = column + columnStep * offset;
          if (nextRow < 0 || nextRow >= ROWS || nextColumn < 0 || nextColumn >= COLUMNS) return -1;
          return nextRow * COLUMNS + nextColumn;
        });
        if (line.every((index) => index >= 0 && state[index] === player)) return line;
      }
    }
  }
  return null;
}

export const createConnectFourGame: PhaserGameFactory = async (
  parent,
  onState,
  onReady,
  onError,
) => {
  const Phaser = (await import("phaser")).default;

  class ConnectFourScene extends Phaser.Scene {
    private board: (Player | null)[] = [];
    private status: ConnectFourStatus = "ready";
    private currentPlayer: Player = "red";
    private winner: Player | null = null;
    private winningLine: number[] = [];
    private selectedColumn = 3;
    private dropping = false;
    private pointerStartX = 0;
    private discViews = new Map<number, GameObjects.Arc>();
    private boardArt!: GameObjects.Container;
    private indicator!: GameObjects.Triangle;
    private statusText!: GameObjects.Text;
    private movesText!: GameObjects.Text;
    private winGraphic?: GameObjects.Graphics;
    private celebrationTimer?: { remove: () => void };

    constructor() {
      super("connect-four");
    }

    preload() {
      this.load.audio("drop", "/game-assets/kenney/interface-sounds/Audio/drop_004.ogg");
      this.load.audio("move", "/game-assets/kenney/interface-sounds/Audio/select_004.ogg");
      this.load.audio("win", "/game-assets/kenney/interface-sounds/Audio/confirmation_001.ogg");
      this.load.audio("over", "/game-assets/kenney/interface-sounds/Audio/error_008.ogg");
    }

    create() {
      try {
        this.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor("#162336");
        this.createArt();
        this.resetBoard();
        this.input.on("pointerdown", this.handlePointerDown, this);
        this.input.on("pointerup", this.handlePointerUp, this);
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.addCapture("LEFT,RIGHT,ENTER,SPACE,A,D");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "connect-four" });
        onReady();
      } catch (error) {
        this.status = "over";
        onError?.(error);
      }
    }

    startFromOverlay() {
      if (this.status !== "ready") return;
      this.status = "playing";
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "connect-four", action: "start" });
      this.emitState();
    }

    restartFromOverlay() {
      this.resetBoard();
      this.startFromOverlay();
    }

    private createArt() {
      this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x162336);
      this.add.text(26 * WORLD_SCALE, 28 * WORLD_SCALE, "CONNECT FOUR", {
        color: "#f9f4e6",
        fontFamily: GAME_FONT,
        fontSize: `${19 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.add
        .text(WIDTH - 26 * WORLD_SCALE, 34 * WORLD_SCALE, "DROP ZONE", {
          color: "#a8b5c8",
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);

      this.add
        .rectangle(
          WIDTH / 2,
          BOARD_Y + BOARD_HEIGHT / 2,
          BOARD_WIDTH + 20 * WORLD_SCALE,
          BOARD_HEIGHT + 20 * WORLD_SCALE,
          0x264766,
        )
        .setStrokeStyle(3 * WORLD_SCALE, 0x65b7d6, 0.7);
      this.boardArt = this.add.container(0, 0).setDepth(5);
      for (let row = 0; row < ROWS; row += 1) {
        for (let column = 0; column < COLUMNS; column += 1) {
          const hole = this.add
            .circle(this.pointX(column), this.pointY(row), CELL_SIZE * 0.36, 0x132236)
            .setStrokeStyle(2 * WORLD_SCALE, 0x89a9c6, 0.42);
          this.boardArt.add(hole);
        }
      }
      this.indicator = this.add
        .triangle(
          this.pointX(this.selectedColumn),
          BOARD_Y - 20 * WORLD_SCALE,
          0,
          22 * WORLD_SCALE,
          18 * WORLD_SCALE,
          0,
          36 * WORLD_SCALE,
          22 * WORLD_SCALE,
          PLAYER_COLORS.red,
        )
        .setOrigin(0.5)
        .setAngle(180)
        .setDepth(20);
      this.statusText = this.add
        .text(WIDTH / 2, 112 * WORLD_SCALE, "RED TO DROP", {
          color: "#f9f4e6",
          fontFamily: GAME_FONT,
          fontSize: `${12 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.movesText = this.add
        .text(WIDTH / 2, 145 * WORLD_SCALE, "0 / 42 MOVES", {
          color: "#a8b5c8",
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5);
      this.add
        .text(WIDTH / 2, HEIGHT - 76 * WORLD_SCALE, "TAP A COLUMN  ·  ARROWS + ENTER", {
          color: "#a8b5c8",
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5);
    }

    private resetBoard() {
      this.status = "ready";
      this.currentPlayer = "red";
      this.winner = null;
      this.winningLine = [];
      this.selectedColumn = 3;
      this.dropping = false;
      this.board = Array.from<Player | null>({ length: ROWS * COLUMNS }).fill(null);
      this.discViews.forEach((disc) => disc.destroy());
      this.discViews.clear();
      this.celebrationTimer?.remove();
      this.celebrationTimer = undefined;
      if (this.winGraphic) this.tweens.killTweensOf(this.winGraphic);
      this.winGraphic?.destroy();
      this.winGraphic = undefined;
      this.indicator?.setX(this.pointX(this.selectedColumn));
      this.indicator?.setFillStyle(PLAYER_COLORS[this.currentPlayer]);
      this.statusText?.setText("RED TO DROP").setColor("#f9f4e6");
      this.emitState();
    }

    private pointX(column: number) {
      return BOARD_X + column * CELL_SIZE + CELL_SIZE / 2;
    }

    private pointY(row: number) {
      return BOARD_Y + row * CELL_SIZE + CELL_SIZE / 2;
    }

    private columnAt(x: number) {
      return Math.max(0, Math.min(COLUMNS - 1, Math.floor((x - BOARD_X) / CELL_SIZE)));
    }

    private drop(column: number) {
      if (this.status !== "playing" || this.dropping || this.winner) return;
      let row = -1;
      for (let nextRow = ROWS - 1; nextRow >= 0; nextRow -= 1) {
        if (this.board[nextRow * COLUMNS + column] === null) {
          row = nextRow;
          break;
        }
      }
      if (row < 0) {
        this.playSound("over", 0.04);
        return;
      }
      this.dropping = true;
      const player = this.currentPlayer;
      const index = row * COLUMNS + column;
      this.board[index] = player;
      const disc = this.add
        .circle(
          this.pointX(column),
          BOARD_Y - CELL_SIZE * 0.8,
          CELL_SIZE * 0.36,
          PLAYER_COLORS[player],
        )
        .setStrokeStyle(3 * WORLD_SCALE, player === "red" ? 0x9c3f49 : 0xbd842f, 1)
        .setDepth(12);
      this.discViews.set(index, disc);
      this.playSound("drop", 0.14);
      phaserEventBus.emit(PHASER_EVENTS.action, {
        game: "connect-four",
        action: "drop",
        column,
        player,
      });
      this.tweens.add({
        targets: disc,
        y: this.pointY(row),
        duration: 430,
        ease: "Bounce.easeOut",
        onComplete: () => this.finishDrop(player),
      });
      this.emitState();
    }

    private finishDrop(player: Player) {
      this.dropping = false;
      const line = getWinningLine(this.board);
      if (line) {
        this.winner = player;
        this.winningLine = line;
        // Keep the board interactive layer visible while the win animation
        // plays. The result overlay arrives after the celebration completes.
        this.dropping = true;
        this.indicator.setFillStyle(PLAYER_COLORS[player]);
        this.statusText
          .setText(`${player.toUpperCase()} WINS`)
          .setColor(player === "red" ? "#e56f68" : "#f4bd68");
        this.playSound("win", 0.18);
        this.celebrate(line);
        phaserEventBus.emit(PHASER_EVENTS.hit, {
          game: "connect-four",
          player,
          line: line.join(","),
        });
        phaserEventBus.emit(PHASER_EVENTS.streak, { game: "connect-four", streak: 4 });
        this.celebrationTimer = this.time.delayedCall(1_650, () => {
          this.dropping = false;
          this.status = "over";
          this.emitState();
        });
        this.emitState();
        return;
      }
      if (this.board.every(Boolean)) {
        this.status = "over";
        this.statusText.setText("BOARD FULL · DRAW").setColor("#f4bd68");
        this.playSound("over", 0.12);
        this.emitState();
        return;
      }
      this.currentPlayer = player === "red" ? "yellow" : "red";
      this.indicator.setFillStyle(PLAYER_COLORS[this.currentPlayer]);
      this.statusText.setText(`${this.currentPlayer.toUpperCase()} TO DROP`).setColor("#f9f4e6");
      this.emitState();
    }

    private celebrate(line: number[]) {
      const views = line
        .map((index) => this.discViews.get(index))
        .filter((disc): disc is GameObjects.Arc => Boolean(disc));
      this.tweens.add({
        targets: views,
        scale: 1.18,
        alpha: 0.62,
        duration: 180,
        yoyo: true,
        repeat: 3,
        ease: "Sine.inOut",
      });
      const first = line[0]!;
      const last = line.at(-1)!;
      const firstRow = Math.floor(first / COLUMNS);
      const firstColumn = first % COLUMNS;
      const lastRow = Math.floor(last / COLUMNS);
      const lastColumn = last % COLUMNS;
      const lineGraphic = this.add.graphics().setDepth(14);
      this.winGraphic = lineGraphic;
      lineGraphic.lineStyle(8 * WORLD_SCALE, 0xf9f4e6, 0.95);
      lineGraphic.lineBetween(
        this.pointX(firstColumn),
        this.pointY(firstRow),
        this.pointX(lastColumn),
        this.pointY(lastRow),
      );
      lineGraphic.setScale(0.2);
      this.tweens.add({ targets: lineGraphic, scale: 1, duration: 300, ease: "Back.out" });
    }

    private handleKeydown(event: KeyboardEvent) {
      if (["ArrowLeft", "ArrowRight", "Enter", "Space", "KeyA", "KeyD"].includes(event.code))
        event.preventDefault();
      if (event.code === "ArrowLeft" || event.code === "KeyA")
        this.selectColumn(this.selectedColumn - 1);
      else if (event.code === "ArrowRight" || event.code === "KeyD")
        this.selectColumn(this.selectedColumn + 1);
      else if (event.code === "Enter" || event.code === "Space") this.drop(this.selectedColumn);
    }

    private selectColumn(column: number) {
      this.selectedColumn = Math.max(0, Math.min(COLUMNS - 1, column));
      this.indicator?.setX(this.pointX(this.selectedColumn));
      this.indicator?.setFillStyle(PLAYER_COLORS[this.currentPlayer]);
      this.playSound("move", 0.04);
      phaserEventBus.emit(PHASER_EVENTS.action, {
        game: "connect-four",
        action: "select-column",
        column: this.selectedColumn,
      });
    }

    private handlePointerDown(pointer: { x: number }) {
      this.pointerStartX = pointer.x;
    }

    private handlePointerUp(pointer: { x: number }) {
      if (this.status !== "playing") return;
      const delta = pointer.x - this.pointerStartX;
      if (Math.abs(delta) > 24 * WORLD_SCALE) {
        this.selectColumn(this.selectedColumn + (delta < 0 ? -1 : 1));
        return;
      }
      this.selectColumn(this.columnAt(pointer.x));
      this.drop(this.columnAt(pointer.x));
    }

    private emitState() {
      this.movesText?.setText(`${this.board.filter(Boolean).length} / 42 MOVES`);
      onState({
        status: this.status,
        currentPlayer: this.currentPlayer,
        winner: this.winner,
        moves: this.board.filter(Boolean).length,
        winningLine: this.winningLine,
      } satisfies ConnectFourGameState);
    }

    private playSound(key: string, volume: number) {
      if (this.sound.locked || !this.cache.audio.exists(key)) return;
      try {
        this.sound.play(key, { volume });
      } catch {
        // Audio remains optional.
      }
    }

    private removeInput() {
      this.input.off("pointerdown", this.handlePointerDown, this);
      this.input.off("pointerup", this.handlePointerUp, this);
      this.input.keyboard?.off("keydown", this.handleKeydown, this);
      this.input.keyboard?.removeCapture("LEFT,RIGHT,ENTER,SPACE,A,D");
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#162336;",
    backgroundColor: "#162336",
    scene: ConnectFourScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
  });

  return Object.assign(game, {
    startGame: () => (game.scene.getScene("connect-four") as ConnectFourScene).startFromOverlay(),
    restartGame: () =>
      (game.scene.getScene("connect-four") as ConnectFourScene).restartFromOverlay(),
  }) as PhaserGameHandle;
};
