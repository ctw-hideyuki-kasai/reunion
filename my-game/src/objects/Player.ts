
import Phaser from 'phaser';
import { GAME, SCREEN, PLAYR_ANIM_MAX } from '../constants';

export class Player extends Phaser.GameObjects.Sprite {
  //< メンバ変数
  lane = 1; // 0..3
  lanesX: number[] = [];
  sizePxX = 512;
  sizePxY = 1024;
  hp = 1;
  maxHp = 1;

  stunUntil = 0;
  invUntil = 0;

  private animTimer = 0;
  private allowScroll = false;
  private beforeAllowScroll = false;

  //< コンストラクタ
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, GAME.PLAYER.SPRITE_01);
    this.setOrigin(0.5, 0.5);
  }

  //< 初期化
  init(sizeX: number, sizeY: number, hp: number, lanesX: number[]) {
    this.sizePxX = sizeX;
    this.sizePxY = sizeY;
    this.maxHp = Math.max(1, hp);
    this.hp = this.maxHp;
    this.lanesX = lanesX;
    this.lane = 1;
    this.setPosition(this.lanesX[this.lane], SCREEN.HEIGHT * 0.7);
    this.setDisplaySize(this.sizePxX, this.sizePxY);
  }

  isStunned(now: number) { return now < this.stunUntil; }
  isInvincible(now: number) { return now < this.invUntil; }

  addStun(now: number, stunSec: number, invSec: number) {
    this.stunUntil = now + stunSec * 1000;
    this.invUntil = this.stunUntil + invSec * 1000;
  }

  setInv(now: number, sec: number) {
    if (now < this.invUntil) {
      this.invUntil += sec * 1000;
    } else {
      this.invUntil = now + sec * 1000;
    }
  }
  
  //< GameScene側で入力が成立している
  setAllowScrollSource(flag: boolean) {
    this.allowScroll = flag;
  }

  damage(now: number, val: number, stun: number, inv: number) {
    if (this.isInvincible(now)) return; // 無敵中はダメージ無効
    this.hp = Math.max(0, this.hp - Math.max(0, val));
    if (val > 0) this.addStun(now, stun, inv);
  }

  heal(val: number) {
    this.hp = Math.min(this.maxHp, this.hp + Math.max(0, val));
  }

  stepLane(delta: number) {
    const n = Math.max(0, Math.min(this.lanesX.length - 1, this.lane + delta));
    this.lane = n;
    this.x = this.lanesX[this.lane];
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    //< 入力が入ってない時は停止
    if(this.allowScroll == false)
    { //< チョン押しした時は更新したい
      if(this.beforeAllowScroll) this.animTimer = (this.animTimer > PLAYR_ANIM_MAX * 0.5 ? 0 : PLAYR_ANIM_MAX);
      this.beforeAllowScroll = this.allowScroll;
      return;
    }
    // 簡易2コマアニメ
    this.beforeAllowScroll = this.allowScroll;
    this.animTimer += delta;
    const frame = Math.floor(this.animTimer / PLAYR_ANIM_MAX) % 2;
    this.setTexture(frame === 0 ? GAME.PLAYER.SPRITE_01 : GAME.PLAYER.SPRITE_02);
  }

  aabb(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.displayWidth / 2, this.y - this.displayHeight / 2,
      this.displayWidth, this.displayHeight
    );
  }
}
