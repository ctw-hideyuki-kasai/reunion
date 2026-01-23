
import Phaser from 'phaser';
import { GAME, RANK, SCENES, SCREEN } from '../constants';
import { getRankingsWithRanks } from '../utils/ranking';

export class TitleScene extends Phaser.Scene {
  constructor() { super(SCENES.TITLE); }

  create() {
    // === 背景（未配置時は矩形フォールバック） ===
    if (this.textures.exists(GAME.TITLE_BG)) {
      const bg = this.add.image(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2, GAME.TITLE_BG).setOrigin(0.5);
      bg.setDisplaySize(SCREEN.WIDTH, SCREEN.HEIGHT);
    } else {
      this.add
        .rectangle(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2, SCREEN.WIDTH, SCREEN.HEIGHT, 0x101820)
        .setOrigin(0.5)
        .setScrollFactor(0);
    }

    // === TRY ボタン（未配置時は矩形ボタン） ===
    const btn = this.textures.exists(GAME.TITLE_TRY)
      ? this.add.image(SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.8, GAME.TITLE_TRY).setOrigin(0.5)
      : this.add
          .rectangle(SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.8, 260, 96, 0x00aa00)
          .setOrigin(0.5)
          .setStrokeStyle(4, 0x006600);

    btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.scene.start(SCENES.GAME);
    });

    // === ランキング TOP10（同点は同順位、次は下がる） ===
    const listWithRank = getRankingsWithRanks(); // [{ rank, entry }, ...]
    const baseY = SCREEN.HEIGHT * 0.2;

    this.add
      .text(SCREEN.WIDTH / 2, baseY - 40, 'TOP 10', { color: '#fff', fontSize: '36px' })
      .setOrigin(0.5);

    for (let i = 0; i < Math.min(listWithRank.length, RANK.MAX_ENTRIES); i++) {
      const { rank, entry } = listWithRank[i] ?? {};
      // セーフティ（欠損しても落ちない）
      const name = (entry?.name ?? '').toString().padEnd(10, ' ');
      const scoreText = Number.isFinite(entry?.score) ? entry!.score!.toLocaleString() : '0';

      const y = baseY + i * 34;
      const label = `${String(rank ?? i + 1).padStart(2, '0')}. ${name}  ${scoreText}`;

      this.add
        .text(SCREEN.WIDTH / 2, y, label, { color: '#fff', fontSize: '24px', fontFamily: 'monospace' })
        .setOrigin(0.5);
    }
  }
}
