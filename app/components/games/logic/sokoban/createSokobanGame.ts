import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export type SokobanStatus = "ready" | "playing" | "over";

export interface SokobanGameState extends PhaserGameState {
  status: SokobanStatus;
  level: number;
  totalLevels: number;
  moves: number;
  pushes: number;
  completedLevels: number;
  won: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface Snapshot {
  player: Position;
  crates: Position[];
  moves: number;
  pushes: number;
}

interface LevelDefinition {
  name: string;
  map: string[];
}

const COLUMNS = 11;
const ROWS = 11;
const PLAYABLE_COLUMNS = COLUMNS - 2;
const PLAYABLE_ROWS = ROWS - 2;
const CELL_SIZE = 38 * WORLD_SCALE;
const BOARD_WIDTH = PLAYABLE_COLUMNS * CELL_SIZE;
const BOARD_HEIGHT = PLAYABLE_ROWS * CELL_SIZE;
const BOARD_X = (WIDTH - BOARD_WIDTH) / 2;
const BOARD_Y = 154 * WORLD_SCALE;
const FOOTER_Y = BOARD_Y + BOARD_HEIGHT + 30 * WORLD_SCALE;
const SWIPE_THRESHOLD = 22 * WORLD_SCALE;
const GAME_FONT = "Geist, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const LEVEL_SEED = 0x534f4b4f;
const LEVEL_NAMES = [
  "First delivery",
  "Cross dock",
  "Long haul",
  "Tight aisle",
  "Corner office",
  "Split shift",
  "Loading bay",
  "Night route",
  "Double back",
  "Last-mile",
  "Cold storage",
  "Narrow gate",
  "Forklift row",
  "Dead-end check",
  "Warehouse maze",
  "Late dispatch",
  "Blind corner",
  "Overnight haul",
  "Morning shift",
  "Parcel row",
  "South dock",
  "North dock",
  "Aisle seven",
  "Aisle eight",
  "Key exchange",
  "Pallet turn",
  "Stack check",
  "Gatehouse",
  "Forklift loop",
  "Cargo split",
  "Transit lane",
  "Deep storage",
  "Return route",
  "Crossing point",
  "Back room",
  "Pallet maze",
  "Route control",
  "Staging area",
  "Dispatch line",
  "Outbound row",
  "Inbound row",
  "Quiet aisle",
  "Heavy lift",
  "Last pallet",
  "Closing shift",
  "Final loading",
  "Final route",
  "Final dock",
  "Final gate",
  "Warehouse master",
] as const;
const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
] as const;

const COLORS = {
  background: 0x14211f,
  board: 0x1d312d,
  floor: 0x29423b,
  floorLine: 0x3e6255,
  wall: 0x101c1c,
  wallEdge: 0x496c5b,
  crate: 0xf0a44f,
  crateDark: 0x9c5f2b,
  player: 0x67d8cb,
  goal: 0xf4d27c,
  ink: "#f9f4e6",
  muted: "#a7c0b5",
  accent: 0xf4bd68,
  success: 0x65d4a0,
  danger: 0xe87373,
};

function keyOf(position: Position) {
  return `${position.x}:${position.y}`;
}

function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y };
}

function cloneSnapshot(snapshot: Snapshot): Snapshot {
  return {
    player: clonePosition(snapshot.player),
    crates: snapshot.crates.map(clonePosition),
    moves: snapshot.moves,
    pushes: snapshot.pushes,
  };
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

function generateLevel(index: number): LevelDefinition {
  const random = seededRandom((LEVEL_SEED ^ Math.imul(index + 1, 2_654_435_761)) >>> 0);
  const shelfCandidates: Position[] = [];
  for (let y = 2; y < ROWS - 2; y += 1) {
    for (let x = 2; x < COLUMNS - 2; x += 1) {
      shelfCandidates.push({ x, y });
    }
  }
  const crateCount = Math.min(6, 2 + Math.floor(index / 3));
  const wallCount = Math.min(
    12,
    shelfCandidates.length,
    25 - crateCount - 1,
    Math.floor(index * 1.1),
  );
  const walls = new Set<string>();
  while (walls.size < wallCount) {
    const candidate = shelfCandidates[Math.floor(random() * shelfCandidates.length)];
    if (candidate) walls.add(keyOf(candidate));
  }
  const inside = (position: Position) =>
    position.x > 0 &&
    position.x < COLUMNS - 1 &&
    position.y > 0 &&
    position.y < ROWS - 1 &&
    !walls.has(keyOf(position));
  const floor = Array.from({ length: ROWS * COLUMNS }, (_, cellIndex) => ({
    x: cellIndex % COLUMNS,
    y: Math.floor(cellIndex / COLUMNS),
  })).filter(inside);
  const safe = floor.filter(
    (position) =>
      position.x > 1 && position.x < COLUMNS - 2 && position.y > 1 && position.y < ROWS - 2,
  );
  const goals: Position[] = [];
  const available = [...safe];
  const take = () => {
    const picked = available.splice(Math.floor(random() * available.length), 1)[0];
    if (!picked) throw new Error(`Unable to seed Sokoban level ${index + 1}`);
    return picked;
  };
  while (goals.length < crateCount) goals.push(take());
  const crates = goals.map(clonePosition);
  let player = take();
  const crateAt = (position: Position) =>
    crates.findIndex((crate) => crate.x === position.x && crate.y === position.y);

  // Start solved, then walk and pull crates backwards. Every pull is the
  // exact inverse of a legal push, so reversing the generated moves solves it.
  const scrambleSteps = 14 + index * 6;
  const requiredUnsolved = Math.min(crateCount, 2 + Math.floor(index / 4));
  let step = 0;
  let safety = 0;
  const unsolvedCount = () =>
    crates.filter((crate) => !goals.some((goal) => keyOf(goal) === keyOf(crate))).length;
  while (
    (step < scrambleSteps || unsolvedCount() < requiredUnsolved) &&
    safety < scrambleSteps + 120
  ) {
    safety += 1;
    const options: Array<{
      type: "walk" | "pull";
      direction: (typeof DIRECTIONS)[number];
      crateIndex?: number;
    }> = [];
    for (const direction of DIRECTIONS) {
      const next = { x: player.x + direction.x, y: player.y + direction.y };
      if (inside(next) && crateAt(next) < 0) options.push({ type: "walk", direction });
      const adjacentCrate = crateAt(next);
      const behind = { x: player.x - direction.x, y: player.y - direction.y };
      if (adjacentCrate >= 0 && inside(behind) && crateAt(behind) < 0) {
        options.push({ type: "pull", direction, crateIndex: adjacentCrate });
      }
    }
    const pullOptions = options.filter((option) => option.type === "pull");
    const goalPullOptions = pullOptions.filter((option) => {
      const crate = option.crateIndex === undefined ? undefined : crates[option.crateIndex];
      return crate ? goals.some((goal) => keyOf(goal) === keyOf(crate)) : false;
    });
    const selectedOptions =
      unsolvedCount() < requiredUnsolved && goalPullOptions.length > 0 ? goalPullOptions : options;
    const option = selectedOptions[Math.floor(random() * selectedOptions.length)];
    if (!option) break;
    if (option.type === "walk") {
      player = { x: player.x + option.direction.x, y: player.y + option.direction.y };
    } else {
      const crateIndex = option.crateIndex!;
      crates[crateIndex] = clonePosition(player);
      player = { x: player.x - option.direction.x, y: player.y - option.direction.y };
    }
    step += 1;
  }

  // A dense wall layout can trap the random walk on a solved-looking state.
  // Keep enough crates one push away from their goals so every level opens
  // with a visible plan instead of an accidental instant clear.
  if (unsolvedCount() < requiredUnsolved) {
    while (unsolvedCount() < requiredUnsolved) {
      let fallback: { crateIndex: number; crate: Position; player: Position } | undefined;
      for (let crateIndex = 0; crateIndex < crates.length && !fallback; crateIndex += 1) {
        const crate = crates[crateIndex];
        if (!crate) continue;
        const goal = goals.find((candidate) => keyOf(candidate) === keyOf(crate));
        if (!goal) continue;
        for (const direction of DIRECTIONS) {
          const cratePosition = { x: goal.x - direction.x, y: goal.y - direction.y };
          const playerPosition = { x: goal.x - direction.x * 2, y: goal.y - direction.y * 2 };
          if (
            inside(cratePosition) &&
            inside(playerPosition) &&
            !goals.some((candidate) => keyOf(candidate) === keyOf(cratePosition)) &&
            crateAt(cratePosition) < 0 &&
            crateAt(playerPosition) < 0
          ) {
            fallback = { crateIndex, crate: cratePosition, player: playerPosition };
            break;
          }
        }
      }
      if (!fallback) break;
      crates[fallback.crateIndex] = fallback.crate;
      player = fallback.player;
    }
  }

  const grid: string[][] = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLUMNS }, (_, x) => {
      if (x === 0 || y === 0 || x === COLUMNS - 1 || y === ROWS - 1) return "#";
      return walls.has(keyOf({ x, y })) ? "#" : " ";
    }),
  );
  goals.forEach((goal) => {
    grid[goal.y]![goal.x] = ".";
  });
  crates.forEach((crate) => {
    grid[crate.y]![crate.x] = goals.some((goal) => keyOf(goal) === keyOf(crate)) ? "*" : "$";
  });
  grid[player.y]![player.x] = goals.some((goal) => keyOf(goal) === keyOf(player)) ? "+" : "@";

  return {
    name: LEVEL_NAMES[index] ?? `Route ${index + 1}`,
    map: grid.map((row) => row.join("")),
  };
}

const LEVELS = Array.from({ length: LEVEL_NAMES.length }, (_, index) => generateLevel(index));

export const createSokobanGame: PhaserGameFactory = async (parent, onState, onReady, onError) => {
  const Phaser = (await import("phaser")).default;

  class SokobanScene extends Phaser.Scene {
    private status: SokobanStatus = "ready";
    private levelIndex = 0;
    private moves = 0;
    private pushes = 0;
    private completedLevels = 0;
    private won = false;
    private resolving = false;
    private muted = false;
    private board: string[][] = [];
    private goals = new Set<string>();
    private crates: Position[] = [];
    private player: Position = { x: 0, y: 0 };
    private history: Snapshot[] = [];
    private boardVisual!: GameObjects.Container;
    private piecesVisual!: GameObjects.Container;
    private crateVisuals: GameObjects.Container[] = [];
    private playerVisual!: GameObjects.Container;
    private statusText!: GameObjects.Text;
    private levelText!: GameObjects.Text;
    private movesText!: GameObjects.Text;
    private pushesText!: GameObjects.Text;
    private levelCompletePanel!: GameObjects.Container;
    private levelCompleteTitle!: GameObjects.Text;
    private levelCompleteCopy!: GameObjects.Text;
    private pointerStartX = 0;
    private pointerStartY = 0;
    private nextLevelTimer?: { remove: () => void };

    constructor() {
      super("sokoban");
    }

    preload() {
      this.load.audio("move", "/game-assets/kenney/interface-sounds/Audio/select_004.ogg");
      this.load.audio("push", "/game-assets/kenney/interface-sounds/Audio/drop_004.ogg");
      this.load.audio("undo", "/game-assets/kenney/interface-sounds/Audio/select_007.ogg");
      this.load.audio("clear", "/game-assets/kenney/interface-sounds/Audio/confirmation_001.ogg");
      this.load.audio("over", "/game-assets/kenney/interface-sounds/Audio/error_008.ogg");
    }

    create() {
      try {
        this.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor("#14211f");
        this.createArt();
        this.resetBoard();
        this.input.on("pointerdown", this.handlePointerDown, this);
        this.input.on("pointerup", this.handlePointerUp, this);
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.addCapture("LEFT,RIGHT,UP,DOWN,W,A,S,D,Z,R");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "sokoban" });
        onReady();
      } catch (error) {
        this.status = "over";
        onError?.(error);
      }
    }

    startFromOverlay() {
      if (this.status !== "ready") return;
      this.status = "playing";
      this.statusText.setText("PUSH EVERY CRATE ONTO A GOAL").setColor(COLORS.ink);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "sokoban", action: "start" });
      this.emitState();
    }

    restartFromOverlay() {
      this.resetBoard();
      this.startFromOverlay();
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    private createArt() {
      this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.background);
      this.add.text(26 * WORLD_SCALE, 28 * WORLD_SCALE, "SOKOBAN", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${24 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.add
        .text(WIDTH - 26 * WORLD_SCALE, 34 * WORLD_SCALE, "WAREHOUSE RUN", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
      this.levelText = this.add.text(
        26 * WORLD_SCALE,
        68 * WORLD_SCALE,
        `LEVEL 1 / ${LEVELS.length}`,
        {
          color: "#f4bd68",
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
          fontStyle: "bold",
        },
      );
      this.movesText = this.add
        .text(WIDTH / 2, 68 * WORLD_SCALE, "MOVES 0", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0);
      this.pushesText = this.add
        .text(WIDTH - 26 * WORLD_SCALE, 68 * WORLD_SCALE, "PUSHES 0", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(1, 0);
      this.statusText = this.add
        .text(WIDTH / 2, 102 * WORLD_SCALE, "READY TO LOAD", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0);

      this.levelCompletePanel = this.add
        .container(WIDTH / 2, -90 * WORLD_SCALE)
        .setDepth(30)
        .setAlpha(0);
      const panel = this.add
        .rectangle(0, 0, 270 * WORLD_SCALE, 64 * WORLD_SCALE, COLORS.board, 0.98)
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.success, 1);
      this.levelCompleteTitle = this.add
        .text(0, -10 * WORLD_SCALE, "LEVEL COMPLETE", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${11 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.levelCompleteCopy = this.add
        .text(0, 13 * WORLD_SCALE, "NEXT ROUTE", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${7 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.levelCompletePanel.add([panel, this.levelCompleteTitle, this.levelCompleteCopy]);

      this.boardVisual = this.add.container(0, 0).setDepth(4);
      this.piecesVisual = this.add.container(0, 0).setDepth(8);
      this.add
        .text(WIDTH / 2, FOOTER_Y, "ARROWS / WASD MOVE  ·  Z UNDO  ·  R RESET LEVEL", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${7 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5, 0);
    }

    private resetBoard() {
      this.nextLevelTimer?.remove();
      this.nextLevelTimer = undefined;
      this.tweens.killAll();
      this.levelCompletePanel?.setAlpha(0).setY(-90 * WORLD_SCALE);
      this.status = "ready";
      this.levelIndex = 0;
      this.moves = 0;
      this.pushes = 0;
      this.completedLevels = 0;
      this.won = false;
      this.resolving = false;
      this.loadLevel();
      this.statusText?.setText("READY TO LOAD").setColor(COLORS.ink);
      this.emitState();
    }

    private loadLevel() {
      const definition = LEVELS[this.levelIndex] ?? LEVELS[0]!;
      this.board = definition.map.map((row) => Array.from(row));
      this.goals = new Set();
      this.crates = [];
      this.history = [];
      this.player = { x: 1, y: 1 };
      this.board.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell === "." || cell === "*" || cell === "+") this.goals.add(keyOf({ x, y }));
          if (cell === "$" || cell === "*") this.crates.push({ x, y });
          if (cell === "@" || cell === "+") this.player = { x, y };
          if (cell === "$" || cell === "@" || cell === "*" || cell === "+") row[x] = " ";
        });
      });
      this.drawBoard();
      this.renderPieces(false);
      this.levelText?.setText(`LEVEL ${this.levelIndex + 1} / ${LEVELS.length}`);
    }

    private drawBoard() {
      this.boardVisual.removeAll(true);
      const frame = this.add
        .rectangle(
          WIDTH / 2,
          BOARD_Y + BOARD_HEIGHT / 2,
          BOARD_WIDTH + 20 * WORLD_SCALE,
          BOARD_HEIGHT + 20 * WORLD_SCALE,
          COLORS.board,
        )
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.accent, 0.42);
      this.boardVisual.add(frame);
      for (let y = 1; y < ROWS - 1; y += 1) {
        for (let x = 1; x < COLUMNS - 1; x += 1) {
          const cell = this.board[y]?.[x] ?? "#";
          const position = this.cellToWorld({ x, y });
          const isWall = cell === "#";
          const tile = this.add
            .rectangle(
              position.x,
              position.y,
              CELL_SIZE - 2 * WORLD_SCALE,
              CELL_SIZE - 2 * WORLD_SCALE,
              isWall ? COLORS.wall : COLORS.floor,
            )
            .setStrokeStyle(1 * WORLD_SCALE, isWall ? COLORS.wallEdge : COLORS.floorLine, 0.7);
          this.boardVisual.add(tile);
          if (!isWall && this.goals.has(keyOf({ x, y })))
            this.boardVisual.add(this.goalMarker(position));
        }
      }
    }

    private goalMarker(position: Position) {
      const marker = this.add.graphics();
      marker.fillStyle(COLORS.goal, 0.9);
      marker.fillCircle(position.x, position.y, 8 * WORLD_SCALE);
      marker.lineStyle(2 * WORLD_SCALE, COLORS.background, 0.7);
      marker.strokeCircle(position.x, position.y, 11 * WORLD_SCALE);
      return marker;
    }

    private renderPieces(animate: boolean) {
      this.piecesVisual.removeAll(true);
      this.crateVisuals = [];
      this.playerVisual = this.createPlayerVisual();
      this.playerVisual.setPosition(
        this.cellToWorld(this.player).x,
        this.cellToWorld(this.player).y,
      );
      this.piecesVisual.add(this.playerVisual);
      this.crates.forEach((crate, index) => {
        const visual = this.createCrateVisual(this.goals.has(keyOf(crate)));
        const position = this.cellToWorld(crate);
        visual.setPosition(position.x, position.y);
        this.crateVisuals[index] = visual;
        this.piecesVisual.add(visual);
      });
      if (animate) {
        this.tweens.add({ targets: this.playerVisual, scale: 1.08, duration: 90, yoyo: true });
      }
    }

    private createCrateVisual(onGoal = false) {
      const root = this.add.container(0, 0);
      const shadow = this.add.rectangle(
        3 * WORLD_SCALE,
        5 * WORLD_SCALE,
        CELL_SIZE * 0.66,
        CELL_SIZE * 0.66,
        COLORS.background,
        0.55,
      );
      const body = this.add
        .rectangle(0, 0, CELL_SIZE * 0.66, CELL_SIZE * 0.66, onGoal ? COLORS.success : COLORS.crate)
        .setStrokeStyle(2 * WORLD_SCALE, onGoal ? COLORS.background : COLORS.crateDark, 1);
      const inner = this.add
        .rectangle(
          0,
          0,
          CELL_SIZE * 0.44,
          CELL_SIZE * 0.44,
          onGoal ? COLORS.success : COLORS.crate,
          0,
        )
        .setStrokeStyle(2 * WORLD_SCALE, onGoal ? COLORS.background : COLORS.crateDark, 0.9);
      const marker = this.add
        .text(0, 0, "✓", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${15 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setVisible(onGoal);
      root.add([shadow, body, inner, marker]);
      return root;
    }

    private updateCrateVisual(root: GameObjects.Container, onGoal: boolean) {
      const body = root.getAt(1) as GameObjects.Rectangle;
      const inner = root.getAt(2) as GameObjects.Rectangle;
      const marker = root.getAt(3) as GameObjects.Text;
      body
        .setFillStyle(onGoal ? COLORS.success : COLORS.crate, 1)
        .setStrokeStyle(2 * WORLD_SCALE, onGoal ? COLORS.background : COLORS.crateDark, 1);
      inner
        .setFillStyle(onGoal ? COLORS.success : COLORS.crate, 0)
        .setStrokeStyle(2 * WORLD_SCALE, onGoal ? COLORS.background : COLORS.crateDark, 0.9);
      marker.setVisible(onGoal);
    }

    private createPlayerVisual() {
      const root = this.add.container(0, 0);
      const shadow = this.add.ellipse(
        3 * WORLD_SCALE,
        11 * WORLD_SCALE,
        CELL_SIZE * 0.56,
        CELL_SIZE * 0.2,
        COLORS.background,
        0.55,
      );
      const body = this.add
        .circle(0, 2 * WORLD_SCALE, CELL_SIZE * 0.29, COLORS.player, 1)
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.background, 0.9);
      const visor = this.add.rectangle(
        0,
        -1 * WORLD_SCALE,
        CELL_SIZE * 0.25,
        CELL_SIZE * 0.1,
        COLORS.background,
        0.9,
      );
      root.add([shadow, body, visor]);
      return root;
    }

    private cellToWorld(position: Position) {
      return {
        x: BOARD_X + (position.x - 1) * CELL_SIZE + CELL_SIZE / 2,
        y: BOARD_Y + (position.y - 1) * CELL_SIZE + CELL_SIZE / 2,
      };
    }

    private isWall(position: Position) {
      return (
        position.x < 0 ||
        position.x >= COLUMNS ||
        position.y < 0 ||
        position.y >= ROWS ||
        this.board[position.y]?.[position.x] === "#"
      );
    }

    private crateAt(position: Position) {
      return this.crates.findIndex((crate) => crate.x === position.x && crate.y === position.y);
    }

    private tryMove(dx: -1 | 0 | 1, dy: -1 | 0 | 1) {
      if (this.status !== "playing" || this.resolving || (dx === 0 && dy === 0)) return;
      const next = { x: this.player.x + dx, y: this.player.y + dy };
      if (this.isWall(next)) {
        this.playSound("move", 0.025);
        return;
      }
      const crateIndex = this.crateAt(next);
      const pushedTo = { x: next.x + dx, y: next.y + dy };
      if (crateIndex >= 0) {
        if (this.isWall(pushedTo) || this.crateAt(pushedTo) >= 0) {
          this.playSound("move", 0.025);
          return;
        }
      }
      this.history.push({
        player: clonePosition(this.player),
        crates: this.crates.map(clonePosition),
        moves: this.moves,
        pushes: this.pushes,
      });
      this.player = next;
      this.moves += 1;
      if (crateIndex >= 0) {
        this.crates[crateIndex] = pushedTo;
        this.pushes += 1;
        this.playSound("push", 0.1);
        phaserEventBus.emit(PHASER_EVENTS.action, { game: "sokoban", action: "push" });
      } else {
        this.playSound("move", 0.06);
      }
      this.animatePieces();
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "sokoban", action: "move" });
      if (this.crates.every((crate) => this.goals.has(keyOf(crate)))) this.completeLevel();
      this.emitState();
    }

    private animatePieces() {
      const playerTarget = this.cellToWorld(this.player);
      this.tweens.add({
        targets: this.playerVisual,
        x: playerTarget.x,
        y: playerTarget.y,
        duration: 110,
        ease: "Cubic.out",
      });
      this.crates.forEach((crate, index) => {
        const target = this.crateVisuals[index];
        if (!target) return;
        this.updateCrateVisual(target, this.goals.has(keyOf(crate)));
        const position = this.cellToWorld(crate);
        this.tweens.add({
          targets: target,
          x: position.x,
          y: position.y,
          duration: 130,
          ease: "Back.out",
        });
      });
    }

    private undoMove() {
      if (this.status !== "playing" || this.resolving) return;
      const previous = this.history.pop();
      if (!previous) return;
      const snapshot = cloneSnapshot(previous);
      this.player = snapshot.player;
      this.crates = snapshot.crates;
      this.moves = snapshot.moves;
      this.pushes = snapshot.pushes;
      this.animatePieces();
      this.playSound("undo", 0.07);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "sokoban", action: "undo" });
      this.emitState();
    }

    private completeLevel() {
      this.resolving = true;
      this.statusText.setText(`LEVEL ${this.levelIndex + 1} CLEAR`).setColor("#65d4a0");
      this.playSound("clear", 0.16);
      this.burstAt(this.player);
      this.showLevelCompletePanel();
      phaserEventBus.emit(PHASER_EVENTS.hit, { game: "sokoban", level: this.levelIndex + 1 });
      this.nextLevelTimer = this.time.delayedCall(1400, () => {
        this.completedLevels = Math.max(this.completedLevels, this.levelIndex + 1);
        if (this.levelIndex >= LEVELS.length - 1) {
          this.status = "over";
          this.won = true;
          this.resolving = false;
          this.statusText.setText("WAREHOUSE CLEARED").setColor("#65d4a0");
          phaserEventBus.emit(PHASER_EVENTS.streak, { game: "sokoban", streak: LEVELS.length });
          this.emitState();
          return;
        }
        this.levelIndex += 1;
        this.resolving = false;
        this.loadLevel();
        this.statusText
          .setText(`LEVEL ${this.levelIndex + 1}: ${LEVELS[this.levelIndex]?.name.toUpperCase()}`)
          .setColor(COLORS.ink);
        this.emitState();
      });
    }

    private showLevelCompletePanel() {
      const isFinal = this.levelIndex >= LEVELS.length - 1;
      this.levelCompleteTitle.setText(`LEVEL ${this.levelIndex + 1} COMPLETE`);
      this.levelCompleteCopy.setText(
        isFinal
          ? "WAREHOUSE CLEARED"
          : `NEXT · ${LEVELS[this.levelIndex + 1]?.name.toUpperCase() ?? "ROUTE"}`,
      );
      this.tweens.killTweensOf(this.levelCompletePanel);
      this.levelCompletePanel.setAlpha(1).setY(-90 * WORLD_SCALE);
      this.tweens.add({
        targets: this.levelCompletePanel,
        y: HEIGHT / 2,
        duration: 280,
        ease: "Back.out",
      });
      this.time.delayedCall(860, () => {
        this.tweens.add({
          targets: this.levelCompletePanel,
          y: HEIGHT + 90 * WORLD_SCALE,
          alpha: 0,
          duration: 260,
          ease: "Cubic.in",
        });
      });
    }

    private resetCurrentLevel() {
      if (this.status !== "playing" || this.resolving) return;
      this.loadLevel();
      this.statusText
        .setText(`LEVEL ${this.levelIndex + 1}: ${LEVELS[this.levelIndex]?.name.toUpperCase()}`)
        .setColor(COLORS.ink);
      this.emitState();
    }

    private burstAt(position: Position) {
      const center = this.cellToWorld(position);
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        const particle = this.add
          .circle(center.x, center.y, 4 * WORLD_SCALE, COLORS.goal, 0.95)
          .setDepth(16);
        this.tweens.add({
          targets: particle,
          x: center.x + Math.cos(angle) * 38 * WORLD_SCALE,
          y: center.y + Math.sin(angle) * 38 * WORLD_SCALE,
          alpha: 0,
          scale: 0.25,
          duration: 440,
          ease: "Cubic.out",
          onComplete: () => particle.destroy(),
        });
      }
    }

    private handleKeydown(event: KeyboardEvent) {
      const code = event.code;
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
          "KeyZ",
          "KeyR",
        ].includes(code)
      )
        return;
      event.preventDefault();
      if (code === "KeyZ") {
        this.undoMove();
        return;
      }
      if (code === "KeyR") {
        this.resetCurrentLevel();
        return;
      }
      if (code === "ArrowLeft" || code === "KeyA") this.tryMove(-1, 0);
      else if (code === "ArrowRight" || code === "KeyD") this.tryMove(1, 0);
      else if (code === "ArrowUp" || code === "KeyW") this.tryMove(0, -1);
      else this.tryMove(0, 1);
    }

    private handlePointerDown(pointer: { x: number; y: number }) {
      this.pointerStartX = pointer.x;
      this.pointerStartY = pointer.y;
    }

    private handlePointerUp(pointer: { x: number; y: number }) {
      if (this.status !== "playing" || this.resolving) return;
      const deltaX = pointer.x - this.pointerStartX;
      const deltaY = pointer.y - this.pointerStartY;
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= SWIPE_THRESHOLD) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) this.tryMove(deltaX < 0 ? -1 : 1, 0);
        else this.tryMove(0, deltaY < 0 ? -1 : 1);
        return;
      }
      const playerCenter = this.cellToWorld(this.player);
      const offsetX = pointer.x - playerCenter.x;
      const offsetY = pointer.y - playerCenter.y;
      if (Math.abs(offsetX) > Math.abs(offsetY)) this.tryMove(offsetX < 0 ? -1 : 1, 0);
      else this.tryMove(0, offsetY < 0 ? -1 : 1);
    }

    private emitState() {
      this.levelText?.setText(`LEVEL ${this.levelIndex + 1} / ${LEVELS.length}`);
      this.movesText?.setText(`MOVES ${this.moves}`);
      this.pushesText?.setText(`PUSHES ${this.pushes}`);
      onState({
        status: this.status,
        level: this.levelIndex + 1,
        totalLevels: LEVELS.length,
        moves: this.moves,
        pushes: this.pushes,
        completedLevels: this.completedLevels,
        won: this.won,
      } satisfies SokobanGameState);
    }

    private playSound(key: string, volume: number) {
      if (this.muted || this.sound.locked || !this.cache.audio.exists(key)) return;
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
      this.input.keyboard?.removeCapture("LEFT,RIGHT,UP,DOWN,W,A,S,D,Z,R");
      this.nextLevelTimer?.remove();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#14211f;",
    backgroundColor: "#14211f",
    scene: SokobanScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
  });

  return Object.assign(game, {
    startGame: () => (game.scene.getScene("sokoban") as SokobanScene).startFromOverlay(),
    restartGame: () => (game.scene.getScene("sokoban") as SokobanScene).restartFromOverlay(),
    toggleMute: () => (game.scene.getScene("sokoban") as SokobanScene).toggleMute(),
  }) as PhaserGameHandle;
};
