
import { errorOverlay } from './errors';

// CSVパーサ（カンマ固定／UTF-8／BOM可／ダブルクオート対応／#行スキップ）
export function parseCsvToRows(text: string): string[][] {
  // BOM除去
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  // ✅ 改行正規化（CRLF / CR → LF）
  // ここが壊れていると「Unterminated regular expression」になります
  const normalized = text.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');

  const rows: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || raw.trim() === '' || raw.trimStart().startsWith('#')) continue;

    const out: string[] = [];
    let cur = '';
    let inQ = false;

    for (let p = 0; p < raw.length; p++) {
      const ch = raw[p];
      if (inQ) {
        if (ch === '"') {
          if (raw[p + 1] === '"') {
            cur += '"'; p++;
          } else {
            inQ = false;
          }
        } else {
          cur += ch;
        }
      } else {
        if (ch === ',') {
          out.push(cur);
          cur = '';
        } else if (ch === '"') {
          inQ = true;
        } else {
          cur += ch;
        }
      }
    }
    out.push(cur);
    rows.push(out);
  }
  return rows;
}

export function rowsToObjects(rows: string[][]): { header: string[]; objects: Record<string, string>[] } {
  if (rows.length === 0) throw new Error('CSVが空です');
  const header = rows[0].map(h => h.trim());
  const objects: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length !== header.length) {
      errorOverlay.warn(`CSV列数不一致: 行${i + 1} は ${row.length} 列、ヘッダは ${header.length} 列`);
      continue; // 無効化
    }
    const obj: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = row[c]?.trim() ?? '';
    }
    objects.push(obj);
  }
  return { header, objects };
}

export function requireNumber(v: string, name: string, rowIndex: number, allowFloat = false): number | null {
  if (v === '' || v == null) { errorOverlay.warn(`${name}: 行${rowIndex} 値が空`); return null; }
  const n = Number(v);
  if (!Number.isFinite(n)) { errorOverlay.warn(`${name}: 行${rowIndex} 数値でない: "${v}"`); return null; }
  if (!allowFloat && !Number.isInteger(n)) { errorOverlay.warn(`${name}: 行${rowIndex} 整数でない: "${v}"`); return null; }
  return n;
}
