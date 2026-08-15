import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export type MemoryMatchStatus = "ready" | "playing" | "over";

export interface MemoryMatchGameState extends PhaserGameState {
  status: MemoryMatchStatus;
  moves: number;
  pairs: number;
  totalPairs: number;
  elapsedSeconds: number;
  won: boolean;
}

interface CardData {
  pair: number;
  flipped: boolean;
  matched: boolean;
}

interface CardView {
  root: GameObjects.Container;
  back: GameObjects.Rectangle;
  backMark: GameObjects.Text;
  face: GameObjects.Rectangle;
  glyph: GameObjects.Graphics;
  selection: GameObjects.Rectangle;
}

const COLUMNS = 4;
const ROWS = 4;
const TOTAL_PAIRS = 8;
const CARD_SIZE = 82 * WORLD_SCALE;
const CARD_GAP = 9 * WORLD_SCALE;
const BOARD_WIDTH = COLUMNS * CARD_SIZE + (COLUMNS - 1) * CARD_GAP;
const BOARD_X = (WIDTH - BOARD_WIDTH) / 2;
const BOARD_Y = 190 * WORLD_SCALE;
const CARD_FACE = [
  0x65d4e8, 0xf4bd68, 0xb88be8, 0x65d4a0, 0xe87373, 0x6f9ee8, 0xf3a86d, 0xe7a6d8,
] as const;
const GAME_FONT = "Geist, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

const COLORS = {
  background: 0x181528,
  panel: 0x25203b,
  cardBack: 0x302a52,
  cardBackInk: 0x766aab,
  cardBackInkText: "#766aab",
  ink: "#fbf7ea",
  muted: "#b3aeca",
  accent: 0xf4bd68,
  accentText: "#f4bd68",
  matched: 0x65d4a0,
  selection: 0x65d4e8,
};

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

function createDeck(): CardData[] {
  return shuffle(
    Array.from({ length: TOTAL_PAIRS * 2 }, (_, index) => ({
      pair: Math.floor(index / 2),
      flipped: false,
      matched: false,
    })),
  );
}

export const createMemoryMatchGame: PhaserGameFactory = async (
  parent,
  onState,
  onReady,
  onError,
) => {
  const Phaser = (await import("phaser")).default;

  class MemoryMatchScene extends Phaser.Scene {
    private cards: CardData[] = [];
    private views: CardView[] = [];
    private openIndexes: number[] = [];
    private status: MemoryMatchStatus = "ready";
    private moves = 0;
    private pairs = 0;
    private elapsedSeconds = 0;
    private startedAt = 0;
    private lastElapsed = -1;
    private selectedIndex = 0;
    private resolving = false;
    private muted = false;
    private resolveTimer?: { remove: () => void };
    private finishTimer?: { remove: () => void };
    private statusText!: GameObjects.Text;
    private movesText!: GameObjects.Text;
    private pairsText!: GameObjects.Text;
    private timeText!: GameObjects.Text;

    constructor() {
      super("memory-match");
    }

    preload() {
      this.load.audio("flip", "/game-assets/kenney/casino-audio/Audio/card-slide-3.ogg");
      this.load.audio("match", "/game-assets/kenney/casino-audio/Audio/chips-stack-1.ogg");
      this.load.audio("miss", "/game-assets/kenney/interface-sounds/Audio/error_008.ogg");
      this.load.audio("win", "/game-assets/kenney/interface-sounds/Audio/confirmation_003.ogg");
    }

    create() {
      try {
        this.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor("#181528");
        this.createArt();
        this.resetBoard();
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.addCapture("LEFT,RIGHT,UP,DOWN,ENTER,SPACE");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "memory-match" });
        onReady();
      } catch (error) {
        this.status = "over";
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
      this.status = "playing";
      this.startedAt = this.time.now;
      this.lastElapsed = -1;
      this.playSound("flip", 0.06);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "memory-match", action: "start" });
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
      this.add.text(26 * WORLD_SCALE, 28 * WORLD_SCALE, "MEMORY MATCH", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${19 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.add
        .text(WIDTH - 26 * WORLD_SCALE, 34 * WORLD_SCALE, "CONSTELLATION", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
      this.statusText = this.add
        .text(WIDTH / 2, 112 * WORLD_SCALE, "READY TO REVEAL", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${11 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.add
        .rectangle(
          WIDTH / 2,
          BOARD_Y + (ROWS * CARD_SIZE + (ROWS - 1) * CARD_GAP) / 2,
          BOARD_WIDTH + 22 * WORLD_SCALE,
          ROWS * CARD_SIZE + (ROWS - 1) * CARD_GAP + 22 * WORLD_SCALE,
          COLORS.panel,
        )
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.accent, 0.42);
      this.movesText = this.add.text(26 * WORLD_SCALE, HEIGHT - 70 * WORLD_SCALE, "0", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${18 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.pairsText = this.add
        .text(WIDTH / 2, HEIGHT - 70 * WORLD_SCALE, "0 / 8 PAIRS", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${10 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5, 0);
      this.timeText = this.add
        .text(WIDTH - 26 * WORLD_SCALE, HEIGHT - 70 * WORLD_SCALE, "00:00", {
          color: COLORS.accentText,
          fontFamily: GAME_FONT,
          fontSize: `${10 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
      this.add.text(26 * WORLD_SCALE, HEIGHT - 38 * WORLD_SCALE, "MOVES", {
        color: COLORS.muted,
        fontFamily: GAME_FONT,
        fontSize: `${8 * WORLD_SCALE}px`,
      });
      this.add
        .text(WIDTH / 2, HEIGHT - 38 * WORLD_SCALE, "TAP / ARROWS + ENTER", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5, 0);
      this.add
        .text(WIDTH - 26 * WORLD_SCALE, HEIGHT - 38 * WORLD_SCALE, "FIND THE PAIRS", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);

      this.views = Array.from({ length: COLUMNS * ROWS }, (_, index) => this.createCardView(index));
    }

    private createCardView(index: number): CardView {
      const column = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const x = BOARD_X + column * (CARD_SIZE + CARD_GAP) + CARD_SIZE / 2;
      const y = BOARD_Y + row * (CARD_SIZE + CARD_GAP) + CARD_SIZE / 2;
      const root = this.add.container(x, y).setDepth(5);
      const face = this.add
        .rectangle(0, 0, CARD_SIZE, CARD_SIZE, 0x243249, 1)
        .setStrokeStyle(2 * WORLD_SCALE, CARD_FACE[0], 0.9);
      const glyph = this.add.graphics();
      this.drawGlyph(glyph, 0, CARD_FACE[0]);
      const back = this.add
        .rectangle(0, 0, CARD_SIZE, CARD_SIZE, COLORS.cardBack, 1)
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.cardBackInk, 0.72);
      const backMark = this.add
        .text(0, 0, "✦", {
          color: COLORS.cardBackInkText,
          fontFamily: GAME_FONT,
          fontSize: `${22 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5);
      const selection = this.add
        .rectangle(0, 0, CARD_SIZE - 5 * WORLD_SCALE, CARD_SIZE - 5 * WORLD_SCALE)
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.selection, 0.95)
        .setVisible(false);
      face.setVisible(false);
      glyph.setVisible(false);
      root.add([face, glyph, back, backMark, selection]);
      root.setSize(CARD_SIZE, CARD_SIZE).setInteractive({ useHandCursor: true });
      root.on("pointerup", () => this.selectCard(index));
      return { root, back, backMark, face, glyph, selection };
    }

    private drawGlyph(glyph: GameObjects.Graphics, pair: number, color: number) {
      const radius = 20 * WORLD_SCALE;
      const point = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
      const polygon = (sides: number, rotation = -Math.PI / 2, innerRadius = radius) =>
        Array.from({ length: sides }, (_, index) => {
          const angle = rotation + (Math.PI * 2 * index) / sides;
          return point(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
        });

      glyph.clear();
      glyph.fillStyle(color, 1);
      glyph.lineStyle(2 * WORLD_SCALE, 0xfbf7ea, 0.92);
      if (pair === 0) {
        glyph.fillCircle(0, 0, radius);
        glyph.strokeCircle(0, 0, radius);
      } else if (pair === 1) {
        const points = [point(0, -radius), point(radius, 0), point(0, radius), point(-radius, 0)];
        glyph.fillPoints(points, true);
        glyph.strokePoints(points, true);
      } else if (pair === 2) {
        glyph.fillTriangle(0, -radius, radius, radius, -radius, radius);
        glyph.strokeTriangle(0, -radius, radius, radius, -radius, radius);
      } else if (pair === 3) {
        const points = polygon(6);
        glyph.fillPoints(points, true);
        glyph.strokePoints(points, true);
      } else if (pair === 4) {
        const points = Array.from({ length: 10 }, (_, index) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 10;
          const pointRadius = index % 2 === 0 ? radius : radius * 0.44;
          return point(Math.cos(angle) * pointRadius, Math.sin(angle) * pointRadius);
        });
        glyph.fillPoints(points, true);
        glyph.strokePoints(points, true);
      } else if (pair === 5) {
        const arm = radius * 0.42;
        glyph.fillRect(-arm, -radius, arm * 2, radius * 2);
        glyph.fillRect(-radius, -arm, radius * 2, arm * 2);
      } else if (pair === 6) {
        glyph.strokeCircle(0, 0, radius * 0.8);
        glyph.fillCircle(0, 0, radius * 0.24);
      } else {
        const points = [
          point(-radius * 0.16, -radius),
          point(radius * 0.72, -radius * 0.1),
          point(radius * 0.18, -radius * 0.05),
          point(radius * 0.44, radius),
          point(-radius * 0.72, radius * 0.05),
          point(-radius * 0.12, radius * 0.02),
        ];
        glyph.fillPoints(points, true);
        glyph.strokePoints(points, true);
      }
    }

    private resetBoard() {
      this.resolveTimer?.remove();
      this.finishTimer?.remove();
      this.tweens.killAll();
      this.resolveTimer = undefined;
      this.finishTimer = undefined;
      this.status = "ready";
      this.cards = createDeck();
      this.openIndexes = [];
      this.moves = 0;
      this.pairs = 0;
      this.elapsedSeconds = 0;
      this.startedAt = 0;
      this.lastElapsed = -1;
      this.selectedIndex = 0;
      this.resolving = false;
      this.views.forEach((view, index) => {
        view.root.setScale(1);
        this.setCardVisual(index, false);
      });
      this.updateSelection();
      this.statusText?.setText("READY TO REVEAL").setColor(COLORS.ink);
      this.emitState();
    }

    private selectCard(index: number) {
      if (this.status !== "playing" || this.resolving) return;
      const card = this.cards[index];
      if (!card || card.flipped || card.matched) return;
      this.selectedIndex = index;
      this.updateSelection();
      card.flipped = true;
      this.openIndexes.push(index);
      this.flipCard(index, true);
      this.playSound("flip", 0.11);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "memory-match", action: "reveal", index });
      if (this.openIndexes.length < 2) {
        this.emitState();
        return;
      }
      this.moves += 1;
      this.resolving = true;
      this.resolveTimer = this.time.delayedCall(380, () => this.resolvePair());
      this.emitState();
    }

    private resolvePair() {
      const [firstIndex, secondIndex] = this.openIndexes;
      const first = firstIndex === undefined ? undefined : this.cards[firstIndex];
      const second = secondIndex === undefined ? undefined : this.cards[secondIndex];
      if (!first || !second) return;
      if (first.pair === second.pair) {
        first.matched = true;
        second.matched = true;
        this.pairs += 1;
        this.setCardVisual(firstIndex!, true);
        this.setCardVisual(secondIndex!, true);
        this.tweens.add({
          targets: [this.views[firstIndex!]?.root, this.views[secondIndex!]?.root],
          scale: 1.06,
          duration: 120,
          yoyo: true,
          ease: "Back.out",
        });
        this.playSound("match", 0.24);
        this.burstAt(firstIndex!, CARD_FACE[first.pair]!);
        this.burstAt(secondIndex!, CARD_FACE[second.pair]!);
        phaserEventBus.emit(PHASER_EVENTS.hit, { game: "memory-match", pair: this.pairs });
        if (this.pairs === TOTAL_PAIRS) {
          this.statusText.setText("BOARD CLEARED").setColor("#65d4a0");
          this.playSound("win", 0.2);
          phaserEventBus.emit(PHASER_EVENTS.streak, { game: "memory-match", streak: TOTAL_PAIRS });
          this.finishTimer = this.time.delayedCall(700, () => {
            this.status = "over";
            this.resolving = false;
            this.emitState();
          });
        } else {
          this.resolving = false;
        }
      } else {
        this.playSound("miss", 0.08);
        this.statusText.setText("NOT A MATCH").setColor("#e87373");
        this.time.delayedCall(560, () => {
          this.flipCard(firstIndex!, false);
          this.flipCard(secondIndex!, false);
          first.flipped = false;
          second.flipped = false;
          this.resolving = false;
          this.statusText.setText("FIND THE NEXT PAIR").setColor(COLORS.ink);
          this.emitState();
        });
      }
      this.openIndexes = [];
      this.emitState();
    }

    private flipCard(index: number, flipped: boolean) {
      const view = this.views[index];
      const card = this.cards[index];
      if (!view || !card) return;
      if (flipped) {
        view.back.setVisible(false);
        view.backMark.setVisible(false);
      } else {
        view.face.setVisible(false);
        view.glyph.setVisible(false);
      }
      this.tweens.add({
        targets: view.root,
        scaleX: 0.08,
        duration: 100,
        ease: "Cubic.in",
        onComplete: () => {
          this.setCardVisual(index, flipped);
          this.tweens.add({ targets: view.root, scaleX: 1, duration: 140, ease: "Back.out" });
        },
      });
    }

    private setCardVisual(index: number, flipped: boolean) {
      const card = this.cards[index];
      const view = this.views[index];
      if (!card || !view) return;
      const faceColor = CARD_FACE[card.pair] ?? CARD_FACE[0];
      view.face.setFillStyle(card.matched ? 0x1f4d45 : 0x243249, 1);
      view.face.setStrokeStyle(2 * WORLD_SCALE, card.matched ? COLORS.matched : faceColor, 0.95);
      this.drawGlyph(view.glyph, card.pair, faceColor);
      view.back.setVisible(!flipped && !card.matched);
      view.backMark.setVisible(!flipped && !card.matched);
      view.face.setVisible(flipped || card.matched);
      view.glyph.setVisible(flipped || card.matched);
      view.selection.setVisible(
        this.status === "playing" && index === this.selectedIndex && !card.matched,
      );
    }

    private updateSelection() {
      this.views.forEach((view, index) => {
        const card = this.cards[index];
        view.selection.setVisible(
          this.status === "playing" && index === this.selectedIndex && !card?.matched,
        );
      });
    }

    private burstAt(index: number, color: number) {
      const view = this.views[index];
      if (!view) return;
      const particles = Array.from({ length: 8 }, (_, particleIndex) => {
        const angle = (Math.PI * 2 * particleIndex) / 8;
        const circle = this.add
          .circle(view.root.x, view.root.y, 5 * WORLD_SCALE, color, 0.95)
          .setDepth(20);
        this.tweens.add({
          targets: circle,
          x: view.root.x + Math.cos(angle) * 34 * WORLD_SCALE,
          y: view.root.y + Math.sin(angle) * 34 * WORLD_SCALE,
          alpha: 0,
          scale: 0.25,
          duration: 420,
          ease: "Cubic.out",
          onComplete: () => circle.destroy(),
        });
        return circle;
      });
      void particles;
    }

    private handleKeydown(event: KeyboardEvent) {
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "Space"].includes(event.code)
      )
        return;
      event.preventDefault();
      if (event.code === "Enter" || event.code === "Space") {
        this.selectCard(this.selectedIndex);
        return;
      }
      const column = this.selectedIndex % COLUMNS;
      const row = Math.floor(this.selectedIndex / COLUMNS);
      if (event.code === "ArrowLeft") this.selectedIndex = row * COLUMNS + Math.max(0, column - 1);
      if (event.code === "ArrowRight")
        this.selectedIndex = row * COLUMNS + Math.min(COLUMNS - 1, column + 1);
      if (event.code === "ArrowUp") this.selectedIndex = Math.max(0, this.selectedIndex - COLUMNS);
      if (event.code === "ArrowDown")
        this.selectedIndex = Math.min(COLUMNS * ROWS - 1, this.selectedIndex + COLUMNS);
      this.updateSelection();
    }

    private emitState() {
      const formatted = `${String(Math.floor(this.elapsedSeconds / 60)).padStart(2, "0")}:${String(this.elapsedSeconds % 60).padStart(2, "0")}`;
      this.movesText?.setText(String(this.moves));
      this.pairsText?.setText(`${this.pairs} / ${TOTAL_PAIRS} PAIRS`);
      this.timeText?.setText(formatted);
      if (this.status === "playing" && !this.resolving)
        this.statusText?.setText("FIND THE NEXT PAIR").setColor(COLORS.ink);
      onState({
        status: this.status,
        moves: this.moves,
        pairs: this.pairs,
        totalPairs: TOTAL_PAIRS,
        elapsedSeconds: this.elapsedSeconds,
        won: this.pairs === TOTAL_PAIRS,
      } satisfies MemoryMatchGameState);
    }

    private playSound(key: string, volume: number) {
      if (this.muted || this.sound.locked || !this.cache.audio.exists(key)) return;
      try {
        this.sound.play(key, { volume });
      } catch {
        // Sound is optional.
      }
    }

    private removeInput() {
      this.input.keyboard?.off("keydown", this.handleKeydown, this);
      this.input.keyboard?.removeCapture("LEFT,RIGHT,UP,DOWN,ENTER,SPACE");
      this.resolveTimer?.remove();
      this.finishTimer?.remove();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#181528;",
    backgroundColor: "#181528",
    scene: MemoryMatchScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
  });

  return Object.assign(game, {
    startGame: () => (game.scene.getScene("memory-match") as MemoryMatchScene).startFromOverlay(),
    restartGame: () =>
      (game.scene.getScene("memory-match") as MemoryMatchScene).restartFromOverlay(),
    toggleMute: () => (game.scene.getScene("memory-match") as MemoryMatchScene).toggleMute(),
  }) as PhaserGameHandle;
};
