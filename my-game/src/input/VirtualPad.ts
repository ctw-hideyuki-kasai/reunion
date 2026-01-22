
import Phaser from 'phaser';
import { SCREEN, BOTTOM_UI_RATIO } from '../constants';

/**
 * 画面下20%を3分割（左/上/右）。同時押しは禁止（GameScene側で制御）。
 */
export class VirtualPad {
  private scene: Phaser.Scene;
  private zoneLeft!: Phaser.GameObjects.Zone;
  private zoneUp!: Phaser.GameObjects.Zone;
  private zoneRight!: Phaser.GameObjects.Zone;

  isLeftTap = false;
  isRightTap = false;
  isUpHold = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create() {
    const h = SCREEN.HEIGHT * BOTTOM_UI_RATIO;
    const top = SCREEN.HEIGHT - h;
    const w = SCREEN.WIDTH / 3;

    const makeZone = (x: number) => {
      const z = this.scene.add.zone(x, top + h / 2, w, h).setOrigin(0, 0.5);
      z.setInteractive({ useHandCursor: true });
      return z;
    };

    this.zoneLeft = makeZone(0);
    this.zoneUp = makeZone(w);
    this.zoneRight = makeZone(w * 2);

    // 左右はタップ毎に1ステップ
    this.zoneLeft.on('pointerdown', () => { this.isLeftTap = true; });
    this.zoneRight.on('pointerdown', () => { this.isRightTap = true; });

    // 上は押下中のみ
    this.zoneUp.on('pointerdown', () => { this.isUpHold = true; });
    this.zoneUp.on('pointerup', () => { this.isUpHold = false; });
    this.zoneUp.on('pointerout', () => { this.isUpHold = false; });
    this.zoneUp.on('pointercancel', () => { this.isUpHold = false; });
  }

  resetFrameFlags() {
    this.isLeftTap = false;
    this.isRightTap = false;
  }
}
