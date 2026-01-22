
import Phaser from 'phaser';
import { GAME, ITEM, SCENES, SCREEN, SCORE, BGM_VOLUME, SE_VOLUME, BGM_DELAYED_TIME } from '../constants';
import { Player } from '../objects/Player';
import { HUD } from '../ui/HUD';
import { VirtualPad } from '../input/VirtualPad';
import { parseCsvToRows, rowsToObjects, requireNumber } from '../utils/csv';
import { errorOverlay } from '../utils/errors';
import { BackgroundManager } from '../managers/BackgroundManager';
import { ItemSpawner } from '../managers/ItemSpawner';
import { Item } from '../objects/Item';
import type { ItemCSV, PlayerCSV } from '../types';

export class GameScene extends Phaser.Scene {
  constructor() { super(SCENES.GAME); }

  player!: Player;
  hud!: HUD;
  vpad!: VirtualPad;
  bg!: BackgroundManager;
  spawner!: ItemSpawner;

  // CSV設定
  cfg!: PlayerCSV;
  items: ItemCSV[] = [];

  // 進行管理
  gameSec = 0;        // 常にカウント
  elapsedMoveSec = 0; // ↑押下時のみカウント
  startTimeSec = 300;
  gameStart = false;
  gameEnd = false;
  cleared = false;
  bonusApplied = false;

  // 入力状態
  keyLeft!: Phaser.Input.Keyboard.Key;  //< キーボード
  keyRight!: Phaser.Input.Keyboard.Key;
  keyUp!: Phaser.Input.Keyboard.Key;
  wantLeft = false;                     //< バーチャルコントローラー
  wantRight = false;
  wantUp = false;
  allowScroll = false;                  //< スクロール中
  upReset = false;                      //< 上キーを入力し直さないとダメ

  // スコア
  score = 0;

  // --- Debug 即死（Esc / Shift+K）＋二重遷移ガード ---
  private debugEnabled =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) ||
    new URLSearchParams(location.search).has('debug');
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keyK!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private exiting = false;
  private bgm?: Phaser.Sound.BaseSound;

  // ★ ラン状態のリセット（毎プレイごとに初期化）
  private resetRunState() {
    this.score = 0;
    this.gameSec = 0;
    this.elapsedMoveSec = 0;
    this.gameStart = false;
    this.gameEnd = false;
    this.cleared = false;
    this.bonusApplied = false;
    this.exiting = false;    // 即死/クリアの二重遷移ガードを解除
    this.allowScroll = this.upReset = false;
    this.wantLeft = this.wantRight = this.wantUp = false;
    // BGM停止
    this.bgm?.stop();
  }

  // ★ Phaserのinitフックでも確実に初期化（create前）
  init() {
    this.resetRunState();
  }

  create() {
    // 念のためcreateでも初期化（何らかの順序の違いに対する保険）
    this.resetRunState();

    this.cameras.main.setBackgroundColor('#001018');

    // title BGM再生
    this.startBgm();

    // 背景
    this.bg = new BackgroundManager(this);
    this.bg.create();

    // 入力
    this.keyLeft = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keyUp = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    // Debug keys
    this.keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyK = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyShift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // バーチャルパッド
    this.vpad = new VirtualPad(this);
    this.vpad.create();

    // プレイヤー
    this.player = new Player(this, SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.7);
    this.add.existing(this.player);

    // HUD
    this.hud = new HUD(this);

    // スポーナ
    this.spawner = new ItemSpawner(this);

    // 設定ロード
    this.loadConfig().then(ok => {
      if (ok) this.afterConfigReady();
      else errorOverlay.error('CSVの読み込みに失敗しました（タイトルへ戻ってください）');
    });
  }
  
  private startBgm() {
    if (this.bgm?.isPlaying) return;
    const se = this.sound.add("title", { volume: SE_VOLUME, detune: Phaser.Math.Between(-50, 50) });
    
    se.once('complete', () => {
      // SE の破棄（任意）
      se.destroy();

      // delayMs 後に BGM 開始
      this.time.delayedCall(BGM_DELAYED_TIME, () => {
        // 二重再生ガード
        const existing = this.sound.get("bgm") as Phaser.Sound.BaseSound | null;
        if (existing?.isPlaying) return;

        console.log('Attempting to play BGM...');
        this.bgm = this.sound.add("bgm", { loop: true, volume: BGM_VOLUME });
        
        this.bgm.on('play', () => {
          console.log('BGM started playing');
        });
        
        this.bgm.on('failed', () => {
          console.error('BGM failed to play');
        });
        
        const playResult = this.bgm.play();
        console.log('BGM play result:', playResult);
        
        //< ゲーム開始
        this.gameStart = true;
      });
    });

    se.play();
  }

  
  private async loadConfig(): Promise<boolean> {
    try {
      // player.csv
      const pRes = await fetch(GAME.DATA.PLAYER, { cache: 'no-store' });
      if (!pRes.ok) throw new Error(`player.csv HTTP ${pRes.status}`);
      const pText = await pRes.text();
      const pRows = parseCsvToRows(pText);
      const { objects: pobj } = rowsToObjects(pRows);
      if (pobj.length < 1) throw new Error('player.csv に値行がありません');
      const R = pobj[0]; // 1行目採用

      // 厳格読み込み
      const rowIndex = 2; // 値行の行番号相当
      const num = (k: string, int = true) => requireNumber(R[k], k, rowIndex, !int);
      const cfg: PlayerCSV = {
        HP: num('HP')!, SizeX: num('SizeX')!, SizeY: num('SizeY')!, StartTimeSeconds: num('StartTimeSeconds')!,
        OnHitStunSeconds: num('OnHitStunSeconds', false)!,
        OnHitInvincibleSeconds: num('OnHitInvincibleSeconds', false)!,
        SecPerScreen: num('SecPerScreen', false)!,
        Area1Sec: num('Area1Sec', false)!, Area2Sec: num('Area2Sec', false)!,
        Area3Sec: num('Area3Sec', false)!, goalSec: num('goalSec', false)!,
      };

      // バリデーション
      if (!(0 < cfg.Area1Sec && cfg.Area1Sec < cfg.Area2Sec && cfg.Area2Sec < cfg.Area3Sec && cfg.Area3Sec < cfg.goalSec && cfg.goalSec <= cfg.StartTimeSeconds)) {
        errorOverlay.warn('player.csv 時間帯の関係が不正: 0 < Area1Sec < Area2Sec < Area3Sec < goalSec ≤ StartTimeSeconds');
      }

      this.cfg = cfg;
      this.startTimeSec = cfg.StartTimeSeconds;

      // item.csv
      const iRes = await fetch(GAME.DATA.ITEM, { cache: 'no-store' });
      if (!iRes.ok) throw new Error(`item.csv HTTP ${iRes.status}`);
      const iText = await iRes.text();
      const iRows = parseCsvToRows(iText);
      const { header, objects: iobj } = rowsToObjects(iRows);
      const need = ['Id', 'Name', 'Effect', 'Value', 'Speed', 'Area', 'Weight', 'SizeX', 'SizeY', 'Move'];
      const missing = need.filter(k => !header.includes(k));
      if (missing.length) errorOverlay.warn(`item.csv ヘッダ欠落: ${missing.join(', ')}`);

      const parsed: ItemCSV[] = [];
      iobj.forEach((R, idx) => {
        const rIdx = idx + 2;
        const n = (k: string, int = true) => requireNumber(R[k], k, rIdx, !int);
        let Effect = n('Effect')!;
        let Value = n('Value', false)!;
        // 正規化：HP系(0/1)の負値は0扱い
        if (Effect === 0 || Effect === 1) Value = Math.max(0, Value);

        const row: ItemCSV = {
          Id: n('Id')!, Name: R['Name'] ?? '',
          Effect: [0, 1, 2, 3].includes(Effect) ? (Effect as any) : 3,
          Value,
          Speed: n('Speed', false)!,
          Area: ((): any => { const a = n('Area')!; return [0, 1, 2, 3].includes(a) ? a : 0; })(),
          Weight: n('Weight', false)!,
          SizeX: n('SizeX')!,
          SizeY: n('SizeY')!, 
          Move: ((): any => { const m = n('Move')!; return [0, 1, 2, 3].includes(m) ? m : 0; })(),
        };
        if (row.Weight > 0) parsed.push(row);
      });
      this.items = parsed;

      return true;
    } catch (e: any) {
      errorOverlay.error(`設定ロード失敗: ${e?.message ?? e}`);
      return false;
    }
  }

  private afterConfigReady() {
    //< レーン（縦軸）の初期化
    const start = 180;
    const margin = 240;
    const lanesX = [0, 1, 2, 3].map(i => start + (margin * i));

    // プレイヤー初期化
    this.player.init(this.cfg.SizeX, this.cfg.SizeY, this.cfg.HP, lanesX);

    // HUD
    this.hud.create(this.cfg.HP);
    this.hud.setScore(this.score);
    this.hud.setTime(this.cfg.StartTimeSeconds);

    // スポーナ
    this.spawner.setLanes(lanesX);
    this.spawner.setCenterY((0 + (SCREEN.HEIGHT * (1 - 0.2))) / 2);
    this.spawner.setPool(this.items);
    this.spawner.scheduleNext();
  }

  private handleInput() {
    //< GameEnd時は無視する
    if(this.gameEnd == true)
    {
      this.allowScroll = this.upReset = false;
      this.wantLeft = this.wantRight = this.wantUp = false;
      return;
    } 
    
    // キー押下：左右は「1押下=1ステップ」、上は押下中のみ
    const leftDown = Phaser.Input.Keyboard.JustDown(this.keyLeft);
    const rightDown = Phaser.Input.Keyboard.JustDown(this.keyRight);
    const upHeld = this.keyUp.isDown;

    // バーチャルコントローラー
    if (this.vpad.isLeftTap) this.wantLeft = true;
    if (this.vpad.isRightTap) this.wantRight = true;
    if (this.vpad.isUpHold !== this.wantUp) this.wantUp = this.vpad.isUpHold;

    //< 上より、左右の方が優先度が高い
    const anyLeftRight = leftDown || rightDown || this.wantLeft || this.wantRight;

    //< 上キーが左右キーに負けたら、一度離さないとダメ
    if (this.upReset && (upHeld || this.wantUp) == false) this.upReset = false;

    //< 移動可能かチェック
    if (anyLeftRight) {
      //< 左右キーが入ったらダメ
      this.allowScroll = false;
      this.upReset = true;
    } else {
      //< リセット済みならOK
      this.allowScroll = (upHeld || this.wantUp) && this.upReset == false;
    }

    // 左右（1ステップ）
    if (!this.allowScroll) {
      if (leftDown || this.wantLeft) this.player.stepLane(-1);
      if (rightDown || this.wantRight) this.player.stepLane(+1);
    }

    // フレームフラグリセット
    this.vpad.resetFrameFlags();
    this.wantLeft = this.wantRight = false;
  }

  private currentAreaByTime(): 0 | 1 | 2 | 3 {
    const t = this.elapsedMoveSec;
    if (t < this.cfg.Area1Sec) return 0;
    if (t < this.cfg.Area2Sec) return 1;
    if (t < this.cfg.Area3Sec) return 2;
    if (t < this.cfg.goalSec) return 3;
    return 3;
  }

  update(time: number, deltaMs: number) {
    if (!this.cfg) return;

    // --- Debug: 即死（Esc または Shift+K） ---
    if (this.debugEnabled && !this.gameEnd) {
      const escPressed = Phaser.Input.Keyboard.JustDown(this.keyEsc);
      const shiftK = this.keyShift.isDown && Phaser.Input.Keyboard.JustDown(this.keyK);
      if (escPressed || shiftK) {
        this.player.hp = 0;
        this.hud.setHP(0);
        return;
      }
    }

    //< ゲーム開始判定
    if(this.gameStart == false) return;

    // 入力
    this.handleInput();
    // スタン中は入力無効
    if (this.player.isStunned(time)) {
      this.allowScroll = false;
    }
    //< Playerに通知
    this.player.setAllowScrollSource(this.allowScroll);
    
    // 進行時間を加算
    const dSec = deltaMs / 1000;
    if(this.gameEnd == false) this.gameSec += dSec;

    //< ↑押下中のみスクロール
    if (this.allowScroll) {
      this.elapsedMoveSec += dSec;
      // キャラの画像サイズに比例して速度を上げられるようにする
      const pxPerSec = this.player.displayHeight;
      const dy = pxPerSec * dSec;
      // 背景スクロール
      this.bg.scroll(dy);
      // シーン内の敵/アイテムも下へ"迫る"感（背景演出で対応）
    }

    // エリア
    const area = this.currentAreaByTime();
    this.bg.setArea(area);

    // スポーン
    const pxPerSec = (SCREEN.HEIGHT / this.cfg.SecPerScreen);
    if(this.gameEnd == false) this.spawner.update(this.time.now, pxPerSec, area);

    // アイテム移動・画面外除去
    this.children.each((g: any) => {
      if (!(g instanceof Item)) return;
      const it = g as Item;
      // 基本移動
      it.x += it.vx * dSec;
      it.y += it.vy * dSec + (this.allowScroll ? pxPerSec * dSec * 0.5 : 0);
      if (it.dataRow.Move === 3) {
        // 蛇行
        it.snakePhase += ITEM.SNAKE_OMEGA * dSec;
        it.x += Math.sin(it.snakePhase) * (ITEM.SNAKE_AMPLITUDE * dSec);
      }
      // 画面外で削除
      if (it.x < -200 || it.x > SCREEN.WIDTH + 200 || it.y > SCREEN.HEIGHT + 200) it.destroy();
    });

    // === 衝突検出 ===
    const hits: Item[] = [];
    const pRect = this.player.aabb();
    this.children.each((g: any) => {
      if (!(g instanceof Item)) return;
      const it = g as Item;
      const iRect = it.aabb();
      if (Phaser.Geom.Intersects.RectangleToRectangle(pRect, iRect)) hits.push(it);
    });

    // 効果適用（優先度：無敵 → 回復 → ダメージ → スコア）
    if (hits.length && !this.gameEnd) {
      const now = this.time.now;
      // 無敵
      hits.filter(h => h.dataRow.Effect === 2).forEach(h => {
        const v = Math.max(0, h.dataRow.Value);
        this.player.setInv(now, v);
        h.destroy();
      });
      // 回復
      hits.filter(h => h.dataRow.Effect === 1).forEach(h => {
        const v = Math.max(0, h.dataRow.Value);
        this.player.heal(v);
        h.destroy();
      });
      // ダメージ（無敵中は無効）
      hits.filter(h => h.dataRow.Effect === 0).forEach(h => {
        if (!this.player.isInvincible(now)) {
          const v = Math.max(0, h.dataRow.Value);
          this.player.damage(now, v, this.cfg.OnHitStunSeconds, this.cfg.OnHitInvincibleSeconds);
        }
        h.destroy();
      });
      // スコア（減点あり、0未満にならない）
      hits.filter(h => h.dataRow.Effect === 3).forEach(h => {
        this.score = Math.max(0, this.score + h.dataRow.Value);
        h.destroy();
      });
      // HUD更新
      this.hud.setHP(this.player.hp);
      this.hud.setScore(this.score);
    }
    else if(hits.length && this.gameEnd)
    { //< GameEnd中は効果なしで消滅 
      hits.forEach(h => {
        h.destroy();
      });
    }

    // 残り時間
    const remaining = Math.max(0, this.cfg.StartTimeSeconds - this.gameSec);
    this.hud.setTime(remaining);

    // クリア or HP 0（多重遷移ガードを追加）
    if (!this.cleared && !this.gameEnd && this.elapsedMoveSec >= this.cfg.goalSec) {
      this.gameEnd = true;
      this.cleared = true;
      // クリアボーナス：残り秒×100（確定時に一度だけ）
      if (!this.bonusApplied) {
        this.score = Math.min(SCORE.MAX, this.score + Math.floor(remaining * 100));
        this.bonusApplied = true;
      }
      
      //< BGM止めて、クリアSE再生し、Resultへ
      console.log("clear");
      this.bgm?.stop();
      const se = this.sound.add("success", { volume: SE_VOLUME, detune: Phaser.Math.Between(-50, 50) });
      se.once('complete', () => {
        // SE の破棄（任意）
        se.destroy();

        // 再生終了後に遷移
        this.time.delayedCall(300, () => { if (!this.exiting) this.toResult(true); });
      });

      se.play();
    }

    if (this.player.hp <= 0 && !this.gameEnd) {
      //< BGM止めて、クリアSE再生し、Resultへ
      console.log("gameover");
      this.gameEnd = true;
      this.bgm?.stop();
      const se = this.sound.add("gameover", { volume: SE_VOLUME, detune: Phaser.Math.Between(-50, 50) });
      se.once('complete', () => {
        // SE の破棄（任意）
        se.destroy();

        // 再生終了後に遷移
        this.time.delayedCall(300, () => { if (!this.exiting) this.toResult(false); });
      });
      se.play();
    }
  }

  private toResult(cleared: boolean) {
    this.scene.start(SCENES.RESULT, {
      score: this.score,
      cleared,
    });
  }
}
