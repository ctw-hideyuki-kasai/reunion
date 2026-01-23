
import Phaser from 'phaser';
import { GAME, SCENES, SCREEN } from '../constants';
import { ResourceManager } from '../managers/ResourceManager';

export class BootScene extends Phaser.Scene {
  constructor() { super(SCENES.BOOT); }

  preload() {
    this.cameras.main.setBackgroundColor('#000');
    // 重要アセットだけ事前ロード（なければ警告）
    ResourceManager.image(this, GAME.TITLE_BG as string);
    ResourceManager.image(this, GAME.TITLE_TRY as string);
    // BGM
    this.load.audio("bgm", ["/sounds/BGM/touchou_BGM.mp3"]);
    // SE
    this.load.audio("gameover", "/sounds/SE/gameover.mp3");
    this.load.audio("success", "/sounds/SE/success.mp3");
    this.load.audio("title", "/sounds/SE/title.mp3");
    // UI
    ResourceManager.image(this, GAME.UI.HP);
    for (let d = 0; d <= 9; d++) {
      this.load.image(`/images/ui/score/Score_Number${d}.png`, `/images/ui/score/Score_Number${d}.png`);
      this.load.image(`/images/ui/time/Time_Number${d}.png`, `/images/ui/time/Time_Number${d}.png`);
    }
    this.load.image(GAME.UI.TIME_COLON, GAME.UI.TIME_COLON);
    // Player
    ResourceManager.image(this, `/images/player/Ladder01.png`);
    ResourceManager.image(this, `/images/player/Ladder02.png`);
    // 背景
    GAME.BG_TILE_KEYS.forEach(k => ResourceManager.image(this, k));
    //< item
    for (let d = 1; d <= 22; d++) {
      const id3 = String(d).padStart(3, '0');
      ResourceManager.image(this, `/images/item/item${id3}.png`);
    }
  }

  create() {
    this.scale.setGameSize(SCREEN.WIDTH, SCREEN.HEIGHT);
    this.scene.start(SCENES.TITLE);
  }
}
