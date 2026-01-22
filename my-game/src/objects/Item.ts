
import Phaser from 'phaser';
import type { ItemCSV } from '../types';

export class Item extends Phaser.GameObjects.Sprite {
  dataRow!: ItemCSV;
  vx = 0;
  vy = 0;
  snakePhase = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, tex: string) {
    super(scene, x, y, tex);
    this.setOrigin(0.5, 0.5);
  }

  initFrom(row: ItemCSV, sizeX: number, sizeY: number) {
    this.dataRow = row;
    this.setDisplaySize(sizeX, sizeY);
  }

  aabb(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.displayWidth / 2, this.y - this.displayHeight / 2,
      this.displayWidth, this.displayHeight
    );
  }
}
