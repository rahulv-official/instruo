import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export type BreakoutStatus = "ready" | "playing" | "over";

export interface BreakoutGameState extends PhaserGameState {
  status: BreakoutStatus;
  score: number;
  lives: number;
  level: number;
  bricks: number;
  totalBricks: number;
  won: boolean;
}

interface BrickView {
  body: GameObjects.Image;
  color: number;
}

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 6;
const BRICK_WIDTH = 44 * WORLD_SCALE;
const BRICK_HEIGHT = 20 * WORLD_SCALE;
const BRICK_GAP = 5 * WORLD_SCALE;
const BRICK_BOARD_WIDTH = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
const BRICK_X = (WIDTH - BRICK_BOARD_WIDTH) / 2;
const BRICK_Y = 154 * WORLD_SCALE;
const PADDLE_Y = 520 * WORLD_SCALE;
const PADDLE_WIDTH = 104 * WORLD_SCALE;
const PADDLE_HEIGHT = 18 * WORLD_SCALE;
const BALL_RADIUS = 10 * WORLD_SCALE;
const PADDLE_SPEED = 420 * WORLD_SCALE;
const BALL_SPEED = 255 * WORLD_SCALE;
const LEVEL_SPEED_STEP = 0.045;
const MAX_LEVEL_SPEED = 1.55;
const LEVEL_CLEAR_BONUS = 100;
const ARENA_CENTER_Y = 336 * WORLD_SCALE;
const ARENA_HEIGHT = 420 * WORLD_SCALE;
const ARENA_WIDTH = WIDTH - 18 * WORLD_SCALE;
const ARENA_LEFT = (WIDTH - ARENA_WIDTH) / 2;
const ARENA_TOP = ARENA_CENTER_Y - ARENA_HEIGHT / 2;
const ARENA_BOTTOM = ARENA_CENTER_Y + ARENA_HEIGHT / 2;
const BEST_KEY = "instruo:breakout-best";
const GAME_FONT = "Geist, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const TOTAL_BRICKS = BRICK_COLUMNS * BRICK_ROWS;
const ASSET_ROOT = "/game-assets/kenney/puzzle-pack-1/PNG/Default";

const COLORS = {
  background: 0x101b2d,
  arena: 0x172943,
  ink: "#f9f4e6",
  muted: "#9db1c9",
  accent: 0xf4bd68,
  paddle: 0x65d4e8,
  ball: 0xf9f4e6,
  accentText: "#f4bd68",
  bricks: [0x65d4e8, 0x6f9ee8, 0xb88be8, 0xe7a6d8, 0xe87373, 0xf3a86d],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

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

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

function createLevelPattern(level: number, seed: number) {
  if (level === 1) return Array.from<boolean>({ length: TOTAL_BRICKS }).fill(true);

  const random = seededRandom((seed ^ Math.imul(level, 2_654_435_761)) >>> 0);
  const pattern = Array.from<boolean>({ length: TOTAL_BRICKS }).fill(false);
  const density = Math.min(0.86, 0.56 + level * 0.035);

  for (let row = 0; row < BRICK_ROWS; row += 1) {
    for (let column = 0; column < Math.ceil(BRICK_COLUMNS / 2); column += 1) {
      const active = random() < density || row === 0;
      const left = row * BRICK_COLUMNS + column;
      const right = row * BRICK_COLUMNS + BRICK_COLUMNS - 1 - column;
      pattern[left] = active;
      pattern[right] = active;
    }
  }

  return pattern;
}

export const createBreakoutGame: PhaserGameFactory = async (parent, onState, onReady, onError) => {
  const Phaser = (await import("phaser")).default;

  class BreakoutScene extends Phaser.Scene {
    private status: BreakoutStatus = "ready";
    private score = 0;
    private lives = 3;
    private level = 1;
    private runSeed = 0;
    private currentTotalBricks = TOTAL_BRICKS;
    private best = readBest();
    private won = false;
    private bricks: BrickView[] = [];
    private paddle!: GameObjects.Container;
    private ball!: GameObjects.Image;
    private scoreText!: GameObjects.Text;
    private livesText!: GameObjects.Text;
    private levelText!: GameObjects.Text;
    private statusText!: GameObjects.Text;
    private arenaMask?: GameObjects.Graphics;
    private ballX = WIDTH / 2;
    private ballY = PADDLE_Y - 42 * WORLD_SCALE;
    private ballVelocityX = BALL_SPEED * 0.62;
    private ballVelocityY = -BALL_SPEED;
    private paddleX = WIDTH / 2;
    private targetPaddleX = WIDTH / 2;
    private pointerActive = false;
    private leftDown = false;
    private rightDown = false;
    private waitingUntil = 0;
    private finishTimer?: { remove: () => void };
    private muted = false;

    constructor() {
      super("breakout");
    }

    preload() {
      this.load.image("breakout-brick-blue", `${ASSET_ROOT}/element_blue_rectangle_glossy.png`);
      this.load.image("breakout-brick-green", `${ASSET_ROOT}/element_green_rectangle_glossy.png`);
      this.load.image("breakout-brick-red", `${ASSET_ROOT}/element_red_rectangle_glossy.png`);
      this.load.image("breakout-brick-yellow", `${ASSET_ROOT}/element_yellow_rectangle_glossy.png`);
      this.load.image("breakout-brick-purple", `${ASSET_ROOT}/element_purple_rectangle_glossy.png`);
      this.load.image("breakout-ball", `${ASSET_ROOT}/ballBlue.png`);
      this.load.image("breakout-particle", `${ASSET_ROOT}/particleStar.png`);
      this.load.audio(
        "paddle",
        "/game-assets/kenney/impact-sounds/Audio/impactSoft_medium_001.ogg",
      );
      this.load.audio("brick", "/game-assets/kenney/impact-sounds/Audio/impactGlass_light_001.ogg");
      this.load.audio("wall", "/game-assets/kenney/interface-sounds/Audio/select_004.ogg");
      this.load.audio("miss", "/game-assets/kenney/interface-sounds/Audio/error_008.ogg");
      this.load.audio("win", "/game-assets/kenney/interface-sounds/Audio/confirmation_003.ogg");
    }

    create() {
      try {
        this.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor("#101b2d");
        this.createArt();
        this.resetBoard();
        this.input.on("pointerdown", this.handlePointerDown, this);
        this.input.on("pointermove", this.handlePointerMove, this);
        this.input.on("pointerup", this.handlePointerUp, this);
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.on("keyup", this.handleKeyup, this);
        this.input.keyboard?.addCapture("LEFT,RIGHT,A,D");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "breakout" });
        onReady();
      } catch (error) {
        this.status = "over";
        onError?.(error);
      }
    }

    override update(_time: number, delta: number) {
      if (this.status !== "playing" || this.time.now < this.waitingUntil) return;
      const seconds = Math.min(delta, 40) / 1_000;
      const direction = (this.leftDown ? -1 : 0) + (this.rightDown ? 1 : 0);
      if (direction) this.targetPaddleX += direction * PADDLE_SPEED * seconds;
      this.targetPaddleX = clamp(
        this.targetPaddleX,
        PADDLE_WIDTH / 2 + 28 * WORLD_SCALE,
        WIDTH - PADDLE_WIDTH / 2 - 28 * WORLD_SCALE,
      );
      this.paddleX += (this.targetPaddleX - this.paddleX) * Math.min(1, seconds * 16);
      this.paddle.setX(this.paddleX);

      this.ballX += this.ballVelocityX * seconds;
      this.ballY += this.ballVelocityY * seconds;
      const arenaLeft = 24 * WORLD_SCALE + BALL_RADIUS;
      const arenaRight = WIDTH - 24 * WORLD_SCALE - BALL_RADIUS;
      const arenaTop = ARENA_TOP + BALL_RADIUS;
      if (this.ballX <= arenaLeft || this.ballX >= arenaRight) {
        this.ballX = clamp(this.ballX, arenaLeft, arenaRight);
        this.ballVelocityX *= -1;
        this.playSound("wall", 0.04);
      }
      if (this.ballY <= arenaTop) {
        this.ballY = arenaTop;
        this.ballVelocityY = Math.abs(this.ballVelocityY);
        this.playSound("wall", 0.04);
      }

      const paddleTop = PADDLE_Y - PADDLE_HEIGHT / 2;
      if (
        this.ballVelocityY > 0 &&
        this.ballY + BALL_RADIUS >= paddleTop &&
        this.ballY - BALL_RADIUS <= paddleTop + PADDLE_HEIGHT &&
        Math.abs(this.ballX - this.paddleX) <= PADDLE_WIDTH / 2 + BALL_RADIUS
      ) {
        this.ballY = paddleTop - BALL_RADIUS;
        this.ballVelocityY = -Math.abs(this.ballVelocityY);
        this.ballVelocityX += (this.ballX - this.paddleX) * 2.3;
        this.ballVelocityX = clamp(this.ballVelocityX, -BALL_SPEED * 1.45, BALL_SPEED * 1.45);
        this.playSound("paddle", 0.1);
        this.tweens.add({
          targets: this.paddle,
          scaleX: 1.055,
          duration: 70,
          yoyo: true,
          ease: "Quad.out",
        });
        phaserEventBus.emit(PHASER_EVENTS.action, { game: "breakout", action: "paddle-hit" });
      }

      const hitBrick = this.bricks.find(
        (brick) => brick.body.active && this.intersectsBrick(brick.body),
      );
      if (hitBrick) {
        hitBrick.body.setActive(false).setVisible(false);
        this.score += 25;
        this.ballVelocityY *= -1;
        this.playSound("brick", 0.1);
        this.burstAt(hitBrick.body.x, hitBrick.body.y, hitBrick.color);
        phaserEventBus.emit(PHASER_EVENTS.hit, { game: "breakout", score: this.score });
        if (this.bricks.every((brick) => !brick.body.active)) this.completeLevel();
      }

      if (this.ballY + BALL_RADIUS >= ARENA_BOTTOM) this.loseLife();
      this.ball.setPosition(this.ballX, this.ballY);
    }

    startFromOverlay() {
      if (this.status !== "ready") return;
      this.status = "playing";
      this.resetBall();
      this.statusText?.setText("DRAG TO MOVE · KEEP BALL IN PLAY").setColor(COLORS.ink);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "breakout", action: "start" });
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
      this.add.text(26 * WORLD_SCALE, 28 * WORLD_SCALE, "BREAKOUT", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${21 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.add
        .text(WIDTH - 26 * WORLD_SCALE, 34 * WORLD_SCALE, "BRICK YARD", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
      this.scoreText = this.add.text(26 * WORLD_SCALE, 58 * WORLD_SCALE, "SCORE 0", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${15 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.livesText = this.add
        .text(WIDTH - 26 * WORLD_SCALE, 64 * WORLD_SCALE, "3 LIVES", {
          color: COLORS.accentText,
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(1, 0);
      this.levelText = this.add
        .text(WIDTH / 2, 64 * WORLD_SCALE, "LEVEL 1", {
          color: COLORS.accentText,
          fontFamily: GAME_FONT,
          fontSize: `${9 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0);
      this.statusText = this.add
        .text(WIDTH / 2, 92 * WORLD_SCALE, "READY TO BREAK", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${11 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.add
        .rectangle(WIDTH / 2, ARENA_CENTER_Y, ARENA_WIDTH, ARENA_HEIGHT, COLORS.arena)
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.accent, 0.3);
      this.arenaMask = this.add.graphics().setVisible(false);
      this.arenaMask.fillStyle(0xffffff, 1);
      this.arenaMask.fillRect(ARENA_LEFT, ARENA_TOP, ARENA_WIDTH, ARENA_HEIGHT);
      const mask = this.arenaMask.createGeometryMask();
      const brickTextures = [
        "breakout-brick-blue",
        "breakout-brick-green",
        "breakout-brick-red",
        "breakout-brick-yellow",
        "breakout-brick-purple",
      ];
      this.bricks = Array.from({ length: BRICK_COLUMNS * BRICK_ROWS }, (_, index) => {
        const column = index % BRICK_COLUMNS;
        const row = Math.floor(index / BRICK_COLUMNS);
        const color = COLORS.bricks[row % COLORS.bricks.length]!;
        const body = this.add
          .image(
            BRICK_X + column * (BRICK_WIDTH + BRICK_GAP) + BRICK_WIDTH / 2,
            BRICK_Y + row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_HEIGHT / 2,
            brickTextures[row % brickTextures.length]!,
          )
          .setDisplaySize(BRICK_WIDTH, BRICK_HEIGHT)
          .setDepth(4)
          .setMask(mask);
        return { body, color };
      });
      this.paddle = this.add.container(this.paddleX, PADDLE_Y).setDepth(8).setMask(mask);
      const paddleShadow = this.add
        .rectangle(
          0,
          3 * WORLD_SCALE,
          PADDLE_WIDTH + 12 * WORLD_SCALE,
          PADDLE_HEIGHT + 7 * WORLD_SCALE,
          0x061222,
          0.75,
        )
        .setOrigin(0.5);
      const paddleFrame = this.add
        .rectangle(0, 0, PADDLE_WIDTH, PADDLE_HEIGHT, 0x0b1d31, 1)
        .setStrokeStyle(2 * WORLD_SCALE, 0x8beaff, 0.9);
      const paddleFace = this.add.rectangle(
        0,
        0,
        PADDLE_WIDTH - 8 * WORLD_SCALE,
        PADDLE_HEIGHT - 6 * WORLD_SCALE,
        COLORS.paddle,
        1,
      );
      const paddleCenter = this.add.rectangle(
        0,
        0,
        PADDLE_WIDTH * 0.48,
        PADDLE_HEIGHT - 8 * WORLD_SCALE,
        0xf9f4e6,
        1,
      );
      this.paddle.add([paddleShadow, paddleFrame, paddleFace, paddleCenter]);
      this.ball = this.add
        .image(this.ballX, this.ballY, "breakout-ball")
        .setDisplaySize(BALL_RADIUS * 2, BALL_RADIUS * 2)
        .setDepth(9)
        .setMask(mask);
      this.add
        .text(WIDTH / 2, HEIGHT - 30 * WORLD_SCALE, "DRAG OR USE ← → / A D", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5, 0);
      this.add
        .text(WIDTH - 26 * WORLD_SCALE, HEIGHT - 30 * WORLD_SCALE, `BEST ${this.best}`, {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
    }

    private resetBoard() {
      this.finishTimer?.remove();
      this.finishTimer = undefined;
      this.status = "ready";
      this.score = 0;
      this.lives = 3;
      this.level = 1;
      this.runSeed = Math.floor(Math.random() * 4_294_967_296) >>> 0;
      this.won = false;
      this.waitingUntil = 0;
      this.paddleX = WIDTH / 2;
      this.targetPaddleX = this.paddleX;
      this.buildLevel();
      this.paddle?.setX(this.paddleX);
      this.resetBall();
      this.statusText?.setText("READY TO BREAK").setColor(COLORS.ink);
      this.emitState();
    }

    private buildLevel() {
      const pattern = createLevelPattern(this.level, this.runSeed);
      this.currentTotalBricks = pattern.filter(Boolean).length;
      this.bricks.forEach((brick, index) => {
        const active = pattern[index] ?? false;
        brick.body.setActive(active).setVisible(active);
      });
    }

    private resetBall(wait = false) {
      const speed = BALL_SPEED * Math.min(MAX_LEVEL_SPEED, 1 + (this.level - 1) * LEVEL_SPEED_STEP);
      this.ballX = this.paddleX;
      this.ballY = PADDLE_Y - 42 * WORLD_SCALE;
      this.ballVelocityX = (Math.random() > 0.5 ? 1 : -1) * speed * 0.62;
      this.ballVelocityY = -speed;
      this.waitingUntil = wait ? this.time.now + 520 : 0;
      this.ball?.setVisible(true).setPosition(this.ballX, this.ballY);
    }

    private intersectsBrick(brick: GameObjects.Image) {
      return (
        this.ballX + BALL_RADIUS >= brick.x - BRICK_WIDTH / 2 &&
        this.ballX - BALL_RADIUS <= brick.x + BRICK_WIDTH / 2 &&
        this.ballY + BALL_RADIUS >= brick.y - BRICK_HEIGHT / 2 &&
        this.ballY - BALL_RADIUS <= brick.y + BRICK_HEIGHT / 2
      );
    }

    private loseLife() {
      this.lives -= 1;
      this.playSound("miss", 0.12);
      if (this.lives <= 0) {
        this.endRound();
        return;
      }
      this.statusText
        .setText(`KEEP BALL IN PLAY · ${this.lives} LIVES`)
        .setColor(COLORS.accentText);
      this.resetBall(true);
      this.emitState();
    }

    private completeLevel() {
      this.score += this.level * LEVEL_CLEAR_BONUS;
      this.level += 1;
      this.buildLevel();
      this.statusText.setText(`LEVEL ${this.level}`).setColor(COLORS.accentText);
      this.playSound("win", 0.2);
      this.burstAt(WIDTH / 2, ARENA_CENTER_Y, COLORS.accent);
      phaserEventBus.emit(PHASER_EVENTS.streak, { game: "breakout", streak: this.level });
      this.resetBall(true);
      this.waitingUntil = this.time.now + 900;
      this.emitState();
    }

    private endRound() {
      this.best = Math.max(this.best, this.score);
      writeBest(this.best);
      this.ball.setVisible(false);
      this.status = "over";
      this.statusText.setText("BALL LOST").setColor("#e87373");
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "breakout", action: "game-over" });
      this.emitState();
    }

    private burstAt(x: number, y: number, color: number) {
      Array.from({ length: 10 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 10;
        const particle = this.add
          .image(x, y, "breakout-particle")
          .setDisplaySize(12 * WORLD_SCALE, 12 * WORLD_SCALE)
          .setTint(color)
          .setAlpha(0.9)
          .setDepth(20);
        this.tweens.add({
          targets: particle,
          x: x + Math.cos(angle) * 40 * WORLD_SCALE,
          y: y + Math.sin(angle) * 40 * WORLD_SCALE,
          alpha: 0,
          scale: 0.2,
          duration: 360,
          ease: "Cubic.out",
          onComplete: () => particle.destroy(),
        });
        return particle;
      });
    }

    private handlePointerDown(pointer: { x: number }) {
      this.pointerActive = true;
      this.targetPaddleX = pointer.x;
    }

    private handlePointerMove(pointer: { x: number }) {
      if (this.pointerActive || this.status === "playing") this.targetPaddleX = pointer.x;
    }

    private handlePointerUp() {
      this.pointerActive = false;
    }

    private handleKeydown(event: KeyboardEvent) {
      if (!["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)) return;
      event.preventDefault();
      if (event.code === "ArrowLeft" || event.code === "KeyA") this.leftDown = true;
      if (event.code === "ArrowRight" || event.code === "KeyD") this.rightDown = true;
    }

    private handleKeyup(event: KeyboardEvent) {
      if (event.code === "ArrowLeft" || event.code === "KeyA") this.leftDown = false;
      if (event.code === "ArrowRight" || event.code === "KeyD") this.rightDown = false;
    }

    private emitState() {
      this.scoreText?.setText(`SCORE ${this.score}`);
      this.livesText?.setText(`${this.lives} LIVES`);
      this.levelText?.setText(`LEVEL ${this.level}`);
      onState({
        status: this.status,
        score: this.score,
        lives: this.lives,
        level: this.level,
        bricks: this.bricks.filter((brick) => brick.body.active).length,
        totalBricks: this.currentTotalBricks,
        won: this.won,
      } satisfies BreakoutGameState);
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
      this.input.off("pointerdown", this.handlePointerDown, this);
      this.input.off("pointermove", this.handlePointerMove, this);
      this.input.off("pointerup", this.handlePointerUp, this);
      this.input.keyboard?.off("keydown", this.handleKeydown, this);
      this.input.keyboard?.off("keyup", this.handleKeyup, this);
      this.input.keyboard?.removeCapture("LEFT,RIGHT,A,D");
      this.finishTimer?.remove();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#101b2d;",
    backgroundColor: "#101b2d",
    scene: BreakoutScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
  });

  return Object.assign(game, {
    startGame: () => (game.scene.getScene("breakout") as BreakoutScene).startFromOverlay(),
    restartGame: () => (game.scene.getScene("breakout") as BreakoutScene).restartFromOverlay(),
    toggleMute: () => (game.scene.getScene("breakout") as BreakoutScene).toggleMute(),
  }) as PhaserGameHandle;
};
