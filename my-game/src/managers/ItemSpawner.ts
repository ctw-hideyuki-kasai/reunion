
import Phaser from 'phaser';
import { Item } from '../objects/Item';
import type { ItemCSV } from '../types';
import { ITEM, SCREEN, BOTTOM_UI_RATIO } from '../constants';

export class ItemSpawner {
  scene: Phaser.Scene;
  pool: ItemCSV[] = [];
  lastSpawnAt = 0;
  nextInterval = 1.0;
  lanesX: number[] = [];
  centerY = (SCREEN.HEIGHT * (1 - 0.2)) / 2;

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  setLanes(lanesX: number[]) { this.lanesX = lanesX; }
  setCenterY(y: number) { this.centerY = y; }

  setPool(pool: ItemCSV[]) { this.pool = pool; }
  scheduleNext() {
    this.nextInterval = Phaser.Math.FloatBetween(ITEM.SPAWN_INTERVAL_MIN, ITEM.SPAWN_INTERVAL_MAX) * 1000;
    this.lastSpawnAt = this.scene.time.now;
  }

  update(now: number, scrollSpeedPxPerSec: number, area: number) {
    if (now - this.lastSpawnAt >= this.nextInterval) {
      // 現在Areaに一致＆Weight>0のみ
      const cand = this.pool.filter(r => r.Area === area && r.Weight > 0);
      if (cand.length > 0) {
        const chosen = this.weightedPick(cand);
        this.spawnOne(chosen, scrollSpeedPxPerSec);
      }
      this.scheduleNext();
    }
  }

  private weightedPick(list: ItemCSV[]): ItemCSV {
    const sum = list.reduce((a, b) => a + Math.max(0, b.Weight), 0);
    let r = Phaser.Math.FloatBetween(0, sum);
    for (const it of list) {
      const w = Math.max(0, it.Weight);
      if (r <= w) return it;
      r -= w;
    }
    return list[0];
  }

  private itemTex(row: ItemCSV) {
    const id3 = String(row.Id).padStart(3, '0');
    return `item-${id3}`;
  }

  //< ランダムでレーン(縦軸)を選ぶ
  private pickVerticalX(size: number) {
    const slots = this.lanesX;
    const seven: number[] = [
      slots[0],
      (slots[0] + slots[1]) / 2,
      slots[1],
      (slots[1] + slots[2]) / 2,
      slots[2],
      (slots[2] + slots[3]) / 2,
      slots[3],
    ];
    const choices = size <= 512 ? [0, 2, 4, 6] : [1, 3, 5];
    const idx = Phaser.Math.RND.pick(choices);
    return seven[idx];
  }

  //< ランダムで横軸を選ぶ
  private pickHorizontalY(_size: number) {
    const playTop = SCREEN.HEIGHT * BOTTOM_UI_RATIO * 0.5;
    const y0 = playTop;
    /*const y1 = y0 + 256;
    const y2 = y1 + 256;
    const y3 = y2 + 256; TODO 縦ランダム生成*/
    return Phaser.Math.RND.pick([y0]);
  }

  private spawnOne(row: ItemCSV, _scrollSpeedPxPerSec: number) {
    const tex = this.itemTex(row);
    let x = 0, y = 0, vx = 0, vy = 0;
    
    if (row.Move === 0 || row.Move === 2) {
      // 落下/蛇行：X=縦抽選、Y=上端外（-Size）
      x = this.pickVerticalX(row.SizeX);
      y = -row.SizeY;
      vy = ITEM.BASE_FALL_SPEED * (row.Speed ?? 1);
    } else if (row.Move === 1 && Math.random() < 0.5) { // 50% の確率で
      // 右→左：Y=横抽選、X=右外
      x = SCREEN.WIDTH + row.SizeX;
      y = this.pickHorizontalY(row.SizeY);
      vx = -ITEM.BASE_FALL_SPEED * (row.Speed ?? 1);
    } else {
      // 左→右
      x = -row.SizeX;
      y = this.pickHorizontalY(row.SizeY);
      vx = ITEM.BASE_FALL_SPEED * (row.Speed ?? 1);
    }

    const it = new Item(this.scene, x, y, tex);
    it.initFrom(row, row.SizeX, row.SizeY);
    this.scene.add.existing(it);

    // 速度を格納
    it.vx = vx;
    it.vy = vy;
    it.snakePhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // 生成時の重なり回避（軽く）
    for (let k = 0; k < ITEM.REPOSITION_RETRY; k++) {
      const overlapped = this.scene.children.getChildren().some(ch => {
        if (ch === it || !(ch as any).aabb) return false;
        const r1 = it.aabb(); const r2 = (ch as any).aabb();
        return Phaser.Geom.Intersects.RectangleToRectangle(r1, r2);
      });
      if (!overlapped) break;
      // 再抽選（Move毎のロジックで小さくズラす）
      if (row.Move === 0 || row.Move === 3) {
        it.x = this.pickVerticalX(row.SizeX);
      } else {
        it.y = this.pickHorizontalY(row.SizeY);
      }
    }
  }
}
