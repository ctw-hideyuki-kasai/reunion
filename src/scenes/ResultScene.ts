
import Phaser from 'phaser';
import { RANK, SCENES, SCREEN } from '../constants';
import { getRankingsWithRanks, isRankIn, upsertRanking } from '../utils/ranking';

type DataIn = { score: number; cleared: boolean; };

export class ResultScene extends Phaser.Scene {
  score = 0;
  cleared = false;

  nameBuf = 'YODO';
  entering = false;
  canRankIn = false;
  scoreAt = Date.now();

  // 二重送信/二重遷移ガード
  private submitted = false;
  private onKeyDownRef?: (ev: KeyboardEvent) => void;
  private exiting = false; // タイトルへ戻る多重防止

  constructor() { super(SCENES.RESULT); }

  init(data: DataIn) {
    // ★ 毎プレイごとにリセット（2週目も初期値に戻る）
    this.score = data.score ?? 0;
    this.cleared = !!data.cleared;
    this.canRankIn = isRankIn(this.score);
    this.scoreAt = Date.now();

    this.nameBuf = 'YODO';
    this.entering = false;
    this.submitted = false;
    this.exiting = false;
  }

  create() {
    const title = this.add
      .text(SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.2, 'GAME OVER', { color: '#ff4444', fontSize: '64px' })
      .setOrigin(0.5);

    this.add
      .text(SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.3, `SCORE: ${this.score.toLocaleString()}`, {
        color: '#ffffff',
        fontSize: '36px',
      })
      .setOrigin(0.5);

    if (this.canRankIn) {
      // ===== Rank-In（名前入力あり）=====
      this.entering = true;
      this.add
        .text(SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.42, '!RANK IN!', { color: '#ffff44', fontSize: '46px' })
        .setOrigin(0.5);

      // ガイダンス：半角ASCII 1–10
      this.add
        .text(SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.5, 'NAME (半角ASCII 1-10):', {
          color: '#ffffff',
          fontSize: '24px',
        })
        .setOrigin(0.5);

      const nameText = this.add
        .text(SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.56, this.nameBuf, { color: '#ffffff', fontSize: '36px' })
        .setOrigin(0.5);

      // Enter 1回で確定 → タイトルへ
      this.onKeyDownRef = (ev: KeyboardEvent) => {
        if (!this.entering || this.submitted) return;

        if (ev.key === 'Enter') {
          this.submitted = true;
          this.commitName(); // 中で Title へ遷移
          this.input.keyboard!.off('keydown', this.onKeyDownRef!);
          return;
        }

        if (ev.key === 'Backspace') {
          this.nameBuf = this.nameBuf.slice(0, -1);
        } else {
          const ch = ev.key;
          // 1文字かつ ASCII 可視文字（半角スペース含む）
          if (ch.length === 1 && /[ -~]/.test(ch) && this.nameBuf.length < 10) {
            this.nameBuf += ch; // 入力そのまま（小文字・記号OK）
          }
        }
        nameText.setText(this.nameBuf || ' ');
      };
      this.input.keyboard!.on('keydown', this.onKeyDownRef);

      this.add
        .text(SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.62, 'Press [Enter] to submit', {
          color: '#aaa',
          fontSize: '20px',
        })
        .setOrigin(0.5);
    } else {
      // ===== 非ランクイン（低スコア）：何を押してもタイトルへ =====
      const goTitle = () => {
        if (this.exiting) return;
        this.exiting = true;
        this.scene.start(SCENES.TITLE);
      };

      // 「GAME OVER」をボタン化
      title.setInteractive({ useHandCursor: true }).on('pointerdown', goTitle);

      // 画面全体クリック/タップ、任意キーでタイトルへ（1回限り）
      this.input.once('pointerdown', goTitle);
      this.input.keyboard?.once('keydown', goTitle);

      this.add
        .text(SCREEN.WIDTH / 2, SCREEN.HEIGHT * 0.42, 'Tap / Click / Press Any Key to return to Title', {
          color: '#ccc',
          fontSize: '22px',
        })
        .setOrigin(0.5);
    }

    // === TOP10 表示（同点は同順位、次は下がる） ===
    const listWithRank = getRankingsWithRanks();
    const baseY = SCREEN.HEIGHT * 0.7;

    this.add
      .text(SCREEN.WIDTH / 2, baseY - 40, 'TOP 10', { color: '#fff', fontSize: '36px' })
      .setOrigin(0.5);

    for (let i = 0; i < Math.min(listWithRank.length, 10); i++) {
      const { rank, entry } = listWithRank[i] ?? {};
      const name = (entry?.name ?? '').toString().padEnd(10, ' ');
      const scoreText = Number.isFinite(entry?.score) ? entry!.score!.toLocaleString() : '0';
      const row = `${String(rank ?? i + 1).padStart(2, '0')}. ${name}  ${scoreText}`;
      const y = baseY + i * 28;

      this.add
        .text(SCREEN.WIDTH / 2, y, row, { color: '#fff', fontSize: '22px', fontFamily: 'monospace' })
        .setOrigin(0.5);
    }

    // シーン破棄時に入力リスナーを確実に解除
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.onKeyDownRef) this.input.keyboard!.off('keydown', this.onKeyDownRef);
    });
  }

  private commitName() {
    const name = (this.nameBuf || 'YODO').trim(); // 前後空白は除去
    if (!RANK.NAME_REGEX.test(name)) return;      // 半角 1～10 のみOK（constants に追従）
    upsertRanking({ name, score: this.score, scoreAt: this.scoreAt });
    this.entering = false;
    this.scene.start(SCENES.TITLE);
  }
}
