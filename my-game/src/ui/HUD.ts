
import Phaser, { Game } from 'phaser';
import { GAME, SCORE } from '../constants';

export class HUD {
  scene: Phaser.Scene;
  score = 0;
  timeSec = 0; // remaining
  hp = 0;
  maxHp = 0;

  // 画像モード（スコア/時間の各桁スプライト）
  private scoreDigits: Phaser.GameObjects.Image[] = [];
  private timeDigits: Phaser.GameObjects.Image[] = [];
  private timeColon!: Phaser.GameObjects.Image;

  // フォールバック：テキストモード
  private useTextNumbers = false;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;

  private hpIcons: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  // 画像ファイルキー
  private scoreNumKey(n: number) { return `${GAME.UI.SCORE_NUMBERS_DIR}Score_Number${n}.png`; }
  private timeNumKey(n: number) { return `${GAME.UI.TIME_NUMBERS_DIR}Time_Number${n}.png`; }

  create(maxHp: number) {
    this.maxHp = maxHp;
    this.hp = maxHp;

    // --- 画像の有無を判定（0番のテクスチャが存在するか） ---
    const hasScoreDigits = this.scene.textures.exists(this.scoreNumKey(0));
    const hasTimeDigits  = this.scene.textures.exists(this.timeNumKey(0)) &&
                           this.scene.textures.exists(GAME.UI.TIME_COLON);

    this.useTextNumbers = !(hasScoreDigits && hasTimeDigits);

    if (this.useTextNumbers) {
      // ========== テキストモード ==========
      this.scoreText = this.scene.add.text(
        this.scene.cameras.main.width - GAME.UI.MARGIN_RIGHT, GAME.UI.MARGIN_TOP,
        '0', { color: '#ffffff', fontSize: '36px', fontFamily: 'monospace' }
      ).setOrigin(1, 0).setDepth(GAME.UI.UI_DEPTH).setScrollFactor(0);

      this.timeText = this.scene.add.text(
        GAME.UI.MARGIN_LEFT, GAME.UI.MARGIN_TOP + 60,
        '00:00', { color: '#ffffff', fontSize: '28px', fontFamily: 'monospace' }
      ).setOrigin(0, 0.5).setDepth(GAME.UI.UI_DEPTH).setScrollFactor(0);
    } else {
      // ========== 画像モード ==========
      // タイム（左上 mm:ss）
      const timeW = 96, timeH = 128;  // 想定サイズ（画像差し替えOK）
      const timeMarginW = timeW * 0.8, timeMarginY = timeH * 0.5;  // 想定サイズ（画像差し替えOK）
      const xLeft = GAME.UI.MARGIN_LEFT;
      const timeY = GAME.UI.MARGIN_TOP + timeMarginY;
      const mmL = this.scene.add.image(xLeft + timeMarginW * 0, timeY, this.timeNumKey(0)).setOrigin(0, 0.5).setScrollFactor(0);
      mmL.setDepth(GAME.UI.UI_DEPTH);
      const mmR = this.scene.add.image(xLeft + timeMarginW * 1, timeY, this.timeNumKey(0)).setOrigin(0, 0.5).setScrollFactor(0);
      mmR.setDepth(GAME.UI.UI_DEPTH);
      this.timeColon = this.scene.add.image(xLeft + timeMarginW * 2, timeY, GAME.UI.TIME_COLON).setOrigin(0, 0.5).setScrollFactor(0);
      this.timeColon.setDepth(GAME.UI.UI_DEPTH);
      const ssL = this.scene.add.image(xLeft + timeMarginW * 3, timeY, this.timeNumKey(0)).setOrigin(0, 0.5).setScrollFactor(0);
      ssL.setDepth(GAME.UI.UI_DEPTH);
      const ssR = this.scene.add.image(xLeft + timeMarginW * 4, timeY, this.timeNumKey(0)).setOrigin(0, 0.5).setScrollFactor(0);
      ssR.setDepth(GAME.UI.UI_DEPTH);
      this.timeDigits = [mmL, mmR, ssL, ssR];

      // スコア（右上 8桁右寄せ）
      const DigitLength = 8;
      const scoreW = 64, scoreH = 84;  // 想定サイズ（画像差し替えOK）
      const scoreMarginW = scoreW * 0.9, scoreMarginY = scoreH * 0.5;  // 想定サイズ（画像差し替えOK）
      const xRight = this.scene.cameras.main.width - GAME.UI.MARGIN_RIGHT;
      const scoreY = GAME.UI.MARGIN_TOP + timeMarginY + (timeMarginY - scoreMarginY);
      for (let i = 0; i < DigitLength; i++) {
        const img = this.scene.add.image(
          xRight - (scoreMarginW * (DigitLength - 1 - i)), scoreY, this.scoreNumKey(0)
        ).setOrigin(1, 0.5);
        img.setScrollFactor(0);
        img.setDepth(GAME.UI.UI_DEPTH);
        this.scoreDigits.push(img);
      }
    }

    // HP（左下、プレイアブルの上端に接する位置）
    const hpY = this.scene.cameras.main.height * (1 - 0.2) + 64;
    for (let i = 0; i < this.maxHp; i++) {
      const icon = this.scene.add.image(
        GAME.UI.MARGIN_LEFT + i * (84 + GAME.UI.ICON_PAD), hpY, GAME.UI.HP
      ).setOrigin(0, 0.5).setScrollFactor(0);
      icon.setDepth(GAME.UI.UI_DEPTH);
      this.hpIcons.push(icon);
    }
  }

  setScore(v: number) {
    this.score = Math.max(0, Math.min(SCORE.MAX, Math.trunc(v)));

    if (this.useTextNumbers) {
      this.scoreText?.setText(this.score.toLocaleString());
      return;
    }

    // 右寄せ：最小1桁は描画
    const digits = this.score.toString().split("").map(d => Number(d));
    let num = 0;
    for (let i = 0; i < this.scoreDigits.length; i++) {
      const img = this.scoreDigits[i];
      if (!img) continue; // 念のため
      
      if(digits.length < this.scoreDigits.length - i){
        img.setVisible(i === this.scoreDigits.length - 1); // 最小1桁は'0'で表示
      }
      else{
        img.setTexture(this.scoreNumKey(digits[num]));
        img.setVisible(true);
        num++;
      }
    }
  }

  setTime(remainingSec: number) {
    this.timeSec = Math.max(0, remainingSec);
    const mm = Math.floor(this.timeSec / 60);
    const ss = Math.floor(this.timeSec % 60);

    if (this.useTextNumbers) {
      const mmStr = String(mm).padStart(2, '0');
      const ssStr = String(ss).padStart(2, '0');
      this.timeText?.setText(`${mmStr}:${ssStr}`);
      return;
    }

    // 画像モード：各桁更新（timeDigits が無ければ安全に抜ける）
    if (!this.timeDigits || this.timeDigits.length < 4) return;
    const mmL = Math.floor(mm / 10), mmR = mm % 10;
    const ssL = Math.floor(ss / 10), ssR = ss % 10;
    this.timeDigits[0]?.setTexture(this.timeNumKey(mmL));
    this.timeDigits[1]?.setTexture(this.timeNumKey(mmR));
    this.timeDigits[2]?.setTexture(this.timeNumKey(ssL));
    this.timeDigits[3]?.setTexture(this.timeNumKey(ssR));
  }

  setHP(cur: number) {
    this.hp = Math.max(0, Math.min(this.maxHp, cur));
    for (let i = 0; i < this.hpIcons.length; i++) {
      const show = i < this.hp;
      this.hpIcons[i].setVisible(show);
    }
  }
}
