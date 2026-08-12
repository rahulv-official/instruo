import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export type Game2048Status = "ready" | "playing" | "over";

export interface Game2048State extends PhaserGameState {
  status: Game2048Status;
  score: number;
  highest: number;
  won: boolean;
}

type Direction = "down" | "left" | "right" | "up";

interface Tile {
  id: number;
  merged: boolean;
  position: number;
  value: number;
}

interface TileView {
  container: GameObjects.Container;
  plate: GameObjects.Rectangle;
  text: GameObjects.Text;
}

const BOARD_SIZE = 4;
const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
const GAME_FONT = "Manrope, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const CELL_SIZE = 78 * WORLD_SCALE;
const CELL_GAP = 10 * WORLD_SCALE;
const BOARD_WIDTH = CELL_SIZE * BOARD_SIZE + CELL_GAP * (BOARD_SIZE + 1);
const BOARD_X = (WIDTH - BOARD_WIDTH) / 2;
const BOARD_Y = 174 * WORLD_SCALE;
const TILE_DEPTH = 20;
const MOVE_DURATION = 150;
const SWIPE_THRESHOLD = 24 * WORLD_SCALE;
const BEST_TILE = 2048;

/* eslint-disable unicorn/number-literal-case */
const COLORS = {
  background: 0x23232a,
  board: 0x34343d,
  cell: 0x454550,
  ink: "#f7f7f3",
  muted: "#b1b2bc",
  accent: 0xf2a65a,
  success: 0x54c28a,
};

const TILE_COLORS: Record<number, { fill: number; text: string }> = {
  2: { fill: 0xf0eee7, text: "#42424b" },
  4: { fill: 0xe8e4d8, text: "#42424b" },
  8: { fill: 0xf2b66d, text: "#ffffff" },
  16: { fill: 0xee9562, text: "#ffffff" },
  32: { fill: 0xe87563, text: "#ffffff" },
  64: { fill: 0xd95750, text: "#ffffff" },
  128: { fill: 0xe9c45e, text: "#ffffff" },
  256: { fill: 0xdcae43, text: "#ffffff" },
  512: { fill: 0xc9942e, text: "#ffffff" },
  1024: { fill: 0x9f7cdb, text: "#ffffff" },
  2048: { fill: 0x54c28a, text: "#ffffff" },
};
/* eslint-enable unicorn/number-literal-case */

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

function tileColor(value: number) {
  /* eslint-disable unicorn/number-literal-case */
  return TILE_COLORS[value] ?? { fill: 0x6f62b8, text: "#ffffff" };
  /* eslint-enable unicorn/number-literal-case */
}

function tileFontSize(value: number) {
  if (value >= 1000) return `${22 * WORLD_SCALE}px`;
  if (value >= 100) return `${28 * WORLD_SCALE}px`;
  return `${34 * WORLD_SCALE}px`;
}

function lineIndexes(direction: Direction, line: number) {
  const indexes = Array.from({ length: BOARD_SIZE }, (_, offset) =>
    direction === "left" || direction === "right"
      ? line * BOARD_SIZE + offset
      : offset * BOARD_SIZE + line,
  );
  return direction === "right" || direction === "down" ? indexes.reverse() : indexes;
}

function moveTiles(state: Tile[], direction: Direction) {
  const next: Tile[] = [];
  let gained = 0;

  for (let line = 0; line < BOARD_SIZE; line += 1) {
    const indexes = lineIndexes(direction, line);
    const byPosition = new Map(state.map((tile) => [tile.position, tile]));
    const lineTiles = indexes
      .map((position) => byPosition.get(position))
      .filter((tile): tile is Tile => Boolean(tile));
    let targetOffset = 0;

    for (let index = 0; index < lineTiles.length; index += 1) {
      const tile = lineTiles[index]!;
      const targetPosition = indexes[targetOffset++]!;
      const nextTile = lineTiles[index + 1];

      if (nextTile?.value === tile.value) {
        const value = tile.value * 2;
        next.push({ ...nextTile, merged: true, position: targetPosition, value });
        gained += value;
        index += 1;
      } else {
        next.push({ ...tile, merged: false, position: targetPosition });
      }
    }
  }

  const changed = next.some((tile) => {
    const previous = state.find((item) => item.id === tile.id);
    return !previous || previous.position !== tile.position || previous.value !== tile.value;
  });

  return { changed, gained, tiles: next };
}

function canMove(state: Tile[]) {
  if (state.length < CELL_COUNT) return true;
  const values = new Map(state.map((tile) => [tile.position, tile.value]));
  return state.some((tile) => {
    const row = Math.floor(tile.position / BOARD_SIZE);
    const column = tile.position % BOARD_SIZE;
    return (
      (column < BOARD_SIZE - 1 && values.get(tile.position + 1) === tile.value) ||
      (row < BOARD_SIZE - 1 && values.get(tile.position + BOARD_SIZE) === tile.value)
    );
  });
}

function addRandomTile(state: Tile[], id: number) {
  const occupied = new Set(state.map((tile) => tile.position));
  const empty = Array.from({ length: CELL_COUNT }, (_, position) => position).filter(
    (position) => !occupied.has(position),
  );
  if (!empty.length) return state;

  return [
    ...state,
    {
      id,
      merged: false,
      position: empty[Math.floor(Math.random() * empty.length)]!,
      value: Math.random() < 0.9 ? 2 : 4,
    },
  ];
}

export const createGame2048: PhaserGameFactory = async (parent, onState, onReady, onError) => {
  const Phaser = (await import("phaser")).default;

  class Game2048Scene extends Phaser.Scene {
    private tiles: Tile[] = [];
    private tileViews = new Map<number, TileView>();
    private status: Game2048Status = "ready";
    private score = 0;
    private won = false;
    private nextTileId = 0;
    private moving = false;
    private pointerStartX = 0;
    private pointerStartY = 0;

    constructor() {
      super("game-2048");
    }

    preload() {
      // Casino Audio gives the board a tactile card-table feel: slide for a
      // normal move, and a short place/tuck sound when tiles merge.
      this.load.audio("slide", "/game-assets/kenney/casino-audio/Audio/card-slide-4.ogg");
      this.load.audio("tuck", "/game-assets/kenney/casino-audio/Audio/card-place-1.ogg");
      this.load.audio("over", "/game-assets/kenney/impact-sounds/Audio/impactWood_heavy_001.ogg");
    }

    create() {
      try {
        // Render directly in the larger logical world; Phaser's FIT scale
        // keeps the game crisp without a camera zoom or stretched geometry.
        this.cameras.main.setZoom(1).setScroll(0, 0);
        this.cameras.main.setBackgroundColor("#23232a");
        this.createBoardArt();
        this.resetBoard();
        this.input.on("pointerdown", this.handlePointerDown, this);
        this.input.on("pointerup", this.handlePointerUp, this);
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.addCapture("UP,DOWN,LEFT,RIGHT,W,A,S,D");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "2048" });
        onReady();
      } catch (error) {
        this.status = "over";
        onError?.(error);
        this.add
          .text(WIDTH / 2, HEIGHT / 2, "GAME COULD NOT LOAD", {
            color: COLORS.ink,
            fontFamily: GAME_FONT,
            fontSize: `${16 * WORLD_SCALE}px`,
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(200);
      }
    }

    public startFromOverlay() {
      if (this.status !== "ready") return;
      this.status = "playing";
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "2048", action: "start" });
      this.emitState();
    }

    public restartFromOverlay() {
      this.resetBoard();
      this.startFromOverlay();
    }

    private createBoardArt() {
      this.addToWorld(
        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.background),
      ).setDepth(0);
      this.addToWorld(
        this.add.text(28 * WORLD_SCALE, 26 * WORLD_SCALE, "2048", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${28 * WORLD_SCALE}px`,
          fontStyle: "bold",
        }),
      ).setDepth(100);
      this.addToWorld(
        this.add.text(WIDTH - 28 * WORLD_SCALE, 32 * WORLD_SCALE, "MERGE LAB", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${10 * WORLD_SCALE}px`,
        }),
      )
        .setOrigin(1, 0)
        .setDepth(100);

      const scorePlate = this.addToWorld(
        this.add.rectangle(
          WIDTH - 82 * WORLD_SCALE,
          91 * WORLD_SCALE,
          112 * WORLD_SCALE,
          58 * WORLD_SCALE,
          COLORS.board,
          1,
        ),
      );
      scorePlate.setStrokeStyle(2 * WORLD_SCALE, COLORS.accent, 0.55).setDepth(100);
      this.addToWorld(
        this.add.text(WIDTH - 82 * WORLD_SCALE, 70 * WORLD_SCALE, "SCORE", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
        }),
      )
        .setOrigin(0.5, 0)
        .setDepth(101);
      this.scoreText = this.addToWorld(
        this.add.text(WIDTH - 82 * WORLD_SCALE, 89 * WORLD_SCALE, "0", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${21 * WORLD_SCALE}px`,
          fontStyle: "bold",
        }),
      )
        .setOrigin(0.5, 0)
        .setDepth(101);

      this.addToWorld(
        this.add.rectangle(
          WIDTH / 2,
          BOARD_Y + BOARD_WIDTH / 2,
          BOARD_WIDTH,
          BOARD_WIDTH,
          COLORS.board,
        ),
      ).setDepth(5);
      for (let position = 0; position < CELL_COUNT; position += 1) {
        const { x, y } = this.positionToPoint(position);
        this.addToWorld(this.add.rectangle(x, y, CELL_SIZE, CELL_SIZE, COLORS.cell)).setDepth(6);
      }
      this.addToWorld(
        this.add.text(WIDTH / 2, HEIGHT - 42 * WORLD_SCALE, "SWIPE  /  ARROWS  /  WASD", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${10 * WORLD_SCALE}px`,
        }),
      )
        .setOrigin(0.5)
        .setDepth(100);
    }

    private scoreText!: GameObjects.Text;

    private addToWorld<T extends GameObjects.GameObject>(object: T) {
      return object;
    }

    private resetBoard() {
      this.moving = false;
      this.status = "ready";
      this.score = 0;
      this.won = false;
      this.nextTileId = 0;
      this.tileViews.forEach((view) => view.container.destroy());
      this.tileViews.clear();
      this.tiles = addRandomTile(addRandomTile([], ++this.nextTileId), ++this.nextTileId);
      this.renderTiles(false);
      this.emitState();
    }

    private positionToPoint(position: number) {
      const row = Math.floor(position / BOARD_SIZE);
      const column = position % BOARD_SIZE;
      return {
        x: BOARD_X + CELL_GAP + column * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
        y: BOARD_Y + CELL_GAP + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
      };
    }

    private renderTiles(animate: boolean) {
      const nextIds = new Set(this.tiles.map((tile) => tile.id));
      for (const [id, view] of this.tileViews) {
        if (nextIds.has(id)) continue;
        this.tweens.add({
          targets: view.container,
          alpha: 0,
          scale: 0.82,
          duration: animate ? MOVE_DURATION : 0,
          onComplete: () => view.container.destroy(),
        });
        this.tileViews.delete(id);
      }

      for (const tile of this.tiles) {
        const point = this.positionToPoint(tile.position);
        let view = this.tileViews.get(tile.id);
        if (!view) {
          view = this.createTileView(tile, point);
          this.tileViews.set(tile.id, view);
          if (animate) {
            view.container.setScale(0.72);
            this.tweens.add({
              targets: view.container,
              scale: 1,
              duration: MOVE_DURATION,
              ease: "Back.out",
            });
          }
        } else {
          const color = tileColor(tile.value);
          view.plate.setFillStyle(color.fill, 1);
          view.text.setText(String(tile.value));
          view.text.setColor(color.text);
          view.text.setFontSize(tileFontSize(tile.value));
          if (animate) {
            this.tweens.add({
              targets: view.container,
              x: point.x,
              y: point.y,
              duration: MOVE_DURATION,
              ease: "Cubic.out",
            });
            if (tile.merged) {
              this.tweens.add({
                targets: view.container,
                scale: 1.1,
                duration: MOVE_DURATION / 2,
                yoyo: true,
              });
            }
          } else {
            view.container.setPosition(point.x, point.y);
          }
        }
      }
    }

    private createTileView(tile: Tile, point: { x: number; y: number }) {
      const color = tileColor(tile.value);
      const plate = this.add
        .rectangle(0, 0, CELL_SIZE, CELL_SIZE, color.fill)
        .setStrokeStyle(2, COLORS.background, 0.18);
      const text = this.add
        .text(0, 0, String(tile.value), {
          color: color.text,
          fontFamily: GAME_FONT,
          fontSize: tileFontSize(tile.value),
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      const container = this.add.container(point.x, point.y, [plate, text]).setDepth(TILE_DEPTH);
      this.addToWorld(container);
      return { container, plate, text };
    }

    private move(direction: Direction) {
      if (this.status !== "playing" || this.moving) return;
      const result = moveTiles(this.tiles, direction);
      if (!result.changed) {
        this.playSound("over", 0.03);
        return;
      }

      this.moving = true;
      this.score += result.gained;
      this.tiles = addRandomTile(result.tiles, ++this.nextTileId);
      this.renderTiles(true);
      this.playSound(result.gained ? "tuck" : "slide", result.gained ? 0.12 : 0.06);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "2048", action: direction });
      if (result.gained)
        phaserEventBus.emit(PHASER_EVENTS.hit, { game: "2048", score: result.gained });

      const highest = Math.max(...this.tiles.map((tile) => tile.value));
      if (!this.won && highest >= BEST_TILE) {
        this.won = true;
        phaserEventBus.emit(PHASER_EVENTS.streak, { game: "2048", streak: BEST_TILE });
      }
      if (!canMove(this.tiles)) {
        this.status = "over";
        this.playSound("over", 0.18);
      }
      this.emitState();
      this.time.delayedCall(MOVE_DURATION + 20, () => {
        this.moving = false;
        this.tiles = this.tiles.map((tile) => ({ ...tile, merged: false }));
      });
    }

    private handleKeydown(event: KeyboardEvent) {
      const direction = directionKeys[event.key] || directionKeys[event.key.toLowerCase()];
      if (!direction) return;
      event.preventDefault();
      this.move(direction);
    }

    private handlePointerDown(pointer: { x: number; y: number }) {
      this.pointerStartX = pointer.x;
      this.pointerStartY = pointer.y;
    }

    private handlePointerUp(pointer: { x: number; y: number }) {
      const x = pointer.x - this.pointerStartX;
      const y = pointer.y - this.pointerStartY;
      if (Math.max(Math.abs(x), Math.abs(y)) < SWIPE_THRESHOLD) return;
      this.move(Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : y > 0 ? "down" : "up");
    }

    private emitState() {
      onState({
        status: this.status,
        score: this.score,
        highest: Math.max(...this.tiles.map((tile) => tile.value), 0),
        won: this.won,
      } satisfies Game2048State);
      this.scoreText?.setText(String(this.score));
    }

    private playSound(key: string, volume: number) {
      if (this.sound.locked || !this.cache.audio.exists(key)) return;
      try {
        this.sound.play(key, { volume });
      } catch {
        // Sound remains optional; input must never fail because audio is unavailable.
      }
    }

    private removeInput() {
      this.input.off("pointerdown", this.handlePointerDown, this);
      this.input.off("pointerup", this.handlePointerUp, this);
      this.input.keyboard?.off("keydown", this.handleKeydown, this);
      this.input.keyboard?.removeCapture("UP,DOWN,LEFT,RIGHT,W,A,S,D");
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#23232a;",
    backgroundColor: "#23232a",
    scene: Game2048Scene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      roundPixels: false,
    },
  });

  return Object.assign(game, {
    startGame: () => {
      const scene = game.scene.getScene("game-2048") as Game2048Scene;
      scene.startFromOverlay();
    },
    restartGame: () => {
      const scene = game.scene.getScene("game-2048") as Game2048Scene;
      scene.restartFromOverlay();
    },
  }) as PhaserGameHandle;
};
