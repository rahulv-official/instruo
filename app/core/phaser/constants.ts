/** Shared Phaser viewport values. Keep every game on one stable aspect ratio. */
export const PHASER_GAME_SCALE = 2;
export const PHASER_GAME_BASE_WIDTH = 420;
export const PHASER_GAME_BASE_HEIGHT = 640;
export const PHASER_GAME_WIDTH = PHASER_GAME_BASE_WIDTH * PHASER_GAME_SCALE;
export const PHASER_GAME_HEIGHT = PHASER_GAME_BASE_HEIGHT * PHASER_GAME_SCALE;
export const PHASER_GAME_ASPECT = PHASER_GAME_BASE_WIDTH / PHASER_GAME_BASE_HEIGHT;
