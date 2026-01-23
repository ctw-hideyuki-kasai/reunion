
import { RANK, SCORE } from '../constants';
import type { RankingEntry } from '../types';
import { errorOverlay } from './errors';

/** name 正規化：string→trim、その他は空文字 */
function normalizeName(n: unknown): string {
  return typeof n === 'string' ? n.trim() : '';
}

/**
 * localStorage を安全に読み込む
 * - JSON 破損や型不正は除外
 * - name は trim → RANK.NAME_REGEX で検証
 * - score は 0..SCORE.MAX に clamp、scoreAt は整数化
 */
function safeLoad(): RankingEntry[] {
  try {
    const raw = localStorage.getItem(RANK.STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];

    const valid = arr
      .map((x: any) => {
        const name = normalizeName(x?.name);
        const score = Number(x?.score);
        const scoreAt = Number(x?.scoreAt);
        return {
          ok:
            !!name &&
            RANK.NAME_REGEX.test(name) &&
            Number.isFinite(score) &&
            Number.isFinite(scoreAt),
          name,
          score,
          scoreAt,
        };
      })
      .filter(x => x.ok)
      .map<RankingEntry>(x => ({
        name: x.name,
        score: clampScore(x.score),
        scoreAt: Math.trunc(x.scoreAt),
      }));

    return valid;
  } catch {
    errorOverlay.warn('ランキングの読み込みに失敗（初期化）');
    localStorage.removeItem(RANK.STORAGE_KEY);
    return [];
  }
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(SCORE.MAX, Math.trunc(n)));
}

/** 並び順：score desc → scoreAt desc（同点は新しい方が先） */
function sortRank(a: RankingEntry, b: RankingEntry): number {
  if (b.score !== a.score) return b.score - a.score; // score desc
  return b.scoreAt - a.scoreAt;                       // scoreAt desc（新しい方が先）
}

/** 表示用：TopN（MAX_ENTRIES）だけ返す */
export function getRankings(): RankingEntry[] {
  return safeLoad().sort(sortRank).slice(0, RANK.MAX_ENTRIES);
}

/** 表示用：同点は同順位、次は下がる（1,1,1,4…）の順位付与 */
export function getRankingsWithRanks(): { rank: number; entry: RankingEntry }[] {
  const list = getRankings();
  let rank = 0;
  let prevScore: number | null = null;

  return list.map((e, idx) => {
    const displayIndex = idx + 1;   // 1始まりの表示インデックス
    if (prevScore === null || e.score !== prevScore) {
      rank = displayIndex;          // スコアが変わったら現在位置が順位
      prevScore = e.score;
    }
    return { rank, entry: e };
  });
}

/** ランクイン判定（満杯時は10位の score より大きいときのみ）（※必要なら拡張可） */
export function isRankIn(score: number): boolean {
  const list = getRankings();
  if (list.length < RANK.MAX_ENTRIES) return true;
  const tenth = list[RANK.MAX_ENTRIES - 1];
  return score > tenth.score; // 同点は不可（先着/新着は不採用）※要件に応じて拡張可
}

/** upsert：キー scoreAt（1プレイ一意）→ ソート → TopN に切詰め → 保存 */
export function upsertRanking(e: RankingEntry): void {
  const name = normalizeName(e.name);
  if (!name || !RANK.NAME_REGEX.test(name)) {
    errorOverlay.warn('不正な名前のためランキングへ保存しませんでした');
    return;
  }
  const list = safeLoad();
  const idx = list.findIndex(x => x.scoreAt === e.scoreAt);
  if (idx >= 0) list[idx] = { ...e, name }; else list.push({ ...e, name });
  list.sort(sortRank);
  const trimmed = list.slice(0, RANK.MAX_ENTRIES);
  localStorage.setItem(RANK.STORAGE_KEY, JSON.stringify(trimmed));
}
