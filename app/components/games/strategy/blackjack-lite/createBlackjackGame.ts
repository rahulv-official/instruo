import type { GameObjects } from "phaser";

import type { PhaserGameFactory, PhaserGameHandle, PhaserGameState } from "~/core/phaser/types";
import {
  PHASER_GAME_HEIGHT as HEIGHT,
  PHASER_GAME_WIDTH as WIDTH,
  PHASER_GAME_SCALE as WORLD_SCALE,
} from "~/core/phaser/constants";
import { PHASER_EVENTS, phaserEventBus } from "~/core/phaser/EventBus";

export type BlackjackStatus = "ready" | "playing" | "over";

export interface BlackjackGameState extends PhaserGameState {
  status: BlackjackStatus;
  dealing: boolean;
  playerScore: number;
  dealerScore: number;
  playerCards: number;
  dealerCards: number;
  result: string;
}

interface Card {
  rank: string;
  suit: string;
  value: number;
}

interface CardVisual {
  root: GameObjects.Container;
  face: GameObjects.Rectangle;
  back: GameObjects.Rectangle;
  rank: GameObjects.Text;
  suit: GameObjects.Text;
  backMark: GameObjects.Text;
  card: Card;
  hidden: boolean;
}

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = [
  ["A", 11],
  ["2", 2],
  ["3", 3],
  ["4", 4],
  ["5", 5],
  ["6", 6],
  ["7", 7],
  ["8", 8],
  ["9", 9],
  ["10", 10],
  ["J", 10],
  ["Q", 10],
  ["K", 10],
] as const;
const CARD_WIDTH = 66 * WORLD_SCALE;
const CARD_HEIGHT = 94 * WORLD_SCALE;
const DEALER_Y = 190 * WORLD_SCALE;
const PLAYER_Y = 430 * WORLD_SCALE;
const DECK_X = WIDTH - 42 * WORLD_SCALE;
const DECK_Y = 82 * WORLD_SCALE;
const GAME_FONT = '"Kenney Future", Manrope, system-ui, sans-serif';

/* eslint-disable unicorn/number-literal-case */
const COLORS = {
  felt: 0x12433b,
  feltLight: 0x1d5c4e,
  feltDark: 0x0a2d29,
  ink: "#fff3d5",
  muted: "#a8c8bb",
  gold: "#f4bd68",
  goldFill: 0xf4bd68,
  red: "#d96c61",
  card: 0xfff7e8,
  cardEdge: 0xd7c7a7,
  back: 0x163f54,
  backInk: 0x6fb6b4,
  win: 0x65d4a0,
  winText: "#65d4a0",
};
/* eslint-enable unicorn/number-literal-case */

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

function freshDeck() {
  return shuffle(SUITS.flatMap((suit) => RANKS.map(([rank, value]) => ({ rank, suit, value }))));
}

function score(cards: Card[]) {
  let total = cards.reduce((sum, card) => sum + card.value, 0);
  let aces = cards.filter((card) => card.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

export const createBlackjackGame: PhaserGameFactory = async (parent, onState, onReady, onError) => {
  const Phaser = (await import("phaser")).default;

  class BlackjackScene extends Phaser.Scene {
    private deck: Card[] = [];
    private player: Card[] = [];
    private dealer: Card[] = [];
    private playerViews: CardVisual[] = [];
    private dealerViews: CardVisual[] = [];
    private status: BlackjackStatus = "ready";
    private dealing = false;
    private result = "";
    private muted = false;
    private timers: Array<{ remove: () => void }> = [];
    private statusText!: GameObjects.Text;
    private dealerScoreText!: GameObjects.Text;
    private playerScoreText!: GameObjects.Text;
    private dealerLabel!: GameObjects.Text;
    private playerLabel!: GameObjects.Text;
    private shoeText!: GameObjects.Text;

    constructor() {
      super("blackjack");
    }

    preload() {
      const root = "/game-assets/kenney/casino-audio/Audio";
      this.load.audio("deal", `${root}/card-place-2.ogg`);
      this.load.audio("slide", `${root}/card-slide-3.ogg`);
      this.load.audio("chip", `${root}/chip-lay-1.ogg`);
      this.load.audio("reveal", `${root}/card-shove-2.ogg`);
      this.load.audio("win", `${root}/chips-collide-2.ogg`);
      this.load.audio("lose", `${root}/card-shove-1.ogg`);
    }

    create() {
      try {
        this.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor("#0a2d29");
        this.createArt();
        this.resetRound();
        this.input.keyboard?.on("keydown", this.handleKeydown, this);
        this.input.keyboard?.addCapture("H,S,ENTER,SPACE,N");
        this.events.once("shutdown", this.removeInput, this);
        phaserEventBus.emit(PHASER_EVENTS.entrance, { game: "blackjack" });
        onReady();
      } catch (error) {
        onError?.(error);
      }
    }

    startFromOverlay() {
      if (this.status === "playing") return;
      this.resetRound();
      this.status = "playing";
      this.dealing = true;
      this.statusText.setText("DEALING THE HAND").setColor(COLORS.ink);
      this.playSound("chip", 0.12);
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "blackjack", action: "deal" });
      const openingDeal: Array<["player" | "dealer", boolean]> = [
        ["player", false],
        ["dealer", false],
        ["player", false],
        ["dealer", true],
      ];
      openingDeal.forEach(([hand, hidden], index) => {
        this.addTimer(index * 280, () => this.dealCard(hand, hidden));
      });
      this.addTimer(openingDeal.length * 280 + 340, () => {
        this.dealing = false;
        if (score(this.player) === 21) this.stand();
        else {
          this.statusText.setText("YOUR MOVE");
          this.emitState();
        }
      });
      this.emitState();
    }

    restartFromOverlay() {
      this.startFromOverlay();
    }

    takeAction(action: unknown) {
      if (action === "hit") this.hit();
      if (action === "stand") this.stand();
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    private createArt() {
      this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.feltDark);
      this.add.rectangle(
        WIDTH / 2,
        HEIGHT / 2,
        WIDTH - 28 * WORLD_SCALE,
        HEIGHT - 30 * WORLD_SCALE,
        COLORS.felt,
      );
      this.add.rectangle(
        WIDTH / 2,
        356 * WORLD_SCALE,
        WIDTH - 64 * WORLD_SCALE,
        2 * WORLD_SCALE,
        COLORS.feltLight,
        0.7,
      );
      this.add.circle(46 * WORLD_SCALE, 72 * WORLD_SCALE, 64 * WORLD_SCALE, COLORS.goldFill, 0.08);
      this.add.circle(
        WIDTH - 38 * WORLD_SCALE,
        HEIGHT - 108 * WORLD_SCALE,
        100 * WORLD_SCALE,
        COLORS.goldFill,
        0.06,
      );

      this.add.text(28 * WORLD_SCALE, 20 * WORLD_SCALE, "BLACKJACK", {
        color: COLORS.ink,
        fontFamily: GAME_FONT,
        fontSize: `${19 * WORLD_SCALE}px`,
        fontStyle: "bold",
      });
      this.add
        .text(WIDTH - 28 * WORLD_SCALE, 28 * WORLD_SCALE, "FELT TABLE", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${8 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);

      this.statusText = this.add
        .text(WIDTH / 2, 92 * WORLD_SCALE, "READY FOR DEAL", {
          color: COLORS.ink,
          fontFamily: GAME_FONT,
          fontSize: `${11 * WORLD_SCALE}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      this.dealerLabel = this.add.text(28 * WORLD_SCALE, 128 * WORLD_SCALE, "DEALER", {
        color: COLORS.muted,
        fontFamily: GAME_FONT,
        fontSize: `${9 * WORLD_SCALE}px`,
      });
      this.dealerScoreText = this.add
        .text(WIDTH - 28 * WORLD_SCALE, 128 * WORLD_SCALE, "—", {
          color: COLORS.gold,
          fontFamily: GAME_FONT,
          fontSize: `${12 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);
      this.playerLabel = this.add.text(28 * WORLD_SCALE, 368 * WORLD_SCALE, "PLAYER", {
        color: COLORS.muted,
        fontFamily: GAME_FONT,
        fontSize: `${9 * WORLD_SCALE}px`,
      });
      this.playerScoreText = this.add
        .text(WIDTH - 28 * WORLD_SCALE, 368 * WORLD_SCALE, "—", {
          color: COLORS.gold,
          fontFamily: GAME_FONT,
          fontSize: `${12 * WORLD_SCALE}px`,
        })
        .setOrigin(1, 0);

      this.add
        .rectangle(
          DECK_X,
          DECK_Y,
          CARD_WIDTH + 8 * WORLD_SCALE,
          CARD_HEIGHT + 8 * WORLD_SCALE,
          COLORS.back,
          0.9,
        )
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.goldFill, 0.45)
        .setDepth(1);
      this.add
        .text(DECK_X, DECK_Y, "♠", {
          color: "#8bcac2",
          fontFamily: GAME_FONT,
          fontSize: `${25 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5)
        .setDepth(2);
      this.shoeText = this.add
        .text(DECK_X, 148 * WORLD_SCALE, "SHOE", {
          color: COLORS.muted,
          fontFamily: GAME_FONT,
          fontSize: `${7 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5);

      this.createChipStack();
      this.add
        .text(
          WIDTH / 2,
          HEIGHT - 36 * WORLD_SCALE,
          "HIT  H  ·  STAND  S  ·  SPACE HITS  ·  ENTER STANDS",
          {
            color: COLORS.muted,
            fontFamily: GAME_FONT,
            fontSize: `${7 * WORLD_SCALE}px`,
          },
        )
        .setOrigin(0.5);
    }

    /* eslint-disable unicorn/number-literal-case */
    private createChipStack() {
      const x = 44 * WORLD_SCALE;
      const y = HEIGHT - 92 * WORLD_SCALE;
      [0xf4bd68, 0xd96c61, 0x65d4a0].forEach((color, index) => {
        this.add
          .circle(
            x + index * 14 * WORLD_SCALE,
            y - index * 5 * WORLD_SCALE,
            13 * WORLD_SCALE,
            color,
            0.95,
          )
          .setStrokeStyle(2 * WORLD_SCALE, 0xfff3d5, 0.6)
          .setDepth(2);
      });
      this.add.text(x + 48 * WORLD_SCALE, y - 11 * WORLD_SCALE, "TABLE 21", {
        color: COLORS.muted,
        fontFamily: GAME_FONT,
        fontSize: `${7 * WORLD_SCALE}px`,
      });
    }
    /* eslint-enable unicorn/number-literal-case */

    private resetRound() {
      this.timers.forEach((timer) => timer.remove());
      this.timers = [];
      [...this.playerViews, ...this.dealerViews].forEach((view) => view.root.destroy());
      this.playerViews = [];
      this.dealerViews = [];
      this.deck = freshDeck();
      this.player = [];
      this.dealer = [];
      this.status = "ready";
      this.dealing = false;
      this.result = "";
      this.statusText?.setText("READY FOR DEAL").setColor(COLORS.ink);
      this.emitState();
    }

    private dealCard(hand: "player" | "dealer", hidden: boolean) {
      const card = this.deck.pop();
      if (!card) return;
      const cards = hand === "player" ? this.player : this.dealer;
      const views = hand === "player" ? this.playerViews : this.dealerViews;
      cards.push(card);
      const view = this.createCardView(card, hidden);
      views.push(view);
      this.playSound("deal", 0.18);
      this.layoutHand(views, hand === "player" ? PLAYER_Y : DEALER_Y);
      this.emitState();
    }

    /* eslint-disable unicorn/number-literal-case */
    private createCardView(card: Card, hidden: boolean) {
      const root = this.add.container(DECK_X, DECK_Y).setDepth(5).setScale(0.86).setAlpha(0);
      const shadow = this.add.rectangle(
        4 * WORLD_SCALE,
        6 * WORLD_SCALE,
        CARD_WIDTH,
        CARD_HEIGHT,
        0x061a18,
        0.38,
      );
      const face = this.add
        .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, COLORS.card)
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.cardEdge, 1);
      const back = this.add
        .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, COLORS.back)
        .setStrokeStyle(2 * WORLD_SCALE, COLORS.goldFill, 0.65);
      const rank = this.add.text(
        -CARD_WIDTH / 2 + 12 * WORLD_SCALE,
        -CARD_HEIGHT / 2 + 10 * WORLD_SCALE,
        card.rank,
        {
          color: card.suit === "♥" || card.suit === "♦" ? COLORS.red : "#193541",
          fontFamily: GAME_FONT,
          fontSize: `${14 * WORLD_SCALE}px`,
          fontStyle: "bold",
        },
      );
      const suit = this.add
        .text(0, 8 * WORLD_SCALE, card.suit, {
          color: card.suit === "♥" || card.suit === "♦" ? COLORS.red : "#193541",
          fontFamily: "Arial, sans-serif",
          fontSize: `${31 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5);
      const backMark = this.add
        .text(0, 0, "✦", {
          color: "#8bcac2",
          fontFamily: GAME_FONT,
          fontSize: `${21 * WORLD_SCALE}px`,
        })
        .setOrigin(0.5);
      root.add([shadow, face, rank, suit, back, backMark]);
      face.setVisible(!hidden);
      rank.setVisible(!hidden);
      suit.setVisible(!hidden);
      back.setVisible(hidden);
      backMark.setVisible(hidden);
      return { root, face, back, rank, suit, backMark, card, hidden } satisfies CardVisual;
    }
    /* eslint-enable unicorn/number-literal-case */

    private layoutHand(views: CardVisual[], y: number) {
      const available = WIDTH - 72 * WORLD_SCALE;
      const spacing =
        views.length > 1
          ? Math.min(CARD_WIDTH + 8 * WORLD_SCALE, available / (views.length - 1))
          : 0;
      const start = WIDTH / 2 - ((views.length - 1) * spacing) / 2;
      views.forEach((view, index) => {
        const x = views.length === 1 ? WIDTH / 2 : start + index * spacing;
        this.tweens.add({
          targets: view.root,
          x,
          y,
          scale: 1,
          alpha: 1,
          duration: 260,
          delay: view.root.alpha === 0 ? 30 : 0,
          ease: "Cubic.out",
        });
      });
    }

    private hit() {
      if (this.status !== "playing" || this.dealing) return;
      this.dealing = true;
      this.playSound("chip", 0.1);
      this.dealCard("player", false);
      this.addTimer(340, () => {
        if (score(this.player) > 21) {
          this.revealDealer();
          this.finishRound("Bust. Dealer wins.", false);
        } else if (score(this.player) === 21) {
          this.dealing = false;
          this.stand();
        } else {
          this.dealing = false;
          this.statusText.setText("YOUR MOVE");
          this.emitState();
        }
      });
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "blackjack", action: "hit" });
    }

    private stand() {
      if (this.status !== "playing" || this.dealing) return;
      this.dealing = true;
      this.revealDealer();
      this.statusText.setText("DEALER REVEALS");
      this.playSound("reveal", 0.16);
      this.dealerTurn();
      phaserEventBus.emit(PHASER_EVENTS.action, { game: "blackjack", action: "stand" });
    }

    private dealerTurn() {
      if (score(this.dealer) < 17) {
        this.addTimer(480, () => {
          this.dealCard("dealer", false);
          this.dealerTurn();
        });
        return;
      }
      this.addTimer(520, () => this.finishRound(this.resolveResult(), true));
    }

    private revealDealer() {
      const hidden = this.dealerViews.find((view) => view.hidden);
      if (!hidden) return;
      hidden.hidden = false;
      this.tweens.add({
        targets: hidden.root,
        scaleX: 0,
        duration: 130,
        ease: "Cubic.in",
        onComplete: () => {
          hidden.back.setVisible(false);
          hidden.backMark.setVisible(false);
          hidden.rank.setVisible(true);
          hidden.suit.setVisible(true);
          hidden.face.setVisible(true);
          this.tweens.add({ targets: hidden.root, scaleX: 1, duration: 160, ease: "Cubic.out" });
        },
      });
    }

    private finishRound(message: string, reveal: boolean) {
      if (reveal) this.revealDealer();
      this.result = message;
      this.addTimer(420, () => {
        this.dealing = false;
        this.status = "over";
        this.statusText
          .setText(message)
          .setColor(
            message === "You win." || message === "Blackjack!" ? COLORS.winText : COLORS.ink,
          );
        this.playSound(message === "You win." || message === "Blackjack!" ? "win" : "lose", 0.18);
        phaserEventBus.emit(PHASER_EVENTS.hit, { game: "blackjack", result: message });
        this.emitState();
      });
    }

    private resolveResult() {
      const playerScore = score(this.player);
      const dealerScore = score(this.dealer);
      if (playerScore === 21 && this.player.length === 2 && dealerScore !== 21) return "Blackjack!";
      if (dealerScore > 21 || playerScore > dealerScore) return "You win.";
      if (playerScore === dealerScore) return "Push.";
      return "Dealer wins.";
    }

    private handleKeydown(event: KeyboardEvent) {
      if (!["KeyH", "KeyS", "Enter", "Space", "KeyN"].includes(event.code)) return;
      event.preventDefault();
      if (event.code === "KeyN") {
        this.startFromOverlay();
        return;
      }
      if (event.code === "KeyH" || event.code === "Space") this.hit();
      if (event.code === "KeyS" || event.code === "Enter") this.stand();
    }

    private addTimer(delay: number, callback: () => void) {
      const timer = this.time.delayedCall(delay, callback);
      this.timers.push(timer);
      return timer;
    }

    private emitState() {
      const dealerHidden = this.dealerViews.some((view) => view.hidden);
      this.dealerLabel.setText(dealerHidden ? "DEALER · HIDDEN CARD" : "DEALER");
      this.dealerScoreText.setText(dealerHidden ? "?" : String(score(this.dealer)));
      this.playerScoreText.setText(this.player.length ? String(score(this.player)) : "—");
      this.shoeText.setText(`${this.deck.length} CARDS`);
      onState({
        status: this.status,
        dealing: this.dealing,
        playerScore: this.player.length ? score(this.player) : 0,
        dealerScore: dealerHidden ? -1 : score(this.dealer),
        playerCards: this.player.length,
        dealerCards: this.dealer.length,
        result: this.result,
      } satisfies BlackjackGameState);
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
      this.input.keyboard?.off("keydown", this.handleKeydown, this);
      this.input.keyboard?.removeCapture("H,S,ENTER,SPACE,N");
      this.timers.forEach((timer) => timer.remove());
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent,
    canvasStyle: "display:block;background:#0a2d29;",
    backgroundColor: "#0a2d29",
    scene: BlackjackScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
  });

  return Object.assign(game, {
    startGame: (option?: unknown) => {
      const scene = game.scene.getScene("blackjack") as BlackjackScene;
      if (option === "hit" || option === "stand") scene.takeAction(option);
      else scene.startFromOverlay();
    },
    restartGame: () => (game.scene.getScene("blackjack") as BlackjackScene).startFromOverlay(),
    toggleMute: () => (game.scene.getScene("blackjack") as BlackjackScene).toggleMute(),
  }) as PhaserGameHandle;
};
