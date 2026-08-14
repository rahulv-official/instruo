import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export type MazeChaseStatus = "ready" | "playing" | "over";

export interface MazeChaseGameState extends PhaserGameState {
  status: MazeChaseStatus;
  score: number;
  best: number;
  lives: number;
  level: number;
  pellets: number;
  totalPellets: number;
  powered: boolean;
  won: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface GeneratedMaze {
  board: string[][];
  player: Position;
  ghosts: Position[];
  powerPellets: Position[];
}

interface GhostState {
  position: Position;
  home: Position;
  direction: Direction;
  color: number;
  eatenUntil: number;
}

interface GhostVisual {
  root: GameObjects.Container;
  body: GameObjects.Ellipse;
  skirt: GameObjects.Rectangle;
}

const MAZE_COLUMNS = 15;
const MAZE_ROWS = 19;
const CELL_SIZE = 24 * WORLD_SCALE;
const BOARD_WIDTH = MAZE_COLUMNS * CELL_SIZE;
const BOARD_HEIGHT = MAZE_ROWS * CELL_SIZE;
const BOARD_X = (WIDTH - BOARD_WIDTH) / 2;
const BOARD_Y = 118 * WORLD_SCALE;
const FOOTER_Y = BOARD_Y + BOARD_HEIGHT + 15 * WORLD_SCALE;
const MAZE_SEED = 0x4D415A45;
const MAX_LEVEL = 10;
const BASE_STEP_MS = 138;
const POWER_DURATION_MS = 7_000;
const LIFE_PAUSE_MS = 850;
const SWIPE_THRESHOLD = 18 * WORLD_SCALE;
const GAME_FONT = "Manrope, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

const DIRECTIONS = [
  { id: "right", x: 1, y: 0, angle: 0 },
  { id: "down", x: 0, y: 1, angle: Math.PI / 2 },
  { id: "left", x: -1, y: 0, angle: Math.PI },
  { id: "up", x: 0, y: -1, angle: -Math.PI / 2 },
] as const;
type Direction = (typeof DIRECTIONS)[number];

/* eslint-disable unicorn/number-literal-case */
const COLORS = {
  background: 0x080b22,
  board: 0x0e1535,
  floor: 0x111a3e,
  wall: 0x1e3f83,
  wallEdge: 0x3767bd,
  pellet: 0xf4d27c,
  player: 0xffd85e,
  frightened: 0x5ecbff,
  ink: "#f7f5e8",
  muted: "#9da9cf",
  accent: 0x8d7cff,
  success: 0x65d4a0,
  danger: 0xff6f88,
  ghosts: [0xff7190, 0xffb45e, 0x76e2d5, 0xb997ff],
};
/* eslint-enable unicorn/number-literal-case */

function keyOf(position: Position) {
  return `${position.x}:${position.y}`;
}

function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y };
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

function generateMaze(levelIndex: number): GeneratedMaze {
  const random = seededRandom((MAZE_SEED ^ Math.imul(levelIndex + 1, 2_654_435_761)) >>> 0);
  const board: string[][] = Array.from({ length: MAZE_ROWS }, () => new Array<string>(MAZE_COLUMNS).fill("#"));
  const carveDirections = [
    { x: 2, y: 0 },
    { x: -2, y: 0 },
    { x: 0, y: 2 },
    { x: 0, y: -2 },
  ];
  const inside = (position: Position) =>
    position.x > 0 &&
    position.x < MAZE_COLUMNS - 1 &&
    position.y > 0 &&
    position.y < MAZE_ROWS - 1;
  const stack: Position[] = [{ x: 1, y: 1 }];
  board[1]![1] = ".";

  while (stack.length > 0) {
    const current = stack[stack.length - 1]!;
    const options = carveDirections
      .map((direction) => ({ x: current.x + direction.x, y: current.y + direction.y, direction }))
      .filter(({ x, y }) => inside({ x, y }) && board[y]![x] === "#");
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const option = options[Math.floor(random() * options.length)]!;
    const middle = {
      x: current.x + option.direction.x / 2,
      y: current.y + option.direction.y / 2,
    };
    board[middle.y]![middle.x] = ".";
    board[option.y]![option.x] = ".";
    stack.push({ x: option.x, y: option.y });
  }

  // Add a few loops so the maze feels like a chase arena instead of a single
  // winding solution path. Every cleared cell touches existing floor.
  for (let y = 1; y < MAZE_ROWS - 1; y += 1) {
    for (let x = 1; x < MAZE_COLUMNS - 1; x += 1) {
      if (board[y]![x] !== "#" || random() > 0.16) continue;
      const neighbors = [
        board[y - 1]![x],
        board[y + 1]![x],
        board[y]![x - 1],
        board[y]![x + 1],
      ].filter((cell) => cell === ".").length;
      if (neighbors >= 2) board[y]![x] = ".";
    }
  }

  return {
    board,
    player: { x: 7, y: 17 },
    ghosts: [
      { x: 7, y: 9 },
      { x: 5, y: 9 },
      { x: 9, y: 9 },
      { x: 7, y: 7 },
    ],
    powerPellets: [
      { x: 1, y: 1 },
      { x: MAZE_COLUMNS - 2, y: 1 },
      { x: 1, y: MAZE_ROWS - 2 },
      { x: MAZE_COLUMNS - 2, y: MAZE_ROWS - 2 },
    ],
  };
}

export const createMazeChaseGame: PhaserGameFactory = async (parent, onState, onReady, onError) => {
  const Phaser = (await import("phaser")).default;

  class MazeChaseScene extends Phaser.Scene {
    private status: MazeChaseStatus = "ready";
    private score = 0;
    private best = 0;
    private lives = 3;
    private level = 1;
    private won = false;
    private board: string[][] = [];
    private player: Position = { x: 7, y: 17 };
    private playerStart: Position = { x: 7, y: 17 };
    private ghosts: GhostState[] = [];
    private pellets = new Set<string>();
    private powerPellets = new Set<string>();
    private totalPellets = 0;
    private frightenedUntil = 0;
    private freezeUntil = 0;
    private resolving = false;
    private muted = false;
    private random = seededRandom(MAZE_SEED);
    private moveClock = 0;
    private pointerStartX = 0;
    private pointerStartY = 0;
    private direction: Direction = DIRECTIONS[0]!;
    private nextDirection: Direction = DIRECTIONS[0]!;
    private boardVisual!: GameObjects.Container;
    private pelletVisual!: GameObjects.Container;
    private actorsVisual!: GameObjects.Container;
    private pelletVisuals = new Map<string, GameObjects.Arc>();
    private playerVisual!: GameObjects.Container;
    private ghostVisuals: GhostVisual[] = [];
    private scoreText!: GameObjects.Text;
    private levelText!: GameObjects.Text;
    private livesText!: GameObjects.Text;
    private statusText!: GameObjects.Text;
    private banner!: GameObjects.Container;
    private bannerTitle!: GameObjects.Text;
    private bannerCopy!: GameObjects.Text;
    private levelTimer?: { remove: () => void };
    private bannerTimer?: { remove: () => void };

    constructor() {
      super("maze-chase");
    }

    preload() {
      this.load.audio("pellet", "/game-assets/kenney/interface-sounds/Audio/select_004.ogg");
      this.load.audio("power", "/game-assets/kenney/interface-sounds/Audio/confirmation_001.ogg");
      this.load.audio("ghost", "/game-assets/kenney/interface-sounds/Audio/switch_006.ogg");
      this.load.audio("hit", "/game-assets/kenney/interface-sounds/Audio/error_008.ogg");
      this.load.audio("level", "/game-assets/kenney/interface-sounds/Audio/confirmation_002.ogg");
    }

    create() {
      try {
        this.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor("#080b22");
        this.createArt();
        this.resetLevelState();
        this.input.on("pointerdown", this.handlePointerDown, this);
        this.input.on("pointerup", this.handlePointerUp, this);
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.addCapture("LEFT,RIGHT,UP,DOWN,W,A,S,D,SPACE");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "maze-chase" });
        onReady();
      } catch (error) {
        this.status = "over";
        onError?.(error);
      }
    }

    override update(_time: number, delta: number) {
      if (this.status !== "playing" || this.resolving || performance.now() < this.freezeUntil) return;
      this.moveClock += delta;
      const stepMs = Math.max(82, BASE_STEP_MS - Math.min(this.level - 1, 8) * 6);
      while (this.moveClock >= stepMs) {
        this.moveClock -= stepMs;
        this.stepPlayer();
        if (this.status !== "playing" || this.resolving) break;
        this.stepGhosts();
        this.updateGhostVisuals();
      }
      this.updatePowerVisuals();
    }

    startFromOverlay() {
      if (this.status !== "ready") return;
      this.status = "playing";
      this.statusText.setText("COLLECT EVERY PELLET").setColor(COLORS.ink);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "maze-chase", action: "start" });
      this.emitState();
    }

    restartFromOverlay() {
      this.level = 1;
      this.score = 0;
      this.lives = 3;
      this.won = false;
      this.resetLevelState();
      this.startFromOverlay();
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    private createArt() {
      this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.background);
      this.add.text(24 * WORLD_SCALE, 20 * WORLD_SCALE, "MAZE CHASE", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${23 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.add
        .text(WIDTH - 24 * WORLD_SCALE, 26 * WORLD_SCALE, "NEON ARCADE", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${7 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
      this.scoreText = this.add.text(24 * WORLD_SCALE, 56 * WORLD_SCALE, "SCORE 000000", {
        color: "#ffd85e",
        fontFamily: GAME_FONT,
        fontSize: `${8 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.levelText = this.add.text(WIDTH / 2, 56 * WORLD_SCALE, `LEVEL 1 / ${MAX_LEVEL}`, {
        color: COLORS.muted,
        fontFamily: GAME_FONT,
        fontSize: `${8 * WORLD_SCALE}px`,
        fontStyle: "bold",
      }).setOrigin(0.5, 0);
      this.livesText = this.add.text(WIDTH - 24 * WORLD_SCALE, 56 * WORLD_SCALE, "LIVES ●●●", {
        color: "#ff6f88",
        fontFamily: GAME_FONT,
        fontSize: `${8 * WORLD_SCALE}px`,
        fontStyle: "bold",
      }).setOrigin(1, 0);
      this.statusText = this.add.text(WIDTH / 2, 84 * WORLD_SCALE, "READY TO CHASE", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${8 * WORLD_SCALE}px`,
        fontStyle: "bold",
      }).setOrigin(0.5, 0);

      this.boardVisual = this.add.container(0, 0).setDepth(4);
      this.pelletVisual = this.add.container(0, 0).setDepth(6);
      this.actorsVisual = this.add.container(0, 0).setDepth(8);
      this.add.text(WIDTH / 2, FOOTER_Y, "SWIPE · ARROWS / WASD · SPACE TO START", {
        color: COLORS.muted,
        fontFamily: GAME_FONT,
        fontSize: `${7 * WORLD_SCALE}px`,
      }).setOrigin(0.5, 0);

      this.banner = this.add.container(WIDTH / 2, -80 * WORLD_SCALE).setDepth(30).setAlpha(0);
      const panel = this.add.rectangle(0, 0, 270 * WORLD_SCALE, 64 * WORLD_SCALE, COLORS.board, 0.98)
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.accent, 1);
      this.bannerTitle = this.add.text(0, -10 * WORLD_SCALE, "MAZE CLEARED", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${11 * WORLD_SCALE}px`,
        fontStyle: "bold",
      }).setOrigin(0.5);
      this.bannerCopy = this.add.text(0, 13 * WORLD_SCALE, "NEXT LEVEL", {
        color: COLORS.muted,
        fontFamily: GAME_FONT,
        fontSize: `${7 * WORLD_SCALE}px`,
        fontStyle: "bold",
      }).setOrigin(0.5);
      this.banner.add([panel, this.bannerTitle, this.bannerCopy]);
    }

    private resetLevelState() {
      this.levelTimer?.remove();
      this.bannerTimer?.remove();
      this.levelTimer = undefined;
      this.bannerTimer = undefined;
      this.tweens.killTweensOf(this.banner);
      this.banner.setAlpha(0).setY(-80 * WORLD_SCALE);
      this.resolving = false;
      this.frightenedUntil = 0;
      this.freezeUntil = 0;
      this.moveClock = 0;
      this.random = seededRandom((MAZE_SEED ^ Math.imul(this.level, 2_654_435_761)) >>> 0);
      const generated = generateMaze(this.level - 1);
      this.board = generated.board;
      this.playerStart = clonePosition(generated.player);
      this.player = clonePosition(generated.player);
      this.ghosts = generated.ghosts.map((position, index) => ({
        position: clonePosition(position),
        home: clonePosition(position),
        direction: DIRECTIONS[index % DIRECTIONS.length]!,
        color: COLORS.ghosts[index % COLORS.ghosts.length]!,
        eatenUntil: 0,
      }));
      this.powerPellets = new Set(generated.powerPellets.map(keyOf));
      this.pellets = new Set();
      const blocked = new Set([keyOf(this.player), ...this.ghosts.map((ghost) => keyOf(ghost.position))]);
      for (let y = 1; y < MAZE_ROWS - 1; y += 1) {
        for (let x = 1; x < MAZE_COLUMNS - 1; x += 1) {
          const key = keyOf({ x, y });
          if (this.board[y]![x] === "." && !blocked.has(key)) this.pellets.add(key);
        }
      }
      this.totalPellets = this.pellets.size;
      this.drawBoard();
      this.renderPellets();
      this.renderActors();
      this.updateHud();
      this.statusText.setText(this.status === "ready" ? "READY TO CHASE" : `LEVEL ${this.level} · COLLECT EVERY PELLET`).setColor(COLORS.ink);
      this.emitState();
    }

    private drawBoard() {
      this.boardVisual.removeAll(true);
      const frame = this.add.rectangle(WIDTH / 2, BOARD_Y + BOARD_HEIGHT / 2, BOARD_WIDTH + 10 * WORLD_SCALE, BOARD_HEIGHT + 10 * WORLD_SCALE, COLORS.board)
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.accent, 0.75);
      this.boardVisual.add(frame);
      for (let y = 0; y < MAZE_ROWS; y += 1) {
        for (let x = 0; x < MAZE_COLUMNS; x += 1) {
          const position = this.cellToWorld({ x, y });
          const isWall = this.board[y]?.[x] === "#";
          const tile = this.add.rectangle(position.x, position.y, CELL_SIZE - (isWall ? 0 : 2 * WORLD_SCALE), CELL_SIZE - (isWall ? 0 : 2 * WORLD_SCALE), isWall ? COLORS.wall : COLORS.floor, 1);
          if (isWall) tile.setStrokeStyle(1 * WORLD_SCALE, COLORS.wallEdge, 0.8);
          this.boardVisual.add(tile);
        }
      }
    }

    private renderPellets() {
      this.pelletVisual.removeAll(true);
      this.pelletVisuals.clear();
      this.pellets.forEach((key) => {
        const [rawX, rawY] = key.split(":");
        const x = Number(rawX ?? 0);
        const y = Number(rawY ?? 0);
        const position = this.cellToWorld({ x, y });
        const power = this.powerPellets.has(key);
        const pellet = this.add.circle(position.x, position.y, (power ? 6 : 2.5) * WORLD_SCALE, COLORS.pellet, power ? 1 : 0.9);
        if (power) this.tweens.add({ targets: pellet, scale: 1.24, duration: 500, yoyo: true, repeat: -1, ease: "Sine.inOut" });
        this.pelletVisual.add(pellet);
        this.pelletVisuals.set(key, pellet);
      });
    }

    private renderActors() {
      this.actorsVisual.removeAll(true);
      this.ghostVisuals = [];
      this.playerVisual = this.createPlayerVisual();
      this.actorsVisual.add(this.playerVisual);
      this.updatePlayerVisual();
      this.ghosts.forEach((ghost) => {
        const visual = this.createGhostVisual(ghost.color);
        this.ghostVisuals.push(visual);
        this.actorsVisual.add(visual.root);
      });
      this.updateGhostVisuals();
    }

    private createPlayerVisual() {
      const root = this.add.container(0, 0);
      const body = this.add.circle(0, 0, CELL_SIZE * 0.32, COLORS.player, 1);
      const mouth = this.add.graphics();
      mouth.fillStyle(COLORS.floor, 1);
      mouth.fillTriangle(0, 0, CELL_SIZE * 0.34, -CELL_SIZE * 0.12, CELL_SIZE * 0.34, CELL_SIZE * 0.12);
      root.add([body, mouth]);
      return root;
    }

    private createGhostVisual(color: number): GhostVisual {
      const root = this.add.container(0, 0);
      const body = this.add.ellipse(0, -2 * WORLD_SCALE, CELL_SIZE * 0.62, CELL_SIZE * 0.62, color, 1);
      const skirt = this.add.rectangle(0, CELL_SIZE * 0.14, CELL_SIZE * 0.62, CELL_SIZE * 0.25, color, 1);
      const leftEye = this.add.circle(-CELL_SIZE * 0.12, -CELL_SIZE * 0.08, CELL_SIZE * 0.085, 0xFFFFFF, 1);
      const rightEye = this.add.circle(CELL_SIZE * 0.12, -CELL_SIZE * 0.08, CELL_SIZE * 0.085, 0xFFFFFF, 1);
      const leftPupil = this.add.circle(-CELL_SIZE * 0.1, -CELL_SIZE * 0.06, CELL_SIZE * 0.04, COLORS.background, 1);
      const rightPupil = this.add.circle(CELL_SIZE * 0.14, -CELL_SIZE * 0.06, CELL_SIZE * 0.04, COLORS.background, 1);
      root.add([body, skirt, leftEye, rightEye, leftPupil, rightPupil]);
      return { root, body, skirt };
    }

    private cellToWorld(position: Position) {
      return {
        x: BOARD_X + position.x * CELL_SIZE + CELL_SIZE / 2,
        y: BOARD_Y + position.y * CELL_SIZE + CELL_SIZE / 2,
      };
    }

    private isOpen(position: Position) {
      return position.x >= 0 && position.x < MAZE_COLUMNS && position.y >= 0 && position.y < MAZE_ROWS && this.board[position.y]?.[position.x] !== "#";
    }

    private directionAt(position: Position, direction: Direction) {
      return { x: position.x + direction.x, y: position.y + direction.y };
    }

    private stepPlayer() {
      const desired = this.directionAt(this.player, this.nextDirection);
      if (this.isOpen(desired)) this.direction = this.nextDirection;
      const next = this.directionAt(this.player, this.direction);
      if (!this.isOpen(next)) return;
      this.player = next;
      this.updatePlayerVisual();
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "maze-chase", action: "move" });
      this.collectPellet();
      this.checkCollisions();
    }

    private stepGhosts() {
      this.ghosts.forEach((ghost) => {
        if (ghost.eatenUntil > performance.now()) return;
        const options = DIRECTIONS.filter((direction) => this.isOpen(this.directionAt(ghost.position, direction)));
        if (options.length === 0) return;
        const withoutReverse = options.filter((direction) => !(direction.x === -ghost.direction.x && direction.y === -ghost.direction.y));
        const choices = withoutReverse.length > 0 ? withoutReverse : options;
        const scored = choices.map((direction) => {
          const position = this.directionAt(ghost.position, direction);
          return { direction, distance: Math.abs(position.x - this.player.x) + Math.abs(position.y - this.player.y) };
        });
        scored.sort((a, b) => this.isPowered() ? b.distance - a.distance : a.distance - b.distance);
        const selected = this.random() < 0.22 ? scored[Math.floor(this.random() * scored.length)] : scored[0];
        if (!selected) return;
        ghost.direction = selected.direction;
        ghost.position = this.directionAt(ghost.position, selected.direction);
      });
      this.updateGhostVisuals();
      this.checkCollisions();
    }

    private collectPellet() {
      const key = keyOf(this.player);
      if (!this.pellets.delete(key)) return;
      const visual = this.pelletVisuals.get(key);
      visual?.destroy();
      this.pelletVisuals.delete(key);
      const power = this.powerPellets.has(key);
      if (power) {
        this.frightenedUntil = performance.now() + POWER_DURATION_MS;
        this.score += 50;
        this.playSound("power", 0.18);
        phaserEventBus.emit(PHASER_EVENTS.streak, { game: "maze-chase", streak: 1 });
      } else {
        this.score += 10;
        this.playSound("pellet", 0.045);
      }
      this.best = Math.max(this.best, this.score);
      phaserEventBus.emit(PHASER_EVENTS.hit, { game: "maze-chase", item: power ? "power-pellet" : "pellet" });
      this.updateHud();
      if (this.pellets.size === 0) this.completeLevel();
      else this.emitState();
    }

    private checkCollisions() {
      const now = performance.now();
      this.ghosts.forEach((ghost) => {
        if (ghost.eatenUntil > now) return;
        const distance = Math.abs(ghost.position.x - this.player.x) + Math.abs(ghost.position.y - this.player.y);
        if (distance === 1 && !this.isPowered()) phaserEventBus.emit(PHASER_EVENTS.nearMiss, { game: "maze-chase" });
        if (distance !== 0) return;
        if (this.isPowered()) {
          ghost.eatenUntil = now + 1_000;
          ghost.position = clonePosition(ghost.home);
          this.score += 200;
          this.best = Math.max(this.best, this.score);
          this.playSound("ghost", 0.12);
          phaserEventBus.emit(PHASER_EVENTS.hit, { game: "maze-chase", item: "ghost" });
          this.updateHud();
          return;
        }
        this.loseLife();
      });
    }

    private loseLife() {
      if (this.resolving || this.status !== "playing") return;
      this.lives -= 1;
      this.playSound("hit", 0.16);
      phaserEventBus.emit(PHASER_EVENTS.hit, { game: "maze-chase", item: "player" });
      if (this.lives <= 0) {
        this.status = "over";
        this.won = false;
        this.statusText.setText("THE MAZE GOT YOU").setColor("#ff6f88");
        this.emitState();
        return;
      }
      this.resetActors();
      this.freezeUntil = performance.now() + LIFE_PAUSE_MS;
      this.statusText.setText(`${this.lives} LIFE${this.lives === 1 ? "" : "S"} LEFT`).setColor("#ff6f88");
      this.updateHud();
      this.emitState();
    }

    private resetActors() {
      this.player = clonePosition(this.playerStart);
      this.direction = DIRECTIONS[0]!;
      this.nextDirection = DIRECTIONS[0]!;
      this.ghosts.forEach((ghost) => {
        ghost.position = clonePosition(ghost.home);
        ghost.eatenUntil = 0;
      });
      this.updatePlayerVisual();
      this.updateGhostVisuals();
    }

    private completeLevel() {
      if (this.resolving) return;
      this.resolving = true;
      this.score += 1_000;
      this.best = Math.max(this.best, this.score);
      this.statusText.setText(`LEVEL ${this.level} CLEAR`).setColor("#65d4a0");
      this.playSound("level", 0.18);
      this.showBanner();
      phaserEventBus.emit(PHASER_EVENTS.streak, { game: "maze-chase", streak: this.level });
      this.levelTimer = this.time.delayedCall(1_300, () => {
        if (this.level >= MAX_LEVEL) {
          this.status = "over";
          this.won = true;
          this.resolving = false;
          this.statusText.setText("ARCADE CLEARED").setColor("#65d4a0");
          this.emitState();
          return;
        }
        this.level += 1;
        this.resolving = false;
        this.resetLevelState();
        this.status = "playing";
        this.statusText.setText(`LEVEL ${this.level} · COLLECT EVERY PELLET`).setColor(COLORS.ink);
        this.emitState();
      });
      this.emitState();
    }

    private showBanner() {
      this.bannerTitle.setText(`LEVEL ${this.level} CLEAR`);
      this.bannerCopy.setText(this.level >= MAX_LEVEL ? "ARCADE CLEARED" : `NEXT · LEVEL ${this.level + 1}`);
      this.tweens.killTweensOf(this.banner);
      this.banner.setAlpha(1).setY(-80 * WORLD_SCALE);
      this.tweens.add({ targets: this.banner, y: HEIGHT / 2, duration: 260, ease: "Back.out" });
      this.bannerTimer = this.time.delayedCall(820, () => {
        this.tweens.add({ targets: this.banner, y: HEIGHT + 80 * WORLD_SCALE, alpha: 0, duration: 260, ease: "Cubic.in" });
      });
    }

    private updatePlayerVisual() {
      if (!this.playerVisual) return;
      const position = this.cellToWorld(this.player);
      this.tweens.add({ targets: this.playerVisual, x: position.x, y: position.y, duration: 90, ease: "Cubic.out" });
      this.playerVisual.setRotation(this.direction.angle);
    }

    private updateGhostVisuals() {
      const powered = this.isPowered();
      this.ghosts.forEach((ghost, index) => {
        const visual = this.ghostVisuals[index];
        if (!visual) return;
        const position = this.cellToWorld(ghost.position);
        this.tweens.add({ targets: visual.root, x: position.x, y: position.y, duration: 95, ease: "Cubic.out" });
        const color = powered && ghost.eatenUntil <= performance.now() ? COLORS.frightened : ghost.color;
        visual.body.setFillStyle(color, 1);
        visual.skirt.setFillStyle(color, 1);
      });
    }

    private updatePowerVisuals() {
      const powered = this.isPowered();
      this.ghostVisuals.forEach((visual, index) => {
        const ghost = this.ghosts[index];
        if (!ghost) return;
        const color = powered && ghost.eatenUntil <= performance.now() ? COLORS.frightened : ghost.color;
        visual.body.setFillStyle(color, 1);
        visual.skirt.setFillStyle(color, 1);
      });
      if (this.status === "playing" && this.frightenedUntil > 0 && !powered) {
        this.frightenedUntil = 0;
        this.emitState();
      }
    }

    private isPowered() {
      return performance.now() < this.frightenedUntil;
    }

    private updateHud() {
      this.scoreText?.setText(`SCORE ${String(this.score).padStart(6, "0")}`);
      this.levelText?.setText(`LEVEL ${this.level} / ${MAX_LEVEL}`);
      this.livesText?.setText(`LIVES ${"●".repeat(Math.max(0, this.lives))}${"○".repeat(Math.max(0, 3 - this.lives))}`);
    }

    private handleKeydown(event: KeyboardEvent) {
      const code = event.code;
      if (code === "Space") {
        event.preventDefault();
        if (this.status === "ready") this.startFromOverlay();
        return;
      }
      const direction = code === "ArrowLeft" || code === "KeyA" ? DIRECTIONS[2] : code === "ArrowRight" || code === "KeyD" ? DIRECTIONS[0] : code === "ArrowUp" || code === "KeyW" ? DIRECTIONS[3] : code === "ArrowDown" || code === "KeyS" ? DIRECTIONS[1] : undefined;
      if (!direction) return;
      event.preventDefault();
      this.nextDirection = direction;
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "maze-chase", action: "turn", direction: direction.id });
    }

    private handlePointerDown(pointer: { x: number; y: number }) {
      this.pointerStartX = pointer.x;
      this.pointerStartY = pointer.y;
    }

    private handlePointerUp(pointer: { x: number; y: number }) {
      if (this.status !== "playing") return;
      const deltaX = pointer.x - this.pointerStartX;
      const deltaY = pointer.y - this.pointerStartY;
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_THRESHOLD) return;
      if (Math.abs(deltaX) > Math.abs(deltaY)) this.nextDirection = deltaX < 0 ? DIRECTIONS[2]! : DIRECTIONS[0]!;
      else this.nextDirection = deltaY < 0 ? DIRECTIONS[3]! : DIRECTIONS[1]!;
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "maze-chase", action: "swipe" });
    }

    private emitState() {
      this.updateHud();
      onState({
        status: this.status,
        score: this.score,
        best: this.best,
        lives: this.lives,
        level: this.level,
        pellets: this.pellets.size,
        totalPellets: this.totalPellets,
        powered: this.isPowered(),
        won: this.won,
      } satisfies MazeChaseGameState);
    }

    private playSound(key: string, volume: number) {
      if (this.muted || this.sound.locked || !this.cache.audio.exists(key)) return;
      try {
        this.sound.play(key, { volume });
      } catch {
        // Audio is optional until the first user gesture.
      }
    }

    private removeInput() {
      this.input.off("pointerdown", this.handlePointerDown, this);
      this.input.off("pointerup", this.handlePointerUp, this);
      this.input.keyboard?.off("keydown", this.handleKeydown, this);
      this.input.keyboard?.removeCapture("LEFT,RIGHT,UP,DOWN,W,A,S,D,SPACE");
      this.levelTimer?.remove();
      this.bannerTimer?.remove();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#080b22;",
    backgroundColor: "#080b22",
    scene: MazeChaseScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
  });

  return Object.assign(game, {
    startGame: () => (game.scene.getScene("maze-chase") as MazeChaseScene).startFromOverlay(),
    restartGame: () => (game.scene.getScene("maze-chase") as MazeChaseScene).restartFromOverlay(),
    toggleMute: () => (game.scene.getScene("maze-chase") as MazeChaseScene).toggleMute(),
  }) as PhaserGameHandle;
};
