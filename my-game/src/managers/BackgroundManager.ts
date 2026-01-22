
import Phaser from 'phaser';
import { GAME, SCREEN } from '../constants';

export class BackgroundManager {
  private scene: Phaser.Scene;
  private tile?: Phaser.GameObjects.TileSprite;
  private currentArea = 0;

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  create() {
    const key = GAME.BG_TILE_KEYS[this.currentArea] ?? GAME.BG_TILE_KEYS[0];
    this.tile = this.scene.add.tileSprite(
      SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2, SCREEN.WIDTH, SCREEN.HEIGHT, key
    ).setOrigin(0.5, 0.5);
    this.tile.setScrollFactor(0);
  }

  setArea(area: number) {
    if (!this.tile) return;
    if (area === this.currentArea) return;
    this.currentArea = area;
    const key = GAME.BG_TILE_KEYS[this.currentArea] ?? GAME.BG_TILE_KEYS[0];
    this.tile.setTexture(key);
  }

  scroll(pixels: number) {
    if (!this.tile) return;
    this.tile.tilePositionY -= pixels; // 下方向へ流す
  }
}
