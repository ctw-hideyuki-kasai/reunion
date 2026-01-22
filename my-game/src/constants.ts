
// 画面・レイアウト・各種定数（仕様準拠）
export const SCREEN = { WIDTH: 1080, HEIGHT: 1920 };
export const BOTTOM_UI_RATIO = 0.2; // 画面下20%
export const PLAY_TOP = 0;
export const PLAY_BOTTOM = SCREEN.HEIGHT * (1 - BOTTOM_UI_RATIO);
export const PLAYR_ANIM_MAX = 200;
export const BGM_VOLUME = 0.5;
export const SE_VOLUME = 0.5;
export const BGM_DELAYED_TIME = 500;

// 入力
export const INPUT = {
  STUN_BLOCK: true, // 被弾直後はスタンで入力無効
};

// アイテム
export const ITEM = {
  BASE_FALL_SPEED: 300, // px/s（Move=0/3の基本速度）。実速度は × Speed
  SPAWN_INTERVAL_MIN: 0.8, // 秒
  SPAWN_INTERVAL_MAX: 1.8, // 秒
  SNAKE_AMPLITUDE: 80, // 蛇行の振幅（px）
  SNAKE_OMEGA: 2.6,    // 蛇行の角速度（rad/s）
  REPOSITION_RETRY: 6, // 生成時の重なり回避の最大再抽選回数
};

// ゲーム制御
export const GAME = {
  LANE_COUNT: 4,
  TITLE_BG: null, // ファイルが存在しないためnullに設定
  TITLE_TRY: null, // ファイルが存在しないためnullに設定
  // 背景（例：存在しなくても続行、警告は出す）
  BG_TILE_KEYS: [
    './images/backGround/BG_Build_Loop0.png', // Area=0 地面
    './images/backGround/BG_Build_Loop1.png', // Area=1 空
    './images/backGround/BG_Build_Loop2.png', // Area=2 宇宙
    './images/backGround/BG_Build_Loop3.png', // Area=3 ゴール
  ],
  // UI画像
  UI: {
    HP: './images/ui/HP.png',
    SCORE_NUMBERS_DIR: './images/ui/score/', // Score_Number0.png ... 9
    TIME_NUMBERS_DIR: './images/ui/time/',   // Time_Number0.png ... 9
    TIME_COLON: './images/ui/time/Time_Numbercolon.png',
    MARGIN_TOP: 24,
    MARGIN_LEFT: 24,
    MARGIN_RIGHT: 24,
    ICON_PAD: 12,
  },
  PLAYER: {
    SPRITE_01: './images/player/Ladder01.png',
    SPRITE_02: './images/player/Ladder02.png',
  },
  DATA: {
    PLAYER: './datas/player.csv',
    ITEM: './datas/item.csv',
  },
};

// ランキング
export const RANK = {
  STORAGE_KEY: 'rankings',
  STORAGE_VERSION_KEY: 'rankings_v',
  MAX_ENTRIES: 10,
  NAME_REGEX: /^[ -~]{1,10}$/,

};

// スコア
export const SCORE = {
  MAX: 99_999_999,
};

// ゲームシーンキー
export const SCENES = {
  BOOT: 'Boot',
  TITLE: 'Title',
  GAME: 'Game',
  RESULT: 'Result',
};
