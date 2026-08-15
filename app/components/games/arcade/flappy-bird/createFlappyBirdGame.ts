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
  top: GameObjects.Image;
  bottom: GameObjects.Image;
  x: number;
  gapTop: number;
  gapBottom: number;
  scored: boolean;
}

const GAME_FONT = "Geist, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const GROUND_Y = HEIGHT - 54 * WORLD_SCALE;
const BIRD_X = 112 * WORLD_SCALE;
const BIRD_RADIUS = 18 * WORLD_SCALE;
const PIPE_WIDTH = 108 * WORLD_SCALE;
const PIPE_TIP_WIDTH_RATIO = 0.1;
const PIPE_GAP = 176 * WORLD_SCALE;
const PIPE_SPEED = 188 * WORLD_SCALE;
const GRAVITY = 980 * WORLD_SCALE;
const FLAP_VELOCITY = -350 * WORLD_SCALE;
const BEST_KEY = "instruo:flappy-bird-best";
const HUD_DEPTH = 100;
const ASSET_ROOT = "/game-assets/kenney/tappy-plane/PNG";
const PARTICLE_ROOT = "/game-assets/kenney/particle-pack/PNG%20(Transparent)";

const COLORS = {
  skyDeep: 0x66b8d7,
  ink: 0x17324c,
  ground: 0x385a65,
  panel: 0xfff6dc,
};

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
    private bird!: GameObjects.Image;
    private scoreText!: GameObjects.Text;
    private bestText!: GameObjects.Text;
    private ground!: GameObjects.TileSprite;
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
      this.load.image("flappy-background", `${ASSET_ROOT}/background.png`);
      this.load.image("flappy-ground", `${ASSET_ROOT}/groundGrass.png`);
      this.load.image("flappy-rock-up", `${ASSET_ROOT}/rockGrassDown.png`);
      this.load.image("flappy-rock-down", `${ASSET_ROOT}/rockGrass.png`);
      this.load.image("flappy-star", `${ASSET_ROOT}/starGold.png`);
      this.load.image(
        "flappy-bird",
        "/game-assets/kenney/animal-pack/PNG/Round%20(outline)/parrot.png",
      );
      this.load.image("flappy-particle-spark", `${PARTICLE_ROOT}/spark_01.png`);
      this.load.image("flappy-particle-circle", `${PARTICLE_ROOT}/circle_01.png`);
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
      this.bird.angle = Math.max(-16, Math.min(28, this.velocity / 10));
      this.ground.tilePositionX += PIPE_SPEED * step;

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

        if (this.hitsRock(pipe)) {
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
        this.add
          .image(WIDTH / 2, HEIGHT / 2, "flappy-background")
          .setDisplaySize((HEIGHT * 800) / 480, HEIGHT),
      ).setDepth(0);
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
          GROUND_Y + 48 * WORLD_SCALE,
          WIDTH,
          96 * WORLD_SCALE,
          COLORS.ground,
        ),
      ).setDepth(5);
      this.ground = this.addToWorld(
        this.add
          .tileSprite(
            WIDTH / 2,
            GROUND_Y + 44 * WORLD_SCALE,
            WIDTH,
            88 * WORLD_SCALE,
            "flappy-ground",
          )
          .setDepth(6),
      );

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
      this.addToWorld(
        this.add
          .image(WIDTH / 2 - 48 * WORLD_SCALE, 98 * WORLD_SCALE, "flappy-star")
          .setDisplaySize(22 * WORLD_SCALE, 22 * WORLD_SCALE)
          .setDepth(HUD_DEPTH + 1),
      );
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
      this.bird = this.addToWorld(
        this.add
          .image(BIRD_X, this.birdY, "flappy-bird")
          .setDisplaySize(36 * WORLD_SCALE, 36 * WORLD_SCALE)
          .setDepth(20),
      );
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
      this.scoreText.setText("0");
      this.bestText.setText(`BEST  ${this.best}`);
      this.emitState();
    }

    private startRound() {
      this.status = "playing";
      this.velocity = FLAP_VELOCITY;
      this.playSound("flap", 0.16);
      this.burstAt(
        BIRD_X - 28 * WORLD_SCALE,
        this.birdY + 6 * WORLD_SCALE,
        "flappy-particle-spark",
        4,
      );
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
      this.burstAt(
        BIRD_X - 28 * WORLD_SCALE,
        this.birdY + 6 * WORLD_SCALE,
        "flappy-particle-spark",
        3,
      );
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
    }

    private spawnPipe() {
      const gapTop = Phaser.Math.Between(146 * WORLD_SCALE, GROUND_Y - PIPE_GAP - 44 * WORLD_SCALE);
      const gapBottom = gapTop + PIPE_GAP;
      const x = WIDTH + PIPE_WIDTH;
      const topHeight = gapTop;
      const bottomHeight = GROUND_Y - gapBottom;
      const top = this.addToWorld(
        this.add
          .image(x, topHeight / 2, "flappy-rock-up")
          .setDisplaySize(PIPE_WIDTH, Math.max(topHeight, 1))
          .setOrigin(0.5),
      );
      const bottom = this.addToWorld(
        this.add
          .image(x, gapBottom + bottomHeight / 2, "flappy-rock-down")
          .setDisplaySize(PIPE_WIDTH, Math.max(bottomHeight, 1))
          .setOrigin(0.5),
      );
      top.setDepth(10);
      bottom.setDepth(10);
      this.pipes.push({ top, bottom, x, gapTop, gapBottom, scored: false });
    }

    private hitsRock(pipe: PipePair) {
      const samples = [this.birdY - BIRD_RADIUS, this.birdY, this.birdY + BIRD_RADIUS];
      return samples.some((sampleY) => {
        if (sampleY < pipe.gapTop) {
          const progress = Phaser.Math.Clamp(sampleY / pipe.gapTop, 0, 1);
          const widthRatio = 1 - (1 - PIPE_TIP_WIDTH_RATIO) * progress;
          return this.overlapsRockWidth(pipe, PIPE_WIDTH * widthRatio);
        }

        if (sampleY > pipe.gapBottom) {
          const height = GROUND_Y - pipe.gapBottom;
          const progress = Phaser.Math.Clamp((sampleY - pipe.gapBottom) / height, 0, 1);
          const widthRatio = PIPE_TIP_WIDTH_RATIO + (1 - PIPE_TIP_WIDTH_RATIO) * progress;
          return this.overlapsRockWidth(pipe, PIPE_WIDTH * widthRatio);
        }

        return false;
      });
    }

    private overlapsRockWidth(pipe: PipePair, width: number) {
      return Math.abs(BIRD_X - pipe.x) < width / 2 + BIRD_RADIUS;
    }

    private endRound() {
      if (this.status !== "playing") return;
      this.status = "over";
      this.playSound("hit", 0.22);
      this.burstAt(BIRD_X, this.birdY, "flappy-particle-circle", 9);
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

    private burstAt(x: number, y: number, texture: string, count: number) {
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count;
        const distance = Phaser.Math.Between(22, 48) * WORLD_SCALE;
        const particle = this.add
          .image(x, y, texture)
          .setDisplaySize(18 * WORLD_SCALE, 18 * WORLD_SCALE)
          .setDepth(24)
          .setAlpha(0.9);
        this.tweens.add({
          targets: particle,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          angle: Phaser.Math.Between(-90, 90),
          alpha: 0,
          scale: 0.35,
          duration: 360,
          ease: "Cubic.easeOut",
          onComplete: () => particle.destroy(),
        });
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
      smoothPixelArt: true,
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
