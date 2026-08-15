import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_SCALE as SCALE,
  PHASER_GAME_WIDTH as WIDTH,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export const SNAKE_COLUMNS = 15;
export const SNAKE_ROWS = 18;
export const SNAKE_CELL_COUNT = SNAKE_COLUMNS * SNAKE_ROWS;
export type SnakeStageId = "circuit" | "meadow" | "ruins";

export interface SnakeStage {
  accent: number;
  background: number;
  body: number;
  description: string;
  edge: number;
  food: number;
  grid: number;
  id: SnakeStageId;
  interval: number;
  label: string;
  obstacle: number;
  obstacles: readonly number[];
  panel: number;
  subtitle: string;
}

export const SNAKE_STAGES = [
  {
    id: "meadow",
    label: "Meadow",
    subtitle: "A calm first run",
    description: "Open board, generous pace, and room to learn the rhythm.",
    interval: 160,
    background: 0x102f36,
    panel: 0x173f45,
    grid: 0x2d6260,
    edge: 0x66d69d,
    accent: 0xf3c969,
    body: 0x5bc889,
    food: 0xf48b65,
    obstacle: 0x173f45,
    obstacles: [],
  },
  {
    id: "circuit",
    label: "Circuit",
    subtitle: "Two lanes. No wasted turns.",
    description: "Twin barriers create a racing line. Read the gaps before you commit.",
    interval: 120,
    background: 0x171c3b,
    panel: 0x222956,
    grid: 0x454b86,
    edge: 0x8e8cf2,
    accent: 0x69d6f5,
    body: 0x8f8df4,
    food: 0xff8e70,
    obstacle: 0x3a3f79,
    obstacles: [
      ...Array.from({ length: 11 }, (_, index) => 7 * SNAKE_COLUMNS + index + 2),
      ...Array.from({ length: 11 }, (_, index) => 10 * SNAKE_COLUMNS + index + 2),
    ],
  },
  {
    id: "ruins",
    label: "Ruins",
    subtitle: "Tight turns. Quick thinking.",
    description: "Broken walls turn the board into a maze. Fast pace, small margins.",
    interval: 88,
    background: 0x302039,
    panel: 0x4a2b45,
    grid: 0x704563,
    edge: 0xffad69,
    accent: 0xffd069,
    body: 0xff9867,
    food: 0x77e0b2,
    obstacle: 0x66394d,
    obstacles: [
      ...Array.from({ length: 4 }, (_, index) => 4 * SNAKE_COLUMNS + index + 3),
      ...Array.from({ length: 4 }, (_, index) => 4 * SNAKE_COLUMNS + index + 8),
      ...Array.from({ length: 4 }, (_, index) => 13 * SNAKE_COLUMNS + index + 3),
      ...Array.from({ length: 4 }, (_, index) => 13 * SNAKE_COLUMNS + index + 8),
      ...Array.from({ length: 5 }, (_, index) => (index + 7) * SNAKE_COLUMNS + 6),
      ...Array.from({ length: 5 }, (_, index) => (index + 7) * SNAKE_COLUMNS + 8),
    ],
  },
] as const satisfies readonly SnakeStage[];

export type SnakeStatus = "over" | "playing" | "ready" | "won";

export interface SnakeGameState extends PhaserGameState {
  best: number;
  detail?: string;
  paused: boolean;
  score: number;
  stage: SnakeStageId;
  status: SnakeStatus;
}

type Direction = "down" | "left" | "right" | "up";

const GAME_FONT = "Geist, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const BOARD_WIDTH = SNAKE_COLUMNS * 22 * SCALE;
const BOARD_HEIGHT = SNAKE_ROWS * 22 * SCALE;
const BOARD_X = (WIDTH - BOARD_WIDTH) / 2;
const BOARD_Y = 140 * SCALE;
const CELL_SIZE = BOARD_WIDTH / SNAKE_COLUMNS;
const SWIPE_THRESHOLD = 24 * SCALE;
const START_ROW = 9;
const START_COLUMN = 5;
const PARTICLE_ROOT = "/game-assets/kenney/particle-pack/PNG%20(Transparent)";

function openingForStage(id: SnakeStageId) {
  if (id === "circuit") {
    const head = 8 * SNAKE_COLUMNS + 5;
    return { body: [head, head - 1, head - 2], direction: "right" as Direction };
  }
  if (id === "ruins") {
    const head = 5 * SNAKE_COLUMNS + 2;
    return {
      body: [head, head - SNAKE_COLUMNS, head - SNAKE_COLUMNS * 2],
      direction: "down" as Direction,
    };
  }
  const head = START_ROW * SNAKE_COLUMNS + START_COLUMN;
  return { body: [head, head - 1, head - 2], direction: "right" as Direction };
}

const directionKeys: Record<string, Direction> = {
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  a: "left",
  d: "right",
  s: "down",
  w: "up",
};

const vectors: Record<Direction, [number, number]> = {
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
  up: [-1, 0],
};

const opposites: Record<Direction, Direction> = {
  down: "up",
  left: "right",
  right: "left",
  up: "down",
};

function getStage(value: unknown, fallback: SnakeStageId): SnakeStageId {
  return SNAKE_STAGES.some((stage) => stage.id === value) ? (value as SnakeStageId) : fallback;
}

function stageConfig(id: SnakeStageId): SnakeStage {
  return SNAKE_STAGES.find((stage) => stage.id === id)!;
}

export const createSnakeGame: PhaserGameFactory = async (parent, onState, onReady, onError) => {
  const Phaser = (await import("phaser")).default;

  class SnakeScene extends Phaser.Scene {
    private status: SnakeStatus = "ready";
    private paused = false;
    private score = 0;
    private detail = "";
    private stageId: SnakeStageId = "meadow";
    private stage = stageConfig(this.stageId);
    private bestByStage: Record<SnakeStageId, number> = { meadow: 0, circuit: 0, ruins: 0 };
    private snake: number[] = [];
    private direction: Direction = "right";
    private nextDirection: Direction = "right";
    private food = -1;
    private timer?: Phaser.Time.TimerEvent;
    private pointerStart = { x: 0, y: 0 };
    private backgroundLayer!: GameObjects.Graphics;
    private ambientLayer!: GameObjects.Graphics;
    private boardLayer!: GameObjects.Graphics;
    private snakeLayer!: GameObjects.Graphics;
    private hudLayer!: GameObjects.Graphics;
    private foodGlow!: GameObjects.Arc;
    private foodCore!: GameObjects.Image;
    private stageText!: GameObjects.Text;
    private scoreText!: GameObjects.Text;
    private bestText!: GameObjects.Text;
    private pauseText!: GameObjects.Text;

    constructor() {
      super("snake-game");
    }

    preload() {
      this.load.image(
        "snake-coin",
        "/game-assets/kenney/shape-characters/PNG/Default/tile_coin.png",
      );
      this.load.image("snake-spark", `${PARTICLE_ROOT}/spark_01.png`);
      this.load.image("snake-star", `${PARTICLE_ROOT}/star_01.png`);
      this.load.audio("eat", "/game-assets/kenney/interface-sounds/Audio/select_004.ogg");
      this.load.audio("crash", "/game-assets/kenney/impact-sounds/Audio/impactWood_heavy_001.ogg");
      this.load.audio("win", "/game-assets/kenney/interface-sounds/Audio/confirmation_002.ogg");
    }

    create() {
      try {
        this.cameras.main.setZoom(1).setScroll(0, 0);
        this.cameras.main.setBackgroundColor("#102f36");
        this.backgroundLayer = this.add.graphics().setDepth(0);
        this.ambientLayer = this.add.graphics().setDepth(1);
        this.boardLayer = this.add.graphics().setDepth(3);
        this.snakeLayer = this.add.graphics().setDepth(5);
        this.hudLayer = this.add.graphics().setDepth(8);
        this.createHud();
        this.foodGlow = this.add
          .circle(0, 0, 16 * SCALE, this.stage.food, 0.18)
          .setDepth(4)
          .setVisible(false);
        this.foodCore = this.add
          .image(0, 0, "snake-coin")
          .setDisplaySize(16 * SCALE, 16 * SCALE)
          .setDepth(6)
          .setVisible(false);
        this.ambientLayer.setAlpha(0.84);
        this.input.on("pointerdown", this.handlePointerDown, this);
        this.input.on("pointerup", this.handlePointerUp, this);
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.addCapture("SPACE,UP,DOWN,LEFT,RIGHT,W,A,S,D,M");
        this.events.once("shutdown", this.cleanup, this);
        this.resetRound(this.stageId, false);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "snake" });
        onReady();
      } catch (error) {
        onError?.(error);
      }
    }

    startFromOverlay(option?: unknown) {
      if (this.status === "playing") return;
      this.startRound(getStage(option, this.stageId));
    }

    restartFromOverlay(option?: unknown) {
      this.startRound(getStage(option, this.stageId));
    }

    toggleMute() {
      this.sound.mute = !this.sound.mute;
      return this.sound.mute;
    }

    private createHud() {
      this.add
        .text(34 * SCALE, 22 * SCALE, "SERPENT RUN", {
          color: "#f8f4e8",
          fontFamily: GAME_FONT,
          fontSize: `${22 * SCALE}px`,
          fontStyle: "bold",
          letterSpacing: 2 * SCALE,
        })
        .setDepth(10);
      this.add
        .text(34 * SCALE, 54 * SCALE, "A SMALL BOARD WITH BIG TEETH", {
          color: "#b6c9c2",
          fontFamily: GAME_FONT,
          fontSize: `${8 * SCALE}px`,
          letterSpacing: 1.2 * SCALE,
        })
        .setDepth(10);
      this.stageText = this.add
        .text(34 * SCALE, 91 * SCALE, "", {
          color: "#f8f4e8",
          fontFamily: GAME_FONT,
          fontSize: `${10 * SCALE}px`,
          fontStyle: "bold",
        })
        .setDepth(10);
      this.scoreText = this.add
        .text(WIDTH - 38 * SCALE, 24 * SCALE, "", {
          color: "#f8f4e8",
          fontFamily: GAME_FONT,
          fontSize: `${19 * SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(1, 0)
        .setDepth(10);
      this.bestText = this.add
        .text(WIDTH - 38 * SCALE, 58 * SCALE, "", {
          color: "#b6c9c2",
          fontFamily: GAME_FONT,
          fontSize: `${8 * SCALE}px`,
        })
        .setOrigin(1, 0)
        .setDepth(10);
      this.pauseText = this.add
        .text(WIDTH / 2, BOARD_Y + BOARD_HEIGHT / 2, "PAUSED", {
          color: "#f8f4e8",
          fontFamily: GAME_FONT,
          fontSize: `${22 * SCALE}px`,
          fontStyle: "bold",
          letterSpacing: 2 * SCALE,
        })
        .setOrigin(0.5)
        .setDepth(11)
        .setVisible(false);
      this.add
        .text(WIDTH / 2, HEIGHT - 35 * SCALE, "SWIPE  /  ARROWS  /  WASD     SPACE PAUSES", {
          color: "#b6c9c2",
          fontFamily: GAME_FONT,
          fontSize: `${8 * SCALE}px`,
          letterSpacing: 0.8 * SCALE,
        })
        .setOrigin(0.5)
        .setDepth(10);
    }

    private startRound(id: SnakeStageId) {
      this.resetRound(id, false);
      this.status = "playing";
      this.paused = false;
      this.timer = this.time.addEvent({
        delay: this.stage.interval,
        loop: true,
        callback: this.tick,
        callbackScope: this,
      });
      phaserEventBus.emit(PHASER_EVENTS.action, {
        game: "snake",
        action: "start",
        stage: this.stageId,
      });
      this.draw();
      this.emitState();
    }

    private resetRound(id: SnakeStageId, emit = true) {
      this.timer?.remove(false);
      this.timer = undefined;
      this.status = "ready";
      this.paused = false;
      this.score = 0;
      this.detail = "";
      this.stageId = id;
      this.stage = stageConfig(id);
      const opening = openingForStage(id);
      this.direction = opening.direction;
      this.nextDirection = opening.direction;
      this.snake = opening.body;
      this.placeFood();
      this.draw();
      if (emit) this.emitState();
    }

    private placeFood() {
      const blocked = new Set([...this.snake, ...this.stage.obstacles]);
      const open = Array.from({ length: SNAKE_CELL_COUNT }, (_, index) => index).filter(
        (index) => !blocked.has(index),
      );
      this.food = open.length ? open[Math.floor(Math.random() * open.length)]! : -1;
    }

    private tick() {
      if (this.status !== "playing" || this.paused) return;
      this.direction = this.nextDirection;
      const head = this.snake[0]!;
      const row = Math.floor(head / SNAKE_COLUMNS);
      const column = head % SNAKE_COLUMNS;
      const [rowChange, columnChange] = vectors[this.direction];
      const nextRow = row + rowChange;
      const nextColumn = column + columnChange;
      const next =
        nextRow < 0 || nextRow >= SNAKE_ROWS || nextColumn < 0 || nextColumn >= SNAKE_COLUMNS
          ? -1
          : nextRow * SNAKE_COLUMNS + nextColumn;
      const eating = next === this.food;
      const body = eating ? this.snake : this.snake.slice(0, -1);
      if (next < 0 || this.stage.obstacles.includes(next) || body.includes(next)) {
        this.finish("The run ended on a wall or your tail.", false);
        return;
      }

      this.snake = [next, ...this.snake];
      if (!eating) this.snake.pop();
      else {
        this.score += 1;
        this.placeFood();
        this.playSound("eat", 0.12);
        this.animateEat(next);
        phaserEventBus.emit(PHASER_EVENTS.hit, {
          game: "snake",
          score: this.score,
          stage: this.stageId,
        });
        if (this.snake.length === SNAKE_CELL_COUNT - this.stage.obstacles.length) {
          this.finish("Every open square belongs to you.", true);
          return;
        }
      }
      this.draw();
      this.emitState();
    }

    private finish(detail: string, won: boolean) {
      this.timer?.remove(false);
      this.timer = undefined;
      this.status = won ? "won" : "over";
      this.paused = false;
      this.detail = detail;
      this.bestByStage[this.stageId] = Math.max(this.bestByStage[this.stageId] ?? 0, this.score);
      this.playSound(won ? "win" : "crash", won ? 0.18 : 0.22);
      phaserEventBus.emit(won ? PHASER_EVENTS.streak : PHASER_EVENTS.action, {
        game: "snake",
        score: this.score,
        stage: this.stageId,
        result: won ? "win" : "crash",
      });
      this.animateCrash(won);
      this.draw();
      this.emitState();
    }

    private chooseDirection(value: Direction) {
      if (this.status !== "playing" || this.paused || opposites[this.direction] === value) return;
      this.nextDirection = value;
      phaserEventBus.emit(PHASER_EVENTS.action, {
        game: "snake",
        action: "turn",
        direction: value,
        stage: this.stageId,
      });
    }

    private togglePause() {
      if (this.status !== "playing") return;
      this.paused = !this.paused;
      this.pauseText.setVisible(this.paused);
      this.emitState();
    }

    private handleKeydown(event: KeyboardEvent) {
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        this.togglePause();
        return;
      }
      if (event.key.toLowerCase() === "m") {
        this.toggleMute();
        return;
      }
      const direction = directionKeys[event.key] ?? directionKeys[event.key.toLowerCase()];
      if (!direction) return;
      event.preventDefault();
      this.chooseDirection(direction);
    }

    private handlePointerDown(pointer: { x: number; y: number }) {
      this.pointerStart = { x: pointer.x, y: pointer.y };
    }

    private handlePointerUp(pointer: { x: number; y: number }) {
      const x = pointer.x - this.pointerStart.x;
      const y = pointer.y - this.pointerStart.y;
      if (Math.max(Math.abs(x), Math.abs(y)) < SWIPE_THRESHOLD) return;
      this.chooseDirection(
        Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : y > 0 ? "down" : "up",
      );
    }

    private draw() {
      this.backgroundLayer
        .clear()
        .fillStyle(this.stage.background, 1)
        .fillRect(0, 0, WIDTH, HEIGHT);
      this.ambientLayer.clear();
      this.ambientLayer
        .fillStyle(this.stage.accent, 0.12)
        .fillCircle(WIDTH - 70 * SCALE, 124 * SCALE, 104 * SCALE);
      this.ambientLayer
        .fillStyle(this.stage.edge, 0.09)
        .fillCircle(58 * SCALE, HEIGHT - 72 * SCALE, 124 * SCALE);
      this.hudLayer.clear();
      this.hudLayer
        .fillStyle(this.stage.panel, 0.94)
        .fillRoundedRect(24 * SCALE, 16 * SCALE, WIDTH - 48 * SCALE, 94 * SCALE, 18 * SCALE);
      this.hudLayer
        .lineStyle(2 * SCALE, this.stage.edge, 0.36)
        .strokeRoundedRect(24 * SCALE, 16 * SCALE, WIDTH - 48 * SCALE, 94 * SCALE, 18 * SCALE);
      this.boardLayer.clear();
      this.boardLayer
        .fillStyle(this.stage.panel, 1)
        .fillRoundedRect(
          BOARD_X - 14 * SCALE,
          BOARD_Y - 14 * SCALE,
          BOARD_WIDTH + 28 * SCALE,
          BOARD_HEIGHT + 28 * SCALE,
          22 * SCALE,
        );
      this.boardLayer
        .lineStyle(3 * SCALE, this.stage.edge, 0.62)
        .strokeRoundedRect(
          BOARD_X - 14 * SCALE,
          BOARD_Y - 14 * SCALE,
          BOARD_WIDTH + 28 * SCALE,
          BOARD_HEIGHT + 28 * SCALE,
          22 * SCALE,
        );
      this.boardLayer.lineStyle(1, this.stage.grid, 0.38);
      for (let column = 1; column < SNAKE_COLUMNS; column += 1)
        this.boardLayer.lineBetween(
          BOARD_X + column * CELL_SIZE,
          BOARD_Y,
          BOARD_X + column * CELL_SIZE,
          BOARD_Y + BOARD_HEIGHT,
        );
      for (let row = 1; row < SNAKE_ROWS; row += 1)
        this.boardLayer.lineBetween(
          BOARD_X,
          BOARD_Y + row * CELL_SIZE,
          BOARD_X + BOARD_WIDTH,
          BOARD_Y + row * CELL_SIZE,
        );
      this.stage.obstacles.forEach((position) => {
        const point = this.cellPoint(position);
        this.boardLayer
          .fillStyle(this.stage.obstacle, 1)
          .fillRoundedRect(point.x + 3, point.y + 3, CELL_SIZE - 6, CELL_SIZE - 6, 8);
        this.boardLayer
          .lineStyle(2, this.stage.edge, 0.25)
          .strokeRoundedRect(point.x + 3, point.y + 3, CELL_SIZE - 6, CELL_SIZE - 6, 8);
      });
      this.snakeLayer.clear();
      [...this.snake].reverse().forEach((position, index) => {
        const point = this.cellPoint(position);
        const head = position === this.snake[0];
        this.snakeLayer
          .fillStyle(head ? this.stage.accent : this.stage.body, 1)
          .fillRoundedRect(point.x + 3, point.y + 3, CELL_SIZE - 6, CELL_SIZE - 6, head ? 10 : 7);
        this.snakeLayer
          .lineStyle(2, this.stage.edge, 0.4)
          .strokeRoundedRect(point.x + 3, point.y + 3, CELL_SIZE - 6, CELL_SIZE - 6, head ? 10 : 7);
        if (head) {
          const [forwardRow, forwardColumn] = vectors[this.direction];
          const sideRow = forwardColumn === 0 ? 0 : 1;
          const sideColumn = forwardColumn === 0 ? 1 : 0;
          const centerX = point.x + CELL_SIZE / 2 + forwardColumn * CELL_SIZE * 0.14;
          const centerY = point.y + CELL_SIZE / 2 + forwardRow * CELL_SIZE * 0.14;
          this.snakeLayer
            .fillStyle(0x10202a, 1)
            .fillCircle(
              centerX + sideColumn * CELL_SIZE * 0.18,
              centerY + sideRow * CELL_SIZE * 0.18,
              2.5 * SCALE,
            );
          this.snakeLayer.fillCircle(
            centerX - sideColumn * CELL_SIZE * 0.18,
            centerY - sideRow * CELL_SIZE * 0.18,
            2.5 * SCALE,
          );
        }
        if (index === this.snake.length - 1)
          this.snakeLayer
            .fillStyle(this.stage.edge, 0.35)
            .fillCircle(point.x + CELL_SIZE / 2, point.y + CELL_SIZE / 2, 3 * SCALE);
      });
      this.updateFood();
      this.stageText
        .setText(`${this.stage.label.toUpperCase()}  /  ${this.stage.subtitle.toUpperCase()}`)
        .setColor(this.toColor(this.stage.edge));
      this.scoreText.setText(String(this.score));
      this.bestText.setText(`BEST  ${this.bestByStage[this.stageId]}`);
      this.pauseText.setColor(this.toColor(this.stage.accent));
    }

    private updateFood() {
      if (this.food < 0) {
        this.foodGlow.setVisible(false);
        this.foodCore.setVisible(false);
        return;
      }
      const point = this.cellPoint(this.food);
      this.foodGlow
        .setPosition(point.x + CELL_SIZE / 2, point.y + CELL_SIZE / 2)
        .setFillStyle(this.stage.food, 0.2)
        .setVisible(true);
      this.foodCore
        .setPosition(point.x + CELL_SIZE / 2, point.y + CELL_SIZE / 2)
        .setTint(this.stage.food)
        .setVisible(true);
      this.tweens.killTweensOf([this.foodGlow, this.foodCore]);
      this.foodGlow.setScale(0.8);
      this.tweens.add({
        targets: this.foodGlow,
        scale: 1.35,
        alpha: 0.42,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    private cellPoint(position: number) {
      return {
        x: BOARD_X + (position % SNAKE_COLUMNS) * CELL_SIZE,
        y: BOARD_Y + Math.floor(position / SNAKE_COLUMNS) * CELL_SIZE,
      };
    }

    private animateEat(position: number) {
      const point = this.cellPoint(position);
      const ring = this.add
        .circle(
          point.x + CELL_SIZE / 2,
          point.y + CELL_SIZE / 2,
          4 * SCALE,
          this.stage.accent,
          0.72,
        )
        .setDepth(12);
      const gain = this.add
        .text(point.x + CELL_SIZE / 2, point.y, "+1", {
          color: this.toColor(this.stage.accent),
          fontFamily: GAME_FONT,
          fontSize: `${12 * SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(12);
      this.tweens.add({
        targets: ring,
        scale: 6,
        alpha: 0,
        duration: 280,
        onComplete: () => ring.destroy(),
      });
      this.tweens.add({
        targets: gain,
        y: gain.y - 30 * SCALE,
        alpha: 0,
        duration: 460,
        ease: "Cubic.out",
        onComplete: () => gain.destroy(),
      });
      this.burstAt(point.x + CELL_SIZE / 2, point.y + CELL_SIZE / 2, "snake-spark", 5);
    }

    private animateCrash(won: boolean) {
      const point = this.cellPoint(this.snake[0]!);
      const ring = this.add
        .circle(
          point.x + CELL_SIZE / 2,
          point.y + CELL_SIZE / 2,
          8 * SCALE,
          won ? this.stage.accent : 0xff6d61,
          0.42,
        )
        .setDepth(12);
      this.tweens.add({
        targets: ring,
        scale: 4.5,
        alpha: 0,
        duration: 420,
        onComplete: () => ring.destroy(),
      });
      this.burstAt(
        point.x + CELL_SIZE / 2,
        point.y + CELL_SIZE / 2,
        won ? "snake-star" : "snake-spark",
        won ? 8 : 5,
      );
    }

    private burstAt(x: number, y: number, texture: string, count: number) {
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count;
        const distance = Phaser.Math.Between(10, 24) * SCALE;
        const particle = this.add
          .image(x, y, texture)
          .setDisplaySize(10 * SCALE, 10 * SCALE)
          .setTint(this.stage.accent)
          .setAlpha(0.9)
          .setDepth(12);
        this.tweens.add({
          targets: particle,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          alpha: 0,
          scale: 0.35,
          duration: 300,
          ease: "Cubic.out",
          onComplete: () => particle.destroy(),
        });
      }
    }

    private playSound(key: string, volume: number) {
      if (this.sound.mute || this.sound.locked || !this.cache.audio.exists(key)) return;
      try {
        this.sound.play(key, { volume });
      } catch {
        // Sound remains optional; input must never fail because audio is unavailable.
      }
    }

    private toColor(value: number) {
      return `#${value.toString(16).padStart(6, "0")}`;
    }

    private emitState() {
      onState({
        status: this.status,
        paused: this.paused,
        score: this.score,
        best: this.bestByStage[this.stageId] ?? 0,
        stage: this.stageId,
        detail: this.detail,
      } satisfies SnakeGameState);
    }

    private cleanup() {
      this.timer?.remove(false);
      this.tweens.killAll();
      this.input.off("pointerdown", this.handlePointerDown, this);
      this.input.off("pointerup", this.handlePointerUp, this);
      this.input.keyboard?.off("keydown", this.handleKeydown, this);
      this.input.keyboard?.removeCapture("SPACE,UP,DOWN,LEFT,RIGHT,W,A,S,D,M");
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#102f36;",
    backgroundColor: "#102f36",
    scene: SnakeScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
  });

  return Object.assign(game, {
    startGame: (option?: unknown) =>
      (game.scene.getScene("snake-game") as SnakeScene).startFromOverlay(option),
    restartGame: (option?: unknown) =>
      (game.scene.getScene("snake-game") as SnakeScene).restartFromOverlay(option),
    toggleMute: () => (game.scene.getScene("snake-game") as SnakeScene).toggleMute(),
  }) as PhaserGameHandle;
};
