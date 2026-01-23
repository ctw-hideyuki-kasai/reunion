
export type PlayerCSV = {
  HP: number;
  SizeX: number;
  SizeY: number;
  StartTimeSeconds: number;
  OnHitStunSeconds: number;
  OnHitInvincibleSeconds: number;
  SecPerScreen: number;
  Area1Sec: number;
  Area2Sec: number;
  goalSec: number;
};

export type ItemCSV = {
  Id: number;     // 画像は /images/items/item<Id(3桁)>.png
  Name: string;
  Effect: 0 | 1 | 2 | 3; // 0=ダメージ,1=回復,2=無敵,3=スコア
  Value: number;  // 無敵=秒数/スコア=加点。HP系が負なら0に丸め
  Speed: number;  // 倍率
  Area: 0 | 1 | 2 | 3;
  Weight: number; // 確率比。0以下は抽選除外
  SizeX: number;
  SizeY: number;
  Move: 0 | 1 | 2 | 3;   // 0落下,1右→左,2左→右,3蛇行
};

export type RankingEntry = { name: string; score: number; scoreAt: number; };

export type CSVRow = Record<string, string>;
