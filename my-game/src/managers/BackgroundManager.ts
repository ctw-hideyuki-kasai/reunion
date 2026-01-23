
import Phaser from 'phaser';
import { GAME, SCREEN } from '../constants';
export const AREA_MAX = 5;
export const SCREEN_CENTER = SCREEN.HEIGHT * 0.5;
export const SCREEN_MOVE = SCREEN.HEIGHT * 1.5;
export const SCREEN_START = -SCREEN_MOVE;

export class BackgroundManager {
  private scene: Phaser.Scene;

  // ループ用タイル（クロスフェード用二重化）
  private loopA!: Phaser.GameObjects.TileSprite;
  private loopB!: Phaser.GameObjects.TileSprite;

  // 進行状態
  private currentArea = 0;
  private beforeArea = 0;

  // 進行距離（screens）… SCREEN.HEIGHT を 1 とする内部単位
  private progressScreens = 0;         // 積算
  private areaLengths: [number, number, number, number, number] = [0, 90, 90, 120, 9999];

  //< コンストラクタ
  constructor(scene: Phaser.Scene, areaLengths1: number, areaLengths2: number, areaLengths3: number) {
     this.scene = scene;
     this.areaLengths[0] = 0;
     this.areaLengths[1] = areaLengths1;
     this.areaLengths[2] = areaLengths2;
     this.areaLengths[3] = areaLengths3;
     this.areaLengths[4] = areaLengths3 + 1;
  }
  
  //< 現在のエリアを取得
  getCurrentArea(){
    return this.currentArea;
  }

  //< クリアフラグ
  getClearFlag() {
    return this.currentArea >= AREA_MAX;
  }

  /** 背景用オブジェクト生成（Scene.create()内で呼ぶ） */
  create() {
    // 背面：ループ用タイル（最初は非表示）
    this.currentArea = 0;
    this.progressScreens = 0;
    this.loopA = this.createBG(this.currentArea);
    this.loopB = this.createBG(this.currentArea + 1);
    this.loopA.setVisible(true);

    this.scroll(0);
  }

  //< エリア番号から画像名を出す
  areaToSpriteName(area : number) {
    return GAME.BG_TILE_KEYS[area] ?? GAME.BG_TILE_KEYS[0];
  }

  //< 背景画像生成
  createBG(area : number){
    return this.scene.add
      .tileSprite(SCREEN.WIDTH * 0.5, SCREEN.HEIGHT * 0.5, SCREEN.WIDTH, SCREEN.HEIGHT, this.areaToSpriteName(area))
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(0)
      .setAlpha(1)
      .setVisible(false);
  }

  setArea(area: number) {
    if (!this.loopA) return;
    if (area === this.currentArea) return;
    this.currentArea = area;
    const key = GAME.BG_TILE_KEYS[this.currentArea] ?? GAME.BG_TILE_KEYS[0];
    this.loopA.setTexture(key);
  }
  
  //< 現在の進行度をAreaに換算
  private currentAreaByProgress() {
    if(this.beforeArea >= AREA_MAX) return AREA_MAX;
    if (this.progressScreens < this.areaLengths[this.beforeArea + 1]) return this.beforeArea + 1;
    return AREA_MAX;
  }

  /**
   * 進行に応じて背景をスクロール（ループ時のみ有効）
   * - pixels: 実スクロール移動量（↑入力に応じる量）
   */
  async scroll(pixels: number) {
    //< Goal以上はスクロールしない
    if(this.getClearFlag()) return;

    //< 現在の進行度を確認してAreaを確定する
    const deltaScreens = pixels / SCREEN.HEIGHT;
    this.progressScreens += deltaScreens;
    //< Areaの切り替わりを判定
    const tmpArea = this.currentAreaByProgress();
    const isJustChange = (this.currentArea != tmpArea);
    this.currentArea = this.currentAreaByProgress();

    //< タイルの役割を確認する
    const currentTile = (this.currentArea % 2 == 0) ? this.loopA : this.loopB;
    const subTile = (this.currentArea % 2 == 0) ? this.loopB : this.loopA;
    //< 現在のAreaと過去のAreaが同じ場合
    if(this.currentArea == this.beforeArea) this.tileScroll(pixels, currentTile);
    else                                    this.yScroll(pixels, currentTile, subTile, isJustChange);
  }

  //< タイルのスクロール
  async tileScroll(pixels: number, currentTile: Phaser.GameObjects.TileSprite){
    if (!currentTile) return;
    currentTile.tilePositionY -= pixels;
  }

  //< 画像そのもののスクロール
  async yScroll(pixels: number, currentTile: Phaser.GameObjects.TileSprite, subTile: Phaser.GameObjects.TileSprite, justChange: boolean){
    if(subTile.y >= SCREEN_MOVE) {
      this.initTile(currentTile, subTile);
      return;
    }

    //< 変わった瞬間の初期化
    if(justChange) {
      if(this.beforeArea != 0) currentTile.setTexture(this.areaToSpriteName(this.beforeArea + 1));
      currentTile.setVisible(true);
      currentTile.setY(-SCREEN_CENTER);

      subTile.setVisible(true);
      subTile.setY(SCREEN_CENTER);
    }

    //< そのものの移動
    subTile.setY(subTile.y + pixels);
    currentTile.setY(currentTile.y + pixels);

    if(subTile.y >= SCREEN_MOVE) {
      this.initTile(currentTile, subTile);
    }
  }

  //< タイルの初期化
  initTile(currentTile: Phaser.GameObjects.TileSprite, subTile: Phaser.GameObjects.TileSprite) {
      currentTile.setVisible(true);
      currentTile.setY(SCREEN_CENTER);
      subTile.setVisible(false);
      subTile.setY(-SCREEN_CENTER);
      this.beforeArea = this.currentArea;
  }

  // 後始末
  destroy() {
    this.loopA.destroy();
    this.loopB.destroy();
  }
}