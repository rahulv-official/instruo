import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export interface FlappyBirdState extends PhaserGameState {
  status: "ready" | "playing" | "over";
  score: number;
  best: number;
}

interface PipePair {
  top: GameObjects.Rectangle;
  bottom: GameObjects.Rectangle;
  x: number;
  gapTop: number;
  gapBottom: number;
  scored: boolean;
}

const GAME_FONT = "Manrope, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const GROUND_Y = HEIGHT - 54 * WORLD_SCALE;
const BIRD_X = 112 * WORLD_SCALE;
const BIRD_RADIUS = 16 * WORLD_SCALE;
const PIPE_WIDTH = 64 * WORLD_SCALE;
const PIPE_GAP = 176 * WORLD_SCALE;
const PIPE_SPEED = 188 * WORLD_SCALE;
const GRAVITY = 980 * WORLD_SCALE;
const FLAP_VELOCITY = -350 * WORLD_SCALE;
const BEST_KEY = "instruo:flappy-bird-best";
const HUD_DEPTH = 100;

/* eslint-disable unicorn/number-literal-case */
const COLORS = {
  sky: 0xb9e6f3,
  skyDeep: 0x66b8d7,
  cloud: 0xffffff,
  ink: 0x17324c,
  mutedInk: 0x32627b,
  bird: 0xf5a83d,
  birdDark: 0xd35e2b,
  pipe: 0x4fbd77,
  pipeDark: 0x28734d,
  ground: 0x385a65,
  groundAccent: 0xf4bd68,
  panel: 0xfff6dc,
};
/* eslint-enable unicorn/number-literal-case */

function readBest() {
  try {
    return Number.parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function writeBest(best: number) {
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    // Best score is useful, never required.
  }
}

export const createFlappyBirdGame: PhaserGameFactory = async (
  parent,
  onState,
  onReady,
  onError,
) => {
  const Phaser = (await import("phaser")).default;

  class FlappyScene extends Phaser.Scene {
    private bird!: GameObjects.Arc;
    private wing!: GameObjects.Ellipse;
    private eye!: GameObjects.Arc;
    private scoreText!: GameObjects.Text;
    private bestText!: GameObjects.Text;
    private pipes: PipePair[] = [];
    private status: FlappyBirdState["status"] = "ready";
    private score = 0;
    private best = readBest();
    private birdY = HEIGHT / 2;
    private velocity = 0;
    private pipeTimer = 950;

    constructor() {
      super("flappy-bird");
    }

    preload() {
      this.load.audio("flap", "/game-assets/kenney/interface-sounds/Audio/select_004.ogg");
      this.load.audio("score", "/game-assets/kenney/interface-sounds/Audio/toggle_001.ogg");
      this.load.audio("hit", "/game-assets/kenney/impact-sounds/Audio/impactWood_heavy_001.ogg");
    }

    create() {
      try {
        // The larger logical world is the camera's native viewport. Let the
        // host scale it responsively instead of zooming a smaller scene.
        this.cameras.main.setZoom(1).setScroll(0, 0);
        this.cameras.main.setBackgroundColor("#b9e6f3");
        this.createSceneArt();
        this.createBird();
        this.resetRound();
        this.input.on("pointerdown", this.handleTap, this);
        this.input.keyboard?.on("keydown-SPACE", this.flap, this);
        this.input.keyboard?.on("keydown-ENTER", this.handleEnter, this);
        this.input.keyboard?.addCapture("SPACE");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "flappy-bird" });
        onReady();
      } catch (error) {
        // Stop the scene loop before showing the fallback. Otherwise the
        // ready-state bob can keep touching partially-created game objects.
        this.status = "over";
        onError?.(error);
        this.cameras.main.setBackgroundColor("#b9e6f3");
        this.add
          .text(WIDTH / 2, HEIGHT / 2, "GAME COULD NOT LOAD", {
            color: "#17324c",
            fontFamily: GAME_FONT,
            fontSize: `${16 * WORLD_SCALE}px`,
            fontStyle: "bold",
          })
          .setOrigin(0.5);
      }
    }

    override update(_time: number, delta: number) {
      if (this.status === "ready") {
        const bob = Math.sin(this.time.now / 260) * 7;
        this.setBirdY(HEIGHT / 2 + bob);
        return;
      }
      if (this.status !== "playing") return;

      const step = Math.min(delta, 40) / 1000;
      this.velocity += GRAVITY * step;
      this.setBirdY(this.birdY + this.velocity * step);
      this.bird.angle = Math.max(-22, Math.min(82, this.velocity / 8));
      this.wing.angle = this.bird.angle;

      this.pipeTimer -= delta;
      if (this.pipeTimer <= 0) {
        this.spawnPipe();
        this.pipeTimer = 1_520;
      }

      for (const pipe of this.pipes) {
        pipe.x -= PIPE_SPEED * step;
        pipe.top.x = pipe.x;
        pipe.bottom.x = pipe.x;

        if (!pipe.scored && pipe.x + PIPE_WIDTH / 2 < BIRD_X - BIRD_RADIUS) {
          pipe.scored = true;
          this.score += 1;
          this.scoreText.setText(String(this.score));
          this.tweens.add({ targets: this.scoreText, scale: 1.12, duration: 90, yoyo: true });
          this.playSound("score", 0.18);
          this.emitState();
        }

        const overlapsX =
          pipe.x - PIPE_WIDTH / 2 < BIRD_X + BIRD_RADIUS &&
          pipe.x + PIPE_WIDTH / 2 > BIRD_X - BIRD_RADIUS;
        const hitsPipe =
          this.birdY - BIRD_RADIUS < pipe.gapTop || this.birdY + BIRD_RADIUS > pipe.gapBottom;

        if (overlapsX && hitsPipe) {
          this.endRound();
          return;
        }
      }

      this.pipes = this.pipes.filter((pipe) => {
        if (pipe.x < -PIPE_WIDTH) {
          pipe.top.destroy();
          pipe.bottom.destroy();
          return false;
        }
        return true;
      });

      if (this.birdY - BIRD_RADIUS <= 0 || this.birdY + BIRD_RADIUS >= GROUND_Y) {
        this.endRound();
      }
    }

    public startFromOverlay() {
      if (this.status === "ready") this.startRound();
    }

    public restartFromOverlay() {
      this.resetRound();
      this.startRound();
    }

    private createSceneArt() {
      this.addToWorld(
        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.sky),
      ).setDepth(0);
      this.addToWorld(
        this.add.circle(64 * WORLD_SCALE, 116 * WORLD_SCALE, 56 * WORLD_SCALE, COLORS.cloud, 0.78),
      ).setDepth(1);
      this.addToWorld(
        this.add.circle(103 * WORLD_SCALE, 106 * WORLD_SCALE, 38 * WORLD_SCALE, COLORS.cloud, 0.78),
      ).setDepth(1);
      this.addToWorld(
        this.add.circle(143 * WORLD_SCALE, 126 * WORLD_SCALE, 54 * WORLD_SCALE, COLORS.cloud, 0.78),
      ).setDepth(1);
      this.addToWorld(
        this.add.circle(329 * WORLD_SCALE, 142 * WORLD_SCALE, 52 * WORLD_SCALE, COLORS.cloud, 0.64),
      ).setDepth(1);
      this.addToWorld(
        this.add.circle(369 * WORLD_SCALE, 156 * WORLD_SCALE, 70 * WORLD_SCALE, COLORS.cloud, 0.64),
      ).setDepth(1);
      this.addToWorld(
        this.add.rectangle(
          WIDTH / 2,
          286 * WORLD_SCALE,
          WIDTH,
          2 * WORLD_SCALE,
          COLORS.skyDeep,
          0.22,
        ),
      ).setDepth(1);
      this.addToWorld(
        this.add.rectangle(
          WIDTH / 2,
          GROUND_Y + 27 * WORLD_SCALE,
          WIDTH,
          54 * WORLD_SCALE,
          COLORS.ground,
        ),
      ).setDepth(5);
      this.addToWorld(
        this.add.rectangle(WIDTH / 2, GROUND_Y, WIDTH, 7 * WORLD_SCALE, COLORS.groundAccent),
      ).setDepth(6);

      this.addToWorld(
        this.add
          .text(24 * WORLD_SCALE, 22 * WORLD_SCALE, "SKYBOUND", {
            color: "#17324c",
            fontFamily: GAME_FONT,
            fontSize: `${17 * WORLD_SCALE}px`,
            fontStyle: "bold",
          })
          .setDepth(HUD_DEPTH),
      );
      this.addToWorld(
        this.add
          .text(WIDTH - 24 * WORLD_SCALE, 27 * WORLD_SCALE, "FLAPPY BIRD", {
            color: "#32627b",
            fontFamily: GAME_FONT,
            fontSize: `${9 * WORLD_SCALE}px`,
          })
          .setOrigin(1, 0)
          .setDepth(HUD_DEPTH),
      );

      const scorePlate = this.addToWorld(
        this.add.rectangle(
          WIDTH / 2,
          98 * WORLD_SCALE,
          126 * WORLD_SCALE,
          88 * WORLD_SCALE,
          COLORS.panel,
          0.94,
        ),
      );
      scorePlate.setStrokeStyle(2 * WORLD_SCALE, COLORS.ink, 0.12).setDepth(HUD_DEPTH);
      this.scoreText = this.addToWorld(
        this.add
          .text(WIDTH / 2, 68 * WORLD_SCALE, "0", {
            color: "#17324c",
            fontFamily: GAME_FONT,
            fontSize: `${42 * WORLD_SCALE}px`,
            fontStyle: "bold",
          })
          .setOrigin(0.5, 0)
          .setDepth(HUD_DEPTH + 1),
      );
      this.bestText = this.addToWorld(
        this.add
          .text(WIDTH / 2, 118 * WORLD_SCALE, `BEST  ${this.best}`, {
            color: "#32627b",
            fontFamily: GAME_FONT,
            fontSize: `${10 * WORLD_SCALE}px`,
            letterSpacing: 1 * WORLD_SCALE,
          })
          .setOrigin(0.5)
          .setDepth(HUD_DEPTH + 1),
      );

      const hintY = HEIGHT - 30 * WORLD_SCALE;
      const hint = this.addToWorld(
        this.add.rectangle(
          WIDTH / 2,
          hintY,
          246 * WORLD_SCALE,
          34 * WORLD_SCALE,
          COLORS.panel,
          0.94,
        ),
      );
      hint.setStrokeStyle(1 * WORLD_SCALE, COLORS.ink, 0.16).setDepth(HUD_DEPTH);
      this.addToWorld(
        this.add
          .text(WIDTH / 2, hintY, "CLICK  /  SPACE  TO FLAP", {
            color: "#17324c",
            fontFamily: GAME_FONT,
            fontSize: `${9 * WORLD_SCALE}px`,
          })
          .setOrigin(0.5)
          .setDepth(HUD_DEPTH + 1),
      );
    }

    private createBird() {
      this.bird = this.addToWorld(this.add.circle(BIRD_X, this.birdY, BIRD_RADIUS, COLORS.bird));
      this.bird.setStrokeStyle(3 * WORLD_SCALE, COLORS.birdDark).setDepth(20);
      this.wing = this.addToWorld(
        this.add.ellipse(
          BIRD_X - 7 * WORLD_SCALE,
          this.birdY + 5 * WORLD_SCALE,
          14 * WORLD_SCALE,
          8 * WORLD_SCALE,
          COLORS.birdDark,
        ),
      );
      this.wing.setDepth(20);
      this.eye = this.addToWorld(
        this.add.circle(
          BIRD_X + 7 * WORLD_SCALE,
          this.birdY - 5 * WORLD_SCALE,
          3 * WORLD_SCALE,
          COLORS.ink,
        ),
      );
      this.eye.setDepth(21);
    }

    private addToWorld<T extends GameObjects.GameObject>(object: T) {
      return object;
    }

    private resetRound() {
      for (const pipe of this.pipes) {
        pipe.top.destroy();
        pipe.bottom.destroy();
      }
      this.pipes = [];
      this.status = "ready";
      this.score = 0;
      this.birdY = HEIGHT / 2;
      this.velocity = 0;
      this.pipeTimer = 950;
      this.setBirdY(this.birdY);
      this.bird.angle = 0;
      this.wing.angle = 0;
      this.scoreText.setText("0");
      this.bestText.setText(`BEST  ${this.best}`);
      this.emitState();
    }

    private startRound() {
      this.status = "playing";
      this.velocity = FLAP_VELOCITY;
      this.playSound("flap", 0.16);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "flappy-bird", action: "start" });
      this.emitState();
    }

    private flap() {
      if (this.status === "ready") {
        this.startRound();
        return;
      }
      if (this.status === "over") {
        this.restartFromOverlay();
        return;
      }
      if (this.status !== "playing") return;
      this.velocity = FLAP_VELOCITY;
      this.playSound("flap", 0.16);
    }

    private handleTap() {
      if (this.status === "playing") this.flap();
    }

    private handleEnter() {
      if (this.status === "ready") this.startRound();
      else if (this.status === "over") this.restartFromOverlay();
    }

    private setBirdY(value: number) {
      this.birdY = value;
      this.bird.y = value;
      this.wing.y = value + 5 * WORLD_SCALE;
      this.eye.y = value - 5 * WORLD_SCALE;
    }

    private spawnPipe() {
      const gapTop = Phaser.Math.Between(146 * WORLD_SCALE, GROUND_Y - PIPE_GAP - 44 * WORLD_SCALE);
      const gapBottom = gapTop + PIPE_GAP;
      const x = WIDTH + PIPE_WIDTH;
      const topHeight = gapTop;
      const bottomHeight = GROUND_Y - gapBottom;
      const top = this.addToWorld(
        this.add.rectangle(x, topHeight / 2, PIPE_WIDTH, topHeight, COLORS.pipe),
      );
      const bottom = this.addToWorld(
        this.add.rectangle(x, gapBottom + bottomHeight / 2, PIPE_WIDTH, bottomHeight, COLORS.pipe),
      );
      top.setStrokeStyle(3 * WORLD_SCALE, COLORS.pipeDark);
      bottom.setStrokeStyle(3 * WORLD_SCALE, COLORS.pipeDark);
      top.setDepth(10);
      bottom.setDepth(10);
      this.pipes.push({ top, bottom, x, gapTop, gapBottom, scored: false });
    }

    private endRound() {
      if (this.status !== "playing") return;
      this.status = "over";
      this.playSound("hit", 0.22);
      if (this.score > this.best) {
        this.best = this.score;
        writeBest(this.best);
        this.bestText.setText(`BEST  ${this.best}`);
      }
      phaserEventBus.emit(PHASER_EVENTS.hit, { game: "flappy-bird", score: this.score });
      this.emitState();
    }

    private emitState() {
      const state: FlappyBirdState = {
        status: this.status,
        score: this.score,
        best: this.best,
      };
      onState(state);
    }

    private playSound(key: string, volume: number) {
      if (this.sound.locked || !this.cache.audio.exists(key)) return;
      try {
        this.sound.play(key, { volume });
      } catch {
        // Audio is a progressive enhancement; never interrupt a run for it.
      }
    }

    private removeInput() {
      this.input.off("pointerdown", this.handleTap, this);
      this.input.keyboard?.off("keydown-SPACE", this.flap, this);
      this.input.keyboard?.off("keydown-ENTER", this.handleEnter, this);
      this.input.keyboard?.removeCapture("SPACE");
    }
  }

  const game = new Phaser.Game({
    // A larger logical canvas keeps the pixel-art scene crisp while FIT
    // scales it into the responsive host.
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#b9e6f3;",
    backgroundColor: "#b9e6f3",
    scene: FlappyScene,
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
      const scene = game.scene.getScene("flappy-bird") as FlappyScene;
      scene.startFromOverlay();
    },
    restartGame: () => {
      const scene = game.scene.getScene("flappy-bird") as FlappyScene;
      scene.restartFromOverlay();
    },
  }) as PhaserGameHandle;
};
